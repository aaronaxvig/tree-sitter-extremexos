const rules = () => ({
  show_twamp: $ => seq(
    'twamp',
    optional(choice(
      prec(1, $.show_twamp_endpoint),
      prec(1, $.show_twamp_reflector),
      $._arguments,
    )),
  ),

  show_twamp_endpoint: $ => seq(
    'endpoint',
    optional(choice(
      prec(1, $.show_twamp_endpoint_ipaddress),
      $._arguments,
    )),
  ),

  show_twamp_endpoint_ipaddress: $ => seq(
    'ipaddress',
    optional(seq(
      field('src_ip', $.word_or_string),
      optional(choice(
        prec(1, $.show_twamp_endpoint_ipaddress_port),
        $._arguments,
      )),
    )),
  ),

  show_twamp_endpoint_ipaddress_port: $ => seq(
    'port',
    optional(seq(
      field('src_port', $.word_or_string),
      optional($._arguments),
    )),
  ),

  show_twamp_reflector: $ => seq(
    'reflector',
    optional($._arguments),
  ),
});

module.exports = {rules};
