const {families, verbs, states} = require('./syntax.json');

const topics = verb => Object.keys(families[verb]);
const ruleName = id => `_firmware_arguments_${id}`;
const argumentsAt = ($, id) => id ? $[ruleName(id)] : $._arguments;
const commandArguments = ($, verb) => argumentsAt($, verbs[verb]);
const familyArguments = ($, verb, topic) => argumentsAt($, families[verb][topic]);

const keywordName = keyword => `keyword_${keyword.toLowerCase().replace(/[^a-z0-9_]+/g, '_')}`;

const rules = () => Object.fromEntries(states.slice(1).map((edges, index) => [
  ruleName(index + 1),
  $ => {
    const alternatives = edges.map(([keyword, name, next]) => seq(
      keyword === null ? field(name, $.word_or_string) : alias(keyword, $[keywordName(keyword)]),
      optional(argumentsAt($, next)),
    ));

    // Without a known operand slot, accept the rest of an unfamiliar branch
    // as generic arguments. An operand slot can already consume either form.
    if (edges.every(([keyword]) => keyword !== null)) {
      alternatives.push($._arguments);
    }
    return alternatives.length === 1 ? alternatives[0] : choice(...alternatives);
  },
]));

module.exports = {topics, commandArguments, familyArguments, rules};
