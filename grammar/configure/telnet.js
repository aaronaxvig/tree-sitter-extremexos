const {argument, options, value, withArguments} = require('../arguments');

const rules = () => ({
  configure_telnet: $ => seq('telnet', options($,
    $.configure_telnet_access_profile,
    $.configure_telnet_port,
    $.configure_telnet_vr,
  )),
  configure_telnet_access_profile: $ => seq('access-profile', options($,
    $.configure_telnet_access_profile_add,
    $.configure_telnet_access_profile_delete,
    withArguments($, field('access_profile', choice('none', $.word_or_string))),
  )),
  configure_telnet_access_profile_add: $ => argument($, 'add', value($, 'rule'), options($,
    argument($, field('position', choice('before', 'after')), value($, 'previous_rule')),
    withArguments($, field('position', 'first')),
  )),
  configure_telnet_access_profile_delete: $ => argument($, 'delete', value($, 'rule')),
  configure_telnet_port: $ => argument($, 'port', field('port', choice('default', $.word_or_string))),
  configure_telnet_vr: $ => argument($, 'vr', field('virtual_router', choice('all', 'default', $.word_or_string))),
});

module.exports = {rules};
