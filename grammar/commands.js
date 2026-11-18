const topics = require('./topics');

// Top-level EXOS verbs with no detailed command families.
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
  const names = topics.list(verb);
  return {
    [ruleName(verb)]: $ => seq(
      verb,
      optional(choice(...topics.branches($, verb, names), $._arguments)),
    ),
    ...topics.rules(verb, names),
  };
}));

module.exports = {verbs, ruleName, rules};
