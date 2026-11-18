// Top-level EXOS verbs whose operands are still parsed generically.
// Configure has its own rule for command families.
const verbs = [
  'cd', 'check', 'clear', 'cp', 'create', 'debug', 'delete', 'disable',
  'download', 'edit', 'enable', 'exit', 'history', 'install', 'load', 'logout',
  'ls', 'mkdir', 'mrinfo', 'mtrace', 'mv', 'nslookup', 'ping', 'pwd', 'quit',
  'reboot', 'refresh', 'reset', 'restart', 'rm', 'rmdir', 'rtlookup', 'run',
  'save', 'scp2', 'show', 'ssh2', 'start', 'synchronize', 'telnet', 'terminate',
  'tftp', 'top', 'traceroute', 'unconfigure', 'uninstall', 'upload', 'use',
  'vi', 'xsh',
];

const ruleName = verb => `${verb}_command`;

const rules = () => Object.fromEntries(
  verbs.map(verb => [
    ruleName(verb),
    $ => seq(verb, optional($._arguments)),
  ]),
);

module.exports = {verbs, ruleName, rules};
