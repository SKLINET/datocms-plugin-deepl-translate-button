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

const fs = require('fs');
const path = require('path');

const sidebarSource = fs.readFileSync(path.join(__dirname, '../src/index.tsx'), 'utf8');
assert.ok(
  sidebarSource.includes('initialHeight:'),
  'sidebar panel needs an initial height before the first resize',
);

const assetsDir = path.join(__dirname, '../dist/assets');
const bundles = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'))
  : [];
assert.ok(bundles.length > 0, 'run the build before the tests: dist/assets has no bundle');
const bundle = bundles.map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf8')).join('\n');
assert.ok(
  !/\.current\.useEffect\(/.test(bundle),
  'bundle contains a second (React 18) copy used by datocms-react-ui; its hooks crash and the panel renders nothing',
);
