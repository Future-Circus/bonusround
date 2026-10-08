---
name: integrate-bonus-round
description: Integrate Bonus Round (bonusround.io, npm package "bonusround"), playable ads for three.js games, into a three.js game (vanilla, Vite/webpack/Next, import map, or React Three Fiber). Install it with npm i bonusround, add BonusRound.attach(), put await BonusRound.break('intermission') at natural breaks, then verify that the test round plays. Works offline: bonusround.io doesn't need to be reachable. Use this when the user says "integrate bonusround.io", "use bonusround.io", "add Bonus Round", "bonusround", "monetize my three.js game" or "add ads to my three.js game".
---

# Integrate Bonus Round

Bonus Round (bonusround.io) is an ad network for three.js games. At natural breaks, a 15-second branded Bonus Round takes over the game with the player's own controls. Developers earn 70% of net ad revenue. New games are in test mode and get the fictional Fizzpop Soda test round, which is never billed.

## Where the recipe is (in order)

1. **npm**, which works when bonusround.io is blocked. `npm view bonusround readme` prints the full recipe. After `npm i bonusround`, the same text is in `node_modules/bonusround/AGENTS.md`. Follow it.
2. The `bonusround_integration_guide` MCP tool, if the `bonusround_*` tools are connected. To connect them, add `https://bonusround.io/mcp` and sign in. With no sign-in, `bonusround_register_game` still registers the game without an account. Once signed in, `bonusround_claim_game` claims it.
3. `https://bonusround.io/integrate.md`, or https://github.com/Future-Circus/bonusround.

If none of those can be reached, the summary below is enough.

## Summary

1. **Detect** the setup:
   - a bundler (`vite`, `webpack`, `next`, `parcel` in `package.json`) → npm import;
   - `@react-three/fiber` → R3F component;
   - `<script type="importmap">` → import map entry;
   - a global `THREE` with classic scripts → script tag.
2. **Install and attach.** Shortcut: `npx bonusround init --yes` does this step for you. It works offline and writes the `pub_XXXXXXXX` placeholder when there's no id.
   - **npm (bundler):** `npm i bonusround`, then in the file that creates the renderer:
     ```js
     import { BonusRound } from 'bonusround';
     BonusRound.init({ pub: 'pub_XXXXXXXX' });            // the user's publisher id, or keep this placeholder
     // after the renderer, scene and camera exist:
     BonusRound.attach({ THREE, scene, camera, renderer });
     ```
   - **R3F:** a component inside `<Canvas>` that calls `BonusRound.attach({ THREE, scene, camera, renderer: gl })` with `useThree()` in a `useEffect`.
   - **Import map:** `"bonusround": "https://cdn.jsdelivr.net/npm/bonusround@1/index.js"`, or `./node_modules/bonusround/index.js` when `three` is mapped into `node_modules`. Then use the same import.
   - **Script tag:** `<script async src="https://bonusround.io/v1/br.js" data-pub="pub_XXXXXXXX"></script>` (or `https://cdn.jsdelivr.net/npm/bonusround@1/br.js`), plus `(window.bonusround = window.bonusround || []).push((BR) => BR.attach({ THREE, scene, camera, renderer }));`.
3. **Breaks:** at game over, round end, level complete or a return to the menu: `await BonusRound.break('intermission');`. With the script tag, use `await window.BonusRound?.break('intermission')`. It resolves when the round ends, or right away when nothing plays. Pause the game first. Never call it mid-play or every frame.
4. **Publisher id:**
   - Use the `pub_…` the user gave you.
   - Without one, register the game with no account: `npx bonusround init --yes`, or `POST https://bonusround.io/api/agent/games { url, name, agent }`. You get `pubId`, `claimUrl` and `provisionalKey`. Keep the key and link in a gitignored `.bonusround/agent.json`.
   - If bonusround.io is unreachable, keep `pub_XXXXXXXX`.
   - Unclaimed games on a public host show free house ads (unpaid). Creating an account at `claimUrl` turns on paid ads and payouts. Dev and temporary hosts only show the test ad.
   - Never put a `br_sk_` or `br_pk_` key in game code.
5. **Verify:** run the game. Check that `(await BonusRound.debug()).attached` is `true`, and that `await BonusRound.break('test')` shows the "Ad · Bonus Round" countdown and then the Fizzpop Soda round. If bonusround.io is unreachable, the npm package plays its bundled copy of that round and logs `[bonusround] … Playing the bundled Fizzpop Soda TEST round locally`.
6. **Report:**
   - the files changed and the break call sites;
   - what you verified;
   - their next steps: the ads.txt line `bonusround.io, pub_…, DIRECT` and a public URL;
   - **last line:** the registration's `tellTheHuman`, word for word (`… Create your account to turn on paid ads and get paid: <claimUrl>`). With the placeholder, say how to get an id instead.
