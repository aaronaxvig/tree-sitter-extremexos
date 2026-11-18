const topics = require('../topics');
const detailed = {
  elsm: require('./elsm'),
  lldp: require('./lldp'),
  netlogin: require('./netlogin'),
  twamp: require('./twamp'),
};
const names = topics.list('disable', ['snmp', ...Object.keys(detailed)]);

const rules = () => ({
  disable_command: $ => seq(
    'disable',
    optional(choice(
      ...topics.branches($, 'disable', names),
      $._arguments,
    )),
  ),

  ...topics.rules('disable', names),
  ...Object.assign({}, ...Object.values(detailed).map(family => family.rules())),
});

module.exports = {rules};
