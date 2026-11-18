const {argument, options, withArguments} = require('../arguments');

const rules = () => ({
  debug_telnetd: $ => seq('telnetd', options($, $.debug_telnetd_configure, $.debug_telnetd_show)),
  debug_telnetd_configure: $ => seq('configure', options($,
    argument($, 'debug-level', field('level', choice('off', $.word_or_string))),
  )),
  debug_telnetd_show: $ => seq('show', options($, withArguments($, 'access-profile'))),
});

module.exports = {rules};
