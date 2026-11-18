const {argument, options, value, withArguments} = require('../arguments');

const rules = () => ({
  show_automation: $ => seq('automation', options($, $.show_automation_edge)),
  show_automation_edge: $ => seq('edge', options($, $.show_automation_edge_database, $.show_automation_edge_devices)),
  show_automation_edge_database: $ => withArguments($, 'database'),
  show_automation_edge_devices: $ => seq('devices', options($, argument($, 'vni', value($, 'vni')))),
});

module.exports = {rules};
