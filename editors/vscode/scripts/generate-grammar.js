const fs = require('node:fs');
const path = require('node:path');
const {rules} = require('../../../src/grammar.json');

function leadingKeywords(rule) {
  switch (rule.type) {
    case 'STRING':
      return [rule.value];
    case 'SEQ':
      return leadingKeywords(rule.members[0]);
    case 'CHOICE':
      return rule.members.flatMap(leadingKeywords);
    case 'SYMBOL':
      return leadingKeywords(rules[rule.name]);
    case 'PREC':
      return leadingKeywords(rule.content);
    default:
      return [];
  }
}

function alternatives(rule) {
  return [...new Set(leadingKeywords(rule))]
    .sort()
    .map(keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
}

const lineStart = String.raw`(?:^|\G)[ \t]*`;
const wordEnd = String.raw`(?=[ \t]|$)`;
const commandScope = 'keyword.control.extremexos';
const topicRules = ['configure', 'enable'].map(verb => ({
  match: `${lineStart}(${verb})[ \\t]+(${alternatives(rules[`${verb}_command`].members[1])})${wordEnd}`,
  captures: {
    1: {name: commandScope},
    2: {name: 'support.function.extremexos'},
  },
}));

const grammar = {
  $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  name: 'ExtremeXOS',
  scopeName: 'source.extremexos',
  patterns: [
    {
      name: 'comment.line.number-sign.extremexos',
      match: `${lineStart}#.*$`,
    },
    ...topicRules,
    {
      match: `${lineStart}(${alternatives(rules.command)})${wordEnd}`,
      captures: {1: {name: commandScope}},
    },
    {
      name: 'string.quoted.double.extremexos',
      begin: '"',
      end: '"|$',
      patterns: [
        {name: 'constant.character.escape.extremexos', match: String.raw`\\.`},
      ],
    },
    {
      name: 'constant.numeric.extremexos',
      match: String.raw`(?<!\S)(?:\d{1,3}(?:\.\d{1,3}){3}(?:/\d{1,2})?|\d+(?::\d+)?(?:[-,]\d+(?::\d+)?)*)(?!\S)`,
    },
  ],
};

fs.writeFileSync(
  path.join(__dirname, '../syntaxes/extremexos.tmLanguage.json'),
  JSON.stringify(grammar, null, 2) + '\n',
);
