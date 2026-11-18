const fs = require('node:fs');
const path = require('node:path');
const generated = require('../../../grammar/generated');
const {verbs, topicName, topicsFor} = require('../../../grammar/commands');

// Read the same generated rules through a small adapter for their DSL.
// Highlighting uses token order and can ignore field names and precedence.
const dsl = {
  choice: (...branches) => branches,
  field: (_name, token) => token,
  optional: continuation => continuation,
  prec: (_precedence, branch) => branch,
  seq: (token, following) => ({token, following}),
};
const symbols = new Proxy({}, {get: (_target, name) => ({name})});
const rules = Object.assign({}, ...Object.values(generated).flatMap(families =>
  Object.values(families).map(family => family.rules(dsl)),
));

const escapePattern = keyword => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const alternatives = words => words.map(escapePattern).join('|');

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

function continuation(name) {
  if (name === '_arguments') return [];
  const include = {include: `#${name}`};
  if (continuations.has(name)) return [include];
  continuations.add(name);
  const patterns = [].concat(rules[name](symbols)).flatMap(branch => {
    if (branch.name === '_arguments') return [];
    const {token, following} = branch;
    const literal = typeof token === 'string';
    const pattern = literal ? escapePattern(token) : operand;
    const begin = String.raw`\G[ \t]+(${pattern})` + wordEnd;
    const capture = literal ? {name: optionScope} : {patterns: [values]};
    return [{
      begin,
      beginCaptures: {1: capture},
      end: '$',
      patterns: [...continuation(following.name), values],
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
    patterns: [...continuation(rules[topicName(verb, topic)](symbols).following.name), values],
  })),
);
const topicRules = verbs.flatMap(verb => {
  const topics = alternatives(topicsFor(verb));
  if (!topics) return [];
  return [{
    match: `${lineStart}(${escapePattern(verb)})[ \\t]+(${topics})${wordEnd}`,
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
      match: `${lineStart}(${alternatives(verbs)})${wordEnd}`,
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
