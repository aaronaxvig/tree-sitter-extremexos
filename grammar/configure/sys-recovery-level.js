const rules = () => ({
  configure_sys_recovery: $ => seq('sys-recovery-level', optional(seq($.word, optional($.word)))),
});

module.exports = {rules};
