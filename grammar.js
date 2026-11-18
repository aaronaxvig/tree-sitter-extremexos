/**
 * @file Configuration syntax for Extreme Networks switches running ExtremeXOS
 * @author Aaron Axvig <aaron@axvigs.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const commands = require('./grammar/commands');
const configureTopics = require('./grammar/configure/topics');
const disable = require('./grammar/disable');
const enableTopics = require('./grammar/enable/topics');
const show = require('./grammar/show');

const detailedConfigure = {
  'automation': require('./grammar/configure/automation'),
  'database': require('./grammar/configure/database'),
  'diagnostics': require('./grammar/configure/diagnostics'),
  'dos-protect': require('./grammar/configure/dos-protect'),
  'elsm': require('./grammar/configure/elsm'),
  'keychain': require('./grammar/configure/keychain'),
  'lldp': require('./grammar/configure/lldp'),
  'netlogin': require('./grammar/configure/netlogin'),
  'ntp': require('./grammar/configure/ntp'),
  'snmp': require('./grammar/configure/snmp'),
  'dns-client': require('./grammar/configure/dns-client'),
  'sntp-client': require('./grammar/configure/sntp-client'),
  'sys-recovery-level': require('./grammar/configure/sys-recovery-level'),
  'telnet': require('./grammar/configure/telnet'),
  'twamp': require('./grammar/configure/twamp'),
  'vlan': require('./grammar/configure/vlan'),
};
const detailedTopics = Object.keys(detailedConfigure);
const otherTopics = configureTopics.topics(detailedTopics);

module.exports = grammar({
  name: "extremexos",
  word: $ => $.word,

  // Newlines terminate EXOS commands and therefore cannot be extras.
  extras: _ => [/[\t \f]/],

  rules: {
    source_file: $ => seq(
      repeat(choice(
        $.section_header,
        seq($._line, $._newline),
        $._newline,
      )),
      optional($._line),
    ),

    _line: $ => choice($.command, $.comment),

    // EXOS exports use a three-comment banner before each configuration module.
    section_header: _ => token(prec(2, seq(
      '#', /\r?\n/,
      '#', /[^\r\n]*Module[^\r\n]*configuration\.[^\r\n]*/, /\r?\n/,
      '#', /\r?\n/,
    ))),

    command: $ => choice(
      $.configure_command,
      $.disable_command,
      $.enable_command,
      $.show_command,
      ...commands.verbs.map(verb => $[commands.ruleName(verb)]),
      $.generic_command,
    ),

    configure_command: $ => seq(
      'configure',
      optional(choice(
        ...[...detailedTopics, ...otherTopics].map(topic => prec(1, $[configureTopics.ruleName(topic)])),
        $.configure_generic,
      )),
    ),

    // Unknown future topics and dynamic interactive shortcuts remain lossless.
    configure_generic: $ => seq(
      field('target', $.word),
      optional($._arguments),
    ),

    ...configureTopics.rules(otherTopics),
    ...Object.assign({}, ...Object.values(detailedConfigure).map(family => family.rules())),

    ...disable.rules(),
    ...enableTopics.rules(),
    ...show.rules(),
    ...commands.rules(),

    // Retain unknown EXOS commands losslessly while the detailed grammar grows.
    generic_command: $ => seq($.word, optional($._arguments)),
    _arguments: $ => repeat1($.word_or_string),
    word_or_string: $ => choice($.string, $.word),
    word: _ => /[^\s"']+/,
    string: _ => token(seq('"', repeat(choice(/[^"\\\r\n]+/, /\\./)), '"')),

    comment: _ => token(prec(1, /#[^\r\n]*/)),
    _newline: _ => /\r?\n/,
  },
});
