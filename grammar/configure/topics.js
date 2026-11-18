const shared = require('../topics');

// First-level configure families reported by tab completion.
const completionTopics = [
  'access-list', 'account', 'banner', 'bfd', 'bootprelay', 'cdp', 'cfm', 'cli',
  'cos-index', 'debug', 'dhcp', 'diffserv', 'dos-protect', 'dot1p', 'eaps', 'edp',
  'egress', 'elrp-client', 'elsm', 'erps', 'esrp', 'failsafe-account', 'fdb', 'fip',
  'flow-redirect', 'forwarding', 'identity-management', 'idletimeout', 'igmp',
  'inline-power', 'ip', 'ip-fix', 'ip-mtu', 'ip-security', 'iparp', 'ipforwarding',
  'ipmcforwarding', 'ipmroute', 'iproute', 'ipv6', 'irdp', 'jumbo-frame-size',
  'l2pt', 'l2vpn', 'lacp', 'ldap', 'lldp', 'log', 'mac-lockdown-timeout',
  'mac-locking', 'mcast', 'meter', 'mirror', 'mlag', 'mld', 'mrp', 'mstp', 'mvr',
  'mvrp', 'neighbor-discovery', 'netlogin', 'ntp', 'pim', 'policy', 'ports', 'power',
  'private-vlan', 'protocol', 'qosprofile', 'qosscheduler', 'radius',
  'radius-accounting', 'rip', 'ripng', 'safe-default-script', 'security', 'sflow',
  'sharing', 'snmpv3', 'ssh2', 'sshd2', 'ssl', 'stacking', 'stpd',
  'sys-health-check', 'syslog', 'tacacs', 'tacacs-accounting', 'tech-support',
  'telnet', 'time', 'timezone', 'trusted-ports', 'trusted-servers', 'twamp', 'upm',
  'vm-tracking', 'vman', 'vpls', 'vr', 'web', 'xml-notification',
];

const ruleName = topic => topic === 'sys-recovery-level'
  ? 'configure_sys_recovery'
  : shared.ruleName('configure', topic);

const topics = detailed => shared.list('configure', completionTopics, detailed);

const rules = names => shared.rules('configure', names);

module.exports = {topics, ruleName, rules};
