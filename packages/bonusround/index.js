// Bonus Round SDK 1.0.7 for three.js games: https://bonusround.io/docs/  ·  npm i bonusround
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
  if (!cfg.markSvg) cfg.markSvg = "<img src=\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%20role%3D%22img%22%20aria-label%3D%22Bonus%20Round%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22br-gold%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%228%22%20y1%3D%224%22%20x2%3D%2256%22%20y2%3D%2262%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffd66b%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffb000%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Ccircle%20cx%3D%2234.2%22%20cy%3D%2232%22%20r%3D%2227%22%20fill%3D%22%23c27400%22%2F%3E%3Crect%20x%3D%2229.8%22%20y%3D%225%22%20width%3D%224.4%22%20height%3D%2254%22%20rx%3D%220%22%20fill%3D%22%23c27400%22%2F%3E%3Ccircle%20cx%3D%2229.8%22%20cy%3D%2232%22%20r%3D%2227%22%20fill%3D%22url(%23br-gold)%22%2F%3E%3Ccircle%20cx%3D%2229.8%22%20cy%3D%2232%22%20r%3D%2221.4%22%20fill%3D%22none%22%20stroke-width%3D%222.6%22%20stroke%3D%22%23e08f00%22%20stroke-opacity%3D%220.62%22%2F%3E%3Cpath%20d%3D%22M6.78%2024.52A24.2%2024.2%200%200%201%2020.73%209.56%22%20fill%3D%22none%22%20stroke-width%3D%222.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%220.7%22%2F%3E%3Cellipse%20cx%3D%2221.700000000000003%22%20cy%3D%2230.38%22%20rx%3D%223.7800000000000002%22%20ry%3D%225.13%22%20fill%3D%22%231a1405%22%2F%3E%3Cellipse%20cx%3D%2237.9%22%20cy%3D%2230.38%22%20rx%3D%223.7800000000000002%22%20ry%3D%225.13%22%20fill%3D%22%231a1405%22%2F%3E%3Ccircle%20cx%3D%2222.91%22%20cy%3D%2228.43%22%20r%3D%221.36%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2239.11%22%20cy%3D%2228.43%22%20r%3D%221.36%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M26.02%2039.02Q29.8%2043.34%2033.58%2039.02%22%20fill%3D%22none%22%20stroke-width%3D%222.565%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22%231a1405%22%2F%3E%3Cellipse%20cx%3D%2215.76%22%20cy%3D%2237.94%22%20rx%3D%223.5100000000000002%22%20ry%3D%222.16%22%20fill%3D%22%23ff5d8f%22%20fill-opacity%3D%220.6%22%2F%3E%3Cellipse%20cx%3D%2243.84%22%20cy%3D%2237.94%22%20rx%3D%223.5100000000000002%22%20ry%3D%222.16%22%20fill%3D%22%23ff5d8f%22%20fill-opacity%3D%220.6%22%2F%3E%3C%2Fsvg%3E%0A\" alt=\"\" aria-hidden=\"true\" draggable=\"false\">";
  /*! Bonus Round SDK loader v1.0.0 · <script async src="https://<host>/v1/br.js" data-pub="pub_…"></script>
   * Classic script. window.BonusRound exists as soon as this runs; code that may run earlier uses the queue:
   *   (window.bonusround = window.bonusround || []).push(function (BR) { BR.attach({ THREE, scene, camera, renderer }); });
   * Heavy code (formats, overlay, three.js loaders) is imported lazily from the same origin as this file.
   */
  (function () {
    'use strict';
    if (window.BonusRound && window.BonusRound.__loader) return;
    var VERSION = '1.0.7';
  
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
        }).then(function (r) { state.pingHttp = r.status; return r.ok ? r.json() : null; }).then(function (j) { pingDone = true; pingResolve(j); if (state.onPing) state.onPing(j); }, function () { if (!state.pingHttp) state.pingHttp = 0; pingResolve(null); if (state.onPing) state.onPing(null); });
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
          // the dev panel (BonusRound.status() badge, below) shows the link as a row; it reads the cache set above
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
      /** await break(trigger) → { filled, completed, id?, reason?, score? }: once, after the round has fully ended ('end' fired),
       *  or { filled:false } when no round plays for this call. A break() while another is still preparing shares its round;
       *  one while a round is on screen is { filled:false, reason:'busy' }. 'start' fires before anything shows (countdown included). */
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
  
    // ---------- status: what Bonus Round is doing on this page, and the next step (one shape: sdk/status.js) ----------
    // BonusRound.status() → { host:'dev'|'public', hostClass, mode:'test'|'free-house'|'paid', claimed, learning, paidAds, reason,
    // ad, claimUrl?, next, pub, settled }. The same object rides the 'status' event (BonusRound.on('status', fn)) and the window
    // event 'bonusround.status', is printed once as a console line, and (dev / temporary hosts only, never in front of real
    // players) shows in a small dismissible "Bonus Round · dev" badge with a "Play test round" button.
    // bonusroundConfig.hostClass = 'public' | 'dev' overrides the page's host class (tests only: the server keeps its own view).
    var status = (function () {
      var LEARN0 = 'not-started (needs a public URL)';
      var pageRound = false, cur = null, said = '', mod = null, hostInfo = null, game = null, offline = false, settled = false, badge = null, hidden = false, inRound = false;
      var override = cfg0.hostClass === 'public' || cfg0.hostClass === 'dev' ? cfg0.hostClass : null;
      var label = location.protocol === 'file:' ? 'file' : (location.hostname || 'file');
      // before /sdk/hostclass.js loads (or when our server is unreachable): the obvious dev hosts
      var quickClass = function () {
        var h = location.hostname.toLowerCase();
        if (location.protocol === 'file:' || !h || h.indexOf('.') < 0 || h.charAt(0) === '[') return 'dev';
        return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0$)|\.(localhost|local|test|lan|internal)$/.test(h) ? 'dev' : 'public';
      };
      var claimUrl = function () { try { return pub ? localStorage.getItem('br_claim_' + pub) : null; } catch (e) { return null; } };
      function build() {
        var hc = override || (hostInfo ? hostInfo['class'] : quickClass());
        var s;
        // before the ping answers (settled:false), a game with a pub id reads as test mode
        var g = !settled && pub && !game ? { testMode: true, claimed: false, status: '' } : game;
        if (mod) s = mod.buildStatus({ host: hc, game: g, claimUrl: claimUrl(), offline: offline });
        else {   // inline twin of buildStatus for a dev page whose status module couldn't load
          var dev = hc !== 'public';
          s = { host: dev ? 'dev' : 'public', hostClass: hc, mode: 'test', claimed: game && game.known !== false ? !!game.claimed : null, learning: LEARN0, paidAds: false,
            reason: offline ? 'offline' : dev ? 'dev_host' : 'test_mode', ad: 'fallback',
            next: dev ? "Host your game at a public URL and we'll learn it and tailor ads to it." : 'Load the game once on its public HTTPS URL with the line of code.' };
          if (offline) s.offline = true;
        }
        if (portal) { s.mode = 'test'; s.paidAds = false; s.reason = 'portal'; s.ad = 'none'; s.next = portal.host + ' does not allow third-party ads, so Bonus Round is off here.'; }
        if (state.agent) s.reason = 'agent';
        s.pub = pub || null;
        s.settled = settled;
        return s;
      }
      function line(s) {
        if (mod) return mod.statusLine(s, label);
        return '[Bonus Round] ' + (s.host === 'dev' ? label : 'test mode') + ' · showing the free bonusround.io test ad (no game learning yet' + (s.offline ? "; our server isn't reachable, so the bundled copy plays" : '') + '). ' + s.next;
      }
      function update() {
        var s = build(), was = cur ? JSON.stringify(cur) : '';
        cur = s;
        if (JSON.stringify(s) === was) return;
        render();
        if (!settled) return;   // events once the server has answered (or couldn't)
        emitter.emit('status', s);
        try { window.dispatchEvent(new CustomEvent('bonusround.status', { detail: s })); } catch (e) {}
        if (!state.agent) { var l = line(s); if (l !== said) { said = l; console.info(l); } }
      }
      function render() {
        var show = cur && cur.host === 'dev' && !state.agent && !portal && !hidden && !inRound && !pageRound && document.body;
        if (!show) { if (badge) badge.host.style.display = 'none'; return; }
        if (!badge) {
          var host = document.createElement('div');
          host.setAttribute('data-bonusround-devbadge', '');
          host.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483645;';
          var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
          // the host page's `*` rules can't restyle the badge (same reset as sdk/ui-reset.js UI_RESET: keep in sync)
          root.innerHTML = '<style>:host{all:initial}:host{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif!important;font-size:16px!important;font-weight:400!important;font-style:normal!important;font-variant:normal!important;font-stretch:normal!important;font-feature-settings:normal!important;font-kerning:auto!important;line-height:normal!important;letter-spacing:normal!important;word-spacing:normal!important;text-transform:none!important;text-indent:0!important;text-align:left!important;text-shadow:none!important;text-decoration:none!important;white-space:normal!important;direction:ltr!important;writing-mode:horizontal-tb!important;visibility:visible!important;cursor:auto!important;color:initial!important;-webkit-text-stroke:0!important}.b{box-sizing:border-box;width:min(300px,calc(100vw - 24px));padding:10px 12px;border-radius:14px;background:rgba(10,11,16,.92);color:#fff;font:500 12px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.16)}'
            + '.t{display:flex;align-items:center;gap:7px;font-weight:700;font-size:12.5px}.mk{display:inline-flex;width:18px;height:18px}.mk:empty{display:none}.mk img,.mk svg{width:18px;height:18px}.t .d{color:#ffd66b}.x{all:unset;margin-left:auto;cursor:pointer;width:20px;height:20px;text-align:center;border-radius:50%;background:rgba(255,255,255,.12);font-size:14px;line-height:20px}'
            + '.w{margin-top:5px;opacity:.88}.n{margin-top:4px;opacity:.65}.p{all:unset;box-sizing:border-box;margin-top:8px;display:inline-block;cursor:pointer;padding:6px 12px;border-radius:999px;background:#ffb000;color:#1b1d33;font-weight:800;font-size:12px}.p[disabled]{opacity:.5;cursor:default}.c{display:block;margin-top:6px;color:#ffd66b;font-weight:700;text-decoration:none}.c[hidden]{display:none}</style>'
            + '<div class="b" role="status"><div class="t"><span class="mk"></span><span>Bonus Round · <span class="d">dev</span></span><button class="x" type="button" aria-label="Dismiss">×</button></div>'
            + '<div class="w"></div><div class="n"></div><a class="c" target="_blank" rel="noopener" hidden>Claim this game: turn on paid ads ↗</a><button class="p" type="button">▶ Play test round</button></div>';
          var q = function (sel) { return root.querySelector(sel); };
          q('.x').onclick = function () { hidden = true; render(); try { sessionStorage.setItem('br_devbadge_x', '1'); } catch (e) {} };
          q('.p').onclick = function () {
            var b = q('.p'); b.disabled = true; b.textContent = 'Starting…';
            // __internal: a test round from the badge isn't the developer's own break() (keeps tag-only offers on)
            BR['break']('test', { __internal: true }).then(function (r) {
              b.disabled = false; b.textContent = '▶ Play test round';
              if (r && !r.filled) console.info('[Bonus Round] test round not played: ' + (r.reason || 'unfilled') + (r.reason === 'not_attached' ? '. Add BonusRound.attach({ THREE, scene, camera, renderer }) after your renderer exists.' : ''));
            });
          };
          badge = { host: host, q: q };
          if (cfg0.markSvg) q('.mk').innerHTML = cfg0.markSvg;   // npm builds bundle the mark (no request to bonusround.io)
          else import(base + '/sdk/countdown.js').then(function (m) { if (m.BR_MARK_SVG) q('.mk').innerHTML = m.BR_MARK_SVG; }).catch(function () {});
          document.body.appendChild(host);
        }
        badge.host.style.display = '';
        // the claim chip (claimHint above) sits bottom-left too: stack above it
        var chip = document.querySelector('[data-bonusround-claim]');
        badge.host.style.bottom = chip ? (12 + chip.getBoundingClientRect().height + 8) + 'px' : '12px';
        var what = cur.ad === 'tailored-test' ? 'Showing a free test ad made for your game.' : 'Showing the free bonusround.io test ad (no game learning yet).';
        badge.q('.w').textContent = (cur.offline ? "Our server isn't reachable: the bundled test ad plays. " : '') + what;
        badge.q('.n').textContent = cur.next;
        var c = badge.q('.c');   // the claim link (unclaimed games, registering network only: claimHint above)
        if (cur.claimUrl && /^https?:\/\//i.test(cur.claimUrl)) { c.href = cur.claimUrl; c.hidden = false; } else c.hidden = true;
      }
      try { hidden = sessionStorage.getItem('br_devbadge_x') === '1'; } catch (e) {}
      emitter.on('start', function () { inRound = true; render(); });
      emitter.on('end', function () { inRound = false; render(); });
      // rounds that don't come through this emitter (tag-only, Brand World, zones, the countdown): the page-level signals
      var roundOn = function () {
        var w = window, ph = function (x) { return /^(countdown|intro|playing|leaderboard)$/.test(String(x || '')); };
        try {
          if ((w.__BONUSROUND_COUNTDOWN__ && w.__BONUSROUND_COUNTDOWN__.active) || (w.__BONUSROUND_BREAK__ && w.__BONUSROUND_BREAK__.active)
            || (w.__BONUSROUND_ROUND__ && w.__BONUSROUND_ROUND__.active) || w.__SPATIAL_ADS_BRANDWORLD__) return true;
          if (w.__SPATIAL_ADS_OVERLAY__ && ph(w.__SPATIAL_ADS_OVERLAY__.phase)) return true;
          if (w.__SPATIAL_ADS__ && typeof w.__SPATIAL_ADS__.debug === 'function' && ph((w.__SPATIAL_ADS__.debug() || {}).phase)) return true;
        } catch (e) {}
        return false;
      };
      setInterval(function () {
        if (!badge || hidden || !cur || cur.host !== 'dev') return;
        var on = roundOn();
        if (on !== pageRound) { pageRound = on; render(); }
      }, 400);
      if (state.agent) return function () { return build(); };
      update();
      if (!portal) Promise.all([   // portal mode loads nothing from the SDK (the inline twin answers)
        import(base + '/sdk/status.js').then(function (m) { mod = m; }),
        import(base + '/sdk/hostclass.js').then(function (m) { hostInfo = m.classifyHost(location); }),
      ]).catch(function () {}).then(update);
      var settle = function (j) {
        game = null; offline = false;
        if (j && j.sdkGame) game = j.sdkGame;
        else if (pub && state.pingHttp === 404) game = { known: false };
        // an older server (no sdkGame): its testMode / status are enough; a pub id we couldn't check is still a pub id
        else if (pub && j) game = { testMode: j.testMode !== false, claimed: null, status: j.status || '' };
        else if (pub) { offline = true; game = { testMode: true, claimed: null, status: '' }; }
        settled = true; update();
        setTimeout(update, 2500);   // the claim link (claimHint) lands in localStorage a moment after the ping
      };
      state.ping.then(settle, function () { settle(null); });
      state.onPing = function (j) { if (settled) settle(j); };   // a later ping (init({ pub }) after load) updates the status
      var onBody = function () { if (cur) render(); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onBody, { once: true });
      return function () { return cur || build(); };
    })();
    BR.status = function () { return status(); };
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
  
}
const noop = () => Promise.resolve({ filled: false, completed: false, reason: 'ssr' });
const stub = { version: "1.0.7", init() { return stub; }, config() { return stub; }, attach: noop, break: noop, zone: noop, rewarded: noop, safe() { return stub; },
  placeAmbient() { return stub; }, on() { return stub; }, off() { return stub; }, cancel: () => false, consent() { return stub; }, debug: noop, ready: () => Promise.resolve(stub) };
/** window.BonusRound (a no-op stub during server-side rendering). */
export const BonusRound = BR_SSR ? stub : window.BonusRound;
export default BonusRound;
