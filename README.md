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

`tools/clidef_to_grammar.py` reads one extracted `config/clidef/*.xml` file and emits a standalone Tree-sitter grammar. It was tested with `edgeAuto.xml`, `kcm.xml`, and `twamp.xml` from ExtremeXOS 32.7.3.15. The generator follows the XML command paths through shared group closers and uses action entries to identify where a command can end.

```sh
work=$(mktemp -d)
python3 tools/clidef_to_grammar.py /path/to/edgeAuto.xml > "$work/grammar.js"
cd "$work"
tree-sitter generate --abi 14
```

The generated grammar recognizes command structure, gives operands named fields, and recognizes fixed choices declared by unquoted static custom types. It leaves numeric ranges, dynamic names, and platform capabilities to device-level validation. The generator reports unsupported tree structures and writes a standalone grammar.

Run the converter's tests with `python3 -B -m unittest discover -s test/tools`.
