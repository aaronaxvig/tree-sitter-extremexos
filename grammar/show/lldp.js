const {ports, withArguments} = require('../lldp');

const rules = () => ({
  show_lldp: $ => seq(
    'lldp',
    optional(choice(
      prec(1, $.show_lldp_ports),
      $._show_lldp_display,
    )),
  ),
  show_lldp_ports: $ => seq('ports', optional(seq(ports($), optional($._show_lldp_display)))),
  _show_lldp_display: $ => choice(
    prec(1, $.show_lldp_detailed),
    prec(1, $.show_lldp_statistics),
    prec(1, $.show_lldp_neighbors),
    prec(1, $.show_lldp_dcbx),
    $._arguments,
  ),
  show_lldp_detailed: $ => withArguments($, 'detailed'),
  show_lldp_statistics: $ => withArguments($, 'statistics'),
  show_lldp_neighbors: $ => withArguments($, 'neighbors', optional('detailed')),
  show_lldp_dcbx: $ => seq(
    'dcbx',
    optional(choice(
      prec(1, withArguments($, field('version', choice('baseline', 'ieee')), optional('detail'))),
      prec(1, withArguments($, 'detail')),
      $._arguments,
    )),
  ),
});

module.exports = {rules};
