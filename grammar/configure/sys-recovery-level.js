const rules = () => ({
  configure_sys_recovery: $ => seq('sys-recovery-level', $.word, $.word),
});

module.exports = {rules};
