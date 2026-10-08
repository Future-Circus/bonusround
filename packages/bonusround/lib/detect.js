// Project detection + edit planning for `bonusround init`. Pure functions over file text: nothing here writes to disk.
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.vercel', '.output', 'coverage', '.cache', '.turbo', '.parcel-cache', 'vendor', 'public/build']);
const CODE_EXT = /\.(m?js|jsx|ts|tsx|vue|svelte)$/;
const MAX_FILES = 3000, MAX_BYTES = 1_500_000;

export function walk(root) {
  const out = [];
  const visit = (dir) => {
    if (out.length >= MAX_FILES) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) visit(full); continue; }
      if (!/\.(html?|m?js|jsx|ts|tsx|vue|svelte|json)$/.test(e.name)) continue;
      try { if (fs.statSync(full).size > MAX_BYTES) continue; } catch { continue; }
      out.push(full);
    }
  };
  visit(root);
  return out;
}

const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
const rel = (root, f) => path.relative(root, f).split(path.sep).join('/');
const lineOf = (text, index) => text.slice(0, index).split('\n').length - 1; // 0-based
const indentOf = (line) => /^\s*/.exec(line)[0];

// ---------- three.js detection ----------
export function detectThree(root, files) {
  const signals = [];
  let framework = 'vanilla', bundler = null;
  const pkgFile = path.join(root, 'package.json');
  let pkg = null;
  if (fs.existsSync(pkgFile)) {
    try { pkg = JSON.parse(read(pkgFile)); } catch { /* ignore */ }
    const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
    if (deps.three) signals.push(`package.json: three@${deps.three}`);
    if (deps['@react-three/fiber']) { signals.push(`package.json: @react-three/fiber@${deps['@react-three/fiber']}`); framework = 'r3f'; }
    if (deps.vite) signals.push('bundler: vite');
    else if (deps.webpack || deps['react-scripts']) signals.push('bundler: webpack');
    else if (deps.parcel) signals.push('bundler: parcel');
    else if (deps.next) signals.push('framework: next');
    bundler = ['vite', 'webpack', 'react-scripts', 'parcel', 'next', 'esbuild', 'rollup', '@sveltejs/kit', 'nuxt', 'astro', 'snowpack', '@remix-run/dev'].find((d) => deps[d]) || null;
    if (deps.bonusround) signals.push(`package.json: bonusround@${deps.bonusround} (already installed)`);
  }
  let importmap = null;
  for (const f of files) {
    if (!/\.html?$/.test(f)) continue;
    const t = read(f);
    const im = /<script[^>]*type=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i.exec(t);
    if (im && /["']three["']\s*:/.test(im[1])) {
      signals.push(`${rel(root, f)}: importmap maps "three"`);
      if (!importmap) importmap = { file: f, three: /["']three["']\s*:\s*["']([^"']+)["']/.exec(im[1])?.[1] || '' };
    }
    const cdn = /<script[^>]*src=["']([^"']*(?:three(?:\.module)?(?:\.min)?\.js|\/three@[^"']*))["']/i.exec(t);
    if (cdn) signals.push(`${rel(root, f)}: CDN script ${cdn[1]}`);
    if (/import[^'"]*from\s*['"]https?:\/\/[^'"]*three/.test(t)) signals.push(`${rel(root, f)}: CDN module import of three`);
  }
  for (const f of files) {
    if (!CODE_EXT.test(f)) continue;
    const t = read(f);
    if (/from\s+['"]three['"]|require\(\s*['"]three['"]\s*\)|from\s+['"]https?:\/\/[^'"]*three[^'"]*['"]/.test(t)) { signals.push(`${rel(root, f)}: imports three`); break; }
  }
  return { isThree: signals.length > 0, framework, bundler, importmap, signals, pkg };
}

// ---------- statement parsing helpers ----------
// From the index of an opening "(", return the index just past the matching ")". Skips strings, template literals and comments.
function matchParen(t, open) {
  let depth = 0;
  for (let i = open; i < t.length; i++) {
    const c = t[i];
    if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < t.length && t[i] !== q) { if (t[i] === '\\') i++; i++; } continue; }
    if (c === '/' && t[i + 1] === '/') { while (i < t.length && t[i] !== '\n') i++; continue; }
    if (c === '/' && t[i + 1] === '*') { i = t.indexOf('*/', i + 2); if (i < 0) return t.length; i++; continue; }
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i + 1; }
  }
  return t.length;
}

// Find `<target> = new <ns.>Ctor(` and return { target, ns, line (0-based line where the statement ends) }.
function findConstruction(t, ctorRe) {
  const re = new RegExp(String.raw`(?:(?:const|let|var)\s+)?([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*new\s+(?:([A-Za-z_$][\w$]*)\.)?(${ctorRe})\s*\(`, 'g');
  const m = re.exec(t);
  if (!m) return null;
  const open = m.index + m[0].length - 1;
  let end = matchParen(t, open);
  // include any chained calls on the same statement, then the semicolon
  while (/^\s*;/.test(t.slice(end)) === false && /^[ \t]*\./.test(t.slice(end))) {
    const p = t.indexOf('(', end); if (p < 0) break; end = matchParen(t, p);
  }
  const semi = /^[ \t]*;/.exec(t.slice(end));
  if (semi) end += semi[0].length;
  return { target: m[1], ns: m[2] || null, ctor: m[3], index: m.index, line: lineOf(t, end), startLine: lineOf(t, m.index) };
}

function moduleNamespace(t) {
  return /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"](?:three|https?:\/\/[^'"]*three[^'"]*)['"]/.exec(t)?.[1]
    || /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"]three['"]\s*\)/.exec(t)?.[1] || null;
}

