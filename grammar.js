/**
 * @file Configuration syntax for Extreme switches running EXOS
 * @author Aaron Axvig <aaron@axvigs.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "extremexos",

  extras: $ => [/\s/], // whitespace

  conflicts: $ => [
    [$.section]
  ],

  rules: {
    // Top-level: a sequence of sections
    source_file: $ => repeat($.section),

    // A section contains an optional header, then commands and/or comments
    section: $ => seq(
      optional($.section_header),
      repeat1(choice(
        $.configure_command,
        $.create_command,
        $.enable_command,
//        $.other_command,
        $.comment))
    ),

    // Optional header defining a region
    section_header: $ => seq(
      token(seq('#', '\n')),           // optional empty line
      token(seq('#', /.*Module.*configuration.*\n/)), // header line
      token(seq('#', '\n'))            // optional empty line
    ),

    configure_command: $ => seq(
      'configure',
      choice(
        $.snmp_command,
        $.diagnostics_command,
        $.sys_recovery_command,
        $.generic_config_command
      )
    ),

    create_command: $ => seq(
      'create',
      repeat($.word_or_string)
    ),

    enable_command: $ => seq(
      'enable',
      repeat($.word_or_string)
    ),

//    other_command: $ => seq(
//      $.word,
//      repeat($.word_or_string)
//    ),

    // snmp commands
    snmp_command: $ => seq(
      'snmp',
      choice(
        seq('sysName', $.string),
        seq('sysContact', $.string),
        seq('sysLocation', $.string),
        seq($.word, repeat($.word)) // fallback
      )
    ),

    diagnostics_command: $ => seq(
      'diagnostics',
      'privilege',
      $.word
    ),

    sys_recovery_command: $ => seq(
      'sys-recovery-level',
      $.word,
      $.word
    ),

    // fallback for other configure commands
    generic_config_command: $ => repeat1($.word_or_string),

    // Commands that don’t start with configure
    other_command: $ => seq(
      $.word,
      repeat($.word_or_string)
    ),

    // Words or quoted strings
    word_or_string: $ => choice($.string, $.word),
    word: $ => /[^\s"']+/,
    string: $ => token(seq(
      '"',
      repeat(choice(/[^"\\]+/, /\\./)),
      '"'
    )),

    // Comments
    comment: $ => token(seq('#', /.*/))
  }
});
