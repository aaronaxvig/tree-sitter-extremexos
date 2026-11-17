/**
 * @file Configuration syntax for Extreme Networks switches running ExtremeXOS
 * @author Aaron Axvig <aaron@axvigs.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "extremexos",

  // Newlines terminate EXOS commands and therefore cannot be extras.
  extras: _ => [/[\t \f]/],

  rules: {
    source_file: $ => repeat(choice(
      $.section_header,
      $.command,
      $.comment,
      $._newline,
    )),

    // EXOS exports use a three-comment banner before each configuration module.
    section_header: _ => token(prec(2, seq(
      '#', /\r?\n/,
      '#', /[^\r\n]*Module[^\r\n]*configuration\.[^\r\n]*/, /\r?\n/,
      '#', /\r?\n/,
    ))),

    command: $ => choice(
      $.configure_command,
      $.create_command,
      $.enable_command,
      $.disable_command,
      $.unconfigure_command,
      $.delete_command,
      $.generic_command,
    ),

    configure_command: $ => seq(
      'configure',
      choice($.configure_snmp, $.configure_diagnostics, $.configure_sys_recovery, $._arguments),
      $._newline,
    ),

    configure_snmp: $ => seq(
      'snmp',
      choice(
        $.configure_snmp_sys_name,
        $.configure_snmp_sys_contact,
        $.configure_snmp_sys_location,
        $._arguments,
      ),
    ),

    configure_snmp_sys_name: $ => seq('sysName', $.word_or_string),
    configure_snmp_sys_contact: $ => seq('sysContact', $.word_or_string),
    configure_snmp_sys_location: $ => seq('sysLocation', $.word_or_string),
    configure_diagnostics: $ => seq('diagnostics', 'privilege', $.word),
    configure_sys_recovery: $ => seq('sys-recovery-level', $.word, $.word),

    create_command: $ => seq('create', optional($._arguments), $._newline),
    enable_command: $ => seq('enable', optional($._arguments), $._newline),
    disable_command: $ => seq('disable', optional($._arguments), $._newline),
    unconfigure_command: $ => seq('unconfigure', optional($._arguments), $._newline),
    delete_command: $ => seq('delete', optional($._arguments), $._newline),

    // Retain unknown EXOS commands losslessly while the detailed grammar grows.
    generic_command: $ => seq($.word, optional($._arguments), $._newline),
    _arguments: $ => repeat1($.word_or_string),
    word_or_string: $ => choice($.string, $.word),
    word: _ => /[^\s"']+/,
    string: _ => token(seq('"', repeat(choice(/[^"\\\r\n]+/, /\\./)), '"')),

    comment: $ => seq(token(seq('#', /[^\r\n]*/)), $._newline),
    _newline: _ => /\r?\n/,
  },
});
