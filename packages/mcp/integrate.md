# Integrate Bonus Round into a three.js game (recipe for AI coding agents)

You are an AI coding agent. The user asked you to integrate **Bonus Round**, an ad network for three.js games, into their game. Follow these steps in order. Each step says what to look for, what to change, and how to know it worked. Bonus Round lets developers monetize a three.js game with one line of code (the script tag, or an npm import). Do the upgrade too: one attach line, and an `await` at each natural break. Don't refactor the user's game.

What the user gets: at natural breaks a 15-second branded Bonus Round takes over the game, with the player's own character and controls, plus a branded prop in the world. They earn 70% of net ad revenue (what brands spend, minus any disclosed agency commission). New games start in **test mode**, which always serves the fictional **Fizzpop Soda** test ad and is never billed, so the user sees a real round right away.

**Works offline.** Everything here is also in the npm package `bonusround`: `npm view bonusround readme` prints this recipe, and `node_modules/bonusround/AGENTS.md` has it after install. The SDK is bundled in the package too. If your sandbox can't reach bonusround.io, use the npm path (step 2A) and carry on. When the ad server is unreachable and the game has no publisher id yet, the SDK plays a bundled bonusround.io test round, so you can still verify. Source: https://github.com/Future-Circus/bonusround.

Base URL: `https://bonusround.io` (or `$BONUSROUND_URL` if set). REST auth: `Authorization: Bearer br_sk_…` (an API key from https://bonusround.io/app/developers/). If the `bonusround_*` MCP tools are available, use them instead of raw HTTP; they call the same endpoints.

**MCP server:** add `https://bonusround.io/mcp` to your agent and sign in (OAuth). For example, `claude mcp add --transport http bonusround https://bonusround.io/mcp`, then `/mcp` → bonusround → Authenticate. In Claude or ChatGPT, add it as a custom connector. You don't have to sign in up front: `bonusround_integration_guide`, `bonusround_docs` and `bonusround_register_game` (integrate with no account) work right away, and the first account tool asks the user to sign in. With an account, `bonusround_claim_game { claimToken }` moves a game registered without one into the user's workspace. Alternatively, send an API key as a header (`Authorization: Bearer br_sk_…`), or run the stdio server, `npx -y @bonusround/mcp`, with `BONUSROUND_API_KEY`.

## Rules

- Show the user your plan and your diff. Keep changes minimal and match the project's code style.
- Never put a `br_sk_` API key in game code, HTML or git. The game only needs the public `pub_` id.
- Never turn test mode off, change floors, block categories or pause a game unless the user asks.
- Every call into the SDK from game code must be safe when the SDK didn't load (ad blockers): use the `bonusround` queue for `attach`, and `window.BonusRound?.` for everything else.
- Don't put a `break()` in the middle of active play. Only at natural breaks.

## Step 1. Detect the three.js setup

Find out how the game loads three.js and where its HTML entry is. Check, in order:

1. `package.json` dependencies: `three` (vanilla or bundled), `@react-three/fiber` (R3F), and the bundler (`vite`, `webpack`/`react-scripts`, `parcel`, `next`).
2. HTML files with an import map mapping `"three"`, a CDN `<script src="…three…">`, or `import … from 'https://…three…'`.
3. Source files that `import * as THREE from 'three'` or `import { … } from 'three'`.

Record:
- **framework**: vanilla (import map / CDN / global `THREE`), bundler (Vite/webpack/…), or R3F.
- **HTML entry**: the page that actually runs the game. Vite: `index.html` in the project root. webpack/CRA: the `html-webpack-plugin` template, usually `public/index.html`. Plain sites: the HTML with the `<script type="module">` that loads the game. If the game runs inside an iframe, it's the page inside the iframe.
- **THREE namespace**: the identifier the game uses (`THREE` from `import * as THREE from 'three'`). If the game only uses named imports, you will add `import * as THREE from 'three';` next to its other imports.

If there's no three.js at all, stop and tell the user: Bonus Round needs a three.js `WebGLRenderer`.

Shortcut: `npx bonusround init --dry-run` does steps 1 to 3 and prints a diff. It works offline and without an account: with no id it writes the `pub_XXXXXXXX` placeholder. For bundler and R3F projects it also runs `npm i bonusround`. Read the diff, then apply it with `npx bonusround init --yes` after the user agrees. You still do steps 4 to 6 yourself.

## Step 2. Get the publisher id and add the SDK

The SDK needs the game's public publisher id (`pub_` followed by 16 hex characters). If the user has none yet, use the placeholder `pub_XXXXXXXX` and carry on. Only the test round plays until they replace it.

1. If the user gave you a `pub_` id, use it.
2. Else, with an account (the MCP server signed in, or `$BONUSROUND_API_KEY`):
   - `bonusround_list_games` / `GET /api/games` → find the game whose `url` matches where this game is hosted. Use its `pubId`.
   - None? Ask the user for the public URL where the game runs (or will run), then `bonusround_create_game { url, name }` / `POST /api/games { url, name }` → `{ game }`.
   - Get the exact tag: `bonusround_get_snippet { gameId }` / `GET /api/games/:id` → `game.snippet.scriptTag`.
3. Else, with no account, register the game: `POST /api/agent/games { url, name, agent: "claude-code" }` (no auth; `npx bonusround init --yes` does it for you). It returns `pubId`, `snippet`, `provisionalKey` (`br_pk_…`, never in game code) and `claimUrl`. On a public live host the game then shows **free bonusround.io house ads (unpaid)**. **Creating an account by claiming the game at `claimUrl` is the final step that turns on paid ads and payouts.** Dev and temporary hosts (localhost, tunnels, preview deploys, cloud IDEs) only ever show the Fizzpop test ad. They never go live and are never listed.
4. Else (bonusround.io unreachable) keep `pub_XXXXXXXX`, finish the integration, and tell the user: "Replace pub_XXXXXXXX with your publisher id from https://bonusround.io/app/games/ (sign up at https://bonusround.io/signup)."

**2A. Bundler (Vite, webpack, Next, Parcel), R3F, or an import map: the npm package (preferred; works offline).** Run `npm i bonusround`, and in the module that creates the renderer:

```js
import { BonusRound } from 'bonusround';
BonusRound.init({ pub: 'pub_XXXXXXXX' });
```

For an import map, add `"bonusround": "https://cdn.jsdelivr.net/npm/bonusround@1/index.js"` next to `"three"`. If `three` is mapped into `node_modules`, use `"./node_modules/bonusround/index.js"` instead. Then use the same import. You attach with `BonusRound.attach(…)` directly in step 3; no queue is needed.

**2B. Classic scripts (global `THREE`, no modules): the script tag.** Add it to the `<head>` of the HTML entry, exactly as returned:

```html
<script async src="https://bonusround.io/v1/br.js" data-pub="pub_XXXXXXXX"></script>
```

If the project has no HTML template (the build generates it), inject the same tag from the game's entry module:

```js
const s = document.createElement('script');
s.src = 'https://bonusround.io/v1/br.js'; s.async = true; s.dataset.pub = 'pub_XXXXXXXX';
document.head.append(s);
```

## Integrate with no account (agent mode)

You don't need an account or an API key. Register the game, add the SDK, and hand the claim link to your human. This needs bonusround.io to be reachable. If it isn't, keep `pub_XXXXXXXX`; the human runs `npx bonusround init --yes` later.

1. **Register.** `npx bonusround init --yes` does this for you. Or call it directly:
   `POST https://bonusround.io/api/agent/games` with `{ "url": "https://mygame.com/play", "name": "My Game", "agent": "claude-code" }`.
   - `url` is where the game runs or will run. A localhost URL works for test mode only.
   - The response has `pubId`, `scriptTag`, `snippet`, `claimUrl`, `provisionalKey` (`br_pk_…`, scoped to this game's status and verify), `statusUrl`, `verifyUrl` and `tellTheHuman`.
   - Keep `provisionalKey` and `claimUrl` in a gitignored file such as `.bonusround/agent.json`. Never put them in game code.
   - Over MCP, use `bonusround_register_game { url, name?, agent? }` on https://bonusround.io/mcp. It needs no key.
2. **Install** with the `pubId`, per step 2: `BonusRound.init({ pub })` or the `scriptTag`, then `attach()` and `break()`.
3. **Verify.** Load the game once. Then call `POST verifyUrl { "waitSeconds": 30 }` with `Authorization: Bearer <provisionalKey>`. If the response has `detected: true`, the SDK was seen.
4. **Finish with one line to the human.** Print `tellTheHuman` word for word, for example: `Bonus Round is live in your game (free house ads). Create your account to turn on paid ads and get paid: https://bonusround.io/claim/ac_…`

What happens before and after the claim:

- **Test mode.** On any origin, the Fizzpop test ad plays at breaks. Nothing is billed.
- **Free house ads (unclaimed).** The game must be on its real public HTTPS site and have loaded once. Then it serves bonusround.io house ads only. These ads are unpaid: an unclaimed game earns nothing, and nothing is held for it.
- **Paid ads (claimed).** **The human creates an account, or signs in, at `claimUrl`. That final step turns on paid ads and payouts.** Developers keep 70% (Stripe Connect; net-30, $50 minimum).
- **Dev and temporary hosts never go live.** That covers localhost, private and raw IPs, tunnels, cloud IDEs and deploy previews. They only ever show the test ad and are never listed. A game must be hosted at a public URL to go live.
- **Lost the claim link?** `GET statusUrl` with the provisional key returns it again. Unclaimed games are removed after 90 days.

## Step 3. Find the renderer, scene and camera, and attach

Search the source (skip `node_modules`, `dist`, `build`) for:

- the renderer: `new THREE.WebGLRenderer(` or `new WebGLRenderer(` (note the variable it's assigned to: `renderer`, `this.renderer`, …)
- the scene: `new THREE.Scene(` / `new Scene(`
- the camera: `new THREE.PerspectiveCamera(` / `OrthographicCamera(`, the one players see the game through

Insert the attach line once, right after all three exist, in the same scope (usually after the last of the three is created). With the npm package (2A):

```js
BonusRound.attach({ THREE, scene, camera, renderer });
```

With the script tag (2B), use the queue:

```js
// Bonus Round: ambient branded props + Bonus Round takeovers. Docs: https://bonusround.io/docs/attach
(window.bonusround = window.bonusround || []).push((BR) => BR.attach({ THREE, scene, camera, renderer }));
```

Use the game's real identifiers, e.g. `{ THREE, scene: this.scene, camera: this.camera, renderer: this.renderer }`. The queue form runs the call whenever the async `br.js` loads, before or after this line. `BonusRound.attach(...)` is the same call when you know the SDK has loaded.

**React Three Fiber**: there's no `new WebGLRenderer`. Create a component and render it inside `<Canvas>`:

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

**Native takeover (optional, better)**: if the game has a clear player object and a frame loop, pass a host adapter so the round runs in the game's own world with its own controls and physics. Only do this if you can implement all three required methods correctly:

```js
const frameCallbacks = [];
(window.bonusround = window.bonusround || []).push((BR) => BR.attach({
  THREE, scene, camera, renderer,
  worldRoot: level,                                    // the Group holding the level; hidden during the round
  host: {
    getPlayerPosition: () => player.position.clone(),  // THREE.Vector3, feet, meters
    teleport: (v) => { player.position.copy(v); },     // also zero the player's velocity if it has one
    setBounds: (b) => { arenaBounds = b; },            // b = { center: Vector3, radius, obstacles? } or null; clamp movement to it
    onFrame: (cb) => frameCallbacks.push(cb),          // then call each cb(dt) once per frame in the game loop
  },
}));
```

Then in the game loop add `for (const cb of frameCallbacks) cb(dt);` before rendering, and make the player's movement respect `arenaBounds` when it isn't null (stay within `radius` of `center` on the x/z plane). If any of that is unclear in this codebase, use the plain overlay-mode attach instead and mention native mode to the user as a follow-up.

## Step 4. Add `break()` at natural breaks

Find the moments a player already expects a pause. Search function names, state machines and UI code for:

- round or match end: `roundEnd`, `endRound`, `onRoundOver`, `matchOver`, a `phase`/`state` changing to `results`/`intermission`
- level complete: `levelComplete`, `nextLevel`, `stageClear`, `onWin`
- death and respawn: `gameOver`, `onDeath`, `die`, `respawn`, a "Game Over" / "Try again" screen
- returning to a lobby, menu or pause screen between sessions

At each one (start with the single most common break; two or three call sites is plenty), pause gameplay, await the break, then continue:

```js
async function onRoundEnd() {
  // pause gameplay rules here if the game doesn't already (timers, enemies, scoring)
  await window.BonusRound?.break('intermission');
  // ...existing code that starts the next round...
}
```

- With the npm import, `await BonusRound.break('intermission')` is the same call (`window.BonusRound` is the same object).
- The function must be `async` (or use `.then`). Make it async only if its callers don't depend on a synchronous return value; otherwise use `window.BonusRound?.break('intermission').then(() => { … })`.
- `break()` resolves exactly once: after the round has fully ended (`{ filled: true, completed, id }`, its `end` event already fired), or `{ filled: false, reason }` when no round plays for that call. Nothing starts later because of an unfilled call, so the game flow is unchanged when unfilled. A second `break()` while the first is still getting its ad shares that round; one while a round is on screen resolves `{ filled: false, reason: 'busy' }` at once and queues nothing.
- Overlay mode covers the canvas, so pausing everything is fine. In native mode keep the render loop and player movement running and pause only the rules.
- If the break is inside a per-frame update, make sure it runs once (guard with a flag), not every frame.
- Don't call `break()` on page load, during active play or on every UI click.

Optional, only where they fit the game:

- **Rewarded**: if the game has a currency, extra lives or revives, offer a round for a reward. `onReward` runs only if the player finishes the round.
  ```js
  // SDK shows an entry button. It needs attach() to have finished, so do it in the queue callback (this replaces the plain attach line):
  (window.bonusround = window.bonusround || []).push(async (BR) => {
    await BR.attach({ THREE, scene, camera, renderer });
    BR.rewarded({ label: 'Play for 50 coins', onReward: () => giveCoins(50) });
  });
  // Or from the game's own UI (a click, so attach has long finished):
  reviveButton.onclick = () => window.BonusRound?.rewarded({ button: false, onReward: () => revive() });
  ```
  A bare `window.BonusRound?.rewarded({ label, … })` at startup runs before `attach()` resolves and silently shows no button (it resolves to `{ filled: false, reason: 'not_attached' }`).
- **Ambient placement hint**: if the level has an obvious open, visible spot (a plaza, a spawn area edge), suggest it in meters, world space, feet on the ground:
  ```js
  window.BonusRound?.placeAmbient({ position: [12, 0, -6], rotationY: Math.PI / 2 });
  ```
- **Interval safety**: around boss fights or cutscenes, `window.BonusRound?.safe(false)`; afterwards `window.BonusRound?.safe(null)`.
- **Pause on any round**: interval and portal rounds start without your code. If the game must pause for them, listen: `window.BonusRound?.on('start', pause).on('end', resume)` inside the queue callback (`(BR) => { BR.attach(…); BR.on('start', pause); BR.on('end', resume); }`). `start` fires before anything of a round is on screen (the countdown card included) and `end` after it's gone, exactly once each with the same `e.id`, for every format and however the round ends (completed, skipped, error, timeout, hidden tab). Treat the `break()` resolution as the final resume, except on `reason: 'busy'` (the round on screen resumes you with its `end`): `const r = await BR.break('intermission'); if (r.reason !== 'busy') resume();`. Make `pause()`/`resume()` safe to call twice. Skip the pause when `e.live` is true (a `zone()` round: the game keeps running).
- **Pointer lock (FPS games)**: nothing to add. The SDK frees the mouse for its end card and offer card, and Continue re-locks the game from that click (otherwise a "Click to resume" chip does it). If the game had the lock, `end` carries `pointerLock: 'restored'` or `'was-locked'` (free now: let the game re-lock on its next canvas click). Don't re-lock from a timer: browsers only allow it from a click.

## Step 5. Verify

1. Run the game the way the project does (`npm run dev`, `npx vite`, a static server…) and open it in a browser (use a headless browser if you have one). `localhost` is always allowed. Then call `await BonusRound.break('test')` in the page. You should see the "Ad · Bonus Round" countdown, then a test round labelled "Ad". If bonusround.io is unreachable from your sandbox, the npm package plays its bundled bonusround.io test round and logs `[bonusround] … Playing the bundled bonusround.io test round locally`. That counts as verified. Skip steps 4 and 5, which need bonusround.io.
2. In the page, check the SDK: `window.BonusRound?.version` is a string, and `await BonusRound.debug()` shows `attached: true` and a `mode` (`overlay`, `native-local` or `native-net`). Check the console for `[bonusround]` warnings and for errors your change introduced.
3. Confirm the game itself still runs: it renders, the controls work, no new console errors.
4. Confirm Bonus Round saw it: poll `bonusround_integration_status { gameId, waitSeconds: 60 }` or `GET /api/games/:id` every few seconds until `integration.lastSeenAt` is set (the loader pings after the page's `load` event). `integration.origins` lists where it was seen from.
5. Confirm learning: `status` moves `pending → detected → learning → ready`. If it stays `detected` for more than a minute, call `bonusround_start_learning` / `POST /api/games/:id/learn`. If the game needs a login to play, tell the user to add a test login in the dashboard (Game → Settings); never ask for their password yourself.
6. Optional: trigger a break in the running game (play to the break, or call `await BonusRound.break('intermission')` in the console). In test mode it plays the Fizzpop round and resolves to `{ filled: true, completed: … }`.

If `lastSeenAt` stays null: the tag isn't in the page that actually loads, `data-pub` is wrong, the page is on a domain the game doesn't list (only for non-localhost; add it under the game's domains), or a content security policy blocks `https://bonusround.io` (add it to `script-src` and `connect-src`).

## How to test locally

You can check the whole integration on localhost before the game is hosted.

- **What plays.** On localhost, LAN IPs, `file:`, tunnels, cloud IDE previews and deploy previews, every break plays the free bonusround.io test ad. It's a pocket-arena round labelled "Ad", with the Bo mark, an end card and a CTA to bonusround.io. It's never billed and never goes live. Game learning (tailored in-world ads) starts only once the SDK is seen on your public URL.
- **Console.** On load, the SDK prints one status line, e.g. `[Bonus Round] localhost · showing the free bonusround.io test ad (no game learning yet). Host your game at a public URL and we'll learn it and tailor ads to it.`
- **Badge.** On dev hosts, a small dismissible "Bonus Round · dev" badge (bottom-left) shows the status, the next step, the claim link for unclaimed games, and a "Play test round" button. It never shows on a public host.
- **Play a round on demand.** `await BonusRound.break('test')` plays the full round and end card. It resolves `{ filled, completed, score, brand }` when the game resumes.
- **Read the status.** `BonusRound.status()` returns `{ host, hostClass, mode: 'test'|'free-house'|'paid', claimed, learning, paidAds, reason, ad, claimUrl?, next, pub, settled }`. `settled: true` means our server has answered, or couldn't be reached. Changes fire `BonusRound.on('status', fn)` and the window event `bonusround.status`.
- **Without a browser.** `npx bonusround status`, the MCP status tool, `GET /api/agent/games/:pubId` and `GET /api/games/:id` all return the same object, as `sdkStatus`.
- **Server unreachable** (a sandbox, offline). The npm package plays its bundled copy of the same test round on `break('test')`, and `status()` reports `reason: 'offline'`.
- **Agent checklist** (headless Playwright; on macOS, `--use-angle=metal --enable-gpu`):
  1. Load the page and wait for `BonusRound.status().settled`.
  2. Read `status()`.
  3. Run `await BonusRound.break('test')`.
  4. Screenshot during the round and at the end card.
  5. Check that the game renders frames again.

## Step 6. Report back

Tell the user, briefly:

- **Changed**: each file and what you added (script tag, attach line, which break call sites, any rewarded/placement hooks). Mention overlay vs native mode.
- **Verified**: SDK loaded (`version`, `mode`), `integration.lastSeenAt` time, current `status` (learning/ready), test mode on.
- **What they'll see**: the Fizzpop Soda test Bonus Round at the next break, while test mode is on.
- **Next steps for them**: watch the game being learned in the dashboard (https://bonusround.io/app/games/), add the ads.txt line `bonusround.io, pub_XXXXXXXX, DIRECT` to `https://<their domain>/ads.txt`, and turn test mode off when they're ready to earn (only they should do that, or you on their explicit instruction).
- Anything you weren't sure about (another renderer, an unclear break, native mode you skipped).
- **Last line: the claim step.** If you registered without an account, say that on a public host the game shows free bonusround.io house ads (unpaid), and that claiming it (creating an account) turns on paid ads and payouts. Then end with: `Bonus Round is live in your game (free house ads). Create your account to turn on paid ads and get paid: <claimUrl>`. If you kept the `pub_XXXXXXXX` placeholder, end with how to get an id: `npx bonusround init --yes` where bonusround.io is reachable, or https://bonusround.io/signup.

## Reference

- SDK: `BonusRound.attach({ THREE, scene, camera, renderer, worldRoot?, host? }) → Promise<{ mode }>`, `await BonusRound.break('intermission' | 'test') → { filled, completed, reason?, score? }`, `BonusRound.rewarded({ onReward, label?, button? })`, `BonusRound.safe(true|false|null)`, `BonusRound.placeAmbient({ position, rotationY } | null)`, `BonusRound.on(type, cb)` (`attach`, `start`, `end`, `reward`, `ambient`, `event`), `BonusRound.config({ muted })`, `await BonusRound.debug()`.
- REST: `GET /api/v1/whoami`, `GET|POST /api/games`, `GET|PATCH /api/games/:id`, `POST /api/games/:id/learn`, `GET /api/games/:id/stats?days=30`. Errors are `{ error }` with a 4xx/5xx status. Money is integer micros (1 USD = 1,000,000).
- Docs: https://bonusround.io/docs/ · full text: https://bonusround.io/llms-full.txt · offline: `npm view bonusround readme` · source: https://github.com/Future-Circus/bonusround
