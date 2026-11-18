const lldp = require('./lldp');
const topics = require('../topics');

const names = topics.list('disable', [], ['lldp']);

const rules = () => ({
  disable_command: $ => seq(
    'disable',
    optional(choice(
      prec(1, $.disable_lldp),
      ...topics.branches($, 'disable', names),
      $._arguments,
    )),
  ),

  ...lldp.rules(),
  ...topics.rules('disable', names),
});

module.exports = {rules};
