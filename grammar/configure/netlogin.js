const {
  argument, databaseOrder, family, finish, ordered, ports, securityProfile, setting,
  tail, timeouts, user, value, vlan, vlanVsa,
} = require('../netlogin');

const option = ($, ...choices) => tail($, finish($, choice(...choices)));
const fieldValue = ($, fieldName) => optional(seq(value($, fieldName), optional($._arguments)));
const portList = $ => argument($, 'ports', value($, 'ports'));

// Each timer option can skip ahead to the remaining options, in CLI order.
const timerRules = (prefix, options) => {
  const continuation = index => `_${prefix}_${options[index][0].replaceAll('-', '_')}`;
  return {
    [prefix]: $ => seq('timers', optional($[continuation(0)])),
    ...Object.fromEntries(options.map(([keyword, operand], index) => [
      continuation(index),
      $ => {
        const following = index + 1 < options.length ? $[continuation(index + 1)] : $._arguments;
        return choice(prec(1, argument($, keyword, operand($), optional(following))), following);
      },
    ])),
  };
};

const failureVlan = $ => argument($, 'vlan', vlan($), tail($, portList($)));
const serviceVlan = $ => argument($, 'vlan', vlan($), tail($,
  argument($, 'ports', value($, 'ports'), option($, 'tagged', 'untagged')),
  finish($, choice('tagged', 'untagged')),
));

const protocolOrder = $ => {
  const protocol = field('protocol', choice('cep', 'dot1x', 'mac', 'web-based', 'NULL'));
  return optional(seq(protocol, optional(protocol), optional(protocol), optional(protocol), optional($._arguments)));
};

const macTarget = $ => field('mac_address', choice('default', $.word_or_string));
const mask = $ => field('mask', $.netlogin_mac_mask);
const secret = $ => value($, 'password');
const encrypted = $ => value($, 'encrypted_password');
const macListPortSuffix = $ => tail($, portList($));
const macListAfterPorts = $ => tail($,
  argument($, 'encrypted', encrypted($)),
  seq('password', tail($, argument($, 'encrypted', encrypted($)), secret($))),
  secret($),
);

const macListOptions = $ => [
  argument($, 'ports', value($, 'ports'), macListAfterPorts($)),
  argument($, 'encrypted', encrypted($), macListPortSuffix($)),
  seq('password', tail($,
    argument($, 'encrypted', encrypted($), macListPortSuffix($)),
    portList($),
    seq(secret($), macListPortSuffix($)),
  )),
  seq(secret($), macListPortSuffix($)),
];

const portOptions = $ => tail($,
  seq('allow', tail($, seq('egress-traffic', option($, 'all_cast', 'broadcast', 'none', 'unicast')))),
  argument($, 'allowed-users', value($, 'allowed_users')),
  seq('authentication', tail($, seq('mode', option($, 'optional', 'required')))),
  seq('mode', option($, 'mac-based-vlans', 'port-based-vlans')),
  finish($, choice('restart', 'no-restart')),
  seq('trap', optional(choice(
    prec(1, finish($, choice('all-traps', 'no-traps'))),
    ordered($, 'success', 'failed', 'terminated', 'max-reached'),
  ))),
);

const rules = () => ({
  ...family('configure', {
    add: $ => tail($, $.configure_netlogin_add_mac_list,
      argument($, 'proxy-port', value($, 'tcp_port'), option($, 'http', 'https'))),
    agingtime: $ => fieldValue($, 'minutes'),
    'allowed-refresh-failures': $ => fieldValue($, 'num_failures'),
    authentication: $ => tail($,
      $.configure_netlogin_authentication_failure,
      $.configure_netlogin_authentication_protocol_order,
      $.configure_netlogin_authentication_service_unavailable,
    ),
    banner: $ => fieldValue($, 'banner'),
    'base-url': $ => fieldValue($, 'base_url'),
    delete: $ => tail($,
      argument($, 'mac-list', macTarget($), tail($, finish($, mask($)))),
      argument($, 'proxy-port', value($, 'tcp_port')),
    ),
    dot1x: $ => tail($,
      seq('eapol-transmit-version', option($, 'v1', 'v2')),
      argument($, 'guest-vlan', vlan($), tail($, portList($))),
      $.configure_netlogin_dot1x_ports,
      argument($, 'radius-accounting', setting($)),
      argument($, 'tag-eapol', setting($)),
      $.configure_netlogin_dot1x_timers,
    ),
    'dynamic-vlan': $ => tail($,
      finish($, choice('disable', 'enable')),
      argument($, 'uplink-ports', field('ports', choice('none', $.word_or_string))),
    ),
    'idle-timeout': timeouts,
    'local-user': $ => optional(seq(user($), tail($, securityProfile($), vlanVsa($, undefined, true)))),
    mac: $ => tail($,
      databaseOrder($),
      argument($, 'ports', ports($), tail($, $.configure_netlogin_mac_port_timers)),
      seq('timers', tail($, argument($, 'reauth-period', value($, 'reauth_period')))),
      seq('username', tail($,
        seq('case', option($, 'lower', 'upper')),
        seq('format', option($, 'colon-separated', 'hyphenated', 'none')),
      )),
    ),
    'move-fail-action': $ => option($, 'authenticate', 'deny'),
    ports: $ => optional(seq(ports($), portOptions($))),
    'redirect-page': $ => fieldValue($, 'redirect_page'),
    'session-refresh': $ => fieldValue($, 'refresh_seconds'),
    'session-timeout': timeouts,
    trap: $ => tail($, seq('max-users', option($, 'disable', 'enable'))),
    vlan: $ => fieldValue($, 'vlan'),
    'web-based': $ => tail($, databaseOrder($)),
  }),
  configure_netlogin_add_mac_list: $ => argument($, 'mac-list', macTarget($), optional(choice(
    prec(1, seq(mask($), optional($._configure_netlogin_mac_list_options))),
    $._configure_netlogin_mac_list_options,
  ))),
  _configure_netlogin_mac_list_options: $ => choice(
    ...macListOptions($).map(branch => prec(1, branch)),
    $._arguments,
  ),
  configure_netlogin_authentication_failure: $ => seq('failure', tail($, failureVlan($))),
  configure_netlogin_authentication_protocol_order: $ => seq('protocol-order', protocolOrder($)),
  configure_netlogin_authentication_service_unavailable: $ => seq('service-unavailable', tail($,
    seq('add', tail($, serviceVlan($))),
    seq('delete', tail($, failureVlan($))),
    serviceVlan($),
  )),
  configure_netlogin_dot1x_ports: $ => argument($, 'ports', ports($), tail($, $.configure_netlogin_dot1x_timers)),
  ...timerRules('configure_netlogin_dot1x_timers', [
    ['server-timeout', $ => value($, 'server_timeout')],
    ['quiet-period', $ => value($, 'quiet_period')],
    ['reauth-period', $ => value($, 'reauth_period')],
    ['reauth-max', $ => value($, 'max_num_reauths')],
    ['reauthentication', setting],
    ['supp-resp-timeout', $ => value($, 'supp_resp_timeout')],
  ]),
  ...timerRules('configure_netlogin_mac_port_timers', [
    ['reauth-period', $ => value($, 'reauth_period')],
    ['reauthentication', setting],
    ['delay', $ => value($, 'delay')],
  ]),
  netlogin_mac_mask: _ => /[0-9]+/,
});

module.exports = {rules};
