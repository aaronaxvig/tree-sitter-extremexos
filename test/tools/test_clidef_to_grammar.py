import unittest
import xml.etree.ElementTree as ET

from tools.clidef_to_grammar import Token, command_paths, static_choices


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
        self.assertEqual(command_paths(tree), {
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
        self.assertEqual(command_paths(tree), {
            (Token("show"),),
            (Token("show"), Token("target", "string")),
        })


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
