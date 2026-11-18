const firmware = require('../firmware/rules');

// First-level enable families reported by EXOS tab completion.
const completionTopics = [
  'access-list', 'account', 'bfd', 'bootp', 'bootprelay', 'cdp', 'cfm',
  'clear-flow', 'cli', 'cli-config-logging', 'clipaging', 'cpu-monitoring',
  'dhcp', 'diffserv', 'dos-protect', 'dot1p', 'eaps', 'edp', 'elrp-client',
  'elsm', 'erps', 'esrp', 'ethernet', 'fdb', 'fip', 'flooding', 'flow-control',
  'icmp', 'identity-management', 'idletimeout', 'igmp', 'inline-power',
  'ip-fix', 'ip-option', 'ip-security', 'iparp', 'ipforwarding',
  'ipmcforwarding', 'iproute', 'irdp', 'jumbo-frame', 'learning', 'led',
  'license', 'lldp', 'log', 'loopback-mode', 'mac-lockdown-timeout',
  'mac-locking', 'mirror', 'mlag', 'mld', 'mvr', 'mvrp', 'neighbor-discovery',
  'netlogin', 'ntp', 'pim', 'policy', 'ports', 'radius', 'radius-accounting',
  'rip', 'ripng', 'rmon', 'router-discovery', 'sflow', 'sharing',
  'smartredundancy', 'snmp', 'snmpv3', 'sntp-client', 'ssh2', 'stacking',
  'stpd', 'subvlan-proxy-arp', 'syslog', 'tacacs', 'tacacs-accounting',
  'tacacs-authorization', 'tech-support', 'telnet', 'twamp', 'udp-echo-server',
  'upm', 'vlan', 'vm-tracking', 'vman', 'watchdog', 'web', 'xml-mode',
  'xml-notification',
];

const topics = [...new Set([...completionTopics, ...firmware.topics('enable')])];
const ruleName = topic => `enable_${topic.replaceAll('-', '_')}`;

const rules = () => ({
  enable_command: $ => seq(
    'enable',
    optional(choice(
      ...topics.map(topic => prec(1, $[ruleName(topic)])),
      $.enable_generic,
    )),
  ),

  enable_generic: $ => seq(
    field('target', $.word_or_string),
    optional($._arguments),
  ),

  ...Object.fromEntries(topics.map(topic => [
    ruleName(topic),
    $ => seq(topic, optional(firmware.familyArguments($, 'enable', topic))),
  ])),
});

module.exports = {rules};
