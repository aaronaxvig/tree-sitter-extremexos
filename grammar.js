/**
 * @file Configuration syntax for Extreme Networks switches running ExtremeXOS
 * @author Aaron Axvig <aaron@axvigs.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// These topics have stable nodes now and can be fleshed out in place over time.
const GENERIC_CONFIGURE_TOPICS = [
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
  'vlan', 'vm-tracking', 'vman', 'vpls', 'vr', 'web', 'xml-notification',
];

const configureRuleName = topic => `configure_${topic.replaceAll('-', '_')}`;

const genericConfigureRules = () => Object.fromEntries(
  GENERIC_CONFIGURE_TOPICS.map(topic => [
    configureRuleName(topic),
    $ => seq(topic, optional($._arguments)),
  ]),
);

module.exports = grammar({
  name: "extremexos",

  // Newlines terminate EXOS commands and therefore cannot be extras.
  extras: _ => [/[\t \f]/],

  rules: {
    source_file: $ => repeat(choice(
      $.section_header,
      $.command,
      $.comment,
      $._newline,
    )),

    // EXOS exports use a three-comment banner before each configuration module.
    section_header: _ => token(prec(2, seq(
      '#', /\r?\n/,
      '#', /[^\r\n]*Module[^\r\n]*configuration\.[^\r\n]*/, /\r?\n/,
      '#', /\r?\n/,
    ))),

    command: $ => choice(
      $.configure_command,
      $.create_command,
      $.enable_command,
      $.disable_command,
      $.unconfigure_command,
      $.delete_command,
      $.generic_command,
    ),

    configure_command: $ => seq(
      'configure',
      choice(
        prec(1, $.configure_snmp),
        prec(1, $.configure_dns_client),
        prec(1, $.configure_sntp_client),
        prec(1, $.configure_diagnostics),
        prec(1, $.configure_sys_recovery),
        ...GENERIC_CONFIGURE_TOPICS.map(topic => prec(1, $[configureRuleName(topic)])),
        $.configure_generic,
      ),
      $._newline,
    ),

    // Unknown future topics and dynamic interactive shortcuts remain lossless.
    configure_generic: $ => seq(
      field('target', $.word),
      optional($._arguments),
    ),

    ...genericConfigureRules(),

    configure_snmp: $ => seq(
      'snmp',
      choice(
        $.configure_snmp_sys_name,
        $.configure_snmp_sys_contact,
        $.configure_snmp_sys_location,
        $._arguments,
      ),
    ),

    configure_snmp_sys_name: $ => seq('sysName', $.word_or_string),
    configure_snmp_sys_contact: $ => seq('sysContact', $.word_or_string),
    configure_snmp_sys_location: $ => seq('sysLocation', $.word_or_string),

    configure_dns_client: $ => seq(
      'dns-client',
      choice($.dns_client_name_server, $.dns_client_domain_suffix),
    ),

    dns_client_name_server: $ => seq(
      'add',
      'name-server',
      field('address', $.word),
      optional(seq('vr', field('virtual_router', $.word))),
    ),

    dns_client_domain_suffix: $ => seq(
      'add',
      'domain-suffix',
      field('domain', $.word),
    ),

    configure_sntp_client: $ => seq(
      'sntp-client',
      $.sntp_client_server,
    ),

    sntp_client_server: $ => seq(
      field('role', choice('primary', 'secondary')),
      field('hostname', $.word),
      optional(seq('vr', field('virtual_router', $.word))),
    ),

    configure_diagnostics: $ => seq('diagnostics', 'privilege', $.word),
    configure_sys_recovery: $ => seq('sys-recovery-level', $.word, $.word),

    create_command: $ => seq('create', optional($._arguments), $._newline),
    enable_command: $ => seq('enable', optional($._arguments), $._newline),
    disable_command: $ => seq('disable', optional($._arguments), $._newline),
    unconfigure_command: $ => seq('unconfigure', optional($._arguments), $._newline),
    delete_command: $ => seq('delete', optional($._arguments), $._newline),

    // Retain unknown EXOS commands losslessly while the detailed grammar grows.
    generic_command: $ => seq($.word, optional($._arguments), $._newline),
    _arguments: $ => repeat1($.word_or_string),
    word_or_string: $ => choice($.string, $.word),
    word: _ => /[^\s"']+/,
    string: _ => token(seq('"', repeat(choice(/[^"\\\r\n]+/, /\\./)), '"')),

    comment: $ => seq(token(seq('#', /[^\r\n]*/)), $._newline),
    _newline: _ => /\r?\n/,
  },
});
