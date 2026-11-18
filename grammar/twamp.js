const {options, withArguments} = require('./arguments');

const toggle = verb => ({
  [`${verb}_twamp`]: $ => seq('twamp', options($, $[`${verb}_twamp_reflector`])),
  [`${verb}_twamp_reflector`]: $ => withArguments($, 'reflector'),
});

module.exports = {toggle};
