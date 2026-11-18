import unittest
import xml.etree.ElementTree as ET

from tools.clidef_to_grammar import Token, command_graph, grammar_rules, static_choices


def accepted_paths(state, prefix=()):
    if state.can_end:
        yield prefix
    for token, target in state.transitions:
        yield from accepted_paths(target, (*prefix, token))


class CommandPathsTest(unittest.TestCase):
    def test_split_required_group_with_optional_keyword_after_operand(self):
        tree = ET.fromstring("""
            <cmd_tree name="extreme">
              <key><name>show</name>
                <open><name>[sample O1]</name>
                  <arg type="string"><name>&lt;target&gt;</name></arg>
                  <open><name>{sample O2}</name>
                    <key><name>detail</name></key>
                    <close><name>{sample C2}</name></close>
                  </open>
                </open>
                <open><name>[sample O1]</name>
                  <close><name>[sample C1]</name><action id="0"/></close>
                  <key><name>all</name></key>
                </open>
              </key>
            </cmd_tree>
        """)
        target = Token("target", "string")
        self.assertEqual(set(accepted_paths(command_graph(tree))), {
            (Token("show"), target),
            (Token("show"), target, Token("detail")),
            (Token("show"), Token("all")),
        })

    def test_split_optional_group_can_be_omitted(self):
        tree = ET.fromstring("""
            <cmd_tree name="extreme">
              <key><name>show</name>
                <open><name>{sample O1}</name>
                  <arg type="string"><name>&lt;target&gt;</name></arg>
                </open>
                <open><name>{sample O1}</name>
                  <close><name>{sample C1}</name><action id="0"/></close>
                </open>
              </key>
            </cmd_tree>
        """)
        self.assertEqual(set(accepted_paths(command_graph(tree))), {
            (Token("show"),),
            (Token("show"), Token("target", "string")),
        })

    def test_required_closer_only_opener_does_not_allow_empty_alternative(self):
        tree = ET.fromstring("""
            <cmd_tree name="extreme">
              <key><name>show</name>
                <open><name>[sample O1]</name><key><name>one</name></key></open>
                <open><name>[sample O1]</name><key><name>two</name></key></open>
                <open><name>[sample O1]</name>
                  <close><name>[sample C1]</name>
                    <key><name>status</name><action id="0"/></key>
                  </close>
                </open>
              </key>
            </cmd_tree>
        """)
        self.assertEqual(set(accepted_paths(command_graph(tree))), {
            (Token("show"), Token("one"), Token("status")),
            (Token("show"), Token("two"), Token("status")),
        })

    def test_required_group_without_alternatives_is_an_error(self):
        tree = ET.fromstring("""
            <cmd_tree name="extreme">
              <key><name>show</name>
                <open><name>[sample O1]</name>
                  <close><name>[sample C1]</name><action id="0"/></close>
                </open>
              </key>
            </cmd_tree>
        """)
        with self.assertRaisesRegex(ValueError, "Empty required group"):
            command_graph(tree)

    def test_independent_optional_groups_share_continuations(self):
        body = '<action id="0"/>'
        for index in reversed(range(16)):
            body = f"""
                <open><name>{{sample O{index}}}</name>
                  <key><name>option{index}</name></key>
                  <close><name>{{sample C{index}}}</name>{body}</close>
                </open>
            """
        tree = ET.fromstring(f"<cmd_tree><key><name>show</name>{body}</key></cmd_tree>")
        rules = grammar_rules(command_graph(tree), {})
        self.assertLessEqual(len(rules), 18)
        self.assertIn("optional(", rules["command_show"])


class StaticChoicesTest(unittest.TestCase):
    def test_static_choices_and_dynamic_names(self):
        root = ET.fromstring("""
            <cmd_def>
              <custom_type>
                <type name="mode" type="static" quote="0">
                  <entry name="brief" val="0"/><entry name="detail" val="1"/>
                </type>
                <type name="dynamic_name"/>
              </custom_type>
            </cmd_def>
        """)
        types = static_choices(root)
        self.assertEqual(Token("mode", "mode").rule(types), 'field("mode", choice("brief", "detail"))')
        self.assertEqual(Token("name", "dynamic_name").rule(types), 'field("name", $.word_or_string)')
