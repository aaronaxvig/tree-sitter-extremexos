const rules = () => ({
  configure_diagnostics: $ => seq('diagnostics', 'privilege', $.word),
});

module.exports = {rules};
