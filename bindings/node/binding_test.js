const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const Parser = require("tree-sitter");
const language = require(".");
const keywords = require("../../grammar/keywords");

test("can load grammar", () => {
  const parser = new Parser();
  assert.doesNotThrow(() => parser.setLanguage(language));
});

test("recognizes every imported verb and keyword in incomplete commands", () => {
  const parser = new Parser();
  parser.setLanguage(language);

  for (const [verb, topics] of Object.entries(keywords)) {
    for (const topic of topics) {
      const line = `${verb} ${topic}`;
      const { rootNode } = parser.parse(`${line}\n`);
      assert.equal(rootNode.hasError, false, line);
      const command = rootNode.firstNamedChild.firstNamedChild;
      assert.equal(command.type, `${verb}_command`, line);
      assert.equal(command.firstNamedChild?.firstChild?.type, topic, line);
    }
  }
});

test("parses NetLogin port timers and session filters into fields", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const { rootNode } = parser.parse(
    'configure netlogin dot1x ports 1:2 timers quiet-period 30 reauthentication on\n' +
    'show netlogin session summary mac-address 02:00:00:00:00:01 ports 1:2 agent dot1x\n',
  );
  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [port] = rootNode.descendantsOfType("configure_netlogin_dot1x_ports");
  const [timers] = port.descendantsOfType("configure_netlogin_dot1x_timers");
  const [session] = rootNode.descendantsOfType("show_netlogin_session");
  assert.equal(port.childForFieldName("ports").text, "1:2");
  assert.equal(timers.childForFieldName("quiet_period").text, "30");
  assert.equal(timers.childForFieldName("state").text, "on");
  assert.equal(session.childForFieldName("mac_address").text, "02:00:00:00:00:01");
  assert.equal(session.childForFieldName("ports").text, "1:2");
  assert.equal(session.childForFieldName("agent").text, "dot1x");
});

test("parses DNS name server operands into fields", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const { rootNode } = parser.parse(
    "configure dns-client add name-server 192.0.2.53 vr VR-Default\n",
  );

  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [server] = rootNode.descendantsOfType("dns_client_name_server");
  assert.ok(server, rootNode.toString());
  assert.equal(server.childForFieldName("address").text, "192.0.2.53");
  assert.equal(server.childForFieldName("virtual_router").text, "VR-Default");
});

test("parses VLAN port options into fields", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const { rootNode } = parser.parse(
    'configure vlan "Example" add ports 1 tagged 200 stpd s0 dot1d\n',
  );

  assert.equal(rootNode.hasError, false, rootNode.toString());
  const [addPorts] = rootNode.descendantsOfType("configure_vlan_add_ports");
  assert.equal(addPorts.childForFieldName("ports").text, "1");
  const [options] = addPorts.descendantsOfType("configure_vlan_port_options");
  assert.equal(options.childForFieldName("mode").text, "tagged");
  assert.equal(options.childForFieldName("tag").text, "200");
  assert.equal(options.childForFieldName("stpd").text, "s0");
  assert.equal(options.childForFieldName("encapsulation").text, "dot1d");
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
  assert.equal(rootNode.descendantsOfType("configure_vlan_add_ports").length, 1);
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
