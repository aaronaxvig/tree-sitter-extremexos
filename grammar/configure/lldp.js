function optionalAddresses($, count) {
  let continuation = optional($._arguments);
  for (let index = count; index > 0; index--) {
    continuation = optional(seq(
      field(`ip_address${index}`, $.word_or_string),
      continuation,
    ));
  }
  return continuation;
}

const rules = () => ({
  configure_lldp: $ => seq(
    'lldp',
    optional(choice(
      prec(1, $.configure_lldp_management_address),
      prec(1, $.configure_lldp_med),
      prec(1, $.configure_lldp_ports),
      prec(1, $.configure_lldp_reinitialize_delay),
      prec(1, $.configure_lldp_snmp_notification_interval),
      prec(1, $.configure_lldp_transmit_delay),
      prec(1, $.configure_lldp_transmit_hold),
      prec(1, $.configure_lldp_transmit_interval),
      $._arguments,
    )),
  ),

  configure_lldp_management_address: $ => seq(
    'management-address',
    optional(choice(
      prec(1, $.configure_lldp_management_address_mac_address),
      prec(1, $.configure_lldp_management_address_vlan),
      seq(
        field('vlan_name', $.word_or_string),
        optional($._configure_lldp_management_address_primary_ip_or_secondary_ip_arguments),
      ),
    )),
  ),

  configure_lldp_management_address_mac_address: $ => seq('mac-address', optional($._arguments)),

  configure_lldp_management_address_vlan: $ => seq(
    'vlan',
    optional(seq(
      field('vlan', $.word_or_string),
      optional($._configure_lldp_management_address_primary_ip_or_secondary_ip_arguments),
    )),
  ),

  _configure_lldp_management_address_primary_ip_or_secondary_ip_arguments: $ => choice(
    prec(1, $.configure_lldp_management_address_primary_ip),
    prec(1, $.configure_lldp_management_address_secondary_ip),
    $._arguments,
  ),

  configure_lldp_management_address_primary_ip: $ => seq('primary-ip', optional($._arguments)),

  configure_lldp_management_address_secondary_ip: $ => seq(
    'secondary-ip',
    optional(seq(
      field('secondary_ip_address', $.word_or_string),
      optional($._arguments),
    )),
  ),

  configure_lldp_med: $ => seq(
    'med',
    optional(choice(prec(1, $.configure_lldp_med_fast_start), $._arguments)),
  ),

  configure_lldp_med_fast_start: $ => seq(
    'fast-start',
    optional(choice(prec(1, $.configure_lldp_med_fast_start_repeat_count), $._arguments)),
  ),

  configure_lldp_med_fast_start_repeat_count: $ => seq(
    'repeat-count',
    optional(seq(field('count', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports: $ => seq(
    'ports',
    optional(seq(
      field('ports', choice('all', $.word_or_string)),
      optional($._configure_lldp_port_options),
    )),
  ),

  _configure_lldp_port_options: $ => choice(
    prec(1, $.configure_lldp_ports_advertise),
    prec(1, $.configure_lldp_ports_dcbx),
    prec(1, $.configure_lldp_ports_no_advertise),
    $._arguments,
  ),

  configure_lldp_ports_advertise: $ => seq(
    'advertise',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_all_tlvs),
      prec(1, $.configure_lldp_ports_advertise_management_address),
      prec(1, $.configure_lldp_ports_advertise_port_description),
      prec(1, $.configure_lldp_ports_advertise_system_capabilities),
      prec(1, $.configure_lldp_ports_advertise_system_description),
      prec(1, $.configure_lldp_ports_advertise_system_name),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_all_tlvs: $ => seq('all-tlvs', optional($._arguments)),

  configure_lldp_ports_advertise_management_address: $ => seq(
    'management-address',
    optional($._configure_lldp_ports_port_description_arguments),
  ),

  _configure_lldp_ports_port_description_arguments: $ => choice(
    prec(1, $.configure_lldp_ports_port_description),
    prec(1, $.configure_lldp_ports_system_capabilities),
    prec(1, $.configure_lldp_ports_system_description),
    prec(1, $.configure_lldp_ports_system_name),
    $._arguments,
  ),

  configure_lldp_ports_port_description: $ => seq(
    'port-description',
    optional($._configure_lldp_ports_system_capabilities_arguments),
  ),

  _configure_lldp_ports_system_capabilities_arguments: $ => choice(
    prec(1, $.configure_lldp_ports_system_capabilities),
    prec(1, $.configure_lldp_ports_system_description),
    prec(1, $.configure_lldp_ports_system_name),
    $._arguments,
  ),

  configure_lldp_ports_system_capabilities: $ => seq(
    'system-capabilities',
    optional($._configure_lldp_ports_system_description_or_system_name_arguments),
  ),

  _configure_lldp_ports_system_description_or_system_name_arguments: $ => choice(
    prec(1, $.configure_lldp_ports_system_description),
    prec(1, $.configure_lldp_ports_system_name),
    $._arguments,
  ),

  configure_lldp_ports_system_description: $ => seq(
    'system-description',
    optional($._configure_lldp_ports_system_name_arguments),
  ),

  _configure_lldp_ports_system_name_arguments: $ => choice(prec(1, $.configure_lldp_ports_system_name), $._arguments),

  configure_lldp_ports_system_name: $ => seq('system-name', optional($._arguments)),

  configure_lldp_ports_advertise_port_description: $ => seq(
    'port-description',
    optional($._configure_lldp_ports_system_capabilities_arguments),
  ),

  configure_lldp_ports_advertise_system_capabilities: $ => seq(
    'system-capabilities',
    optional($._configure_lldp_ports_system_description_or_system_name_arguments),
  ),

  configure_lldp_ports_advertise_system_description: $ => seq(
    'system-description',
    optional($._configure_lldp_ports_system_name_arguments),
  ),

  configure_lldp_ports_advertise_system_name: $ => seq('system-name', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific: $ => seq(
    'vendor-specific',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_avaya_extreme),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dcbx),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dot1),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dot3),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_avaya_extreme: $ => seq(
    'avaya-extreme',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_avaya_extreme_call_server),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_avaya_extreme_dot1q_framing),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_avaya_extreme_file_server),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_avaya_extreme_poe_conservation_request),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_avaya_extreme_call_server: $ => seq(
    'call-server',
    optionalAddresses($, 8),
  ),

  configure_lldp_ports_advertise_vendor_specific_avaya_extreme_dot1q_framing: $ => seq(
    'dot1q-framing',
    optional(choice(
      seq(choice('auto', 'tagged', 'untagged'), optional($._arguments)),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_avaya_extreme_file_server: $ => seq(
    'file-server',
    optionalAddresses($, 4),
  ),

  configure_lldp_ports_advertise_vendor_specific_avaya_extreme_poe_conservation_request: $ => seq('poe-conservation-request', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific_dcbx: $ => seq('dcbx', optional($._configure_lldp_ports_baseline_or_ieee_arguments)),

  _configure_lldp_ports_baseline_or_ieee_arguments: $ => choice(
    seq(choice('baseline', 'ieee'), optional($._arguments)),
    $._arguments,
  ),

  configure_lldp_ports_advertise_vendor_specific_dot1: $ => seq(
    'dot1',
    optional($._configure_lldp_ports_port_protocol_vlan_id_arguments),
  ),

  _configure_lldp_ports_port_protocol_vlan_id_arguments: $ => choice(
    prec(1, $.configure_lldp_ports_port_protocol_vlan_id),
    prec(1, $.configure_lldp_ports_port_vlan_id),
    prec(1, $.configure_lldp_ports_vlan_name),
    $._arguments,
  ),

  configure_lldp_ports_port_protocol_vlan_id: $ => seq(
    'port-protocol-vlan-id',
    optional($._configure_lldp_ports_vlan_arguments),
  ),

  _configure_lldp_ports_vlan_arguments: $ => choice(prec(1, $.configure_lldp_ports_vlan), $._arguments),

  configure_lldp_ports_vlan: $ => seq(
    'vlan',
    optional(choice(
      prec(1, $.configure_lldp_ports_vlan_all),
      seq(field('vlan', $.word_or_string), optional($._arguments)),
    )),
  ),

  configure_lldp_ports_vlan_all: $ => seq('all', optional($._arguments)),

  configure_lldp_ports_port_vlan_id: $ => seq('port-vlan-id', optional($._arguments)),

  configure_lldp_ports_vlan_name: $ => seq('vlan-name', optional($._configure_lldp_ports_vlan_arguments)),

  configure_lldp_ports_advertise_vendor_specific_dot3: $ => seq(
    'dot3',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dot3_link_aggregation),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dot3_mac_phy),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dot3_max_frame_size),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dot3_power_via_mdi),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_dot3_link_aggregation: $ => seq('link-aggregation', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific_dot3_mac_phy: $ => seq('mac-phy', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific_dot3_max_frame_size: $ => seq('max-frame-size', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific_dot3_power_via_mdi: $ => seq(
    'power-via-mdi',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_dot3_power_via_mdi_with_classification),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_dot3_power_via_mdi_with_classification: $ => seq('with-classification', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific_med: $ => seq(
    'med',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_capabilities),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_location_identification),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_policy),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_power_via_mdi),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_capabilities: $ => seq('capabilities', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific_med_location_identification: $ => seq(
    'location-identification',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_location_identification_civic_based),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_location_identification_coordinate_based),
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_location_identification_ecs_elin),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_location_identification_civic_based: $ => seq(
    'civic-based',
    optional(seq(field('ci_value', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_location_identification_coordinate_based: $ => seq(
    'coordinate-based',
    optional(seq(field('co_value', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_location_identification_ecs_elin: $ => seq(
    'ecs-elin',
    optional(seq(field('elin', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_policy: $ => seq(
    'policy',
    optional(choice(
      prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_policy_application),
      $._arguments,
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_policy_application: $ => seq(
    'application',
    optional(seq(
      field('app_type', $.word_or_string),
      optional(choice(
        prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_policy_application_vlan),
        $._arguments,
      )),
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_policy_application_vlan: $ => seq(
    'vlan',
    optional(seq(
      field('vlan', $.word_or_string),
      optional(choice(
        prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_policy_application_vlan_dscp),
        $._arguments,
      )),
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_policy_application_vlan_dscp: $ => seq(
    'dscp',
    optional(seq(
      field('dscp_value', $.word_or_string),
      optional(choice(
        prec(1, $.configure_lldp_ports_advertise_vendor_specific_med_policy_application_vlan_dscp_priority_tagged),
        $._arguments,
      )),
    )),
  ),

  configure_lldp_ports_advertise_vendor_specific_med_policy_application_vlan_dscp_priority_tagged: $ => seq('priority-tagged', optional($._arguments)),

  configure_lldp_ports_advertise_vendor_specific_med_power_via_mdi: $ => seq('power-via-mdi', optional($._arguments)),

  configure_lldp_ports_dcbx: $ => seq(
    'dcbx',
    optional(choice(
      prec(1, $.configure_lldp_ports_dcbx_add),
      prec(1, $.configure_lldp_ports_dcbx_delete),
      $._arguments,
    )),
  ),

  configure_lldp_ports_dcbx_add: $ => seq(
    'add',
    optional(choice(prec(1, $.configure_lldp_ports_dcbx_add_application), $._arguments)),
  ),

  configure_lldp_ports_dcbx_add_application: $ => seq(
    'application',
    optional(choice(
      prec(1, $.configure_lldp_ports_dcbx_add_application_l4_port),
      prec(1, $.configure_lldp_ports_dcbx_add_application_ethertype),
      prec(1, $.configure_lldp_ports_dcbx_add_application_name),
      prec(1, $.configure_lldp_ports_dcbx_add_application_tcp_port),
      prec(1, $.configure_lldp_ports_dcbx_add_application_udp_port),
      $._arguments,
    )),
  ),

  configure_lldp_ports_dcbx_add_application_l4_port: $ => seq(
    'L4-port',
    optional($._configure_lldp_ports_dcbx_add_application_port_number_arguments),
  ),

  _configure_lldp_ports_dcbx_add_application_port_number_arguments: $ => seq(
    field('port_number', $.word_or_string),
    optional($._configure_lldp_ports_dcbx_add_application_priority_arguments),
  ),

  _configure_lldp_ports_dcbx_add_application_priority_arguments: $ => choice(
    prec(1, $.configure_lldp_ports_dcbx_add_application_priority),
    $._arguments,
  ),

  configure_lldp_ports_dcbx_add_application_priority: $ => seq(
    'priority',
    optional(seq(field('priority_value', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports_dcbx_add_application_ethertype: $ => seq(
    'ethertype',
    optional(seq(
      field('ethertype_value', $.word_or_string),
      optional($._configure_lldp_ports_dcbx_add_application_priority_arguments),
    )),
  ),

  configure_lldp_ports_dcbx_add_application_name: $ => seq(
    'name',
    optional(seq(
      field('application_name', $.word_or_string),
      optional($._configure_lldp_ports_dcbx_add_application_priority_arguments),
    )),
  ),

  configure_lldp_ports_dcbx_add_application_tcp_port: $ => seq(
    'tcp-port',
    optional($._configure_lldp_ports_dcbx_add_application_port_number_arguments),
  ),

  configure_lldp_ports_dcbx_add_application_udp_port: $ => seq(
    'udp-port',
    optional($._configure_lldp_ports_dcbx_add_application_port_number_arguments),
  ),

  configure_lldp_ports_dcbx_delete: $ => seq(
    'delete',
    optional(choice(
      prec(1, $.configure_lldp_ports_dcbx_delete_application),
      $._arguments,
    )),
  ),

  configure_lldp_ports_dcbx_delete_application: $ => seq(
    'application',
    optional(choice(
      prec(1, $.configure_lldp_ports_dcbx_delete_application_l4_port),
      prec(1, $.configure_lldp_ports_dcbx_delete_application_all),
      prec(1, $.configure_lldp_ports_dcbx_delete_application_ethertype),
      prec(1, $.configure_lldp_ports_dcbx_delete_application_name),
      prec(1, $.configure_lldp_ports_dcbx_delete_application_tcp_port),
      prec(1, $.configure_lldp_ports_dcbx_delete_application_udp_port),
      $._arguments,
    )),
  ),

  configure_lldp_ports_dcbx_delete_application_l4_port: $ => seq(
    'L4-port',
    optional($._configure_lldp_ports_dcbx_delete_application_port_number_arguments),
  ),

  _configure_lldp_ports_dcbx_delete_application_port_number_arguments: $ => seq(field('port_number', $.word_or_string), optional($._arguments)),

  configure_lldp_ports_dcbx_delete_application_all: $ => seq('all', optional($._arguments)),

  configure_lldp_ports_dcbx_delete_application_ethertype: $ => seq(
    'ethertype',
    optional(seq(field('ethertype_value', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports_dcbx_delete_application_name: $ => seq(
    'name',
    optional(seq(field('application_name', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports_dcbx_delete_application_tcp_port: $ => seq(
    'tcp-port',
    optional($._configure_lldp_ports_dcbx_delete_application_port_number_arguments),
  ),

  configure_lldp_ports_dcbx_delete_application_udp_port: $ => seq(
    'udp-port',
    optional($._configure_lldp_ports_dcbx_delete_application_port_number_arguments),
  ),

  configure_lldp_ports_no_advertise: $ => seq(
    'no-advertise',
    optional(choice(
      prec(1, $.configure_lldp_ports_no_advertise_all_tlvs),
      prec(1, $.configure_lldp_ports_no_advertise_management_address),
      prec(1, $.configure_lldp_ports_no_advertise_port_description),
      prec(1, $.configure_lldp_ports_no_advertise_system_capabilities),
      prec(1, $.configure_lldp_ports_no_advertise_system_description),
      prec(1, $.configure_lldp_ports_no_advertise_system_name),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific),
      $._arguments,
    )),
  ),

  configure_lldp_ports_no_advertise_all_tlvs: $ => seq('all-tlvs', optional($._arguments)),

  configure_lldp_ports_no_advertise_management_address: $ => seq(
    'management-address',
    optional($._configure_lldp_ports_port_description_arguments),
  ),

  configure_lldp_ports_no_advertise_port_description: $ => seq(
    'port-description',
    optional($._configure_lldp_ports_system_capabilities_arguments),
  ),

  configure_lldp_ports_no_advertise_system_capabilities: $ => seq(
    'system-capabilities',
    optional($._configure_lldp_ports_system_description_or_system_name_arguments),
  ),

  configure_lldp_ports_no_advertise_system_description: $ => seq(
    'system-description',
    optional($._configure_lldp_ports_system_name_arguments),
  ),

  configure_lldp_ports_no_advertise_system_name: $ => seq('system-name', optional($._arguments)),

  configure_lldp_ports_no_advertise_vendor_specific: $ => seq(
    'vendor-specific',
    optional(choice(
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_avaya_extreme),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_dcbx),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_dot1),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_dot3),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_med),
      $._arguments,
    )),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_avaya_extreme: $ => seq(
    'avaya-extreme',
    optional(choice(
      seq(
        choice(
          'call-server',
          'dot1q-framing',
          'file-server',
          'poe-conservation-request',
        ),
        optional($._arguments),
      ),
      $._arguments,
    )),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_dcbx: $ => seq('dcbx', optional($._configure_lldp_ports_baseline_or_ieee_arguments)),

  configure_lldp_ports_no_advertise_vendor_specific_dot1: $ => seq(
    'dot1',
    optional($._configure_lldp_ports_port_protocol_vlan_id_arguments),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_dot3: $ => seq(
    'dot3',
    optional(choice(
      seq(
        choice('link-aggregation', 'mac-phy', 'max-frame-size', 'power-via-mdi'),
        optional($._arguments),
      ),
      $._arguments,
    )),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_med: $ => seq(
    'med',
    optional(choice(
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_med_capabilities),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_med_location_identification),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_med_policy),
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_med_power_via_mdi),
      $._arguments,
    )),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_med_capabilities: $ => seq('capabilities', optional($._arguments)),

  configure_lldp_ports_no_advertise_vendor_specific_med_location_identification: $ => seq(
    'location-identification',
    optional(choice(
      seq(
        choice('civic-based', 'coordinate-based', 'ecs-elin'),
        optional($._arguments),
      ),
      $._arguments,
    )),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_med_policy: $ => seq(
    'policy',
    optional(choice(
      prec(1, $.configure_lldp_ports_no_advertise_vendor_specific_med_policy_application),
      $._arguments,
    )),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_med_policy_application: $ => seq(
    'application',
    optional(seq(field('app_type', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_ports_no_advertise_vendor_specific_med_power_via_mdi: $ => seq('power-via-mdi', optional($._arguments)),

  configure_lldp_reinitialize_delay: $ => seq('reinitialize-delay', optional($._configure_lldp_seconds_arguments)),

  _configure_lldp_seconds_arguments: $ => seq(field('seconds', $.word_or_string), optional($._arguments)),

  configure_lldp_snmp_notification_interval: $ => seq(
    'snmp-notification-interval',
    optional($._configure_lldp_seconds_arguments),
  ),

  configure_lldp_transmit_delay: $ => seq(
    'transmit-delay',
    optional(choice(
      prec(1, $.configure_lldp_transmit_delay_auto),
      seq(field('seconds', $.word_or_string), optional($._arguments)),
    )),
  ),

  configure_lldp_transmit_delay_auto: $ => seq('auto', optional($._arguments)),

  configure_lldp_transmit_hold: $ => seq(
    'transmit-hold',
    optional(seq(field('hold', $.word_or_string), optional($._arguments))),
  ),

  configure_lldp_transmit_interval: $ => seq('transmit-interval', optional($._configure_lldp_seconds_arguments)),
});

module.exports = {rules};
