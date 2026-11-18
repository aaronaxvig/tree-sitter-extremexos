const {agent, argument, family, finish, tail, user, value, vlan} = require('../netlogin');

const dot1xDetail = $ => seq('dot1x', tail($, finish($, 'detail')));

const sessionAgent = $ => agent($, ['convergence-endpoint', 'dot1x', 'mac', 'web-based']);
const sessionPorts = $ => argument($, 'ports', value($, 'ports'), tail($, sessionAgent($)));

const session = $ => {
  const filters = [
    argument($, 'mac-address', value($, 'mac_address'), tail($, sessionAgent($), sessionPorts($))),
    sessionAgent($),
    sessionPorts($),
  ];
  return tail($, seq(choice('summary', 'all'), tail($, ...filters)), ...filters);
};

const rules = () => family('show', {
  authentication: $ => tail($, seq(choice('failure', 'service-unavailable'), tail($, argument($, 'vlan', vlan($))))),
  banner: $ => optional($._arguments),
  dot1x: $ => tail($, finish($, 'detail'), finish($, 'web-based'), seq('mac', tail($, finish($, 'web-based')))),
  'guest-vlan': $ => optional(seq(vlan($), optional($._arguments))),
  'local-users': $ => tail($, finish($, 'detail'), seq(user($), optional($._arguments))),
  mac: $ => tail($, finish($, 'web-based')),
  'mac-list': $ => optional($._arguments),
  port: $ => optional(seq(value($, 'ports'), tail($, dot1xDetail($), argument($, 'vlan', vlan($), tail($, dot1xDetail($)))))),
  session,
  timeout: $ => optional($._arguments),
  trap: $ => optional($._arguments),
  vlan: $ => optional(seq(vlan($), tail($, dot1xDetail($)))),
  'web-based': $ => optional($._arguments),
});

module.exports = {rules};
