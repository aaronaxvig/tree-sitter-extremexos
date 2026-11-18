const fs = require('node:fs');
const path = require('node:path');
const {rules} = require('../../../src/grammar.json');
const {commandPaths} = require('./command-paths');

function leadingKeywords(rule) {
  if (!rule) return [];
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
    case 'PREC_LEFT':
    case 'PREC_RIGHT':
    case 'PREC_DYNAMIC':
      return leadingKeywords(rule.content);
    default:
      return [];
  }
}

const escapePattern = keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function alternatives(rule) {
  return [...new Set(leadingKeywords(rule))]
    .sort()
    .map(escapePattern)
    .join('|');
}

const lineStart = String.raw`(?:^|\G)[ \t]*`;
const wordEnd = String.raw`(?=[ \t]|$)`;
const commandScope = 'keyword.control.extremexos';
const topicScope = 'support.function.extremexos';
const optionScope = 'keyword.other.extremexos';
const valuePatterns = [
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
];
const values = {include: '#values'};
const families = new Map();
for (const [verb, topic, ...tokens] of commandPaths(rules)) {
  const key = `${verb} ${topic}`;
  if (!families.has(key)) families.set(key, new Map());
  let children = families.get(key);
  for (const token of tokens) {
    const label = JSON.stringify(token);
    if (!children.has(label)) children.set(label, new Map());
    children = children.get(label);
  }
}

const repository = {values: {patterns: valuePatterns}};
const continuations = new Map();
function continuation(children) {
  const patterns = [];
  for (const [label, next] of children) {
    const token = JSON.parse(label);
    const literal = typeof token === 'string';
    const pattern = literal ? escapePattern(token) : token.operand;
    const begin = String.raw`\G[ \t]+(${pattern})` + wordEnd;
    const capture = literal ? {name: optionScope} : {patterns: [values]};
    patterns.push({
      begin,
      beginCaptures: {1: capture},
      end: '$',
      patterns: next.size ? [continuation(next), values] : [values],
    });
  }
  const signature = JSON.stringify(patterns);
  if (!continuations.has(signature)) {
    const name = `continuation-${continuations.size + 1}`;
    repository[name] = {patterns};
    continuations.set(signature, {include: `#${name}`});
  }
  return continuations.get(signature);
}

const subcommandRules = [...families].map(([key, children]) => {
  const [verb, topic] = key.split(' ');
  return {
    begin: `${lineStart}(${escapePattern(verb)})[ \\t]+(${escapePattern(topic)})${wordEnd}`,
    beginCaptures: {1: {name: commandScope}, 2: {name: topicScope}},
    end: '$',
    patterns: [continuation(children), values],
  };
});
const topicRules = rules.command.members.flatMap(command => {
  const rule = rules[command.name];
  if (rule?.type !== 'SEQ') return [];
  const [verb, argumentsRule] = rule.members;
  if (verb.type !== 'STRING') return [];
  const topics = alternatives(argumentsRule);
  if (!topics) return [];
  return [{
    match: `${lineStart}(${escapePattern(verb.value)})[ \\t]+(${topics})${wordEnd}`,
    captures: {
      1: {name: commandScope},
      2: {name: topicScope},
    },
  }];
});

const grammar = {
  $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
  name: 'ExtremeXOS',
  scopeName: 'source.extremexos',
  patterns: [
    {
      name: 'comment.line.number-sign.extremexos',
      match: `${lineStart}#.*$`,
    },
    ...subcommandRules,
    ...topicRules,
    {
      match: `${lineStart}(${alternatives(rules.command)})${wordEnd}`,
      captures: {1: {name: commandScope}},
    },
    values,
  ],
  repository,
};

fs.writeFileSync(
  path.join(__dirname, '../syntaxes/extremexos.tmLanguage.json'),
  JSON.stringify(grammar, null, 2) + '\n',
);
