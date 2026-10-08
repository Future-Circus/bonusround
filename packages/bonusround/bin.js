#!/usr/bin/env node
// bonusround: CLI for Bonus Round, the ad network for three.js games.
//   npx bonusround init [dir] [--pub pub_…] [--game-url URL] [--yes] [--dry-run] [--npm|--script-tag] [--no-install]
//   npx bonusround login [--key br_sk_…]     npx bonusround logout
//   npx bonusround status [gameId] [--wait 60]     npx bonusround whoami
// Server: --server URL, else $BONUSROUND_URL, else the URL saved by login, else https://bonusround.io.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { makeClient } from './lib/api.js';
import { loadCredentials, saveCredentials, deleteCredentials, credentialsPath } from './lib/credentials.js';
import { spawnSync } from 'node:child_process';
import { walk, detectThree, findRendererFile, planAttach, planR3F, planHtml, planImportmap, importmapUrlFor, chooseHtmlEntry, scriptTagFor, apply, unifiedDiff } from './lib/detect.js';

const VERSION = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  b: (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s), dim: (s) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
  g: (s) => (tty ? `\x1b[32m${s}\x1b[0m` : s), y: (s) => (tty ? `\x1b[33m${s}\x1b[0m` : s), r: (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
};
const say = (...a) => console.log(...a);
const warn = (s) => console.log(c.y(`! ${s}`));
const die = (s, code = 1) => { console.error(c.r(`✗ ${s}`)); process.exit(code); };

// ---------- args ----------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-y') out.yes = true;
    else if (a === '-h') out.help = true;
    else if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      const key = k.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      if (v !== undefined) out[key] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('-') && ['pub', 'gameUrl', 'server', 'key', 'wait', 'game', 'name'].includes(key)) out[key] = argv[++i];
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const cmd = args._.shift() || (args.help ? 'help' : 'help');
const saved = loadCredentials();
const server = String(args.server || process.env.BONUSROUND_URL || saved.url || 'https://bonusround.io').replace(/\/+$/, '');
const apiKey = process.env.BONUSROUND_API_KEY || (saved.url && saved.url.replace(/\/+$/, '') !== server ? '' : saved.apiKey) || '';
const { api } = makeClient({ baseUrl: server, apiKey, userAgent: `bonusround-cli/${VERSION}` });

function ask(q, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
    if (hidden && process.stdin.isTTY) {
      rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); else rl.output.write('*'.repeat(Math.min(s.length, 1))); };
    }
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}
const interactive = () => process.stdin.isTTY && !args.yes;

// ---------- commands ----------
const HELP = `${c.b('bonusround')} ${VERSION}: put Bonus Rounds in your three.js game.

  ${c.b('init')} [dir]       Detect three.js, add the SDK (npm import, import map or script tag) + attach line, show a diff, ask, write.
                    Works offline: no account needed (placeholder pub_XXXXXXXX; the bundled test round plays).
                    --pub pub_…      use this publisher id (else from your account, else asks)
                    --game-url URL   register the game with this URL if it isn't on your account yet
                    --yes            write without asking      --dry-run   only show the diff
                    --npm | --script-tag   force how the SDK is loaded    --no-install   don't run npm install
  ${c.b('login')}            Save an API key (from ${server}/app/developers/) to ${credentialsPath()}
                    --key br_sk_…    non-interactive
  ${c.b('logout')}           Delete the saved key
  ${c.b('status')} [gameId]  SDK seen? learning? test mode?   --wait 60  poll until the SDK is seen
                    (no login: the game init registered, from .bonusround/agent.json, with its claim link)
  ${c.b('whoami')}           Which account the saved key belongs to

  Server: --server URL, $BONUSROUND_URL, or https://bonusround.io.  Docs: ${server}/docs/`;

