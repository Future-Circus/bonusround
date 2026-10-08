# Bonus Round plugin for Claude Code

Bonus Round (bonusround.io) is an ad network for three.js games. At natural breaks, a 15-second branded mini-round plays inside the game with the player's own character and controls. Every round is labelled "Ad". Developers earn 70% of net ad revenue, and new games start in test mode with a fictional test ad that is never billed.

This plugin is a developer tool for integrating the Bonus Round SDK into three.js games; it never shows ads, sponsored content or promotions inside Claude.

It gives Claude Code:

- **The `integrate-bonus-round` skill.** Ask "monetize my three.js game" or "integrate Bonus Round". It finds your renderer, scene and camera, adds the script tag and attach line, and puts `BonusRound.break('intermission')` at natural breaks. It keeps the diff minimal. Then it checks that the game is live and reports back.
- **The hosted MCP server** (`https://bonusround.io/mcp`).
  - The docs tools (`bonusround_integration_guide`, `bonusround_docs`) work without an account.
  - After you sign in, the agent can register your game, get its snippet, check it's live, read stats and change settings. Test mode stays on until you turn it off.

## Install

```
claude plugin marketplace add Future-Circus/bonusround
claude plugin install bonusround@bonusround
```

The docs tools work right away. The first account tool asks you to sign in to bonusround.io (OAuth): run `/mcp` if Claude Code asks. Prefer an API key? Use `claude mcp add --transport http bonusround https://bonusround.io/mcp --header "Authorization: Bearer br_sk_…"` instead.

Docs: https://bonusround.io/docs/agents · Privacy: https://bonusround.io/privacy · License: MIT
