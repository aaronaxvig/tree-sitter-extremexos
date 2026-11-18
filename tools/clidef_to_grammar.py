"""Generate a standalone Tree-sitter grammar from an EXOS CLI XML file."""

import argparse
from collections import defaultdict
from dataclasses import dataclass
from functools import cache
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

    def pattern(self, static_types):
        if self.operand_type is None:
            return json.dumps(self.name)
        if self.operand_type in static_types:
            values = [json.dumps(value) for value in static_types[self.operand_type]]
            return values[0] if len(values) == 1 else f"choice({', '.join(values)})"
        if self.operand_type in SIGNED_TYPES:
            return "$.integer"
        if self.operand_type in UNSIGNED_TYPES:
            return "$.unsigned_integer"
        return "$.word_or_string"

    def rule(self, static_types):
        operand = self.pattern(static_types)
        if self.operand_type is None:
            return operand
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
    return start, (module, number)


def has_continuation(node):
    return any(child.tag in SYNTAX_TAGS | {"action"} for child in node)


@dataclass(frozen=True, eq=False)
class State:
    can_end: bool
    transitions: tuple[tuple[Token, "State"], ...] = ()


END = State(True)
DEAD_END = State(False)


def command_graph(tree, *, verbs=None, omitted_flags=()):
    """Build shared continuations from the CLI tree and its group markers."""
    closers = {}
    parents = {child: node for node in tree.iter() for child in node}
    # Split alternatives repeat the opener ID but share one continuation.
    for node in tree.iter("close"):
        _, marker = group_id(node)
        if marker in closers:
            raise ValueError(f"Duplicate group closer {node.findtext('name')!r}")
        closers[marker] = node

    @cache
    def merge(states):
        if not states:
            return DEAD_END
        if len(states) == 1:
            return states[0]
        edges = defaultdict(list)
        for state in states:
            for token, target in state.transitions:
                edges[token].append(target)
        return State(
            any(state.can_end for state in states),
            tuple((token, combine(targets)) for token, targets in edges.items()),
        )

    def combine(states):
        return merge(tuple(dict.fromkeys(state for state in states if state is not DEAD_END)))

    @cache
    def walk(node, groups=()):
        name = node.findtext("name", "")
        if any(flag.text in omitted_flags for flag in node.findall("flags")):
            return DEAD_END
        prefix = []
        if node.tag == "key":
            if not re.fullmatch(r"[^\s\"'#]+", name):
                raise ValueError(f"Unsupported keyword {name!r}")
            prefix.append(Token(name))
        elif node.tag == "arg":
            prefix.append(Token.operand(node))
        elif node.tag == "close":
            if not groups or node is not groups[-1]:
                raise ValueError(f"Unexpected group closer {name!r}")
            groups = groups[:-1]

        unknown = {child.tag for child in node} - SYNTAX_TAGS - METADATA_TAGS
        if unknown:
            raise ValueError(f"Unsupported command tree elements: {', '.join(sorted(unknown))}")
        branches = [child for child in node if child.tag in SYNTAX_TAGS]
        actions = node.findall("action")
        alternatives = [END] if actions else []
        if node.tag == "open":
            if actions:
                raise ValueError(f"Action directly on opener {name!r}")
            delimiter, marker = group_id(node)
            closer = closers.get(marker)
            if closer is None and delimiter == "{":
                raise ValueError(f"No matching closer for {name!r}")
            # A required group can end at actions in each branch. Keep a
            # marker on the stack so a branch cannot skip a missing closer.
            boundary = closer if closer is not None else node
            if boundary in groups:
                raise ValueError(f"Group {name!r} reopens before its closer")
            groups += (boundary,)
            closer_only = branches == [closer]
            branches = [child for child in branches if child is not closer]
            if delimiter == "{":
                alternatives.append(walk(closer, groups))
            elif not branches:
                # A repeated opener can exist solely to store the shared closer.
                if closer_only and any(
                    sibling.tag == "open"
                    and sibling is not node
                    and group_id(sibling) == (delimiter, marker)
                    and any(child.tag in SYNTAX_TAGS for child in sibling)
                    for sibling in parents[node]
                ):
                    return DEAD_END
                raise ValueError(f"Empty required group {name!r}")

        # The CLI can attach a shared operand and its following keywords to
        # the same node. A nested operand already carries its own continuation.
        operands = [child for child in branches if child.tag == "arg"]
        if len(operands) > 1:
            if branches[:len(operands)] != operands or any(map(has_continuation, operands[:-1])):
                raise ValueError(f"Ambiguous sibling operands after {name!r}")
            prefix.extend(Token.operand(operand) for operand in operands[:-1])
            branches = branches[len(operands) - 1:]
            operands = operands[-1:]
        if operands and len(branches) > 1:
            if has_continuation(operands[0]):
                raise ValueError(f"Ambiguous sibling operands after {name!r}")
            operand = operands[0]
            prefix.append(Token.operand(operand))
            branches.remove(operand)

        alternatives.extend(walk(child, groups) for child in branches)
        if not alternatives:
            if not groups:
                raise ValueError(f"Command branch {name!r} has no terminal action")
            if groups[-1].tag == "open":
                raise ValueError(f"No matching closer for {groups[-1].findtext('name')!r}")
            alternatives.append(walk(groups[-1], groups))

        continuation = combine(alternatives)
        if continuation is DEAD_END:
            return DEAD_END
        for token in reversed(prefix):
            continuation = State(False, ((token, continuation),))
        return continuation

    if verbs is not None:
        # Top-level alternatives can start in groups, so filter the resulting
        # edges as well as the direct keyword children.
        start = combine(
            walk(child) for child in tree
            if child.tag in SYNTAX_TAGS and (child.tag != "key" or child.findtext("name") in verbs)
        )
        return State(False, tuple(
            (token, target) for token, target in start.transitions
            if token.operand_type is None and token.name in verbs
        ))

    start = walk(tree)
    if start.can_end or not start.transitions:
        raise ValueError("The command tree must define at least one nonempty command")
    return start


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


