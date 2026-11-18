const {toggle} = require('../lldp');

const rules = () => toggle('disable');

module.exports = {rules};
