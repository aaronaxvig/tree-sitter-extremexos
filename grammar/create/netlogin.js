const {argument, family, securityProfile, tail, user, value, vlanVsa} = require('../netlogin');

const password = $ => tail($, argument($, 'encrypted', value($, 'encrypted_password')), value($, 'password'));

const attributes = $ => tail($,
  securityProfile($, password($)),
  argument($, 'encrypted', value($, 'encrypted_password')),
  value($, 'password'),
);

const rules = () => family('create', {
  'local-user': $ => optional(seq(user($), tail($,
    vlanVsa($, attributes($)),
    securityProfile($, password($)),
    argument($, 'encrypted', value($, 'encrypted_password')),
    value($, 'password'),
  ))),
});

module.exports = {rules};
