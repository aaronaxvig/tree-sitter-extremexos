const {family, user} = require('../netlogin');

const rules = () => family('delete', {
  'local-user': $ => optional(seq(user($), optional($._arguments))),
});

module.exports = {rules};
