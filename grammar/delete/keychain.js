const {argument, value} = require('../arguments');

const rules = () => ({
  delete_keychain: $ => argument($, 'keychain', value($, 'keychain_name')),
});

module.exports = {rules};
