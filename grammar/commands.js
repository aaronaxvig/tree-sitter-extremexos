const {verbs: supplementalVerbs, supplemental, detailed: nativeFamilies} = require('./import.json');
const keywords = require('./keywords');
const generated = require('./generated');

const verbs = [...new Set([...supplementalVerbs, ...Object.keys(keywords)])].sort();
const ruleName = verb => `${verb.replaceAll('-', '_')}_command`;
const topicName = (verb, topic) => `${verb.replaceAll('-', '_')}_${topic.replaceAll('-', '_')}`;
const topicsFor = verb => [...new Set([...(keywords[verb] ?? []), ...(supplemental[verb] ?? [])])].sort();

const rules = () => Object.assign({}, ...verbs.map(verb => {
  const topics = topicsFor(verb);
  const families = generated[verb] ?? {};
  const detailed = process.env.EXOS_FULL_PARSER === '1' ? families : Object.fromEntries(
    (nativeFamilies[verb] ?? []).filter(topic => Object.hasOwn(families, topic)).map(topic => [topic, families[topic]]),
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
    ...Object.assign({}, ...Object.values(detailed).map(family => family.rules())),
  };
}));

module.exports = {verbs, ruleName, topicName, topicsFor, rules};
