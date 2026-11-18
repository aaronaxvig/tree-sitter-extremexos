const rules = () => ({
  configure_dns_client: $ => seq(
    'dns-client',
    optional(choice(
      prec(1, $.configure_dns_client_add),
      prec(1, $.configure_dns_client_default_domain),
      prec(1, $.configure_dns_client_delete),
      $.configure_dns_client_generic,
    )),
  ),

  configure_dns_client_add: $ => seq(
    'add',
    optional(choice(
      prec(1, $.dns_client_name_server),
      prec(1, $.dns_client_domain_suffix),
      $.configure_dns_client_add_generic,
    )),
  ),

  dns_client_name_server: $ => seq(
    'name-server',
    optional(seq(
      field('address', choice($.word, $.string)),
      optional(choice(
        seq('vr', optional(seq(
          field('virtual_router', choice($.word, $.string)),
          optional($.dns_client_extra_arguments),
        ))),
        $.dns_client_extra_arguments,
      )),
    )),
  ),

  dns_client_domain_suffix: $ => seq(
    'domain-suffix',
    optional(seq(
      field('domain', choice($.word, $.string)),
      optional($.dns_client_extra_arguments),
    )),
  ),

  configure_dns_client_default_domain: $ => seq(
    'default-domain',
    optional($._arguments),
  ),

  configure_dns_client_delete: $ => seq(
    'delete',
    optional(choice(
      prec(1, $.dns_client_name_server),
      prec(1, $.dns_client_domain_suffix),
      $.configure_dns_client_delete_generic,
    )),
  ),

  dns_client_extra_arguments: $ => $._arguments,
  configure_dns_client_add_generic: $ => seq($.word, optional($._arguments)),
  configure_dns_client_delete_generic: $ => seq($.word, optional($._arguments)),
  configure_dns_client_generic: $ => seq($.word, optional($._arguments)),
});

module.exports = {rules};
