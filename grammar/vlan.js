const actions = [
  'add', 'delete', 'description', 'dhcp-address-range', 'dhcp-lease-timer',
  'dhcp-options', 'ipaddress', 'name', 'netlogin-lease-timer', 'none', 'ports',
  'protocol', 'qosprofile', 'router-discovery', 'subvlan-address-range', 'tag',
  'udp-profile', 'vlan-translation',
];

const actionRuleName = action => `configure_vlan_${action.replaceAll('-', '_')}`;

const rules = () => ({
  configure_vlan: $ => seq(
    'vlan',
    choice(
      $.configure_vlan_dynamic,
      seq(
        field('vlan', $.vlan_reference),
        optional(choice(
          ...actions.map(action => $[actionRuleName(action)]),
          $.configure_vlan_action_generic,
        )),
      ),
    ),
  ),

  configure_vlan_dynamic: $ => seq('dynamic-vlan', optional($._arguments)),

  vlan_reference: $ => choice($.string, $.vlan_list, $.vlan_id, $.word),
  vlan_id: _ => token(prec(2, /[0-9]+/)),
  vlan_list: _ => token(prec(3, /[0-9]+(?:[-,][0-9]+)+/)),

  configure_vlan_action_generic: $ => seq(
    field('action', $.word),
    optional($._arguments),
  ),

  ...Object.fromEntries(actions.map(action => [
    actionRuleName(action),
    $ => seq(action, optional($._arguments)),
  ])),
});

module.exports = {rules};
