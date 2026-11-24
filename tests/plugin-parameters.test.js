const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const meta = pkg.datoCmsPlugin;
assert.ok(meta && meta.entryPoint, 'datoCmsPlugin.entryPoint is required for the Marketplace');
assert.ok(Array.isArray(meta.permissions), 'datoCmsPlugin.permissions is required for the Marketplace');
for (const legacyKey of ['pluginType', 'fieldTypes', 'parameters']) {
  assert.ok(
    !(legacyKey in meta),
    `datoCmsPlugin.${legacyKey} marks the package as a legacy plugin; DatoCMS then never runs connect() or the sidebar panel`,
  );
}

const configSource = fs.readFileSync(
  path.join(__dirname, '../src/entrypoints/ConfigScreen.tsx'),
  'utf8',
);
const freeApiSwitch = configSource.match(/<SwitchField[^>]*name="useFreeDeeplApi"[\s\S]*?\/>/);
assert.ok(freeApiSwitch, 'config screen must offer the free DeepL API switch');
assert.ok(
  !/\brequired\b/.test(freeApiSwitch[0]),
  'Use free DeepL API must accept off (false) so a Pro key can be saved',
);

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
