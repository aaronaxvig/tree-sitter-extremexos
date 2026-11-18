const assert = require('node:assert/strict');
const fs = require('node:fs');
const {test} = require('node:test');
const onig = require('vscode-oniguruma');
const {Registry} = require('vscode-textmate');
const syntax = require('../syntaxes/extremexos.tmLanguage.json');
const injection = require('../syntaxes/markdown.tmLanguage.json');

test('script commands and operand continuations in EXOS files and Markdown', async () => {
  await onig.loadWASM(fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')));
  const markdown = {scopeName: 'text.html.markdown', patterns: []};
  const registry = new Registry({
    onigLib: Promise.resolve({
      createOnigScanner: patterns => new onig.OnigScanner(patterns),
      createOnigString: text => new onig.OnigString(text),
    }),
    getInjections: scope => scope === markdown.scopeName ? [injection.scopeName] : [],
    loadGrammar: async scope => [syntax, injection, markdown].find(item => item.scopeName === scope),
  });
  const command = 'keyword.control.extremexos';
  const option = 'keyword.other.extremexos';
  const lines = [
    ['if "example condition" then', [['if', command], ['then', option]]],
    ['  cat -n "example.cfg"', [['cat', command], ['-n', 'support.function.extremexos']]],
    ['else', [['else', command]]],
    ['  watch "show ports" count 2', [['watch', command], ['count', option]]],
    ['endif', [['endif', command]]],
    ['pwd', [['pwd', command]]],
  ];
  for (const scope of [syntax.scopeName, markdown.scopeName]) {
    const parser = await registry.loadGrammar(scope);
    let stack = scope === markdown.scopeName ? parser.tokenizeLine('```language=exosconfig').ruleStack : null;
    for (const [line, expected] of lines) {
      const result = parser.tokenizeLine(line, stack);
      stack = result.ruleStack;
      for (const [word, expectedScope] of expected) {
        assert.ok(result.tokens.some(token =>
          line.slice(token.startIndex, token.endIndex) === word && token.scopes.includes(expectedScope)
        ), `${scope}: missing ${expectedScope} for ${word} in ${line}`);
      }
    }
    for (const line of ['jerry cli', 'scp2 debug 1']) {
      const {tokens} = parser.tokenizeLine(line, stack);
      assert.ok(!tokens.some(token => token.scopes.includes(option) ||
        token.scopes.includes('support.function.extremexos') ||
        (line.startsWith('jerry') && token.scopes.includes(command))), line);
    }
    if (scope === markdown.scopeName) {
      stack = parser.tokenizeLine('```', stack).ruleStack;
      assert.ok(!parser.tokenizeLine('endif', stack).tokens.some(token => token.scopes.includes(command)));
    }
  }
});
