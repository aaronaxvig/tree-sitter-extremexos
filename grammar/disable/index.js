const lldp = require('./lldp');
const topics = require('../topics');

const names = topics.list('disable', ['lldp', 'snmp']);

const rules = () => ({
  disable_command: $ => seq(
    'disable',
    optional(choice(
      ...topics.branches($, 'disable', names),
      $._arguments,
    )),
  ),

  ...topics.rules('disable', names),
  ...lldp.rules(),
});

module.exports = {rules};
