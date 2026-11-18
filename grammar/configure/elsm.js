const {argument, options, value, withArguments} = require('../arguments');

const rules = () => ({
  configure_elsm: $ => seq('elsm', options($, $.configure_elsm_ports)),
  configure_elsm_ports: $ => argument($, 'ports', value($, 'ports'), options($,
    $.configure_elsm_ports_hellotime,
    $.configure_elsm_ports_hold_threshold,
    $.configure_elsm_ports_uptimer_threshold,
  )),
  configure_elsm_ports_hellotime: $ => argument($, 'hellotime', value($, 'hello_time'), options($,
    withArguments($, field('unit', choice('milliseconds', 'seconds'))),
  )),
  configure_elsm_ports_hold_threshold: $ => argument($, 'hold-threshold', value($, 'hold_threshold')),
  configure_elsm_ports_uptimer_threshold: $ => argument($, 'uptimer-threshold', value($, 'uptimer_threshold')),
});

module.exports = {rules};
