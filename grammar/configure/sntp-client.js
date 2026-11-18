const rules = () => ({
  configure_sntp_client: $ => seq(
    'sntp-client',
    optional(choice(prec(1, $.sntp_client_server), $._arguments)),
  ),

  sntp_client_server: $ => seq(
    field('role', choice('primary', 'secondary')),
    field('hostname', $.word),
    optional(seq('vr', field('virtual_router', $.word))),
  ),
});

module.exports = {rules};
