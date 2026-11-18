const {argument, options, value, withArguments} = require('../arguments');

const rules = () => ({
  clear_elsm: $ => seq('elsm', options($, $.clear_elsm_counters, $.clear_elsm_ports)),
  clear_elsm_counters: $ => withArguments($, 'counters'),
  clear_elsm_ports: $ => argument(
    $, 'ports', value($, 'ports'), options($, withArguments($, choice('auto-restart', 'counters'))),
  ),
});

module.exports = {rules};
