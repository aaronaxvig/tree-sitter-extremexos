const rules = () => ({
  configure_ntp: $ => seq(
    'ntp',
    optional(choice(
      prec(1, $.configure_ntp_key),
      prec(1, $.configure_ntp_local_clock),
      prec(1, $.configure_ntp_peer),
      prec(1, $.configure_ntp_restrict_list),
      prec(1, $.configure_ntp_server),
      prec(1, $.configure_ntp_vr),
      $._arguments,
    )),
  ),

  configure_ntp_key: $ => seq(
    'key',
    optional(seq(
      field('keyid', $.word_or_string),
      optional(choice(
        seq(choice('not-trusted', 'trusted'), optional($._arguments)),
        $._arguments,
      )),
    )),
  ),

  configure_ntp_local_clock: $ => seq(
    'local-clock',
    optional(choice(
      prec(1, $.configure_ntp_local_clock_none),
      prec(1, $.configure_ntp_local_clock_stratum),
      $._arguments,
    )),
  ),

  configure_ntp_local_clock_none: $ => seq('none', optional($._arguments)),

  configure_ntp_local_clock_stratum: $ => seq(
    'stratum',
    optional(seq(field('stratum_number', $.word_or_string), optional($._arguments))),
  ),

  configure_ntp_peer: $ => seq('peer', optional($._configure_ntp_add_or_delete_arguments)),

  _configure_ntp_add_or_delete_arguments: $ => choice(
    prec(1, $.configure_ntp_add),
    prec(1, $.configure_ntp_delete),
    $._arguments,
  ),

  configure_ntp_add: $ => seq(
    'add',
    optional(seq(
      field('argument', $.word_or_string),
      optional(choice(
        prec(1, $.configure_ntp_add_burst),
        prec(1, $.configure_ntp_add_initial_burst),
        prec(1, $.configure_ntp_add_key),
        prec(1, $.configure_ntp_add_vr),
        seq(field('vr_name', $.word_or_string), optional($._arguments)),
      )),
    )),
  ),

  configure_ntp_add_burst: $ => seq('burst', optional($._configure_ntp_vr_name_or_vr_arguments)),

  _configure_ntp_vr_name_or_vr_arguments: $ => choice(
    prec(1, $.configure_ntp_vr),
    seq(field('vr_name', $.word_or_string), optional($._arguments)),
  ),

  configure_ntp_vr: $ => seq('vr', optional($._configure_ntp_vr_name_arguments)),

  _configure_ntp_vr_name_arguments: $ => seq(field('vr_name', $.word_or_string), optional($._arguments)),

  configure_ntp_add_initial_burst: $ => seq('initial-burst', optional($._configure_ntp_vr_name_or_vr_arguments)),

  configure_ntp_add_key: $ => seq(
    'key',
    optional(seq(
      field('keyid', $.word_or_string),
      optional(choice(
        prec(1, $.configure_ntp_add_key_burst),
        prec(1, $.configure_ntp_add_key_initial_burst),
        prec(1, $.configure_ntp_add_key_vr),
        seq(field('vr_name', $.word_or_string), optional($._arguments)),
      )),
    )),
  ),

  configure_ntp_add_key_burst: $ => seq('burst', optional($._configure_ntp_vr_name_or_vr_arguments)),

  configure_ntp_add_key_initial_burst: $ => seq('initial-burst', optional($._configure_ntp_vr_name_or_vr_arguments)),

  configure_ntp_add_key_vr: $ => seq('vr', optional($._configure_ntp_vr_name_arguments)),

  configure_ntp_add_vr: $ => seq('vr', optional($._configure_ntp_vr_name_arguments)),

  configure_ntp_delete: $ => seq(
    'delete',
    optional(seq(field('argument', $.word_or_string), optional($._arguments))),
  ),

  configure_ntp_restrict_list: $ => seq(
    'restrict-list',
    optional(choice(
      prec(1, $.configure_ntp_restrict_list_add),
      prec(1, $.configure_ntp_restrict_list_delete),
      $._arguments,
    )),
  ),

  configure_ntp_restrict_list_add: $ => seq('add', optional($._configure_ntp_restrict_list_network_arguments)),

  _configure_ntp_restrict_list_network_arguments: $ => seq(
    field('network', $.word_or_string),
    optional(choice(
      prec(1, $.configure_ntp_restrict_list_deny),
      prec(1, $.configure_ntp_restrict_list_permit),
      seq(
        field('mask', $.word_or_string),
        optional(choice(
          prec(1, $.configure_ntp_restrict_list_deny),
          prec(1, $.configure_ntp_restrict_list_permit),
          $._arguments,
        )),
      ),
    )),
  ),

  configure_ntp_restrict_list_deny: $ => seq('deny', optional($._configure_ntp_vr_name_or_vr_arguments)),

  configure_ntp_restrict_list_permit: $ => seq('permit', optional($._configure_ntp_vr_name_or_vr_arguments)),

  configure_ntp_restrict_list_delete: $ => seq('delete', optional($._configure_ntp_restrict_list_network_arguments)),

  configure_ntp_server: $ => seq('server', optional($._configure_ntp_add_or_delete_arguments)),
});

module.exports = {rules};
