const fs = require('node:fs');

const MAX_INDEX = 0xffff;

function parserSize(source) {
  const stateCount = source.match(/^#define STATE_COUNT (\d+)\r?$/m);
  const actions = [...source.matchAll(/\bACTIONS\((\d+)\)/g)];
  if (!stateCount || !actions.length) {
    throw new Error('Expected a generated Tree-sitter parser with STATE_COUNT and ACTIONS references.');
  }

  const states = Number(stateCount[1]);
  const largestAction = actions.reduce((maximum, match) => Math.max(maximum, Number(match[1])), 0);
  if (states - 1 > MAX_INDEX || largestAction > MAX_INDEX) {
    throw new Error(`Parser exceeds 16-bit table indices: ${states} states, largest action index ${largestAction}; maximum index ${MAX_INDEX}. Reduce the native profile before compiling.`);
  }
  return {states, largestAction, remainingActions: MAX_INDEX - largestAction};
}

if (require.main === module) {
  try {
    const size = parserSize(fs.readFileSync(process.argv[2] ?? 'src/parser.c', 'utf8'));
    console.log(`Parser tables: ${size.states} states, largest action index ${size.largestAction}/${MAX_INDEX} (${size.remainingActions} remaining).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {parserSize};
