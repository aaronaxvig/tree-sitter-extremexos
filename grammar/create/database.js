const {argument, value} = require('../arguments');

const rules = () => ({
  create_database: $ => argument($, 'database', value($, 'database_name')),
});

module.exports = {rules};
