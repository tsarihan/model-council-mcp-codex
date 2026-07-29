/**
 * Static validation of the Claude and Codex plugin manifests and MCP configs.
 * Mirrors the checks `claude plugin validate` performs, plus a cross-check that
 * every ${user_config.KEY} used in .mcp.json is declared in plugin.json.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let errors = 0;
let warnings = 0;
const ok = m => console.log(`  ✅ ${m}`);
const err = m => { errors++; console.log(`  ❌ ${m}`); };
const warn = m => { warnings++; console.log(`  ⚠️  ${m}`); };

function readJson(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

// ── plugin.json ────────────────────────────────────────────────────────────
console.log('\n▶ .claude-plugin/plugin.json');
const plugin = readJson('.claude-plugin/plugin.json');
if (!plugin) { err('plugin.json missing or unparseable'); }
else {
  plugin.name ? ok(`name: ${plugin.name}`) : err('missing name');
  /^[a-z0-9-]+$/.test(plugin.name ?? '') ? ok('name is kebab-case') : err('name must be kebab-case');
  plugin.description ? ok('has description') : err('missing description');
  plugin.version ? ok(`version: ${plugin.version}`) : warn('no version (git SHA will be used)');
  plugin.license ? ok(`license: ${plugin.license}`) : warn('no license');

  const validTypes = ['string', 'number', 'boolean', 'directory', 'file'];
  const uc = plugin.userConfig ?? {};
  const ucKeys = Object.keys(uc);
  ok(`userConfig options: ${ucKeys.length}`);
  for (const [k, opt] of Object.entries(uc)) {
    /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) || err(`userConfig key not a valid identifier: ${k}`);
    validTypes.includes(opt.type) || err(`userConfig ${k}: bad type "${opt.type}"`);
    opt.title || err(`userConfig ${k}: missing title`);
    opt.description || err(`userConfig ${k}: missing description`);
    if (opt.type === 'number' && opt.default !== undefined) {
      (typeof opt.default === 'number') || err(`userConfig ${k}: default must be number`);
      if (opt.min !== undefined && opt.default < opt.min) err(`userConfig ${k}: default < min`);
      if (opt.max !== undefined && opt.default > opt.max) err(`userConfig ${k}: default > max`);
    }
  }
}

// ── .mcp.json ────────────────────────────────────────────────────────────────
console.log('\n▶ .mcp.json');
const mcp = readJson('.mcp.json');
if (!mcp) { err('.mcp.json missing or unparseable'); }
else {
  const servers = mcp.mcpServers ?? {};
  const names = Object.keys(servers);
  names.length ? ok(`declares server(s): ${names.join(', ')}`) : err('no mcpServers');

  const raw = readFileSync(join(root, '.mcp.json'), 'utf8');

  // CLAUDE_PLUGIN_ROOT usage
  raw.includes('${CLAUDE_PLUGIN_ROOT}')
    ? ok('uses ${CLAUDE_PLUGIN_ROOT}')
    : err('server path should use ${CLAUDE_PLUGIN_ROOT}');

  // bundle exists
  const bundlePath = join(root, 'bundle/server.cjs');
  existsSync(bundlePath) ? ok('bundle/server.cjs exists') : err('bundle/server.cjs missing — run npm run bundle');

  // Cross-check: every ${user_config.KEY} maps to a declared userConfig key
  const used = [...raw.matchAll(/\$\{user_config\.([A-Za-z0-9_]+)\}/g)].map(m => m[1]);
  const declared = new Set(Object.keys(plugin?.userConfig ?? {}));
  const uniqueUsed = [...new Set(used)];
  ok(`references ${uniqueUsed.length} user_config keys`);
  for (const key of uniqueUsed) {
    declared.has(key)
      ? null
      : err('.mcp.json references ${user_config.' + key + '} but plugin.json has no such userConfig key');
  }
  // Reverse: declared but unused (warning only)
  for (const key of declared) {
    uniqueUsed.includes(key) || warn(`userConfig "${key}" declared but not used in .mcp.json`);
  }
  if (uniqueUsed.every(k => declared.has(k))) ok('all user_config references resolve');
}

// ── Codex plugin ─────────────────────────────────────────────────────────────
console.log('\n▶ .codex-plugin/plugin.json');
const codexPlugin = readJson('.codex-plugin/plugin.json');
if (!codexPlugin) { err('Codex plugin.json missing or unparseable'); }
else {
  codexPlugin.name === plugin?.name
    ? ok(`name matches Claude plugin: ${codexPlugin.name}`)
    : err('Codex and Claude plugin names differ');
  codexPlugin.version === plugin?.version
    ? ok(`version matches Claude plugin: ${codexPlugin.version}`)
    : err('Codex and Claude plugin versions differ');
  codexPlugin.author?.name ? ok(`author: ${codexPlugin.author.name}`) : err('missing author.name');
  codexPlugin.interface?.displayName ? ok('has interface metadata') : err('missing interface.displayName');
  codexPlugin.skills === './skills/'
    ? ok('loads Codex setup/status skills')
    : err('Codex plugin must load ./skills/');
  codexPlugin.mcpServers?.['model-council']
    ? ok('declares inline Codex MCP server')
    : err('missing inline model-council MCP server');
}

console.log('\n▶ Codex MCP map');
const codexMcp = codexPlugin?.mcpServers;
if (!codexMcp) { err('Codex plugin missing mcpServers map'); }
else {
  const server = codexMcp['model-council'];
  server ? ok('declares model-council server') : err('model-council server missing');
  server?.command === 'node' ? ok('uses node transport command') : err('Codex server command must be node');
  server?.args?.[0] === '${PLUGIN_ROOT}/bundle/server.cjs'
    ? ok('uses ${PLUGIN_ROOT} for installed bundle')
    : err('Codex server path must use ${PLUGIN_ROOT}/bundle/server.cjs');
  existsSync(join(root, 'bundle/server.cjs'))
    ? ok('Codex bundle target exists')
    : err('Codex bundle target missing');
}

console.log('\n▶ Codex workflow parity');
for (const skill of ['model-council-status', 'setup-model-council']) {
  const rel = `skills/${skill}/SKILL.md`;
  const body = existsSync(join(root, rel)) ? readFileSync(join(root, rel), 'utf8') : '';
  body ? ok(`${skill} skill exists`) : err(`${rel} missing`);
  !body.includes('[TODO:') ? ok(`${skill} has no placeholders`) : err(`${skill} contains TODO placeholders`);
}
const welcomePath = join(root, 'bin/session-welcome.mjs');
const welcome = existsSync(welcomePath) ? readFileSync(welcomePath, 'utf8') : '';
if (!welcome) err('bin/session-welcome.mjs missing');
welcome.includes('$model-council-status') && welcome.includes('$setup-model-council')
  ? ok('SessionStart advertises Codex skills')
  : err('SessionStart missing Codex-native guidance');
welcome.includes('/model-council:status') && welcome.includes('/model-council:setup')
  ? ok('SessionStart preserves Claude commands')
  : err('SessionStart lost Claude command guidance');

// ── Codex marketplace ───────────────────────────────────────────────────────
console.log('\n▶ .agents/plugins/marketplace.json');
const codexMarketplace = readJson('.agents/plugins/marketplace.json');
if (!codexMarketplace) { err('Codex marketplace missing or unparseable'); }
else {
  codexMarketplace.name === 'model-council-codex'
    ? ok(`marketplace name: ${codexMarketplace.name}`)
    : err('Codex marketplace name must be model-council-codex');
  const entries = Array.isArray(codexMarketplace.plugins) ? codexMarketplace.plugins : [];
  const entry = entries.find(p => p?.name === codexPlugin?.name);
  entry ? ok(`lists plugin: ${codexPlugin?.name}`) : err('Codex marketplace does not list the plugin');
  entry?.source?.source === 'local' && entry?.source?.path === '.'
    ? ok('repository-root source resolves to Codex plugin')
    : err('Codex marketplace source must be local path "."');
  entry?.policy?.installation === 'AVAILABLE' ? ok('installation policy is AVAILABLE') : err('bad installation policy');
  entry?.policy?.authentication === 'ON_INSTALL' ? ok('authentication policy is ON_INSTALL') : err('bad authentication policy');
}

// ── marketplace.json ─────────────────────────────────────────────────────────
console.log('\n▶ .claude-plugin/marketplace.json');
const mkt = readJson('.claude-plugin/marketplace.json');
if (!mkt) { err('marketplace.json missing or unparseable'); }
else {
  mkt.name ? ok(`marketplace name: ${mkt.name}`) : err('missing name');
  mkt.owner?.name ? ok(`owner: ${mkt.owner.name}`) : err('missing owner.name');
  Array.isArray(mkt.plugins) && mkt.plugins.length ? ok(`lists ${mkt.plugins.length} plugin(s)`) : err('no plugins listed');
  for (const p of mkt.plugins ?? []) {
    p.name || err('plugin entry missing name');
    p.source || err(`plugin ${p.name}: missing source`);
    // If source is "./", the plugin.json must exist at root
    if (p.source === './') {
      existsSync(join(root, '.claude-plugin/plugin.json'))
        ? ok(`source "./" resolves to plugin.json`)
        : err('source "./" but no .claude-plugin/plugin.json at root');
    }
  }
  mkt.metadata?.version === plugin?.version
    ? ok('marketplace metadata version matches plugin')
    : err(`marketplace metadata version ${mkt.metadata?.version ?? '(missing)'} does not match plugin ${plugin?.version ?? '(missing)'}`);
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Validation: ${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);
