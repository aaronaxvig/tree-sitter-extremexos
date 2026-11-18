const {withArguments} = require('../lldp');

const rules = () => ({
  clear_lldp: $ => seq('lldp', optional(choice(prec(1, $.clear_lldp_neighbors), $._arguments))),
  clear_lldp_neighbors: $ => seq(
    'neighbors',
    optional(choice(
      prec(1, withArguments($, 'all')),
      prec(1, seq('port', optional(withArguments($, field('ports', $.word_or_string))))),
      $._arguments,
    )),
  ),
});

module.exports = {rules};
