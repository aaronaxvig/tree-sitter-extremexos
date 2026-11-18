const {toggle} = require('../netlogin');

const rules = () => toggle('enable');

module.exports = {rules};
