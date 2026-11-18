const rules = () => ({
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
});

module.exports = {rules};
