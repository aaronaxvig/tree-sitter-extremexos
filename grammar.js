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
      repeat1(choice($.command, $.comment))
    ),

    // Optional header defining a region
    section_header: $ => seq(
      token(seq('#', '\n')),           // optional empty line
      token(seq('#', /.*Module.*configuration.*\n/)), // header line
      token(seq('#', '\n'))            // optional empty line
    ),

    // Commands always start with 'configure'
    command: $ => seq(
      'configure',
      repeat1($.word_or_string)
    ),

    // Either a bare word or a quoted string
    word_or_string: $ => choice(
      $.string,
      $.word
    ),

    // Bare words
    word: $ => /[^\s"']+/,

    // Quoted strings, with support for escaped characters
    string: $ => token(seq(
      '"',
      repeat(choice(/[^"\\]+/, /\\./)),
      '"'
    )),

    // Single-line comments
    comment: $ => token(seq('#', /.*/))
  }
});
