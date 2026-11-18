/**
 * @file Configuration syntax for Extreme Networks switches running ExtremeXOS
 * @author Aaron Axvig <aaron@axvigs.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const commands = require('./grammar/commands');

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

    command: $ => choice(...commands.verbs.map(verb => $[commands.ruleName(verb)]), $.generic_command),

    configure_generic: $ => seq(field('target', $.word), optional($._arguments)),
    enable_generic: $ => seq(field('target', $.word_or_string), optional($._arguments)),

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
