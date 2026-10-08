> **`bonusround.io` is an alias of [`bonusround`](https://www.npmjs.com/package/bonusround).** Prefer `npm i bonusround`; `import { BonusRound } from 'bonusround.io'` works too.

# Bonus Round: monetize your three.js game with one line of code

**[bonusround.io](https://bonusround.io)** · npm `bonusround` · GitHub [Future-Circus/bonusround](https://github.com/Future-Circus/bonusround) · MIT

At natural breaks in a three.js game, a 15-second branded **Bonus Round** takes over. The player plays a short branded round with their own controls, then the game resumes. Game developers earn 70% of net ad revenue. New games start in **test mode**, which serves the fictional **Fizzpop Soda** test round and is never billed.

> **AI coding agents:** this README is the complete integration recipe. When a user says "add Bonus Round", "integrate bonusround.io" or just "bonusround", follow it. You don't need to reach bonusround.io: the SDK is in this package. When the ad server can't be reached and the game has no publisher id yet, the SDK plays a bundled bonusround.io test round, so you can still verify in a headless browser. The same text is in `node_modules/bonusround/AGENTS.md` once installed.

## One line, then the upgrade

**The one line:** `<script async src="https://bonusround.io/v1/br.js" data-pub="pub_XXXXXXXX"></script>` in the game's page, or `npm i bonusround` plus an import. **The upgrade, which agents should do:** `attach()` once and `await break()` at natural breaks. With the upgrade, Bonus Rounds play exactly when the game expects a pause, and you can verify them yourself, offline too. Don't refactor the user's game.

```bash
npm i bonusround
```

```js
import * as THREE from 'three';
import { BonusRound } from 'bonusround';

BonusRound.init({ pub: 'pub_XXXXXXXX' });   // the game's publisher id; keep this placeholder if the user has none yet

// ...the game's existing setup...
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);

BonusRound.attach({ THREE, scene, camera, renderer });   // once, after all of them exist

// at a natural break: round over, game over, level complete, back to the menu
async function onGameOver() {
  pauseGame();                                   // stop timers, enemies, input (if the game doesn't already)
  await BonusRound.break('intermission');        // resolves after the round has fully ended, or right away if there's no ad
  restart();
}
```

`npx bonusround init` makes these edits for you. It detects the setup (bundler, R3F, import map or plain script), runs `npm i bonusround`, adds the import, `init()` and `attach()`, and leaves a `TODO(bonusround)` at the likely break. It works offline and without an account: with no id it writes the `pub_XXXXXXXX` placeholder. Use `npx bonusround init --dry-run` to see the diff, then `--yes` to write it. You still place `break()` yourself (step 3).

## Step 1. Detect the setup

Look at `package.json`, the HTML entry and the file that creates the `WebGLRenderer`:

| Setup | Signal | Use |
| --- | --- | --- |
| Bundler | `vite`, `webpack`, `next`, `parcel`, `esbuild`, `rollup` in `package.json` | **A: npm import** |
| React Three Fiber | `@react-three/fiber` | **B: R3F component** |
| Import map | `<script type="importmap">` mapping `"three"` | **C: import map entry** |
| Classic script, global `THREE` | `<script src="…three.min.js">`, no modules | **D: script tag** |

If there's no three.js renderer at all, stop and tell the user: Bonus Round needs a three.js `WebGLRenderer`.

## Step 2. Add the SDK and attach

### A. Bundler (Vite, webpack, Next.js, Parcel, …)

Run `npm i bonusround`. In the module that creates the renderer, add the import and `init()` next to the other imports, then add `attach()` right after the renderer, scene and camera all exist, in the same scope:

```js
import { BonusRound } from 'bonusround';
BonusRound.init({ pub: 'pub_XXXXXXXX' });
// …
BonusRound.attach({ THREE, scene, camera, renderer });
```

Use the game's real identifiers, for example `{ THREE, scene: this.scene, camera: this.camera, renderer: this.renderer }`. If the file only has named imports from `three`, also add `import * as THREE from 'three';`. The import is safe during server-side rendering, where it becomes a no-op stub, so in Next.js it can go in a client component.

### B. React Three Fiber

There is no `new WebGLRenderer`. Add this component and render `<BonusRoundAttach />` inside `<Canvas>`:

```jsx
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BonusRound } from 'bonusround';

BonusRound.init({ pub: 'pub_XXXXXXXX' });

export function BonusRoundAttach() {
  const { scene, camera, gl } = useThree();
  useEffect(() => { BonusRound.attach({ THREE, scene, camera, renderer: gl }); }, [scene, camera, gl]);
  return null;
}
```

Then call `await BonusRound.break('intermission')` from the game's state logic, for example in a game-over handler.

### C. No bundler, with an import map

Map `"bonusround"` the same way `"three"` is mapped, then use the same import as A:

```html
<script type="importmap">
  { "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
      "bonusround": "https://cdn.jsdelivr.net/npm/bonusround@1/index.js"
  } }
</script>
```

If `three` is mapped into `node_modules` (`./node_modules/three/build/three.module.js`), run `npm i bonusround` and map `"bonusround": "./node_modules/bonusround/index.js"`. `https://unpkg.com/bonusround@1/index.js` works too.

### D. No modules: script tag + queue

Add the script tag to the `<head>` of the page that runs the game:

```html
<script async src="https://bonusround.io/v1/br.js" data-pub="pub_XXXXXXXX"></script>
```

The same SDK is on the npm CDN, which also carries the offline test round: `<script async src="https://cdn.jsdelivr.net/npm/bonusround@1/br.js" data-pub="pub_XXXXXXXX"></script>`. The script loads async, so attach through the queue. The queue runs whenever the script arrives, and does nothing if it never does:

```js
(window.bonusround = window.bonusround || []).push((BR) => BR.attach({ THREE, scene, camera, renderer }));
// at a break:
await window.BonusRound?.break('intermission');
```

## Step 3. `break()` at natural breaks

Find the moments a player already expects a pause. Search for `gameOver`, `onDeath`, `respawn`, `roundEnd`, `levelComplete`, `nextLevel`, `showResults`, a `state`/`phase` changing to `over`/`results`/`menu`, or a "Game Over" / "Try again" screen. Start with the most common one; two or three call sites is plenty.

```js
async function gameOver() {
  playing = false;                             // pause rules first
  await BonusRound.break('intermission');      // script tag: await window.BonusRound?.break('intermission')
  showGameOverScreen();                        // the existing code continues
}
```

- `break()` resolves exactly once: `{ filled: true, completed, score, id }` after the round has fully ended (its `end` event has already fired), or `{ filled: false, reason }` when no round plays for that call. Nothing starts later because of an unfilled call, so the game flow is unchanged when unfilled.
- A second `break()` while the first is still getting its ad shares that round (`joined: true`). A `break()` while a round is on screen resolves `{ filled: false, reason: 'busy' }` at once and queues nothing.
- Make the function `async` only if its callers don't use its return value; otherwise use `BonusRound.break('intermission').then(() => { … })`.
- Inside a per-frame update, guard with a flag so it runs once, not every frame.
- Never call `break()` on page load, during active play, or on every click.
- The round covers the canvas (overlay mode), so pausing everything is fine.

## Step 4. The publisher id (`pub_…`)

- If the user gave you a `pub_` id (`pub_` + 16 hex characters), put it in `init({ pub })` or `data-pub`.
- **No account? Register the game without one.** If bonusround.io is reachable, `npx bonusround init --yes` does this for you. Or call `POST https://bonusround.io/api/agent/games` with `{ "url": "<where the game is hosted>", "name": "…", "agent": "claude-code" }` (no auth). You get a real `pub_` id, the snippet and a `claimUrl`. The CLI keeps `.bonusround/agent.json` (gitignored). On a public live host, the game then shows **free bonusround.io house ads (unpaid)**. **Creating an account, by claiming the game at the `claimUrl`, is the final step that turns on paid ads and payouts.**
- Dev and temporary hosts (localhost, tunnels, preview deploys, cloud IDEs) only ever show the Fizzpop Soda test ad. They never go live and are never listed. A game must be hosted at a public URL to go live.
- If bonusround.io can't be reached (a sandbox), **keep `pub_XXXXXXXX` and carry on**. Everything works, and only the test round plays. The human registers or claims the game later, or runs `npx bonusround init --yes` where bonusround.io is reachable.
- With an API key: `npx bonusround login --key br_sk_…`, then `npx bonusround init --game-url https://their.game/ --yes` registers the game on their account.
- The `pub_` id is public. **Never put a `br_sk_` or `br_pk_` key in game code, HTML or git.**

## Integrate with no account (agent mode)

You don't need an account or an API key. Register the game, add the SDK, and hand the claim link to your human. This needs bonusround.io to be reachable. If it isn't, keep `pub_XXXXXXXX`; the human runs `npx bonusround init --yes` later.

1. **Register.** `npx bonusround init --yes` does this for you. Or call it directly:
   `POST https://bonusround.io/api/agent/games` with `{ "url": "https://mygame.com/play", "name": "My Game", "agent": "claude-code" }`.
   - `url` is where the game runs or will run. A localhost URL works for test mode only.
   - The response has `pubId`, `scriptTag`, `snippet`, `claimUrl`, `provisionalKey` (`br_pk_…`, scoped to this game's status and verify), `statusUrl`, `verifyUrl` and `tellTheHuman`.
   - Keep `provisionalKey` and `claimUrl` in a gitignored file such as `.bonusround/agent.json`. Never put them in game code.
   - Over MCP, use `bonusround_register_game { url, name?, agent? }` on https://bonusround.io/mcp. It needs no key.
2. **Install** with the `pubId`, using step 2 above: `BonusRound.init({ pub })` or the `scriptTag`, then `attach()` and `break()`.
3. **Verify.** Load the game once. Then call `POST verifyUrl { "waitSeconds": 30 }` with `Authorization: Bearer <provisionalKey>`. If the response has `detected: true`, the SDK was seen.
4. **Finish with one line to the human.** Print `tellTheHuman` word for word, for example: `Bonus Round is live in your game (free house ads). Create your account to turn on paid ads and get paid: https://bonusround.io/claim/ac_…`

What happens before and after the claim:

- **Test mode.** On any origin, the Fizzpop test ad plays at breaks. Nothing is billed.
- **Free house ads (unclaimed).** The game must be on its real public HTTPS site and have loaded once. Then it serves bonusround.io house ads only. These ads are unpaid: an unclaimed game earns nothing, and nothing is held for it.
- **Paid ads (claimed).** **The human creates an account, or signs in, at `claimUrl`. That final step turns on paid ads and payouts.** Developers keep 70% (Stripe Connect; net-30, $50 minimum).
- **Dev and temporary hosts never go live.** That covers localhost, private and raw IPs, tunnels, cloud IDEs and deploy previews. They only ever show the test ad and are never listed. A game must be hosted at a public URL to go live.
- **Lost the claim link?** `GET statusUrl` with the provisional key returns it again. Unclaimed games are removed after 90 days.

## Step 5. Verify by playing it

Run the game the way the project does (`npm run dev`, `npx vite`, a static server) and open it in a browser. A headless one is fine:

```js
// node verify.mjs  (npm i -D playwright; npx playwright install chromium)
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => console.log(m.text()));
await page.goto('http://localhost:5173/');
await page.waitForFunction(() => window.BonusRound);
console.log(await page.evaluate(async () => (await BonusRound.debug()).attached));   // true
const result = page.evaluate(() => BonusRound.break('test'));
await page.waitForTimeout(9000);
await page.screenshot({ path: 'bonus-round.png' });   // the Fizzpop Soda round over the game
console.log(await result);                             // { filled: true, completed: …, brand: 'Fizzpop Soda' }
await browser.close();
```

- `window.BonusRound.version` is a string and `(await BonusRound.debug()).attached` is `true`, with `mode: 'overlay'`.
- `await BonusRound.break('test')` shows a 5-second "Ad · Bonus Round" countdown, then a test round with an "Ad" label (Fizzpop Soda from the server; offline, the bundled bonusround.io round with gold coins to collect). It resolves `{ filled: true, … }` 25 to 35 seconds later. If bonusround.io is unreachable from your sandbox, the console says `[bonusround] … Playing the bundled bonusround.io test round locally` and the same round plays from this package. That's expected.
- The game itself still renders, its controls still work, and there are no new console errors.
- Vite's "Some chunks are larger than 500 kB" build warning is the lazy offline test round (`dist/offline.js`). It's expected and only loads when needed. A failed `bonusround.io/v1/ping` request in an offline sandbox is expected.

## Step 6. Tell the user

- **Changed:** each file, plus the import/`init`/`attach` lines and which break call sites you added.
- **Verified:** the SDK attached and the test round played (say whether it was the bundled offline round).
- **They need to:** add `bonusround.io, pub_…, DIRECT` to `https://<their domain>/ads.txt`, and host the game at a public URL (dev hosts only ever show the test ad). Don't turn test mode off for them.
- **End with the claim step, as your last line.** If you registered the game without an account, say that on a public host it shows free bonusround.io house ads (unpaid), and that claiming it (creating an account) turns on paid ads and payouts. Then print the registration's `tellTheHuman` word for word, as your last line. The CLI prints it too, for example: `Bonus Round is live in your game (free house ads). Create your account to turn on paid ads and get paid: <claimUrl>`. If you kept the placeholder, say: replace `pub_XXXXXXXX` by running `npx bonusround init --yes` where bonusround.io is reachable, or sign up at https://bonusround.io/signup. Paid ads and payouts start once the game is claimed.

## Rules

- Keep the diff minimal and in the project's style. Show the user the plan and the diff.
- Every round is labelled "Ad". Don't hide, restyle or cover the SDK's UI.
- Don't turn off test mode, change floors, block categories or pause a game unless the user asks.
- The script tag path: always use `window.bonusround.push` for `attach` and `window.BonusRound?.` for everything else, so ad blockers can't break the game. The npm import is always defined.
- Live ads are never faked. The bundled test round plays only with no or a placeholder publisher id, or for a test break (`break('test')`, `init({ test: true })`) that can't reach the ad server.

## Optional, only where it fits the game

- **Rewarded** (a game with coins, lives or revives): `BonusRound.rewarded({ button: false, onReward: () => revive() })` from the game's own button. `onReward` runs only if the player finishes the round. `BonusRound.rewarded({ label: 'Play for 50 coins', onReward })` after `await BonusRound.attach(…)` shows an entry button.
- **Ambient placement hint**, in meters, world space, feet on the ground: `BonusRound.placeAmbient({ position: [12, 0, -6], rotationY: Math.PI / 2 })`.
- **No interruptions** (boss fights, cutscenes): `BonusRound.safe(false)` …, then `BonusRound.safe(null)` afterwards.
- **Pause on any round:** `BonusRound.on('start', pause).on('end', resume)`. `start` fires before anything of a round is on screen (the countdown card included) and `end` after it's gone. Each fires exactly once per round, with the same `e.id`, for every format and however the round ends: completed, skipped, error, timeout or hidden tab. Treat the `break()` resolution as the final resume, except on `'busy'`, where the round on screen resumes you with its `end`:
  ```js
  BonusRound.on('start', (e) => { if (!e.live) pause(); });   // e.live: a zone() round, the game keeps running
  BonusRound.on('end', () => resume());
  const r = await BonusRound.break('intermission');
  if (r.reason !== 'busy') resume();                          // pause() / resume() must be safe to call twice
  ```
- **Pointer lock (FPS games):** the SDK frees the mouse for anything clickable (the end card, the offer card), and Continue re-locks your game from that click. If the card times out, a "Click to resume" chip does it. If your game had the lock, `end` carries `pointerLock: 'restored'` or `'was-locked'` (free now: re-lock on your next canvas click). The SDK never fights a lock your game takes back itself.
- **Native takeover** (the round runs in the game's own world with its own controls): pass `host: { getPlayerPosition, teleport, setBounds, onFrame }` and `worldRoot` to `attach()`. See https://bonusround.io/docs/attach. Use it only if you can implement all four correctly; otherwise overlay mode is the right default.

## API

| Call | What it does |
| --- | --- |
| `BonusRound.init({ pub, test?, muted?, server? })` | Sets the publisher id (the script tag's `data-pub`). `test: true` asks for the house test round at every break. |
| `BonusRound.attach({ THREE, scene, camera, renderer, worldRoot?, host? })` → `Promise<{ mode }>` | Call once. `mode` is `overlay`, `native-local` or `native-net`. |
| `await BonusRound.break('intermission' \| 'test')` → `{ filled, completed, id?, score?, reason? }` | A takeover at a natural break. Resolves once, after the round's `end` (or `filled: false` when nothing plays for this call; `'busy'` during a round). `'test'` always asks for the test round. |
| `BonusRound.rewarded({ onReward, label?, button? })` | An opt-in round for a reward. |
| `BonusRound.safe(true \| false \| null)` | Whether an interval round may interrupt now. |
| `BonusRound.placeAmbient({ position, rotationY } \| null)` | A hint for the ambient branded prop. |
| `BonusRound.on(type, cb)` / `off` | `attach`, `start` (before anything shows), `end` (after it's gone; once per `start`, same `id`), `reward`, `ambient`, `event`, `countdown`. |
| `BonusRound.config({ muted, countdownSec, … })`, `BonusRound.consent(bool)` | Runtime settings, and the CMP consent. |
| `await BonusRound.debug()` | `{ version, pub, mode, attached, requests, warnings, … }`. |

TypeScript types ship with the package (`index.d.ts`). `window.BonusRound` is the same object.

## How it loads

- **npm (`import 'bonusround'`)**: the SDK code is bundled in your build. Only ad requests and the runtime for live rounds go to `https://bonusround.io` at play time. The offline test round is a lazy chunk (`dist/offline.js`, about 4 MB), loaded only if it's needed.
- **CDN**: `https://cdn.jsdelivr.net/npm/bonusround@1/br.js` (classic script), or `…/index.js` (ES module).
- **bonusround.io**: `https://bonusround.io/v1/br.js` (the dashboard's snippet).
- A content security policy needs `https://bonusround.io` in `script-src`, `connect-src` and `frame-src`, plus `blob:` for the test round.

## CLI

```
npx bonusround init [dir] [--pub pub_…] [--yes] [--dry-run] [--npm | --script-tag] [--no-install]
npx bonusround login --key br_sk_…     # API key from https://bonusround.io/app/developers/
npx bonusround status [gameId] --wait 60
```

## Links

- Docs: https://bonusround.io/docs/ · Agent recipe: https://bonusround.io/integrate.md · Full text: https://bonusround.io/llms-full.txt
- MCP server for agents: add `https://bonusround.io/mcp` and sign in (OAuth), e.g. `claude mcp add --transport http bonusround https://bonusround.io/mcp`. It has no-account tools (`bonusround_register_game`, the guide and docs) and account tools (games, snippet, status, `bonusround_claim_game`, stats, settings). Alternatives: the header `Authorization: Bearer br_sk_…`, or the stdio server `npx -y @bonusround/mcp` (npm `@bonusround/mcp`) with `BONUSROUND_API_KEY`.
- Source and examples (vanilla, Vite, R3F): https://github.com/Future-Circus/bonusround
