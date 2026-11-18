const {argument, options, value} = require('../arguments');

const host = $ => value($, 'host');

const rules = () => ({
  configure_database: $ => seq('database', options($,
    $.configure_database_max_retry_interval,
    seq(value($, 'database_name'), options($,
      $.configure_database_add,
      $.configure_database_delete,
      $.configure_database_server,
    )),
  )),
  configure_database_max_retry_interval: $ => argument($, 'max-retry-interval', value($, 'retry_interval')),
  configure_database_add: $ => seq('add', options($, $.configure_database_add_server)),
  configure_database_add_server: $ => argument($, 'server', host($), options($,
    argument($, 'port', value($, 'port_number'), options($, $.configure_database_server_password)),
    $.configure_database_server_password,
  )),
  configure_database_delete: $ => seq('delete', options($, $.configure_database_delete_server)),
  configure_database_delete_server: $ => argument($, 'server', field('host', choice('all', $.word_or_string))),
  configure_database_server: $ => argument($, 'server', host($), options($, $.configure_database_server_password)),
  configure_database_server_password: $ => seq('password', options($,
    argument($, 'encrypted', value($, 'encrypted_password')),
    seq(value($, 'password'), optional($._arguments)),
  )),
});

module.exports = {rules};
