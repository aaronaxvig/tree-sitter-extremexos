const {argument, options: tail, value, withArguments: finish} = require('./arguments');

const ports = $ => field('ports', choice('all', $.word_or_string));
const vlan = $ => value($, 'vlan');
const user = $ => value($, 'user');
const setting = $ => field('state', choice('on', 'off', $.word_or_string));

const words = (...tokens) => tokens.length === 1 ? tokens[0] : choice(...tokens);

const ordered = ($, ...options) => seq(...options.map(option => optional(option)), optional($._arguments));

const agent = ($, agents = ['dot1x', 'mac', 'web-based']) =>
  argument($, 'agent', field('agent', words(...agents)));

const databaseOrder = $ => seq(
  'authentication', optional(seq(
    'database-order',
    tail($, seq('local', optional('radius'), optional($._arguments)),
      seq('radius', optional('local'), optional($._arguments))),
  )),
);

const timeouts = $ => optional(seq(
  optional(field('agent', choice('convergence-endpoint', 'dot1x', 'mac', 'web-based'))),
  optional(value($, 'timeout')),
));

const securityProfile = ($, following) => argument($, 'security-profile', value($, 'security_profile'), following);

const vlanVsa = ($, following = optional($._arguments), allowNone = false) => seq(
  'vlan-vsa',
  tail($,
    ...['tagged', 'untagged'].map(mode => argument($, mode, vlan($), following)),
    ...(allowNone ? [finish($, 'none')] : []),
    seq(vlan($), following),
  ),
);

// Each immediate NetLogin branch has a stable node even when its arguments are incomplete.
const family = (verb, branches) => {
  const name = keyword => `${verb}_netlogin_${keyword.replaceAll('-', '_')}`;
  return {
    [`${verb}_netlogin`]: $ => seq('netlogin', tail($, ...Object.keys(branches).map(keyword => $[name(keyword)]))),
    ...Object.fromEntries(Object.entries(branches).map(([keyword, definition]) => [
      name(keyword),
      $ => seq(keyword, definition($)),
    ])),
  };
};

const authenticationToggle = $ => tail($, seq(
  choice('failure', 'service-unavailable'),
  optional(seq('vlan', tail($, argument($, 'ports', ports($))))),
));

const toggle = verb => family(verb, {
  authentication: authenticationToggle,
  dot1x: $ => tail($,
    seq('mac', optional('web-based'), optional($._arguments)),
    finish($, 'web-based'),
    seq('guest-vlan', tail($, argument($, 'ports', ports($)))),
  ),
  'logout-privilege': $ => optional($._arguments),
  mac: $ => tail($, finish($, 'web-based')),
  ports: $ => optional(seq(ports($), ordered($, 'dot1x', 'mac', 'web-based'))),
  'reauthenticate-on-refresh': $ => optional($._arguments),
  'redirect-page': $ => optional($._arguments),
  'session-refresh': $ => verb === 'enable'
    ? optional(seq(value($, 'refresh_minutes'), optional($._arguments)))
    : optional($._arguments),
  'web-based': $ => optional($._arguments),
});

module.exports = {
  agent, argument, databaseOrder, family, finish, ordered, ports, securityProfile, setting,
  tail, timeouts, toggle, user, value, vlan, vlanVsa,
};