async function cmdLogin() {
  let key = args.key || process.env.BONUSROUND_API_KEY;
  if (!key) {
    if (!process.stdin.isTTY) die('No key. Pass --key br_sk_… or set BONUSROUND_API_KEY.');
    say(`Create an API key at ${c.b(`${server}/app/developers/`)} and paste it here.`);
    key = await ask('API key: ', { hidden: true });
  }
  if (!/^br_sk_[A-Za-z0-9_]+$/.test(key)) die('That does not look like a Bonus Round key (br_sk_…).');
  const { api: probe } = makeClient({ baseUrl: server, apiKey: key, userAgent: `bonusround-cli/${VERSION}` });
  let me;
  try { me = await probe('/api/v1/whoami'); } catch (err) { die(`Key check failed: ${err.message}`); }
  const file = saveCredentials({ apiKey: key, url: server, email: me.user?.email || null });
  say(c.g(`✓ Logged in as ${me.user?.email} (${key.slice(0, 12)}…). Saved to ${file} (0600).`));
}

async function cmdLogout() {
  say(deleteCredentials() ? c.g(`✓ Removed ${credentialsPath()}`) : 'No saved key.');
}

async function cmdWhoami() {
  try {
    const me = await api('/api/v1/whoami');
    say(`${me.user.email} · ${me.auth === 'api_key' ? `key ${me.key.prefix}… (${me.key.name})` : 'session'} · ${me.games.length} game(s) · ${server}`);
  } catch (err) { die(err.message); }
}

const statusLine = (g) => {
  const seen = g.integration?.lastSeenAt ?? g.lastSeenAt;
  return `${c.b(g.name || g.url)}  ${c.dim(`${g.id} · ${g.pubId}`)}\n  status ${g.status} · ${g.testMode ? 'test mode (Fizzpop test ad)' : 'live'} · SDK ${seen ? c.g(`seen ${new Date(seen).toLocaleString()}`) : c.y('not seen yet')}`
    + (g.integration?.sdkVersion ? ` · br.js ${g.integration.sdkVersion} · three r${g.integration.threeRevision}` : '');
};

async function cmdStatus() {
  const reg = !apiKey ? loadAgentReg(path.resolve(args.dir || '.')) : null;
  if (reg?.pubId && reg.provisionalKey) {
    const { api: agentApi } = makeClient({ baseUrl: reg.server || server, apiKey: reg.provisionalKey, userAgent: `bonusround-cli/${VERSION}` });
    try {
      const g = args.wait ? await agentApi(`/api/agent/games/${reg.pubId}/verify`, { method: 'POST', body: { waitSeconds: Math.min(60, Number(args.wait) || 0) } }) : await agentApi(`/api/agent/games/${reg.pubId}`);
      const MODES = { dev: 'dev host (test ad only)', test: 'test mode (Fizzpop test ad)', house: 'free house ads (unpaid)', paid: 'paid ads' };
      const mode = MODES[g.mode] || (g.testMode ? MODES.test : 'live');
      const next = typeof g.next === 'string' ? g.next : g.nextStep;
      say(`${c.b(g.name || g.url)}  ${c.dim(g.pubId)}\n  ${g.claimed ? 'claimed' : 'not claimed yet'} · ${mode}${g.learning ? ' · learning' : ''} · SDK ${g.integration?.lastSeenAt ? c.g(`seen ${new Date(g.integration.lastSeenAt).toLocaleString()}`) : c.y('not seen yet')}${next ? `\n  Next: ${next}` : ''}${!g.claimed && g.unclaimedDeleteAt ? `\n  ${c.dim('Unclaimed games are removed after 90 days.')}` : ''}`);
      if (g.claimUrl) say(g.tellTheHuman || `Bonus Round is live in your game (free house ads). Create your account to turn on paid ads and get paid: ${g.claimUrl}`);
    } catch (err) { die(err.message); }
    return;
  }
  let gameId = args._[0] || args.game;
  let games = [];
  try { games = (await api('/api/v1/whoami')).games; } catch (err) { die(err.message); }
  if (!gameId) {
    if (!games.length) { say(`No games yet. Run ${c.b('npx bonusround init')} in your game's folder, or add one at ${server}/app/games/.`); return; }
    if (games.length > 1 && !args.wait) { for (const g of games) say(statusLine(g)); return; }
    gameId = games[0].id;
  }
  const waitUntil = Date.now() + Number(args.wait || 0) * 1000;
  for (;;) {
    let g;
    try { g = await api(`/api/games/${encodeURIComponent(gameId)}`); } catch (err) {
      if (!err.missingRoute) die(err.message);
      g = games.find((x) => x.id === gameId); // publisher route not deployed: fall back to whoami's summary
      if (!g) die(err.message);
    }
    if (g.integration?.lastSeenAt || g.lastSeenAt || Date.now() >= waitUntil) { say(statusLine(g)); return; }
    process.stdout.write(c.dim('.')); await new Promise((r) => setTimeout(r, 3000));
    try { games = (await api('/api/v1/whoami')).games; } catch { /* keep polling */ }
  }
}

