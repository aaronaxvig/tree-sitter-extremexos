const twamp = require('./twamp');

const rules = () => ({
  show_command: $ => seq(
    'show',
    optional(choice(
      prec(1, $.show_twamp),
      $._arguments,
    )),
  ),

  ...twamp.rules(),
});

module.exports = {rules};
