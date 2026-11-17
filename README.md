# tree-sitter-extremexos

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for configuration files exported by Extreme Networks switches running ExtremeXOS.

The grammar currently provides named nodes for module headers, comments, common command verbs, every first-level `configure` topic reported by ExtremeXOS tab completion, and selected SNMP, DNS client, SNTP client, diagnostics, and system-recovery configuration commands. Unknown commands and dynamic configuration targets are preserved through generic fallbacks so complete configuration exports can still be parsed.

## Development

```sh
npm install
npm run generate
npm test
npx tree-sitter parse examples/example.exos
```

Corpus tests live in `test/corpus`; representative configuration exports live in `test/fixtures`.
