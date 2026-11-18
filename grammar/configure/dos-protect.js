const {argument, options, value} = require('../arguments');

const defaultOrValue = ($, name) => field(name, choice('default', $.word_or_string));
const ports = $ => field('ports', choice('all', $.word_or_string));

const rules = () => ({
  configure_dos_protect: $ => seq('dos-protect', options($,
    $.configure_dos_protect_acl_expire_time,
    $.configure_dos_protect_interval,
    $.configure_dos_protect_trusted_ports,
    $.configure_dos_protect_type,
  )),
  configure_dos_protect_acl_expire_time: $ => argument($, 'acl-expire-time', defaultOrValue($, 'seconds')),
  configure_dos_protect_interval: $ => argument($, 'interval', defaultOrValue($, 'interval_seconds')),
  configure_dos_protect_trusted_ports: $ => seq('trusted-ports', options($,
    $.configure_dos_protect_trusted_ports_add,
    $.configure_dos_protect_trusted_ports_delete,
    argument($, 'ports', value($, 'ports')),
  )),
  configure_dos_protect_trusted_ports_add: $ => argument($, 'add-ports', ports($)),
  configure_dos_protect_trusted_ports_delete: $ => argument($, 'delete-ports', ports($)),
  configure_dos_protect_type: $ => seq('type', options($, $.configure_dos_protect_l3_protect)),
  configure_dos_protect_l3_protect: $ => seq('l3-protect', options($,
    argument($, 'alert-threshold', defaultOrValue($, 'level')),
    argument($, 'notify-threshold', defaultOrValue($, 'level')),
  )),
});

module.exports = {rules};