// ---------- natural break candidates ----------
const BREAK_NAMES = String.raw`(?:on)?(?:round|level|stage|wave|match|race|game)_?(?:end|ended|over|complete|completed|finished|finish|won|lost|clear|cleared)|(?:on)?game_?over|show_?game_?over|(?:on)?(?:player)?_?(?:death|died|die|dead|respawn)|(?:on)?(?:next|end)_?(?:round|level|stage|wave)|(?:on)?intermission|(?:on)?lobby|(?:show)?_?results`;
export function findBreakSite(t) {
  const re = new RegExp(String.raw`^([ \t]*)(?:export\s+)?(?:(async)\s+)?(?:function\s+(${BREAK_NAMES})\s*\([^)]*\)\s*\{|(?:const|let|var)\s+(${BREAK_NAMES})\s*=\s*(async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{|(?:(async)\s+)?(${BREAK_NAMES})\s*\([^)]*\)\s*\{)[ \t]*$`, 'gim');
  let m;
  while ((m = re.exec(t))) {
    const name = m[3] || m[4] || m[7];
    if (/^(if|for|while|switch|catch|function)$/i.test(name)) continue;
    const isAsync = !!(m[2] || m[5] || m[6]);
    return { name, line: lineOf(t, m.index), indent: m[1], isAsync };
  }
  return null;
}

// ---------- plans ----------
// A plan is a list of { file, insertions: [{ after: lineIndex (-1 = top), lines: [...] }] } plus notes.
export function scriptTagFor({ host, pub, scriptTag }) {
  return scriptTag || `<script async src="${host}/v1/br.js" data-pub="${pub}"></script>`;
}

export function planHtml(root, htmlFile, tag) {
  const t = read(htmlFile);
  if (/\/v1\/br\.js/.test(t)) return { skip: `${rel(root, htmlFile)} already has the Bonus Round script tag` };
  const lines = t.split('\n');
  // Before the first <script> in <head> (so it is early), else just before </head>, else before the first <script>.
  const headClose = lines.findIndex((l) => /<\/head>/i.test(l));
  let at = headClose;
  const headOpen = lines.findIndex((l) => /<head[\s>]/i.test(l));
  if (headClose < 0) at = lines.findIndex((l) => /<script/i.test(l));
  if (at < 0) at = Math.max(0, lines.findIndex((l) => /<body/i.test(l)));
  const ref = lines[at] || lines[Math.max(0, headOpen + 1)] || '';
  const indent = headClose >= 0 ? (indentOf(lines[headClose - 1] || '') || '  ') : indentOf(ref);
  return { file: htmlFile, insertions: [{ after: at - 1, lines: [`${indent}<!-- Bonus Round: ads for three.js games. Docs: https://bonusround.io/docs/ -->`, `${indent}${tag}`] }] };
}

