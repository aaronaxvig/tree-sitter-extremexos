const fs = require('node:fs/promises');
const onig = require('vscode-oniguruma');
const {Registry} = require('vscode-textmate');

// Use the token classes styled by VS Code's built-in Markdown preview.
const previewClasses = new Map([
  ['comment.line.number-sign.extremexos', 'hljs-comment'],
  ['keyword.control.extremexos', 'hljs-keyword'],
  ['keyword.other.extremexos', 'hljs-keyword'],
  ['support.function.extremexos', 'hljs-built_in'],
  ['constant.numeric.extremexos', 'hljs-number'],
  ['constant.character.escape.extremexos', 'hljs-symbol'],
  ['string.quoted.double.extremexos', 'hljs-string'],
]);

async function activate() {
  await onig.loadWASM(await fs.readFile(require.resolve('vscode-oniguruma/release/onig.wasm')));
  const registry = new Registry({
    onigLib: Promise.resolve(onig),
    loadGrammar: async scope => scope === 'source.extremexos'
      ? require('./syntaxes/extremexos.tmLanguage.json')
      : null,
  });
  const grammar = await registry.loadGrammar('source.extremexos');

  return {
    extendMarkdownIt(md) {
      const original = md.options.highlight;
      md.options.highlight = function (source, language, ...args) {
        if (!/^(?:language=)?(?:exos|extremexos|exosconfig)$/i.test(language)) {
          return original?.call(this, source, language, ...args) ?? '';
        }

        let stack = null;
        return source.split('\n').map(line => {
          const {tokens, ruleStack} = grammar.tokenizeLine(line, stack);
          stack = ruleStack;
          return tokens.map(token => {
            const text = md.utils.escapeHtml(line.slice(token.startIndex, token.endIndex));
            const css = previewClasses.get(token.scopes[token.scopes.length - 1]);
            return css && text ? `<span class="${css}">${text}</span>` : text;
          }).join('');
        }).join('\n');
      };
      return md;
    },
  };
}

module.exports = {activate};
