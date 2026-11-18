# tree-sitter-extremexos

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for configuration files and CLI command lists for Extreme Networks switches running ExtremeXOS.

The grammar provides named nodes for module headers, comments, and the top-level verbs reported by ExtremeXOS tab completion. Verbs such as `cd`, `show`, and `save` have named nodes with generic arguments. First-level `configure` and `enable` topics have stable `configure_*` and `enable_*` nodes, with more detailed parsing for selected `configure` families.

## Scope

This grammar deliberately targets canonical configuration files exported by ExtremeXOS. It does not attempt to recognize every abbreviation or context-sensitive shortcut accepted by the interactive CLI. For example, an exported `configure vlan "VLANname" ...` command can be parsed without knowing which VLANs exist; checking that the name corresponds to a preceding `create vlan` command belongs in a separate semantic analysis layer. Unknown commands and dynamic interactive targets are preserved through generic fallbacks rather than rejected.

## VS Code

The [VS Code extension](editors/vscode/README.md) adds syntax highlighting for `.exos` and `.exosconfig` files and Markdown fences.

## Development

```sh
npm install
npm run generate
npm test
npx tree-sitter parse examples/example.exos
```

Corpus tests live in `test/corpus`; representative configuration exports live in `test/fixtures`.
The root `grammar.js` composes command-family modules from `grammar/`; detailed families can grow there without obscuring the top-level grammar.

### Generate a standalone grammar from firmware XML

`tools/clidef_to_grammar.py` reads one extracted `config/clidef/*.xml` file and emits a standalone Tree-sitter grammar. It was tested with `edgeAuto.xml`, `kcm.xml`, and `twamp.xml` from ExtremeXOS 32.7.3.15. The generator follows shared group closers and uses action entries to identify where a command can end. Optional branches share their continuation rules, so the output stays compact with many independent options.

```sh
work=$(mktemp -d)
python3 tools/clidef_to_grammar.py /path/to/edgeAuto.xml > "$work/grammar.js"
cd "$work"
tree-sitter generate --abi 14
```

The generated syntax tree names each command by its leading keyword and gives operands named fields. It uses the `argument` field when several operand labels share the same lexical rule at the same position. The grammar recognizes fixed choices declared by unquoted static custom types. Numeric ranges, dynamic names, and platform capabilities depend on device-level validation. The generator reports unsupported tree structures.

Run the converter's tests with `python3 -B -m unittest discover -s test/tools`.

### Refresh the firmware syntax in the main grammar

The main grammar loads a generated catalog from `grammar/firmware/syntax.json`. Its [source manifest](grammar/firmware/sources.json) lists the firmware modules that passed standalone parser generation. The catalog covers `configure`, `create`, `delete`, `disable`, `enable`, `show`, and `unconfigure`. It skips definitions flagged as debug-only, lawful-intercept, or prompting-only and contains only syntax and operand names.

Existing hand-written configuration rules take precedence. Other families get named fields and keyword nodes from the catalog while accepting unfamiliar arguments and unfinished lines.

```sh
python3 -B -m tools.generate_firmware_syntax /path/to/config/clidef > grammar/firmware/syntax.json.tmp &&
  mv grammar/firmware/syntax.json.tmp grammar/firmware/syntax.json
npm run generate
npm --prefix editors/vscode run generate
```

Regular parser generation uses the checked-in catalog and requires no firmware files.
