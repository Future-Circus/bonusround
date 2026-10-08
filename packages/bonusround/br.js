/*! Bonus Round SDK 1.0.0 (npm: bonusround) · <script async src="https://cdn.jsdelivr.net/npm/bonusround@1/br.js" data-pub="pub_…"></script> */
(function () {
  var s = document.currentScript, dir = s && s.src ? s.src.replace(/[?#].*$/, '').replace(/\/[^\/]*$/, '') : '';
  var cfg = (window.bonusroundConfig = window.bonusroundConfig || {});
  if (!cfg.base) cfg.base = (s && s.getAttribute('data-server')) || 'https://bonusround.io';
  if (dir && !cfg.loadCore) cfg.loadCore = function () { return import(dir + '/dist/core.js'); };
  if (dir && !cfg.loadOffline) cfg.loadOffline = function () { return import(dir + '/dist/offline.js'); };
})();
/*! Bonus Round SDK loader v1.0.0 · <script async src="https://<host>/v1/br.js" data-pub="pub_…"></script>
 * Classic script. window.BonusRound exists as soon as this runs; code that may run earlier uses the queue:
 *   (window.bonusround = window.bonusround || []).push(function (BR) { BR.attach({ THREE, scene, camera, renderer }); });
 * Heavy code (formats, overlay, three.js loaders) is imported lazily from the same origin as this file.
 */
(function () {
  'use strict';
  if (window.BonusRound && window.BonusRound.__loader) return;
  var VERSION = '1.0.0';

  // ---------- who am I ----------
  var script = document.currentScript;
  if (!script) {
    var all = document.querySelectorAll('script[src*="br.js"]');
    script = all[all.length - 1] || null;
  }
  var cfg0 = window.bonusroundConfig || {};
  var pub = (script && script.getAttribute('data-pub')) || cfg0.pub || null;
  var base = (cfg0.base || (script && script.src ? new URL(script.src, location.href).origin : location.origin)).replace(/\/+$/, '');
  // API origin for /v1/ping, /v1/ad and /v1/event: data-api="https://…" (or bonusroundConfig.api); default: same as base.
  // Lets the SDK files come from a CDN while ad requests go to the ad edge.
  var api = ((script && script.getAttribute('data-api')) || cfg0.api || base).replace(/\/+$/, '');

  // ---------- portal mode: Poki, CrazyGames, GameDistribution and Y8 ban third-party ads → the SDK switches itself off ----------
  // Host list generated from sdk/portals.js (node platform/compliance/sync-portals.mjs). No ad requests, no SDK core, no
  // assets; one flagged ping so the developer's dashboard can say why. Every call resolves { filled:false, reason:'portal' }.
  /* portals:begin */
  var PORTAL_HOSTS = {"poki.com":"poki","poki-gdn.com":"poki","poki.nl":"poki","poki.de":"poki","poki.pl":"poki","poki.it":"poki","poki.fr":"poki","poki.es":"poki","poki.pt":"poki","poki.com.br":"poki","poki.ro":"poki","poki.se":"poki","poki.dk":"poki","poki.cz":"poki","crazygames.com":"crazygames","crazygames.co.uk":"crazygames","crazygames.fr":"crazygames","crazygames.com.br":"crazygames","crazygames.ru":"crazygames","gamedistribution.com":"gamedistribution","y8.com":"y8"};
  /* portals:end */
  var portal = (function () {
    var hostOf = function (s) { try { return s ? new URL(s, location.href).hostname.toLowerCase() : ''; } catch (e) { return ''; } };
    var match = function (h) { for (var d in PORTAL_HOSTS) if (h === d || h.slice(-(d.length + 1)) === '.' + d) return PORTAL_HOSTS[d]; return null; };
    var tries = [['hostname', location.hostname.toLowerCase()]];
    try { var anc = location.ancestorOrigins; if (anc) for (var i = 0; i < anc.length; i++) tries.push(['ancestor', hostOf(anc[i])]); } catch (e) {}
    tries.push(['referrer', hostOf(document.referrer)]);
    for (var k = 0; k < tries.length; k++) { var id = tries[k][1] && match(tries[k][1]); if (id) return { id: id, host: tries[k][1], via: tries[k][0] }; }
    return null;
  })();
  if (portal) console.warn('[bonusround] portal mode: this game is running on ' + portal.host + ', which does not allow third-party ads. Bonus Round is off (no ad requests).');

  // ---------- three.js devtools hook: observe scenes/renderers created from now on ----------
  var seen = { scenes: [], renderers: [], revision: window.__THREE__ || null };
  var keep = function (list, o) { if (list.indexOf(o) < 0) { list.push(o); if (list.length > 8) list.shift(); } };
  try {
    var dt = window.__THREE_DEVTOOLS__;
    if (!dt || typeof dt.addEventListener !== 'function') dt = window.__THREE_DEVTOOLS__ = new EventTarget();
    // share what we observe with the rest of the SDK (host-three.js) and keep records a proxy hook already made
    var prior = dt.__bonusround;
    if (prior) { seen.scenes = prior.scenes || seen.scenes; seen.renderers = prior.renderers || seen.renderers; seen.revision = seen.revision || prior.revision || null; }
    dt.__bonusround = seen;
    // the first registered revision is the game's (our own lazily loaded three must not overwrite it)
    dt.addEventListener('register', function (e) { if (e.detail && e.detail.revision && !seen.revision) seen.revision = e.detail.revision; });
    dt.addEventListener('observe', function (e) {
      var o = e.detail;
      if (!o) return;
      if (o.isScene) keep(seen.scenes, o);
      else if (o.isWebGLRenderer || o.isWebGPURenderer || (o.domElement && typeof o.render === 'function')) keep(seen.renderers, o);
    });
  } catch (e) { /* a frozen or foreign hook: attach() still works */ }

  // ---------- tiny emitter + state shared with the core ----------
  var listeners = {};
  // storage: null = auto (on unless Global Privacy Control / child-directed); false = memory only (data-storage="none")
  var storageAttr = script && script.getAttribute('data-storage');
  var state = { safe: null, test: !!cfg0.test, muted: !!cfg0.muted, ambientHint: null, ping: null, countdownSec: cfg0.countdownSec,
    storage: storageAttr === 'none' || cfg0.storage === false ? false : null, consent: typeof cfg0.consent === 'boolean' ? cfg0.consent : null,
    // learning-agent pages (set by an init script before any game code): never request or show ads, still ping
    agent: window.__BONUSROUND_AGENT__ === true,
    // npm package only: the bundled Fizzpop Soda test round, played when a test break can't reach the ad server (br-core)
    loadOffline: typeof cfg0.loadOffline === 'function' ? cfg0.loadOffline : null };
  var emitter = {
    on: function (type, cb) { (listeners[type] = listeners[type] || []).push(cb); },
    off: function (type, cb) { var l = listeners[type] || []; var i = l.indexOf(cb); if (i >= 0) l.splice(i, 1); },
    emit: function (type, data) {
      var l = (listeners[type] || []).slice();
      for (var i = 0; i < l.length; i++) { try { l[i](data); } catch (e) { console.warn('[bonusround] listener', type, e); } }
    },
  };

  // ---------- page analytics: this page load's session (platform/analytics) ----------
  // sid: a random id for this page load only (memory, never stored). Coarse page facts only: device class from the
  // pointer + screen size (never the user agent), the referrer's domain (never its path), the automation flag.
  var rnd = function (n) { try { return Array.from(crypto.getRandomValues(new Uint8Array(n)), function (b) { return (b % 36).toString(36); }).join(''); } catch (e) { return Math.random().toString(36).slice(2, 2 + n); } };
  var sid = 's' + rnd(14);
  var deviceClass = function () {
    try { var coarse = matchMedia('(pointer: coarse)').matches, m = Math.min(screen.width, screen.height); return !coarse ? 'desktop' : m >= 600 ? 'tablet' : 'mobile'; } catch (e) { return null; }
  };
  var refHost = (function () { try { var h = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; return h && h !== location.hostname.toLowerCase() ? h : ''; } catch (e) { return ''; } })();
  var counts = { breaks: 0 };

  // ---------- ping on load ----------
  var pingDone = false, pingRev = null, pingResolve;
  state.ping = new Promise(function (res) { pingResolve = res; });
  var pingStarted = false;
  function ping() {
    pingStarted = true;
    pingRev = seen.revision || window.__THREE__ || null;
    if (!pub) { pingResolve(null); return; }
    try {
      fetch(api + '/v1/ping', {
        method: 'POST', mode: 'cors', keepalive: true, headers: { 'content-type': 'application/json' },
        // origin + path only: query strings and fragments can carry personal data
        body: JSON.stringify(Object.assign({ pub: pub, origin: location.origin, path: location.pathname, sdkVersion: VERSION, threeRevision: pingRev, sid: sid, dev: deviceClass() },
          refHost ? { ref: refHost } : {}, navigator.webdriver === true ? { wd: true } : {}, state.agent ? { agent: true } : {}, portal ? { portal: portal.id, portalHost: portal.host } : {})),
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { pingDone = true; pingResolve(j); }, function () { pingResolve(null); });
    } catch (e) { pingResolve(null); }
  }
  if (document.readyState === 'complete') setTimeout(ping, 0);
  else window.addEventListener('load', function () { setTimeout(ping, 0); }, { once: true });

  // ---------- unclaimed games (an AI agent integrated with no account): the claim link, on the developer's own pages only ----------
  // Non-public origins only (localhost, LAN, tunnels, previews: /sdk/hostclass.js, the server's own classifier). Never on a
  // public site, never in front of real players. The server returns the link only to the network that registered the game.
  function claimHint() {
    if (!pub || portal || state.agent) return;
    import(base + '/sdk/hostclass.js').then(function (hc) {
      if (hc.isPublicHost(location)) return;
      var k = 'br_claim_' + pub, cached = null;
      try { cached = localStorage.getItem(k); } catch (e) {}
      return fetch(api + '/v1/agent/claim-hint?pub=' + encodeURIComponent(pub), { mode: 'cors' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (h) {
        if (!h || h.known === false) return;
        if (h.claimed) { try { localStorage.removeItem(k); localStorage.removeItem(k + '_x'); } catch (e) {} return; }
        var url = h.claimUrl || cached;
        if (h.claimUrl) { try { localStorage.setItem(k, h.claimUrl); } catch (e) {} }
        if (!url) { console.info('[bonusround] This game is unclaimed: free house ads only, no earnings. Ask the agent that integrated it for the claim link (npx bonusround status).'); return; }
        console.info('%c[bonusround] Free house ads only until you claim this game. Create your account to turn on paid ads and get paid: ' + url, 'font-weight:bold');
        var dismissed = false; try { dismissed = localStorage.getItem(k + '_x') === '1'; } catch (e) {}
        if (dismissed || !document.body) return;
        var chip = document.createElement('div');
        chip.setAttribute('data-bonusround-claim', '');
        chip.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483646;display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px;border-radius:999px;background:rgba(10,11,16,.92);color:#fff;font:600 13px/1.2 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18)';
        var a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        a.style.cssText = 'color:#ffd166;text-decoration:none';
        a.textContent = 'Claim this game: turn on paid ads';
        var small = document.createElement('span'); small.style.cssText = 'opacity:.6;font-weight:500'; small.textContent = 'bonusround.io · dev only';
        var x = document.createElement('button');
        x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×';
        x.style.cssText = 'all:unset;cursor:pointer;width:22px;height:22px;text-align:center;border-radius:50%;background:rgba(255,255,255,.12);font-size:15px;line-height:22px';
        x.onclick = function () { chip.remove(); try { localStorage.setItem(k + '_x', '1'); } catch (e) {} };
        chip.appendChild(a); chip.appendChild(small); chip.appendChild(x);
        document.body.appendChild(chip);
      });
    }).catch(function () {});
  }
  state.ping.then(function (j) { if (j && j.testMode !== undefined) setTimeout(claimHint, 0); });

  // ---------- lazy core ----------
  var coreP = null;
  function core() {
    if (!coreP && portal) coreP = Promise.resolve(portalCore());
    if (!coreP) {
      // the npm package (bonusround) hands over its bundled core; the script tag imports it from the same origin
      coreP = (typeof cfg0.loadCore === 'function' ? cfg0.loadCore() : import(base + '/sdk/br-core.js?v=' + VERSION)).then(function (m) {
        return m.createCore({ base: base, api: api, pub: pub, version: VERSION, seen: seen, state: state, emitter: emitter, repingIfNeeded: function (rev) {
          if (rev && !pingRev && pub) { pingRev = rev; seen.revision = rev; ping(); }
        } });
      });
      coreP.catch(function (e) { console.warn('[bonusround] could not load the SDK core from ' + base, e); });
    }
    return coreP;
  }
  var unfilled = function (reason) { return { filled: false, completed: false, reason: reason }; };
  // portal mode stands in for the core: nothing is imported, requested or drawn
  function portalCore() {
    var off = function () { return Object.assign(unfilled('portal'), { portal: portal.id }); };
    var warning = { at: new Date().toISOString(), text: 'portal mode: running on ' + portal.host + ' (' + portal.id + ', detected via ' + portal.via + '), which bans third-party ads. Bonus Round is off: no ad requests.' };
    return {
      attach: function () { return Promise.resolve({ mode: 'off', portal: portal.id, reason: 'portal' }); },
      breakRound: function () { return Promise.resolve(off()); },
      rewarded: function () { return Promise.resolve(off()); },
      zoneRound: function () { return Promise.resolve(off()); },
      placeAmbient: function () {}, configChanged: function () {}, cancel: function () { return false; },
      debug: function () { return { version: VERSION, pub: pub, base: base, mode: 'off', attached: false, portal: portal, requests: [], events: [], warnings: [warning] }; },
    };
  }

  var BR = {
    __loader: true,
    version: VERSION,
    pub: pub,
    base: base,
    api: api,
    /** attach({ THREE, scene, camera, renderer, worldRoot?, host? }) → Promise<{ mode }> */
    attach: function (opts) { return core().then(function (c) { return c.attach(opts || {}); }); },
    /** await break(trigger) → { filled, completed, reason?, score? }; resolves right away when unfilled or capped */
    'break': function (trigger, opts) { counts.breaks++; return core().then(function (c) { return c.breakRound(trigger || 'intermission', opts || {}); }, function () { return unfilled('sdk_unavailable'); }); },
    /** zone(name, { live:true, countdownEndsAt }) → the player is approaching a named stretch of your level (a racer's
     *  pier): it becomes a sponsored zone while the game keeps running. Never an interstitial: unfilled or unsupported →
     *  nothing plays. Resolves { filled, completed, zone, score?, reason? } when the zone round is over. */
    zone: function (name, opts) { counts.breaks++; return core().then(function (c) { return c.zoneRound ? c.zoneRound(name, opts || {}) : unfilled('unsupported'); }, function () { return unfilled('sdk_unavailable'); }); },
    /** rewarded({ onReward, label, button }) → button:false starts now (from your own UI); otherwise shows the entry button */
    rewarded: function (opts) { return core().then(function (c) { return c.rewarded(opts || {}); }, function () { return unfilled('sdk_unavailable'); }); },
    /** safe(true|false|null): mark whether an interval round may interrupt right now (null = auto: 1.5 s without input) */
    safe: function (v) { state.safe = v === undefined ? true : v; return BR; },
    placeAmbient: function (hint) { state.ambientHint = hint || null; core().then(function (c) { c.placeAmbient(hint || null); }); return BR; },
    on: function (type, cb) { emitter.on(type, cb); return BR; },
    off: function (type, cb) { emitter.off(type, cb); return BR; },
    /** init({ pub, test?, server?, api?, muted? }): the npm package's setup call (the script tag's data-pub / data-api).
     *  server: where the SDK runtime and ad server live (default https://bonusround.io); api: the ad edge if different. */
    init: function (o) {
      o = o || {};
      var sync = function () { if (coreP) coreP.then(function (c) { c.pub = pub; c.base = base; c.api = api; }); };
      if (o.server || o.base) { base = BR.base = String(o.server || o.base).replace(/\/+$/, ''); if (!o.api) api = BR.api = base; }
      if (o.api) api = BR.api = String(o.api).replace(/\/+$/, '');
      if (typeof o.pub === 'string' && o.pub) {
        var had = pub;
        pub = BR.pub = o.pub;
        if (!had && pingStarted) ping();   // the load-time ping already ran without an id
      }
      sync();
      return BR.config(o);
    },
    config: function (o) {
      o = o || {};
      if ('test' in o) state.test = !!o.test;
      if ('muted' in o) state.muted = !!o.muted;
      if ('inworld' in o) state.inworld = o.inworld !== false;   // false: always use the pocket arena, even for in-world creatives
      if ('brandworld' in o) state.brandworld = o.brandworld !== false;   // false: Brand World creatives play in the pocket arena
      if ('storage' in o) state.storage = o.storage === false ? false : null;
      if ('countdownSec' in o) state.countdownSec = o.countdownSec;   // seconds of "Ad · Bonus Round in N" before a takeover; 0 = off
      if (coreP) coreP.then(function (c) { c.configChanged(); });
      return BR;
    },
    /** cancel(): stop the pre-round countdown (the round then doesn't start; break() resolves { filled:false, reason:'countdown_game' }) */
    cancel: function () { var c = window.__BONUSROUND_COUNTDOWN__; return !!(c && c.cancel('game')); },
    /** consent(true|false) from the site's CMP: false keeps the anonymous player id and counters in memory only */
    consent: function (v) { state.consent = !!v; if (coreP) coreP.then(function (c) { c.configChanged(); }); return BR; },
    debug: function () { return core().then(function (c) { return c.debug(); }); },
    ready: function () { return core().then(function () { return BR; }); },
  };
  window.BonusRound = BR;
  // warm the core once the page is idle so the first break() doesn't wait on the network
  var warm = function () { if (window.requestIdleCallback) window.requestIdleCallback(function () { core(); }, { timeout: 3000 }); else setTimeout(core, 1500); };
  if (document.readyState === 'complete') warm(); else window.addEventListener('load', warm, { once: true });

  // ---------- heartbeat: active play time for the developer's dashboard (platform/analytics) ----------
  // Active = the tab is visible, the game rendered a frame since the last check (any three.js renderer we've seen; none
  // seen → visible is enough) and there was input in the last 10 minutes. About one beacon a minute of active play, plus
  // one when the page is hidden or closed. The player id rides along only when the SDK may store one (not contextual-only,
  // not made for kids, storage and consent allowed): otherwise the server gets counts and this page's random sid only.
  if (!portal && !state.agent) (function () {
    var coreObj = null, activeMs = 0, sentBreaks = 0, beats = 0, lastTick = Date.now(), lastInput = Date.now(), frames = -1;
    var IDLE_MS = 600e3, TICK_MS = 5e3, BEAT_MS = 60e3;
    var onInput = function () { lastInput = Date.now(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'].forEach(function (t) { window.addEventListener(t, onInput, { passive: true, capture: true }); });
    var frameCount = function () {
      var n = -1;
      for (var i = 0; i < seen.renderers.length; i++) { var f = seen.renderers[i] && seen.renderers[i].info && seen.renderers[i].info.render && seen.renderers[i].info.render.frame; if (typeof f === 'number') n = Math.max(n, 0) + f; }
      return n;
    };
    var rendering = function () { var n = frameCount(); var ok = n < 0 || n !== frames; frames = n; return ok; };
    var vis = document.visibilityState === 'visible';
    var tick = function () {
      var now = Date.now(), dt = Math.min(now - lastTick, TICK_MS + 1e3);
      lastTick = now;
      // `vis` is the visibility since the last tick (a hide counts the seconds up to it, not after)
      if (vis && now - lastInput < IDLE_MS && rendering()) activeMs += dt;
      vis = document.visibilityState === 'visible';
      if (activeMs >= BEAT_MS) send(false);
    };
    var send = function (end) {
      var a = Math.round(activeMs / 1000), b = counts.breaks - sentBreaks;
      if (!pub || (!a && !b && (beats || !end))) return;   // nothing new (the first hide always reports, so a short visit is a session)
      activeMs -= a * 1000; sentBreaks = counts.breaks; beats++;
      var pid = null;
      try { if (coreObj && coreObj.storageAllowed && coreObj.storageAllowed() && /^p_[a-z0-9]{8,}$/.test(coreObj.playerId)) pid = coreObj.playerId; } catch (e) {}
      var body = JSON.stringify(Object.assign({ pub: pub, sid: sid, a: a, b: b }, pid ? { pid: pid } : {}, end ? { e: 1 } : {}));
      try { if (navigator.sendBeacon && navigator.sendBeacon(api + '/v1/beat', body)) return; } catch (e) {}
      try { fetch(api + '/v1/beat', { method: 'POST', mode: 'cors', keepalive: true, headers: { 'content-type': 'text/plain' }, body: body }).catch(function () {}); } catch (e) {}
    };
    var start = function () {
      if (coreP) coreP.then(function (c) { coreObj = c; }, function () {});
      setInterval(tick, TICK_MS);
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') { tick(); send(true); } else { lastTick = Date.now(); vis = true; } });
      window.addEventListener('pagehide', function () { tick(); send(true); });
    };
    // after the load ping (so the session exists), and once the core has resolved privacy
    state.ping.then(function () { if (!coreP) core(); start(); }, start);
  })();

  // ---------- command queue (adsbygoogle style) ----------
  var q = window.bonusround;
  var run = function (cmd) {
    try {
      if (typeof cmd === 'function') cmd(BR);
      else if (cmd && typeof cmd === 'object' && typeof cmd.length === 'number' && typeof BR[cmd[0]] === 'function') BR[cmd[0]].apply(BR, Array.prototype.slice.call(cmd, 1));
    } catch (e) { console.warn('[bonusround] queued command failed', e); }
  };
  window.bonusround = { push: function () { for (var i = 0; i < arguments.length; i++) run(arguments[i]); return 0; } };
  if (q && typeof q.length === 'number') for (var i = 0; i < q.length; i++) run(q[i]);
})();
