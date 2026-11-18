const keywords = require('./keywords');

const ruleName = (verb, topic) => `${verb}_${topic.replaceAll('-', '_')}`;

const list = (verb, defaults = [], detailed = []) =>
  [...new Set([...defaults, ...(keywords[verb] ?? [])])]
    .filter(topic => !detailed.includes(topic));

const branches = ($, verb, names) => names.map(topic => prec(1, $[ruleName(verb, topic)]));

const rules = (verb, names) => Object.fromEntries(names.map(topic => [
  ruleName(verb, topic),
  $ => seq(topic, optional($._arguments)),
]));

module.exports = {ruleName, list, branches, rules};
