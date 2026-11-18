from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.import_grammar import coverage_report, load_families, output_files, write_files


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
            families, keywords, errors, _ = load_families([first, second], {"show"})
            reversed_families, _, _, _ = load_families([second, first], {"show"})
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
            families, keywords, _, _ = load_families([source], {"show"})
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
                families, keywords, errors, _ = load_families([source], {"show"})
                self.assertEqual(errors, [])
                write_files(output, families, keywords)
                self.assertIn(f'seq("{keyword}"', family.read_text())

            self.assertNotIn('seq("status"', family.read_text())

    def test_identical_continuations_are_defined_once_across_families(self):
        with TemporaryDirectory() as directory:
            source = Path(directory, "input.xml")
            module(source, "status")
            families, _, _, _ = load_families([source], {"show"})
            families["show", "second"] = families["show", "sample"]
            files = dict(output_files(families))
            first = files[Path("show/sample.js")]
            second = files[Path("show/second.js")]
            reference = first.split("optional($.", 1)[1].split(")", 1)[0]
            self.assertIn(f"optional($.{reference})", second)
            self.assertEqual((first + second).count(f"{reference}: $ =>"), 1)

    def test_coverage_includes_commands_filtered_out_of_detailed_generation(self):
        with TemporaryDirectory() as directory:
            paths = [Path(directory, name) for name in ("b.xml", "a.xml")]
            for path in paths:
                path.write_text("""<cmd_def><cmd_tree name="extreme">
                  <key><name>cd</name><action id="0"/>
                    <arg type="string"><name>&lt;directory&gt;</name><action id="1"/></arg>
                  </key>
                  <key><name>future</name><key><name>status</name><action id="2"/></key></key>
                  <key><name>show</name>
                    <key><name>public</name><action id="3"/></key>
                    <key><name>private</name><flags>debug-only</flags><action id="4"/></key>
                  </key>
                </cmd_tree></cmd_def>""")
            verbs = {"cd", "show"}
            families, keywords, errors, observed = load_families(paths, verbs)
            self.assertEqual(errors, [])
            for selected, public_status in (({}, "generic"), ({("show", "public")}, "detailed")):
                rows = coverage_report(observed, verbs, keywords, selected, {})
                self.assertEqual([(row["command"], row["status"]) for row in rows], [
                    ("cd", "generic"), ("cd <directory>", "generic"),
                    ("future status", "skipped"), ("show private", "skipped"),
                    ("show public", public_status),
                ])
                self.assertTrue(all(row["sources"] == ["a.xml", "b.xml"] for row in rows))
                self.assertEqual(rows[2]["reason"], "unregistered verb")

    def test_import_reports_invalid_xml(self):
        with TemporaryDirectory() as directory:
            source = Path(directory, "broken.xml")
            source.write_text("<cmd_def/>")
            self.assertEqual(load_families([source], {"show"})[2], [
                "broken.xml: No ExtremeXOS command tree found",
            ])
