const {argument, options, value, withArguments} = require('../arguments');

const rules = () => ({
  show_keychain: $ => argument($, 'keychain', value($, 'keychain_name'), options($, withArguments($, 'detail'))),
});

module.exports = {rules};
