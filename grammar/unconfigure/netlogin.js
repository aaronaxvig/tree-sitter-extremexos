const {argument, family, finish, ports, tail, user, value, vlan} = require('../netlogin');

const vlanOrPorts = $ => tail($,
  argument($, 'ports', value($, 'ports')),
  seq(vlan($), optional($._arguments)),
);
const exchange = $ => tail($, seq('authentication', tail($, finish($, 'database-order'))));
const timeoutAgent = $ => tail($, finish($, choice('convergence-endpoint', 'dot1x', 'mac', 'web-based')));

const rules = () => family('unconfigure', {
  'allowed-refresh-failures': $ => optional($._arguments),
  authentication: $ => tail($,
    seq(choice('failure', 'service-unavailable'), tail($, seq('vlan', vlanOrPorts($)))),
  ),
  banner: $ => optional($._arguments),
  dot1x: $ => tail($, seq('guest-vlan', vlanOrPorts($))),
  'idle-timeout': timeoutAgent,
  'local-user': $ => optional(seq(user($), tail($, finish($, 'security-profile')))),
  mac: exchange,
  ports: $ => optional(seq(ports($), tail($,
    finish($, 'allowed-users'),
    seq('authentication', tail($, finish($, 'mode'))),
  ))),
  'session-refresh': $ => optional($._arguments),
  'session-timeout': timeoutAgent,
  vlan: $ => optional($._arguments),
  'web-based': exchange,
});

module.exports = {rules};
