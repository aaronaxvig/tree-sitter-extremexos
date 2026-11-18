const {verbs, supplemental} = require('./import.json');
const keywords = require('./keywords');
const generated = require('./generated');

const ruleName = verb => `${verb}_command`;
const topicName = (verb, topic) => `${verb}_${topic.replaceAll('-', '_')}`;
const topicsFor = verb => [...new Set([...(keywords[verb] ?? []), ...(supplemental[verb] ?? [])])].sort();

const rules = () => Object.assign({}, ...verbs.map(verb => {
  const topics = topicsFor(verb);
  const detailed = generated[verb] ?? {};
  return {
    [ruleName(verb)]: $ => seq(
      verb,
      optional(choice(
        ...topics.map(topic => prec(1, $[topicName(verb, topic)])),
        verb === 'configure' ? $.configure_generic : verb === 'enable' ? $.enable_generic : $._arguments,
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
