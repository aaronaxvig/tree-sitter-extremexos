const edgeOperation = ($, keyword) => seq(
  keyword,
  optional(choice(
    prec(1, $.configure_automation_edge_database),
    $.configure_automation_extra_arguments,
  )),
);

const rules = () => ({
  configure_automation: $ => seq(
    'automation',
    optional(choice(
      prec(1, $.configure_automation_edge),
      $.configure_automation_extra_arguments,
    )),
  ),

  // Both operations share the database operand described in edgeAuto.xml.
  configure_automation_edge: $ => seq(
    'edge',
    optional(choice(
      prec(1, $.configure_automation_edge_connect),
      prec(1, $.configure_automation_edge_disconnect),
      $.configure_automation_extra_arguments,
    )),
  ),

  configure_automation_edge_connect: $ => edgeOperation($, 'connect'),
  configure_automation_edge_disconnect: $ => edgeOperation($, 'disconnect'),

  configure_automation_edge_database: $ => seq(
    'database',
    optional(seq(
      field('database_name', $.word_or_string),
      optional($.configure_automation_extra_arguments),
    )),
  ),

  configure_automation_extra_arguments: $ => $._arguments,
});

module.exports = {rules};
