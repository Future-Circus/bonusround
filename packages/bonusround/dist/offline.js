// Bonus Round offline test round 1.0.3: bonusround.io test round (never a paid ad, never billed).
// Loaded by the SDK only when a test break can't reach the ad server, or the game has no publisher id yet (sdk/br-core.js).
// Its files are next to this one, in ./offline/.
const HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <meta name=\"color-scheme\" content=\"normal\" />\n  <title>Bonus Round</title>\n  <style>\n    /* transparent until the round starts: the host game shows through */\n    html, body { margin: 0; height: 100%; overflow: hidden; background: transparent; font-family: system-ui, -apple-system, \"Segoe UI\", sans-serif; }\n    canvas { display: block; outline: none; touch-action: none; }\n    #help { position: fixed; left: 50%; bottom: 16px; transform: translate(-50%, 16px); opacity: 0; transition: opacity .3s, transform .3s;\n      padding: 8px 16px; border-radius: 999px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); color: #23264a;\n      font-size: 13px; font-weight: 600; white-space: nowrap; box-shadow: 0 6px 20px rgba(35, 38, 74, 0.18); pointer-events: none; z-index: 60; }\n    #help b { background: rgba(35, 38, 74, 0.1); border-radius: 6px; padding: 1px 6px; font-weight: 800; }\n    #tag { position: fixed; left: 16px; top: 16px; max-width: calc(50vw - 250px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 6px 12px; border-radius: 999px; background: rgba(20, 16, 40, 0.6); color: #fff;\n      font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 60; }\n    body.round #help { opacity: 1; transform: translate(-50%, 0); }\n    /* phones: wrap the hint; touch devices show a short hint above the stick/buttons row */\n    @media (max-width: 600px) { #help { white-space: normal; text-align: center; width: max-content; max-width: calc(100vw - 32px); font-size: 12px; padding: 7px 12px; border-radius: 14px; } #tag { display: none; } }\n    body.touch #help { bottom: calc(14px + env(safe-area-inset-bottom)); max-width: calc(100vw - 260px); font-size: 11px; white-space: normal; text-align: center; padding: 6px 10px; border-radius: 12px; }\n    @media (max-width: 420px) { body.touch #help { display: none; } }\n    body.round #tag { opacity: 1; }\n  </style>\n</head>\n<body>\n  <div id=\"help\"></div>\n  <div id=\"tag\">Bonus Round preview</div>\n  %%BOOT%%\n</body>\n</html>\n";
const MANIFEST = {"version":1,"id":"house-bonusround-fallback","brand":{"name":"Bonus Round","tagline":"Get paid for your plays.","palette":{"primary":"#ffb000","secondary":"#7c5cff","accent":"#ffd66b","background":"#f7f5ef","text":"#1b1d33"},"logo":"logo.png"},"concept":{"title":"Coin Rush","pitch":"The bonusround.io test round: grab the Bonus Round coins while Bo cheers you on. Plays on any three.js game with no game learning (pocket arena)."},"round":{"durationSec":15,"mechanic":"collect","itemCount":14,"introText":"Grab the Bonus Round coins!","hudLabel":"Coins","outroText":"This round's on Bonus Round. Get paid for your plays.","cta":"Add Bonus Round to your game","arena":{"radius":15,"groundColor":"#fff4d6","groundAccent":"#ffd66b","skyTop":"#7c5cff","skyBottom":"#ffe9b0","fogColor":"#fff1cc","fogDensity":0.015,"lightIntensity":1.1,"decor":"rings"},"hero":{"model":"hero.glb","heightM":4,"position":[0,0,-8],"animations":{"idle":"Idle","intro":"Big_Wave_Hello","celebrate":"Victory_Cheer"},"spin":false,"fallbackColor":"#ffb000"},"collectible":{"model":"collectible.glb","heightM":1,"spin":true,"bob":true,"fallbackColor":"#ffd66b"},"banners":[{"image":"banner.png","widthM":9,"position":[0,4.5,-14],"lookAtCenter":true}],"ctaUrl":"https://bonusround.io/signup?role=games&ref=dev-test-ad"},"inWorld":{"enabled":false},"audio":{"music":"music.mp3","volume":0.5,"sfx":{"collect":"sfx_collect.mp3","start":"sfx_start.mp3","win":"sfx_win.mp3"},"voiceover":{"duckTo":0.3,"startAfterSec":1.2,"tracks":[{"seconds":15,"file":"vo_15.mp3","durationSec":5.44,"text":"This round's on Bonus Round! Get paid for your plays. Add Bonus Round to your game."}]}},"fallback":{"learning":false,"dev":true,"unbilled":true,"note":"The no-learning bonusround.io test round: dev / temporary hosts, test mode, and the npm package's offline bundle."}};
const FILES = {
  "logo.png": new URL("./offline/logo.png", import.meta.url).href,
  "hero.glb": new URL("./offline/hero.glb", import.meta.url).href,
  "collectible.glb": new URL("./offline/collectible.glb", import.meta.url).href,
  "banner.png": new URL("./offline/banner.png", import.meta.url).href,
  "music.mp3": new URL("./offline/music.mp3", import.meta.url).href,
  "sfx_collect.mp3": new URL("./offline/sfx_collect.mp3", import.meta.url).href,
  "sfx_start.mp3": new URL("./offline/sfx_start.mp3", import.meta.url).href,
  "sfx_win.mp3": new URL("./offline/sfx_win.mp3", import.meta.url).href,
  "vo_15.mp3": new URL("./offline/vo_15.mp3", import.meta.url).href,
};
const OVERLAY_JS = new URL('./offline/overlay.js', import.meta.url).href;
// Vite's dev server pre-bundles dependencies into /node_modules/.vite/deps/, where ./offline/ doesn't exist: the package's own
// copy is still served at /node_modules/bonusround/dist/.
const fix = (u) => (/\/node_modules\/\.vite\/deps(_[^/]*)?\/offline\//.test(u) ? u.replace(/\/node_modules\/\.vite\/deps(_[^/]*)?\/offline\//, '/node_modules/bonusround/dist/offline/').replace(/\?.*$/, '') : u);
let cache = null;
const blob = (parts, type) => URL.createObjectURL(new Blob(parts, { type }));
export const brand = { name: "Bonus Round" };
export const label = "bonusround.io test round";
const CTA = {"label":"Add Bonus Round to your game","url":"https://bonusround.io/three-js-monetization?from=house&test=1","utm":"utm_source=bonusround&utm_medium=playable_ad&utm_campaign=bonusround-offline"};
// game= is the page's name: document.title (60 chars max), else the host name; none on file: or blank pages
function gameName() {
  try {
    if (!/^https?:$/.test(location.protocol)) return '';
    return (String(document.title || '').replace(/\s+/g, ' ').trim().slice(0, 60).trim() || location.hostname || '');
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
