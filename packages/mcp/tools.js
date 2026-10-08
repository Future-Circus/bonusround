// Bonus Round MCP tools + prompt. Shared by tools/mcp/server.js (stdio) and platform/devapi/routes.js (hosted /mcp).
// Every tool calls the public REST API documented in PLATFORM.md, so the MCP server can never do more than the API key can.
import { z } from 'zod';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const usd = (micros) => `$${(Number(micros || 0) / 1e6).toFixed(2)}`;

const text = (t) => ({ content: [{ type: 'text', text: t }] });
const json = (lead, obj) => ({ content: [{ type: 'text', text: `${lead}\n\n${JSON.stringify(obj, null, 2)}` }] });
const fail = (err) => ({ isError: true, content: [{ type: 'text', text: err.message || String(err) }] });
const safe = (fn) => async (args) => { try { return await fn(args || {}); } catch (err) { return fail(err); } };

const gameSummary = (g) => g && ({
  id: g.id, pubId: g.pubId, name: g.name, url: g.url, status: g.status, testMode: g.testMode,
  lastSeenAt: g.integration?.lastSeenAt ?? null,
});

function snippetFor(game, baseUrl) {
  const host = new URL(baseUrl).host;
  const s = game.snippet || {};
  const pub = game.pubId || 'pub_XXXXXXXX';
  return {
    scriptTag: s.scriptTag || `<script async src="${new URL(baseUrl).origin}/v1/br.js" data-pub="${pub}"></script>`,
    // The queue form: br.js is async, so a bare BonusRound.attach(...) can run before it exists and throw (integrate.md, Rules).
    attachLine: s.attachQueued || '(window.bonusround = window.bonusround || []).push((BR) => BR.attach({ THREE, scene, camera, renderer }));',
    breakLine: "await window.BonusRound?.break('intermission');",
    // the npm package (bundlers, R3F, import maps): no script tag; plays a bundled test round when bonusround.io is unreachable
    npm: {
      install: 'npm i bonusround',
      importLines: `import { BonusRound } from 'bonusround';\nBonusRound.init({ pub: '${pub}' });`,
      attachLine: 'BonusRound.attach({ THREE, scene, camera, renderer });',
      breakLine: "await BonusRound.break('intermission');",
      importmapEntry: '"bonusround": "https://cdn.jsdelivr.net/npm/bonusround@1/index.js"',
    },
    rewardedLine: "rewardButton.onclick = () => window.BonusRound?.rewarded({ button: false, onReward: () => { /* grant the reward */ } });",
    adsTxt: s.adsTxt || `${host}, ${pub}, DIRECT`,
  };
}

function nextStep(game) {
  const seen = game.integration?.lastSeenAt;
  if (!seen) return 'Not seen yet. Open the game in a browser (the page that has the script tag), play for a few seconds, then call bonusround_integration_status again with waitSeconds: 60. If it stays unseen: check the script tag is in the HTML that actually loads, data-pub matches pubId, and the page origin matches the game URL you registered.';
  if (game.status === 'detected') return 'The SDK is live. Learning should start automatically; if status stays "detected", call bonusround_start_learning.';
  if (game.status === 'learning') return 'The SDK is live and the play agent is learning the game (controls, scale, art style, a spot for the ambient prop). This takes a few minutes. Test mode serves the Fizzpop Soda test Bonus Round in the meantime.';
  if (game.status === 'ready') return game.testMode
    ? 'Ready. Test mode is on, so every break serves the Fizzpop Soda test round (never billed, never paid). Turn test mode off with bonusround_update_settings { testMode: false } once the user is happy.'
    : 'Live: real brands can now generate Bonus Rounds for this game. Earnings appear in bonusround_get_stats.';
  if (game.status === 'paused') return 'The game is paused: no ads serve. Ask the user before changing that.';
  return `Status: ${game.status}.`;
}

// Deep merge for settings so a partial patch ({ formats: { takeover: { intervalSec: 240 } } }) keeps everything else.
function merge(a, b) {
  if (Array.isArray(b) || b === null || typeof b !== 'object') return b;
  const out = { ...(a && typeof a === 'object' && !Array.isArray(a) ? a : {}) };
  for (const [k, v] of Object.entries(b)) if (v !== undefined) out[k] = merge(out[k], v);
  return out;
}

