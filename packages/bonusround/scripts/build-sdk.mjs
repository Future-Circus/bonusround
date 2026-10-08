#!/usr/bin/env node
// Builds the browser SDK that ships inside the `bonusround` npm package (and the GitHub repo), from the repo's own sdk/:
//   index.js        ESM entry: `import { BonusRound } from 'bonusround'` (sdk/br.js + the bundled core, no network to load)
//   br.js           classic script for the CDN: <script async src="https://cdn.jsdelivr.net/npm/bonusround/br.js" data-pub="…">
//   dist/core.js    sdk/br-core.js and everything it imports, one ES module
//   dist/offline.js the bonusround.io test round, with its files in dist/offline/ (overlay runtime + three.js, models, audio),
//                   loaded only when a test break can't
//                   reach the ad server (sdk/br-core.js _offlineTestAd)
// Run: node tools/cli/scripts/build-sdk.mjs   (also runs on `npm pack` / `npm publish` via prepack)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(PKG, '../..');
const THREE_DIR = path.join(ROOT, 'node_modules/three');
// the bonusround.io fallback round (Bo mark, CTA to bonusround.io); the old Fizzpop fixture only until that one has a manifest
const HOUSE = path.join(ROOT, 'runs/house-bonusround-fallback/ad');
const IS_HOUSE = fs.existsSync(path.join(HOUSE, 'manifest.json'));
const FIXTURE = IS_HOUSE ? HOUSE : path.join(ROOT, 'runs/fizzpop-fixture/ad');
// the house round's CTA: the three.js onboarding page (founder 2026-10-07; the server's HOUSE_AD links to the same page).
// test=1 because the offline round is never billed; no brclid offline (no click row exists). offline.js adds game= at run time.
const HOUSE_CTA = { label: 'Add Bonus Round to your game',   // the round adds the ↗
  url: 'https://bonusround.io/three-js-monetization?from=house&test=1', utm: 'utm_source=bonusround&utm_medium=playable_ad&utm_campaign=bonusround-offline' };
const ROUND = IS_HOUSE ? { name: 'Bonus Round', label: 'bonusround.io test round', cta: HOUSE_CTA }
  : { name: 'Fizzpop Soda', label: 'Fizzpop Soda test round', cta: { label: 'Pop the fun', url: null } };
if (!IS_HOUSE && fs.existsSync(path.join(ROOT, 'sdk/br-core.js'))) console.warn('build-sdk: runs/house-bonusround-fallback/ad/manifest.json missing: bundling the old Fizzpop round');
if (!fs.existsSync(path.join(ROOT, 'sdk/br-core.js'))) { console.log('build-sdk: no ../../sdk here (a published copy): using the prebuilt index.js, br.js and dist/'); process.exit(0); }
const esbuild = await import('esbuild');
const version = JSON.parse(fs.readFileSync(path.join(PKG, 'package.json'), 'utf8')).version;
fs.mkdirSync(path.join(PKG, 'dist'), { recursive: true });

// '/sdk/…', '/game/…' (absolute imports the overlay page uses) and 'three' / 'three/addons/…' resolved inside this repo
const repoPaths = (bundleThree) => ({
  name: 'repo-paths',
  setup(b) {
    b.onResolve({ filter: /^\/(sdk|game|overlay)\// }, (a) => ({ path: path.join(ROOT, a.path) }));
    // sdk/mechanics/index.js finds plugins next to itself (import.meta.url): in one bundle they are static imports instead
    b.onLoad({ filter: /sdk[\\/]mechanics[\\/]index\.js$/ }, (a) => {
      const src = fs.readFileSync(a.path, 'utf8');
      const dyn = 'import(new URL(`./${want}.js`, import.meta.url).href)';
      if (!src.includes(dyn)) throw new Error('sdk/mechanics/index.js changed: update build-sdk.mjs');
      const names = JSON.parse(/export const KNOWN = (\[[^\]]*\])/.exec(src)[1].replace(/'/g, '"')).filter((n) => fs.existsSync(path.join(path.dirname(a.path), `${n}.js`)));
      const table = `const BUNDLED = { ${names.map((n) => `${JSON.stringify(n)}: () => import('./${n}.js')`).join(', ')} };\n`;
      return { contents: table + src.replace(dyn, '(BUNDLED[want] ? BUNDLED[want]() : Promise.reject(new Error(`no mechanic ${want}`)))'), loader: 'js' };
    });
    if (!bundleThree) return;
    b.onResolve({ filter: /^three$/ }, () => ({ path: path.join(THREE_DIR, 'build/three.module.js') }));
    b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: path.join(THREE_DIR, 'examples/jsm', a.path.slice('three/addons/'.length)) }));
  },
});

