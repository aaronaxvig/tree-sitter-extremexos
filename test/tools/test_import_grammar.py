from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.import_grammar import load_families, output_files, write_files


def module(path, keyword):
    path.write_text(f"""
        <cmd_def>
          <cmd_tree name="extreme">
            <key><name>show</name>
              <key><name>sample</name>
                <key><name>{keyword}</name>
                  <arg type="mode"><name>&lt;mode&gt;</name><action id="0"/></arg>
                </key>
              </key>
            </key>
          </cmd_tree>
          <custom_type><type name="mode" type="static" quote="0">
            <entry name="short"/><entry name="long"/>
          </type></custom_type>
        </cmd_def>
    """)


class GrammarImportTest(unittest.TestCase):
    def test_definitions_merge_and_output_is_independent_of_file_order(self):
        with TemporaryDirectory() as directory:
            first = Path(directory, "first.xml")
            second = Path(directory, "second.xml")
            module(first, "status")
            module(second, "details")
            families, keywords, errors = load_families([first, second], {"show"})
            reversed_families, _, _ = load_families([second, first], {"show"})
            self.assertEqual(errors, [])
            self.assertEqual(dict(keywords), {"show": {"sample"}})
            files = dict(output_files(families))
            self.assertEqual(files, dict(output_files(reversed_families)))
            source = files[Path("show/sample.js")]
            for text in ('seq("details"', 'seq("status"', 'field("mode", "short")'):
                self.assertIn(text, source)

    def test_refresh_removes_old_output_and_keeps_files_outside_the_generated_set(self):
        with TemporaryDirectory() as directory:
            directory = Path(directory)
            source = directory / "input.xml"
            module(source, "status")
            families, keywords, _ = load_families([source], {"show"})
            output = directory / "grammar"
            write_files(output, families, keywords)
            unrelated = output / "show/helper.js"
            unrelated.write_text("// helper\n")

            write_files(output, {}, {})

            self.assertFalse((output / "show/sample.js").exists())
            self.assertFalse((output / "show/keywords.js").exists())
            self.assertEqual(unrelated.read_text(), "// helper\n")

    def test_refresh_uses_revised_xml_for_an_existing_family(self):
        with TemporaryDirectory() as directory:
            directory = Path(directory)
            source = directory / "input.xml"
            output = directory / "grammar"
            family = output / "show/sample.js"

            for keyword in ("status", "details"):
                module(source, keyword)
                families, keywords, errors = load_families([source], {"show"})
                self.assertEqual(errors, [])
                write_files(output, families, keywords)
                self.assertIn(f'seq("{keyword}"', family.read_text())

            self.assertNotIn('seq("status"', family.read_text())

    def test_import_reports_invalid_xml(self):
        with TemporaryDirectory() as directory:
            source = Path(directory, "broken.xml")
            source.write_text("<cmd_def/>")
            self.assertEqual(load_families([source], {"show"})[2], [
                "broken.xml: No ExtremeXOS command tree found",
            ])
