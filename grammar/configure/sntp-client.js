const rules = () => ({
  configure_sntp_client: $ => seq('sntp-client', $.sntp_client_server),

  sntp_client_server: $ => seq(
    field('role', choice('primary', 'secondary')),
    field('hostname', $.word),
    optional(seq('vr', field('virtual_router', $.word))),
  ),
});

module.exports = {rules};