// 1. core: one module; three stays a (dynamic, fallback-only) import of the game's own three
const core = await esbuild.build({
  entryPoints: [path.join(ROOT, 'sdk/br-core.js')], bundle: true, format: 'esm', platform: 'browser', target: 'es2020',
  external: ['three', 'three/*'], plugins: [repoPaths(false)], write: false, legalComments: 'none', logLevel: 'error',
  banner: { js: `// Bonus Round SDK core ${version} (bundled from sdk/br-core.js). https://bonusround.io/docs/` },
});
fs.writeFileSync(path.join(PKG, 'dist/core.js'), core.outputFiles[0].text);

// 2. offline test round: the overlay page (overlay/main.js + three.js) as one module, plus the fixture package's files
const overlay = await esbuild.build({
  entryPoints: [path.join(ROOT, 'overlay/main.js')], bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
  minify: true, plugins: [repoPaths(true)], write: false, legalComments: 'none', logLevel: 'error',
  define: { 'location.search': '__BR_SEARCH__' },   // a blob: page has no query string: its params ride in the hash
});
const overlayJs = overlay.outputFiles[0].text;
const html = fs.readFileSync(path.join(ROOT, 'overlay/index.html'), 'utf8')
  .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
  .replace(/<script type="module" src="\.\/main\.js"><\/script>/, '%%BOOT%%');
