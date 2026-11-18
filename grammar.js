/**
 * @file Configuration syntax for Extreme Networks switches running ExtremeXOS
 * @author Aaron Axvig <aaron@axvigs.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const commands = require('./grammar/commands');
const configureTopics = require('./grammar/configure/topics');
const diagnostics = require('./grammar/configure/diagnostics');
const dnsClient = require('./grammar/configure/dns-client');
const enableTopics = require('./grammar/enable/topics');
const snmp = require('./grammar/configure/snmp');
const sntpClient = require('./grammar/configure/sntp-client');
const sysRecovery = require('./grammar/configure/sys-recovery-level');
const vlan = require('./grammar/configure/vlan');

module.exports = grammar({
  name: "extremexos",

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
      $.enable_command,
      ...commands.verbs.map(verb => $[commands.ruleName(verb)]),
      $.generic_command,
    ),

    configure_command: $ => seq(
      'configure',
      optional(choice(
        prec(1, $.configure_snmp),
        prec(1, $.configure_dns_client),
        prec(1, $.configure_sntp_client),
        prec(1, $.configure_diagnostics),
        prec(1, $.configure_sys_recovery),
        prec(1, $.configure_vlan),
        ...configureTopics.topics.map(topic => prec(1, $[configureTopics.ruleName(topic)])),
        $.configure_generic,
      )),
    ),

    // Unknown future topics and dynamic interactive shortcuts remain lossless.
    configure_generic: $ => seq(
      field('target', $.word),
      optional($._arguments),
    ),

    ...configureTopics.rules(),
    ...diagnostics.rules(),
    ...dnsClient.rules(),
    ...snmp.rules(),
    ...sntpClient.rules(),
    ...sysRecovery.rules(),
    ...vlan.rules(),

    ...enableTopics.rules(),
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
