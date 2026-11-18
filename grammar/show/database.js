const {argument, value} = require('../arguments');

const rules = () => ({
  show_database: $ => argument($, 'database', value($, 'database_name')),
});

module.exports = {rules};
