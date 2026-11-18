const lldp = require('./lldp');
const netlogin = require('./netlogin');
const topics = require('../topics');

const names = topics.list('disable', ['lldp', 'snmp', 'netlogin']);

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
  ...netlogin.rules(),
});

module.exports = {rules};
