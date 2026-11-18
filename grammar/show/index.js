const twamp = require('./twamp');
const topics = require('../topics');

const names = topics.list('show', [], ['twamp']);

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
});

module.exports = {rules};
