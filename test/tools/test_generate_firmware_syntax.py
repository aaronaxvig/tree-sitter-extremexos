from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.generate_firmware_syntax import export_syntax


class FirmwareSyntaxTest(unittest.TestCase):
    def test_merges_modules_and_preserves_only_cli_syntax(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            for name, keyword in (("one.xml", "start"), ("two.xml", "stop")):
                (root / name).write_text(f"""
                    <cmd_def>
                      <cmd_tbl><cmd>ignored action body</cmd></cmd_tbl>
                      <cmd_tree name="extreme">
                        <key><name>configure</name>
                          <key><name>example</name>
                            <key><name>{keyword}</name><help>ignored help</help>
                              <arg type="string"><name>&lt;target&gt;</name><action id="0"/></arg>
                            </key>
                            <key><name>hidden</name><flags>debug-only</flags><action id="1"/></key>
                          </key>
                        </key>
                        <key><name>debug</name><action id="2"/></key>
                      </cmd_tree>
                    </cmd_def>
                """)
            syntax = export_syntax(root, {"firmware": "example", "modules": ["one.xml", "two.xml"]})

        self.assertEqual(syntax["contributors"], ["one.xml", "two.xml"])
        family = syntax["families"]["configure"]["example"]
        choices = syntax["states"][family]
        self.assertEqual([edge[0] for edge in choices], ["start", "stop"])
        self.assertEqual(choices[0][2], choices[1][2])
        self.assertEqual(syntax["states"][choices[0][2]], ((None, "target", 0),))
