const {ports, withArguments} = require('../lldp');

const rules = () => ({
  unconfigure_lldp: $ => seq(
    'lldp',
    optional(choice(prec(1, $.unconfigure_lldp_ports), $._arguments)),
  ),
  unconfigure_lldp_ports: $ => seq('ports', optional(withArguments($, ports($)))),
});

module.exports = {rules};
