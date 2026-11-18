import unittest
from xml.etree import ElementTree as ET

from tools.import_topics import literal_topics


class LiteralTopicsTest(unittest.TestCase):
    def test_shared_operand_is_not_an_alternative_to_the_keyword(self):
        tree = ET.fromstring("""
          <cmd_tree name="extreme">
            <key><name>show</name>
              <open><name>[sample O1]</name>
                <arg type="string"><name>&lt;target&gt;</name></arg>
                <key><name>detail</name><action id="0"/></key>
              </open>
              <key><name>configuration</name><action id="0"/></key>
            </key>
          </cmd_tree>
        """)
        self.assertEqual(literal_topics(tree, {"show"}), {("show", "configuration")})

    def test_shared_closer_and_optional_continuation(self):
        tree = ET.fromstring("""
          <cmd_tree name="extreme">
            <open><name>[sample O1]</name>
              <key><name>enable</name></key>
            </open>
            <open><name>[sample O1]</name>
              <key><name>disable</name></key>
              <close><name>[sample C1]</name></close>
            </open>
          </cmd_tree>
        """)
        closer = next(tree.iter("close"))
        closer.append(ET.fromstring("""
          <open><name>{sample O2}</name>
            <key><name>lldp</name><action id="0"/></key>
            <key><name>internal</name><flags>debug-only</flags><action id="0"/></key>
            <close><name>{sample C2}</name>
              <key><name>ports</name><action id="0"/></key>
            </close>
          </open>
        """))
        self.assertEqual(
            literal_topics(tree, {"enable", "disable"}),
            {("enable", "lldp"), ("enable", "ports"), ("disable", "lldp"), ("disable", "ports")},
        )
