# Bonus Round

Bonus Round (bonusround.io) is an ad network for three.js games. At natural breaks a 15-second branded, Ad-labelled mini-round plays inside the game with the player's own character and controls; developers earn 70% of net ad revenue. New games are in test mode (a fictional test ad, never billed).

When the user wants to monetize or add ads to a three.js game, or says "integrate Bonus Round":

1. Call `bonusround_integration_guide` and follow it exactly (no API key needed). `bonusround_docs` answers other questions (formats, R3F, payouts, ads.txt).
2. The integration is: one `<script async src="https://bonusround.io/v1/br.js" data-pub="pub_…">` in the HTML entry, one queued `BR.attach({ THREE, scene, camera, renderer })` after the renderer exists, and `await window.BonusRound?.break('intermission')` at natural breaks. Keep the diff minimal.
3. The `pub_…` id comes from the user, or from `bonusround_create_game` once the user has signed in (Gemini CLI opens the bonusround.io sign-in the first time an account tool is called). Never put a `br_sk_` key in game code.
4. Verify by loading the game and calling `bonusround_integration_status { gameId, waitSeconds: 60 }`. Don't turn test mode off or change floors unless the user asks.