export function findRendererFile(root, files) {
  const hits = [];
  for (const f of files) {
    if (!CODE_EXT.test(f) && !/\.html?$/.test(f)) continue;
    const t = read(f);
    if (/new\s+(?:[A-Za-z_$][\w$]*\.)?WebG(?:L|PU)Renderer\s*\(/.test(t)) hits.push(f);
  }
  // Prefer source over html inline, and shorter paths (src/main.js over src/legacy/old.js).
  hits.sort((a, b) => (/\.html?$/.test(a) - /\.html?$/.test(b)) || a.length - b.length);
  return hits;
}

// style 'queue': the script tag's command queue (br.js loads async). style 'import': the npm package
// (import { BonusRound } from 'bonusround'), which needs no script tag and plays the bundled test round offline.
export function planAttach(root, file, { attachCall = 'attach', style = 'queue', pub = 'pub_XXXXXXXX', server = null } = {}) {
  const t = read(file);
  if (/BonusRound\s*(?:\?\.|\.)\s*attach\s*\(|\bBR\.attach\s*\(/.test(t)) return { skip: `${rel(root, file)} already calls BonusRound.attach` };
  if (style === 'import' && !/^\s*import\s.*from\s+['"]/m.test(t)) return { error: `${rel(root, file)} has no import statements: use the script tag (npx bonusround init --script-tag)` };
  const r = findConstruction(t, 'WebGLRenderer|WebGPURenderer|WebGL1Renderer');
  if (!r) return { error: `no "new WebGLRenderer(" found in ${rel(root, file)}` };
  const s = findConstruction(t, 'Scene');
  const c = findConstruction(t, 'PerspectiveCamera|OrthographicCamera');
  const notes = [];
  let ns = moduleNamespace(t) || r.ns || null;
  const isModule = /^\s*import\s/m.test(t) || /\.(mjs|jsx|tsx|ts)$/.test(file);
  const lines = t.split('\n');
  const insertions = [];
  if (!ns) {
    if (isModule) {
      ns = 'THREE';
      const lastImport = lines.reduce((acc, l, i) => (/^\s*import\s.*from\s+['"]/.test(l) ? i : acc), -1);
      insertions.push({ after: lastImport, lines: ["import * as THREE from 'three'; // Bonus Round needs the THREE namespace your game uses"] });
    } else {
      ns = 'THREE'; notes.push('Assuming a global THREE (classic <script> build).');
    }
  }
  const scene = s?.target || 'scene';
  const camera = c?.target || 'camera';
  if (!s) notes.push(`No "new Scene()" in ${rel(root, file)}: replace "scene" in the attach line with your scene.`);
  if (!c) notes.push(`No camera construction in ${rel(root, file)}: replace "camera" in the attach line with your camera.`);
  // After whichever of renderer / scene / camera is created last in this file, so all three exist.
  const after = Math.max(r.line, s?.line ?? -1, c?.line ?? -1);
  const indent = indentOf(lines[r.startLine]);
  const args = `{ THREE: ${ns}, scene: ${scene}, camera: ${camera}, renderer: ${r.target} }`
    .replace(`THREE: THREE,`, 'THREE,').replace(/scene: scene,/, 'scene,').replace(/camera: camera,/, 'camera,').replace(/renderer: renderer \}/, 'renderer }');
  if (style === 'import') {
    const lastImport = lines.reduce((acc, l, i) => (/^\s*import\s.*from\s+['"]/.test(l) ? i : acc), -1);
    const ii = indentOf(lines[lastImport] || '');
    insertions.push({ after: lastImport, lines: [
      `${ii}import { BonusRound } from 'bonusround'; // Bonus Round: playable ads for three.js games (npm i bonusround)`,
      `${ii}BonusRound.init({ pub: '${pub}'${server ? `, server: '${server}'` : ''} }); // ${pub === 'pub_XXXXXXXX' ? 'TODO(bonusround): your publisher id from https://bonusround.io/app/games/ (until then only the Fizzpop test round plays)' : 'your public publisher id'}`,
    ] });
    insertions.push({ after, lines: [
      `${indent}// Bonus Round: ambient branded props + Bonus Round takeovers. Docs: https://bonusround.io/docs/attach`,
      `${indent}BonusRound.${attachCall}(${args});`,
    ] });
  } else insertions.push({
    after,
    lines: [
      `${indent}// Bonus Round: ambient branded props + Bonus Round takeovers. Docs: https://bonusround.io/docs/attach`,
      `${indent}// The queue runs as soon as the async br.js has loaded (or right away); if it never loads, nothing happens.`,
      `${indent}(window.bonusround = window.bonusround || []).push((BR) => BR.${attachCall}(${args}));`,
    ],
  });
  const breakCall = style === 'import' ? "await BonusRound.break('intermission');" : "await window.BonusRound?.break('intermission');";
  // Example break() call site as a commented TODO.
  const b = findBreakSite(t);
  if (b) {
    insertions.push({
      after: b.line,
      lines: [
        `${b.indent}  // TODO(bonusround): this looks like a natural break. Pause your game loop and input, then show a Bonus Round:`,
        ...(b.isAsync ? [] : [`${b.indent}  //   (make ${b.name} async first)`]),
        `${b.indent}  //   ${breakCall} // resolves when the round ends, or right away if there's no ad`,
      ],
    });
  } else {
    insertions.push({
      after,
      lines: [
        `${indent}// TODO(bonusround): at each natural break (round end, death/respawn, level complete, pause/lobby) add:`,
        `${indent}//   ${breakCall}`,
      ],
    });
  }
  insertions.sort((a, b2) => a.after - b2.after);
  return { file, insertions, notes, found: { renderer: r.target, scene: s?.target || null, camera: c?.target || null, THREE: ns, breakSite: b?.name || null } };
}

// Import map games: map "bonusround" the way "three" is mapped (node_modules → node_modules, else the npm CDN).
export function importmapUrlFor(threeUrl) {
  const nm = /^(.*?node_modules\/)three\//.exec(threeUrl || '');
  if (nm) return `${nm[1]}bonusround/index.js`;
  if (/unpkg\.com/.test(threeUrl)) return 'https://unpkg.com/bonusround@1/index.js';
  return 'https://cdn.jsdelivr.net/npm/bonusround@1/index.js';
}
export function planImportmap(root, htmlFile, url) {
  const t = read(htmlFile);
  const lines = t.split('\n');
  const m = /<script[^>]*type=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i.exec(t);
  if (!m) return { error: `no importmap in ${rel(root, htmlFile)}` };
  if (/["']bonusround["']\s*:/.test(m[1])) return { skip: `${rel(root, htmlFile)} importmap already maps "bonusround"` };
  const start = m.index + m[0].indexOf(m[1]);
  const open = /["']imports["']\s*:\s*\{/.exec(m[1]);
  if (!open) return { error: `the importmap in ${rel(root, htmlFile)} has no "imports"` };
  const at = start + open.index + open[0].length;   // just inside "imports": {
  const li = lineOf(t, at);
  const col = at - (t.lastIndexOf('\n', at - 1) + 1);
  const line = lines[li];
  const rest = line.slice(col);
  // "imports": { at the end of its line → a new line under it; else insert inline
  if (!rest.trim()) {
    const next = lines[li + 1] || '';
    return { file: htmlFile, insertions: [{ after: li, lines: [`${indentOf(next) || indentOf(line) + '  '}"bonusround": "${url}",`] }] };
  }
  const sep = /^\s*\}/.test(rest) ? '' : ',';
  return { file: htmlFile, insertions: [], replacements: [{ line: li, text: `${line.slice(0, col)} "bonusround": "${url}"${sep}${rest.startsWith(' ') ? '' : ' '}${rest}` }] };
}

// R3F: write a tiny component and mount it inside <Canvas>.
export function planR3F(root, files, { style = 'queue', pub = 'pub_XXXXXXXX' } = {}) {
  const canvasFile = files.find((f) => /\.(jsx|tsx)$/.test(f) && /<Canvas[\s>]/.test(read(f)));
  if (!canvasFile) return { error: 'React Three Fiber detected, but no <Canvas> found in a .jsx/.tsx file.' };
  const t = read(canvasFile);
  if (/BonusRoundAttach/.test(t)) return { skip: `${rel(root, canvasFile)} already renders <BonusRoundAttach />` };
  const lines = t.split('\n');
  const ts = /\.tsx$/.test(canvasFile);
  const compFile = path.join(path.dirname(canvasFile), `BonusRoundAttach.${ts ? 'tsx' : 'jsx'}`);
  const compSrc = style === 'import' ? [
    '// Bonus Round for React Three Fiber (npm i bonusround). Docs: https://bonusround.io/docs/install#r3f',
    "import { useEffect } from 'react';",
    "import { useThree } from '@react-three/fiber';",
    "import * as THREE from 'three';",
    "import { BonusRound } from 'bonusround';",
    '',
    `BonusRound.init({ pub: '${pub}' }); // ${pub === 'pub_XXXXXXXX' ? 'TODO(bonusround): your publisher id from https://bonusround.io/app/games/ (until then only the Fizzpop test round plays)' : 'your public publisher id'}`,
    '',
    'export function BonusRoundAttach() {',
    '  const { scene, camera, gl } = useThree();',
    '  useEffect(() => {',
    '    BonusRound.attach({ THREE, scene, camera, renderer: gl });',
    '  }, [scene, camera, gl]);',
    '  return null;',
    '}',
    '',
    "// At a natural break (round over, game over, level complete): await BonusRound.break('intermission');",
    '',
  ].join('\n') : [
    '// Bonus Round for React Three Fiber. Docs: https://bonusround.io/docs/install#r3f',
    "import { useEffect } from 'react';",
    "import { useThree } from '@react-three/fiber';",
    "import * as THREE from 'three';",
    '',
    'export function BonusRoundAttach() {',
    '  const { scene, camera, gl } = useThree();',
    '  useEffect(() => {',
    `    const w = window${ts ? ' as any' : ''};`,
    '    (w.bonusround = w.bonusround || []).push((BR) => BR.attach({ THREE, scene, camera, renderer: gl }));',
    '  }, [scene, camera, gl]);',
    '  return null;',
    '}',
    '',
  ].join('\n');
  // Insert after the opening <Canvas ...> tag (may span lines).
  const idx = t.search(/<Canvas[\s>]/);
  let end = idx; let depth = 0;
  for (; end < t.length; end++) { const ch = t[end]; if (ch === '{') depth++; else if (ch === '}') depth--; else if (ch === '>' && depth === 0) break; }
  const line = lineOf(t, end);
  const indent = indentOf(lines[lineOf(t, idx)]) + '  ';
  const lastImport = lines.reduce((acc, l, i) => (/^\s*import\s.*from\s+['"]/.test(l) ? i : acc), -1);
  return {
    file: canvasFile,
    newFile: { file: compFile, content: compSrc },
    insertions: [
      { after: lastImport, lines: ["import { BonusRoundAttach } from './BonusRoundAttach';"] },
      { after: line, lines: [`${indent}<BonusRoundAttach />`] },
    ].sort((a, b) => a.after - b.after),
    notes: ['In R3F, scene/camera/gl come from useThree(); gl is the WebGLRenderer.'],
    found: { renderer: 'gl (useThree)', scene: 'scene (useThree)', camera: 'camera (useThree)', THREE: 'THREE' },
  };
}

export function chooseHtmlEntry(root, files, rendererFile) {
  const htmls = files.filter((f) => /\.html?$/.test(f));
  if (rendererFile) {
    const base = path.basename(rendererFile).replace(/\.(ts|tsx|jsx)$/, '');
    const ref = htmls.find((h) => { const t = read(h); return t.includes(path.basename(rendererFile)) || t.includes(base); });
    if (ref) return ref;
    if (/\.html?$/.test(rendererFile)) return rendererFile;
  }
  const order = ['index.html', 'public/index.html', 'src/index.html', 'static/index.html', 'app/index.html'];
  for (const o of order) { const f = path.join(root, o); if (htmls.includes(f)) return f; }
  return htmls.sort((a, b) => a.length - b.length)[0] || null;
}

// ---------- applying + diffing ----------
export function apply(text, insertions, replacements = []) {
  const lines = text.split('\n');
  for (const r of replacements) lines[r.line] = r.text;
  // Apply bottom-up so earlier indexes stay valid; stable for equal `after`.
  const sorted = insertions.map((ins, i) => ({ ...ins, i })).sort((a, b) => b.after - a.after || b.i - a.i);
  for (const ins of sorted) lines.splice(ins.after + 1, 0, ...ins.lines);
  return lines.join('\n');
}

export function unifiedDiff(name, before, insertions, color = false, replacements = []) {
  const g = (s) => (color ? `\x1b[32m${s}\x1b[0m` : s), dim = (s) => (color ? `\x1b[2m${s}\x1b[0m` : s), cy = (s) => (color ? `\x1b[36m${s}\x1b[0m` : s);
  const lines = before.split('\n');
  const out = [dim(`--- a/${name}`), dim(`+++ b/${name}`)];
  const sorted = [...insertions].sort((a, b) => a.after - b.after);
  for (const r of replacements) {
    out.push(cy(`@@ -${r.line + 1},1 +${r.line + 1},1 @@`));
    out.push(color ? `\x1b[31m-${lines[r.line]}\x1b[0m` : `-${lines[r.line]}`);
    out.push(g(`+${r.text}`));
  }
  let added = 0;
  for (const ins of sorted) {
    const from = Math.max(0, ins.after - 2), to = Math.min(lines.length - 1, ins.after + 2);
    out.push(cy(`@@ -${from + 1},${to - from + 1} +${from + 1 + added},${to - from + 1 + ins.lines.length} @@`));
    for (let i = from; i <= ins.after; i++) out.push(` ${lines[i] ?? ''}`);
    for (const l of ins.lines) out.push(g(`+${l}`));
    for (let i = ins.after + 1; i <= to; i++) out.push(` ${lines[i] ?? ''}`);
    added += ins.lines.length;
  }
  return out.join('\n');
}
