const fs = require('node:fs');
const path = require('node:path');
const {rules} = require('../../../src/grammar.json');
const generated = require('../../../grammar/generated');
const {topicName} = require('../../../grammar/commands');

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
const operand = String.raw`(?:[^\s"']+|"(?:[^"\\\r\n]|\\.)*")`;
const repository = {values: {patterns: valuePatterns}};
const continuations = new Set();

const choices = rule => rule.type === 'CHOICE' ? rule.members : [rule];
const optionalContent = rule => choices(rule).find(member => member.type !== 'BLANK');

function continuation(name) {
  if (name === '_arguments') return [];
  const include = {include: `#${name}`};
  if (continuations.has(name)) return [include];
  continuations.add(name);
  const patterns = choices(rules[name]).flatMap(edge => {
    const branch = edge.type === 'PREC' ? edge.content : edge;
    if (branch.type === 'SYMBOL' && branch.name === '_arguments') return [];
    const [label, following] = branch.members;
    const token = label.type === 'FIELD' ? label.content : label;
    const literal = token.type === 'STRING';
    const pattern = literal ? escapePattern(token.value) : operand;
    const begin = String.raw`\G[ \t]+(${pattern})` + wordEnd;
    const capture = literal ? {name: optionScope} : {patterns: [values]};
    return [{
      begin,
      beginCaptures: {1: capture},
      end: '$',
      patterns: [...continuation(optionalContent(following).name), values],
    }];
  });
  repository[name] = {patterns};
  return [include];
}

// The generated parser shares continuations. The highlighter follows the
// same references so optional branches never expand into full command paths.
const subcommandRules = Object.entries(generated).flatMap(([verb, families]) =>
  Object.keys(families).map(topic => ({
    begin: `${lineStart}(${escapePattern(verb)})[ \\t]+(${escapePattern(topic)})${wordEnd}`,
    beginCaptures: {1: {name: commandScope}, 2: {name: topicScope}},
    end: '$',
    patterns: [...continuation(optionalContent(rules[topicName(verb, topic)].members[1]).name), values],
  })),
);
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
