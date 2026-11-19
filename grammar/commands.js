const {verbs: supplementalVerbs, supplemental, native} = require('./import.json');
const keywords = require('./keywords');
const generated = require('./generated');

const verbs = [...new Set([...supplementalVerbs, ...Object.keys(keywords)])].sort();
const ruleName = verb => `${verb.replaceAll('-', '_')}_command`;
const topicName = (verb, topic) => `${verb.replaceAll('-', '_')}_${topic.replaceAll('-', '_')}`;
const topicsFor = verb => [...new Set([...(keywords[verb] ?? []), ...(supplemental[verb] ?? [])])].sort();
const isNativeFamily = (verb, topic) => native.verbs.includes(verb) &&
  !(native.excluded_families[verb] ?? []).includes(topic);

const commandRules = (verb, full) => {
  const topics = full || native.verbs.includes(verb) ? topicsFor(verb) : [];
  const families = generated[verb] ?? {};
  const detailed = Object.fromEntries(
    Object.entries(families).filter(([topic]) => full || isNativeFamily(verb, topic)),
  );
  const fallback = detailed._operand
    ? topicName(verb, '_operand')
    : ({configure: 'configure_generic', enable: 'enable_generic'})[verb] ?? '_arguments';
  return {
    [ruleName(verb)]: $ => seq(
      verb,
      optional(choice(
        ...topics.map(topic => prec(1, $[topicName(verb, topic)])),
        $[fallback],
      )),
    ),
    ...Object.fromEntries(topics.filter(topic => !detailed[topic]).map(topic => [
      topicName(verb, topic),
      $ => seq(topic, optional($._arguments)),
    ])),
  };
};

// Continuations are shared across files, including files outside the native
// profile. Supply the whole catalog; the generator removes unreachable rules.
const rules = () => Object.assign({},
  ...Object.values(generated).flatMap(families => Object.values(families).map(family => family.rules())),
  ...verbs.map(verb => commandRules(verb, process.env.EXOS_FULL_PARSER === '1')),
);

module.exports = {verbs, ruleName, topicName, topicsFor, isNativeFamily, rules};
