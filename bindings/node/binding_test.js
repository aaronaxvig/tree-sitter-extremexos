const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const Parser = require("tree-sitter");
const language = require(".");
const keywords = require("../../grammar/keywords");
const {native} = require("../../grammar/import.json");

test("can load grammar", () => {
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(language));
});

test("recognizes configuration topics and preserves operational arguments in incomplete commands", () => {
  const parser = new Parser();
  parser.setLanguage(language);

  for (const [verb, topics] of Object.entries(keywords)) {
    for (const topic of topics) {
      const line = `${verb} ${topic}`;
      const { rootNode } = parser.parse(`${line}\n`);
      assert.equal(rootNode.hasError, false, line);
      const command = rootNode.firstNamedChild.firstNamedChild;
      assert.equal(command.type, `${verb}_command`, line);
      if (native.verbs.includes(verb)) {
        assert.equal(command.firstNamedChild?.firstChild?.type, topic, line);
      } else {
        assert.equal(command.firstNamedChild?.type, "word_or_string", line);
        assert.equal(command.firstNamedChild.text, topic, line);
      }
    }
  }
});

test("parses NetLogin port timers into fields", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const { rootNode } = parser.parse(
    'configure netlogin dot1x ports 1:2 timers quiet-period 30 reauthentication on\n',
  );
  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [timers] = rootNode.descendantsOfType("configure_netlogin");
  assert.equal(timers.childForFieldName("port_list").text, "1:2");
  assert.equal(timers.childForFieldName("quiet_period").text, "30");
  assert.ok(timers.children.some(node => node.type === "on"));
});

test("preserves operational commands as generic arguments", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  for (const [source, verb, arguments_] of [
    ['show edp ports 1:2 detail', 'show', ['edp', 'ports', '1:2', 'detail']],
    ['debug netlogin show vpif vlan "Example" clients details', 'debug',
      ['netlogin', 'show', 'vpif', 'vlan', '"Example"', 'clients', 'details']],
    ['clear lldp statistics', 'clear', ['lldp', 'statistics']],
  ]) {
    const {rootNode} = parser.parse(source);
    assert.equal(rootNode.hasError, false, source);
    const command = rootNode.firstNamedChild.firstNamedChild;
    assert.equal(command.type, `${verb}_command`);
    assert.ok(command.namedChildren.every(node => node.type === 'word_or_string'));
    assert.deepEqual(command.namedChildren.map(node => node.text), arguments_);
  }
});

test("parses DNS name server operands into fields", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const { rootNode } = parser.parse(
    "configure dns-client add name-server 192.0.2.53 vr VR-Default\n",
  );

  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [server] = rootNode.descendantsOfType("configure_dns_client");
  assert.ok(server, rootNode.toString());
  assert.equal(server.childForFieldName("ip_address").text, "192.0.2.53");
  assert.equal(server.childForFieldName("vr_name").text, "VR-Default");
});

test("parses VLAN port options into fields", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const { rootNode } = parser.parse(
    'configure vlan "Example" add ports 1 tagged stpd s0 dot1d\n',
  );

  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [vlan] = rootNode.descendantsOfType("configure_vlan");
  assert.equal(vlan.childForFieldName("port_list").text, "1");
  assert.equal(vlan.childForFieldName("stpd_name").text, "s0");
  assert.deepEqual(vlan.children.filter(node => !node.isNamed).map(node => node.type), [
    "vlan", "add", "ports", "tagged", "stpd", "dot1d",
  ]);
});

test("exposes VLAN creation fields and retains unfinished or unknown continuations", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  for (const suffix of ['', ' tag', ' tag 100', ' future-option "Value"', ' tag 100 future-option "Value"']) {
    const source = `create vlan "Example" vr VR-Example${suffix}`;
    const {rootNode} = parser.parse(source);
    assert.equal(rootNode.hasError, false, source);
    const [vlan] = rootNode.descendantsOfType('create_vlan');
    assert.equal(vlan.childForFieldName('argument').text, '"Example"');
    assert.equal(vlan.childForFieldName('vr_name').text, 'VR-Example');
    assert.equal(vlan.childForFieldName('tag')?.text, suffix.startsWith(' tag 100') ? '100' : undefined);
    assert.equal(vlan.text, source.slice('create '.length));
  }
});

test("recognizes port option keywords and virtual-router operands", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const {rootNode} = parser.parse(
    'configure ports 1:2 display-string "Example"\n' +
    'configure vr VR-Example add ports 1:2\n',
  );
  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [ports] = rootNode.descendantsOfType('configure_ports');
  const [router] = rootNode.descendantsOfType('configure_vr');
  assert.ok(ports.children.some(node => node.type === 'display-string' && !node.isNamed));
  assert.equal(router.childForFieldName('vr_name').text, 'VR-Example');
  assert.ok(router.children.some(node => node.type === 'ports' && !node.isNamed));
});

test("accepts LF and CRLF without requiring a final newline", () => {
  const parser = new Parser();
  parser.setLanguage(language);

  for (const newline of ["\n", "\r\n"]) {
    const { rootNode } = parser.parse(["#", "enable ssh2", "# Last comment"].join(newline));
    assert.equal(rootNode.hasError, false, rootNode.toString());
    assert.deepEqual(rootNode.namedChildren.map(node => node.type), ["comment", "command", "comment"]);
    assert.equal(rootNode.namedChildren[1].firstNamedChild.type, "enable_command");
  }

  const { rootNode } = parser.parse('configure vlan "Example" add ports all');
  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [vlan] = rootNode.descendantsOfType("configure_vlan");
  assert.ok(vlan.children.some(node => node.type === "ports"));
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
