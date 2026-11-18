const {argument, options, value, withArguments} = require('./arguments');

const toggle = verb => ({
  [`${verb}_elsm`]: $ => seq('elsm', options($, $[`${verb}_elsm_ports`])),
  [`${verb}_elsm_ports`]: $ => argument($, 'ports', value($, 'ports'), options($, withArguments($, 'auto-restart'))),
});

module.exports = {toggle};
