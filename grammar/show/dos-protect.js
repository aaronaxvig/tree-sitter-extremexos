const {options, withArguments} = require('../arguments');

const rules = () => ({
  show_dos_protect: $ => seq('dos-protect', options($, withArguments($, 'detail'))),
});

module.exports = {rules};
