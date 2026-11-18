const topics = require('../topics');
const detailed = {
  automation: require('./automation'),
  database: require('./database'),
  'dos-protect': require('./dos-protect'),
  elsm: require('./elsm'),
  keychain: require('./keychain'),
  lldp: require('./lldp'),
  netlogin: require('./netlogin'),
  twamp: require('./twamp'),
};
const names = topics.list('show', Object.keys(detailed));

const rules = () => ({
  show_command: $ => seq(
    'show',
    optional(choice(
      ...topics.branches($, 'show', names),
      $._arguments,
    )),
  ),

  ...topics.rules('show', names),
  ...Object.assign({}, ...Object.values(detailed).map(family => family.rules())),
});

module.exports = {rules};
