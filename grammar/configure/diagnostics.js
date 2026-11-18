const rules = () => ({
  configure_diagnostics: $ => seq(
    'diagnostics',
    optional(choice(
      prec(1, $.configure_diagnostics_privilege),
      $._arguments,
    )),
  ),

  configure_diagnostics_privilege: $ => seq(
    'privilege',
    optional(choice(
      seq(choice('admin', 'user'), optional($._arguments)),
      $._arguments,
    )),
  ),
});

module.exports = {rules};
