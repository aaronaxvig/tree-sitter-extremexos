#!/usr/bin/env bash
set -euo pipefail

# Parse the entire workflow before starting the long-running generator.
main() {
  xml=$(realpath "${1:?Usage: tools/test_full_import.sh /path/to/config/clidef}")
  root=$(cd "$(dirname "$0")/.." && pwd)
  cli=${TREE_SITTER_CLI:-"$root/node_modules/.bin/tree-sitter"}
  work=$(mktemp -d)
  trap 'rm -rf "$work"' EXIT
  mkdir -p "$work/grammar" "$work/test/corpus"
  cp "$root"/{grammar.js,tree-sitter.json} "$work/"
  cp "$root"/grammar/{commands.js,import.json} "$work/grammar/"
  cp "$root"/test/full-import/*.txt "$work/test/corpus/"

  cd "$root"
  python3 -B -m tools.import_grammar "$xml" --output "$work/grammar"
  cd "$work"
  export XDG_CACHE_HOME="$work/cache"
  EXOS_FULL_PARSER=1 "$cli" generate --abi 14
  node "$root/tools/check_parser_size.js" "$work/src/parser.c"
  "$cli" test
  "$cli" parse --quiet "$root"/examples/example.exos "$root"/test/fixtures/*.exos
}

main "$@"
