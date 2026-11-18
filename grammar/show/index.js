const twamp = require('./twamp');
const lldp = require('./lldp');
const netlogin = require('./netlogin');
const topics = require('../topics');

const names = topics.list('show', ['lldp', 'netlogin'], ['twamp']);

const rules = () => ({
  show_command: $ => seq(
    'show',
    optional(choice(
      prec(1, $.show_twamp),
      ...topics.branches($, 'show', names),
      $._arguments,
    )),
  ),

  ...twamp.rules(),
  ...topics.rules('show', names),
  ...lldp.rules(),
  ...netlogin.rules(),
});

module.exports = {rules};
