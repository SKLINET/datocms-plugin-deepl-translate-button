const assert = require('assert');
const pkg = require('../package.json');

function parameter(id) {
  const globalParams = pkg.datoCmsPlugin && pkg.datoCmsPlugin.parameters && pkg.datoCmsPlugin.parameters.global;
  assert.ok(Array.isArray(globalParams), 'plugin must declare global parameters');
  const found = globalParams.find((item) => item.id === id);
  assert.ok(found, `missing parameter ${id}`);
  return found;
}

const useFreeDeeplApi = parameter('useFreeDeeplApi');
assert.strictEqual(
  useFreeDeeplApi.required,
  false,
  'Use free DeepL API must accept off (false) so a Pro key can be saved',
);
assert.strictEqual(useFreeDeeplApi.default, false);

const developmentMode = parameter('developmentMode');
assert.strictEqual(
  developmentMode.required,
  false,
  'Development mode must accept off (false); a required boolean cannot be saved as false',
);

const sidebarSource = require('fs').readFileSync(
  require('path').join(__dirname, '../src/index.tsx'),
  'utf8',
);
assert.ok(
  sidebarSource.includes('startAutoResizer()'),
  'sidebar iframe must report its height, otherwise the translate button stays invisible',
);
assert.ok(
  sidebarSource.includes('initialHeight:'),
  'sidebar panel needs an initial height before the first resize',
);
