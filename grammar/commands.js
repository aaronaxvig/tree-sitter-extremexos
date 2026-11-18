const topics = require('./topics');
const detailed = {
  clear: {elsm: require('./clear/elsm'), lldp: require('./clear/lldp'), netlogin: require('./clear/netlogin')},
  create: {database: require('./create/database'), keychain: require('./create/keychain'), netlogin: require('./create/netlogin')},
  debug: {lldp: require('./debug/lldp'), netlogin: require('./debug/netlogin'), telnetd: require('./debug/telnetd')},
  delete: {database: require('./delete/database'), keychain: require('./delete/keychain'), netlogin: require('./delete/netlogin')},
  unconfigure: {lldp: require('./unconfigure/lldp'), netlogin: require('./unconfigure/netlogin')},
};

// Top-level EXOS verbs that share the same command structure.
const verbs = [
  'cd', 'check', 'clear', 'cp', 'create', 'debug', 'delete',
  'download', 'edit', 'exit', 'history', 'install', 'load', 'logout',
  'ls', 'mkdir', 'mrinfo', 'mtrace', 'mv', 'nslookup', 'ping', 'pwd', 'quit',
  'reboot', 'refresh', 'reset', 'restart', 'rm', 'rmdir', 'rtlookup', 'run',
  'save', 'scp2', 'ssh2', 'start', 'synchronize', 'telnet', 'terminate',
  'tftp', 'top', 'traceroute', 'unconfigure', 'uninstall', 'upload', 'use',
  'vi', 'xsh',
];

const ruleName = verb => `${verb}_command`;

const rules = () => Object.assign({}, ...verbs.map(verb => {
  const families = detailed[verb] ?? {};
  const names = topics.list(verb, Object.keys(families));
  return {
    [ruleName(verb)]: $ => seq(
      verb,
      optional(choice(...topics.branches($, verb, names), $._arguments)),
    ),
    ...topics.rules(verb, names),
    ...Object.assign({}, ...Object.values(families).map(family => family.rules())),
  };
}));

module.exports = {verbs, ruleName, rules};
