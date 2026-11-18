const {toggle} = require('../netlogin');

const rules = () => toggle('disable');

module.exports = {rules};
