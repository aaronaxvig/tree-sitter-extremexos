const rules = () => ({
  disable_lldp: $ => seq(
    'lldp',
    optional(choice(
      prec(1, $.disable_lldp_ports),
      $._arguments,
    )),
  ),

  disable_lldp_ports: $ => seq(
    'ports',
    optional(seq(
      field('ports', choice('all', $.word_or_string)),
      optional(choice(
        seq(
          field('mode', choice('receive-only', 'transmit-only')),
          optional($._arguments),
        ),
        $._arguments,
      )),
    )),
  ),
});

module.exports = {rules};
