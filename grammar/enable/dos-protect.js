const {options, withArguments} = require('../arguments');

const rules = () => ({
  enable_dos_protect: $ => seq('dos-protect', options($, withArguments($, 'simulated'))),
});

module.exports = {rules};
