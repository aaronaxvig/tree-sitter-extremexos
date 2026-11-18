const {withArguments} = require('./arguments');

const ports = $ => field('ports', choice('all', $.word_or_string));

const toggle = verb => ({
  [`${verb}_lldp`]: $ => seq(
    'lldp',
    optional(choice(prec(1, $[`${verb}_lldp_ports`]), $._arguments)),
  ),
  [`${verb}_lldp_ports`]: $ => seq(
    'ports',
    optional(seq(
      ports($),
      optional(choice(
        withArguments($, field('mode', choice('receive-only', 'transmit-only'))),
        $._arguments,
      )),
    )),
  ),
  [`${verb}_snmp`]: $ => seq(
    'snmp',
    optional(choice(prec(1, $[`${verb}_snmp_traps`]), $._arguments)),
  ),
  [`${verb}_snmp_traps`]: $ => seq(
    'traps',
    optional(choice(prec(1, $[`${verb}_snmp_traps_lldp`]), $._arguments)),
  ),
  [`${verb}_snmp_traps_lldp`]: $ => seq(
    choice('lldp', 'lldp-med'),
    optional(choice(prec(1, $[`${verb}_snmp_traps_lldp_ports`]), $._arguments)),
  ),
  [`${verb}_snmp_traps_lldp_ports`]: $ => seq('ports', optional(withArguments($, ports($)))),
});

module.exports = {ports, withArguments, toggle};
