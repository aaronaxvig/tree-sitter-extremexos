"""Export firmware CLI syntax for the tolerant ExtremeXOS grammar."""

import argparse
from collections import defaultdict
from functools import cache
import json
from pathlib import Path

from .clidef_to_grammar import command_graph, identifier, read_definition


VERBS = ("configure", "create", "delete", "disable", "enable", "show", "unconfigure")
OMITTED_FLAGS = ("debug-only", "lawful-intercept", "prompting-only")
MANIFEST = Path(__file__).resolve().parents[1] / "grammar/firmware/sources.json"


def export_syntax(directory, manifest):
    # Zero represents a continuation whose remaining operands are generic.
    rows = [()]
    row_ids = {(): 0}
    commands = defaultdict(list)
    contributors = []
    for module in manifest["modules"]:
        _, tree = read_definition(directory / module)
        start = command_graph(tree, verbs=VERBS, omitted_flags=OMITTED_FLAGS)
        if start.transitions:
            contributors.append(module)
        for token, target in start.transitions:
            commands[token.name].append(target)

    def branches(states):
        choices = defaultdict(list)
        for state in states:
            for token, target in state.transitions:
                # The main grammar accepts unfinished and unfamiliar operands.
                # Collapse operand types that share its word-or-string lexer.
                keyword = token.name if token.operand_type is None else None
                choices[keyword].append((token, target))
        return choices

    @cache
    def state_id(states):
        choices = branches(states)
        edges = []
        for keyword, alternatives in sorted(choices.items(), key=lambda item: item[0] or ""):
            names = {identifier(token.name) for token, _ in alternatives}
            field = None
            if keyword is None:
                field = next(iter(names)) if len(names) == 1 else "argument"
            targets = tuple(dict.fromkeys(target for _, target in alternatives))
            edges.append((keyword, field, state_id(targets)))
        row = tuple(edges)
        if row not in row_ids:
            row_ids[row] = len(rows)
            rows.append(row)
        return row_ids[row]

    families = {}
    for verb in ("configure", "enable"):
        families[verb] = {
            keyword: state_id(tuple(dict.fromkeys(target for _, target in alternatives)))
            for keyword, alternatives in sorted(branches(commands[verb]).items(), key=lambda item: item[0] or "")
            if keyword is not None
        }

    verb_states = {
        verb: state_id(tuple(dict.fromkeys(commands[verb])))
        for verb in VERBS if verb not in families
    }
    return {
        "firmware": manifest["firmware"],
        "contributors": contributors,
        "families": families,
        "verbs": verb_states,
        "states": rows,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path, help="Extracted config/clidef directory")
    options = parser.parse_args()
    try:
        manifest = json.loads(MANIFEST.read_text())
        syntax = export_syntax(options.directory, manifest)
    except (OSError, ValueError, RecursionError) as error:
        parser.exit(1, f"{error}\n")

    # Keep one line per state so changes to branches are easy to inspect.
    states = syntax.pop("states")
    document = json.dumps(syntax, indent=2)[:-2]
    rows = ",\n".join("    " + json.dumps(state, separators=(",", ":")) for state in states)
    print(document + ',\n  "states": [\n' + rows + "\n  ]\n}")


if __name__ == "__main__":
    main()
