const rules = () => ({
  configure_dns_client: $ => seq(
    'dns-client',
    choice(
      prec(1, $.configure_dns_client_add),
      prec(1, $.configure_dns_client_default_domain),
      prec(1, $.configure_dns_client_delete),
      $.configure_dns_client_generic,
    ),
  ),

  configure_dns_client_add: $ => seq(
    'add',
    choice(
      prec(1, $.dns_client_name_server),
      prec(1, $.dns_client_domain_suffix),
      $.configure_dns_client_add_generic,
    ),
  ),

  dns_client_name_server: $ => seq(
    'name-server',
    field('address', $.word),
    optional(seq('vr', field('virtual_router', $.word))),
  ),

  dns_client_domain_suffix: $ => seq(
    'domain-suffix',
    field('domain', $.word),
  ),

  configure_dns_client_default_domain: $ => seq(
    'default-domain',
    optional($._arguments),
  ),

  configure_dns_client_delete: $ => seq(
    'delete',
    choice(
      prec(1, $.dns_client_name_server),
      prec(1, $.dns_client_domain_suffix),
      $.configure_dns_client_delete_generic,
    ),
  ),

  configure_dns_client_add_generic: $ => seq($.word, optional($._arguments)),
  configure_dns_client_delete_generic: $ => seq($.word, optional($._arguments)),
  configure_dns_client_generic: $ => seq($.word, optional($._arguments)),
});

module.exports = {rules};
