# Working on tree-sitter-extremexos

## Project intent

- Target canonical configuration files exported by Extreme Networks ExtremeXOS.
- Do not try to parse every abbreviation or context-sensitive shortcut accepted by the interactive CLI.
- Parse names syntactically without requiring them to be known. Cross-command checks such as whether a VLAN was created belong in a future semantic-analysis layer, not the Tree-sitter grammar.
- Preserve unknown commands, future syntax, and unfinished branches through generic fallbacks instead of producing parse errors.

## Grammar architecture

- Keep `grammar.js` focused on top-level composition and shared lexical rules.
- Put detailed command families under `grammar/<verb>/`, one family per file (for example, `grammar/configure/ntp.js` and `grammar/show/twamp.js`).
- Generate command families with `python3 -B -m tools.import_grammar /path/to/config/clidef`. Update `grammar/import.json` to select additional detailed families.
- Review the generated rules and corpus cases with Git. Keep named nodes for verbs and topics, literal tokens for keywords, and XML-derived fields for operands.
- When specializing a branch, retain a generic fallback at the deepest incomplete level.
- Use named fields for meaningful operands such as `vlan`, `ports`, `address`, `domain`, `hostname`, and `virtual_router`.
- Do not copy device-specific completion values into the grammar. Dynamic names shown by tab completion are examples, not keywords.

## Native parse-table limits

The default ABI 14 parser selects 49 detailed families through `grammar/import.json`. Other known topics accept generic arguments. The XML import and VS Code highlighter already use all 1,017 public families. Keep the native subset as the shipping default while the full native table overflows.

Measurements from November 2026 with Tree-sitter CLI 0.25.10 and ABI 14:

| Native build | Parse states | Largest `ACTIONS(n)` index | Generated `src/parser.c` |
| --- | ---: | ---: | ---: |
| Default subset | 8,269 | 14,957 | 4.16 MB |
| All public families (`EXOS_FULL_PARSER=1`) | 60,969 | 103,587 | 30.57 MB |

The binding constraint is the **action index**. Both `ts_parse_table` and `ts_small_parse_table` store entries as `uint16_t`, whose maximum is 65,535. The full build fits that range for state IDs but exceeds it for action offsets. Generation can finish and a C compiler can emit a loadable library while truncating those offsets. The resulting full parser returned `ERROR` for both EDP commands in `test/full-import/`, including `show edp ports 1:2 detail`. CLI 0.26.9 addresses slow reachability analysis during generation. That performance fix alone does not establish that the emitted table fits.

Experiments on 41 families from the EDP, ELSM, LLDP, NTP, and TWAMP XML files tested which grammar changes might help:

- Moving the generic argument tail to the family level preserved every sampled tree, including operand fields and byte ranges, across 403 complete commands, 400 with unknown suffixes, 210 unfinished prefixes, and 213 with unknown tokens mid-command. States dropped from 1,899 to 1,713, but the largest action index **rose from 3,251 to 3,379**. Fewer states or a smaller C file cannot by themselves establish progress on overflow.
- Allowing a command to stop only at XML-declared endings broke 209 of the 210 unfinished prefixes. Combining that restriction with the family-level tail lowered the largest index to 2,973 but also broke 120 of the 213 mid-command cases. Grouping equivalent literal alternatives left the measured table size and action index unchanged.

For another sizing attempt, generate in a temporary directory and inspect the largest action reference with `rg -o --no-filename 'ACTIONS\([0-9]+\)' src/parser.c | tr -cd '0-9\n' | sort -n | tail -1`. With GCC, `cc -Werror=overflow -fsyntax-only -Isrc src/parser.c` catches narrowing before runtime. Once the indices fit, run `tools/test_full_import.sh /path/to/config/clidef` for the full native corpus and fixtures. Compare complete trees for unfinished prefixes and unknown continuations as well, since valid-command tests passed even for variants that broke fallback behavior.

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
- Keep command-family changes and regenerated parser output in the same commit.
