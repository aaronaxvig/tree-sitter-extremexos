"""Generate a standalone Tree-sitter grammar from an EXOS CLI XML file."""

import argparse
from collections import defaultdict
from dataclasses import dataclass
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET


SYNTAX_TAGS = {"key", "arg", "open", "close"}
METADATA_TAGS = {"name", "help", "action", "capability", "flags"}
GROUP_NAME = re.compile(r"([\[{])([^\s]+) ([OC])(\d+)([\]}])")
SIGNED_TYPES = {"int", "int8_t", "int16_t", "int32_t", "int64_t"}
UNSIGNED_TYPES = {"uint8_t", "uint16_t", "uint32_t", "uint64_t"}


@dataclass(frozen=True)
class Token:
    name: str
    operand_type: str | None = None

    @classmethod
    def operand(cls, node):
        name = node.findtext("name", "")
        if not (name.startswith("<") and name.endswith(">") and identifier(name)):
            raise ValueError(f"Unsupported operand name {name!r}")
        return cls(name[1:-1], node.get("type", ""))

    def rule(self, static_types):
        if self.operand_type is None:
            return json.dumps(self.name)
        if self.operand_type in static_types:
            values = [json.dumps(value) for value in static_types[self.operand_type]]
            operand = values[0] if len(values) == 1 else f"choice({', '.join(values)})"
        elif self.operand_type in SIGNED_TYPES:
            operand = "$.integer"
        elif self.operand_type in UNSIGNED_TYPES:
            operand = "$.unsigned_integer"
        else:
            operand = "$.word_or_string"
        return f"field({json.dumps(identifier(self.name))}, {operand})"


def identifier(text):
    return re.sub(r"[^a-zA-Z0-9_]+", "_", text).strip("_").lower()


def group_id(node):
    name = node.findtext("name", "")
    match = GROUP_NAME.fullmatch(name)
    if match is None:
        raise ValueError(f"Unsupported group marker {name!r}")
    start, module, marker, number, end = match.groups()
    if end != {"[": "]", "{": "}"}[start] or marker != node.tag[0].upper():
        raise ValueError(f"Mismatched group marker {name!r}")
    return start, module, number


def command_paths(tree):
    """Follow terminal actions without reading the action implementation table."""
    paths = set()
    closers = {}
    # Split alternatives repeat the opener ID but share one continuation.
    for node in tree.iter("close"):
        marker = group_id(node)
        if marker in closers:
            raise ValueError(f"Duplicate group closer {node.findtext('name')!r}")
        closers[marker] = node

    def walk(node, path=(), groups=()):
        name = node.findtext("name", "")
        if node.tag == "key":
            if not re.fullmatch(r"[^\s\"'#]+", name):
                raise ValueError(f"Unsupported keyword {name!r}")
            path += (Token(name),)
        elif node.tag == "arg":
            path += (Token.operand(node),)
        elif node.tag == "close":
            if not groups or node is not groups[-1]:
                raise ValueError(f"Unexpected group closer {name!r}")
            groups = groups[:-1]

        unknown = {child.tag for child in node} - SYNTAX_TAGS - METADATA_TAGS
        if unknown:
            raise ValueError(f"Unsupported command tree elements: {', '.join(sorted(unknown))}")
        branches = [child for child in node if child.tag in SYNTAX_TAGS]
        actions = node.findall("action")
        opener = node.tag == "open"
        if opener:
            if actions:
                raise ValueError(f"Action directly on opener {name!r}")
            marker = group_id(node)
            closer = closers.get(marker)
            if closer is None:
                raise ValueError(f"No matching closer for {name!r}")
            if closer in groups:
                raise ValueError(f"Group {name!r} reopens before its closer")
            groups += (closer,)
            branches = [child for child in branches if child is not closer]
            if marker[0] == "{":
                walk(closer, path, groups)
            if not branches and marker[0] == "[":
                raise ValueError(f"Empty required group {name!r}")
            if not branches:
                return

        if actions:
            paths.add(path)

        # The CLI can attach a shared operand and its following keywords to
        # the same node. A nested operand already carries its own continuation.
        operands = [child for child in branches if child.tag == "arg"]
        if operands and len(branches) > 1:
            if len(operands) != 1 or any(child.tag in SYNTAX_TAGS | {"action"} for child in operands[0]):
                raise ValueError(f"Ambiguous sibling operands after {name!r}")
            operand = operands[0]
            path += (Token.operand(operand),)
            branches.remove(operand)

        for child in branches:
            walk(child, path, groups)
        if not branches and not actions:
            if not groups:
                raise ValueError(f"Command branch {name!r} has no terminal action")
            walk(groups[-1], path, groups)

    walk(tree)
    if not paths or () in paths:
        raise ValueError("The command tree must define at least one nonempty command")
    return paths