if (!html.includes('%%BOOT%%')) throw new Error('overlay/index.html changed: no ./main.js module script to replace');
const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURE, 'manifest.json'), 'utf8'));
// The round's files ship as real files in dist/offline/ (no base64 in JS). offline.js names each one with a literal
// new URL('./offline/<file>', import.meta.url), the pattern Vite, webpack, Parcel and Rollup all rewrite and copy into a build.
const OFF = path.join(PKG, 'dist/offline');
fs.rmSync(OFF, { recursive: true, force: true });
fs.mkdirSync(OFF, { recursive: true });
fs.writeFileSync(path.join(OFF, 'overlay.js'), `// Bonus Round offline test round ${version}: the round runtime (overlay + three.js), started by ../offline.js\n${overlayJs}`);
const files = [];
JSON.stringify(manifest, (_k, v) => {
  if (typeof v === 'string' && /^[\w.-]+\.(png|jpg|webp|glb|mp3)$/.test(v) && fs.existsSync(path.join(FIXTURE, v)) && !files.includes(v)) {
    files.push(v); fs.copyFileSync(path.join(FIXTURE, v), path.join(OFF, v));
  }
  return v;
});
const offline = `// Bonus Round offline test round ${version}: ${ROUND.label} (never a paid ad, never billed).
// Loaded by the SDK only when a test break can't reach the ad server, or the game has no publisher id yet (sdk/br-core.js).
// Its files are next to this one, in ./offline/.
const HTML = ${JSON.stringify(html)};
const MANIFEST = ${JSON.stringify(manifest)};
const FILES = {
${files.map((f) => `  ${JSON.stringify(f)}: new URL(${JSON.stringify(`./offline/${f}`)}, import.meta.url).href,`).join('\n')}
};
const OVERLAY_JS = new URL('./offline/overlay.js', import.meta.url).href;
// Vite's dev server pre-bundles dependencies into /node_modules/.vite/deps/, where ./offline/ doesn't exist: the package's own
// copy is still served at /node_modules/bonusround/dist/.
const fix = (u) => (/\\/node_modules\\/\\.vite\\/deps(_[^/]*)?\\/offline\\//.test(u) ? u.replace(/\\/node_modules\\/\\.vite\\/deps(_[^/]*)?\\/offline\\//, '/node_modules/bonusround/dist/offline/').replace(/\\?.*$/, '') : u);
let cache = null;
const blob = (parts, type) => URL.createObjectURL(new Blob(parts, { type }));
export const brand = { name: ${JSON.stringify(ROUND.name)} };
export const label = ${JSON.stringify(ROUND.label)};
const CTA = ${JSON.stringify(ROUND.cta)};
// game= is the page's name: document.title (60 chars max), else the host name; none on file: or blank pages
function gameName() {
  try {
    if (!/^https?:$/.test(location.protocol)) return '';
    return (String(document.title || '').replace(/\\s+/g, ' ').trim().slice(0, 60).trim() || location.hostname || '');
  } catch { return ''; }
}
function ctaFor() {
  if (!CTA.utm) return { label: CTA.label, url: CTA.url };
  const g = gameName();
  return { label: CTA.label, url: CTA.url + (g ? '&game=' + encodeURIComponent(g) : '') + '&' + CTA.utm };
}
export async function offlineTestAd({ trigger = 'test' } = {}) {
  if (!cache) {
    const m = JSON.parse(JSON.stringify(MANIFEST), (_k, v) => (typeof v === 'string' && FILES[v] ? fix(FILES[v]) : v));
    const boot = '<script>var __BR_SEARCH__ = location.hash.replace(/^#/, "?");</scr' + 'ipt><script type="module" src="' + fix(OVERLAY_JS) + '"></scr' + 'ipt>';
    cache = { manifestUrl: blob([JSON.stringify(m)], 'application/json'), overlayUrl: blob([HTML.replace('%%BOOT%%', boot)], 'text/html') };
  }
  return { fill: true, test: true, offline: true, format: 'takeover', trigger, token: null, requestId: null,
    manifestUrl: cache.manifestUrl, overlayUrl: cache.overlayUrl, brand, cta: ctaFor() };
}
`;
fs.writeFileSync(path.join(PKG, 'dist/offline.js'), offline);

