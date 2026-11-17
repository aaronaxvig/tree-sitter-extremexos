const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const Parser = require("tree-sitter");
const language = require(".");

test("can load grammar", () => {
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(language));
});

test("fixtures parse without errors", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const fixtureDirectory = path.join(__dirname, "..", "..", "test", "fixtures");

  for (const filename of fs.readdirSync(fixtureDirectory).filter(name => name.endsWith(".exos"))) {
    const source = fs.readFileSync(path.join(fixtureDirectory, filename), "utf8");
    const tree = parser.parse(source);
    assert.equal(tree.rootNode.hasError, false, `${filename} contains a parse error`);
  }
});
