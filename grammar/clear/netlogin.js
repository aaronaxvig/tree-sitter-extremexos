const {agent, argument, family, tail, value, vlan} = require('../netlogin');

const macFilter = $ => argument($, 'mac-address', value($, 'mac_address'), tail($, agent($)));

const vlanFilter = $ => argument($, 'vlan', vlan($), tail($, macFilter($), agent($)));

const rules = () => family('clear', {
  state: $ => tail($,
    argument($, 'port', value($, 'ports'), tail($, vlanFilter($), macFilter($), agent($))),
    vlanFilter($),
    macFilter($),
    agent($),
  ),
});

module.exports = {rules};
