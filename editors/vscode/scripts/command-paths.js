const word = String.raw`[^\s"']+`;
const quoted = String.raw`"(?:[^"\\\r\n]|\\.)*"`;
const operands = new Map([
  ['word', word],
  ['string', quoted],
  ['word_or_string', `(?:${word}|${quoted})`],
]);

// Stop at a generic argument list or a construct without a fixed token path.
const stop = Symbol('stop');

function commandPaths(rules) {
  const cache = new Map();

  function paths(rule) {
    switch (rule.type) {
      case 'STRING':
        return [[rule.value]];
      case 'BLANK':
        return [[]];
      case 'PATTERN':
        return [[{operand: rule.value}]];
      case 'CHOICE':
        return rule.members.flatMap(paths);
      case 'SEQ':
        return rule.members.reduce((prefixes, member) => {
          const suffixes = paths(member);
          return prefixes.flatMap(prefix => prefix.at(-1) === stop
            ? [prefix]
            : suffixes.map(suffix => [...prefix, ...suffix]));
        }, [[]]);
      case 'SYMBOL': {
        const name = rule.name;
        if (operands.has(name)) return [[{operand: operands.get(name)}]];
        if (!cache.has(name)) {
          cache.set(name, [[stop]]);
          cache.set(name, paths(rules[name]));
        }
        return cache.get(name);
      }
      case 'FIELD':
      case 'PREC':
      case 'PREC_LEFT':
      case 'PREC_RIGHT':
      case 'PREC_DYNAMIC':
      case 'TOKEN':
      case 'IMMEDIATE_TOKEN':
        return paths(rule.content);
      default:
        return [[stop]];
    }
  }

  const prefixes = new Map();
  for (const path of paths(rules.command)) {
    if (typeof path[0] !== 'string' || typeof path[1] !== 'string') continue;
    for (let index = 2; index < path.length; index++) {
      if (typeof path[index] !== 'string') continue;
      const prefix = path.slice(0, index + 1);
      prefixes.set(JSON.stringify(prefix), prefix);
    }
  }
  return [...prefixes.values()].sort((left, right) => {
    // Prefer a literal over an operand at the first ambiguous position.
    const count = Math.min(left.length, right.length);
    for (let index = 0; index < count; index++) {
      const order = Number(typeof right[index] === 'string') - Number(typeof left[index] === 'string');
      if (order) return order;
    }
    return right.length - left.length;
  });
}

module.exports = {commandPaths};
