const {argument, options} = require('../arguments');

const rules = () => ({
  show_elsm: $ => seq('elsm', options($, $.show_elsm_ports)),
  show_elsm_ports: $ => argument($, 'ports', field('ports', choice('all', $.word_or_string))),
});

module.exports = {rules};