def grammar_rules(start, static_types):
    # Each hidden rule consumes a nonempty continuation. The rule following
    # a token owns its separator so a shorter form can also end in whitespace.
    rules = {}
    states = {}

    def choice(patterns):
        return patterns[0] if len(patterns) == 1 else f"choice({', '.join(patterns)})"

    @cache
    def outgoing(targets):
        branches = defaultdict(list)
        for state in targets:
            for token, target in state.transitions:
                branches[token.operand_type is None, token.pattern(static_types)].append((token, target))
        edges = []
        for tokens in branches.values():
            token, _ = tokens[0]
            if token.operand_type is not None and len({identifier(item.name) for item, _ in tokens}) > 1:
                # The syntax offers no way to choose a field at this position.
                token = Token("argument", token.operand_type)
            edges.append((token, tuple(dict.fromkeys(target for _, target in tokens))))
        return edges

    def state_rule(targets):
        if targets not in states:
            name = f"_continuation_{len(states) + 1}"
            states[targets] = name
            rules[name] = choice([transition(token, following) for token, following in outgoing(targets)])
        return f"$.{states[targets]}"

    def transition(token, targets):
        if not outgoing(targets):
            tail = "optional($._space)"
        elif any(state.can_end for state in targets):
            tail = f"optional(seq($._space, optional({state_rule(targets)})))"
        else:
            tail = f"$._space, {state_rule(targets)}"
        return f"seq({token.rule(static_types)}, {tail})"

    commands = defaultdict(list)
    for token, targets in outgoing((start,)):
        name = "command_" + identifier(token.name)
        commands[name].append(transition(token, targets))
    return {
        "command": choice([f"$.{name}" for name in commands]),
        **{name: choice(patterns) for name, patterns in commands.items()},
        **rules,
    }


def read_definition(source):
    data = source.read_text(encoding="utf-8-sig")
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)\b", data, re.IGNORECASE):
        raise ValueError("DTD and entity declarations are unsupported")
    root = ET.fromstring(data)
    trees = root.findall("cmd_tree")
    if root.tag != "cmd_def" or len(trees) != 1 or trees[0].get("name") != "extreme":
        raise ValueError("Expected one ExtremeXOS <cmd_tree name=\"extreme\">")

    return root, trees[0]


def generate(source):
    root, tree = read_definition(source)
    rules = grammar_rules(command_graph(tree), static_choices(root))
    command_rules = "\n".join(f"    {name}: $ => {pattern}," for name, pattern in rules.items())
    return rf"""module.exports = grammar({{
  name: "exos_{identifier(source.stem)}",
  extras: _ => [],
  rules: {{
    source_file: $ => seq(
      repeat(choice($._newline, seq($._line, $._newline))),
      optional(choice($._line, $._space)),
    ),
    _line: $ => seq(optional($._space), choice($.command, $.comment)),
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
    except (OSError, ET.ParseError, ValueError, RecursionError) as error:
        parser.exit(1, f"{options.xml}: {error}\n")


if __name__ == "__main__":
    main()