// A name for a newly registered game: --name, else the HTML <title>, else the folder name.
function defaultName(root, html) {
  if (args.name) return String(args.name);
  try {
    const t = /<title[^>]*>([^<]*)<\/title>/i.exec(fs.readFileSync(html, 'utf8'))?.[1]?.trim();
    if (t) return t.slice(0, 80);
  } catch { /* no html */ }
  return path.basename(root);
}

// No account: register the game with bonusround.io's agent endpoint (test mode until a human claims it), and keep
// { pubId, provisionalKey, claimUrl } in .bonusround/agent.json (gitignored). Offline, or a server without the endpoint:
// null, and init writes the pub_XXXXXXXX placeholder instead. Never on --dry-run (registering is a side effect).
const AGENT_FILE = (root) => path.join(root, '.bonusround', 'agent.json');
function loadAgentReg(root) { try { return JSON.parse(fs.readFileSync(AGENT_FILE(root), 'utf8')); } catch { return null; } }
async function agentRegister(root, html) {
  const prev = loadAgentReg(root);
  if (prev?.pubId && (!prev.server || prev.server === server)) {
    say(c.dim(`  · using the game registered earlier (${prev.pubId}, .bonusround/agent.json)`));
    return { pub: prev.pubId, claimUrl: prev.claimUrl || null, agent: true };
  }
  if (args.dryRun || args.noRegister || !args.yes) {
    if (args.dryRun || !args.yes) say(c.dim('  · not logged in: init --yes also registers this game with bonusround.io (test mode, no account needed; --no-register to skip). This diff uses a placeholder id.'));
    return null;
  }
  let pkgHome = null;
  try { pkgHome = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).homepage || null; } catch { /* none */ }
  const url = String(args.gameUrl || (/^https?:\/\//.test(pkgHome || '') ? pkgHome : 'http://localhost:5173/'));
  let res, data;
  try {
    res = await fetch(`${server}/api/agent/games`, {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': `bonusround-cli/${VERSION}` },
      body: JSON.stringify({ url, name: defaultName(root, html), agent: 'bonusround-cli' }),
    });
    data = await res.json().catch(() => null);
  } catch (err) {
    say(c.dim(`  · ${server} unreachable (${err.cause?.code || err.name}): using the placeholder pub_XXXXXXXX. The SDK plays its bundled test round until you set a real id.`));
    return null;
  }
  if (!res.ok || !data?.pubId) {
    if (res.status !== 404) warn(`Couldn't register the game without an account (${res.status}${data?.error ? `: ${data.error}` : ''}).`);
    return null;
  }
  fs.mkdirSync(path.dirname(AGENT_FILE(root)), { recursive: true });
  fs.writeFileSync(AGENT_FILE(root), JSON.stringify({ server, pubId: data.pubId, gameId: data.gameId, url: data.url || url, provisionalKey: data.provisionalKey || null, claimUrl: data.claimUrl || null, statusUrl: data.statusUrl || null, at: new Date().toISOString() }, null, 2) + '\n', { mode: 0o600 });
  fs.writeFileSync(path.join(path.dirname(AGENT_FILE(root)), '.gitignore'), '*\n');   // the provisional key never lands in git
  say(c.g(`✓ Registered ${data.url || url} as ${data.pubId} (test mode, no account yet). Saved to .bonusround/agent.json (gitignored).`));
  return { pub: data.pubId, gameId: data.gameId, scriptTag: data.scriptTag || data.snippet?.scriptTag, claimUrl: data.claimUrl || null, tellTheHuman: data.tellTheHuman || null, agent: true };
}

async function resolveGame(root, html) {
  if (args.pub) return { pub: String(args.pub) };
  if (!apiKey) {
    const reg = await agentRegister(root, html);
    if (reg) return reg;
    warn(`Not logged in, so I can't look up your publisher id. Run ${c.b('npx bonusround login')} or pass --pub pub_….`);
  } else {
    try {
      let games = await api('/api/games');
      games = Array.isArray(games) ? games : games.games || [];
      const want = args.gameUrl ? new URL(args.gameUrl).host : null;
      let game = want ? games.find((g) => { try { return new URL(g.url).host === want; } catch { return false; } }) : null;
      if (!game && games.length === 1 && !want) {
        game = games[0];
        say(c.dim(`  · using your game "${game.name || game.url}" (${game.url}, ${game.pubId}). For a different game, pass --game-url <where it runs>.`));
      }
      if (!game && games.length > 1 && interactive()) {
        games.forEach((g, i) => say(`  ${i + 1}) ${g.name || g.url}  ${c.dim(g.pubId)}`));
        const n = Number(await ask('Which game? '));
        game = games[n - 1];
      }
      if (!game) {
        const url = args.gameUrl || (interactive() ? await ask('Where will the game be hosted (URL)? ') : '');
        // Registering creates a game on the account: never as a side effect of --dry-run, or of a run that can't write anyway.
        const willWrite = !args.dryRun && (args.yes || process.stdin.isTTY);
        if (url && !willWrite) {
          say(c.dim(`  · ${url} isn't on your account yet. It will be registered when you run init${args.gameUrl ? ` --game-url ${url}` : ''} --yes; the diff below uses a placeholder id.`));
          return { pub: 'pub_XXXXXXXX', pending: true };
        }
        if (url) { game = (await api('/api/games', { method: 'POST', body: { url, name: defaultName(root, html) } })).game; say(c.g(`✓ Registered ${url} as ${game.pubId}`)); }
      }
      if (game) {
        const full = game.snippet ? game : await api(`/api/games/${game.id}`).catch(() => game);
        return { pub: full.pubId, gameId: full.id, scriptTag: full.snippet?.scriptTag };
      }
    } catch (err) {
      warn(`Couldn't load your games from ${server}: ${err.message}`);
    }
  }
  if (interactive()) {
    const pub = await ask(`Publisher id (pub_…, from ${server}/app/games/): `);
    if (/^pub_\w+$/.test(pub)) return { pub };
  }
  warn('No publisher id: using the placeholder pub_XXXXXXXX. Replace it before you ship.');
  return { pub: 'pub_XXXXXXXX' };
}

async function cmdInit() {
  const root = path.resolve(args._[0] || '.');
  if (!fs.existsSync(root)) die(`${root} does not exist`);
  const files = walk(root);
  const three = detectThree(root, files);
  say(c.b(`Bonus Round init · ${root}`));
  if (!three.isThree) die('This does not look like a three.js project (no "three" in package.json, no importmap or CDN script, no imports of three).');
  for (const s of three.signals.slice(0, 6)) say(c.dim(`  · ${s}`));

  // How the SDK gets into the page:
  //   npm       a bundler (Vite, webpack, Next, …) or R3F: import { BonusRound } from 'bonusround' (no script tag, works offline)
  //   importmap an import-map game: "bonusround" mapped next to "three", same import
  //   tag       classic scripts / global THREE: the <script> tag + command queue
  const how = args.scriptTag ? 'tag' : args.npm ? 'npm' : (three.bundler || three.framework === 'r3f') ? 'npm' : three.importmap ? 'importmap' : 'tag';
  const style = how === 'tag' ? 'queue' : 'import';
  say(c.dim(`  · integration: ${{ npm: 'npm package (import from "bonusround")', importmap: 'import map entry + import from "bonusround"', tag: 'script tag' }[how]}`));

  const rendererFiles = findRendererFile(root, files);
  const html = how === 'importmap' ? three.importmap.file : chooseHtmlEntry(root, files, rendererFiles[0]);
  const game = await resolveGame(root, html);

  // Code edit: renderer file (vanilla / bundler) or <Canvas> (R3F).
  const plans = [];
  let found = null, notes = [];
  if (rendererFiles.length) {
    const p = planAttach(root, rendererFiles[0], { style, pub: game.pub, server: server !== 'https://bonusround.io' ? server : null });
    if (p.skip) say(c.dim(`  · ${p.skip}`));
    else if (p.error) die(p.error);
    else { plans.push(p); found = p.found; notes = p.notes; }
    if (rendererFiles.length > 1) notes.push(`Other files also create a renderer: ${rendererFiles.slice(1, 4).map((f) => path.relative(root, f)).join(', ')}. Only ${path.relative(root, rendererFiles[0])} was changed.`);
  } else if (three.framework === 'r3f') {
    const p = planR3F(root, files, { style, pub: game.pub });
    if (p.skip) say(c.dim(`  · ${p.skip}`));
    else if (p.error) die(p.error);
    else { plans.push(p); found = p.found; notes = p.notes; }
  } else {
    die('three.js found, but no "new THREE.WebGLRenderer(" anywhere. Add the attach line by hand: see the README of the bonusround package (npm view bonusround readme)');
  }
  if (found) say(c.dim(`  · renderer ${found.renderer} · scene ${found.scene ?? '?'} · camera ${found.camera ?? '?'} · THREE ${found.THREE}${found.breakSite ? ` · break site ${found.breakSite}()` : ''}`));

  // HTML: the script tag (tag) or the import map entry (importmap). npm needs neither.
  if (how === 'importmap') {
    const h = planImportmap(root, html, importmapUrlFor(three.importmap.three));
    if (h.skip) say(c.dim(`  · ${h.skip}`)); else if (h.error) die(h.error); else plans.unshift(h);
  } else if (how === 'tag') {
    const host = new URL(server).origin;
    const tag = scriptTagFor({ host, pub: game.pub, scriptTag: game.scriptTag });
    if (!html) notes.push(`No HTML entry found. Add this to the <head> of the page that runs the game:\n    ${tag}`);
    else {
      const h = planHtml(root, html, tag);
      if (h.skip) say(c.dim(`  · ${h.skip}`)); else plans.unshift(h);
    }
  }
  if (server !== 'https://bonusround.io' && style === 'import') notes.push(`Server is ${server}, so init() points at it. Remove server: '…' before you ship.`);

  // npm i bonusround (npm path, or an import map pointing into node_modules)
  const needsInstall = (how === 'npm' || (how === 'importmap' && /node_modules\//.test(importmapUrlFor(three.importmap.three))))
    && fs.existsSync(path.join(root, 'package.json')) && !three.pkg?.dependencies?.bonusround && !three.pkg?.devDependencies?.bonusround;
  const pm = fs.existsSync(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm' : fs.existsSync(path.join(root, 'yarn.lock')) ? 'yarn' : fs.existsSync(path.join(root, 'bun.lockb')) || fs.existsSync(path.join(root, 'bun.lock')) ? 'bun' : 'npm';
  const installCmd = pm === 'npm' ? ['npm', ['install', 'bonusround@^1']] : [pm, ['add', 'bonusround@^1']];

  if (!plans.length && !needsInstall) { say(c.g('✓ Already integrated. Nothing to change.')); return printNext(game, style); }

  say('');
  if (needsInstall) say(`${c.b('$')} ${installCmd[0]} ${installCmd[1].join(' ')}\n`);
  for (const p of plans) {
    if (p.newFile) say(c.g(`+++ new file ${path.relative(root, p.newFile.file)}\n${p.newFile.content.split('\n').map((l) => `+${l}`).join('\n')}`));
    say(unifiedDiff(path.relative(root, p.file), fs.readFileSync(p.file, 'utf8'), p.insertions, tty, p.replacements || []));
    say('');
  }
  for (const n of notes) warn(n);
  if (args.dryRun) { say(c.dim('Dry run: nothing written.')); return; }
  if (!args.yes) {
    if (!process.stdin.isTTY) die('Not a terminal, so I can\'t ask. Re-run with --yes to write these changes (or --dry-run).', 2);
    const a = (await ask('Write these changes? [y/N] ')).toLowerCase();
    if (a !== 'y' && a !== 'yes') { say('Nothing written.'); return; }
  }
  if (needsInstall && !args.noInstall) {
    const r = spawnSync(installCmd[0], installCmd[1], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
    if (r.status === 0) say(c.g('✓ installed bonusround'));
    else warn(`"${installCmd[0]} ${installCmd[1].join(' ')}" failed. Run it yourself; the code changes below need the package.`);
  }
  for (const p of plans) {
    if (p.newFile && !fs.existsSync(p.newFile.file)) fs.writeFileSync(p.newFile.file, p.newFile.content);
    fs.writeFileSync(p.file, apply(fs.readFileSync(p.file, 'utf8'), p.insertions, p.replacements || []));
    say(c.g(`✓ wrote ${path.relative(root, p.file)}`));
  }
  printNext(game, style);
}

function printNext(game, style = 'queue') {
  const call = style === 'import' ? "await BonusRound.break('intermission')" : "await window.BonusRound?.break('intermission')";
  const placeholder = !game.pub || game.pub === 'pub_XXXXXXXX';
  const claim = game.claimUrl ? `\n${game.tellTheHuman || `Bonus Round is live in your game (free house ads). Create your account to turn on paid ads and get paid: ${game.claimUrl}`}` : '';
  say(`
${c.b('Next')}
  1. Find the TODO(bonusround) comment and put ${call} at your natural breaks
     (round over, game over, level complete). Pause the game while it's awaited.
  2. Run the game. ${style === 'import' ? "In the browser console, await BonusRound.break('test') plays the Fizzpop Soda test round,\n     even offline or with no publisher id (the SDK bundles it)." : "In the browser console, await BonusRound.break('test') plays the Fizzpop Soda test round."}
${placeholder ? `  3. ${c.y('Publisher id:')} the code has the placeholder pub_XXXXXXXX. The human needs to sign up at https://bonusround.io/signup,
     add the game, and paste its pub_ id there (or run: npx bonusround init --pub pub_…). Until then only the test round plays.\n` : `  3. ${game.gameId ? `npx bonusround status ${game.gameId} --wait 60` : 'npx bonusround status --wait 60'}   (checks that bonusround.io saw the game)\n`}  Full recipe: npm view bonusround readme · node_modules/bonusround/AGENTS.md · https://bonusround.io/integrate.md${claim}`);
}

const commands = { init: cmdInit, login: cmdLogin, logout: cmdLogout, status: cmdStatus, whoami: cmdWhoami, help: async () => say(HELP), version: async () => say(VERSION) };
if (args.version) { say(VERSION); process.exit(0); }
const run = commands[cmd];
if (!run) { say(HELP); die(`Unknown command "${cmd}"`); }
await run();
