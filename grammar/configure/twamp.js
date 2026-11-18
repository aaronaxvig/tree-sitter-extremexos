const {argument, options, value} = require('../arguments');

const rules = () => ({
  configure_twamp: $ => seq('twamp', options($, $.configure_twamp_add, $.configure_twamp_delete, $.configure_twamp_reflector)),
  configure_twamp_add: $ => seq('add', options($, $.configure_twamp_endpoint)),
  configure_twamp_delete: $ => seq('delete', options($, $.configure_twamp_endpoint)),
  configure_twamp_endpoint: $ => seq('endpoint', options($, $.configure_twamp_endpoint_ipaddress)),
  configure_twamp_endpoint_ipaddress: $ => argument(
    $, 'ipaddress', value($, 'src_ip'), options($, $.configure_twamp_endpoint_port),
  ),
  configure_twamp_endpoint_port: $ => argument($, 'port', value($, 'src_port')),
  configure_twamp_reflector: $ => seq(
    'reflector', options($, $.configure_twamp_reflector_sessions, $.configure_twamp_reflector_timeout),
  ),
  configure_twamp_reflector_sessions: $ => argument(
    $, 'sessions', value($, 'total'), options($, $.configure_twamp_reflector_timeout),
  ),
  configure_twamp_reflector_timeout: $ => argument($, 'timeout', value($, 'seconds')),
});

module.exports = {rules};
