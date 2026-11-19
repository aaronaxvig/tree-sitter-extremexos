const assert = require('node:assert/strict');
const {test} = require('node:test');
const {parserSize} = require('../../tools/check_parser_size');

const source = (states, action) => `#define STATE_COUNT ${states}\nACTIONS(0), ACTIONS(${action})\n`;

test('accepts the largest representable state and action indices', () => {
  assert.deepEqual(parserSize(source(65536, 65535)), {
    states: 65536, largestAction: 65535, remainingActions: 0,
  });
  assert.equal(parserSize(source(100, 200).replaceAll('\n', '\r\n')).largestAction, 200);
});

test('rejects action overflow even when state IDs fit', () => {
  assert.throws(() => parserSize(source(60969, 103587)), /exceeds 16-bit.*103587/);
  assert.throws(() => parserSize(source(100, 65536)), /exceeds 16-bit/);
});

test('rejects overflowing state IDs and missing generated tables', () => {
  assert.throws(() => parserSize(source(65537, 100)), /exceeds 16-bit/);
  assert.throws(() => parserSize(''), /Expected a generated Tree-sitter parser/);
});