const Trigger = z.enum(['intermission', 'interval', 'rewarded']);
const SettingsPatch = z.object({
  formats: z.object({
    takeover: z.object({
      enabled: z.boolean().optional(),
      triggers: z.array(Trigger).optional().describe('Which takeover triggers may serve.'),
      intervalSec: z.number().int().min(60).optional().describe('For the interval trigger: offer a round at most this often.'),
    }).partial().optional(),
    ambient: z.object({ enabled: z.boolean().optional() }).partial().optional(),
  }).partial().optional(),
  floorCpmMicros: z.object({ takeover: z.number().int().min(0).optional(), ambient: z.number().int().min(0).optional() }).partial().optional()
    .describe('Minimum price per 1,000 impressions, in micros (1 USD = 1,000,000).'),
  blockedCategories: z.array(z.string()).optional().describe('Advertiser categories never shown in this game. Replaces the whole list.'),
  frequencyCap: z.object({ perHour: z.number().int().min(1).optional() }).partial().optional().describe('Max takeover rounds per player per hour.'),
}).partial();

export function registerBonusRoundTools(server, { api, baseUrl, guide }) {
  const getGame = (gameId) => api(`/api/games/${encodeURIComponent(gameId)}`);

  server.registerTool('bonusround_list_games', {
    title: 'List games',
    description: 'List the Bonus Round games (publisher properties) on this account, with their pub ids, status and whether the SDK has been seen.',
    inputSchema: {},
    annotations: { title: 'List games', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, safe(async () => {
    const games = await api('/api/games');
    const list = (Array.isArray(games) ? games : games.games || []).map(gameSummary);
    return json(list.length ? `${list.length} game(s).` : 'No games yet. Create one with bonusround_create_game { url }.', { games: list });
  }));

  server.registerTool('bonusround_create_game', {
    title: 'Create game',
    annotations: { title: 'Create game', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    description: 'Register a three.js game with Bonus Round. Returns the game id, its public pub_ id and the install snippet. Use the URL where the game is (or will be) hosted; that origin is what the SDK ping is matched against.',
    inputSchema: {
      url: z.string().url().describe('Public URL of the game, e.g. https://mygame.example.com/play'),
      name: z.string().max(80).optional().describe('Display name; defaults to the page title.'),
    },
  }, safe(async ({ url, name }) => {
    const { game } = await api('/api/games', { method: 'POST', body: { url, ...(name ? { name } : {}) } });
    return json(`Created ${game.name || game.url} (${game.pubId}). Add the snippet next.`, { game: gameSummary(game), snippet: snippetFor(game, baseUrl) });
  }));

  server.registerTool('bonusround_get_snippet', {
    title: 'Get install snippet',
    description: 'The exact script tag (with this game\'s data-pub), the attach line, example break/rewarded calls and the ads.txt line for a game.',
    inputSchema: { gameId: z.string().describe('Game id (gm_…) from bonusround_list_games') },
    annotations: { title: 'Get install snippet', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, safe(async ({ gameId }) => {
    const game = await getGame(gameId);
    const s = snippetFor(game, baseUrl);
    return json([
      `Snippet for ${game.name || game.url} (${game.pubId}):`,
      '1. Put scriptTag in the <head> of the HTML page that runs the game.',
      '2. Add attachLine once, right after your renderer, scene and camera exist (it is the queue form, safe before br.js loads). Pass the THREE namespace your game uses.',
      '3. Call breakLine at natural breaks (round end, death/respawn, level complete, pause/lobby).',
      '4. Optional: rewardedLine on the game\'s own "play for a reward" button (onReward runs only if the player finishes the round).',
      '5. Before going live, add adsTxt to https://<your domain>/ads.txt.',
    ].join('\n'), s);
  }));

  server.registerTool('bonusround_integration_status', {
    title: 'Integration status',
    description: 'Check whether the Bonus Round SDK has been seen running in the game (integration.lastSeenAt), plus learning status and test mode. Pass waitSeconds to poll until the SDK is seen, after you load the game in a browser.',
    inputSchema: {
      gameId: z.string(),
      waitSeconds: z.number().int().min(0).max(120).optional().describe('Poll every 3 s for up to this long until integration.lastSeenAt is set. Default 0 (check once).'),
    },
    annotations: { title: 'Integration status', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, safe(async ({ gameId, waitSeconds = 0 }) => {
    const until = Date.now() + waitSeconds * 1000;
    let game = await getGame(gameId);
    while (!game.integration?.lastSeenAt && Date.now() < until) { await sleep(3000); game = await getGame(gameId); }
    const out = {
      detected: !!game.integration?.lastSeenAt, status: game.status, testMode: game.testMode,
      integration: game.integration || null, world: game.world ?? null, nextStep: nextStep(game),
    };
    return json(out.detected ? `SDK seen ${new Date(out.integration.lastSeenAt).toISOString()} (status: ${game.status}).` : 'SDK not seen yet.', out);
  }));

  server.registerTool('bonusround_start_learning', {
    title: 'Start learning',
    annotations: { title: 'Start learning', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    description: '(Re)start the Bonus Round play agent for a game: it plays the game in a headless browser to learn controls, scale, art style and a good spot for the ambient prop. Starts automatically on the first SDK ping; call this to re-learn after big changes.',
    inputSchema: { gameId: z.string() },
  }, safe(async ({ gameId }) => {
    const r = await api(`/api/games/${encodeURIComponent(gameId)}/learn`, { method: 'POST' });
    return json(r.alreadyRunning ? 'The play agent is already learning this game. Follow progress with bonusround_integration_status (status goes learning → ready).' : 'Learning started. Follow progress with bonusround_integration_status (status goes learning → ready).', r);
  }));

  server.registerTool('bonusround_get_stats', {
    title: 'Game stats',
    description: 'Requests, fill rate, impressions, viewable impressions, engagements, clicks, earnings and eCPM for a game. Money is in micros (1 USD = 1,000,000); a dollars summary is included. Test-mode traffic never earns and is counted separately under `test`, not in the totals.',
    inputSchema: { gameId: z.string(), days: z.number().int().min(1).max(365).optional().describe('Default 30') },
    annotations: { title: 'Game stats', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, safe(async ({ gameId, days = 30 }) => {
    const s = await api(`/api/games/${encodeURIComponent(gameId)}/stats?days=${days}`);
    const t = s.totals || {};
    const tt = s.test || {};
    const lead = `Last ${days} days: ${t.requests ?? 0} requests, ${t.impressions ?? 0} impressions, ${t.engagements ?? 0} engagements, ${t.clicks ?? 0} clicks, earnings ${usd(t.earningsMicros)}, eCPM ${usd(t.ecpmMicros)}, fill rate ${((t.fillRate || 0) * 100).toFixed(1)}%.`
      + (tt.requests ? ` Test ads (Fizzpop, never billed, not in the totals): ${tt.requests} requests, ${tt.impressions ?? 0} impressions.` : '');
    return json(lead, s);
  }));

  server.registerTool('bonusround_update_settings', {
    title: 'Update game settings',
    annotations: { title: 'Update game settings', readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    description: 'Change a game: name, test mode, content rating, categories, allowed domains, paused, and ad settings (formats, triggers, interval, floors, blocked categories, frequency cap). settings is deep-merged into the current settings. Turning testMode off makes the game eligible for paid ads: confirm with the user first.',
    inputSchema: {
      gameId: z.string(),
      name: z.string().max(80).optional(),
      testMode: z.boolean().optional().describe('true = only the Fizzpop test ad, never billed. false = live.'),
      rating: z.enum(['everyone', 'teen', 'mature']).optional(),
      categories: z.array(z.string()).optional().describe('Game genres, e.g. ["arcade","racing"]'),
      domains: z.array(z.string()).max(20).optional().describe('Hostnames allowed to serve ads, e.g. ["mygame.com","mygame.itch.io"]. Replaces the whole list; subdomains are included. localhost always works.'),
      paused: z.boolean().optional().describe('true stops all ads in this game right away. Only when the user asks.'),
      settings: SettingsPatch.optional(),
    },
  }, safe(async ({ gameId, settings, ...rest }) => {
    const body = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    if (settings) body.settings = merge((await getGame(gameId)).settings || {}, settings);
    if (!Object.keys(body).length) return text('Nothing to change.');
    const game = await api(`/api/games/${encodeURIComponent(gameId)}`, { method: 'PATCH', body });
    const g = game.game || game;
    return json('Updated.', { game: gameSummary(g), settings: g.settings, rating: g.rating, categories: g.categories, domains: g.domains });
  }));

  server.registerTool('bonusround_integration_guide', {
    title: 'Integration guide',
    description: 'The canonical step-by-step recipe for AI coding agents integrating Bonus Round into a three.js game (integrate.md). Read this before editing the user\'s game.',
    inputSchema: {},
    annotations: { title: 'Integration guide', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, safe(async () => text(await guide())));

  server.registerPrompt('integrate-bonus-round', {
    title: 'Integrate Bonus Round',
    description: 'Integrate Bonus Round into the three.js game in this project, verify it is live, and report back.',
    argsSchema: {
      gameUrl: z.string().optional().describe('Where the game is hosted (used to register it)'),
      pubId: z.string().optional().describe('An existing pub_ id, if the user already has one'),
    },
  }, async ({ gameUrl, pubId } = {}) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: [
          'Integrate Bonus Round into the three.js game in this project.',
          gameUrl ? `The game is hosted at ${gameUrl}.` : '',
          pubId ? `Use the existing publisher id ${pubId}.` : 'Use the bonusround_* tools to find or create the game and get its pub id.',
          'Follow this guide exactly, verify with bonusround_integration_status, and finish with the report it describes.',
          '',
          await guide(),
        ].filter((l) => l !== '').join('\n'),
      },
    }],
  }));
}
