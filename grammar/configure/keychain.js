const {argument, options, value} = require('../arguments');

const chain = $ => value($, 'keychain_name');
const key = $ => value($, 'key_id');

const rules = () => ({
  configure_keychain: $ => argument($, 'keychain', chain($), options($,
    $.configure_keychain_accept_tolerance,
    $.configure_keychain_add,
    $.configure_keychain_delete,
    $.configure_keychain_key,
  )),
  configure_keychain_accept_tolerance: $ => argument($, 'accept-tolerance', value($, 'seconds')),
  configure_keychain_add: $ => seq('add', options($,
    argument($, 'key', key($), options($, $.configure_keychain_key_string)),
  )),
  configure_keychain_delete: $ => seq('delete', options($, argument($, 'key', key($)))),
  configure_keychain_key: $ => argument($, 'key', key($), options($,
    $.configure_keychain_active_lifetime,
    $.configure_keychain_hash_algorithm,
  )),
  configure_keychain_key_string: $ => seq('key-string', options($,
    argument($, 'encrypted', value($, 'encrypted_string')),
    seq(value($, 'text_string'), options($, $.configure_keychain_active_lifetime)),
  )),
  configure_keychain_active_lifetime: $ => seq('active-lifetime', options($,
    seq('local', options($, $.configure_keychain_active_lifetime_start)),
    $.configure_keychain_active_lifetime_start,
  )),
  configure_keychain_active_lifetime_start: $ => argument($, 'start', value($, 'start_time'), options($,
    $.configure_keychain_active_lifetime_duration,
    argument($, 'end', value($, 'end_time')),
  )),
  configure_keychain_active_lifetime_duration: $ => argument(
    $, 'duration', field('duration', choice('maximum', $.word_or_string)),
  ),
  configure_keychain_hash_algorithm: $ => argument($, 'hash-algorithm', field('algorithm', choice(
    'hmac-sha-1', 'hmac-sha-256', 'hmac-sha-384', 'hmac-sha-512', $.word_or_string,
  ))),
});

module.exports = {rules};
