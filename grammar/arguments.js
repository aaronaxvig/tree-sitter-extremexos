const value = ($, name) => field(name, $.word_or_string);

const withArguments = ($, ...syntax) => seq(...syntax, optional($._arguments));

const options = ($, ...branches) =>
  optional(choice(...branches.map(branch => prec(1, branch)), $._arguments));

const argument = ($, keyword, operand, following = optional($._arguments)) =>
  seq(keyword, optional(seq(operand, following)));

module.exports = {value, withArguments, options, argument};
