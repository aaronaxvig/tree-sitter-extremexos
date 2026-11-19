# Working on tree-sitter-extremexos

## Project intent

- Target canonical configuration files exported by Extreme Networks ExtremeXOS.
- Canonical spellings are the current target. The proposed keyword abbreviation support below also covers CLI snippets. Shortcuts that depend on configured object names remain outside the syntax grammar.
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

## Future support for keyword abbreviations

Generate abbreviations from the canonical keywords. The eventual scope includes verbs, topics, and keywords deeper in a command. At each position, use the full imported public vocabulary reachable there, including branches omitted from the default native build. Find the shortest prefix that identifies one keyword among those choices and accept every successive prefix through the full spelling. Always accept an exact keyword, even when it begins a longer keyword. Preserve generic fallback for ambiguous or unknown input.

For example, at the start of a command, `c` could mean `clear`, `configure`, or several other verbs. Only `configure` starts with `co`. Both generators should derive the eight spellings from the same prefix calculation:

- In `editors/vscode/scripts/generate-grammar.js`, emit a flat pattern such as `co(?:n|nf|nfi|nfig|nfigu|nfigur|nfigure)?` with the existing end-of-word check. This accepts `conf` and leaves `coffee` unmatched. The generated TextMate rules serve both the editor and the Markdown preview.
- In Tree-sitter, try a choice of literal spellings at the existing keyword position. Keep the canonical named nodes and operand fields while preserving the spelling and byte ranges in the input. For example, `conf vlan "printers" add ports 1:2` should still produce a `configure_command` containing `configure_vlan`.

Only apply prefix matching in keyword positions. Quoted names stay operands. Where a bare word can be both an operand and a shortened keyword, verify precedence against the target firmware before specializing that branch. Omitting `vlan` from a command because a VLAN named `printers` exists is a separate, device-dependent shortcut. See the [ExtremeXOS User Guide, “Abbreviated Syntax” and “Command Shortcuts”](https://documentation.extremenetworks.com/exos_32.6.1/downloads/EXOS_User_Guide_32.6.1.pdf).

The ABI 14 experiment added only the seven shorter literal spellings of `configure` to the default parser. States stayed at 8,269 and the largest action index stayed at 14,957. Generated C grew from 4,164,409 to 4,167,069 bytes (+2,660). The cost of abbreviating deeper keywords across all families is still unknown.

For the next small test, exercise one complete VLAN branch with abbreviations before and after the quoted name. Compare named nodes, operand fields, source spans, and highlighting against the fully spelled command. Include an ambiguous prefix, a longer unrelated word, an unfinished command, and an exact keyword that prefixes another keyword. Measure the largest action index as well as state count and C size before widening coverage.

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
