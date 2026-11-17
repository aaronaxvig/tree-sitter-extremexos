# Working on tree-sitter-extremexos

## Project intent

- Target canonical configuration files exported by Extreme Networks ExtremeXOS.
- Do not try to parse every abbreviation or context-sensitive shortcut accepted by the interactive CLI.
- Parse names syntactically without requiring them to be known. Cross-command checks such as whether a VLAN was created belong in a future semantic-analysis layer, not the Tree-sitter grammar.
- Preserve unknown commands, future syntax, and unfinished branches through generic fallbacks instead of producing parse errors.

## Grammar architecture

- Keep `grammar.js` focused on top-level composition and shared lexical rules.
- Put detailed `configure` command families in sibling files under `grammar/configure/`, one family per file (for example, `dns-client.js` and `vlan.js`).
- `grammar/configure/topics.js` contains first-level families that only have generic argument parsing so far.
- Give every known family and subcommand a stable, descriptive named node such as `configure_vlan_add_ports`. Flesh out that node in place as more completion data arrives; avoid changing the public tree shape unnecessarily.
- When specializing a branch, retain a generic fallback at the deepest incomplete level.
- Use named fields for meaningful operands such as `vlan`, `ports`, `address`, `domain`, `hostname`, and `virtual_router`.
- Do not copy device-specific completion values into the grammar. Dynamic names shown by tab completion are examples, not keywords.

## Fixtures and privacy

- Never commit real switch names, internal domains, internal IP addresses, or organization-specific object names from supplied completion/configuration dumps.
- Use neutral names such as `Example`, reserved domains such as `example.com`, and documentation address ranges such as `192.0.2.0/24`.
- Representative exports belong in `test/fixtures/`; user-facing samples belong in `examples/`.

## Generation and verification

- The project intentionally generates language ABI 14 for compatibility with its current Node Tree-sitter dependency. Use `npm run generate`; do not run an unqualified generate command that changes the ABI.
- Commit generated `src/grammar.json`, `src/node-types.json`, and `src/parser.c` alongside grammar changes.
- Add or update corpus coverage in `test/corpus/` whenever the syntax tree changes. Inspect updates rather than accepting `tree-sitter test --update` blindly.
- Before handing off a change, run:

  ```sh
  npm run generate
  npm test
  npx --no-install tree-sitter parse --quiet examples/example.exos test/fixtures/*.exos
  git diff --check
  ```

## Repository workflow

- The default branch is `main` and the remote is `origin`.
- Keep handwritten grammar changes and regenerated parser output in the same commit.
