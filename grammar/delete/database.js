const {argument, value} = require('../arguments');

const rules = () => ({
  delete_database: $ => argument($, 'database', value($, 'database_name')),
});

module.exports = {rules};
