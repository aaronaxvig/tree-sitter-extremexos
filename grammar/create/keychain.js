const {argument, value} = require('../arguments');

const rules = () => ({
  create_keychain: $ => argument($, 'keychain', value($, 'keychain_name')),
});

module.exports = {rules};
