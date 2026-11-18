const actions = [
  'delete', 'description', 'dhcp-address-range', 'dhcp-lease-timer',
  'dhcp-options', 'ipaddress', 'name', 'netlogin-lease-timer', 'none', 'ports',
  'protocol', 'qosprofile', 'router-discovery', 'subvlan-address-range', 'tag',
  'udp-profile', 'vlan-translation',
];

const actionRuleName = action => `configure_vlan_${action.replaceAll('-', '_')}`;

const rules = () => ({
  configure_vlan: $ => seq(
    'vlan',
    optional(choice(
      $.configure_vlan_dynamic,
      seq(
        field('vlan', $.vlan_reference),
        optional(choice(
          prec(1, $.configure_vlan_add),
          ...actions.map(action => $[actionRuleName(action)]),
          $.configure_vlan_action_generic,
        )),
      ),
    )),
  ),

  configure_vlan_dynamic: $ => seq('dynamic-vlan', optional($._arguments)),
  vlan_reference: $ => choice($.string, $.vlan_list, $.vlan_id, $.word),
  vlan_id: _ => token(prec(2, /[0-9]+/)),
  vlan_list: _ => token(prec(3, /[0-9]+(?:[-,][0-9]+)+/)),

  configure_vlan_add: $ => seq(
    'add',
    optional(choice(
      prec(1, $.configure_vlan_add_ports),
      prec(1, $.configure_vlan_add_secondary_ipaddress),
      prec(1, $.configure_vlan_add_subvlan),
      $.configure_vlan_add_generic,
    )),
  ),

  configure_vlan_add_ports: $ => prec.right(seq(
    'ports',
    optional(choice(
      seq(
        field('ports', choice('all', $.port_list)),
        optional($.configure_vlan_port_options),
        optional($.configure_vlan_port_extra_arguments),
      ),
      $.configure_vlan_port_extra_arguments,
    )),
  )),

  configure_vlan_port_extra_arguments: $ => $._arguments,

  port_list: _ => token(/[0-9]+(?::[0-9]+)?(?:-[0-9]+(?::[0-9]+)?)?(?:,[0-9]+(?::[0-9]+)?(?:-[0-9]+(?::[0-9]+)?)?)*/),

  configure_vlan_port_options: $ => prec.right(choice(
    seq(
      field('mode', choice('private-vlan', 'tagged', 'untagged')),
      optional($._vlan_tag_and_stpd),
    ),
    $._vlan_tag_and_stpd,
  )),

  _vlan_tag_and_stpd: $ => prec.right(choice(
    seq(field('tag', $.vlan_id), optional($._vlan_stpd_options)),
    seq($._vlan_stpd_options, optional(field('tag', $.vlan_id))),
  )),

  _vlan_stpd_options: $ => seq(
    $._vlan_stpd_option,
    optional(field('encapsulation', choice('dot1d', 'emistp', 'pvst-plus'))),
  ),

  _vlan_stpd_option: $ => choice(
    prec.right(seq('stpd', optional(field('stpd', $.word_or_string)))),
    prec(1, field('stpd', $.string)),
  ),

  configure_vlan_add_secondary_ipaddress: $ => seq(
    'secondary-ipaddress',
    optional($._arguments),
  ),

  configure_vlan_add_subvlan: $ => seq('subvlan', optional($._arguments)),
  configure_vlan_add_generic: $ => seq($.word, optional($._arguments)),

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
