const {withArguments} = require('../lldp');

const rules = () => ({
  debug_lldp: $ => seq('lldp', optional(choice(prec(1, $.debug_lldp_show), $._arguments))),
  debug_lldp_show: $ => seq(
    'show',
    optional(choice(
      prec(1, $.debug_lldp_show_fabric),
      prec(1, $.debug_lldp_show_nl_clients),
      $._arguments,
    )),
  ),
  debug_lldp_show_fabric: $ => withArguments($, 'fabric', optional(seq('attach', optional('database')))),
  debug_lldp_show_nl_clients: $ => seq('nl-clients', optional(withArguments($, field('entry', $.word_or_string)))),
});

module.exports = {rules};