// 3. the loader (sdk/br.js) twice: as the package's ES module entry, and as the CDN's classic script
// the approved Bo mark (sdk/countdown.js BR_MARK_SVG, a small data: SVG), so the dev badge shows it even offline
const MARK = /export const BR_MARK_SVG = '([^']+)';/.exec(fs.readFileSync(path.join(ROOT, 'sdk/countdown.js'), 'utf8'))?.[1];
if (!MARK) throw new Error('sdk/countdown.js has no BR_MARK_SVG');
// stamped with the package version, so BonusRound.version and debug().version say which npm release this is
const loader = fs.readFileSync(path.join(ROOT, 'sdk/br.js'), 'utf8').replace(/var VERSION = '[^']*';/, `var VERSION = '${version}';`);
if (!loader.includes(`var VERSION = '${version}';`)) throw new Error("sdk/br.js has no var VERSION = '…'; to stamp");
if (!loader.includes('cfg0.loadCore') || !loader.includes('cfg0.loadOffline')) throw new Error('sdk/br.js has no loadCore/loadOffline hooks');
const esm = `// Bonus Round SDK ${version} for three.js games: https://bonusround.io/docs/  ·  npm i bonusround
//   import { BonusRound } from 'bonusround';
//   BonusRound.init({ pub: 'pub_…' });                       // your publisher id (none yet: the test round still plays)
//   BonusRound.attach({ THREE, scene, camera, renderer });    // once, after all four exist
//   await BonusRound.break('intermission');                  // at each natural break
// The SDK code is bundled here; ads (and the runtime of live rounds) come from https://bonusround.io at play time.
const BR_SSR = typeof window === 'undefined' || typeof document === 'undefined';
if (!BR_SSR) {
  const cfg = (window.bonusroundConfig = window.bonusroundConfig || {});
  if (!cfg.base) cfg.base = 'https://bonusround.io';
  if (!cfg.loadCore) cfg.loadCore = () => import('./dist/core.js');
  if (!cfg.loadOffline) cfg.loadOffline = () => import('./dist/offline.js');
  if (!cfg.markSvg) cfg.markSvg = ${JSON.stringify(MARK)};
${loader.replace(/^/gm, '  ')}
}
const noop = () => Promise.resolve({ filled: false, completed: false, reason: 'ssr' });
const stub = { version: ${JSON.stringify(version)}, init() { return stub; }, config() { return stub; }, attach: noop, break: noop, zone: noop, rewarded: noop, safe() { return stub; },
  placeAmbient() { return stub; }, on() { return stub; }, off() { return stub; }, cancel: () => false, consent() { return stub; }, debug: noop, ready: () => Promise.resolve(stub) };
/** window.BonusRound (a no-op stub during server-side rendering). */
export const BonusRound = BR_SSR ? stub : window.BonusRound;
export default BonusRound;
`;
fs.writeFileSync(path.join(PKG, 'index.js'), esm);
const classic = `/*! Bonus Round SDK ${version} (npm: bonusround) · <script async src="https://cdn.jsdelivr.net/npm/bonusround@${version.split('.')[0] === '0' ? version.split('.').slice(0, 2).join('.') : version.split('.')[0]}/br.js" data-pub="pub_…"></script> */
(function () {
  var s = document.currentScript, dir = s && s.src ? s.src.replace(/[?#].*$/, '').replace(/\\/[^\\/]*$/, '') : '';
  var cfg = (window.bonusroundConfig = window.bonusroundConfig || {});
  if (!cfg.base) cfg.base = (s && s.getAttribute('data-server')) || 'https://bonusround.io';
  if (dir && !cfg.loadCore) cfg.loadCore = function () { return import(dir + '/dist/core.js'); };
  if (dir && !cfg.loadOffline) cfg.loadOffline = function () { return import(dir + '/dist/offline.js'); };
  if (!cfg.markSvg) cfg.markSvg = ${JSON.stringify(MARK)};
})();
${loader}`;
fs.writeFileSync(path.join(PKG, 'br.js'), classic);