def static_choices(root):
    choices = {}
    for declaration in root.findall("./custom_type/type[@type='static']"):
        name = declaration.get("name")
        values = [entry.get("name", "") for entry in declaration.findall("entry")]
        if not name or name in choices or not values:
            raise ValueError(f"Invalid static type {name!r}")
        if declaration.get("quote") != "0" or any(
            not re.fullmatch(r"[^\s\"'#]+", value) for value in values
        ):
            raise ValueError(f"Unsupported static type {name!r}")
        choices[name] = list(dict.fromkeys(values))
    return choices


def generate(source):
    data = source.read_text(encoding="utf-8-sig")
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)\b", data, re.IGNORECASE):
        raise ValueError("DTD and entity declarations are unsupported")
    root = ET.fromstring(data)
    trees = root.findall("cmd_tree")
    if root.tag != "cmd_def" or len(trees) != 1 or trees[0].get("name") != "extreme":
        raise ValueError("Expected one ExtremeXOS <cmd_tree name=\"extreme\">")

    static_types = static_choices(root)
    commands = defaultdict(set)
    for path in command_paths(trees[0]):
        name = "command_" + "_".join(identifier(token.name) for token in path if token.operand_type is None)
        sequence = [token.rule(static_types) for token in path]
        commands[name].add(f"seq({', $._space, '.join(sequence)}, optional($._space))")
    rules = []
    for name, sequences in sorted(commands.items()):
        pattern = next(iter(sequences)) if len(sequences) == 1 else f"choice({', '.join(sorted(sequences))})"
        rules.append(f"    {name}: $ => {pattern},")

    references = [f"$.{name}" for name in sorted(commands)]
    command = "choice(\n      " + ",\n      ".join(references) + ",\n    )" if len(commands) > 1 else references[0]
    command_rules = "\n".join(rules)
    return rf"""module.exports = grammar({{
  name: "exos_{identifier(source.stem)}",
  extras: _ => [],
  rules: {{
    source_file: $ => seq(
      repeat(choice($._newline, seq($._line, $._newline))),
      optional(choice($._line, $._space)),
    ),
    _line: $ => seq(optional($._space), choice($.command, $.comment)),
    command: $ => {command},
{command_rules}
    _space: _ => /[ \t]+/,
    _newline: _ => /[ \t]*\r?\n/,
    comment: _ => /#[^\r\n]*/,
    word_or_string: $ => choice($.word, $.string),
    word: _ => /[^\s"'#]+/,
    string: _ => /"([^"\\\r\n]|\\.)*"/,
    integer: _ => /-?[0-9]+/,
    unsigned_integer: _ => /[0-9]+/,
  }},
}});
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("xml", type=Path, help="One XML file from config/clidef/")
    options = parser.parse_args()
    try:
        print(generate(options.xml), end="")
    except (OSError, ET.ParseError, ValueError) as error:
        parser.exit(1, f"{options.xml}: {error}\n")


if __name__ == "__main__":
    main()
