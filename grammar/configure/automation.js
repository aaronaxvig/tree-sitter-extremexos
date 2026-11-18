const rules = () => ({
  configure_automation: $ => seq(
    'automation',
    optional(choice(prec(1, $.configure_automation_edge), $._arguments)),
  ),

  configure_automation_edge: $ => seq(
    'edge',
    optional(choice(
      prec(1, $.configure_automation_edge_connect),
      prec(1, $.configure_automation_edge_disconnect),
      $._arguments,
    )),
  ),

  configure_automation_edge_connect: $ => seq('connect', optional($._configure_automation_edge_database_arguments)),

  _configure_automation_edge_database_arguments: $ => choice(prec(1, $.configure_automation_edge_database), $._arguments),

  configure_automation_edge_database: $ => seq(
    'database',
    optional(seq(field('database_name', $.word_or_string), optional($._arguments))),
  ),

  configure_automation_edge_disconnect: $ => seq(
    'disconnect',
    optional($._configure_automation_edge_database_arguments),
  ),
});

module.exports = {rules};