// 4. the agent copies of the README (one source of truth): AGENTS.md and llms.txt inside the package
const readme = fs.readFileSync(path.join(PKG, 'README.md'), 'utf8');
const body = readme.replace(/^# .*\n/, '');
fs.writeFileSync(path.join(PKG, 'AGENTS.md'), `# AGENTS.md: integrate Bonus Round (bonusround.io) into a three.js game\n\n<!-- generated from README.md by scripts/build-sdk.mjs -->\n${body}`);
fs.writeFileSync(path.join(PKG, 'llms.txt'), `# Bonus Round (bonusround.io)\n\n> Playable ads for three.js games. npm package: bonusround (SDK + CLI + types). This file is the full integration recipe and works offline.\n${body}`);

// 5. the alias packages (bonusround.io, @bonusround/sdk) carry the same README, so whichever name an agent tries, it gets the recipe
for (const [dir, name] of [['bonusround.io', 'bonusround.io'], ['sdk', '@bonusround/sdk']]) {
  const d = path.join(ROOT, 'tools/npm-aliases', dir);
  if (fs.existsSync(d)) fs.writeFileSync(path.join(d, 'README.md'), `> **\`${name}\` is an alias of [\`bonusround\`](https://www.npmjs.com/package/bonusround).** Prefer \`npm i bonusround\`; \`import { BonusRound } from '${name}'\` works too.\n\n${readme}`);
}

// 6. @bonusround/mcp's README: how to add the server, then the same recipe (an agent may only ever read this one)
const mcpDir = path.join(ROOT, 'tools/mcp');
if (fs.existsSync(mcpDir)) fs.writeFileSync(path.join(mcpDir, 'README.md'), `# @bonusround/mcp: Bonus Round MCP server

MCP server for **[Bonus Round](https://bonusround.io)** (bonusround.io), playable ads for three.js games. It lets an AI coding agent register the user's game, get its install snippet, check that bonusround.io has seen the SDK, and read the integration guide. The SDK itself is the npm package [\`bonusround\`](https://www.npmjs.com/package/bonusround). Its recipe is copied below, so this README is enough on its own.

\`\`\`bash
# Claude Code
# Recommended: the hosted server, sign in with your Bonus Round account (OAuth)
claude mcp add --transport http bonusround https://bonusround.io/mcp      # then /mcp → bonusround → Authenticate
# Claude.ai / ChatGPT: add https://bonusround.io/mcp as a custom connector and sign in
# Alternative: an API key header on the hosted server
claude mcp add --transport http bonusround https://bonusround.io/mcp --header "Authorization: Bearer br_sk_…"
# Alternative: this package, the local stdio server
claude mcp add bonusround --env BONUSROUND_API_KEY=br_sk_… -- npx -y @bonusround/mcp
# any MCP client (stdio)
{ "mcpServers": { "bonusround": { "command": "npx", "args": ["-y", "@bonusround/mcp"], "env": { "BONUSROUND_API_KEY": "br_sk_…" } } } }
\`\`\`

Signing in is optional. The hosted server's \`bonusround_integration_guide\`, \`bonusround_docs\` and \`bonusround_register_game\` work without it: register the game with no account, and a human claims it later. The first account tool asks the user to sign in, and then \`bonusround_claim_game\` moves a game registered without an account into their workspace. For this stdio package, the API key comes from https://bonusround.io/app/developers/, or \`npx bonusround login\` saves one. Without a key, \`bonusround_integration_guide\` still works, and you can integrate with the \`pub_XXXXXXXX\` placeholder. \`BONUSROUND_URL\` points the server at another host.

| Tool | What it does |
| --- | --- |
| \`bonusround_integration_guide\` | The full integration recipe (works offline: a copy ships in this package) |
| \`bonusround_register_game\` (hosted, no account) | Registers the game without an account: returns its pub id, snippet and the \`claimUrl\` for the human |
| \`bonusround_claim_game\` (hosted, signed in) | Moves a game registered without an account into the signed-in user's workspace (pass its \`claimToken\`) |
| \`bonusround_list_games\` / \`bonusround_create_game\` | The account's games / register one by its public URL |
| \`bonusround_get_snippet\` | The script tag, the npm import lines, the attach and break lines, and the ads.txt line for a game |
| \`bonusround_integration_status\` | Whether bonusround.io has seen the SDK (polls with \`waitSeconds\`) |
| \`bonusround_start_learning\`, \`bonusround_get_stats\`, \`bonusround_update_settings\` | Learning, earnings and settings (ask the user before changing settings) |

---

${body.replace(/\n\*\*\[bonusround\.io\][^\n]*\n/, '').replace('the SDK is in this package', 'the SDK is in the `bonusround` npm package')}`);

const kb = (f) => `${(fs.statSync(path.join(PKG, f)).size / 1024).toFixed(0)} KB`;
console.log(`bonusround ${version}: index.js ${kb('index.js')} · br.js ${kb('br.js')} · dist/core.js ${kb('dist/core.js')} · dist/offline.js ${kb('dist/offline.js')} + dist/offline/ ${Math.round(fs.readdirSync(OFF).reduce((n, f) => n + fs.statSync(path.join(OFF, f)).size, 0) / 1024)} KB (${files.length} files + overlay.js)`);
