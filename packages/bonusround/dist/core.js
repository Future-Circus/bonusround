// Bonus Round SDK core 1.0.3 (bundled from sdk/br-core.js). https://bonusround.io/docs/
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../sdk/builders.js
function luminance(h) {
  const n = h.length === 4 ? h.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : h;
  const [r4, g, b] = [1, 3, 5].map((i) => parseInt(n.substr(i, 2), 16) / 255).map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r4 + 0.7152 * g + 0.0722 * b;
}
function canvasTexture(THREE, canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function glowTexture(THREE, color = "#ffffff", ring = false) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (ring) {
    gr.addColorStop(0, color + "00");
    gr.addColorStop(0.42, color + "18");
    gr.addColorStop(0.62, color + "ff");
    gr.addColorStop(0.78, color + "55");
    gr.addColorStop(1, color + "00");
  } else {
    gr.addColorStop(0, color);
    gr.addColorStop(0.35, color + "aa");
    gr.addColorStop(1, color + "00");
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return canvasTexture(THREE, c);
}
function fitText(g, text, maxW, size, weight = 900) {
  let s = size;
  do {
    g.font = `${weight} ${s}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    s -= 4;
  } while (g.measureText(text).width > maxW && s > 12);
  return s + 4;
}
function disposeTree(obj) {
  const seen = /* @__PURE__ */ new Set();
  obj.traverse((o) => {
    if (o.geometry && !seen.has(o.geometry)) {
      seen.add(o.geometry);
      o.geometry.dispose();
    }
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (seen.has(m)) continue;
      seen.add(m);
      for (const v of Object.values(m)) if (v && v.isTexture && !seen.has(v)) {
        seen.add(v);
        v.dispose();
      }
      if (m.uniforms) {
        for (const u of Object.values(m.uniforms)) if (u.value?.isTexture) u.value.dispose();
      }
      m.dispose();
    }
    if (o.isSkinnedMesh && o.skeleton) o.skeleton.dispose?.();
    if (o.isLight) o.dispose?.();
  });
}
function normalize(THREE, obj, heightM) {
  const pivot = new THREE.Group();
  pivot.add(obj);
  pivot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(pivot, true);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const ref = size.y > 0.05 * Math.max(size.x, size.z) ? size.y : Math.max(size.x, size.y, size.z);
  const s = ref > 1e-6 && Number.isFinite(ref) ? heightM / ref : 1;
  obj.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
  const outer = new THREE.Group();
  outer.add(pivot);
  pivot.scale.setScalar(s);
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return outer;
}
function findClip(clips, wanted) {
  if (!wanted || !clips?.length) return null;
  const w = String(wanted).toLowerCase();
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const wn = norm(wanted);
  return clips.find((c) => c.name.toLowerCase() === w) || clips.find((c) => c.name.toLowerCase().includes(w)) || wn && clips.find((c) => norm(c.name).includes(wn)) || wn && clips.find((c) => {
    const tail = norm(c.name.split("|").pop());
    return tail.length >= 3 && wn.includes(tail);
  }) || null;
}
function logoCanvas(brand2, pal, img) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  if (img) {
    const k = Math.min(220 / img.width, 220 / img.height);
    g.drawImage(img, 128 - img.width * k / 2, 128 - img.height * k / 2, img.width * k, img.height * k);
    return c;
  }
  const gr = g.createLinearGradient(0, 0, 256, 256);
  gr.addColorStop(0, pal.primary);
  gr.addColorStop(1, pal.secondary);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(128, 128, 122, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 10;
  g.strokeStyle = pal.accent;
  g.stroke();
  const ini = initials(brand2.name);
  g.fillStyle = readableOn(pal.primary, pal.text);
  fitText(g, ini, 180, 130);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(ini, 128, 136);
  return c;
}
function bannerCanvas(brand2, pal, logoImg, aspect = 2.4) {
  const W = 1200, H = Math.round(W / aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, pal.primary);
  gr.addColorStop(1, pal.background);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.save();
  g.globalAlpha = 0.9;
  g.fillStyle = pal.secondary;
  g.beginPath();
  g.moveTo(W * 0.62, 0);
  g.lineTo(W, 0);
  g.lineTo(W, H);
  g.lineTo(W * 0.48, H);
  g.closePath();
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = pal.accent;
  g.beginPath();
  g.moveTo(W * 0.585, 0);
  g.lineTo(W * 0.62, 0);
  g.lineTo(W * 0.5, H);
  g.lineTo(W * 0.465, H);
  g.closePath();
  g.fill();
  g.globalAlpha = 0.18;
  g.fillStyle = "#ffffff";
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    g.arc(i * 337 % W, i * 211 % H, 8 + i * 7 % 30, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  const logo = logoCanvas(brand2, pal, logoImg);
  const ls = H * 0.5;
  g.drawImage(logo, W * 0.7, H / 2 - ls / 2, ls, ls);
  const ink2 = readableOn(pal.primary, pal.text);
  g.fillStyle = ink2;
  g.textBaseline = "alphabetic";
  const size = fitText(g, brand2.name, W * 0.5, H * 0.3);
  g.shadowColor = "rgba(0,0,0,0.25)";
  g.shadowBlur = 12;
  g.shadowOffsetY = 4;
  g.fillText(brand2.name, W * 0.05, H * 0.5 + size * 0.2);
  if (brand2.tagline) {
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;
    fitText(g, brand2.tagline, W * 0.48, H * 0.11, 700);
    g.globalAlpha = 0.92;
    g.fillText(brand2.tagline, W * 0.05, H * 0.5 + size * 0.2 + H * 0.17);
  }
  return c;
}
function groundCanvas(m, pal, logoImg) {
  const a = m.round.arena, S3 = 1024, R = S3 / 2;
  const c = document.createElement("canvas");
  c.width = c.height = S3;
  const g = c.getContext("2d");
  g.fillStyle = a.groundColor;
  g.fillRect(0, 0, S3, S3);
  g.save();
  g.translate(R, R);
  g.fillStyle = a.groundAccent;
  for (let i = 0; i < 24; i += 2) {
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, R, i / 24 * Math.PI * 2, (i + 1) / 24 * Math.PI * 2);
    g.closePath();
    g.globalAlpha = 0.45;
    g.fill();
  }
  g.globalAlpha = 1;
  g.strokeStyle = a.groundAccent;
  g.lineWidth = 6;
  for (const k of [0.32, 0.56, 0.78]) {
    g.beginPath();
    g.arc(0, 0, R * k, 0, Math.PI * 2);
    g.stroke();
  }
  g.lineWidth = R * 0.1;
  g.strokeStyle = pal.primary;
  g.beginPath();
  g.arc(0, 0, R * 0.9, 0, Math.PI * 2);
  g.stroke();
  const label = ` ${brand(m).toUpperCase()} \u2022 `;
  g.fillStyle = readableOn(pal.primary, pal.text);
  g.font = `900 ${Math.round(R * 0.06)}px system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const per = g.measureText(label).width / (R * 0.9);
  const reps = Math.max(1, Math.floor(Math.PI * 2 / per));
  for (let i = 0; i < reps; i++) {
    const base = i / reps * Math.PI * 2;
    let ang = base;
    for (const ch of label) {
      const w = g.measureText(ch).width / (R * 0.9);
      g.save();
      g.rotate(ang + w / 2);
      g.translate(0, -R * 0.9);
      g.fillText(ch, 0, 0);
      g.restore();
      ang += w;
    }
  }
  g.fillStyle = pal.secondary;
  g.beginPath();
  g.arc(0, 0, R * 0.2, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = pal.accent;
  g.stroke();
  const logo = logoCanvas(m.brand, pal, logoImg);
  g.drawImage(logo, -R * 0.16, -R * 0.16, R * 0.32, R * 0.32);
  g.restore();
  return c;
}
function gradientSky(THREE, top, bottom, radius) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: "varying float vH; void main(){ vH = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top, bottom; varying float vH; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.15, 0.7, vH)), 1.0);\n#include <colorspace_fragment>\n}"
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}
function makeCan(THREE, H, pal, br) {
  const g = new THREE.Group();
  const R = H / 4.1;
  const pts = [[0, 0], [R * 0.78, 0], [R * 0.95, H * 0.03], [R, H * 0.09], [R, H * 0.88], [R * 0.9, H * 0.95], [R * 0.84, H * 0.985], [R * 0.86, H], [0, H]].map(([x2, y]) => new THREE.Vector2(x2, y));
  const metal = new THREE.MeshStandardMaterial({ color: pal.primary, metalness: 0.45, roughness: 0.28 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 56), metal);
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 640;
  const x = c.getContext("2d");
  const gr = x.createLinearGradient(0, 0, 0, 640);
  gr.addColorStop(0, pal.secondary);
  gr.addColorStop(1, pal.primary);
  x.fillStyle = gr;
  x.fillRect(0, 0, 2048, 640);
  x.fillStyle = pal.accent;
  for (const o of [0, 1024]) {
    x.beginPath();
    x.moveTo(o, 470);
    x.bezierCurveTo(o + 300, 380, o + 700, 600, o + 1024, 470);
    x.lineTo(o + 1024, 640);
    x.lineTo(o, 640);
    x.fill();
  }
  x.globalAlpha = 0.25;
  x.fillStyle = "#fff";
  for (let i = 0; i < 40; i++) {
    x.beginPath();
    x.arc(i * 263 % 2048, i * 157 % 420, 6 + i % 5 * 5, 0, Math.PI * 2);
    x.fill();
  }
  x.globalAlpha = 1;
  x.fillStyle = readableOn(pal.secondary, pal.background);
  x.textAlign = "center";
  x.textBaseline = "middle";
  fitText(x, br.name, 900, 190);
  x.shadowColor = "rgba(0,0,0,0.25)";
  x.shadowBlur = 16;
  for (const o of [512, 1536]) x.fillText(br.name, o, 290);
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.004, R * 1.004, H * 0.62, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: canvasTexture(THREE, c), metalness: 0.25, roughness: 0.35 })
  );
  label.position.y = H * 0.48;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, H * 0.012, 40), new THREE.MeshStandardMaterial({ color: "#e6ebf2", metalness: 0.9, roughness: 0.22 }));
  lid.position.y = H * 0.992;
  const tab = new THREE.Mesh(new THREE.TorusGeometry(R * 0.16, R * 0.04, 8, 20), lid.material);
  tab.rotation.x = Math.PI / 2;
  tab.position.set(0, H * 1, R * 0.25);
  g.add(body, label, lid, tab);
  return g;
}
function makeTrophy(THREE, H, pal, br) {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: pal.secondary, metalness: 0.75, roughness: 0.22 });
  const cupPts = [[0, 0.44], [0.07, 0.45], [0.2, 0.5], [0.29, 0.58], [0.34, 0.7], [0.36, 0.84], [0.37, 1], [0.33, 1], [0.32, 0.85], [0.3, 0.72], [0.25, 0.62], [0, 0.58]].map(([x2, y]) => new THREE.Vector2(x2 * H, y * H));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(cupPts, 48), gold);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.045, H * 0.1, H * 0.22, 24), gold);
  stem.position.y = H * 0.33;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(H * 0.07, 20, 12), gold);
  knob.position.y = H * 0.41;
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(H * 0.09, 0), new THREE.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.8, flatShading: true }));
  star.position.set(0, H * 0.78, H * 0.35);
  g.add(knob, star);
  for (const s of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(H * 0.1, H * 0.022, 10, 24, Math.PI * 1.2), gold);
    handle.position.set(s * H * 0.33, H * 0.8, 0);
    handle.rotation.z = s > 0 ? -Math.PI * 0.6 : Math.PI * 1.6;
    g.add(handle);
  }
  const plate = document.createElement("canvas");
  plate.width = 1024;
  plate.height = 256;
  const x = plate.getContext("2d");
  x.fillStyle = pal.primary;
  x.fillRect(0, 0, 1024, 256);
  x.fillStyle = readableOn(pal.primary, pal.text);
  x.textAlign = "center";
  x.textBaseline = "middle";
  fitText(x, br.name, 900, 130);
  x.fillText(br.name, 512, 136);
  const baseMat = new THREE.MeshStandardMaterial({ color: pal.primary, roughness: 0.4 });
  const front = new THREE.MeshStandardMaterial({ map: canvasTexture(THREE, plate), roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(H * 0.5, H * 0.22, H * 0.5), [baseMat, baseMat, baseMat, baseMat, front, baseMat]);
  base.position.y = H * 0.11;
  g.add(cup, stem, base);
  return g;
}
function noHero(THREE) {
  return { root: new THREE.Group(), mixer: null, clips: [], actions: {}, source: "none", heightM: 0, none: true, playing: null, play() {
  }, update() {
  } };
}
function makeHero(THREE, m, gltf, pal, { pedestal = true, heightM } = {}) {
  const hero = m.round.hero;
  const H = heightM ?? hero.heightM;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  let mixer = null, clips = [], current = null;
  const actions = {};
  if (gltf?.scene) {
    body.add(normalize(THREE, gltf.scene, H));
    clips = gltf.animations || [];
    if (clips.length) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      for (const k of ["idle", "intro", "celebrate"]) {
        const clip = findClip(clips, hero.animations?.[k]) || (k === "idle" ? findClip(clips, "idle") : null);
        if (clip) actions[k] = mixer.clipAction(clip);
      }
      if (!actions.idle && clips.length === 1) actions.idle = mixer.clipAction(clips[0]);
    }
  } else {
    const fb = { ...pal, primary: hex(hero.fallbackColor, pal.primary) };
    const prod = DRINK.test(`${m.brand.name} ${m.brand.tagline} ${m.concept?.title ?? ""}`) ? makeCan(THREE, H, fb, m.brand) : makeTrophy(THREE, H, fb, m.brand);
    prod.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    body.add(prod);
  }
  if (pedestal) {
    const pr = Math.max(1.2, H * 0.36), ph = gltf?.scene ? 0.06 : 0.45;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(pr, pr * 1.06, ph, 40), new THREE.MeshStandardMaterial({ color: pal.background, roughness: 0.5 }));
    ped.position.y = ph / 2;
    ped.receiveShadow = true;
    ped.castShadow = !gltf?.scene;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(pr * 1.02, 0.07, 8, 64), new THREE.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 1.2 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = ph;
    root.add(ped, rim);
    body.position.y = ph;
  }
  const baseY = body.position.y;
  const procedural = !mixer;
  let mode = "idle", t = 0, spin = 0;
  const fade = (next) => {
    if (!mixer) return;
    const a = actions[next] || actions.idle;
    if (!a || a === current) return;
    a.reset();
    if (next !== "idle" && actions[next]) {
      a.setLoop(next === "intro" ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      a.clampWhenFinished = true;
    }
    a.fadeIn(0.25).play();
    current?.fadeOut(0.25);
    current = a;
  };
  if (mixer) mixer.addEventListener("finished", (e) => {
    if (e.action === actions.intro && mode === "intro") {
      mode = "idle";
      fade("idle");
    }
  });
  return {
    root,
    mixer,
    clips,
    actions,
    source: gltf?.scene ? "model" : "fallback",
    heightM: H,
    get playing() {
      return current?.getClip().name ?? (procedural ? `procedural:${mode}` : null);
    },
    play(kind) {
      mode = kind;
      t = 0;
      if (mixer) fade(kind);
    },
    update(dt) {
      t += dt;
      mixer?.update(dt);
      if (hero.spin) spin += dt * 0.5;
      let y = 0, s = 1, ry = spin;
      if (mode === "intro") {
        const k = Math.min(1, t / 1.1);
        s = k < 1 ? 1 - Math.pow(1 - k, 3) * Math.cos(k * 9) : 1;
        ry += (1 - k) * Math.PI * 2;
        if (k >= 1 && procedural) mode = "idle";
      }
      if (procedural && mode === "idle") {
        y = Math.sin(t * 1.6) * 0.08 * H * 0.25;
        ry += Math.sin(t * 0.7) * 0.18;
      }
      if (procedural && mode === "celebrate") {
        y = Math.abs(Math.sin(t * 5)) * H * 0.12;
        ry += t * 3;
      }
      body.position.y = baseY + y;
      body.scale.setScalar(Math.max(1e-3, s));
      body.rotation.y = ry;
    }
  };
}
function collectibleFactory(THREE, m, gltf, pal) {
  const c = m.round.collectible, H = c.heightM;
  const color = hex(c.fallbackColor, pal.accent);
  let template;
  if (gltf?.scene) template = normalize(THREE, gltf.scene.clone(true), H);
  else {
    template = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(0.5, 0);
    geo.scale(0.8, 1, 0.8);
    const gem = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, flatShading: true, metalness: 0.15, roughness: 0.12 }));
    gem.scale.setScalar(H);
    gem.position.y = H / 2;
    gem.castShadow = true;
    const coreGeo = new THREE.OctahedronGeometry(0.22, 0);
    const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    core.scale.setScalar(H);
    core.position.y = H / 2;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.42 * H, 0.035 * H, 6, 24), new THREE.MeshStandardMaterial({ color: pal.secondary, metalness: 0.6, roughness: 0.25, emissive: pal.secondary, emissiveIntensity: 0.25 }));
    band.rotation.x = Math.PI / 2;
    band.position.y = H / 2;
    template.add(gem, core, band);
  }
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTexture(THREE, color, true), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55, toneMapped: false });
  const glowGeo = new THREE.PlaneGeometry(1, 1);
  glowGeo.rotateX(-Math.PI / 2);
  return {
    color,
    make() {
      const g = new THREE.Group();
      const body = template.clone(true);
      g.add(body);
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.scale.setScalar(Math.max(1.6, H * 2));
      glow.position.y = 0.03;
      glow.renderOrder = 2;
      g.add(glow);
      g.userData = { body, glow, phase: Math.random() * 6 };
      return g;
    },
    dispose() {
      disposeTree(template);
      glowGeo.dispose();
      glowMat.map.dispose();
      glowMat.dispose();
    }
  };
}
function makeBanner(THREE, b, tex, m, pal, logoImg) {
  const w = Math.max(1, +b.widthM || 6);
  let map = tex, aspect = 2.4;
  if (tex?.image?.width) aspect = tex.image.width / tex.image.height;
  else map = canvasTexture(THREE, bannerCanvas(m.brand, pal, logoImg, aspect));
  const h = w / aspect;
  const g = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
  panel.position.z = 0.15;
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, h + 0.5, 0.2), new THREE.MeshStandardMaterial({ color: pal.primary, roughness: 0.45 }));
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.06), new THREE.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.6 }));
  trim.position.z = 0.11;
  back.castShadow = true;
  const rear = new THREE.Mesh(panel.geometry, panel.material);
  rear.rotation.y = Math.PI;
  rear.position.z = -0.11;
  g.add(back, trim, panel, rear);
  const pos = Array.isArray(b.position) ? b.position : [0, 4, -14];
  const bottom = pos[1] - h / 2 - 0.25;
  if (bottom > 0.2) {
    const postMat = new THREE.MeshStandardMaterial({ color: pal.secondary, roughness: 0.4, metalness: 0.2 });
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, bottom, 10), postMat);
      post.position.set(s * w * 0.38, -h / 2 - 0.25 - bottom / 2, -0.05);
      post.castShadow = true;
      g.add(post);
    }
  }
  g.position.set(pos[0], pos[1], pos[2]);
  return { group: g, panel, lookAtCenter: b.lookAtCenter !== false };
}
function decor(THREE, kind, R, pal) {
  const g = new THREE.Group();
  const prim = new THREE.MeshStandardMaterial({ color: pal.primary, roughness: 0.4, flatShading: true });
  const sec = new THREE.MeshStandardMaterial({ color: pal.secondary, roughness: 0.35, metalness: 0.2 });
  const glow = new THREE.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 1.4 });
  const spin = [];
  if (kind === "pillars") {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + 0.31, h = i % 2 ? 4.2 : 6;
      const p = new THREE.Group();
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, h, 8), prim);
      col.position.y = h / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.4), sec);
      cap.position.y = h + 0.15;
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), glow);
      orb.position.y = h + 0.8;
      col.castShadow = cap.castShadow = true;
      p.add(col, cap, orb);
      p.position.set(Math.cos(a) * (R + 0.9), 0, Math.sin(a) * (R + 0.9));
      g.add(p);
    }
  } else if (kind === "rings") {
    const mats = [prim, sec, glow];
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2, d = R * (0.95 + i % 3 * 0.25);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i % 3 * 0.7, 0.22, 10, 36), mats[i % 3]);
      ring.position.set(Math.cos(a) * d, 6 + i % 4 * 2.2, Math.sin(a) * d);
      ring.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      ring.castShadow = true;
      spin.push(ring);
      g.add(ring);
    }
    const bub = new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.accent).lerp(new THREE.Color("#ffffff"), 0.5), transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.3, depthWrite: false });
    const bubGeo = new THREE.SphereGeometry(1, 16, 10);
    for (let i = 0; i < 18; i++) {
      const s = new THREE.Mesh(bubGeo, bub);
      s.scale.setScalar(0.15 + Math.random() * 0.3);
      const a = Math.random() * Math.PI * 2, d = R * (0.4 + Math.random() * 0.9);
      s.position.set(Math.cos(a) * d, 2 + Math.random() * 12, Math.sin(a) * d);
      s.userData.rise = 0.4 + Math.random() * 0.8;
      spin.push(s);
      g.add(s);
    }
  } else if (kind === "crystals") {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + 0.2;
      const cl = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const geo = new THREE.OctahedronGeometry(0.6, 0);
        geo.scale(0.6, 2.4 + k * 0.4, 0.6);
        const c = new THREE.Mesh(geo, k % 2 ? glow : prim);
        c.position.set((k - 1.5) * 0.6, 1.2 + k * 0.2, k % 2 * 0.5);
        c.rotation.set((k - 1.5) * 0.25, k, (k - 1.5) * 0.2);
        c.castShadow = true;
        cl.add(c);
      }
      cl.position.set(Math.cos(a) * (R + 1), 0, Math.sin(a) * (R + 1));
      g.add(cl);
    }
  }
  let t = 0;
  return {
    group: g,
    update(dt) {
      t += dt;
      for (const o of spin) {
        if (o.userData.rise) {
          o.position.y += o.userData.rise * dt;
          if (o.position.y > 16) o.position.y = 1;
        } else {
          o.rotation.y += dt * 0.4;
          o.position.y += Math.sin(t + o.position.x) * 4e-3;
        }
      }
    }
  };
}
function buildArena(THREE, m, A, pal, center) {
  const a = m.round.arena, R = a.radius;
  const group = new THREE.Group();
  group.name = "SpatialAdsArena";
  group.position.copy(center);
  let topMat;
  if (A.groundTex) {
    A.groundTex.wrapS = A.groundTex.wrapT = THREE.RepeatWrapping;
    A.groundTex.repeat.set(R / 3, R / 3);
    A.groundTex.colorSpace = THREE.SRGBColorSpace;
    topMat = new THREE.MeshStandardMaterial({ map: A.groundTex, roughness: 0.85 });
  } else topMat = new THREE.MeshStandardMaterial({ map: canvasTexture(THREE, groundCanvas(m, pal, A.logoImg)), roughness: 0.8 });
  const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(a.groundAccent).lerp(new THREE.Color(pal.background), 0.45), roughness: 0.7, flatShading: true });
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.6, R + 0.9, 1.2, 72), [side, topMat, side]);
  ground.position.y = -0.6;
  ground.receiveShadow = true;
  const under2 = new THREE.Mesh(new THREE.ConeGeometry(R + 0.9, R * 0.9, 24, 1), new THREE.MeshStandardMaterial({ color: pal.background, roughness: 0.8, flatShading: true }));
  under2.rotation.x = Math.PI;
  under2.position.y = -1.2 - R * 0.45;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.35, 0.16, 8, 120), new THREE.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 1.5 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  group.add(ground, under2, rim, gradientSky(THREE, a.skyTop, a.skyBottom, 320));
  const li = a.lightIntensity;
  const hemi = new THREE.HemisphereLight(new THREE.Color(a.skyTop).lerp(new THREE.Color("#ffffff"), 0.6), new THREE.Color(a.groundColor), 0.85 * li);
  const sun = new THREE.DirectionalLight("#fff4e6", 2.1 * li);
  sun.position.set(R * 0.8, R * 1.6, R * 1.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -R - 4, right: R + 4, top: R + 4, bottom: -R - 4, near: 1, far: R * 5 });
  sun.shadow.bias = -4e-4;
  sun.shadow.normalBias = 0.03;
  group.add(hemi, sun, sun.target);
  const dec = decor(THREE, a.decor, R, pal);
  group.add(dec.group);
  const banners = (m.round.banners || []).map((b, i) => {
    const bn = makeBanner(THREE, b, A.bannerTex[i], m, pal, A.logoImg);
    const bp = bn.group.position, d = Math.hypot(bp.x, bp.z), minR = R + 1.2;
    if (d < minR) {
      if (d < 1e-3) bp.set(0, bp.y, -minR);
      else {
        bp.x *= minR / d;
        bp.z *= minR / d;
      }
    }
    group.add(bn.group);
    if (bn.lookAtCenter) bn.group.lookAt(center.x, center.y + bn.group.position.y, center.z);
    return bn;
  });
  const hero = m.round.hero.none ? noHero(THREE) : makeHero(THREE, m, A.heroGltf, pal, { pedestal: true });
  hero.play("idle");
  const hp = m.round.hero.position;
  hero.root.position.set(hp[0], hp[1], hp[2]);
  hero.root.lookAt(center.x, center.y + hp[1], center.z);
  group.add(hero.root);
  const sparkMat = new THREE.SpriteMaterial({ map: glowTexture(THREE, pal.accent), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const sparks = [];
  for (let i = 0; i < (m.round.hero.none ? 0 : 18); i++) {
    const s = new THREE.Sprite(sparkMat);
    s.userData = { a: Math.random() * 6, r: hero.heightM * 0.45 + Math.random() * 1.6, y: Math.random() * hero.heightM * 1.3, v: 0.5 + Math.random() };
    s.scale.setScalar(0.18 + Math.random() * 0.22);
    hero.root.add(s);
    sparks.push(s);
  }
  const fog = new THREE.FogExp2(a.fogColor, a.fogDensity);
  const bg = new THREE.Color(a.skyBottom);
  group.visible = false;
  group.updateMatrixWorld(true);
  return {
    group,
    hero,
    banners,
    fog,
    bg,
    update(dt) {
      dec.update(dt);
      hero.update(dt);
      for (const s of sparks) {
        const u = s.userData;
        u.y += u.v * dt;
        u.a += dt * 0.6;
        if (u.y > hero.heightM * 1.4) u.y = 0.2;
        s.position.set(Math.cos(u.a) * u.r, u.y, Math.sin(u.a) * u.r);
      }
      rim.material.emissiveIntensity = 1.2 + Math.sin(performance.now() / 300) * 0.4;
    }
  };
}
function sponsoredTag(THREE, brandName) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 112;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(16,14,30,0.78)";
  g.beginPath();
  g.roundRect ? g.roundRect(4, 4, 504, 104, 52) : g.rect(4, 4, 504, 104);
  g.fill();
  g.fillStyle = "#ffffff";
  g.textBaseline = "middle";
  g.textAlign = "center";
  const label = `AD${brandName ? " \xB7 " + String(brandName).toUpperCase() : ""}`;
  let size = 46;
  do {
    g.font = `800 ${size}px system-ui, -apple-system, sans-serif`;
    size -= 2;
  } while (g.measureText(label).width > 450 && size > 18);
  g.fillText(label, 256, 58);
  const mat = new THREE.MeshBasicMaterial({ map: canvasTexture(THREE, c), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 112 / 512), mat);
  mesh.renderOrder = 3;
  return mesh;
}
function buildInWorld(THREE, m, A, pal, statueGltf) {
  const iw = m.inWorld, H = Math.max(1.5, +iw.heightM || 4.5);
  const g = new THREE.Group();
  g.name = "SpatialAdsInWorld";
  const p = Array.isArray(iw.position) ? iw.position : [12, 0, -6];
  g.position.set(p[0], p[1], p[2]);
  g.rotation.y = +iw.rotationY || 0;
  const prim = new THREE.MeshStandardMaterial({ color: pal.primary, roughness: 0.4 });
  const sec = new THREE.MeshStandardMaterial({ color: pal.secondary, roughness: 0.35, metalness: 0.25 });
  const glowM = new THREE.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 1.3 });
  const bannerTex = A.bannerTex.find(Boolean) || null;
  const targets = [];
  let hero = null, portal = null, t = 0, teaser = null;
  let kind = ["portal_arch", "statue", "billboard"].includes(iw.kind) ? iw.kind : "portal_arch";
  if (kind === "statue" && m.round.hero.none) kind = "billboard";
  if (kind === "portal_arch") {
    const W = H * 0.9, legH = H - W / 2;
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, legH, 0.55), prim);
      leg.position.set(s * W / 2, legH / 2, 0);
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.6), sec);
      band.position.set(s * W / 2, legH * 0.35, 0);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.85), sec);
      foot.position.set(s * W / 2, 0.15, 0);
      leg.castShadow = foot.castShadow = true;
      g.add(leg, band, foot);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(W / 2, 0.3, 10, 32, Math.PI), prim);
    arch.position.y = legH;
    arch.castShadow = true;
    const inner = new THREE.Mesh(new THREE.TorusGeometry(W / 2 - 0.3, 0.08, 8, 32, Math.PI), glowM);
    inner.position.y = legH;
    g.add(arch, inner);
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, "#ffffff");
    gr.addColorStop(0.3, pal.accent);
    gr.addColorStop(0.7, pal.primary);
    gr.addColorStop(1, pal.primary + "00");
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
    x.strokeStyle = "rgba(255,255,255,0.35)";
    x.lineWidth = 6;
    for (let i = 0; i < 6; i++) {
      x.beginPath();
      x.arc(128, 128, 20 + i * 18, i, i + 3.6);
      x.stroke();
    }
    const shape = new THREE.Shape();
    const r4 = W / 2 - 0.35;
    shape.moveTo(-r4, 0);
    shape.lineTo(-r4, legH);
    shape.absarc(0, legH, r4, Math.PI, 0, true);
    shape.lineTo(r4, 0);
    shape.lineTo(-r4, 0);
    const pgeo = new THREE.ShapeGeometry(shape, 24);
    const uv = pgeo.attributes.uv, pos = pgeo.attributes.position;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + r4) / (2 * r4), pos.getY(i) / (legH + r4));
    const tex = canvasTexture(THREE, c);
    tex.center.set(0.5, 0.5);
    portal = new THREE.Mesh(pgeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    g.add(portal);
    const sw = W * 1.05;
    const sign = makeBanner(THREE, { widthM: sw, position: [0, 0, 0] }, bannerTex, m, pal, A.logoImg);
    const sh = sw / (bannerTex?.image?.width ? bannerTex.image.width / bannerTex.image.height : 2.4);
    sign.group.position.set(0, H + sh / 2 + 0.35, 0);
    g.add(sign.group);
    targets.push(sign.panel, portal);
    teaser = collectibleFactory(THREE, m, A.collectibleGltf, pal);
    const tz = teaser.make();
    tz.userData.glow.visible = false;
    tz.position.y = legH * 0.55;
    tz.scale.setScalar(1.2);
    g.add(tz);
    teaser.obj = tz;
  } else if (kind === "statue") {
    const pedH = Math.min(1.2, H * 0.22);
    hero = makeHero(THREE, m, statueGltf, pal, { pedestal: false, heightM: H - pedH });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.32, H * 0.36, pedH, 32), prim);
    ped.position.y = pedH / 2;
    ped.castShadow = ped.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(H * 0.33, 0.06, 8, 48), glowM);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = pedH;
    const plateC = logoCanvas(m.brand, pal, A.logoImg);
    const plate = new THREE.Mesh(new THREE.CircleGeometry(pedH * 0.38, 32), new THREE.MeshBasicMaterial({ map: canvasTexture(THREE, plateC), transparent: true, toneMapped: false }));
    plate.position.set(0, pedH / 2, H * 0.36 * 0.97 + 0.02);
    hero.root.position.y = pedH;
    g.add(ped, ring, plate, hero.root);
    targets.push(hero.root, ped);
  } else {
    const bw = H * 1.5;
    const bn = makeBanner(THREE, { widthM: bw, position: [0, 0, 0] }, bannerTex, m, pal, A.logoImg);
    const bh = bw / (bannerTex?.image?.width ? bannerTex.image.width / bannerTex.image.height : 2.4);
    const legH = Math.max(0.6, H - bh);
    bn.group.position.y = legH + bh / 2;
    var tagAt = [0, legH + 0.02, 0.32];
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, legH + 0.2, 10), sec);
      post.position.set(s * bw * 0.36, (legH + 0.2) / 2, -0.12);
      post.castShadow = true;
      g.add(post);
    }
    g.add(bn.group);
    targets.push(bn.panel);
  }
  const tagM = sponsoredTag(THREE, m.brand.name);
  const tagW = clampN(H * 0.32, 0.7, 1.6);
  tagM.scale.setScalar(tagW);
  if (kind === "portal_arch") tagM.position.set(H * 0.45 + 0.05, 0.42, 0.34);
  else if (kind === "statue") tagM.position.set(0, Math.min(1.2, H * 0.22) * 0.18 + 0.05, H * 0.36 + 0.06);
  else tagM.position.set(...tagAt);
  tagM.name = "sponsored-tag";
  g.add(tagM);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(H * 0.75, 40), new THREE.MeshBasicMaterial({ map: glowTexture(THREE, pal.accent), transparent: true, depthWrite: false, opacity: 0.55, blending: THREE.AdditiveBlending }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;
  g.add(halo);
  g.traverse((o) => {
    if (o.isMesh && o !== portal && o !== halo) o.castShadow = true;
  });
  hero?.play("idle");
  return {
    group: g,
    targets,
    kind,
    update(dt) {
      t += dt;
      hero?.update(dt);
      if (portal) {
        portal.material.map.rotation = t * 0.6;
        portal.material.opacity = 0.78 + Math.sin(t * 2) * 0.1;
      }
      if (teaser?.obj) {
        teaser.obj.rotation.y = t * 1.5;
        teaser.obj.position.y = (H - H * 0.45) * 0.55 + Math.sin(t * 2) * 0.15;
      }
      halo.material.opacity = 0.45 + Math.sin(t * 1.5) * 0.12;
    },
    dispose() {
      teaser?.dispose();
      disposeTree(g);
    }
  };
}
var isHex, hex, readableOn, initials, brand, DRINK, clampN;
var init_builders = __esm({
  "../../sdk/builders.js"() {
    isHex = (v) => typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
    hex = (v, fb) => isHex(v) ? v : fb;
    readableOn = (bg, preferred) => {
      const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
      if (preferred && ratio(bg, preferred) >= 3) return preferred;
      return ratio(bg, "#ffffff") >= ratio(bg, "#1b1530") ? "#ffffff" : "#1b1530";
    };
    initials = (name) => String(name || "Ad").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    brand = (m) => m.brand.name || "Sponsored";
    DRINK = /soda|drink|cola|juice|beer|water|energy|coffee|tea|pop|fizz|brew|sparkl|lemon/i;
    clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  }
});

// ../../sdk/audio.js
function unlockAudio() {
  gestured = true;
  ac();
}
function ac() {
  if (!gestured) return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {
  });
  return ctx;
}
function blip(freqs, vol, step = 0.09, type = "triangle") {
  const c = ac();
  if (!c || c.state !== "running") return;
  freqs.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * step;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18 * vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(1e-4, t + 0.22);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.25);
  });
}
function tickSound(vol = 1, last = false) {
  blip(last ? [988, 1319] : [1175], 0.45 * vol, 0.07, "sine");
}
function createAudio(urls, volume = 0.5) {
  const status = { music: urls.music ? "loading" : "fallback" };
  const sfx = {};
  const mk = (url, key) => {
    const a = new Audio();
    a.preload = "auto";
    a.addEventListener("canplaythrough", () => {
      status[key] = "loaded";
    }, { once: true });
    a.addEventListener("error", () => {
      status[key] = "error";
    }, { once: true });
    a.src = url;
    return a;
  };
  const music = urls.music ? mk(urls.music, "music") : null;
  if (music) music.loop = true;
  for (const k of ["collect", "start", "win"]) {
    status[k] = urls.sfx?.[k] ? "loading" : "fallback";
    if (urls.sfx?.[k]) sfx[k] = mk(urls.sfx[k], k);
  }
  const vo = { duckTo: Number.isFinite(urls.voiceover?.duckTo) ? urls.voiceover.duckTo : 0.3, tracks: [], current: null, queued: null };
  status.voiceover = urls.voiceover?.tracks?.length ? "loading" : "fallback";
  for (const t of urls.voiceover?.tracks || []) {
    if (!t?.url) continue;
    const a = mk(t.url, `vo_${t.seconds || vo.tracks.length}`);
    a.addEventListener("canplaythrough", () => {
      status.voiceover = "loaded";
    }, { once: true });
    vo.tracks.push({ ...t, a, durationSec: Number.isFinite(+t.durationSec) ? +t.durationSec : +t.seconds || 0 });
  }
  let duck = 1;
  const musicVol = () => Math.min(1, volume * duck);
  const duckTo = (target, ms = 350) => {
    const from = duck, t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      duck = from + (target - from) * k;
      if (music && !music.paused && !fadeTimer) music.volume = musicVol();
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  };
  let synthTimer = 0, wantMusic = false, fadeTimer = 0;
  const synthMusic = () => {
    const seq = [392, 494, 587, 494, 440, 523, 659, 523];
    let i = 0;
    clearInterval(synthTimer);
    synthTimer = setInterval(() => blip([seq[i++ % seq.length]], volume * 0.35 * duck, 0.05, "sine"), 240);
  };
  return {
    status,
    startMusic() {
      wantMusic = true;
      clearInterval(fadeTimer);
      if (music && status.music !== "error") {
        music.volume = musicVol();
        music.currentTime = 0;
        music.play().catch(() => {
        });
      } else synthMusic();
    },
    stopMusic() {
      wantMusic = false;
      clearInterval(synthTimer);
      if (!music) return;
      clearInterval(fadeTimer);
      fadeTimer = setInterval(() => {
        music.volume = Math.max(0, music.volume - volume / 10);
        if (music.volume <= 1e-3) {
          music.pause();
          clearInterval(fadeTimer);
          fadeTimer = 0;
        }
      }, 50);
    },
    setVolume(v) {
      volume = v;
      if (music && !music.paused) music.volume = musicVol();
      if (vo.current) vo.current.a.volume = Math.min(1, v * 1.6);
    },
    unlock() {
      ac();
      if (wantMusic && music && music.paused && status.music !== "error") music.play().catch(() => {
      });
      const q = vo.queued;
      if (q) {
        vo.queued = null;
        const offset = (performance.now() - q.at) / 1e3;
        if (offset < q.track.durationSec - 0.5) {
          try {
            q.track.a.currentTime = offset;
          } catch {
          }
          q.track.a.play().then(() => duckTo(vo.duckTo), () => {
          });
        }
      }
    },
    /** the longest voice-over track whose duration fits `secondsLeft` (null when none fits or none exist) */
    pickVoiceover(secondsLeft) {
      const fit = vo.tracks.filter((t) => t.durationSec > 0 && t.durationSec <= secondsLeft - 0.3);
      return fit.sort((a, b) => b.durationSec - a.durationSec)[0] || null;
    },
    /** plays the track (muted → silent, captions are the caller's job); returns 'playing' | 'queued' | 'muted' */
    playVoiceover(track) {
      this.stopVoiceover();
      if (!track) return null;
      vo.current = track;
      const a = track.a;
      a.onended = () => {
        if (vo.current === track) {
          vo.current = null;
          duckTo(1, 600);
        }
      };
      if (volume <= 0) return "muted";
      a.volume = Math.min(1, volume * 1.6);
      try {
        a.currentTime = 0;
      } catch {
      }
      duckTo(vo.duckTo);
      const at = performance.now();
      a.play().catch(() => {
        vo.queued = { track, at };
        duck = 1;
        if (music && !music.paused) music.volume = musicVol();
      });
      return "playing";
    },
    stopVoiceover() {
      vo.queued = null;
      if (vo.current) {
        vo.current.a.pause();
        vo.current.a.onended = null;
        vo.current = null;
      }
      duckTo(1, 400);
    },
    get voiceover() {
      return vo.current ? { seconds: vo.current.seconds, durationSec: vo.current.durationSec, queued: !!vo.queued } : null;
    },
    play(name) {
      const a = sfx[name];
      if (a && status[name] !== "error") {
        const c = a.cloneNode();
        c.volume = Math.min(1, volume * 1.4);
        c.play().catch(() => {
        });
      } else blip(NOTES[name] || [660], volume);
    },
    dispose() {
      clearInterval(synthTimer);
      clearInterval(fadeTimer);
      for (const a of [music, ...Object.values(sfx), ...vo.tracks.map((t) => t.a)]) if (a) {
        a.pause();
        a.removeAttribute("src");
        a.load();
      }
    }
  };
}
var NOTES, ctx, gestured;
var init_audio = __esm({
  "../../sdk/audio.js"() {
    NOTES = { collect: [880, 1320], start: [523, 659, 784], win: [523, 659, 784, 1047], shoot: [520, 392] };
    ctx = null;
    gestured = false;
  }
});

// ../../sdk/countdown.js
function resolveCountdownSec({ config, publisher, manifest, trigger, userInitiated } = {}) {
  const c = num(config);
  if (c !== null && c <= 0) return 0;
  const p = num(publisher);
  let s = c !== null ? clamp(Math.round(c), 1, MAX_SEC) : p !== null && p > 0 ? clamp(Math.round(p), 3, MAX_SEC) : DEFAULT_COUNTDOWN_SEC;
  const m = num(manifest);
  if (m !== null && m > s) s = clamp(Math.round(m), s, MAX_SEC);
  if (trigger === "rewarded" || userInitiated) s = Math.min(s, USER_COUNTDOWN_SEC);
  return s;
}
function normDock(d) {
  const s = String(d || "").toLowerCase();
  if (!s) return null;
  if (s === "top" || s === "top-center" || s === "center") return "top-center";
  if (s === "right" || s === "top-right") return "top-right";
  if (s === "left" || s === "top-left") return "top-left";
  if (s === "bl" || s === "bottom-left") return "bottom-left";
  if (s === "br" || s === "bottom-right") return "bottom-right";
  return null;
}
function stageRect() {
  const vw = innerWidth, vh = innerHeight;
  let best = null, area = 0;
  for (const c of document.querySelectorAll("canvas")) {
    const r4 = c.getBoundingClientRect();
    const x0 = Math.max(0, r4.left), y0 = Math.max(0, r4.top), x1 = Math.min(vw, r4.right), y1 = Math.min(vh, r4.bottom);
    const a = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
    if (a > area) {
      area = a;
      best = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
  }
  if (!best || area < vw * vh * 0.2 || area > vw * vh * 0.6) return { x: 0, y: 0, w: vw, h: vh };
  return best;
}
function zoneRect(z, st, w, h, m) {
  const x = z === "top-left" || z === "bottom-left" ? st.x + m : z === "top-center" ? st.x + (st.w - w) / 2 : st.x + st.w - w - m;
  const y = z.startsWith("bottom") ? st.y + st.h - h - m : st.y + m;
  return { x, y, w, h };
}
function domBoxes(touch = false, live = false) {
  const out = [], vw = innerWidth, vh = innerHeight;
  const all = document.body ? document.body.getElementsByTagName("*") : [];
  for (let i = 0, n = Math.min(all.length, 4e3); i < n; i++) {
    const el = all[i];
    if (SKIP_TAGS.has(el.tagName) || el.ownerSVGElement) continue;
    const r4 = el.getBoundingClientRect();
    if (r4.width < 6 || r4.height < 6 || r4.right <= 0 || r4.bottom <= 0 || r4.left >= vw || r4.top >= vh || r4.width * r4.height > vw * vh * 0.35) continue;
    let content = /^(IMG|VIDEO|BUTTON|INPUT|SELECT|TEXTAREA|svg|PROGRESS)$/.test(el.tagName);
    if (!content) {
      for (const c of el.childNodes) if (c.nodeType === 3 && c.textContent.trim()) {
        content = true;
        break;
      }
    }
    if (!content) {
      const cs = getComputedStyle(el);
      content = cs.backgroundImage !== "none" || !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor);
    }
    if (!content || el.closest(OURS)) continue;
    if (touch && !live && el.closest("[data-br-touch]")) continue;
    const fadingIn = touch && el.getAnimations?.().some((a) => a.playState === "running" || a.playState === "pending");
    if (el.checkVisibility ? !el.checkVisibility({ opacityProperty: !fadingIn, visibilityProperty: true }) : getComputedStyle(el).visibility === "hidden") continue;
    out.push({ x: r4.left, y: r4.top, w: r4.width, h: r4.height });
  }
  return out;
}
function pickDock({ dock, hudDock, hud, w = 260, h = 64, margin = 14, live = false } = {}) {
  const st = stageRect();
  const forced = normDock(dock);
  const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const order = [...new Set([forced, normDock(hudDock), ...ZONES].filter(Boolean))];
  const occ = (Array.isArray(hud?.occupied) ? hud.occupied : []).filter((o) => Array.isArray(o?.rect) && !o.transient).map(({ rect: [x, y, rw, rh] }) => ({ x: x * innerWidth, y: y * innerHeight, w: rw * innerWidth, h: rh * innerHeight }));
  let boxes = [];
  try {
    boxes = domBoxes(touch, live);
  } catch {
  }
  const all = [...occ, ...boxes];
  const coverOf = (z, rect) => {
    let c = Number(hud?.dockOverlap?.[z]) || 0;
    for (const bx of all) c += overlap(rect, bx) / (w * h);
    return c;
  };
  let best = null;
  for (const z of order) {
    const rect = zoneRect(z, st, w, h, margin), cover = coverOf(z, rect);
    if (cover < 0.04) {
      const why = z === forced ? "explicit" : z === order[0] && hudDock ? "hudDock" : "clear";
      const hit = cover > 0 ? all.filter((bx) => overlap(rect, bx) > 0) : [];
      if (hit.length && z !== "top-center") {
        const top = z.startsWith("top"), r22 = { ...rect, y: top ? Math.max(...hit.map((bx) => bx.y + bx.h)) + 8 : Math.min(...hit.map((bx) => bx.y)) - h - 8 };
        if (r22.y >= st.y && r22.y + h <= st.y + st.h && coverOf(null, r22) === 0) return { dock: z, rect: r22, why };
      }
      return { dock: z, rect, why };
    }
    if (!best || cover < best.cover) best = { dock: z, rect, cover, why: "least-covered" };
  }
  for (const z of order) {
    if (z === "top-center") continue;
    const top = z.startsWith("top"), rect = zoneRect(z, st, w, h, margin);
    for (let i = 0; i < 4; i++) {
      const hit = all.filter((bx) => overlap(rect, bx) > 0);
      if (!hit.length) break;
      rect.y = top ? Math.max(...hit.map((bx) => bx.y + bx.h)) + 8 : Math.min(...hit.map((bx) => bx.y)) - h - 8;
    }
    const inBand = top ? rect.y + h <= st.y + st.h * 0.45 : rect.y >= st.y + st.h * 0.55;
    if (inBand && coverOf(null, rect) < 0.04) return { dock: z, rect, why: "slid" };
  }
  return best || { dock: "top-right", rect: zoneRect("top-right", st, w, h, margin), why: "default" };
}
function hexOk(c) {
  return typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c) ? c : null;
}
function note(rec) {
  history.push(rec);
  if (history.length > 20) history.shift();
}
function showCountdown(o = {}) {
  if (typeof document === "undefined" || !document.documentElement) return done0({ completed: true, reason: "no_dom", seconds: 0 });
  if (isNum(o.startsAt)) {
    const end = +o.startsAt - (isNum(o.clockOffset) ? +o.clockOffset : 0), left = end - Date.now();
    if (left < 400) return done0({ completed: true, reason: "late", seconds: 0 });
    const sec = num(o.seconds) > 0 ? clamp(num(o.seconds), 1, MAX_SEC) : Math.max(1, Math.round(left / 1e3));
    return showCard(o, "synced", end, sec);
  }
  const want = num(o.seconds) === null ? DEFAULT_COUNTDOWN_SEC : clamp(num(o.seconds), 0, MAX_SEC);
  if (isNum(o.endsAt)) return fixedCountdown(o, want);
  if (!(want > 0)) return done0({ completed: true, reason: "disabled", seconds: 0 });
  return showCard(o, "local", Date.now() + want * 1e3, want);
}
function fixedCountdown(o, want) {
  const live = o.live === true;
  const clampEnd = (v) => live ? toEpochMs(v) : Math.max(toEpochMs(v), Date.now() + MIN_FIXED_MS);
  let end = clampEnd(o.endsAt), settled = false, inner = null, resolve, t = 0;
  const p = new Promise((r4) => {
    resolve = r4;
  });
  const lead = () => want > 0 ? Math.min(want * 1e3, end - Date.now()) : 0;
  const off = () => {
    clearTimeout(t);
    document.removeEventListener("visibilitychange", onVis);
    if (active === h) active = null;
  };
  const stop = (reason, ok = false) => {
    if (settled) return false;
    settled = true;
    off();
    resolve({ completed: ok, reason, seconds: 0, mode: "fixed" });
    return true;
  };
  const onVis = () => {
    if (document.visibilityState === "hidden") stop("hidden");
  };
  const go = () => {
    if (settled) return;
    const l = lead();
    if (!(want > 0) || l < 250) {
      stop(want > 0 ? "late" : "disabled", true);
      return;
    }
    settled = true;
    off();
    inner = showCard({ ...o, live }, "fixed", end, clamp(Math.ceil(l / 1e3 - 0.05), live ? 1 : 2, MAX_SEC));
    inner.then(resolve);
  };
  const schedule = () => {
    clearTimeout(t);
    const wait = end - Date.now() - lead();
    if (wait > 30) t = setTimeout(go, wait);
    else go();
  };
  const h = {
    info: { pending: true, mode: "fixed", live, seconds: 0, source: o.source || null },
    left: null,
    cancel: (r4 = "cancelled") => stop(r4),
    finish: (r4) => stop(r4, true),
    update: (u) => {
      if (!isNum(u?.endsAt)) return false;
      end = clampEnd(u.endsAt);
      schedule();
      return true;
    }
  };
  if (active) active.cancel("replaced");
  active = h;
  document.addEventListener("visibilitychange", onVis);
  p.cancel = (r4) => inner ? inner.cancel(r4) : h.cancel(r4);
  p.update = (u) => inner ? inner.update(u) : !settled && h.update(u);
  schedule();
  return p;
}
function showCard(o, mode, endAt0, seconds) {
  const synced = mode === "synced";
  if (active) active.cancel("replaced");
  const brandName = String(o.brand?.name || o.sponsor?.name || (typeof o.sponsor === "string" ? o.sponsor : "") || "").trim().slice(0, 40);
  const pal = o.palette || o.brand?.palette || o.sponsor?.palette || {};
  const ringColor = hexOk(pal.primary) || "#ffc53a";
  const small = innerWidth <= 520 || innerHeight <= 500;
  const k = (small ? 0.84 : 1) * (o.live ? 0.9 : 1), W = 260 * k, H = 64 * k;
  const dockOpts = { dock: o.dock, hudDock: o.hudDock || (o.live ? o.hud?.dock : null), hud: o.hud, w: W, h: H, margin: small ? 10 : 14, live: !!o.live };
  const place = pickDock(dockOpts);
  const holder = document.createElement("div");
  holder.setAttribute("data-bonusround-countdown", "");
  holder.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  const root = holder.attachShadow ? holder.attachShadow({ mode: "open" }) : holder;
  const lead = brandName ? `Ad: a Bonus Round from ${brandName}, by bonusround.io` : "Ad: a Bonus Round by bonusround.io";
  const logo = brandName && typeof o.logoUrl === "string" && o.logoUrl ? `<img alt="" src="${esc(o.logoUrl)}">` : "";
  root.innerHTML = `<style>${CSS}</style>
    <div class="cd" part="card">
      <span class="sr" role="status" aria-live="polite">${esc(lead)}, starting in ${seconds} seconds</span>
      <div class="txt" aria-hidden="true">
        <div class="l1">${brandName ? '<span class="ad">Ad</span><span class="sep">\xB7</span>' : ""}<span class="mk br-bo">${BR_MARK_SVG}</span><span class="dom">bonusround.io</span></div>
        <div class="l2">${brandName ? `from ${logo}<b>${esc(brandName)}</b> in` : '<span class="ad">Ad</span> in'}</div>
      </div>
      <div class="ring" aria-hidden="true"><svg viewBox="0 0 46 46"><circle class="trk" cx="23" cy="23" r="19" fill="none" stroke-width="4"/>
        <circle class="prg" cx="23" cy="23" r="19" fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="0"/></svg><b class="n">${seconds}</b></div>
    </div>`;
  const card = root.querySelector(".cd"), numEl = root.querySelector(".n"), prg = root.querySelector(".prg"), lk = root.querySelector(".lk");
  if (lk) {
    const r4 = lk.getAttribute("viewBox").split(" ");
    lk.setAttribute("width", String(Math.round(18 * (+r4[2] / +r4[3]))));
    lk.setAttribute("height", "18");
  }
  card.style.setProperty("--p", ringColor);
  card.style.setProperty("--k", String(k));
  const fromRight = place.dock === "top-right" || place.dock === "bottom-right";
  const fromX = place.dock === "top-center" ? "0px" : fromRight ? "120%" : "-120%";
  card.style.setProperty("--fx", fromX);
  card.style.setProperty("--fy", place.dock === "top-center" ? "-140%" : "0px");
  card.style.setProperty("--to", `${fromRight ? "right" : place.dock === "top-center" ? "center" : "left"} ${place.dock.startsWith("bottom") ? "bottom" : "top"}`);
  const position = (rect) => {
    card.style.left = `${Math.round(rect.x - (W / k - W) * (fromRight ? 1 : place.dock === "top-center" ? 0.5 : 0))}px`;
    card.style.top = `${Math.round(rect.y - (place.dock.startsWith("bottom") ? H / k - H : 0))}px`;
  };
  position(place.rect);
  document.documentElement.appendChild(holder);
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("on")));
  const t0 = performance.now();
  let endAt = endAt0;
  let lastN = null, finished = false, raf = 0, hiddenAt = 0, restarts = 0, resolve;
  const info = { seconds, mode, dock: place.dock, why: place.why, synced, brand: brandName || null, source: o.source || null, startedAt: Date.now() };
  const promise = new Promise((r4) => {
    resolve = r4;
  });
  const paint = () => {
    if (finished || hiddenAt) return;
    const left = endAt - Date.now();
    if (left <= 0) return finish(true, null);
    const n = clamp(Math.ceil(left / 1e3), 1, seconds);
    prg.setAttribute("stroke-dashoffset", (RING_C * clamp(1 - left / (seconds * 1e3), 0, 1)).toFixed(2));
    if (n !== lastN) {
      lastN = n;
      numEl.textContent = String(n);
      numEl.classList.remove("pop");
      void numEl.offsetWidth;
      numEl.classList.add("pop");
      if (!o.muted) {
        try {
          tickSound(Number.isFinite(+o.volume) ? +o.volume : 1, n === 1);
        } catch {
        }
      }
      try {
        o.onTick?.(n);
      } catch {
      }
      if (active) active.left = n;
    }
  };
  const loop = () => {
    paint();
    if (!finished) raf = requestAnimationFrame(loop);
  };
  const backup = setInterval(paint, 200);
  const onVis = () => {
    if (finished) return;
    if (document.visibilityState === "hidden") {
      if (mode === "fixed") return finish(false, "hidden");
      if (mode === "local") {
        hiddenAt = Date.now();
        card.classList.add("away");
      }
      return;
    }
    if (mode !== "local" || !hiddenAt) return;
    const away = Date.now() - hiddenAt;
    hiddenAt = 0;
    card.classList.remove("away");
    if (away > MAX_HIDDEN_MS) return finish(false, "hidden");
    restarts++;
    lastN = null;
    endAt = Date.now() + seconds * 1e3;
  };
  document.addEventListener("visibilitychange", onVis);
  const onResize = () => {
    if (finished) return;
    const p2 = pickDock(dockOpts);
    position(p2.dock === place.dock ? p2.rect : zoneRect(place.dock, stageRect(), W, H, dockOpts.margin));
  };
  addEventListener("resize", onResize);
  const onAbort = () => finish(false, "aborted");
  o.signal?.addEventListener?.("abort", onAbort, { once: true });
  function finish(completed, reason) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    clearInterval(backup);
    document.removeEventListener("visibilitychange", onVis);
    removeEventListener("resize", onResize);
    o.signal?.removeEventListener?.("abort", onAbort);
    if (active === handle) active = null;
    card.classList.remove("on");
    card.classList.add("out");
    setTimeout(() => holder.remove(), 260);
    const out = { completed, reason: reason || null, seconds, mode, dock: place.dock, restarts, shownMs: Math.round(performance.now() - t0), synced };
    note({ ...info, ...out, endedAt: Date.now() });
    resolve(out);
  }
  const update = (u) => {
    if (finished || mode === "synced" || !isNum(u?.endsAt)) return false;
    endAt = toEpochMs(u.endsAt);
    if (mode === "local") mode = "fixed";
    paint();
    return true;
  };
  const handle = { info, left: seconds, update, finish: (reason) => {
    if (finished) return false;
    finish(true, reason);
    return true;
  }, cancel: (reason = "cancelled") => {
    if (finished) return false;
    finish(false, reason);
    return true;
  } };
  active = handle;
  if (document.visibilityState === "hidden" && mode === "local") {
    hiddenAt = Date.now();
    card.classList.add("away");
  }
  try {
    o.onShow?.(info);
  } catch {
  }
  raf = requestAnimationFrame(loop);
  paint();
  promise.cancel = handle.cancel;
  promise.update = update;
  return promise;
}
function updateCountdown(u) {
  return active?.update ? active.update(u) : false;
}
function cancelCountdown(reason = "cancelled") {
  return active ? active.cancel(reason) : false;
}
function finishCountdown(reason = "started") {
  return active ? active.finish(reason) : false;
}
function breakAllowed(mem2, settings = {}, now2 = Date.now()) {
  const gap = num(settings.minBreakGapSec) ?? DEFAULT_MIN_BREAK_GAP_SEC, max = num(settings.maxPerSession) ?? DEFAULT_MAX_PER_SESSION;
  if (max > 0 && (mem2.count || 0) >= max) return { ok: false, reason: "session_cap" };
  if (gap > 0 && mem2.last && now2 - mem2.last < gap * 1e3) return { ok: false, reason: "break_gap", waitSec: Math.ceil((gap * 1e3 - (now2 - mem2.last)) / 1e3) };
  return { ok: true, reason: null };
}
function noteBreak(mem2, now2 = Date.now()) {
  mem2.last = now2;
  mem2.count = (mem2.count || 0) + 1;
  return mem2;
}
function breakGuard(core, trigger) {
  if (trigger === "test" || trigger === "rewarded" || core.mode === "native-net") return null;
  const r4 = breakAllowed(core.__breaks || (core.__breaks = { last: 0, count: 0 }), core.settings?.formats?.takeover || {});
  return r4.ok ? null : r4.reason;
}
async function coreCountdown(core, run, raw) {
  try {
    const tk = core.settings?.formats?.takeover || {};
    const seconds = resolveCountdownSec({ config: core.state?.countdownSec, publisher: tk.countdownSec, manifest: raw?.round?.countdownSec, trigger: run.trigger });
    const name = run.ad?.brand?.name || raw?.brand?.name || "";
    const endsAt = isNum(run.opts?.countdownEndsAt) ? +run.opts.countdownEndsAt : null;
    const r4 = seconds > 0 || endsAt ? await showCountdown({
      seconds,
      endsAt,
      brand: { name, palette: raw?.brand?.palette || run.ad?.brand?.palette || null },
      logoUrl: absUrl(raw?.brand?.logo, run.ad?.manifestUrl),
      muted: !!core.state?.muted,
      hudDock: raw?.round?.inworld?.hudDock || raw?.round?.brandworld?.hudDock || null,
      hud: core.worldFull?.gameplayHooks?.hud || core.world?.gameplayHooks?.hud || null,
      source: "br.js"
    }) : { completed: true, reason: "disabled", seconds: 0 };
    if (r4.completed) noteBreak(core.__breaks || (core.__breaks = { last: 0, count: 0 }));
    const value = { seconds: r4.seconds ?? seconds, completed: r4.completed, reason: r4.reason, dock: r4.dock || null, restarts: r4.restarts || 0, endsAt };
    if (seconds > 0) {
      core.beacons?.push({ at: Date.now(), type: "countdown", value, local: true });
      if (core.beacons?.length > 50) core.beacons.shift();
      core.emitter?.emit("countdown", { ...value, trigger: run.trigger, brand: name || null, requestId: run.ad?.requestId || null });
    }
    return r4;
  } catch (e) {
    return { completed: true, reason: "error", error: String(e?.message || e) };
  }
}
function serverCountdown(rt, m) {
  if (!m || m.cancelled) {
    cancelCountdown("server");
    return null;
  }
  const ad = rt.ad && rt.ad.url === m.manifestUrl ? rt.ad : null;
  const b = ad?.m?.brand?.name && ad.m.brand.name !== "Sponsored" ? ad.m.brand : m.sponsor || {};
  const p = showCountdown({
    startsAt: m.startsAt,
    clockOffset: Number.isFinite(m.now) ? m.now - Date.now() : 0,
    seconds: m.sec,
    brand: { name: b.name || "", palette: b.palette || null },
    logoUrl: absUrl(b.logo, m.manifestUrl),
    muted: rt.volume === 0,
    hudDock: ad?.m?.round?.inworld?.hudDock || null,
    hud: rt.worldManifest?.gameplayHooks?.hud || null,
    source: "server"
  });
  p.then((r4) => {
    if (r4.reason !== "late") rt._emit?.("countdown", { seconds: r4.seconds, completed: r4.completed, reason: r4.reason, startsAt: m.startsAt, dock: r4.dock });
  });
  return p;
}
var DEFAULT_COUNTDOWN_SEC, USER_COUNTDOWN_SEC, MAX_SEC, MAX_HIDDEN_MS, clamp, num, esc, BR_MARK_SVG, ZONES, overlap, OURS, SKIP_TAGS, CSS, RING_C, active, history, MIN_FIXED_MS, done0, isNum, toEpochMs, countdownActive, DEFAULT_MIN_BREAK_GAP_SEC, DEFAULT_MAX_PER_SESSION, absUrl;
var init_countdown = __esm({
  "../../sdk/countdown.js"() {
    init_audio();
    DEFAULT_COUNTDOWN_SEC = 5;
    USER_COUNTDOWN_SEC = 3;
    MAX_SEC = 10;
    MAX_HIDDEN_MS = 6e4;
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    num = (v) => v === null || v === void 0 || v === "" || typeof v === "boolean" || !Number.isFinite(+v) ? null : +v;
    esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    BR_MARK_SVG = '<img src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%20role%3D%22img%22%20aria-label%3D%22Bonus%20Round%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22br-gold%22%20gradientUnits%3D%22userSpaceOnUse%22%20x1%3D%228%22%20y1%3D%224%22%20x2%3D%2256%22%20y2%3D%2262%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffd66b%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffb000%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Ccircle%20cx%3D%2234.2%22%20cy%3D%2232%22%20r%3D%2227%22%20fill%3D%22%23c27400%22%2F%3E%3Crect%20x%3D%2229.8%22%20y%3D%225%22%20width%3D%224.4%22%20height%3D%2254%22%20rx%3D%220%22%20fill%3D%22%23c27400%22%2F%3E%3Ccircle%20cx%3D%2229.8%22%20cy%3D%2232%22%20r%3D%2227%22%20fill%3D%22url(%23br-gold)%22%2F%3E%3Ccircle%20cx%3D%2229.8%22%20cy%3D%2232%22%20r%3D%2221.4%22%20fill%3D%22none%22%20stroke-width%3D%222.6%22%20stroke%3D%22%23e08f00%22%20stroke-opacity%3D%220.62%22%2F%3E%3Cpath%20d%3D%22M6.78%2024.52A24.2%2024.2%200%200%201%2020.73%209.56%22%20fill%3D%22none%22%20stroke-width%3D%222.4%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%220.7%22%2F%3E%3Cellipse%20cx%3D%2221.700000000000003%22%20cy%3D%2230.38%22%20rx%3D%223.7800000000000002%22%20ry%3D%225.13%22%20fill%3D%22%231a1405%22%2F%3E%3Cellipse%20cx%3D%2237.9%22%20cy%3D%2230.38%22%20rx%3D%223.7800000000000002%22%20ry%3D%225.13%22%20fill%3D%22%231a1405%22%2F%3E%3Ccircle%20cx%3D%2222.91%22%20cy%3D%2228.43%22%20r%3D%221.36%22%20fill%3D%22%23fff%22%2F%3E%3Ccircle%20cx%3D%2239.11%22%20cy%3D%2228.43%22%20r%3D%221.36%22%20fill%3D%22%23fff%22%2F%3E%3Cpath%20d%3D%22M26.02%2039.02Q29.8%2043.34%2033.58%2039.02%22%20fill%3D%22none%22%20stroke-width%3D%222.565%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke%3D%22%231a1405%22%2F%3E%3Cellipse%20cx%3D%2215.76%22%20cy%3D%2237.94%22%20rx%3D%223.5100000000000002%22%20ry%3D%222.16%22%20fill%3D%22%23ff5d8f%22%20fill-opacity%3D%220.6%22%2F%3E%3Cellipse%20cx%3D%2243.84%22%20cy%3D%2237.94%22%20rx%3D%223.5100000000000002%22%20ry%3D%222.16%22%20fill%3D%22%23ff5d8f%22%20fill-opacity%3D%220.6%22%2F%3E%3C%2Fsvg%3E%0A" alt="" aria-hidden="true" draggable="false">';
    ZONES = ["top-right", "top-left", "bottom-right", "bottom-left", "top-center"];
    overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    OURS = "[data-bonusround-countdown],[data-spatial-ads-overlay],.sa-root,[data-bonusround-inworld],[data-bonusround-ui]";
    SKIP_TAGS = /* @__PURE__ */ new Set(["CANVAS", "SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT", "TEMPLATE", "BR", "HEAD", "TITLE", "IFRAME"]);
    CSS = `
.mk{display:inline-flex;width:22px;height:22px;flex:none;margin:-2px 0}.mk svg,.mk img{width:22px;height:22px;display:block}
.dom{font:800 13px/1 Sora,Inter,system-ui,-apple-system,sans-serif;letter-spacing:-.01em;color:#fff;white-space:nowrap}
:host{all:initial}
.cd{position:fixed;left:0;top:0;width:260px;height:64px;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:8px 9px 8px 13px;
  border-radius:18px;background:rgba(18,16,36,.86);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.16);
  box-shadow:0 10px 30px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.08);color:#fff;font:600 13px/1.15 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  pointer-events:none;user-select:none;opacity:0;transform:translate(var(--fx,0),var(--fy,0)) scale(var(--k,1));transform-origin:var(--to,right top);
  transition:transform .55s cubic-bezier(.2,1.35,.4,1),opacity .3s ease}
.cd.on{opacity:1;transform:translate(0,0) scale(var(--k,1))}
.cd.out{opacity:0;transform:translate(0,0) scale(calc(var(--k,1) * .94));transition:transform .22s ease-in,opacity .22s ease-in}
.cd.away{opacity:0}
.cd::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 3px 3px 0;background:var(--p,#ffc53a)}
.txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.l1{display:flex;align-items:center;gap:6px;height:18px}
.ad{flex:none;display:inline-flex;align-items:center;height:17px;padding:0 6px;border-radius:5px;background:#fff;color:#0b0a14;font:800 11px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.3px}
.sep{opacity:.55;font-weight:800}
.lk{height:18px;width:auto;display:block;overflow:visible}
.l2{display:flex;align-items:center;gap:5px;min-width:0;white-space:nowrap;color:rgba(255,255,255,.86)}
.l2 b{font-weight:850;color:#fff;overflow:hidden;text-overflow:ellipsis;min-width:0}
.l2 img{height:16px;width:16px;object-fit:contain;border-radius:4px;background:#fff;flex:none}
.ring{position:relative;flex:none;width:46px;height:46px}
.ring svg{position:absolute;inset:0;transform:rotate(-90deg)}
.ring .trk{stroke:rgba(255,255,255,.16)}
.ring .prg{stroke:var(--p,#ffc53a);transition:stroke-dashoffset .12s linear}
.n{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 21px/1 system-ui,-apple-system,"Segoe UI",sans-serif;font-variant-numeric:tabular-nums}
.n.pop{animation:pop .42s cubic-bezier(.2,1.6,.4,1)}
.br-bo{transform-box:fill-box;transform-origin:50% 60%;animation:bob 1.15s ease-in-out infinite}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
@keyframes bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-7px) rotate(-6deg)}}
@keyframes pop{0%{transform:scale(1.45);opacity:.4}100%{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){
  .cd,.cd.on,.cd.out{transform:scale(var(--k,1));transition:opacity .25s ease}
  .br-bo,.n.pop{animation:none}
  .ring .prg{transition:none}
}`;
    RING_C = 2 * Math.PI * 19;
    active = null;
    history = [];
    MIN_FIXED_MS = 2e3;
    done0 = (r4) => {
      const p = Promise.resolve(r4);
      p.cancel = () => false;
      return p;
    };
    isNum = (v) => v !== null && v !== void 0 && v !== "" && Number.isFinite(+v);
    toEpochMs = (v) => +v >= 1e12 ? +v : Date.now() + (+v - performance.now());
    countdownActive = () => active ? { ...active.info, left: active.left } : null;
    if (typeof window !== "undefined") {
      window.__BONUSROUND_COUNTDOWN__ = window.__BONUSROUND_COUNTDOWN__ || {
        get active() {
          return countdownActive();
        },
        history,
        cancel: (r4) => cancelCountdown(r4 || "game"),
        update: updateCountdown,
        show: showCountdown
      };
    }
    DEFAULT_MIN_BREAK_GAP_SEC = 120;
    DEFAULT_MAX_PER_SESSION = 8;
    absUrl = (p, base) => {
      try {
        return p ? new URL(p, new URL(base, location.href)).href : null;
      } catch {
        return null;
      }
    };
  }
});

// ../../sdk/overlay.js
function createOverlay(m, pal, logoUrl, opts = {}) {
  if (!document.getElementById("sa-style")) {
    const st = document.createElement("style");
    st.id = "sa-style";
    st.textContent = CSS2;
    document.head.appendChild(st);
  }
  const root = document.createElement("div");
  const DOCK = { "top-right": " sa-dock-right", "top-left": " sa-dock-left", "bottom-left": " sa-dock-bl" };
  root.className = "sa-root" + (DOCK[opts.dock] || "");
  root.dataset.spatialAds = m.id || "";
  const vars = {
    "--sa-primary": pal.primary,
    "--sa-secondary": pal.secondary,
    "--sa-accent": pal.accent,
    "--sa-bg": pal.background,
    "--sa-ink": pal.text,
    "--sa-on-primary": readableOn(pal.primary, pal.text),
    "--sa-on-secondary": readableOn(pal.secondary, pal.background),
    "--sa-on-accent": readableOn(pal.accent, pal.background),
    "--sa-on-bg": readableOn(pal.background, pal.text)
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  const logo = logoUrl ? `<span class="sa-logo"><img alt="" src="${esc2(logoUrl)}"></span>` : `<span class="sa-logo">${esc2(initials(m.brand.name))}</span>`;
  const r4 = m.round;
  root.innerHTML = `
    <div class="sa-fade${logoUrl ? " sa-has-big" : ""}">${logo}${logoUrl ? `<img class="sa-big" alt="${esc2(m.brand.name)}" src="${esc2(opts.bigLogoUrl || logoUrl)}">` : ""}<div class="sa-k">Ad \xB7 Bonus Round</div><div class="sa-n">${esc2(m.brand.name)}</div>${m.brand.tagline ? `<div class="sa-tagline">${esc2(m.brand.tagline)}</div>` : ""}</div>
    <div class="sa-bar" aria-live="polite"><span class="sa-ad" title="Advertisement">Ad</span>${logo}<div class="sa-b"><small>bonusround.io</small><strong>${esc2(m.brand.name)}</strong></div>
      <div class="sa-chip"><small>Time</small><b class="sa-timer">0:15</b></div>
      <div class="sa-chip alt"><small class="sa-label">${esc2(r4.hudLabel)}</small><b class="sa-count">0</b></div><span class="sa-brm" title="bonusround.io">${BR_MARK_SVG}</span></div>
    <div class="sa-intro"><small><span class="sa-ad">Ad</span>${esc2(m.brand.name)}</small><div>${esc2(r4.introText)}</div></div>
    <div class="sa-toast">+1</div>
    <div class="sa-cap" aria-live="polite"><div class="sa-line"><b>${esc2(m.brand.name)}</b><span class="sa-cap-t"></span></div><button type="button" class="sa-cc" title="Captions on/off" aria-pressed="true">CC</button></div>
    <div class="sa-board"></div>`;
  document.body.appendChild(root);
  const q = (s) => root.querySelector(s);
  const fadeEl = q(".sa-fade"), bar = q(".sa-bar"), intro = q(".sa-intro"), board = q(".sa-board"), toast = q(".sa-toast");
  const timerEl = q(".sa-timer"), countEl = q(".sa-count"), countChip = countEl.parentElement, timeChip = timerEl.parentElement;
  let lastTimer = "", holdTimer = 0, capTimer = 0, total = null, lastCount = 0;
  const cap = root.querySelector(".sa-cap"), capText = root.querySelector(".sa-cap-t"), ccBtn = root.querySelector(".sa-cc");
  let ccOn = true;
  const canStore = () => typeof opts.storage === "function" ? opts.storage() : opts.storage !== false;
  try {
    if (canStore()) ccOn = localStorage.getItem("br_captions") !== "off";
  } catch {
  }
  const paintCc = () => {
    cap.classList.toggle("off", !ccOn);
    ccBtn.setAttribute("aria-pressed", String(ccOn));
  };
  paintCc();
  ccBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    ccOn = !ccOn;
    paintCc();
    try {
      if (canStore()) localStorage.setItem("br_captions", ccOn ? "on" : "off");
    } catch {
    }
  });
  return {
    root,
    fade(on, ms = 300) {
      fadeEl.style.transitionDuration = `${ms}ms`;
      fadeEl.classList.toggle("on", on);
      return new Promise((res) => setTimeout(res, ms + 20));
    },
    showHud(on) {
      bar.classList.toggle("on", on);
    },
    intro(on) {
      intro.classList.toggle("on", on);
    },
    timer(sec) {
      const s = Math.max(0, Math.ceil(sec));
      const txt = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      if (txt !== lastTimer) {
        timerEl.textContent = txt;
        lastTimer = txt;
        timeChip.classList.toggle("hot", s <= 5);
      }
    },
    /** the round's live total of claimable items ("3/9"); null hides it (when the total isn't stable) */
    total(n) {
      total = Number.isFinite(n) && n > 0 ? n : null;
      this.count(lastCount);
    },
    count(n) {
      lastCount = n;
      countEl.innerHTML = total ? `${esc2(n)}<small class="sa-of">/${esc2(total)}</small>` : esc2(n);
      countChip.classList.remove("pop");
      void countChip.offsetWidth;
      countChip.classList.add("pop");
    },
    toast(text) {
      toast.textContent = text;
      toast.classList.remove("on");
      void toast.offsetWidth;
      toast.classList.add("on");
    },
    /** hold: { ms, onDone } keeps the card up until Continue or a visible countdown (paused while CTA/Continue is hovered or focused) */
    showBoard(rows, myId, hold = null) {
      const list = rows.slice(0, opts.productUrl ? 4 : 6).map((p, i) => `<li class="${p.id === myId ? "me" : ""}"><span class="r">${i + 1}</span><span class="d" style="background:${esc2(p.color || pal.primary)}"></span><span class="n">${esc2(p.name)}${p.bot ? "<i>BOT</i>" : ""}${p.id === myId ? "<i>YOU</i>" : ""}</span><span class="s">${p.score}</span></li>`).join("");
      const prod = opts.productUrl ? `<div class="sa-prod"><img alt="${esc2(m.brand.productName || m.brand.name)}" src="${esc2(opts.productUrl)}"><div class="sa-pl">${logoUrl ? `<img alt="${esc2(m.brand.name)}" src="${esc2(logoUrl)}">` : ""}${m.brand.tagline ? `<b>${esc2(m.brand.tagline)}</b>` : ""}${m.brand.productName ? `<small>${esc2(m.brand.productName)}</small>` : ""}</div></div>` : "";
      board.innerHTML = `<header>${logo}<div><small>Round results</small><strong><span class="sa-ad">Ad</span><span class="sa-dot">\xB7</span>${esc2(m.brand.name)}</strong></div></header>
        ${prod}
        <ol class="${prod ? "sa-short" : ""}">${list || '<li><span class="n">No players</span></li>'}</ol>
        ${r4.outroText ? `<p class="sa-out">${esc2(r4.outroText)}</p>` : ""}
        ${r4.cta ? opts.ctaUrl ? `<button type="button" class="sa-cta sa-click">${esc2(r4.cta)} <span aria-hidden="true">\u2197</span></button>` : `<span class="sa-cta">${esc2(r4.cta)}</span>` : ""}
        ${hold ? `<button type="button" class="sa-continue">Continue <span class="sa-count-down"></span></button>` : ""}
        <footer>${BR_MARK_SVG}<span>Brought to you by bonusround.io</span></footer>`;
      board.querySelector(".sa-click")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        opts.onCta?.();
      });
      board.classList.add("on");
      clearInterval(holdTimer);
      if (!hold) return;
      let left = hold.ms, paused = 0, finished = false;
      const cd = board.querySelector(".sa-count-down");
      const finish = () => {
        if (finished) return;
        finished = true;
        clearInterval(holdTimer);
        hold.onDone?.();
      };
      const paint = () => {
        cd.textContent = paused ? "\xB7 paused" : `\xB7 ${Math.max(0, Math.ceil(left / 1e3))}`;
      };
      for (const el of board.querySelectorAll(".sa-click, .sa-continue")) {
        el.addEventListener("pointerenter", () => {
          paused++;
          paint();
        });
        el.addEventListener("pointerleave", () => {
          paused = Math.max(0, paused - 1);
          paint();
        });
        el.addEventListener("focus", () => {
          paused++;
          paint();
        });
        el.addEventListener("blur", () => {
          paused = Math.max(0, paused - 1);
          paint();
        });
      }
      board.querySelector(".sa-continue").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        finish();
      });
      let last = performance.now();
      paint();
      holdTimer = setInterval(() => {
        const now2 = performance.now();
        if (!paused) left -= now2 - last;
        last = now2;
        paint();
        if (left <= 0) finish();
      }, 100);
    },
    /** lower-third captions for the voice-over (shown even when muted; the CC button toggles them) */
    caption(text, ms) {
      clearTimeout(capTimer);
      if (!text) {
        cap.classList.remove("on");
        return;
      }
      capText.textContent = text;
      cap.classList.add("on");
      capTimer = setTimeout(() => cap.classList.remove("on"), Math.max(1500, ms + 400));
    },
    hideBoard() {
      clearInterval(holdTimer);
      board.classList.remove("on");
    },
    hideAll() {
      clearInterval(holdTimer);
      clearTimeout(capTimer);
      cap.classList.remove("on");
      bar.classList.remove("on");
      intro.classList.remove("on");
      board.classList.remove("on");
    },
    dispose() {
      root.remove();
    }
  };
}
var CSS2, esc2;
var init_overlay = __esm({
  "../../sdk/overlay.js"() {
    init_builders();
    init_countdown();
    CSS2 = `
.sa-root{position:fixed;inset:0;pointer-events:none;z-index:50;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--sa-ink)}
.sa-root *{box-sizing:border-box}
.sa-fade{position:absolute;inset:0;opacity:0;transition:opacity .3s ease;background:radial-gradient(circle at 50% 45%,var(--sa-primary),var(--sa-bg) 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:var(--sa-on-primary)}
.sa-fade.on{opacity:1}
.sa-fade .sa-big{display:none;max-width:min(62vw,720px);max-height:34vh;object-fit:contain;padding:18px 34px;border-radius:28px;background:#fff;box-shadow:0 0 0 6px var(--sa-accent),0 16px 50px rgba(0,0,0,.3);transform:scale(.8);transition:transform .45s cubic-bezier(.2,1.5,.4,1)}
.sa-fade.on .sa-big{transform:scale(1)}
.sa-has-big .sa-big{display:block}
.sa-has-big > .sa-logo{display:none}
.sa-has-big .sa-n{display:none}
.sa-fade .sa-tagline{font-size:30px;font-weight:900;letter-spacing:.5px;text-shadow:0 3px 14px rgba(0,0,0,.3)}
.sa-fade .sa-k{font-size:13px;letter-spacing:4px;text-transform:uppercase;font-weight:800;opacity:.8}
.sa-fade .sa-n{font-size:46px;font-weight:900;letter-spacing:-1px;text-shadow:0 4px 18px rgba(0,0,0,.25)}
.sa-logo{width:44px;height:44px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;background:linear-gradient(135deg,var(--sa-primary),var(--sa-secondary));color:var(--sa-on-primary);box-shadow:0 0 0 3px var(--sa-accent);overflow:hidden}
.sa-logo img{width:100%;height:100%;object-fit:contain;background:#fff}
.sa-fade .sa-logo{width:96px;height:96px;font-size:38px;box-shadow:0 0 0 5px var(--sa-accent),0 12px 40px rgba(0,0,0,.3)}
.sa-bar{position:absolute;top:max(12px,env(safe-area-inset-top));left:50%;transform:translate(-50%,-140%);opacity:0;transition:transform .45s cubic-bezier(.2,1.4,.4,1),opacity .3s;display:flex;align-items:center;gap:10px;padding:6px 7px 6px 6px;border-radius:18px;max-width:calc(100vw - 24px);background:color-mix(in srgb,var(--sa-bg) 86%,transparent);backdrop-filter:blur(10px);border:2px solid var(--sa-primary);box-shadow:0 10px 30px rgba(0,0,0,.25);color:var(--sa-on-bg);white-space:nowrap}
.sa-bar.on{transform:translate(-50%,0);opacity:1}
.sa-dock-right .sa-bar{left:auto;right:max(12px,env(safe-area-inset-right));transform:translateY(-140%)}
.sa-dock-right .sa-bar.on{transform:none}
.sa-dock-left .sa-bar{left:max(12px,env(safe-area-inset-left));transform:translateY(-140%)}
.sa-dock-left .sa-bar.on{transform:none}
.sa-dock-bl .sa-bar{top:auto;bottom:max(12px,env(safe-area-inset-bottom));left:max(12px,env(safe-area-inset-left));transform:translateY(140%)}
.sa-dock-bl .sa-bar.on{transform:none}
.sa-dock-bl .sa-toast{top:auto;bottom:150px}
.sa-bar .sa-logo{width:34px;height:34px;font-size:13px;box-shadow:0 0 0 2px var(--sa-accent)}
.sa-bar .sa-b{display:flex;flex-direction:column;line-height:1.1;padding-right:4px;min-width:0}
.sa-bar .sa-b small{font-size:9px;letter-spacing:1.6px;text-transform:uppercase;font-weight:800;opacity:.75}
.sa-bar .sa-b strong{font-size:15px;font-weight:900;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.sa-chip{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:62px;padding:4px 10px;border-radius:13px;flex:none;background:var(--sa-primary);color:var(--sa-on-primary);line-height:1.05}
.sa-chip small{font-size:9px;letter-spacing:1px;text-transform:uppercase;font-weight:800;opacity:.85;max-width:110px;overflow:hidden;text-overflow:ellipsis}
.sa-chip b{font-size:20px;font-weight:900;font-variant-numeric:tabular-nums}
.sa-chip b .sa-of{font-size:12px;font-weight:800;opacity:.7;margin-left:1px;letter-spacing:0;text-transform:none;max-width:none}
.sa-chip.alt{background:var(--sa-secondary);color:var(--sa-on-secondary)}
.sa-chip.hot b{color:var(--sa-accent)}
.sa-chip.pop{animation:sa-pop .35s}
.sa-intro{position:absolute;left:50%;top:34%;transform:translate(-50%,-50%) scale(.6);opacity:0;transition:all .45s cubic-bezier(.2,1.5,.4,1);text-align:center;width:min(90vw,820px)}
.sa-intro.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.sa-intro small{display:inline-block;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:900;padding:5px 12px;border-radius:99px;background:var(--sa-secondary);color:var(--sa-on-secondary);margin-bottom:10px}
.sa-intro div{font-size:clamp(24px,6.5vw,44px);font-weight:900;line-height:1.08;color:#fff;letter-spacing:-.5px;text-shadow:0 3px 0 var(--sa-primary),0 6px 24px rgba(0,0,0,.35)}
.sa-toast{position:absolute;left:50%;top:calc(78px + env(safe-area-inset-top));transform:translateX(-50%);font-weight:900;font-size:26px;color:#fff;text-shadow:0 2px 0 var(--sa-primary),0 4px 14px rgba(0,0,0,.3);opacity:0}
.sa-toast.on{animation:sa-rise .7s ease-out}
.sa-board{position:absolute;left:50%;top:50%;width:min(92vw,440px);transform:translate(-50%,-46%) scale(.92);opacity:0;transition:all .4s cubic-bezier(.2,1.3,.4,1);border-radius:26px;overflow:hidden;background:#fff;color:#221d33;box-shadow:0 24px 70px rgba(0,0,0,.35)}
.sa-board.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.sa-board header{display:flex;gap:14px;align-items:center;padding:18px 20px;background:linear-gradient(120deg,var(--sa-primary),var(--sa-secondary));color:var(--sa-on-primary)}
.sa-board header small{display:block;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:800;opacity:.85}
.sa-board header strong{font-size:22px;font-weight:900}
.sa-board ol{list-style:none;margin:0;padding:10px 14px}
.sa-board li{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:12px;font-weight:700;font-size:15px}
.sa-board li.me{background:color-mix(in srgb,var(--sa-accent) 22%,#fff)}
.sa-board li .r{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;background:#efecf5}
.sa-board li:first-child .r{background:var(--sa-secondary);color:var(--sa-on-secondary)}
.sa-board li .d{width:12px;height:12px;border-radius:50%}
.sa-board li .n{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sa-board li .n i{font-style:normal;font-size:10px;opacity:.5;margin-left:6px}
.sa-board li .s{font-weight:900;font-variant-numeric:tabular-nums}
.sa-board .sa-prod{display:flex;align-items:center;gap:16px;padding:12px 22px 2px}
.sa-board .sa-prod img{height:118px;width:auto;max-width:42%;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,.25))}
.sa-board .sa-prod .sa-pl{flex:1;min-width:0}
.sa-board .sa-prod .sa-pl img{height:40px;max-width:100%;filter:none;display:block;margin-bottom:6px}
.sa-board .sa-prod b{display:block;font-size:20px;font-weight:900;line-height:1.15;color:var(--sa-primary)}
.sa-board .sa-prod small{display:block;font-size:12px;font-weight:700;opacity:.6;margin-top:2px}
.sa-board ol.sa-short li{padding:4px 8px;font-size:14px}
.sa-board .sa-out{padding:2px 22px 4px;font-size:15px;font-weight:600;line-height:1.35;text-align:center}
.sa-board button.sa-cta{border:0;font-family:inherit;width:calc(100% - 44px);cursor:pointer;pointer-events:auto;transition:transform .15s}
.sa-board button.sa-cta:hover{transform:translateY(-1px)}
.sa-board button.sa-cta:active{transform:translateY(3px);box-shadow:0 2px 0 color-mix(in srgb,var(--sa-accent) 60%,#000)}
.sa-board .sa-cta{display:block;margin:12px 22px 6px;padding:12px 16px;border-radius:999px;text-align:center;font-weight:900;font-size:16px;background:var(--sa-accent);color:var(--sa-on-accent);box-shadow:0 6px 0 color-mix(in srgb,var(--sa-accent) 60%,#000)}
.sa-board .sa-continue{display:block;margin:4px auto 2px;border:0;background:none;font:800 14px system-ui,sans-serif;color:#221d33;opacity:.7;cursor:pointer;pointer-events:auto;padding:8px 16px;border-radius:999px}
.sa-board .sa-continue:hover,.sa-board .sa-continue:focus-visible{opacity:1;background:#f1eef8;outline:none}
.sa-board .sa-count-down{font-variant-numeric:tabular-nums;opacity:.6}
.sa-board footer{padding:8px 0 12px;text-align:center;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;opacity:.62;font-weight:800;display:flex;align-items:center;justify-content:center;gap:6px}
.sa-board footer svg,.sa-board footer img{width:16px;height:16px;flex:none}
/* disclosure: a persistent, high-contrast "Ad" chip for the whole round (FTC native-ad guidance) */
.sa-ad{flex:none;display:inline-flex;align-items:center;justify-content:center;height:20px;padding:0 7px;border-radius:6px;background:#0d0c16;color:#fff;font:900 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.4px;box-shadow:0 0 0 1.5px #fff,0 2px 6px rgba(0,0,0,.25);text-transform:none;vertical-align:middle}
.sa-board header strong .sa-ad{height:22px;font-size:13px;margin-right:2px;position:relative;top:-2px}
.sa-board header .sa-dot{opacity:.7;margin:0 3px}
.sa-intro small .sa-ad{height:17px;font-size:11px;letter-spacing:.3px;margin-right:6px;box-shadow:0 0 0 1.5px #fff}
.sa-brm{flex:none;width:20px;height:20px;display:flex;opacity:.92;margin-left:1px}
.sa-brm svg,.sa-brm img{width:100%;height:100%}
.sa-cap{position:absolute;left:50%;bottom:calc(66px + env(safe-area-inset-bottom));transform:translate(-50%,12px);opacity:0;transition:opacity .3s,transform .3s;display:flex;align-items:flex-end;gap:8px;width:max-content;max-width:min(60ch,calc(100vw - 32px));font-size:15px}
.sa-cap.on{opacity:1;transform:translate(-50%,0)}
.sa-cap .sa-line{background:rgba(12,10,26,.78);backdrop-filter:blur(6px);color:#fff;border-left:4px solid var(--sa-primary);border-radius:12px;padding:9px 14px 10px;
  font:600 15px/1.38 system-ui,-apple-system,"Segoe UI",sans-serif;min-width:0;text-shadow:0 1px 2px rgba(0,0,0,.4);box-shadow:0 8px 24px rgba(0,0,0,.25)}
.sa-cap .sa-line b{display:block;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;opacity:.75;margin-bottom:2px}
.sa-cap.off .sa-line{display:none}
.sa-cap .sa-cc{pointer-events:auto;cursor:pointer;border:0;border-radius:8px;padding:5px 8px;font:900 11px system-ui,sans-serif;letter-spacing:.5px;
  background:rgba(12,10,26,.7);color:#fff;opacity:.85}
.sa-cap.off .sa-cc{opacity:.6;text-decoration:line-through}
@media (max-width:520px){
  .sa-bar{gap:6px;padding:5px 5px 5px 5px;border-radius:16px}
  .sa-bar .sa-logo{width:30px;height:30px;font-size:12px}
  .sa-bar .sa-b small{display:none}
  .sa-bar .sa-b strong{font-size:13px;max-width:96px}
  .sa-chip{min-width:52px;padding:3px 8px}
  .sa-chip small{font-size:8px;letter-spacing:.4px;max-width:96px}
  .sa-chip b{font-size:17px}
  .sa-fade .sa-n{font-size:32px}
  .sa-board header{padding:14px 16px}
  .sa-board header strong{font-size:19px}
  .sa-board .sa-cta{font-size:14px;padding:11px 12px;margin:10px 16px 6px}
  .sa-board button.sa-cta{width:calc(100% - 32px)}
}
/* touch devices: the virtual stick and buttons own the bottom corners, so captions sit above them */
@media (pointer:coarse){ .sa-cap{bottom:calc(198px + env(safe-area-inset-bottom));max-width:min(60ch,calc(100vw - 24px))} .sa-cap .sa-line{font-size:14px} .sa-board .sa-continue{min-height:44px;min-width:120px} }
/* short screens (a phone held sideways): the results card stays whole and scrolls inside itself instead of losing its
   header and the "Brought to you by" line off the top and bottom (mobile pass) */
.sa-board{max-height:calc(100% - 16px);overflow-y:auto;overscroll-behavior:contain}
@media (max-height:520px){
  .sa-board{width:min(92vw,520px)}
  .sa-board header{padding:10px 16px} .sa-board header strong{font-size:18px}
  .sa-board .sa-prod{padding:8px 18px 0} .sa-board .sa-prod img{height:72px}
  .sa-board ol{padding:6px 12px} .sa-board li{padding:4px 8px}
}
@keyframes sa-pop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
@keyframes sa-rise{0%{opacity:0;transform:translate(-50%,10px)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-30px)}}
`;
    esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
});

// ../../sdk/mechanics/collect.js
var collect_exports = {};
__export(collect_exports, {
  default: () => collect_default
});
var PICK_R, collect_default;
var init_collect = __esm({
  "../../sdk/mechanics/collect.js"() {
    PICK_R = 1.2;
    collect_default = {
      name: "collect",
      claimMode: "exclusive",
      build(ctx2) {
        const items = ctx2.items.map(([x, z, y = 0], i) => {
          const obj = ctx2.assets.collectible.make();
          obj.position.copy(ctx2.arena.local(x, 0, z));
          obj.userData.baseY = y;
          obj.visible = !ctx2.picked.has(i);
          ctx2.arena.group.add(obj);
          return { obj, gone: ctx2.picked.has(i), x: ctx2.arena.center.x + x, z: ctx2.arena.center.z + z, y };
        });
        return { items };
      },
      update(dt, ctx2, s) {
        const t = performance.now() / 1e3, c = ctx2.round.collectible;
        const lift = ctx2.world.itemCenterY == null ? 0.35 : Math.max(0.35, ctx2.world.itemCenterY - c.heightM / 2);
        for (const it of s.items) {
          if (it.gone) continue;
          const u = it.obj.userData;
          if (c.spin) u.body.rotation.y = t * 1.8 + u.phase;
          u.body.position.y = it.y + lift + (c.bob ? Math.sin(t * 2.4 + u.phase) * 0.18 : 0);
        }
        if (ctx2.phase() === "leaderboard") return;
        const p = ctx2.player.position();
        if (!p) return;
        s.items.forEach((it, i) => {
          if (!it.gone && Math.hypot(p.x - it.x, p.z - it.z) < PICK_R && Math.abs(p.y - it.y - ctx2.arena.center.y) < 2.6) ctx2.claim(i);
        });
      },
      onClaimed(i, by, mine, ctx2, s) {
        const it = s.items[i];
        if (!it || it.gone) return;
        it.gone = true;
        ctx2.burst(it.obj.getWorldPosition(new ctx2.THREE.Vector3()).add(new ctx2.THREE.Vector3(0, 0.5, 0)), ctx2.assets.collectible.color);
        it.obj.visible = false;
      },
      itemsLeft(s) {
        return (s.items || []).filter((i) => !i.gone).length;
      },
      dispose(ctx2, s) {
        for (const it of s.items) ctx2.arena.group.remove(it.obj);
      }
    };
  }
});

// ../../sdk/mechanics/shoot.js
var shoot_exports = {};
__export(shoot_exports, {
  default: () => shoot_default
});
function crosshair(color) {
  const el = document.createElement("div");
  el.setAttribute("data-bonusround-crosshair", "");
  el.style.cssText = "position:fixed;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%);pointer-events:none;z-index:2147483646;transition:transform .08s";
  el.innerHTML = `<svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true">
    <circle cx="17" cy="17" r="11" fill="none" stroke="${color}" stroke-width="3" opacity=".95"/>
    <circle cx="17" cy="17" r="11" fill="none" stroke="#fff" stroke-width="1" opacity=".9"/>
    <circle cx="17" cy="17" r="2.6" fill="#fff" stroke="${color}" stroke-width="1.5"/></svg>`;
  document.body.appendChild(el);
  return el;
}
var SPEED, GRAV, LIFE, COOLDOWN, TRAIL, frac, rand01, shoot_default;
var init_shoot = __esm({
  "../../sdk/mechanics/shoot.js"() {
    SPEED = 24;
    GRAV = 7;
    LIFE = 1.5;
    COOLDOWN = 0.16;
    TRAIL = 6;
    frac = (v) => v - Math.floor(v);
    rand01 = (i) => frac(Math.sin(i * 12.9898 + 78.233) * 43758.5453);
    shoot_default = {
      name: "shoot",
      claimMode: "exclusive",
      claimRange: "arena",
      // the server accepts hits from anywhere in the arena
      build(ctx2) {
        const T = ctx2.THREE, eye = ctx2.world.eyeHeight, H = ctx2.round.collectible.heightM;
        const pal = ctx2.palette;
        const targets = ctx2.items.map(([x, z, y], i) => {
          const obj = ctx2.assets.collectible.make();
          const cy = Number.isFinite(y) && y > 0 ? y : eye * (0.6 + 0.6 * rand01(i));
          obj.position.copy(ctx2.arena.local(x, 0, z));
          obj.userData.glow.visible = false;
          obj.visible = !ctx2.picked.has(i);
          const disc = new T.Mesh(new T.CircleGeometry(Math.max(0.35, H * 0.45), 24), new T.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.18, depthWrite: false }));
          disc.rotation.x = -Math.PI / 2;
          disc.position.y = 0.02;
          obj.add(disc);
          ctx2.arena.group.add(obj);
          return { obj, disc, gone: ctx2.picked.has(i), x: ctx2.arena.center.x + x, z: ctx2.arena.center.z + z, cy, r: Math.max(0.5, H * 0.65) };
        });
        const ballGeo = new T.IcosahedronGeometry(0.16, 2), trailGeo = new T.IcosahedronGeometry(0.1, 1);
        const ballMat = new T.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.6, roughness: 0.35 });
        const trailMat = new T.MeshBasicMaterial({ color: pal.secondary, transparent: true, opacity: 0.5, depthWrite: false });
        const s = { targets, shots: [], cool: 0, ballGeo, trailGeo, ballMat, trailMat, fireQ: 0, cross: crosshair(pal.primary), kick: 0 };
        const fire = () => {
          s.fireQ++;
          s.kick = 1;
        };
        s.onKey = (e) => {
          if ((e.code === "Space" || e.code === "KeyF") && !e.repeat) fire();
        };
        s.onDown = (e) => {
          if (e.button === 0 && !e.target?.closest?.("button,a,input,[data-bonusround]")) fire();
        };
        addEventListener("keydown", s.onKey);
        addEventListener("pointerdown", s.onDown);
        return s;
      },
      update(dt, ctx2, s) {
        const T = ctx2.THREE, t = performance.now() / 1e3, c = ctx2.round.collectible, H = c.heightM;
        for (const tg of s.targets) {
          if (tg.gone) continue;
          const u = tg.obj.userData;
          if (c.spin) u.body.rotation.y = t * 1.6 + u.phase;
          u.body.position.y = tg.cy - H / 2 + Math.sin(t * 2.2 + u.phase) * 0.22;
        }
        s.cross.style.transform = `translate(-50%,-50%) scale(${1 + s.kick * 0.25})`;
        s.kick = Math.max(0, s.kick - dt * 6);
        const playing = ctx2.phase() !== "leaderboard";
        s.cross.style.opacity = playing ? "1" : "0";
        s.cool -= dt;
        const p = ctx2.player.position();
        if (playing && s.fireQ > 0 && s.cool <= 0 && p) {
          s.fireQ = 0;
          s.cool = COOLDOWN;
          this._fire(ctx2, s, p);
        } else if (!playing) s.fireQ = 0;
        for (const sh of s.shots) {
          sh.age += dt;
          sh.v.y -= GRAV * dt;
          sh.trail.unshift(sh.mesh.position.clone());
          sh.trail.length = Math.min(sh.trail.length, TRAIL);
          sh.mesh.position.addScaledVector(sh.v, dt);
          sh.bits.forEach((b, k) => {
            const q = sh.trail[k];
            b.visible = !!q;
            if (q) {
              b.position.copy(q);
              b.scale.setScalar(1 - k / TRAIL);
            }
          });
          const wp = sh.mesh.getWorldPosition(new T.Vector3());
          if (wp.y < ctx2.arena.center.y + 0.05) sh.age = LIFE;
          s.targets.forEach((tg, i) => {
            if (tg.gone || sh.age >= LIFE) return;
            if (Math.hypot(wp.x - tg.x, wp.z - tg.z, wp.y - ctx2.arena.center.y - tg.cy) < tg.r + 0.2) {
              sh.age = LIFE;
              ctx2.burst(wp, ctx2.palette.secondary, 10);
              ctx2.claim(i);
            }
          });
        }
        s.shots = s.shots.filter((sh) => {
          if (sh.age < LIFE) return true;
          ctx2.arena.group.remove(sh.group);
          return false;
        });
        if (!playing || !p) return;
        s.targets.forEach((tg, i) => {
          if (!tg.gone && Math.hypot(p.x - tg.x, p.z - tg.z) < 1.2 && Math.abs(p.y - ctx2.arena.center.y + 0.9 - tg.cy) < 1.4) ctx2.claim(i);
        });
      },
      _fire(ctx2, s, p) {
        const T = ctx2.THREE, cam = ctx2.camera;
        cam.updateMatrixWorld();
        const camPos = cam.getWorldPosition(new T.Vector3()), dir = cam.getWorldDirection(new T.Vector3());
        const fp = ctx2.world.cameraMode === "first-person";
        const origin = fp ? camPos.clone().addScaledVector(dir, 0.4).add(new T.Vector3(0, -0.12, 0)) : new T.Vector3(p.x, p.y + ctx2.world.playerHeightM * 0.72, p.z);
        let aim = camPos.clone().addScaledVector(dir, 25), best = Math.cos(0.18);
        for (const tg of s.targets) {
          if (tg.gone) continue;
          const to = new T.Vector3(tg.x, ctx2.arena.center.y + tg.cy, tg.z).sub(camPos);
          const d = to.length(), cos = to.dot(dir) / Math.max(d, 1e-6);
          if (cos > best && d > 1.5) {
            best = cos;
            aim = camPos.clone().add(to);
          }
        }
        const v = aim.clone().sub(origin);
        const dist2 = v.length();
        v.normalize().multiplyScalar(SPEED);
        v.y += GRAV * dist2 / (2 * SPEED);
        const g = new T.Group();
        const mesh = new T.Mesh(s.ballGeo, s.ballMat);
        g.add(mesh);
        const bits = Array.from({ length: TRAIL }, () => {
          const b = new T.Mesh(s.trailGeo, s.trailMat);
          b.visible = false;
          g.add(b);
          return b;
        });
        mesh.position.copy(ctx2.arena.group.worldToLocal(origin.clone()));
        ctx2.arena.group.add(g);
        s.shots.push({ group: g, mesh, bits, trail: [], v, age: 0 });
        ctx2.audio.play("shoot");
      },
      onClaimed(i, by, mine, ctx2, s) {
        const tg = s.targets[i];
        if (!tg || tg.gone) return;
        tg.gone = true;
        ctx2.burst(tg.obj.getWorldPosition(new ctx2.THREE.Vector3()).add(new ctx2.THREE.Vector3(0, tg.cy, 0)), ctx2.assets.collectible.color, 34);
        tg.obj.visible = false;
      },
      itemsLeft(s) {
        return (s.targets || []).filter((t) => !t.gone).length;
      },
      dispose(ctx2, s) {
        removeEventListener("keydown", s.onKey);
        removeEventListener("pointerdown", s.onDown);
        s.cross.remove();
        for (const tg of s.targets) {
          ctx2.arena.group.remove(tg.obj);
          tg.disc.geometry.dispose();
          tg.disc.material.dispose();
        }
        for (const sh of s.shots) ctx2.arena.group.remove(sh.group);
        s.ballGeo.dispose();
        s.trailGeo.dispose();
        s.ballMat.dispose();
        s.trailMat.dispose();
      }
    };
  }
});

// ../../sdk/mechanics/physics.js
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function surfacesFrom(elements) {
  const out = [];
  (elements || []).forEach((e, i) => {
    if (!e || e.type !== "platform" && e.type !== "ramp" || !Array.isArray(e.pos) || !Array.isArray(e.size)) return;
    const a = num2(e.rotY, 0);
    out.push({
      i,
      el: e,
      type: e.type,
      x: +e.pos[0],
      y: +e.pos[1],
      z: +e.pos[2],
      hw: e.size[0] / 2,
      th: e.size[1],
      hd: e.size[2] / 2,
      rotY: a,
      c: Math.cos(a),
      s: Math.sin(a),
      mv: e.moving || null,
      rise: e.type === "ramp" ? num2(e.rise, 0) : 0,
      extra: !!e.extra
    });
  });
  return out;
}
function surfaceOffset(s, t) {
  const m = s.mv;
  if (!m || !m.amplitude || !m.period) return [0, 0, 0];
  const d = m.amplitude * Math.sin(t / m.period * Math.PI * 2 + (m.phase || 0));
  return m.axis === "y" ? [0, d, 0] : m.axis === "z" ? [0, 0, d] : [d, 0, 0];
}
function surfaceCenter(s, t) {
  const o = surfaceOffset(s, t);
  return [s.x + o[0], s.y + o[1], s.z + o[2]];
}
function toLocal(s, x, z, t) {
  const o = surfaceOffset(s, t);
  const dx = x - s.x - o[0], dz = z - s.z - o[2];
  return [dx * s.c - dz * s.s, dx * s.s + dz * s.c, o];
}
function topAt(s, x, z, t = 0, pad = 0) {
  const [lx, lz, o] = toLocal(s, x, z, t);
  if (Math.abs(lx) > s.hw + pad || Math.abs(lz) > s.hd + pad) return null;
  if (s.type === "ramp") return s.y + o[1] + s.rise * (clamp2(lz / Math.max(1e-6, s.hd), -1, 1) / 2);
  return s.y + o[1];
}
function supportAt(surfs, x, z, y, t = 0, step = STEP_UP, pad = 0.12) {
  let best = null;
  for (const s of surfs) {
    const top = topAt(s, x, z, t, pad);
    if (top === null || top > y + step) continue;
    if (top < y - 40) continue;
    if (!best || top > best.y) best = { y: top, s };
  }
  return best;
}
function wallAt(surfs, x, z, y, h, t = 0) {
  for (const s of surfs) {
    const top = topAt(s, x, z, t, 0.05);
    if (top === null) continue;
    const bottom = top - Math.max(0.15, s.th);
    if (top > y + STEP_UP && bottom < y + h * 0.9) return s;
  }
  return null;
}
function makeBody(x, y, z) {
  return { x, y, z, vx: 0, vy: 0, vz: 0, grounded: true, on: null, ry: Math.PI };
}
function stepBody(b, wish, jump, dt, surfs, t, P, floorY = 0) {
  let ev = null;
  const k = b.grounded ? P.accelK : P.airK;
  b.vx += (wish.x - b.vx) * Math.min(1, k * dt);
  b.vz += (wish.z - b.vz) * Math.min(1, k * dt);
  if (jump && b.grounded && P.canJump !== false) {
    b.vy = P.jumpV0;
    b.grounded = false;
    b.on = null;
    ev = "jumped";
  }
  if (P.carry && b.grounded && b.on?.mv) {
    const a = surfaceOffset(b.on, t), c = surfaceOffset(b.on, t + dt);
    b.x += c[0] - a[0];
    b.z += c[2] - a[2];
    b.y += c[1] - a[1];
  }
  b.vy -= P.gravityMps2 * dt;
  const py = b.y;
  let nx = b.x + b.vx * dt, nz = b.z + b.vz * dt;
  if (wallAt(surfs, nx, nz, Math.min(py, b.y), P.heightM, t + dt)) {
    if (!wallAt(surfs, nx, b.z, py, P.heightM, t + dt)) {
      nz = b.z;
      b.vz = 0;
    } else if (!wallAt(surfs, b.x, nz, py, P.heightM, t + dt)) {
      nx = b.x;
      b.vx = 0;
    } else {
      nx = b.x;
      nz = b.z;
      b.vx = 0;
      b.vz = 0;
    }
  }
  b.x = nx;
  b.z = nz;
  b.y += b.vy * dt;
  const sup = supportAt(surfs, b.x, b.z, Math.max(py, b.y), t + dt);
  const floor = sup ? sup.y : floorY;
  if (floor !== null && floor !== void 0) {
    if (b.y <= floor) {
      if (!b.grounded) ev = sup ? "landed" : "floor";
      else if (!sup && b.on) ev = "floor";
      b.y = floor;
      b.vy = 0;
      b.grounded = true;
      b.on = sup ? sup.s : null;
    } else if (b.grounded && b.y - floor < STEP_UP && b.vy <= 0) {
      b.y = floor;
      b.vy = 0;
      b.on = sup ? sup.s : null;
      if (!sup) ev = "floor";
    } else if (b.grounded) {
      b.grounded = false;
      b.on = null;
    }
  }
  const hs = Math.hypot(b.vx, b.vz);
  if (hs > 0.3) b.ry += wrapAngle(Math.atan2(b.vx, b.vz) - b.ry) * Math.min(1, dt * 12);
  return ev;
}
function claimIndex(elements) {
  const byEl = /* @__PURE__ */ new Map(), list = [];
  (elements || []).forEach((el, k) => {
    if (isClaim(el)) {
      byEl.set(k, list.length);
      list.push(k);
    }
  });
  return { byEl, list };
}
var STEP_UP, clamp2, num2, wrapAngle, CLAIM_TYPES, isClaim;
var init_physics = __esm({
  "../../sdk/mechanics/physics.js"() {
    STEP_UP = 0.35;
    clamp2 = (v, a, b) => Math.max(a, Math.min(b, v));
    num2 = (v, d) => v !== null && v !== "" && v !== void 0 && Number.isFinite(+v) ? +v : d;
    wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    CLAIM_TYPES = ["item", "target", "gate", "checkpoint", "goal", "coin", "finish", "collectible"];
    isClaim = (el) => !!(el && (el.claim === true || el.claim !== false && CLAIM_TYPES.includes(el.type)));
  }
});

// ../../sdk/mechanics/race-rules.js
function trackFrom(layout) {
  const els = layout?.elements || [], m = layout?.meta?.track || {};
  const seq = [];
  for (const el of els) {
    if (!isClaim(el) || !["gate", "checkpoint", "finish"].includes(el.type)) continue;
    seq.push({ kind: el.type === "finish" ? "finish" : el.kind === "lap" ? "lap" : "gate", lap: num2(el.lap, 0), el });
  }
  const gates = els.filter((e) => e.type === "gate" && !num2(e.lap, 0)).sort((a, b) => a.order - b.order);
  const start = els.find((e) => e.type === "start") || null;
  const finish = els.find((e) => e.type === "finish") || null;
  const pts = Array.isArray(m.centerline) && m.centerline.length > 3 ? m.centerline : gates.map((g) => [g.pos[0], g.pos[2]]);
  const closed = m.closed !== false;
  const laps = Math.max(1, Math.round(num2(m.laps, 1)));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const lengthM = cum.at(-1) + (closed ? Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) : 0);
  return { pts, cum, closed, laps, gates, start, finish, seq, lengthM, width: num2(m.widthM, gates[0]?.width || 5) };
}
function crossedLine(px, pz, x, z, el, slack = 0.4) {
  const a = num2(el.rotY, 0), nx = Math.sin(a), nz = Math.cos(a);
  const ox = el.pos[0], oz = el.pos[2];
  const d0 = (px - ox) * nx + (pz - oz) * nz, d1 = (x - ox) * nx + (z - oz) * nz;
  if (!(d0 < 0 && d1 >= 0)) return false;
  const f = d0 / (d0 - d1), cx = px + (x - px) * f, cz = pz + (z - pz) * f;
  const lat = (cx - ox) * nz - (cz - oz) * nx;
  return Math.abs(lat) <= num2(el.width, 5) / 2 + slack;
}
function curvatureRadii(pts, closed, k = 3) {
  const n = pts.length, out = new Array(n).fill(Infinity);
  for (let i = 0; i < n; i++) {
    const ia = closed ? (i - k + n) % n : Math.max(0, i - k), ib = closed ? (i + k) % n : Math.min(n - 1, i + k);
    if (ia === i || ib === i) continue;
    const [ax, az] = pts[ia], [bx, bz] = pts[i], [cx, cz] = pts[ib];
    const ab = Math.hypot(bx - ax, bz - az), bc = Math.hypot(cx - bx, cz - bz), ca = Math.hypot(ax - cx, az - cz);
    const cross = Math.abs((bx - ax) * (cz - az) - (bz - az) * (cx - ax));
    out[i] = cross < 1e-9 ? Infinity : ab * bc * ca / (2 * cross);
  }
  return out;
}
function makeRacer(x, z, ry, opts = {}) {
  return { x, z, y: 0, ry, v: 0, idx: -1, seqI: 0, done: false, finishMs: null, lane: opts.lane || 0, pace: opts.pace || 1, t: 0, lap: 0 };
}
function stepRacer(b, T, dt, P, skill = {}) {
  const pts = T.pts, n = pts.length;
  if (!n) return;
  let best = Math.max(0, b.idx), bd = Infinity;
  if (b.idx < 0) {
    const g = T.seq[b.seqI]?.el;
    let gi = 0, gd = Infinity;
    if (g) pts.forEach(([x, z], j) => {
      const d = Math.hypot(x - g.pos[0], z - g.pos[2]);
      if (d < gd) {
        gd = d;
        gi = j;
      }
    });
    const span = g ? Math.floor(n * 0.4) : n;
    const lead = g ? Math.min(span, Math.round(4 / (T.lengthM / n))) : 0;
    for (let k2 = lead; k2 <= span; k2++) {
      const j = g ? T.closed ? (gi - k2 + n) % n : Math.max(0, gi - k2) : k2 % n;
      const d = Math.hypot(pts[j][0] - b.x, pts[j][1] - b.z);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    b.idx = best;
    bd = Infinity;
  }
  for (let k2 = -2; k2 < 24; k2++) {
    let j = b.idx + k2;
    if (T.closed) j = (j + n) % n;
    else if (j < 0 || j >= n) continue;
    const d = (pts[j][0] - b.x) ** 2 + (pts[j][1] - b.z) ** 2;
    if (d < bd) {
      bd = d;
      best = j;
    }
  }
  b.idx = best;
  const ds = T.lengthM / n;
  const look = clamp2(b.v * 0.42, 1.6, 7.5);
  const ia = T.closed ? (best + Math.round(look / ds)) % n : Math.min(n - 1, best + Math.round(look / ds));
  const ib = T.closed ? (ia + 1) % n : Math.min(n - 1, ia + 1);
  const [tx0, tz0] = pts[ia], [tx1, tz1] = pts[ib];
  let tlx = tz1 - tz0, tlz = -(tx1 - tx0);
  const tl = Math.hypot(tlx, tlz) || 1;
  const lane = num2(skill.lane, b.lane || 0);
  const tx = tx0 + tlx / tl * lane, tz = tz0 + tlz / tl * lane;
  const want = Math.atan2(tx - b.x, tz - b.z);
  const err = wrapAngle(want - b.ry);
  const omega = P.vehicle ? P.turnRateRadS * clamp2(Math.abs(b.v) / 3, 0.15, 1) : P.turnRateRadS;
  b.ry = wrapAngle(b.ry + clamp2(err, -omega * dt, omega * dt));
  const top = (skill.sprint === false ? P.walkMps * (P.vehicle ? 1.3 : 1) : P.sprintMps) * num2(skill.pace, b.pace || 1);
  let vt = top;
  if (P.vehicle) {
    const rad = T.radii || (T.radii = curvatureRadii(pts, T.closed));
    const span = Math.round(clamp2(b.v * 0.9, 2, 12) / ds);
    let rmin = Infinity;
    for (let k2 = 0; k2 <= span; k2++) {
      const j = T.closed ? (best + k2) % n : Math.min(n - 1, best + k2);
      rmin = Math.min(rmin, rad[j]);
    }
    vt = Math.min(vt, Math.max(3.2, P.turnRateRadS * rmin * 1.05));
  }
  vt *= clamp2(Math.cos(err) * 1.15, 0.3, 1);
  const k = vt < b.v ? P.accelK * 2.2 : P.accelK;
  b.v += (vt - b.v) * Math.min(1, k * dt);
  const px = b.x, pz = b.z;
  b.x += Math.sin(b.ry) * b.v * dt;
  b.z += Math.cos(b.ry) * b.v * dt;
  b.t += dt;
  return advance(b, T, px, pz);
}
function advance(b, T, px, pz) {
  if (b.done) return null;
  const s = T.seq[b.seqI];
  if (!s) return null;
  if (!crossedLine(px, pz, b.x, b.z, s.el, 0.6)) return null;
  b.seqI++;
  if (s.kind === "lap") b.lap++;
  if (s.kind === "finish" || b.seqI >= T.seq.length) {
    b.done = true;
    b.finishMs = Math.round(b.t * 1e3);
  }
  return s;
}
function simulateRace(layout, P, { sprint = true, pace = 1, lane = 0, maxS = 40, dt = 1 / 60 } = {}) {
  const T = trackFrom(layout);
  const sp = layout.meta?.spawn || [T.pts[0][0], 0, T.pts[0][1]];
  const b = makeRacer(sp[0], sp[2], num2(layout.meta?.spawnRotY, 0), { lane, pace });
  let steps = 0;
  const maxSteps = Math.round(maxS / dt);
  while (!b.done && steps++ < maxSteps) stepRacer(b, T, dt, P, { sprint, pace, lane });
  return { finished: b.done, timeS: b.done ? b.finishMs / 1e3 : null, crossed: b.seqI, total: T.seq.length, lengthM: T.lengthM, laps: T.laps };
}
function raceScore(b, T) {
  if (b.done) return 1e5 - b.finishMs;
  const s = T?.seq?.[b.seqI];
  const d = s ? Math.hypot(b.x - s.el.pos[0], b.z - s.el.pos[2]) : 0;
  return b.seqI * 100 + Math.max(0, 99 - Math.round(d));
}
function raceDisplay(score, T) {
  if (score >= 5e4) return `${((1e5 - score) / 1e3).toFixed(1)} s`;
  const total = T?.seq?.length || 0;
  return total ? `${Math.floor(score / 100)}/${total}` : `${Math.floor(score / 100)}`;
}
var init_race_rules = __esm({
  "../../sdk/mechanics/race-rules.js"() {
    init_physics();
  }
});

// ../../sdk/mechanics/course-kit.js
function ink(hex2) {
  const n = parseInt(String(hex2 || "#000").slice(1).padEnd(6, "0").slice(0, 6), 16);
  const l = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? "#1b1530" : "#ffffff";
}
function kit(ctx2) {
  const T = ctx2.THREE, pal = ctx2.palette, m = ctx2.manifest || {};
  const brand2 = m.brand?.name || "Sponsored";
  const theme = ctx2.course?.theme || "";
  const owned = [];
  const keep = (x) => {
    owned.push(x);
    return x;
  };
  const mat = (color, o = {}) => keep(new T.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, ...o }));
  const glowMat = (color, o = {}) => keep(new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.4, ...o }));
  const tex = (canvas) => {
    const t = keep(new T.CanvasTexture(canvas));
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  function labelTexture(text = brand2, { bg = pal.primary, fg = null, stripe = pal.secondary, w = 1024, h = 256, sub = "" } = {}) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = stripe;
    g.fillRect(0, 0, w, h * 0.09);
    g.fillRect(0, h * 0.91, w, h * 0.09);
    g.fillStyle = fg || ink(bg);
    let size = h * (sub ? 0.46 : 0.58);
    const label = String(text).toUpperCase();
    do {
      g.font = `900 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      size -= 4;
    } while (g.measureText(label).width > w * 0.9 && size > 12);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, w / 2, sub ? h * 0.42 : h / 2);
    if (sub) {
      g.font = `700 ${h * 0.17}px system-ui, sans-serif`;
      g.globalAlpha = 0.85;
      g.fillText(String(sub).toUpperCase(), w / 2, h * 0.74);
      g.globalAlpha = 1;
    }
    if (m.brand?.logoImg) {
      try {
        g.drawImage(m.brand.logoImg, 16, 16, h - 32, h - 32);
      } catch {
      }
    }
    return tex(c);
  }
  function chevronTexture(a = pal.secondary, b = pal.primary) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = a;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = b;
    g.globalAlpha = 0.55;
    g.beginPath();
    g.moveTo(14, 96);
    g.lineTo(64, 40);
    g.lineTo(114, 96);
    g.lineTo(114, 120);
    g.lineTo(64, 64);
    g.lineTo(14, 120);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 6, 128);
    g.fillRect(122, 0, 6, 128);
    const t = tex(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }
  function checkerTexture(n = 8) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d"), s = 128 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = (i + j) % 2 ? "#111" : "#fff";
      g.fillRect(i * s, j * s, s, s);
    }
    const t = tex(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }
  function product(h, maxW = Infinity) {
    const src = ctx2.assets?.collectible;
    if (!src?.make) return null;
    const g = src.make();
    if (g.userData?.glow) g.userData.glow.visible = false;
    const body = g.userData?.body || g;
    const box = new T.Box3().setFromObject(body);
    const size = box.getSize(new T.Vector3());
    const s = Math.min(h / Math.max(0.05, size.y), maxW / Math.max(0.05, size.x, size.z));
    g.scale.setScalar(s);
    g.userData.h = size.y * s;
    g.userData.w = Math.max(size.x, size.z) * s;
    return g;
  }
  function sign(map, w, h, { lit = false, gap = 0.02 } = {}) {
    const g = new T.Group();
    const m2 = lit ? keep(new T.MeshStandardMaterial({ map, roughness: 0.8 })) : keep(new T.MeshBasicMaterial({ map, toneMapped: false, transparent: true }));
    const geo = keep(new T.PlaneGeometry(w, h));
    for (const face of [-1, 1]) {
      const p = new T.Mesh(geo, m2);
      p.position.z = face * gap;
      p.rotation.y = face < 0 ? Math.PI : 0;
      g.add(p);
    }
    g.userData.material = m2;
    return g;
  }
  function marker(color = pal.accent, size = 1) {
    const g = new T.Group();
    const geo = keep(new T.ConeGeometry(0.45 * size, 0.9 * size, 4));
    const cone = new T.Mesh(geo, glowMat(color));
    cone.rotation.x = Math.PI;
    g.add(cone);
    const ring = new T.Mesh(keep(new T.TorusGeometry(0.75 * size, 0.07 * size, 8, 32)), glowMat("#ffffff", { emissiveIntensity: 0.6 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.7 * size;
    g.add(ring);
    g.userData.t = Math.random() * 6;
    g.renderOrder = 5;
    return g;
  }
  return { T, pal, brand: brand2, theme, mat, glowMat, tex, keep, sign, labelTexture, chevronTexture, checkerTexture, product, marker, dispose: () => {
    for (const o of owned) o.dispose?.();
    owned.length = 0;
  } };
}
function hudChip(ctx2, color) {
  const layer = ctx2.hud?.layer || document.body;
  const el = css(document.createElement("div"), `position:absolute;left:50%;top:134px;transform:translateX(-50%);padding:8px 16px;border-radius:999px;
    background:rgba(20,16,40,.72);color:#fff;font:800 15px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.3px;white-space:nowrap;
    box-shadow:0 6px 18px rgba(0,0,0,.25);border:2px solid ${color};pointer-events:none;z-index:40;transition:opacity .25s;`);
  el.setAttribute("data-bonusround-mech", "");
  layer.appendChild(el);
  let card = null;
  return {
    el,
    set(html) {
      if (el._h !== html) {
        el.innerHTML = html;
        el._h = html;
      }
    },
    show(v) {
      el.style.opacity = v ? "1" : "0";
    },
    /** a big friendly result card (finish / end of round); positive for everyone */
    result(title, sub, where = "top") {
      if (!card) {
        card = css(document.createElement("div"), `position:absolute;left:50%;top:26px;transform:translate(-50%,0) scale(.9);padding:14px 26px;border-radius:18px;
          background:${color};color:${ink(color)};font:900 26px/1.15 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3);
          pointer-events:none;z-index:41;opacity:0;transition:opacity .3s, transform .3s;`);
        card.setAttribute("data-bonusround-mech", "");
        layer.appendChild(card);
      }
      card.style.top = where === "mid" ? "30%" : "26px";
      card.innerHTML = `${esc3(title)}${sub ? `<div style="font-size:15px;font-weight:700;opacity:.9;margin-top:4px">${esc3(sub)}</div>` : ""}`;
      requestAnimationFrame(() => {
        card.style.opacity = "1";
        card.style.transform = "translate(-50%,0) scale(1)";
      });
    },
    hideResult() {
      if (card) {
        card.style.opacity = "0";
      }
    },
    remove() {
      el.remove();
      card?.remove();
    }
  };
}
function tracker(ctx2) {
  const c = ctx2.arena.center;
  const st = { x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0, vx: 0, vz: 0, vy: 0, ok: false, first: true };
  st.update = (dt) => {
    const p = ctx2.player.position();
    if (!p) {
      st.ok = false;
      return st;
    }
    const x = p.x - c.x, y = p.y - c.y, z = p.z - c.z;
    if (st.first) {
      st.px = x;
      st.py = y;
      st.pz = z;
      st.first = false;
    } else {
      st.px = st.x;
      st.py = st.y;
      st.pz = st.z;
    }
    st.x = x;
    st.y = y;
    st.z = z;
    const k = Math.min(1, dt * 12), inv = 1 / Math.max(dt, 1e-3);
    if (Math.hypot(x - st.px, z - st.pz) < 6) {
      st.vx += ((x - st.px) * inv - st.vx) * k;
      st.vz += ((z - st.pz) * inv - st.vz) * k;
      st.vy = (y - st.py) * inv;
    }
    st.ok = true;
    return st;
  };
  return st;
}
function teleport(ctx2, x, y, z) {
  const T = ctx2.THREE, c = ctx2.arena.center, v = new T.Vector3(c.x + x, c.y + y, c.z + z);
  try {
    if (typeof ctx2.player?.teleport === "function") {
      ctx2.player.teleport(v);
      return true;
    }
    const host = typeof window !== "undefined" && window.__SPATIAL_ADS__?.runtime?.host || null;
    if (host?.teleport) {
      host.teleport(v);
      return true;
    }
  } catch {
  }
  return false;
}
function cleanup(ctx2, objs, k) {
  for (const o of objs || []) o?.parent?.remove(o);
  k?.dispose();
}
var css, esc3, claimsOf;
var init_course_kit = __esm({
  "../../sdk/mechanics/course-kit.js"() {
    init_physics();
    css = (el, s) => {
      el.style.cssText = s;
      return el;
    };
    esc3 = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    claimsOf = (layout) => claimIndex(layout?.elements || []);
  }
});

// ../../sdk/mechanics/race.js
var race_exports = {};
__export(race_exports, {
  default: () => race_default,
  raceDisplay: () => raceDisplay,
  raceScore: () => raceScore,
  simulateRace: () => simulateRace,
  stepRacer: () => stepRacer,
  trackFrom: () => trackFrom
});
var usable, race_default, K_brand, claimOf;
var init_race = __esm({
  "../../sdk/mechanics/race.js"() {
    init_collect();
    init_race_rules();
    init_physics();
    init_course_kit();
    init_race_rules();
    usable = (ctx2) => ctx2.layout?.mechanic === "race" && Array.isArray(ctx2.layout.elements) && ctx2.layout.elements.some((e) => e.type === "gate");
    race_default = {
      name: "race",
      claimMode: "personal",
      ordered: true,
      build(ctx2) {
        if (!usable(ctx2)) return { fallback: collect_default.build(ctx2) };
        const K = kit(ctx2), T = ctx2.THREE, pal = ctx2.palette, L = ctx2.layout;
        const track = trackFrom(L), ci = claimsOf(L);
        const root = new T.Group();
        root.position.copy(ctx2.arena.local(0, 0, 0));
        ctx2.arena.group.add(root);
        const H = num2(L.meta?.physics?.heightM, ctx2.world?.playerHeightM || 1.8);
        const pts = track.pts, n = pts.length, w = track.width;
        const pos = [], uv = [], idx = [], edgeL = [], edgeR = [];
        let v = 0;
        for (let i = 0; i <= n; i++) {
          const a = pts[i % n], b = pts[(i + 1) % n], p = pts[(i - 1 + n) % n];
          let tx = b[0] - p[0], tz = b[1] - p[1];
          const tl = Math.hypot(tx, tz) || 1;
          tx /= tl;
          tz /= tl;
          const nx = tz, nz = -tx;
          if (i) v += Math.hypot(a[0] - pts[(i - 1) % n][0], a[1] - pts[(i - 1) % n][1]) / w;
          pos.push(a[0] + nx * w / 2, 0.03, a[1] + nz * w / 2, a[0] - nx * w / 2, 0.03, a[1] - nz * w / 2);
          uv.push(0, v, 1, v);
          edgeL.push([a[0] + nx * (w / 2 + 0.12), a[1] + nz * (w / 2 + 0.12)]);
          edgeR.push([a[0] - nx * (w / 2 + 0.12), a[1] - nz * (w / 2 + 0.12)]);
          if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
        }
        const ribbonGeo = K.keep(new T.BufferGeometry());
        ribbonGeo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
        ribbonGeo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
        ribbonGeo.setIndex(idx);
        ribbonGeo.computeVertexNormals();
        const chev = K.chevronTexture(pal.secondary, "#ffffff");
        const ribbon = new T.Mesh(ribbonGeo, K.mat("#ffffff", { map: chev, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }));
        ribbon.receiveShadow = true;
        root.add(ribbon);
        for (const e of [edgeL, edgeR]) {
          const g = K.keep(new T.BufferGeometry().setFromPoints(e.map(([x, z]) => new T.Vector3(x, 0.06, z))));
          const line = new T.LineLoop(g, K.keep(new T.LineBasicMaterial({ color: pal.accent })));
          root.add(line);
        }
        const gateH = num2(L.elements.find((e) => e.type === "gate")?.height, 3);
        const banner = K.labelTexture(K.brand, { sub: K.theme ? K.theme.slice(0, 40) : "Bonus Round", h: 256 });
        const gates = /* @__PURE__ */ new Map();
        const postMat = K.mat("#ffffff", { emissive: pal.accent, emissiveIntensity: 0.12 }), bandMat = K.mat(pal.primary);
        const mkPillar = () => {
          const g = new T.Group();
          const p = K.product(gateH * 0.95, Math.max(0.9, Math.min(1.4, w * 0.22)));
          if (p && p.userData.h >= gateH * 0.7) {
            g.add(p);
            return g;
          }
          const top = p ? p.userData.h : 0;
          const postH = gateH - top * 0.6;
          const post = new T.Mesh(K.keep(new T.CylinderGeometry(0.13, 0.16, postH, 12)), postMat);
          post.position.y = postH / 2;
          post.castShadow = true;
          g.add(post);
          for (let b = 0; b < 3; b++) {
            const band = new T.Mesh(K.keep(new T.CylinderGeometry(0.17, 0.17, 0.16, 12)), bandMat);
            band.position.y = postH * (0.25 + b * 0.25);
            g.add(band);
          }
          if (p) {
            p.position.y = postH - top * 0.25;
            g.add(p);
          } else {
            const box = new T.Mesh(K.keep(new T.BoxGeometry(0.7, 0.9, 0.7)), [K.mat(pal.primary), K.mat(pal.primary), K.mat("#ffffff"), K.mat(pal.primary), K.mat(pal.primary, { map: banner }), K.mat(pal.primary, { map: banner })]);
            box.position.y = postH + 0.45;
            g.add(box);
          }
          return g;
        };
        const mkArch = (el, kind) => {
          const g = new T.Group();
          g.position.set(el.pos[0], 0, el.pos[2]);
          g.rotation.y = num2(el.rotY, 0);
          const half = num2(el.width, w) / 2 + 0.45;
          for (const s2 of [-1, 1]) {
            const p = mkPillar();
            p.position.x = s2 * half;
            g.add(p);
          }
          const bar = new T.Mesh(K.keep(new T.BoxGeometry(half * 2 + 0.6, 0.18, 0.3)), K.mat(kind === "gate" ? pal.secondary : "#ffffff"));
          bar.position.y = gateH;
          g.add(bar);
          const signMat = K.keep(new T.MeshBasicMaterial({ map: kind === "gate" ? banner : K.checkerTexture(10), toneMapped: false, transparent: true }));
          for (const face of [-1, 1]) {
            const plane = new T.Mesh(K.keep(new T.PlaneGeometry(half * 2 + 0.4, 0.95)), signMat);
            plane.position.set(0, gateH + 0.55, face * 0.16);
            plane.rotation.y = face < 0 ? Math.PI : 0;
            g.add(plane);
          }
          const glow = new T.Mesh(K.keep(new T.PlaneGeometry(half * 2 - 0.4, gateH - 0.2)), K.keep(new T.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })));
          glow.position.y = gateH / 2;
          g.add(glow);
          bar.material = bar.material.clone();
          K.keep(bar.material);
          bar.material.transparent = true;
          root.add(g);
          return { g, glow, bar, el, signMat };
        };
        for (const s2 of track.seq) {
          if (s2.kind === "gate" && !gates.has(s2.el.order)) gates.set(s2.el.order, mkArch(s2.el, "gate"));
        }
        const lineArches = [];
        if (track.start) lineArches.push(mkArch(track.start, "line"));
        if (track.finish && (!track.start || Math.hypot(track.finish.pos[0] - track.start.pos[0], track.finish.pos[2] - track.start.pos[2]) > 1)) lineArches.push(mkArch(track.finish, "line"));
        for (const el of [track.start, track.finish].filter(Boolean)) {
          const m = new T.Mesh(K.keep(new T.PlaneGeometry(num2(el.width, w), 1.2)), K.mat("#ffffff", { map: K.checkerTexture(8), polygonOffset: true, polygonOffsetFactor: -3 }));
          m.rotation.x = -Math.PI / 2;
          m.rotation.z = num2(el.rotY, 0);
          m.position.set(el.pos[0], 0.045, el.pos[2]);
          root.add(m);
        }
        const cones = L.elements.filter((e) => e.type === "decor" && e.kind === "cone");
        if (cones.length) {
          const coneGeo = K.keep(new T.ConeGeometry(0.22 * Math.max(1, H / 1.8), 0.62 * Math.max(1, H / 1.8), 10));
          coneGeo.translate(0, 0.31 * Math.max(1, H / 1.8), 0);
          const im = new T.InstancedMesh(coneGeo, K.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: 0.25 }), cones.length);
          const o = new T.Object3D();
          cones.forEach((c, i) => {
            o.position.set(c.pos[0], 0, c.pos[2]);
            o.updateMatrix();
            im.setMatrixAt(i, o.matrix);
          });
          im.castShadow = true;
          root.add(im);
        }
        for (const b of L.elements.filter((e) => e.type === "bumper")) {
          const r4 = num2(b.radius, 0.8);
          const m = new T.Mesh(K.keep(new T.CylinderGeometry(r4, r4 * 1.05, 0.9, 20)), K.mat(pal.secondary, { roughness: 0.9 }));
          m.position.set(b.pos[0], 0.45, b.pos[2]);
          m.castShadow = true;
          root.add(m);
        }
        const marker = K.marker(pal.accent, Math.max(1, H / 1.8));
        root.add(marker);
        const chip = hudChip(ctx2, pal.primary);
        const s = { K, root, track, ci, gates, lineArches, marker, chip, me: tracker(ctx2), next: 0, done: false, finishS: null, startS: null, pend: -1, endShown: false, chev };
        while (s.next < track.seq.length && ctx2.isClaimed(claimOf(s, ctx2, s.next))) s.next++;
        return s;
      },
      update(dt, ctx2, s) {
        if (s.fallback) return collect_default.update(dt, ctx2, s.fallback);
        const T = ctx2.THREE, t = performance.now() / 1e3, me = s.me.update(dt);
        s.chev.offset.y -= dt * 0.9;
        const seq = s.track.seq, cur = seq[s.next];
        for (const [order, gv] of s.gates) {
          const isNext = cur && cur.kind === "gate" && cur.el.order === order;
          gv.glow.material.opacity += ((isNext ? 0.28 + Math.sin(t * 6) * 0.08 : 0) - gv.glow.material.opacity) * Math.min(1, dt * 8);
        }
        const cam = ctx2.camera.getWorldPosition(new T.Vector3()).sub(ctx2.arena.center);
        for (const gv of [...s.gates.values(), ...s.lineArches]) {
          const d = Math.hypot(cam.x - gv.el.pos[0], cam.z - gv.el.pos[2]);
          const o = d < 4.5 ? 0.15 + 0.85 * Math.max(0, (d - 2.5) / 2) : 1;
          gv.signMat.opacity += (o - gv.signMat.opacity) * Math.min(1, dt * 10);
          gv.bar.material.opacity = gv.signMat.opacity;
        }
        for (const a of s.lineArches) a.glow.material.opacity += ((cur && cur.kind !== "gate" && cur.el === a.el ? 0.3 : 0) - a.glow.material.opacity) * Math.min(1, dt * 8);
        if (cur) {
          s.marker.visible = true;
          s.marker.position.set(cur.el.pos[0], num2(cur.el.height, 3) + 1.6 + Math.sin(t * 3) * 0.25, cur.el.pos[2]);
          s.marker.rotation.y = t * 2;
        } else s.marker.visible = false;
        const playing = ctx2.phase() === "playing" || ctx2.phase() === "intro";
        if (playing && s.startS === null && ctx2.phase() === "playing") s.startS = ctx2.time.elapsed();
        if (playing && me.ok && cur) {
          const el = cur.el, i = claimOf(s, ctx2, s.next);
          const a = num2(el.rotY, 0), along = (me.x - el.pos[0]) * Math.sin(a) + (me.z - el.pos[2]) * Math.cos(a);
          const near = Math.hypot(me.x - el.pos[0], me.z - el.pos[2]) < Math.min(3.6, num2(el.width, 4) / 2 + 1.4) && along > -1.2;
          if (i !== void 0 && (crossedLine(me.px, me.pz, me.x, me.z, el, 0.8) || near)) ctx2.claim(i);
        }
        const lapsRun = num2(ctx2.layout.meta?.track?.lapsRun, s.track.laps);
        const lap = Math.min(Math.ceil(lapsRun), (cur?.lap ?? Math.ceil(lapsRun) - 1) + 1);
        const gatesTotal = seq.length, clock = s.done ? s.finishS : Math.max(0, ctx2.time.elapsed() - (s.startS ?? ctx2.time.elapsed()));
        if (ctx2.phase() === "leaderboard") {
          s.chip.show(false);
          if (!s.endShown) {
            s.endShown = true;
            if (s.done) s.chip.result(`Finished in ${s.finishS.toFixed(1)} s!`, `${K_brand(ctx2)} \xB7 great race`);
            else s.chip.result(s.next ? `${s.next}/${gatesTotal} gates. Great driving!` : "Thanks for racing!", `Presented by ${K_brand(ctx2)}`);
          }
        } else {
          s.chip.show(true);
          s.chip.set(s.done ? `FINISHED \xB7 ${clock.toFixed(1)} s` : `${lapsRun > 1 ? `LAP ${lap}/${Math.ceil(lapsRun)} \xB7 ` : ""}GATE ${Math.min(s.next + 1, gatesTotal)}/${gatesTotal} \xB7 ${clock.toFixed(1)} s`);
        }
      },
      onClaimed(i, by, mine, ctx2, s) {
        if (s.fallback) return collect_default.onClaimed(i, by, mine, ctx2, s.fallback);
        if (!mine) return;
        const seq = s.track.seq, els = ctx2.layout.elements;
        const k = seq.findIndex((q2, j) => j >= s.next && s.ci.byEl.get(els.indexOf(q2.el)) === i);
        if (k < 0) return;
        const q = seq[k];
        s.next = k + 1;
        const p = ctx2.arena.local(q.el.pos[0], num2(q.el.height, 3) * 0.6, q.el.pos[2]);
        ctx2.burst(s.root.parent.localToWorld(p.clone()), q.kind === "gate" ? ctx2.palette.accent : ctx2.palette.secondary, q.kind === "finish" ? 60 : 22);
        if (q.kind === "lap") ctx2.hud.toast("Lap!");
        if (q.kind === "finish") {
          s.done = true;
          s.finishS = Math.max(0.1, ctx2.time.elapsed() - (s.startS ?? 0));
          s.chip.result(`FINISHED! ${s.finishS.toFixed(1)} s`, K_brand(ctx2), "mid");
          setTimeout(() => s.chip.hideResult(), 2600);
        }
      },
      itemsLeft(s) {
        return s.fallback ? collect_default.itemsLeft(s.fallback) : s.track.seq.length - s.next;
      },
      dispose(ctx2, s) {
        if (s.fallback) return collect_default.dispose(ctx2, s.fallback);
        s.chip.remove();
        cleanup(ctx2, [s.root], s.K);
      }
    };
    K_brand = (ctx2) => ctx2.manifest?.brand?.name || "Bonus Round";
    claimOf = (s, ctx2, k) => {
      const q = s.track.seq[k];
      return q ? s.ci.byEl.get(ctx2.layout.elements.indexOf(q.el)) : void 0;
    };
  }
});

// ../../sdk/mechanics/platform-rules.js
function courseFrom(layout) {
  const els = layout?.elements || [];
  const surfs = surfacesFrom(els);
  const path = surfs.filter((s) => !s.extra && Number.isInteger(s.el.order)).sort((a, b) => a.el.order - b.el.order);
  const checkpoints = els.filter((e) => e.type === "checkpoint").sort((a, b) => a.order - b.order);
  const finish = els.find((e) => e.type === "finish") || null;
  const pickups = els.filter((e) => e.type === "pickup");
  return { surfs, path, checkpoints, finish, pickups, fallY: num2(layout?.meta?.fallY, 0.12) };
}
function platformBrain(b, C, t, P, mem2, skill = {}) {
  if (b.grounded && b.on) {
    const pi = pathIndex(C, b.on);
    if (pi > mem2.k) mem2.k = pi;
  }
  const next = C.path[mem2.k + 1] || null;
  const tgt = next || C.path[mem2.k] || null;
  if (!tgt) return { wish: { x: 0, z: 0 }, jump: false };
  const lead = num2(skill.lead, 0.25);
  const [ax, , az] = surfaceCenter(tgt, t + lead);
  const jx = num2(skill.aimX, 0), jz = num2(skill.aimZ, 0);
  let dx = ax + jx - b.x, dz = az + jz - b.z;
  const d = Math.hypot(dx, dz);
  const speed = (skill.sprint ? P.sprintMps : P.walkMps) * num2(skill.pace, 1);
  if (d < 0.25) return { wish: { x: 0, z: 0 }, jump: false };
  dx /= d;
  dz /= d;
  const wish = { x: dx * speed, z: dz * speed };
  let jump = false;
  if (b.grounded && next && b.on !== next) {
    const la = 0.22 + Math.hypot(b.vx, b.vz) * 0.045;
    const fx = b.x + dx * la, fz = b.z + dz * la;
    const ahead = supportAt(C.surfs, fx, fz, b.y, t, 0.45, 0);
    const gapAhead = !ahead || ahead.y < b.y - 0.3;
    const wall = wallAt(C.surfs, fx, fz, b.y, P.heightM, t);
    jump = gapAhead && (!ahead || ahead.s !== next) || !!wall;
    if (skill.hesitate && jump && Math.random() < skill.hesitate) jump = false;
  }
  return { wish, jump };
}
function checkpointFor(C, mem2) {
  let best = C.checkpoints[0] || null;
  for (const cp of C.checkpoints) if (Number.isInteger(cp.platform) && cp.platform <= mem2.k) best = cp;
  return best ? best.pos : C.path[0] ? [C.path[0].x, C.path[0].y, C.path[0].z] : [0, 0, 0];
}
function hopTest(C, from, to, P, { t0 = 0, sprint = false, dt = 1 / 120, maxS = 4 } = {}) {
  const [x, y, z] = surfaceCenter(from, t0);
  const b = makeBody(x, y, z);
  b.on = from;
  const C2 = { ...C, path: [from, to] };
  const mem2 = { k: 0 };
  let t = t0;
  for (let i = 0; i < maxS / dt; i++) {
    const { wish, jump } = platformBrain(b, C2, t, P, mem2, { sprint, lead: 0.2 });
    const ev = stepBody(b, wish, jump, dt, C.surfs, t, P, 0);
    t += dt;
    if (b.grounded && b.on === to) return { ok: true, timeS: t - t0 };
    if (ev === "floor" || b.grounded && !b.on) return { ok: false, reason: "fell", timeS: t - t0 };
  }
  return { ok: false, reason: "timeout", timeS: maxS };
}
function simulateCourse(layout, P, { sprint = false, pace = 1, maxS = 40, dt = 1 / 120 } = {}) {
  const C = courseFrom(layout);
  const s0 = C.path[0];
  if (!s0) return { finished: false, timeS: null, falls: 0, failedAt: [] };
  const sp = layout.meta?.spawn || [s0.x, s0.y, s0.z];
  const b = makeBody(sp[0], sp[1], sp[2]);
  const mem2 = { k: 0 };
  const failedAt = [];
  let falls = 0, t = 0;
  const last = C.path.at(-1);
  for (let i = 0; i < maxS / dt; i++) {
    const { wish, jump } = platformBrain(b, C, t, P, mem2, { sprint, pace });
    stepBody(b, wish, jump, dt, C.surfs, t, P, 0);
    t += dt;
    if (b.grounded && b.on === last) return { finished: true, timeS: Math.round(t * 100) / 100, falls, failedAt };
    if (b.grounded && !b.on && b.y <= C.fallY && t > 0.3) {
      falls++;
      failedAt.push(mem2.k);
      const p = checkpointFor(C, mem2);
      Object.assign(b, makeBody(p[0], p[1] + 0.05, p[2]));
      if (falls > 12) break;
    }
  }
  return { finished: false, timeS: null, falls, failedAt };
}
function platformScore(st) {
  if (st.finishMs != null) return 1e5 - st.finishMs + (st.bonus || 0) * 10;
  return (st.k || 0) * 100 + (st.bonus || 0) * 10;
}
function platformDisplay(score, total) {
  if (score >= 5e4) return `${((1e5 - score) / 1e3).toFixed(1)} s`;
  return total ? `${Math.floor(score / 100)}/${total}` : `${Math.floor(score / 100)}`;
}
var pathIndex;
var init_platform_rules = __esm({
  "../../sdk/mechanics/platform-rules.js"() {
    init_physics();
    pathIndex = (C, s) => s ? C.path.indexOf(s) : -1;
  }
});

// ../../sdk/mechanics/platform.js
var platform_exports = {};
__export(platform_exports, {
  courseFrom: () => courseFrom,
  default: () => platform_default,
  hopTest: () => hopTest,
  platformBrain: () => platformBrain,
  platformDisplay: () => platformDisplay,
  platformScore: () => platformScore,
  simulateCourse: () => simulateCourse,
  surfaceSupportAt: () => supportAt
});
function checkpointPos(s) {
  let best = s.C.checkpoints[0];
  for (const cp of s.C.checkpoints) if (cp.platform <= s.k) best = cp;
  return best ? best.pos : [s.C.path[0].x, s.C.path[0].y, s.C.path[0].z];
}
function addBridge(ctx2, s, hop) {
  const a = s.C.path[hop], b = s.C.path[hop + 1];
  if (!a || !b) return;
  const T = ctx2.THREE;
  const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
  const el = { type: "ramp", pos: [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], size: [Math.min(a.hw, b.hw) * 1.2, 0.2, len], rotY: Math.atan2(dx, dz), rise: b.y - a.y };
  const surf = { i: -1, el, type: "ramp", x: el.pos[0], y: el.pos[1], z: el.pos[2], hw: el.size[0] / 2, th: 0.2, hd: len / 2, rotY: el.rotY, c: Math.cos(el.rotY), s: Math.sin(el.rotY), mv: null, rise: el.rise, extra: true };
  s.surfs.push(surf);
  const geo = s.K.keep(new T.BoxGeometry(el.size[0], 0.2, len));
  const m = new T.Mesh(geo, s.K.mat(ctx2.palette.accent, { transparent: true, opacity: 0.75, emissive: ctx2.palette.accent, emissiveIntensity: 0.35 }));
  m.position.set(el.pos[0], el.pos[1] - 0.1, el.pos[2]);
  m.rotation.order = "YXZ";
  m.rotation.y = el.rotY;
  m.rotation.x = -Math.atan2(el.rise, len);
  s.root.add(m);
  s.bridges.push(m);
  ctx2.hud.toast("A foam bridge appeared!");
}
var usable2, brandOf, platform_default;
var init_platform = __esm({
  "../../sdk/mechanics/platform.js"() {
    init_collect();
    init_platform_rules();
    init_physics();
    init_course_kit();
    init_platform_rules();
    init_physics();
    usable2 = (ctx2) => ctx2.layout?.mechanic === "platform" && Array.isArray(ctx2.layout.elements) && ctx2.layout.elements.some((e) => e.type === "platform");
    brandOf = (ctx2) => ctx2.manifest?.brand?.name || "Bonus Round";
    platform_default = {
      name: "platform",
      claimMode: "personal",
      build(ctx2) {
        if (!usable2(ctx2)) return { fallback: collect_default.build(ctx2) };
        const K = kit(ctx2), T = ctx2.THREE, pal = ctx2.palette, L = ctx2.layout;
        const C = courseFrom(L), ci = claimsOf(L);
        const H = num2(L.meta?.physics?.heightM, ctx2.world?.playerHeightM || 1.8);
        const root = new T.Group();
        root.position.copy(ctx2.arena.local(0, 0, 0));
        ctx2.arena.group.add(root);
        const R = ctx2.arena.radius;
        const foamC = document.createElement("canvas");
        foamC.width = foamC.height = 256;
        const fg = foamC.getContext("2d");
        fg.fillStyle = pal.accent;
        fg.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 90; i++) {
          fg.globalAlpha = 0.18 + Math.random() * 0.25;
          fg.fillStyle = "#ffffff";
          fg.beginPath();
          fg.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 18, 0, Math.PI * 2);
          fg.fill();
        }
        const foamTex = K.tex(foamC);
        foamTex.wrapS = foamTex.wrapT = T.RepeatWrapping;
        foamTex.repeat.set(R / 3, R / 3);
        const foam = new T.Mesh(K.keep(new T.CircleGeometry(R - 0.2, 72)), K.mat("#ffffff", { map: foamTex, transparent: true, opacity: 0.82, roughness: 0.95, emissive: pal.accent, emissiveIntensity: 0.12, polygonOffset: true, polygonOffsetFactor: -2 }));
        foam.rotation.x = -Math.PI / 2;
        foam.position.y = 0.035;
        root.add(foam);
        const lid = K.labelTexture(K.brand, { bg: pal.primary, stripe: pal.secondary, w: 512, h: 256 });
        const side = K.mat(pal.secondary, { roughness: 0.55 }), under2 = K.mat(pal.background || pal.primary, { roughness: 0.8 });
        const topMat = K.mat("#ffffff", { map: lid, roughness: 0.9, envMapIntensity: 0.3 });
        const startMat = K.mat("#ffffff", { map: K.checkerTexture(6), roughness: 0.9, envMapIntensity: 0.3 });
        const vis = C.surfs.map((s) => {
          const g = new T.Group();
          g.position.set(s.x, s.y, s.z);
          g.rotation.y = s.rotY;
          const th = Math.max(0.12, s.th);
          const isStart = s.el.role === "start";
          const box = new T.Mesh(K.keep(new T.BoxGeometry(s.hw * 2, th, s.hd * 2)), [side, side, isStart ? startMat : topMat, under2, side, side]);
          box.position.y = -th / 2;
          box.castShadow = true;
          box.receiveShadow = true;
          g.add(box);
          const rim = new T.Mesh(K.keep(new T.BoxGeometry(s.hw * 2 + 0.12, 0.08, s.hd * 2 + 0.12)), K.mat("#ffffff", { emissive: pal.accent, emissiveIntensity: 0.25 }));
          rim.position.y = -0.07;
          g.add(rim);
          if (!isStart && s.y > 0.9) {
            const ph = Math.min(s.hw, s.hd) * 1.5;
            const prod = K.product(ph);
            if (prod) {
              prod.position.y = -th - ph * 0.98;
              g.add(prod);
            } else {
              const cup = new T.Mesh(K.keep(new T.CylinderGeometry(Math.min(s.hw, s.hd) * 0.8, Math.min(s.hw, s.hd) * 0.5, ph, 20)), K.mat(pal.primary));
              cup.position.y = -th - ph / 2;
              g.add(cup);
            }
          }
          root.add(g);
          return { s, g };
        });
        const flagTex = K.labelTexture("Checkpoint", { bg: "#ffffff", stripe: pal.accent, fg: "#1b1530", w: 512, h: 256 });
        const flags = C.checkpoints.map((cp) => {
          const g = new T.Group();
          const surf = C.path[cp.platform];
          const off = surf ? Math.min(surf.hw, surf.hd) * 0.72 : 0.8;
          const a = num2(cp.rotY, 0);
          g.position.set(cp.pos[0] + Math.cos(a) * off, cp.pos[1], cp.pos[2] - Math.sin(a) * off);
          const pole = new T.Mesh(K.keep(new T.CylinderGeometry(0.05, 0.05, H * 1.4, 8)), K.mat("#ffffff"));
          pole.position.y = H * 0.7;
          const cloth = K.sign(flagTex, H * 0.75, H * 0.38, { lit: true });
          cloth.position.set(H * 0.38, H * 1.2, 0);
          g.add(pole, cloth);
          g.rotation.y = a;
          g.visible = cp.order > 0;
          root.add(g);
          return { g, cloth, cp };
        });
        const fin = C.finish;
        let arch = null;
        if (fin) {
          arch = new T.Group();
          arch.position.set(fin.pos[0], fin.pos[1], fin.pos[2]);
          arch.rotation.y = num2(fin.rotY, 0);
          const half = num2(fin.width, 2.4) / 2, hh = num2(fin.height, 2.6);
          for (const sx of [-1, 1]) {
            const p = new T.Mesh(K.keep(new T.BoxGeometry(0.22, hh, 0.22)), K.mat(pal.secondary));
            p.position.set(sx * half, hh / 2, 0);
            arch.add(p);
          }
          const sign = K.sign(K.labelTexture("Finish", { sub: K.brand, bg: pal.primary }), half * 2 + 0.4, 0.8);
          sign.position.y = hh + 0.3;
          arch.add(sign);
          root.add(arch);
        }
        const pickups = L.elements.map((el, k) => ({ el, i: ci.byEl.get(k) })).filter((x) => x.el.type === "pickup" && x.i !== void 0).map(({ el, i }) => {
          const obj = ctx2.assets.collectible.make();
          obj.position.set(el.pos[0], el.pos[1], el.pos[2]);
          obj.visible = !ctx2.isClaimed(i);
          root.add(obj);
          return { el, i, obj, gone: ctx2.isClaimed(i) };
        });
        const claimEls = L.elements.map((el, k) => ({ el, i: ci.byEl.get(k) })).filter((x) => x.i !== void 0 && (x.el.type === "checkpoint" || x.el.type === "finish"));
        const marker = K.marker(pal.accent, Math.max(1, H / 1.8));
        root.add(marker);
        const chip = hudChip(ctx2, pal.primary);
        return {
          K,
          root,
          C,
          ci,
          vis,
          flags,
          arch,
          pickups,
          claimEls,
          marker,
          chip,
          me: tracker(ctx2),
          surfs: [...C.surfs],
          t: 0,
          H,
          k: 0,
          falls: 0,
          fallsAt: /* @__PURE__ */ new Map(),
          bridges: [],
          lastFallAt: -9,
          done: false,
          finishS: null,
          endShown: false,
          stood: false,
          bonus: 0,
          startS: null
        };
      },
      /** The surface hook: world (x, z, y) → world top of the highest walkable surface ≤ y + 0.35, or null. */
      supportAt(x, z, y, ctx2, s) {
        if (!s || s.fallback || !s.surfs) return null;
        const c = ctx2.arena.center;
        const hit = supportAt(s.surfs, x - c.x, z - c.z, y - c.y, s.t, STEP_UP);
        return hit ? hit.y + c.y : null;
      },
      update(dt, ctx2, s) {
        if (s.fallback) return collect_default.update(dt, ctx2, s.fallback);
        const T = ctx2.THREE, tt = performance.now() / 1e3;
        s.t += dt;
        for (const v of s.vis) if (v.s.mv) {
          const o = surfaceOffset(v.s, s.t);
          v.g.position.set(v.s.x + o[0], v.s.y + o[1], v.s.z + o[2]);
        }
        const me = s.me.update(dt);
        const phase = ctx2.phase(), playing = phase === "playing" || phase === "intro";
        if (s.startS === null && phase === "playing") s.startS = ctx2.time.elapsed();
        let on = null;
        if (me.ok) {
          const hit = supportAt(s.surfs, me.x, me.z, me.y + 0.05, s.t, STEP_UP);
          if (hit && Math.abs(me.y - hit.y) < 0.12) on = hit.s;
          const pi = on ? s.C.path.indexOf(on) : -1;
          if (pi >= 0) {
            s.stood = true;
            if (pi > s.k) s.k = pi;
          }
        }
        for (const p of s.pickups) {
          if (p.gone) continue;
          const u = p.obj.userData;
          if (u.body) {
            u.body.rotation.y = tt * 2 + u.phase;
            u.body.position.y = 0.15 + Math.sin(tt * 2.6 + u.phase) * 0.15;
          }
          if (playing && me.ok && Math.hypot(me.x - p.el.pos[0], me.z - p.el.pos[2]) < num2(p.el.radius, 1) && Math.abs(me.y + s.H * 0.5 - p.el.pos[1]) < s.H * 0.9) ctx2.claim(p.i);
        }
        if (playing && me.ok && on) {
          for (const { el, i } of s.claimEls) {
            if (ctx2.isClaimed(i)) continue;
            const surf = el.type === "finish" ? s.C.path.at(-1) : s.C.path[el.platform];
            if (surf === on) ctx2.claim(i);
          }
        }
        if (playing && me.ok && me.y < (s.C.fallY ?? 0.12) + 0.02 && !on && (s.stood || ctx2.time.elapsed() > 1.2) && ctx2.time.elapsed() - s.lastFallAt > 0.8) {
          s.lastFallAt = ctx2.time.elapsed();
          s.falls++;
          const hop = s.k;
          s.fallsAt.set(hop, (s.fallsAt.get(hop) || 0) + 1);
          const cp = checkpointPos(s);
          ctx2.burst(ctx2.arena.group.localToWorld(ctx2.arena.local(me.x, 0.3, me.z)), ctx2.palette.accent, 26);
          const moved = teleport(ctx2, cp[0], cp[1] + 0.08, cp[2]);
          ctx2.hud.toast(moved ? "Whoosh! Back to your checkpoint" : "Hop back on the start pad!");
          if (s.fallsAt.get(hop) === 2) addBridge(ctx2, s, hop);
        }
        const next = s.C.path[Math.min(s.k + 1, s.C.path.length - 1)];
        if (next && !s.done) {
          const o = surfaceOffset(next, s.t);
          s.marker.visible = true;
          s.marker.position.set(next.x + o[0], next.y + o[1] + s.H * 1.3 + Math.sin(tt * 3) * 0.2, next.z + o[2]);
          s.marker.rotation.y = tt * 2;
        } else s.marker.visible = false;
        const cps = s.C.checkpoints.filter((c) => c.order > 0), reached = cps.filter((c) => c.platform <= s.k).length;
        if (phase === "leaderboard") {
          s.chip.show(false);
          if (!s.endShown) {
            s.endShown = true;
            if (s.done) s.chip.result(`You made it in ${s.finishS.toFixed(1)} s!`, `${brandOf(ctx2)} \xB7 top hopping`);
            else s.chip.result(reached ? `Checkpoint ${reached}/${cps.length}. Nice hops!` : "Thanks for hopping in!", `Presented by ${brandOf(ctx2)}`);
          }
        } else {
          s.chip.show(true);
          const clock = s.done ? s.finishS : Math.max(0, ctx2.time.elapsed() - (s.startS ?? ctx2.time.elapsed()));
          s.chip.set(s.done ? `FINISHED \xB7 ${clock.toFixed(1)} s${s.bonus ? ` \xB7 ${s.bonus} bonus` : ""}` : `REACH THE FINISH \xB7 checkpoint ${reached}/${cps.length}${s.bonus ? ` \xB7 bonus ${s.bonus}` : ""}`);
        }
      },
      onClaimed(i, by, mine, ctx2, s) {
        if (s.fallback) return collect_default.onClaimed(i, by, mine, ctx2, s.fallback);
        if (!mine) return;
        const p = s.pickups.find((q) => q.i === i);
        if (p && !p.gone) {
          p.gone = true;
          p.obj.visible = false;
          s.bonus++;
          ctx2.burst(p.obj.getWorldPosition(new ctx2.THREE.Vector3()).add(new ctx2.THREE.Vector3(0, 0.5, 0)), ctx2.assets.collectible.color, 30);
          return;
        }
        const ce = s.claimEls.find((q) => q.i === i);
        if (!ce) return;
        if (ce.el.type === "checkpoint") {
          const f = s.flags.find((q) => q.cp === ce.el);
          if (f) {
            const mm = f.cloth.userData.material;
            mm.emissive?.set(ctx2.palette.accent);
            mm.emissiveIntensity = 0.5;
          }
          ctx2.hud.toast("Checkpoint!");
        } else {
          s.done = true;
          s.finishS = Math.max(0.1, ctx2.time.elapsed() - (s.startS ?? 0));
          s.chip.result(`FINISHED! ${s.finishS.toFixed(1)} s`, brandOf(ctx2), "mid");
          setTimeout(() => s.chip.hideResult(), 2600);
        }
        ctx2.burst(ctx2.arena.group.localToWorld(ctx2.arena.local(ce.el.pos[0], ce.el.pos[1] + 1, ce.el.pos[2])), ctx2.palette.secondary, ce.el.type === "finish" ? 70 : 26);
      },
      itemsLeft(s) {
        return s.fallback ? collect_default.itemsLeft(s.fallback) : s.claimEls.length + s.pickups.length - (s.done ? s.claimEls.length : s.C.checkpoints.filter((c) => c.order > 0 && c.platform <= s.k).length) - s.bonus;
      },
      dispose(ctx2, s) {
        if (s.fallback) return collect_default.dispose(ctx2, s.fallback);
        s.chip.remove();
        for (const p of s.pickups) p.obj.parent?.remove(p.obj);
        cleanup(ctx2, [s.root], s.K);
      }
    };
  }
});

// ../../sdk/mechanics/sports-rules.js
function pitchFrom(layout) {
  const els = layout?.elements || [];
  const goal = els.find((e) => e.type === "goal") || null;
  const balls = els.filter((e) => e.type === "ball");
  const R = num2(layout?.meta?.arenaRadius, 16);
  return { goal, balls, R, bumpers: els.filter((e) => e.type === "bumper") };
}
function makeBall(spot) {
  const r4 = num2(spot.radius, 0.45);
  return { x: spot.pos[0], y: r4, z: spot.pos[2], vx: 0, vz: 0, r: r4, home: [spot.pos[0], spot.pos[2]], cool: 0, spin: 0 };
}
function goalFrame(g) {
  const a = num2(g.rotY, 0), nx = Math.sin(a), nz = Math.cos(a);
  return { x: g.pos[0], z: g.pos[2], nx, nz, lx: nz, lz: -nx, hw: g.size[0] / 2, h: g.size[1], depth: g.size[2] };
}
function stepBall(ball, dt, pushers, pitch) {
  if (ball.cool > 0) {
    ball.cool -= dt;
    if (ball.cool <= 0) {
      [ball.x, ball.z] = ball.home;
      ball.vx = ball.vz = 0;
    }
    return null;
  }
  for (const p of pushers) {
    const dx = ball.x - p.x, dz = ball.z - p.z, d = Math.hypot(dx, dz), min = ball.r + (p.r || 0.4);
    if (d < min && d > 1e-6) {
      const nx = dx / d, nz = dz / d;
      ball.x = p.x + nx * min;
      ball.z = p.z + nz * min;
      const pv = (p.vx || 0) * nx + (p.vz || 0) * nz;
      const bv = ball.vx * nx + ball.vz * nz;
      const want = Math.min(14, Math.max(0, pv) * 1.22 + 1.1);
      if (bv < want) {
        ball.vx += nx * (want - bv);
        ball.vz += nz * (want - bv);
      }
    }
  }
  const px = ball.x, pz = ball.z;
  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  const sp = Math.hypot(ball.vx, ball.vz);
  ball.spin += sp / ball.r * dt;
  const fr = Math.max(0, sp - 3.2 * dt) / (sp || 1);
  ball.vx *= fr;
  ball.vz *= fr;
  const R = pitch.R - 0.9 - ball.r, rr = Math.hypot(ball.x, ball.z);
  if (rr > R) {
    const nx = ball.x / rr, nz = ball.z / rr, v = ball.vx * nx + ball.vz * nz;
    ball.x = nx * R;
    ball.z = nz * R;
    if (v > 0) {
      ball.vx -= 1.6 * v * nx;
      ball.vz -= 1.6 * v * nz;
    }
  }
  for (const bp of pitch.bumpers || []) {
    const dx = ball.x - bp.pos[0], dz = ball.z - bp.pos[2], d = Math.hypot(dx, dz), min = num2(bp.radius, 0.6) + ball.r;
    if (d < min && d > 1e-6) {
      const nx = dx / d, nz = dz / d, v = ball.vx * nx + ball.vz * nz;
      ball.x = bp.pos[0] + nx * min;
      ball.z = bp.pos[2] + nz * min;
      if (v < 0) {
        ball.vx -= 1.7 * v * nx;
        ball.vz -= 1.7 * v * nz;
      }
    }
  }
  const g = pitch.goal;
  if (!g) return null;
  const F = goalFrame(g);
  const d0 = (px - F.x) * F.nx + (pz - F.z) * F.nz, d1 = (ball.x - F.x) * F.nx + (ball.z - F.z) * F.nz;
  const lat = (ball.x - F.x) * F.lx + (ball.z - F.z) * F.lz;
  if (d0 >= 0 && d1 < 0) {
    if (Math.abs(lat) < F.hw - ball.r * 0.5) {
      ball.cool = 0.9;
      ball.vx *= 0.2;
      ball.vz *= 0.2;
      return "goal";
    }
    const v = ball.vx * F.nx + ball.vz * F.nz;
    ball.x -= F.nx * (d1 - 0.02);
    ball.z -= F.nz * (d1 - 0.02);
    ball.vx -= 1.6 * v * F.nx;
    ball.vz -= 1.6 * v * F.nz;
  }
  if (d1 < 0 && d1 > -F.depth && Math.abs(lat) >= F.hw - ball.r * 0.5 && Math.abs(lat) < F.hw + ball.r) {
    const s = Math.sign(lat) || 1;
    ball.x += F.lx * s * (F.hw + ball.r - Math.abs(lat));
    ball.z += F.lz * s * (F.hw + ball.r - Math.abs(lat));
  }
  return null;
}
function strikerBrain(me, ball, pitch, P, skill = {}) {
  const F = goalFrame(pitch.goal);
  const aimLat = num2(skill.aim, 0) * F.hw * 0.5;
  const gx = F.x + F.lx * aimLat - F.nx * 0.6, gz = F.z + F.lz * aimLat - F.nz * 0.6;
  let tx = gx - ball.x, tz = gz - ball.z;
  const tl = Math.hypot(tx, tz) || 1;
  tx /= tl;
  tz /= tl;
  const px = -tz, pz = tx;
  const rx = me.x - ball.x, rz = me.z - ball.z;
  const a = rx * tx + rz * tz, b = rx * px + rz * pz;
  const reach = ball.r + (me.r || 0.4);
  const top = (skill.sprint === false ? P.walkMps : P.sprintMps) * num2(skill.pace, 1);
  let wx, wz, speed = top;
  if (a < -reach * 0.4 && Math.abs(b) < 0.3 + -a * 0.25) {
    wx = tx - px * b * 1.8;
    wz = tz - pz * b * 1.8;
    speed = Math.min(top, 10);
  } else {
    const back = reach + 0.7 + Math.abs(b) * 0.4;
    let ax = ball.x - tx * back, az = ball.z - tz * back;
    const side = b >= 0 ? 1 : -1;
    const wy = clamp2((reach + 1 - Math.abs(b)) / 0.9, 0, 1) * clamp2((a + reach + 0.4) / 0.8, 0, 1);
    if (wy > 0) {
      const sx = ball.x + px * side * (reach + 1) - tx * 0.3, sz = ball.z + pz * side * (reach + 1) - tz * 0.3;
      ax += (sx - ax) * wy;
      az += (sz - az) * wy;
    }
    wx = ax - me.x;
    wz = az - me.z;
    const d = Math.hypot(wx, wz);
    speed = Math.min(top, d * 3 + 1.2);
  }
  const l = Math.hypot(wx, wz) || 1;
  return { x: wx / l * speed, z: wz / l * speed };
}
function simulateGoals(layout, P, { seconds = 13, sprint = true, ballIndex = 0, dt = 1 / 60 } = {}) {
  const pitch = pitchFrom(layout);
  if (!pitch.goal || !pitch.balls.length) return { goals: 0, firstGoalS: null };
  const ball = makeBall(pitch.balls[ballIndex % pitch.balls.length]);
  const sp = (ballIndex ? layout.meta?.botSpawns?.[ballIndex - 1] : layout.meta?.spawn) || [ball.x, 0, ball.z + 3];
  const me = { x: sp[0], z: sp[2], vx: 0, vz: 0, r: 0.4 };
  let goals = 0, first = null, t = 0;
  for (; t < seconds; t += dt) {
    if (ball.cool > 0) {
      stepBall(ball, dt, [], pitch);
      continue;
    }
    const w = strikerBrain(me, ball, pitch, P, { sprint });
    const k = Math.min(1, P.accelK * dt);
    me.vx += (w.x - me.vx) * k;
    me.vz += (w.z - me.vz) * k;
    me.x += me.vx * dt;
    me.z += me.vz * dt;
    const rr = Math.hypot(me.x, me.z), lim = pitch.R - 0.8;
    if (rr > lim) {
      me.x *= lim / rr;
      me.z *= lim / rr;
    }
    if (stepBall(ball, dt, [me], pitch) === "goal") {
      goals++;
      if (first === null) first = Math.round(t * 100) / 100;
    }
  }
  return { goals, firstGoalS: first };
}
var sportsScore, sportsDisplay;
var init_sports_rules = __esm({
  "../../sdk/mechanics/sports-rules.js"() {
    init_physics();
    sportsScore = (goals) => goals;
    sportsDisplay = (score) => `${score} goal${score === 1 ? "" : "s"}`;
  }
});

// ../../sdk/mechanics/sports.js
var sports_exports = {};
__export(sports_exports, {
  default: () => sports_default,
  pitchFrom: () => pitchFrom,
  simulateGoals: () => simulateGoals,
  sportsDisplay: () => sportsDisplay,
  sportsScore: () => sportsScore,
  stepBall: () => stepBall,
  strikerBrain: () => strikerBrain
});
function ballTexture(K, pal) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = pal.primary;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const x = i * 86 + j % 2 * 43, y = 42 + j * 86;
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2 - Math.PI / 2;
      g.lineTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24);
    }
    g.closePath();
    g.fill();
  }
  g.fillStyle = pal.secondary;
  g.fillRect(0, 118, 512, 20);
  g.fillStyle = ink(pal.secondary);
  g.font = "900 18px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(K.brand).toUpperCase(), 128, 128);
  g.fillText(String(K.brand).toUpperCase(), 384, 128);
  return K.tex(c);
}
var usable3, brandOf2, sports_default;
var init_sports = __esm({
  "../../sdk/mechanics/sports.js"() {
    init_collect();
    init_sports_rules();
    init_physics();
    init_course_kit();
    init_sports_rules();
    usable3 = (ctx2) => ctx2.layout?.mechanic === "sports" && Array.isArray(ctx2.layout.elements) && ctx2.layout.elements.some((e) => e.type === "goal") && ctx2.layout.elements.some((e) => e.type === "ball");
    brandOf2 = (ctx2) => ctx2.manifest?.brand?.name || "Bonus Round";
    sports_default = {
      name: "sports",
      claimMode: "personal",
      claimRange: "arena",
      build(ctx2) {
        if (!usable3(ctx2)) return { fallback: collect_default.build(ctx2) };
        const K = kit(ctx2), T = ctx2.THREE, pal = ctx2.palette, L = ctx2.layout;
        const pitch = pitchFrom(L), ci = claimsOf(L);
        const H = num2(L.meta?.physics?.heightM, ctx2.world?.playerHeightM || 1.8);
        const root = new T.Group();
        root.position.copy(ctx2.arena.local(0, 0, 0));
        ctx2.arena.group.add(root);
        const g0 = pitch.goal, F = goalFrame(g0);
        const goal = new T.Group();
        goal.position.set(F.x, 0, F.z);
        goal.rotation.y = num2(g0.rotY, 0);
        const postR = Math.max(0.08, F.h * 0.045);
        const postMat = K.mat("#ffffff", { emissive: pal.accent, emissiveIntensity: 0.15 }), barMat = K.mat(pal.primary);
        for (const sx of [-1, 1]) {
          const p = new T.Mesh(K.keep(new T.CylinderGeometry(postR, postR, F.h, 12)), postMat);
          p.position.set(sx * F.hw, F.h / 2, 0);
          p.castShadow = true;
          goal.add(p);
          const b = new T.Mesh(K.keep(new T.CylinderGeometry(postR * 0.6, postR * 0.6, F.h, 8)), barMat);
          b.position.set(sx * F.hw, F.h / 2, -F.depth);
          goal.add(b);
        }
        const bar = new T.Mesh(K.keep(new T.CylinderGeometry(postR, postR, F.hw * 2 + postR * 2, 12)), postMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.y = F.h;
        goal.add(bar);
        const netC = document.createElement("canvas");
        netC.width = netC.height = 64;
        const ng = netC.getContext("2d");
        ng.strokeStyle = "#ffffff";
        ng.lineWidth = 3;
        ng.strokeRect(0, 0, 64, 64);
        const netTex = K.tex(netC);
        netTex.wrapS = netTex.wrapT = T.RepeatWrapping;
        const netMat = (rx, ry) => {
          const t = netTex.clone();
          t.needsUpdate = true;
          t.repeat.set(rx, ry);
          K.keep(t);
          return K.keep(new T.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.75, side: T.DoubleSide, depthWrite: false, alphaTest: 0.05 }));
        };
        const back = new T.Mesh(K.keep(new T.PlaneGeometry(F.hw * 2, F.h)), netMat(F.hw * 4, F.h * 2));
        back.position.set(0, F.h / 2, -F.depth);
        goal.add(back);
        const top = new T.Mesh(K.keep(new T.PlaneGeometry(F.hw * 2, F.depth)), netMat(F.hw * 4, F.depth * 2));
        top.rotation.x = Math.PI / 2;
        top.position.set(0, F.h, -F.depth / 2);
        goal.add(top);
        for (const sx of [-1, 1]) {
          const sd = new T.Mesh(K.keep(new T.PlaneGeometry(F.depth, F.h)), netMat(F.depth * 2, F.h * 2));
          sd.rotation.y = Math.PI / 2;
          sd.position.set(sx * F.hw, F.h / 2, -F.depth / 2);
          goal.add(sd);
        }
        const banner = K.sign(K.labelTexture(K.brand, { sub: K.theme ? K.theme.slice(0, 40) : "Score!" }), F.hw * 2 + 0.6, Math.max(0.6, F.h * 0.32));
        banner.position.set(0, F.h + Math.max(0.6, F.h * 0.32) / 2 + 0.15, 0);
        goal.add(banner);
        const line = new T.Mesh(K.keep(new T.PlaneGeometry(F.hw * 2, 0.16)), K.mat("#ffffff", { polygonOffset: true, polygonOffsetFactor: -3 }));
        line.rotation.x = -Math.PI / 2;
        line.position.y = 0.04;
        goal.add(line);
        const mouthGlow = new T.Mesh(K.keep(new T.PlaneGeometry(F.hw * 2 - 0.2, F.h - 0.1)), K.keep(new T.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false })));
        mouthGlow.position.y = F.h / 2;
        goal.add(mouthGlow);
        root.add(goal);
        for (const d of L.elements.filter((e) => e.type === "decor" && e.kind === "flag")) {
          const f = new T.Group();
          f.position.set(d.pos[0], 0, d.pos[2]);
          const pole = new T.Mesh(K.keep(new T.CylinderGeometry(0.04, 0.04, 1.3, 6)), K.mat("#ffffff"));
          pole.position.y = 0.65;
          const cloth = new T.Mesh(K.keep(new T.PlaneGeometry(0.5, 0.32)), K.mat(pal.secondary, { side: T.DoubleSide }));
          cloth.position.set(0.25, 1.1, 0);
          f.add(pole, cloth);
          root.add(f);
        }
        const spot = pitch.balls[0];
        const ball = makeBall(spot);
        const ballMesh = new T.Mesh(K.keep(new T.SphereGeometry(ball.r, 28, 18)), K.mat("#ffffff", { map: ballTexture(K, pal), roughness: 0.45 }));
        ballMesh.castShadow = true;
        root.add(ballMesh);
        const shadow = new T.Mesh(K.keep(new T.CircleGeometry(ball.r * 0.95, 20)), K.keep(new T.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.22, depthWrite: false })));
        shadow.rotation.x = -Math.PI / 2;
        root.add(shadow);
        for (const b of pitch.balls) {
          const ring = new T.Mesh(K.keep(new T.RingGeometry(b.radius * 1.3, b.radius * 1.55, 28)), K.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: 0.4, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3 }));
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(b.pos[0], 0.04, b.pos[2]);
          root.add(ring);
        }
        const guideC = document.createElement("canvas");
        guideC.width = 32;
        guideC.height = 64;
        const gg = guideC.getContext("2d");
        gg.fillStyle = "#ffffff";
        gg.fillRect(8, 0, 16, 34);
        const guideTex = K.tex(guideC);
        guideTex.wrapS = guideTex.wrapT = T.RepeatWrapping;
        const guide = new T.Mesh(K.keep(new T.PlaneGeometry(0.22, 1)), K.keep(new T.MeshBasicMaterial({ map: guideTex, transparent: true, opacity: 0.6, depthWrite: false })));
        guide.rotation.x = -Math.PI / 2;
        guide.position.y = 0.05;
        root.add(guide);
        const slots = L.elements.map((el, k) => ({ el, i: ci.byEl.get(k) })).filter((x) => x.el.type === "goal" && x.i !== void 0).map((x) => x.i);
        const chip = hudChip(ctx2, pal.primary);
        const s = { K, root, pitch, ball, ballMesh, shadow, guide, guideTex, mouthGlow, slots, chip, me: tracker(ctx2), goals: slots.filter((i) => ctx2.isClaimed(i)).length, H, kickQ: 0, lastTouch: 0, endShown: false, flash: 0 };
        s.onKey = (e) => {
          if ((e.code === "KeyF" || e.code === "KeyE") && !e.repeat) s.kickQ = 0.25;
        };
        s.onDown = (e) => {
          if (e.button === 0 && !e.target?.closest?.("button,a,input,[data-bonusround]")) s.kickQ = 0.25;
        };
        addEventListener("keydown", s.onKey);
        addEventListener("pointerdown", s.onDown);
        return s;
      },
      update(dt, ctx2, s) {
        if (s.fallback) return collect_default.update(dt, ctx2, s.fallback);
        const T = ctx2.THREE, me = s.me.update(dt), b = s.ball;
        const playing = ctx2.phase() === "playing" || ctx2.phase() === "intro";
        s.kickQ -= dt;
        const pushers = [];
        if (playing && me.ok && me.y < b.r * 2.2) pushers.push({ x: me.x, z: me.z, vx: me.vx, vz: me.vz, r: 0.32 * s.H / 1.8 + 0.08 });
        if (playing && me.ok && s.kickQ > 0 && b.cool <= 0 && Math.hypot(b.x - me.x, b.z - me.z) < b.r + 1.4) {
          s.kickQ = 0;
          const dir = new T.Vector3();
          ctx2.camera.getWorldDirection(dir);
          dir.y = 0;
          if (dir.lengthSq() < 1e-4) dir.set(me.vx, 0, me.vz);
          dir.normalize();
          b.vx = dir.x * 11;
          b.vz = dir.z * 11;
          ctx2.audio.play("shoot");
        }
        const prevSpeed = Math.hypot(b.vx, b.vz);
        const ev = stepBall(b, dt, pushers, s.pitch);
        if (Math.hypot(b.vx, b.vz) > prevSpeed + 0.5) s.lastTouch = performance.now();
        if (ev === "goal" && playing) {
          const free = s.slots.find((i) => !ctx2.isClaimed(i));
          if (free !== void 0) ctx2.claim(free);
          s.flash = 1;
          ctx2.burst(ctx2.arena.group.localToWorld(ctx2.arena.local(b.x, 1, b.z)), ctx2.palette.accent, 50);
          ctx2.hud.toast("GOAL!");
        }
        if (b.cool <= 0 && performance.now() - s.lastTouch > 6e3 && Math.hypot(b.x - b.home[0], b.z - b.home[1]) > 3) {
          b.cool = 0.01;
          s.lastTouch = performance.now();
        }
        s.ballMesh.position.set(b.x, b.r, b.z);
        const sp = Math.hypot(b.vx, b.vz);
        if (sp > 0.05) {
          const ax = new T.Vector3(b.vz, 0, -b.vx).normalize();
          s.ballMesh.rotateOnWorldAxis(ax, sp / b.r * dt);
        }
        s.ballMesh.visible = b.cool <= 0 || b.cool > 0.6;
        s.shadow.position.set(b.x, 0.03, b.z);
        s.shadow.visible = s.ballMesh.visible;
        const F = goalFrame(s.pitch.goal), gx = F.x + F.nx * 0.2, gz = F.z + F.nz * 0.2;
        const dx = gx - b.x, dz = gz - b.z, d = Math.hypot(dx, dz);
        s.guide.visible = playing && d > 2;
        s.guide.position.set((b.x + gx) / 2, 0.05, (b.z + gz) / 2);
        s.guide.rotation.order = "YXZ";
        s.guide.rotation.set(-Math.PI / 2, Math.atan2(dx, dz), 0);
        s.guide.scale.set(1, Math.max(0.1, d - b.r - 0.4), 1);
        s.guideTex.repeat.set(1, Math.max(1, d / 0.9));
        s.guideTex.offset.y -= dt * 1.5;
        s.flash = Math.max(0, s.flash - dt * 1.4);
        s.mouthGlow.material.opacity = 0.12 + s.flash * 0.5 + Math.sin(performance.now() / 300) * 0.04;
        if (ctx2.phase() === "leaderboard") {
          s.chip.show(false);
          if (!s.endShown) {
            s.endShown = true;
            s.chip.result(s.goals ? `${s.goals} goal${s.goals === 1 ? "" : "s"}! What a striker` : "Great hustle out there!", `Presented by ${brandOf2(ctx2)}`);
          }
        } else {
          s.chip.show(true);
          s.chip.set(`SCORE IN THE ${String(brandOf2(ctx2)).toUpperCase()} GOAL \xB7 GOALS ${s.goals}`);
        }
      },
      onClaimed(i, by, mine, ctx2, s) {
        if (s.fallback) return collect_default.onClaimed(i, by, mine, ctx2, s.fallback);
        if (mine && s.slots.includes(i)) s.goals++;
      },
      itemsLeft(s) {
        return s.fallback ? collect_default.itemsLeft(s.fallback) : s.slots.length - s.goals;
      },
      dispose(ctx2, s) {
        if (s.fallback) return collect_default.dispose(ctx2, s.fallback);
        removeEventListener("keydown", s.onKey);
        removeEventListener("pointerdown", s.onDown);
        s.chip.remove();
        cleanup(ctx2, [s.root], s.K);
      }
    };
  }
});

// ../../sdk/mechanics/smash-rules.js
function targetsFrom(layout) {
  return (layout?.elements || []).filter((e) => e.type === "target").map((e, i) => ({
    i,
    el: e,
    x: e.pos[0],
    y: e.pos[1],
    z: e.pos[2],
    r: num2(e.radius, 0.45),
    value: num2(e.value, 1),
    cluster: num2(e.cluster, 0),
    col: num2(e.column, i),
    level: num2(e.level, 0),
    popped: false,
    by: null
  }));
}
function touches(t, x, y, z, h, reach = 0.5) {
  if (t.popped) return false;
  if (Math.hypot(x - t.x, z - t.z) > t.r + reach) return false;
  return y < t.y + 2 * t.r + 0.1 && y + h > t.y - 0.1;
}
function pop(targets, t, by) {
  t.popped = true;
  t.by = by;
  const drops = [];
  for (const o of targets) {
    if (o.popped || o.col !== t.col || o.cluster !== t.cluster || o.level <= t.level) continue;
    o.level--;
    o.y = Math.max(0, o.y - 2 * t.r);
    drops.push({ i: o.i, y: o.y });
  }
  return drops;
}
function smashBrain(me, targets, rand = Math.random) {
  let best = null, bd = Infinity;
  for (const t of targets) {
    if (t.popped) continue;
    const d = Math.hypot(t.x - me.x, t.z - me.z) + (me.cluster === t.cluster ? 0 : 2.5) + rand() * 2;
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  if (best) me.cluster = best.cluster;
  return best;
}
function simulateSweep(layout, P, { sprint = true } = {}) {
  const T = targetsFrom(layout);
  const sp = layout.meta?.spawn || [0, 0, 6];
  const me = { x: sp[0], z: sp[2], cluster: -1 };
  const v = sprint ? P.sprintMps : P.walkMps;
  let t = 0.3, n = 0;
  for (; ; ) {
    const tg = smashBrain(me, T, () => 0.5);
    if (!tg) break;
    const d = Math.max(0, Math.hypot(tg.x - me.x, tg.z - me.z) - tg.r - 0.4);
    t += d / v + 0.08;
    me.x = tg.x;
    me.z = tg.z;
    for (const o of T) if (!o.popped && touches(o, me.x, 0, me.z, P.heightM + (P.canJump ? P.jumpHeightM : 0), 0.5)) {
      pop(T, o, "sim");
      n++;
    }
    if (!tg.popped) {
      pop(T, tg, "sim");
      n++;
    }
  }
  return { timeS: Math.round(t * 100) / 100, popped: n };
}
var smashScore, smashDisplay;
var init_smash_rules = __esm({
  "../../sdk/mechanics/smash-rules.js"() {
    init_physics();
    smashScore = (points) => points;
    smashDisplay = (score) => `${score} pts`;
  }
});

// ../../sdk/mechanics/smash.js
var smash_exports = {};
__export(smash_exports, {
  default: () => smash_default,
  pop: () => pop,
  simulateSweep: () => simulateSweep,
  smashBrain: () => smashBrain,
  smashDisplay: () => smashDisplay,
  smashScore: () => smashScore,
  targetsFrom: () => targetsFrom,
  touches: () => touches
});
var usable4, brandOf3, smash_default;
var init_smash = __esm({
  "../../sdk/mechanics/smash.js"() {
    init_collect();
    init_smash_rules();
    init_physics();
    init_course_kit();
    init_smash_rules();
    usable4 = (ctx2) => ctx2.layout?.mechanic === "smash" && Array.isArray(ctx2.layout.elements) && ctx2.layout.elements.some((e) => e.type === "target");
    brandOf3 = (ctx2) => ctx2.manifest?.brand?.name || "Bonus Round";
    smash_default = {
      name: "smash",
      claimMode: "exclusive",
      build(ctx2) {
        if (!usable4(ctx2)) return { fallback: collect_default.build(ctx2) };
        const K = kit(ctx2), T = ctx2.THREE, pal = ctx2.palette, L = ctx2.layout;
        const ci = claimsOf(L);
        const H = num2(L.meta?.physics?.heightM, ctx2.world?.playerHeightM || 1.8);
        const root = new T.Group();
        root.position.copy(ctx2.arena.local(0, 0, 0));
        ctx2.arena.group.add(root);
        const targets = targetsFrom(L).map((t) => {
          const i = ci.byEl.get(L.elements.indexOf(t.el));
          const obj = K.product(t.r * 2) || ctx2.assets.collectible.make();
          obj.position.set(t.x, t.y, t.z);
          obj.rotation.y = Math.random() * Math.PI * 2;
          const gone = i !== void 0 && ctx2.picked.has(i);
          obj.visible = !gone;
          root.add(obj);
          return { ...t, i, obj, popped: gone, fly: null, yv: t.y };
        });
        const clusters = /* @__PURE__ */ new Map();
        for (const t of targets) {
          const c = clusters.get(t.cluster) || { x: 0, z: 0, n: 0, r: 0 };
          c.x += t.x;
          c.z += t.z;
          c.n++;
          clusters.set(t.cluster, c);
        }
        for (const [id, c] of clusters) {
          c.x /= c.n;
          c.z /= c.n;
          for (const t of targets) if (t.cluster === id) c.r = Math.max(c.r, Math.hypot(t.x - c.x, t.z - c.z) + t.r);
          const ring = new T.Mesh(K.keep(new T.RingGeometry(c.r + 0.2, c.r + 0.5, 40)), K.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: 0.5, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3 }));
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(c.x, 0.04, c.z);
          const pad = new T.Mesh(K.keep(new T.CircleGeometry(c.r + 0.2, 40)), K.mat(pal.secondary, { transparent: true, opacity: 0.35, polygonOffset: true, polygonOffsetFactor: -2 }));
          pad.rotation.x = -Math.PI / 2;
          pad.position.set(c.x, 0.035, c.z);
          root.add(ring, pad);
        }
        const chip = hudChip(ctx2, pal.primary);
        return { K, root, targets, chip, me: tracker(ctx2), H, points: 0, pops: 0, combo: [], endShown: false };
      },
      update(dt, ctx2, s) {
        if (s.fallback) return collect_default.update(dt, ctx2, s.fallback);
        const me = s.me.update(dt);
        const playing = ctx2.phase() === "playing" || ctx2.phase() === "intro";
        const tt = performance.now() / 1e3;
        for (const t of s.targets) {
          if (t.fly) {
            const f = t.fly;
            f.age += dt;
            f.vy -= 14 * dt;
            t.obj.position.x += f.vx * dt;
            t.obj.position.z += f.vz * dt;
            t.obj.position.y = Math.max(0, t.obj.position.y + f.vy * dt);
            t.obj.rotation.x += f.spin * dt;
            t.obj.rotation.z += f.spin * 0.7 * dt;
            const k = Math.max(0.01, 1 - f.age / 0.75);
            t.obj.scale.setScalar(f.s0 * k);
            if (f.age > 0.75) {
              t.obj.visible = false;
              t.fly = null;
            }
            continue;
          }
          if (t.popped) continue;
          t.yv += (t.y - t.yv) * Math.min(1, dt * 10);
          t.obj.position.y = t.yv + (t.level === 0 ? 0 : Math.sin(tt * 3 + t.i) * 0.02);
          if (playing && me.ok && t.i !== void 0 && touches(t, me.x, me.y, me.z, s.H, 0.42)) ctx2.claim(t.i);
        }
        if (ctx2.phase() === "leaderboard") {
          s.chip.show(false);
          if (!s.endShown) {
            s.endShown = true;
            s.chip.result(s.pops ? `${s.pops} pop${s.pops === 1 ? "" : "s"}! Smashing` : "Thanks for smashing by!", `Presented by ${brandOf3(ctx2)}`);
          }
        } else {
          s.chip.show(true);
          s.chip.set(`SMASH THE ${String(brandOf3(ctx2)).toUpperCase()} STACKS \xB7 ${s.pops} POPS`);
        }
      },
      onClaimed(i, by, mine, ctx2, s) {
        if (s.fallback) return collect_default.onClaimed(i, by, mine, ctx2, s.fallback);
        const t = s.targets.find((q) => q.i === i);
        if (!t || t.popped) return;
        pop(s.targets, t, by);
        const me = s.me;
        let ax = t.x - (mine && me.ok ? me.x : t.x + (Math.random() - 0.5)), az = t.z - (mine && me.ok ? me.z : t.z + (Math.random() - 0.5));
        const l = Math.hypot(ax, az) || 1;
        ax /= l;
        az /= l;
        t.fly = { vx: ax * 5 + (Math.random() - 0.5) * 2, vz: az * 5 + (Math.random() - 0.5) * 2, vy: 5 + Math.random() * 2, spin: 6 + Math.random() * 6, age: 0, s0: t.obj.scale.x };
        ctx2.burst(ctx2.arena.group.localToWorld(ctx2.arena.local(t.x, t.yv + t.r, t.z)), ctx2.palette.secondary, 18);
        if (mine) {
          s.points += t.value;
          s.pops++;
          const now2 = performance.now();
          s.combo = s.combo.filter((x) => now2 - x < 900);
          s.combo.push(now2);
          if (s.combo.length >= 3) ctx2.hud.toast(`Combo x${s.combo.length}!`);
          else if (t.level > 0 || t.value > 1) ctx2.hud.toast("Top piece!");
        }
      },
      itemsLeft(s) {
        return s.fallback ? collect_default.itemsLeft(s.fallback) : s.targets.filter((t) => !t.popped).length;
      },
      dispose(ctx2, s) {
        if (s.fallback) return collect_default.dispose(ctx2, s.fallback);
        s.chip.remove();
        cleanup(ctx2, [s.root], s.K);
      }
    };
  }
});

// ../../sdk/mechanics/index.js
async function loadMechanic(name) {
  const want = KNOWN.includes(name) ? ALIAS[name] || name : "collect";
  if (!cache.has(want)) {
    cache.set(want, (BUNDLED[want] ? BUNDLED[want]() : Promise.reject(new Error(`no mechanic ${want}`))).then((m) => m.default || m).catch((e) => {
      console.warn(`[bonusround] mechanic "${want}" unavailable (${e?.message || e}); using collect`);
      return want === "collect" ? null : loadMechanic("collect");
    }));
  }
  const mech = await cache.get(want);
  return mech ? { ...mech, name: mech.name || want, requested: name || "collect" } : null;
}
var BUNDLED, KNOWN, ALIAS, cache;
var init_mechanics = __esm({
  "../../sdk/mechanics/index.js"() {
    BUNDLED = { "collect": () => Promise.resolve().then(() => (init_collect(), collect_exports)), "shoot": () => Promise.resolve().then(() => (init_shoot(), shoot_exports)), "race": () => Promise.resolve().then(() => (init_race(), race_exports)), "platform": () => Promise.resolve().then(() => (init_platform(), platform_exports)), "sports": () => Promise.resolve().then(() => (init_sports(), sports_exports)), "smash": () => Promise.resolve().then(() => (init_smash(), smash_exports)) };
    KNOWN = ["collect", "shoot", "race", "platform", "sports", "smash", "gates"];
    ALIAS = { gates: "collect" };
    cache = /* @__PURE__ */ new Map();
  }
});

// ../../sdk/viewability.js
function ambientRule(inWorld = {}) {
  return inWorld && (inWorld.video || inWorld.animated === true || inWorld.surface === "video") ? RULES.video : RULES.display;
}
function facingFor(kind) {
  return kind === "statue" ? "any" : kind === "portal_arch" ? "both" : "front";
}
function passes(sample, rule = RULES.display) {
  if (!sample || sample.tabVisible === false) return false;
  const px = Number(sample.pixels), cov = Number(sample.coverage), ang = Number(sample.angle);
  return Number.isFinite(px) && Number.isFinite(cov) && Number.isFinite(ang) && px >= rule.minPixels - EPS && cov >= rule.minCoverage - EPS && ang <= rule.maxAngleDeg + EPS;
}
function failures(sample, rule = RULES.display) {
  const out = [];
  if (!sample) return ["not_measured"];
  if (sample.tabVisible === false) out.push("tab_hidden");
  if (!(sample.pixels >= rule.minPixels - EPS)) out.push("pixels");
  if (!(sample.coverage >= rule.minCoverage - EPS)) out.push("size");
  if (!(sample.angle <= rule.maxAngleDeg + EPS)) out.push("angle");
  return out;
}
function createTracker(rule = RULES.display, { pollMs = POLL_MS, maxGapMs = Math.max(500, pollMs * 2.5) } = {}) {
  let runMs = 0, last = null, fired = false, win = null, firedReport = null, lastSample = null;
  const st = {
    rule,
    get runMs() {
      return runMs;
    },
    get fired() {
      return fired;
    },
    get report() {
      return firedReport;
    },
    get last() {
      return lastSample;
    },
    sample(now2, m) {
      lastSample = m || null;
      if (!passes(m, rule)) {
        runMs = 0;
        last = null;
        win = null;
        return { ok: false, runMs: 0, viewable: false };
      }
      if (last != null && now2 - last <= maxGapMs && now2 >= last) runMs += now2 - last;
      else {
        runMs = 0;
        win = { px: 1, cov: 1, ang: 0, occ: m.occlusion || "none" };
      }
      last = now2;
      win.px = Math.min(win.px, m.pixels);
      win.cov = Math.min(win.cov, m.coverage);
      win.ang = Math.max(win.ang, m.angle);
      if (m.occlusion && m.occlusion !== "raycast") win.occ = m.occlusion;
      if (!fired && runMs >= rule.minMs) {
        fired = true;
        firedReport = { std: IIG_STD, rule: rule.kind, ms: Math.round(runMs), px: round(win.px, 3), cov: round(win.cov, 4), ang: round(win.ang, 1), occ: win.occ };
        return { ok: true, runMs, viewable: true, report: firedReport };
      }
      return { ok: true, runMs, viewable: false };
    },
    reset() {
      runMs = 0;
      last = null;
      win = null;
    }
  };
  return st;
}
function polygonArea(poly) {
  let a = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) / 2;
}
function convexHull(points) {
  const pts = points.map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}
function clipToRect(poly, x0 = -1, x1 = 1, y0 = -1, y1 = 1) {
  let out = poly;
  const edges = [
    [(p) => p[0] >= x0, (a, b) => lerpAt(a, b, 0, x0)],
    [(p) => p[0] <= x1, (a, b) => lerpAt(a, b, 0, x1)],
    [(p) => p[1] >= y0, (a, b) => lerpAt(a, b, 1, y0)],
    [(p) => p[1] <= y1, (a, b) => lerpAt(a, b, 1, y1)]
  ];
  for (const [inside, cut] of edges) {
    const src = out;
    out = [];
    if (!src.length) break;
    for (let i = 0; i < src.length; i++) {
      const cur = src[i], prev = src[(i + src.length - 1) % src.length];
      const ci = inside(cur), pi = inside(prev);
      if (ci) {
        if (!pi) out.push(cut(prev, cur));
        out.push(cur);
      } else if (pi) out.push(cut(prev, cur));
    }
  }
  return out;
}
function lerpAt(a, b, axis, v) {
  const t = (v - a[axis]) / (b[axis] - a[axis] || EPS);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function pointInConvex(poly, x, y) {
  let sign = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (Math.abs(c) < EPS) continue;
    if (!sign) sign = Math.sign(c);
    else if (Math.sign(c) !== sign) return false;
  }
  return true;
}
function projectBox(corners, view, proj, near = 0.1) {
  const vs = corners.map((c) => mul(view, c[0], c[1], c[2]));
  const zc = -Math.max(1e-4, near);
  const front = (v) => v[2] <= zc;
  const pts = vs.filter(front);
  for (const [a, b] of EDGES) {
    const A = vs[a], B = vs[b];
    if (front(A) !== front(B)) {
      const t = (zc - A[2]) / (B[2] - A[2]);
      pts.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, zc, 1]);
    }
  }
  if (!pts.length) return null;
  const ndc = [];
  for (const v of pts) {
    const p = mul(proj, v[0], v[1], v[2]);
    if (!(Math.abs(p[3]) > EPS)) continue;
    ndc.push([p[0] / p[3], p[1] / p[3]]);
  }
  if (ndc.length < 3) return null;
  const hull = convexHull(ndc);
  const fullArea = polygonArea(hull);
  const visible = clipToRect(hull);
  return { hull, fullArea, visible, visArea: visible.length >= 3 ? polygonArea(visible) : 0 };
}
function viewAngle(camPos, center, axes, facing = "front") {
  if (facing === "any") return 0;
  let vx = camPos[0] - center[0], vy = camPos[1] - center[1], vz = camPos[2] - center[2];
  const len = Math.hypot(vx, vy, vz) || 1;
  vx /= len;
  vy /= len;
  vz /= len;
  const dot = (a) => vx * a[0] + vy * a[1] + vz * a[2];
  let dn = dot(axes.normal);
  if (facing === "both") dn = Math.abs(dn);
  const deg = (r4) => r4 * 180 / Math.PI;
  return Math.max(deg(Math.atan2(Math.abs(dot(axes.right)), dn)), deg(Math.atan2(Math.abs(dot(axes.up)), dn)));
}
function createMeter(opts) {
  const T = opts.THREE;
  const grid = Math.max(2, Math.min(8, opts.grid || 4));
  const facing = opts.facing || "front";
  const frame = opts.frame;
  const targets = (opts.targets && opts.targets.length ? opts.targets : [frame]).filter(Boolean);
  const exclude = opts.exclude || frame;
  const getCamera = opts.getCamera || (() => opts.camera);
  const budgetMs = opts.budgetMs || 4;
  const ray = T?.Raycaster ? new T.Raycaster() : null;
  if (ray) {
    ray.params.Points = { threshold: 0 };
    ray.params.Line = { threshold: 0 };
  }
  const ndc = T?.Vector2 ? new T.Vector2() : null;
  let local = null;
  let skipOcc = 0, slowRuns = 0, occOff = opts.occlusion === false, lastOccFrac = null;
  const inv = T ? new T.Matrix4() : null, tmp = T ? new T.Vector3() : null;
  function localBox() {
    frame.updateMatrixWorld?.(true);
    inv.copy(frame.matrixWorld).invert();
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    const m = new T.Matrix4();
    for (const t of targets) {
      t.traverse?.((o) => {
        const g = o.geometry;
        if (!o.isMesh || !g) return;
        if (!g.boundingBox) g.computeBoundingBox?.();
        const b = g.boundingBox;
        if (!b || b.isEmpty?.()) return;
        m.multiplyMatrices(inv, o.matrixWorld);
        for (let i = 0; i < 8; i++) {
          tmp.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(m);
          min[0] = Math.min(min[0], tmp.x);
          min[1] = Math.min(min[1], tmp.y);
          min[2] = Math.min(min[2], tmp.z);
          max[0] = Math.max(max[0], tmp.x);
          max[1] = Math.max(max[1], tmp.y);
          max[2] = Math.max(max[2], tmp.z);
        }
      });
    }
    if (!(min[0] < Infinity)) return null;
    for (let k = 0; k < 3; k++) if (max[k] - min[k] < 1e-3) {
      min[k] -= 5e-4;
      max[k] += 5e-4;
    }
    return [min, max];
  }
  const visibleChain = (o) => {
    for (let x = o; x; x = x.parent) {
      if (x.visible === false) return false;
      if (x === exclude) return "ad";
    }
    return true;
  };
  const opaque = (o) => {
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    return mats.some((mt) => mt && mt.visible !== false && !(mt.transparent && (mt.opacity ?? 1) < 0.6) && mt.colorWrite !== false);
  };
  function measure() {
    const cam = getCamera();
    if (!cam?.projectionMatrix || !cam.matrixWorld) return { inView: false, pixels: 0, coverage: 0, angle: 90, occlusion: "geometry", onAd: 0, samples: 0 };
    cam.updateMatrixWorld?.();
    if (!local) local = localBox();
    if (!local) return { inView: false, pixels: 0, coverage: 0, angle: 90, occlusion: "geometry", onAd: 0, samples: 0 };
    frame.updateMatrixWorld?.();
    const fw = frame.matrixWorld.elements;
    const corners = [];
    for (let i = 0; i < 8; i++) {
      const x = i & 1 ? local[1][0] : local[0][0], y = i & 2 ? local[1][1] : local[0][1], z = i & 4 ? local[1][2] : local[0][2];
      corners.push(mul(fw, x, y, z).slice(0, 3));
    }
    const viewE = cam.matrixWorldInverse?.elements || new T.Matrix4().copy(cam.matrixWorld).invert().elements;
    const pr = projectBox(corners, viewE, cam.projectionMatrix.elements, cam.near || 0.1);
    const ce = cam.matrixWorld.elements, camPos = [ce[12], ce[13], ce[14]];
    const c = [(local[0][0] + local[1][0]) / 2, (local[0][1] + local[1][1]) / 2, (local[0][2] + local[1][2]) / 2];
    const center = mul(fw, c[0], c[1], c[2]).slice(0, 3);
    const nrm = (x, y, z) => {
      const l = Math.hypot(x, y, z) || 1;
      return [x / l, y / l, z / l];
    };
    const axes = { right: nrm(fw[0], fw[1], fw[2]), up: nrm(fw[4], fw[5], fw[6]), normal: nrm(fw[8], fw[9], fw[10]) };
    const angle = viewAngle(camPos, center, axes, facing);
    if (!pr || pr.fullArea <= EPS) return { inView: false, pixels: 0, coverage: 0, angle, occlusion: "geometry", onAd: 0, samples: 0 };
    let pixels = pr.visArea / pr.fullArea, coverage = pr.visArea / 4, occlusion = "geometry", onAd = 0, samples = 0;
    if (ray && ndc && pr.visArea > 0) {
      const t0 = performance.now();
      try {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const p of pr.hull) {
          x0 = Math.min(x0, p[0]);
          x1 = Math.max(x1, p[0]);
          y0 = Math.min(y0, p[1]);
          y1 = Math.max(y1, p[1]);
        }
        x0 = Math.max(x0, -4);
        x1 = Math.min(x1, 4);
        y0 = Math.max(y0, -4);
        y1 = Math.min(y1, 4);
        const doOcc = !occOff && opts.scene && skipOcc <= 0;
        let inHull = 0, inViewOnAd = 0, clear = 0, occChecked = 0, occBlocked = 0, unchecked = 0;
        const occRoots = doOcc ? opts.scene.children.filter((o) => o !== exclude) : [];
        for (let i = 0; i < grid; i++) for (let j = 0; j < grid; j++) {
          const x = x0 + (i + 0.5) / grid * (x1 - x0), y = y0 + (j + 0.5) / grid * (y1 - y0);
          if (!pointInConvex(pr.hull, x, y)) continue;
          inHull++;
          ndc.set(x, y);
          ray.setFromCamera(ndc, cam);
          ray.far = Infinity;
          const hits = ray.intersectObjects(targets, true).filter((h) => h.object.isMesh && visibleChain(h.object) !== false);
          if (!hits.length) continue;
          onAd++;
          if (Math.abs(x) > 1 || Math.abs(y) > 1) continue;
          inViewOnAd++;
          if (!doOcc) {
            clear++;
            continue;
          }
          if (occChecked > 0 && performance.now() - t0 > budgetMs) {
            unchecked++;
            continue;
          }
          occChecked++;
          ray.far = Math.max(0, hits[0].distance - 1e-3);
          const blocked = ray.intersectObjects(occRoots, true).some((h) => h.object.isMesh && visibleChain(h.object) === true && opaque(h.object));
          if (blocked) occBlocked++;
          else clear++;
        }
        samples = inHull;
        if (onAd > 0) {
          let vis = clear + (occChecked ? unchecked * (1 - occBlocked / occChecked) : 0);
          if (doOcc) {
            lastOccFrac = occChecked ? occBlocked / occChecked : 0;
            occlusion = "raycast";
          } else if (occOff || !opts.scene) occlusion = "skipped";
          else {
            vis = inViewOnAd * (1 - (lastOccFrac ?? 0));
            occlusion = "raycast";
          }
          pixels = vis / onAd;
          coverage = pr.fullArea * (vis / Math.max(1, inHull)) / 4;
        }
      } catch (e) {
        occlusion = "geometry";
      }
      const took = performance.now() - t0;
      if (took > budgetMs) {
        skipOcc = Math.min(10, Math.ceil(took / budgetMs));
        if (++slowRuns > 20) occOff = true;
      } else {
        skipOcc--;
        slowRuns = Math.max(0, slowRuns - 1);
      }
    }
    return { inView: pr.visArea > 0 && pixels > 0, pixels: clamp01(pixels), coverage: clamp01(coverage), angle, occlusion, onAd, samples };
  }
  return { measure, reset() {
    local = null;
  }, get occlusionOff() {
    return occOff;
  } };
}
function createPropViewability(opts) {
  const meter = createMeter(opts);
  const rule = opts.rule || RULES.display;
  const tracker2 = createTracker(rule);
  let lastPoll = -Infinity, impressed = false, last = null;
  return {
    rule,
    tracker: tracker2,
    get last() {
      return last;
    },
    get viewable() {
      return tracker2.fired;
    },
    get runMs() {
      return tracker2.runMs;
    },
    tick(now2, tabVisible = true) {
      if (now2 - lastPoll < POLL_MS) return null;
      lastPoll = now2;
      const m = tabVisible ? meter.measure() : { inView: false, pixels: 0, coverage: 0, angle: 90, occlusion: "geometry" };
      m.tabVisible = tabVisible;
      last = m;
      if (!impressed && m.inView && tabVisible) {
        impressed = true;
        opts.onImpression?.(m);
      }
      const r4 = tracker2.sample(now2, m);
      if (r4.viewable) opts.onViewable?.(r4.report);
      return m;
    },
    reset() {
      meter.reset();
      tracker2.reset();
    },
    debug() {
      return { rule: rule.kind, viewable: tracker2.fired, runMs: Math.round(tracker2.runMs), last: last && { pixels: round(last.pixels, 3), coverage: round(last.coverage, 4), angle: round(last.angle, 1), occlusion: last.occlusion, fails: failures(last, rule) }, report: tracker2.report };
    }
  };
}
function takeoverSample(showing, tabVisible) {
  return showing ? { pixels: 1, coverage: 1, angle: 0, tabVisible, occlusion: "fullscreen" } : { pixels: 0, coverage: 0, angle: 90, tabVisible };
}
var IIG_STD, POLL_MS, RULES, EPS, round, mul, EDGES, clamp01;
var init_viewability = __esm({
  "../../sdk/viewability.js"() {
    IIG_STD = "iig2";
    POLL_MS = 200;
    RULES = Object.freeze({
      display: Object.freeze({ kind: "display", minPixels: 0.5, minCoverage: 0.015, maxAngleDeg: 55, minMs: 1e3 }),
      video: Object.freeze({ kind: "video", minPixels: 0.5, minCoverage: 0.015, maxAngleDeg: 55, minMs: 2e3 }),
      takeover: Object.freeze({ kind: "takeover", minPixels: 1, minCoverage: 1, maxAngleDeg: 0, minMs: 2e3 })
    });
    EPS = 1e-9;
    round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
    mul = (e, x, y, z) => [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14], e[3] * x + e[7] * y + e[11] * z + e[15]];
    EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  }
});

// ../../sdk/inworld/props.js
function trimmedLogo(img) {
  if (!img?.width) return null;
  if (trimmed.has(img)) return trimmed.get(img);
  const out = trimLogo(img);
  trimmed.set(img, out);
  return out;
}
function trimLogo(img) {
  try {
    const W = Math.min(512, img.width), Hh = Math.round(img.height / img.width * W);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = Hh;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0, W, Hh);
    const d = g.getImageData(0, 0, W, Hh).data;
    let x0 = W, y0 = Hh, x1 = -1, y1 = -1;
    for (let y = 0; y < Hh; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      if (d[i + 3] > 40 && !(d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235)) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    if (x1 < x0) return c;
    const pad = 4, out = document.createElement("canvas");
    out.width = x1 - x0 + pad * 2;
    out.height = y1 - y0 + pad * 2;
    out.getContext("2d").drawImage(c, x0 - pad, y0 - pad, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  } catch {
    return null;
  }
}
function drawFit(g, logo, cx, cy, w, h) {
  const k = Math.min(w / logo.width, h / logo.height);
  g.drawImage(logo, cx - logo.width * k / 2, cy - logo.height * k / 2, logo.width * k, logo.height * k);
}
function targetCanvas(m, pal, logoImg) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  const R = 252;
  g.fillStyle = pal.primary;
  g.beginPath();
  g.arc(256, 256, R, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = pal.secondary;
  g.lineWidth = 12;
  g.beginPath();
  g.arc(256, 256, R * 0.9, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 10;
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2;
    g.beginPath();
    g.moveTo(256 + Math.cos(a) * R * 0.78, 256 + Math.sin(a) * R * 0.78);
    g.lineTo(256 + Math.cos(a) * R * 0.99, 256 + Math.sin(a) * R * 0.99);
    g.stroke();
  }
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(256, 256, R * 0.72, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = pal.secondary;
  g.lineWidth = 8;
  g.beginPath();
  g.arc(256, 256, R * 0.72, 0, Math.PI * 2);
  g.stroke();
  const logo = trimmedLogo(logoImg) || logoCanvas(m.brand, pal, logoImg);
  g.save();
  g.beginPath();
  g.arc(256, 256, R * 0.72 - 6, 0, Math.PI * 2);
  g.clip();
  drawFit(g, logo, 256, 256, R * 1.22, R * 1);
  g.restore();
  return c;
}
function flashCanvas(m, pal, logoImg) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = pal.primary;
  g.beginPath();
  g.arc(128, 128, 126, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(128, 128, 112, 0, Math.PI * 2);
  g.fill();
  const logo = trimmedLogo(logoImg) || logoCanvas(m.brand, pal, logoImg);
  drawFit(g, logo, 128, 128, 196, 170);
  return c;
}
function printCanvas(m, pal, logoImg) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = pal.accent;
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = pal.primary;
  g.fillRect(0, 0, 512, 34);
  g.fillRect(0, 222, 512, 34);
  g.fillStyle = pal.secondary;
  g.fillRect(0, 34, 512, 8);
  g.fillRect(0, 214, 512, 8);
  const logo = logoCanvas(m.brand, pal, logoImg);
  for (const x of [128, 384]) {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(x, 128, 66, 76, 0, 0, Math.PI * 2);
    g.fill();
    g.drawImage(logo, x - 58, 128 - 64, 116, 128);
  }
  return c;
}
function zoneCanvas(m, pal, logoImg) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const g = c.getContext("2d");
  g.fillStyle = pal.primary;
  g.globalAlpha = 0.62;
  g.fillRect(0, 0, 512, 320);
  g.globalAlpha = 0.55;
  g.fillStyle = pal.secondary;
  for (let x = -320; x < 512; x += 64) {
    g.beginPath();
    g.moveTo(x, 320);
    g.lineTo(x + 32, 320);
    g.lineTo(x + 352, 0);
    g.lineTo(x + 320, 0);
    g.fill();
  }
  g.globalAlpha = 1;
  g.lineWidth = 22;
  g.strokeStyle = pal.accent;
  g.strokeRect(11, 11, 490, 298);
  const logo = logoCanvas(m.brand, pal, logoImg);
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(256, 160, 112, 0, Math.PI * 2);
  g.fill();
  drawFit(g, trimmedLogo(logoImg) || logo, 256, 160, 200, 180);
  return c;
}
function bandCanvas(m, pal, logoImg) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = pal.primary;
  g.fillRect(0, 0, 1024, 128);
  const logo = trimmedLogo(logoImg);
  let x0 = 512;
  if (logo) {
    g.fillStyle = "#ffffff";
    g.fillRect(16, 10, 360, 108);
    const k = Math.min(340 / logo.width, 96 / logo.height);
    g.drawImage(logo, 196 - logo.width * k / 2, 64 - logo.height * k / 2, logo.width * k, logo.height * k);
    x0 = 700;
  }
  g.fillStyle = readableOn(pal.primary, pal.background);
  g.font = '900 72px system-ui, -apple-system, "Segoe UI", sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(logo ? m.brand.tagline || m.brand.name : m.brand.name || "").toUpperCase(), x0, 68, logo ? 600 : 980);
  return c;
}
function createProps({ T, m, pal, logoImg, collectible }) {
  const owned = [];
  const keep = (x) => {
    owned.push(x);
    return x;
  };
  const targetTex = keep(canvasTexture(T, targetCanvas(m, pal, logoImg)));
  const faceMat = keep(new T.MeshBasicMaterial({ map: targetTex, transparent: true, color: "#e8e8e8" }));
  const backMat = keep(new T.MeshStandardMaterial({ color: pal.primary, roughness: 0.5, metalness: 0.1 }));
  const rimMat = keep(new T.MeshStandardMaterial({ color: pal.accent, emissive: pal.accent, emissiveIntensity: 0.9, roughness: 0.3 }));
  const glowTex = keep(glowTexture(T, pal.primary));
  const pulseMat = keep(new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.5, toneMapped: false }));
  const flashTex = keep(canvasTexture(T, flashCanvas(m, pal, logoImg)));
  const ringTex = keep(glowTexture(T, collectible?.color || pal.accent, true));
  const haloMat = keep(new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.32, toneMapped: false }));
  const ringMat = keep(new T.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.7, toneMapped: false, side: T.DoubleSide }));
  const disc = keep(new T.CircleGeometry(0.5, 48));
  const plate = keep(new T.CylinderGeometry(0.53, 0.53, 0.06, 48));
  plate.rotateX(Math.PI / 2);
  const rim = keep(new T.TorusGeometry(0.53, 0.035, 8, 48));
  const quad = keep(new T.PlaneGeometry(1, 1));
  const flatQuad = keep(new T.PlaneGeometry(1, 1));
  flatQuad.rotateX(-Math.PI / 2);
  const bandTex = keep(canvasTexture(T, bandCanvas(m, pal, logoImg)));
  const bandMat = keep(new T.MeshBasicMaterial({ map: bandTex, toneMapped: false, side: T.DoubleSide }));
  const postMat = keep(new T.MeshStandardMaterial({ color: pal.primary, roughness: 0.4 }));
  const zoneTex = keep(canvasTexture(T, zoneCanvas(m, pal, logoImg)));
  const zoneMat = keep(new T.MeshBasicMaterial({ map: zoneTex, transparent: true, opacity: 0.9, depthWrite: false, side: T.DoubleSide }));
  const skinGeo = keep(new T.SphereGeometry(1, 32, 20));
  const postCap = keep(new T.MeshStandardMaterial({ color: pal.secondary, roughness: 0.35, metalness: 0.2 }));
  const gateGlow = keep(new T.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
  const api = {
    /** flat target on a wall: disc facing n, diameter dM */
    wallTarget(p, n, dM, eye = null) {
      if (eye) {
        let tx = eye.x - p.x, tz = eye.z - p.z;
        const tl = Math.hypot(tx, tz) || 1;
        tx /= tl;
        tz /= tl;
        if (n.x * tx + n.z * tz > -0.2) {
          let nx = n.x + tx * 1.1, nz = n.z + tz * 1.1;
          const l = Math.hypot(nx, nz) || 1;
          n = { x: nx / l, y: n.y * 0.5, z: nz / l };
        }
      }
      const g = new T.Group();
      g.name = "br:wall-target";
      const body = new T.Group();
      const back = new T.Mesh(plate, backMat);
      back.position.z = 0.03;
      const face = new T.Mesh(disc, faceMat);
      face.position.z = 0.065;
      const ring = new T.Mesh(rim, rimMat);
      ring.position.z = 0.065;
      const halo = new T.Mesh(quad, pulseMat);
      halo.scale.setScalar(1.7);
      halo.position.z = 5e-3;
      halo.renderOrder = 1;
      body.add(halo, back, face, ring);
      if (collectible?.make) {
        const item = collectible.make();
        item.userData.glow.visible = false;
        const k = 0.95 / Math.max(0.05, m.round.collectible.heightM);
        item.scale.setScalar(k);
        item.position.set(0, -0.475, 0.32);
        item.name = "br:target-product";
        body.add(item);
        body.userData.product = item;
      }
      body.scale.setScalar(dM);
      g.add(body);
      g.position.set(p.x, p.y, p.z);
      g.lookAt(p.x + n.x, p.y + n.y, p.z + n.z);
      g.userData = { kind: "wall", body, halo, base: dM, t: Math.random() * 6, hitR: dM * 0.62 };
      return g;
    },
    /** the brand's collectible floating above a floor spot (bob + spin + glow ring on the ground) */
    floater(p, heightAbove, sizeM) {
      const g = new T.Group();
      g.name = "br:floater";
      const item = collectible.make();
      const k = sizeM / Math.max(0.05, m.round.collectible.heightM);
      item.scale.setScalar(k);
      item.userData.glow.visible = false;
      const ring = new T.Mesh(flatQuad, ringMat);
      ring.scale.setScalar(Math.max(0.9, sizeM * 1.9));
      ring.position.y = 0.03 * k;
      ring.renderOrder = 2;
      g.add(ring, item);
      g.position.set(p.x, p.y, p.z);
      g.userData = { kind: "floater", body: item, ring, lift: heightAbove, size: sizeM, t: Math.random() * 6, hitR: sizeM * 0.6, spin: m.round.collectible.spin !== false, bob: m.round.collectible.bob !== false };
      item.position.y = heightAbove;
      return g;
    },
    /** the brand collectible sized to dress a host entity (child of the entity's parent) */
    dress(sizeM) {
      const item = collectible.make();
      item.userData.glow.visible = false;
      const k = sizeM / Math.max(0.05, m.round.collectible.heightM);
      item.scale.setScalar(k);
      item.name = "br:dress";
      return item;
    },
    /** a drive-through gate (two posts + brand band + soft glow pane), wM wide, facing dir (x,z) */
    gate(p, dir, wM, hM) {
      const g = new T.Group();
      g.name = "br:gate";
      const r4 = Math.max(0.12, wM * 0.04);
      for (const s of [-1, 1]) {
        const post = new T.Mesh(keep(new T.CylinderGeometry(r4, r4 * 1.15, hM, 12)), postMat);
        post.position.set(s * wM / 2, hM / 2, 0);
        const cap = new T.Mesh(keep(new T.SphereGeometry(r4 * 1.6, 14, 10)), postCap);
        cap.position.set(s * wM / 2, hM, 0);
        g.add(post, cap);
      }
      const band = new T.Mesh(quad, bandMat);
      band.scale.set(wM, wM / 8, 1);
      band.position.y = hM - wM / 16;
      band.rotation.y = Math.PI;
      const pane = new T.Mesh(quad, gateGlow);
      pane.scale.set(wM, hM - wM / 8, 1);
      pane.position.y = (hM - wM / 8) / 2;
      g.add(band, pane);
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = Math.atan2(dir.x, dir.z);
      g.userData = { kind: "gate", band, pane, w: wM, h: hM, t: 0 };
      return g;
    },
    /** a branded target zone filling (part of) a goal mouth: panel `wM × hM` at p, facing n (toward the pitch) */
    goalZone(p, n, wM, hM) {
      const g = new T.Group();
      g.name = "br:goal-zone";
      const panel = new T.Mesh(quad, zoneMat);
      panel.scale.set(wM, hM, 1);
      panel.renderOrder = 3;
      g.add(panel);
      g.position.set(p.x, p.y, p.z);
      g.lookAt(p.x + n.x, p.y + n.y, p.z + n.z);
      g.userData = { kind: "zone", body: panel, w: wM, h: hM, t: 0, flash: 0 };
      return g;
    },
    /** a printed shell a hair larger than the game's ball, as a child of it: the ball stays the game's own object */
    ballSkin(radius) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const x = c.getContext("2d");
      x.fillStyle = pal.primary;
      x.fillRect(0, 0, 512, 256);
      x.fillStyle = pal.secondary;
      x.fillRect(0, 52, 512, 22);
      x.fillRect(0, 182, 512, 22);
      for (const cx of [128, 384]) {
        x.fillStyle = "#ffffff";
        x.beginPath();
        x.arc(cx, 128, 46, 0, Math.PI * 2);
        x.fill();
        if (logoImg?.width) {
          const k = Math.min(80 / logoImg.width, 80 / logoImg.height);
          x.drawImage(logoImg, cx - logoImg.width * k / 2, 128 - logoImg.height * k / 2, logoImg.width * k, logoImg.height * k);
        } else {
          x.fillStyle = pal.accent;
          x.beginPath();
          x.arc(cx, 128, 26, 0, Math.PI * 2);
          x.fill();
        }
      }
      const tex = keep(canvasTexture(T, c));
      const mat = keep(new T.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0 }));
      const skin = new T.Mesh(skinGeo, mat);
      skin.scale.setScalar(radius * 1.035);
      skin.name = "br:ball-skin";
      skin.castShadow = true;
      return skin;
    },
    /** a small pool of confetti chips for hit bursts (meshes, so they convert to any host) */
    bursts(n = 36, u = 1) {
      const root = new T.Group();
      root.name = "br:bursts";
      const geo = keep(new T.OctahedronGeometry(0.07 * u, 0));
      const mats = [pal.primary, pal.primary, pal.secondary, pal.accent, pal.primary, "#ffffff"].map((c) => keep(new T.MeshBasicMaterial({ color: c, toneMapped: false })));
      const parts = [];
      for (let i = 0; i < n; i++) {
        const o = new T.Mesh(geo, mats[i % mats.length]);
        o.visible = false;
        root.add(o);
        parts.push({ o, v: new T.Vector3(), life: 0, age: 1 });
      }
      let next = 0;
      return {
        root,
        emit(pos, k = 14, spread = 1) {
          for (let i = 0; i < k; i++) {
            const q = parts[next++ % parts.length];
            q.o.position.set(pos.x, pos.y, pos.z);
            q.v.set(Math.random() - 0.5, Math.random() * 0.8 + 0.3, Math.random() - 0.5).normalize().multiplyScalar((2.5 + Math.random() * 3) * u * spread);
            q.age = 0;
            q.life = 0.55 + Math.random() * 0.4;
            q.o.visible = true;
          }
        },
        update(dt) {
          for (const q of parts) {
            if (q.age >= q.life) {
              if (q.o.visible) q.o.visible = false;
              continue;
            }
            q.age += dt;
            q.v.y -= 9 * u * dt;
            q.o.position.addScaledVector(q.v, dt);
            q.o.rotation.x += dt * 7;
            q.o.rotation.y += dt * 5;
            q.o.scale.setScalar(Math.max(0.01, 1.4 * (1 - q.age / q.life)));
          }
        }
      };
    },
    /** per-frame animation of one spawned object; returns false once a pop has finished */
    animate(g, dt) {
      const d = g.userData;
      d.t += dt;
      if (d.pop != null) {
        d.pop += dt;
        const k = d.pop < 0.09 ? 1 + d.pop * 4 : Math.max(0, 1.36 * (1 - (d.pop - 0.09) / 0.22));
        (d.body || g).scale.setScalar((d.kind === "wall" ? d.base : d.body?.userData?.k0 ?? (d.body.userData.k0 = d.body.scale.x)) * k);
        if (d.ring) d.ring.visible = false;
        if (k <= 0) {
          g.visible = false;
          return false;
        }
        return true;
      }
      if (d.kind === "wall") {
        const k = Math.sin(d.t * 3.2);
        d.halo.scale.setScalar(1.7 + k * 0.15);
        d.body.scale.setScalar(d.base * (1 + k * 0.025));
        if (d.body.userData.product) d.body.userData.product.rotation.y = Math.sin(d.t * 1.3) * 0.52;
      }
      if (d.kind === "floater") {
        const b = d.body;
        if (d.bob) b.position.y = d.lift + Math.sin(d.t * 2.2) * Math.min(0.12, d.size * 0.15);
        if (d.spin) b.rotation.y += dt * 1.4;
        d.ring.scale.setScalar(Math.max(0.9, d.size * 1.9) * (1 + Math.sin(d.t * 2.2) * 0.06));
      }
      if (d.kind === "gate") d.pane.visible = !d.done;
      if (d.kind === "zone") {
        d.flash = Math.max(0, d.flash - dt * 2.5);
        const k = 1 + Math.sin(d.t * 3) * 0.02 + d.flash * 0.12;
        d.body.scale.set(d.w * k, d.h * k, 1);
        d.body.material.opacity = 0.82 + Math.sin(d.t * 3.2) * 0.1 + d.flash * 0.18;
      }
      return true;
    },
    pop(g) {
      if (g.userData.pop == null) g.userData.pop = 0;
    },
    /** shared pulse, once per frame (the glow behind every wall target) */
    pulse(t) {
      pulseMat.opacity = 0.3 + Math.sin(t * 3.2) * 0.14;
    },
    /** re-arm a popped target (respawning targets): back to full size, visible, at its (possibly new) spot */
    rearm(g) {
      const d = g.userData;
      d.pop = null;
      if (d.kind === "wall") d.body.scale.setScalar(d.base);
      else if (d.body?.userData?.k0) d.body.scale.setScalar(d.body.userData.k0);
      if (d.ring) d.ring.visible = true;
      d.rise = 0;
      g.visible = true;
    },
    /** the logo flash on a hit: a disc with the logo that faces the camera, swells and fades (pool of 4) */
    flashes(u = 1) {
      const root = new T.Group();
      root.name = "br:flashes";
      const pool = [];
      for (let i = 0; i < 4; i++) {
        const mat = keep(new T.MeshBasicMaterial({ map: flashTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, toneMapped: false }));
        const o = new T.Mesh(disc, mat);
        o.visible = false;
        o.renderOrder = 10;
        root.add(o);
        pool.push({ o, mat, age: 1, life: 0.6, size: 1 });
      }
      let next = 0;
      return {
        root,
        emit(pos, size) {
          const q = pool[next++ % pool.length];
          q.o.position.set(pos.x, pos.y, pos.z);
          q.age = 0;
          q.size = Math.max(0.6 * u, size);
          q.o.visible = true;
        },
        update(dt, cam) {
          for (const q of pool) {
            if (q.age >= q.life) {
              if (q.o.visible) {
                q.o.visible = false;
                q.mat.opacity = 0;
              }
              continue;
            }
            q.age += dt;
            const k = q.age / q.life;
            q.o.scale.setScalar(q.size * (0.8 + k * 0.9));
            q.mat.opacity = k < 0.15 ? k / 0.15 : Math.max(0, 1 - (k - 0.15) / 0.85);
            if (cam) q.o.lookAt(cam.x, cam.y, cam.z);
          }
        }
      };
    },
    printTexture: () => keep(canvasTexture(T, printCanvas(m, pal, logoImg))),
    dispose() {
      for (const x of owned) {
        try {
          x.dispose();
        } catch {
        }
      }
    }
  };
  return api;
}
var trimmed;
var init_props = __esm({
  "../../sdk/inworld/props.js"() {
    init_builders();
    trimmed = /* @__PURE__ */ new WeakMap();
  }
});

// ../../sdk/click-params.js
function triggerFor(format, tokenTrigger) {
  if (format === "zone") return "zone";
  if (format === "prop" || format === "portal") return "proximity";
  if (tokenTrigger === "rewarded" || tokenTrigger === "portal") return "rewarded";
  return "intermission";
}
function expandTemplate(tpl, values = {}) {
  return String(tpl || "").replace(/\{([a-z_]+)\}/g, (m, k) => MACROS.includes(k) ? encodeURIComponent(values[k] == null ? "" : String(values[k])) : m);
}
function appendParams(url, pairs) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  for (const [k, v] of pairs) if (v != null && v !== "" && !u.searchParams.has(k)) u.searchParams.append(k, String(v));
  return u.href;
}
function clickValues(spec = {}, click = {}) {
  const format = pick(click.format, CLICK_FORMATS) || "inworld";
  const placement = pick(click.placement, PLACEMENTS) || (format === "prop" || format === "portal" ? format : "endcard");
  const ctxOnly = !!spec.contextual;
  const num5 = (v2) => v2 == null || v2 === "" || !Number.isFinite(Number(v2)) ? null : Math.round(Number(v2));
  const v = {
    click_id: ctxOnly ? null : spec.brclid || null,
    campaign_id: spec.campaignId || null,
    creative_id: spec.creativeId || null,
    game: spec.game || null,
    format,
    trigger: triggerFor(format, spec.tokenTrigger),
    placement,
    score: num5(click.score),
    completed: click.completed == null ? null : click.completed ? 1 : 0,
    dwell: num5(click.dwell),
    device: pick(click.device || spec.device, ["mobile", "desktop"]),
    country: /^[A-Z]{2}$/.test(click.country || spec.country || "") ? click.country || spec.country : null,
    ts: Math.floor((click.ts || Date.now()) / 1e3)
  };
  if (ctxOnly) {
    for (const k of PER_CLICK_MACROS) if (k !== "click_id") v[k] = null;
  }
  return v;
}
function trackingParams(spec = {}, click = {}) {
  const v = clickValues(spec, click);
  const utm = [
    ["utm_source", "bonusround"],
    ["utm_medium", "playable_ad"],
    ["utm_campaign", spec.campaignSlug || spec.campaignId || null],
    ["utm_content", v.creative_id ? `${v.creative_id}_${v.format}` : v.format],
    ["utm_term", v.game],
    ["utm_id", v.campaign_id]
  ];
  if (spec.contextual) return utm;
  return [
    ...utm,
    ["brclid", v.click_id],
    ["br_game", v.game],
    ["br_pub", spec.pub || null],
    ["br_format", v.format],
    ["br_trigger", v.trigger],
    ["br_placement", v.placement],
    ["br_score", v.score],
    ["br_completed", v.completed],
    ["br_dwell", v.dwell],
    ["br_device", v.device],
    ["br_country", v.country],
    ["br_ts", v.ts]
  ];
}
function buildDestination(spec = {}, click = {}) {
  let url = spec.url;
  if (spec.template) {
    const t = expandTemplate(spec.template, clickValues(spec, click));
    if (/^https?:\/\/[^/\s]+/i.test(t)) {
      try {
        url = new URL(t).href;
      } catch {
      }
    }
  }
  if (!url) return null;
  if (spec.autoUtm !== false) url = appendParams(url, trackingParams(spec, click));
  if (spec.house) url = appendParams(url, [["ref", HOUSE_REF]]);
  return url;
}
var CLICK_FORMATS, PLACEMENTS, MACROS, PER_CLICK_MACROS, HOUSE_REF, pick;
var init_click_params = __esm({
  "../../sdk/click-params.js"() {
    CLICK_FORMATS = ["inworld", "brandworld", "zone", "prop", "portal", "arena"];
    PLACEMENTS = ["endcard", "prop", "portal", "toast"];
    MACROS = ["click_id", "campaign_id", "creative_id", "game", "format", "trigger", "placement", "score", "device", "country", "ts"];
    PER_CLICK_MACROS = /* @__PURE__ */ new Set(["click_id", "score", "device", "country", "ts"]);
    HOUSE_REF = "bonus-round-ad";
    pick = (v, list) => list.includes(v) ? v : null;
  }
});

// ../../sdk/click.js
function noteApi(ok) {
  S.down = !ok;
}
function registerCta(cta, state = null) {
  const c = clickToken(cta?.url);
  if (!c) return;
  const prev = S.ctas.get(c);
  S.ctas.set(c, { fallback: cta.fallback || prev?.fallback || null, state: state || prev?.state || null });
  if (S.ctas.size > 50) S.ctas.delete(S.ctas.keys().next().value);
}
function withFormat(url, format) {
  if (!isClickUrl(url) || !format) return url;
  const u = new URL(url);
  if (!u.searchParams.has("fm")) u.searchParams.set("fm", format);
  return u.href;
}
function ctaHref(url, hints = {}) {
  const c = clickToken(url);
  if (!c) return url;
  const u = new URL(url);
  const e = S.ctas.get(c);
  let st = {};
  try {
    st = e?.state?.() || {};
  } catch {
  }
  const format = u.searchParams.get("fm") || hints.format || null;
  const placement = u.searchParams.get("pl") || hints.placement || null;
  const offline = S.down || typeof navigator !== "undefined" && navigator.onLine === false;
  if (offline && e?.fallback) {
    const direct = buildDestination(e.fallback, { format, placement, score: st.score, completed: st.completed, dwell: st.dwell, device: e.fallback.contextual ? null : deviceGuess(), ts: Date.now() });
    if (direct) return direct;
  }
  const add = { fm: format, pl: placement, sc: st.score, cp: st.completed == null ? null : st.completed ? 1 : 0, dw: st.dwell };
  for (const [k, v] of Object.entries(add)) if (v != null && v !== "" && !u.searchParams.has(k)) u.searchParams.set(k, String(typeof v === "number" ? Math.round(v) : v));
  return u.href;
}
function openCta(url, hints = {}) {
  const href = ctaHref(url, hints);
  if (!href || !/^https?:/i.test(href)) return null;
  try {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener sponsored";
    a.style.display = "none";
    document.documentElement.appendChild(a);
    a.click();
    a.remove();
  } catch {
    try {
      window.open(href, "_blank", "noopener");
    } catch {
    }
  }
  S.last = { href, at: Date.now() };
  return href;
}
var S, clickToken, isClickUrl, deviceGuess;
var init_click = __esm({
  "../../sdk/click.js"() {
    init_click_params();
    S = globalThis.__brClick || (globalThis.__brClick = { down: false, ctas: /* @__PURE__ */ new Map() });
    clickToken = (url) => {
      try {
        const u = new URL(url);
        return /\/v1\/click$/.test(u.pathname) ? u.searchParams.get("c") : null;
      } catch {
        return null;
      }
    };
    isClickUrl = (url) => !!clickToken(url);
    deviceGuess = () => {
      try {
        if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") return navigator.userAgentData.mobile ? "mobile" : "desktop";
      } catch {
      }
      try {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 820 ? "mobile" : "desktop";
      } catch {
        return null;
      }
    };
  }
});

// ../../sdk/proximity.js
function usedKeys(world) {
  const list = [...world?.controls || [], ...world?.gameplayHooks?.controls || []];
  const used = /* @__PURE__ */ new Set();
  for (const c of list) {
    const s = String(c?.input || c?.key || c || "");
    for (const m of s.matchAll(/\bKey([A-Z])\b/g)) used.add(m[1]);
    for (const m of s.matchAll(/(?:^|[\s/,(+])([A-Z])(?=$|[\s/,):+])/g)) used.add(m[1]);
  }
  return used;
}
function chooseKey(world, wanted = "E") {
  const used = usedKeys(world);
  const w = String(wanted || "E").replace(/^Key/i, "").toUpperCase().slice(0, 1) || "E";
  const pick2 = [w, "F", "Q", "G", "R", "T"].find((k) => !used.has(k)) || w;
  return { code: `Key${pick2}`, label: pick2, avoided: pick2 !== w ? w : null };
}
function dockRect(dock, W, H) {
  const d = dock || "top";
  if (d === "top-right") return { x0: W - 440, y0: 0, x1: W, y1: 96 };
  if (d === "top-left") return { x0: 0, y0: 0, x1: 440, y1: 96 };
  if (d === "bottom-left") return { x0: 0, y0: H - 120, x1: 440, y1: H };
  return { x0: W / 2 - 300, y0: 0, x1: W / 2 + 300, y1: 96 };
}
function createProximity(o) {
  const showMs = o.showMs || 4e3;
  const st = { kind: o.kind, state: "idle", shown: 0, ignored: false, played: 0, learnMore: 0, portalEnters: 0, confirms: 0, lastDist: null, key: o.key?.label || "E" };
  const host = document.createElement("div");
  host.setAttribute("data-bonusround-proximity", "");
  host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483646";
  const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
  root.innerHTML = `<style>${CSS3}</style>`;
  document.documentElement.appendChild(host);
  const pal = o.brand?.palette || {};
  host.style.setProperty("--p", pal.primary || "#6b4dff");
  const touch = isTouch();
  let card = null, cardMode = null, hideT = 0, shownAt = 0, prevSide = null, confirmCooldownUntil = 0;
  const brand2 = esc4(o.brand?.name || "Sponsor");
  const keyHtml = `<kbd>${esc4(o.key?.label || "E")}</kbd>`;
  const reward = () => (typeof o.reward === "function" ? o.reward() : o.reward) || null;
  function html(mode) {
    if (mode === "confirm") {
      const r0 = reward(), rw = r0 ? /^[+\d]/.test(r0) ? ` <b>${esc4(r0.startsWith("+") ? r0 : "+" + r0)}</b>` : ` <b>Reward: ${esc4(r0)}</b>` : "";
      return `<span class="ad">Ad</span><span><span class="b">${brand2}</span> \xB7 Enter Bonus Round?${rw}<br>${touch ? "Tap to play" : `${keyHtml} to play`}</span><button class="x" type="button" aria-label="No thanks">\u2715</button>`;
    }
    if (o.kind === "portal") {
      const rw = reward() ? ` for <b>${esc4(reward())}</b>` : "";
      return `<span class="ad">Ad</span><span><span class="b">${brand2}</span> \u2014 ${touch ? "Tap to play" : `Press ${keyHtml} to play`} a 15 s round${rw}</span>`;
    }
    return `<span class="ad">Ad</span><span><span class="b">${brand2}</span> \xB7 ${touch ? "Tap to learn more" : `Press ${keyHtml} to learn more`}</span>`;
  }
  function show(mode) {
    hide(true);
    card = document.createElement("div");
    card.className = "c" + (mode === "confirm" ? " big" : "");
    card.setAttribute("role", "dialog");
    card.innerHTML = `<span class="tail"></span>${html(mode)}`;
    card.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    }, true);
    card.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.closest?.(".x")) {
        dismiss("closed");
        return;
      }
      act();
    });
    root.appendChild(card);
    cardMode = mode;
    shownAt = performance.now();
    st.state = mode;
    position();
    requestAnimationFrame(() => card?.classList.add("on"));
    clearTimeout(hideT);
    hideT = setTimeout(() => dismiss("ignored"), mode === "confirm" ? Math.max(showMs, 6e3) : showMs);
  }
  function hide(now2) {
    clearTimeout(hideT);
    if (!card) return;
    const c = card;
    card = null;
    cardMode = null;
    if (now2) c.remove();
    else {
      c.classList.remove("on");
      setTimeout(() => c.remove(), 300);
    }
  }
  function dismiss(why) {
    if (!card) return;
    const mode = cardMode;
    hide(false);
    if (mode === "card" && why === "ignored") st.ignored = true;
    if (mode === "card" && why === "closed") st.ignored = true;
    st.state = st.ignored ? "cooldown" : "idle";
    if (mode === "confirm") confirmCooldownUntil = performance.now() + 8e3;
    o.onDismiss?.(why, mode);
  }
  function freePointer() {
    try {
      if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    } catch {
    }
  }
  function act() {
    const mode = cardMode;
    if (!mode) return;
    hide(false);
    st.state = "acted";
    if (o.kind === "portal" || mode === "confirm") {
      st.played++;
      o.onPlay?.();
      return;
    }
    st.learnMore++;
    freePointer();
    if (o.url) {
      const a = document.createElement("a");
      a.href = ctaHref(o.url, { placement: o.kind === "portal" ? "portal" : "prop", format: o.kind === "portal" ? "portal" : "prop" });
      a.target = "_blank";
      a.rel = "noopener sponsored";
      a.style.display = "none";
      document.documentElement.appendChild(a);
      a.click();
      a.remove();
    }
    o.onLearnMore?.();
    st.ignored = true;
  }
  const onKey = (e) => {
    if (!card || e.repeat) return;
    if (e.code === (o.key?.code || "KeyE")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      act();
    } else if (e.code === "Escape" && cardMode === "confirm") {
      e.preventDefault();
      e.stopImmediatePropagation();
      dismiss("closed");
    }
  };
  addEventListener("keydown", onKey, true);
  const cam = o.camera;
  function project(p) {
    try {
      cam.updateMatrixWorld?.();
      const vi = cam.matrixWorldInverse.elements, pr = cam.projectionMatrix.elements;
      const x = vi[0] * p.x + vi[4] * p.y + vi[8] * p.z + vi[12], y = vi[1] * p.x + vi[5] * p.y + vi[9] * p.z + vi[13], z = vi[2] * p.x + vi[6] * p.y + vi[10] * p.z + vi[14];
      if (z > -0.1) return null;
      const cx = pr[0] * x + pr[4] * y + pr[8] * z + pr[12], cy = pr[1] * x + pr[5] * y + pr[9] * z + pr[13], cw = pr[3] * x + pr[7] * y + pr[11] * z + pr[15];
      return { x: cx / cw, y: cy / cw };
    } catch {
      return null;
    }
  }
  const camPos = () => {
    const e = cam.matrixWorld.elements;
    return { x: e[12], y: e[13], z: e[14] };
  };
  function inView() {
    const a = o.getAnchor(), s = project(a);
    if (!s || Math.abs(s.x) > 0.92 || Math.abs(s.y) > 0.92) return false;
    const n = o.getNormal?.();
    const facing = o.facing || "front";
    if (!n || facing === "any") return true;
    const c = o.getCenter(), p = camPos();
    let vx = p.x - c.x, vy = p.y - c.y, vz = p.z - c.z;
    const l = Math.hypot(vx, vy, vz) || 1;
    let dn = (vx * n.x + vy * n.y + vz * n.z) / l;
    if (facing === "both") dn = Math.abs(dn);
    return dn > Math.cos(70 * Math.PI / 180);
  }
  function position() {
    if (!card) return;
    const s = project(o.getAnchor());
    const r4 = o.domElement?.getBoundingClientRect?.() || { left: 0, top: 0, width: innerWidth, height: innerHeight };
    const W = innerWidth, H = innerHeight;
    if (!s) {
      card.style.opacity = "0";
      return;
    }
    card.style.opacity = "";
    const px = r4.left + (s.x + 1) / 2 * r4.width, py = r4.top + (1 - s.y) / 2 * r4.height;
    const cw = card.offsetWidth || 260, ch = card.offsetHeight || 44;
    let right = px + 22 + cw < W - 8;
    let x = right ? px + 22 : px - 22 - cw, y = py - ch / 2;
    const d = dockRect(o.dock, W, H);
    const overlaps = (xx, yy) => xx < d.x1 && xx + cw > d.x0 && yy < d.y1 && yy + ch > d.y0;
    if (overlaps(x, y)) y = d.y0 < 10 ? d.y1 + 8 : d.y0 - ch - 8;
    x = clamp3(x, 8, W - cw - 8);
    y = clamp3(y, 8, H - ch - 8);
    card.classList.toggle("r", !right);
    card.style.transform = card.classList.contains("on") ? `translate(${Math.round(x)}px,${Math.round(y)}px)` : `translate(${Math.round(x)}px,${Math.round(y + 6)}px) scale(.96)`;
  }
  return {
    stats: st,
    tick() {
      const pl = o.getPlayer?.();
      if (!pl) {
        if (card) position();
        return;
      }
      const c = o.getCenter();
      const u = o.upm || 1;
      const reach = o.kind === "prop" ? o.portalHalfWidth || 0 : 0;
      const d = Math.max(0, Math.hypot(pl.x - c.x, pl.z - c.z) - reach) / u;
      st.lastDist = +d.toFixed(2);
      if (o.kind === "portal") {
        const n = o.getNormal?.();
        if (n) {
          const side = (pl.x - c.x) * n.x + (pl.z - c.z) * n.z;
          const lateral = Math.abs((pl.x - c.x) * -n.z + (pl.z - c.z) * n.x);
          if (prevSide !== null && Math.sign(side) !== Math.sign(prevSide) && lateral < (o.portalHalfWidth || 2 * u) && Math.abs(side) < 2 * u) {
            st.portalEnters++;
            o.onPortalEnter?.();
            if (performance.now() > confirmCooldownUntil && cardMode !== "confirm") {
              st.confirms++;
              show("confirm");
            }
          }
          prevSide = side;
        }
      }
      if (st.state === "acted" && o.kind === "portal" && d > o.radiusM * 1.5) st.state = "idle";
      if (!card && !st.ignored && st.state !== "acted" && d <= o.radiusM && inView()) {
        st.shown++;
        show("card");
        o.onShown?.({ kind: o.kind, distanceM: st.lastDist, key: st.key });
      }
      if (card) position();
    },
    /** for a new round of the same prop (e.g. a fresh session after a reload): forget the cooldown */
    reset() {
      st.ignored = false;
      st.state = "idle";
      hide(true);
    },
    dispose() {
      hide(true);
      removeEventListener("keydown", onKey, true);
      host.remove();
    }
  };
}
var clamp3, esc4, isTouch, CSS3;
var init_proximity = __esm({
  "../../sdk/proximity.js"() {
    init_click();
    clamp3 = (v, a, b) => Math.max(a, Math.min(b, v));
    esc4 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    isTouch = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints || 0) > 1 && !matchMedia?.("(pointer: fine)")?.matches;
    CSS3 = `:host{all:initial}
.c{position:fixed;left:0;top:0;z-index:2147483646;pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:9px;max-width:340px;
  padding:8px 12px 8px 8px;border-radius:14px;background:rgba(18,16,34,.9);color:#fff;font:700 13px/1.25 system-ui,-apple-system,"Segoe UI",sans-serif;
  box-shadow:0 8px 26px rgba(0,0,0,.35),inset 0 0 0 2px var(--p,#6b4dff);opacity:0;transform:translateY(6px) scale(.96);transition:opacity .25s,transform .25s}
.c.on{opacity:1;transform:none}
.ad{flex:none;font:900 10px/1 system-ui,sans-serif;letter-spacing:.6px;background:#fff;color:#111;border-radius:5px;padding:3px 5px}
.b{font-weight:900}
kbd{font:900 12px/1 system-ui,sans-serif;display:inline-block;min-width:16px;text-align:center;padding:3px 5px;border-radius:6px;background:var(--p,#6b4dff);color:#fff;box-shadow:0 2px 0 rgba(0,0,0,.35)}
.x{all:unset;cursor:pointer;margin-left:2px;width:22px;height:22px;border-radius:50%;text-align:center;line-height:22px;background:rgba(255,255,255,.14);font-size:14px}
.tail{position:absolute;left:-6px;top:50%;width:10px;height:10px;background:rgba(18,16,34,.9);transform:translateY(-50%) rotate(45deg);box-shadow:-2px 2px 0 0 var(--p,#6b4dff)}
.c.r .tail{left:auto;right:-6px;box-shadow:2px -2px 0 0 var(--p,#6b4dff)}
.c.big{max-width:380px;padding:11px 14px 11px 10px;font-size:15px}`;
  }
});

// ../../sdk/inworld/scan.js
function worldPos(o, out = v3()) {
  try {
    o.updateWorldMatrix ? o.updateWorldMatrix(true, false) : o.updateMatrixWorld?.(true);
  } catch {
  }
  const e = o.matrixWorld.elements;
  out.x = e[12];
  out.y = e[13];
  out.z = e[14];
  return out;
}
function worldScale(o) {
  const e = o.matrixWorld.elements;
  return Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
}
function geomRadius(g) {
  if (!g) return 0;
  try {
    if (!g.boundingSphere) g.computeBoundingSphere?.();
  } catch {
  }
  return g.boundingSphere?.radius || 0;
}
function shown(o) {
  for (let p = o; p; p = p.parent) if (p.visible === false) return false;
  return true;
}
function under(o, root) {
  for (let p = o; p; p = p.parent) if (p === root) return true;
  return false;
}
function signature(o) {
  const m = Array.isArray(o.material) ? o.material[0] : o.material;
  const size = geomRadius(o.geometry) * 2 * worldScale(o);
  return `${o.geometry?.type || ""}|${m?.type || ""}|${matHex(m)}|${size.toFixed(1)}`;
}
function parseSignature(s) {
  if (typeof s !== "string") return null;
  s = s.trim();
  if (/^name:/i.test(s)) return { name: s.slice(5).trim() };
  if (/^geo:/i.test(s)) return { geoUuid: s.slice(4).trim() };
  let parts;
  if (s.includes("|")) parts = s.split("|").map((x) => x.trim());
  else if (/^[A-Z]\w*Geometry\b/.test(s)) parts = s.split(/\s+/);
  else return null;
  const geometryType = parts.find((x) => /Geometry$/.test(x)) || null;
  const materialType = parts.find((x) => /Material$/.test(x)) || null;
  const color = (parts.find((x) => /^#?[0-9a-f]{6}$/i.test(x)) || "").replace("#", "").toLowerCase() || null;
  const sz = parts.map((x) => x.replace(/^~/, "")).find((x) => /^\d+(\.\d+)?$/.test(x) && x.length < 7);
  return { geometryType, materialType, color, sizeM: sz ? +sz : null };
}
function entityMatcher(entityMatch, hooks, scene) {
  const ents = Array.isArray(hooks?.entities) ? hooks.entities : [];
  const fromEntity = (e) => {
    const sig2 = parseSignature(e.signature) || parseSignature(e.cluster) || {};
    return {
      ...sig2,
      geometryType: sig2.geometryType || e.geometryType || null,
      materialType: sig2.materialType || (typeof e.material === "string" ? e.material.split(" ")[0] : null),
      color: sig2.color || (e.colors?.[0] || /#([0-9a-f]{6})/i.exec(e.material || "")?.[0] || "").replace("#", "").toLowerCase() || null,
      sizeM: sig2.sizeM || (+e.sizeM || null),
      examples: e.examples || []
    };
  };
  let sig = parseSignature(entityMatch);
  if (!sig || !sig.name && !sig.geoUuid && !sig.geometryType) {
    const words = String(entityMatch || "").toLowerCase().split(/[^a-z0-9#]+/).filter((w) => w.length > 2 && !["the", "and", "game", "own", "all", "its"].includes(w));
    const hit = ents.filter((e) => !e.likelyScenery).find((e) => {
      const hay = `${e.cluster || ""} ${e.signature || ""} ${e.category || ""} ${(e.colors || []).join(" ")}`.toLowerCase();
      return words.some((w) => hay.includes(w));
    });
    if (hit) sig = fromEntity(hit);
    else if (words.length) sig = { words: [...new Set(words.map((w) => w.length <= 3 ? w : /ies$/.test(w) ? w.slice(0, -3) + "y" : /(ses|xes|ches|shes)$/.test(w) ? w.slice(0, -2) : w.replace(/s$/, "")))] };
    else return null;
  } else {
    const twin = ents.find((e) => e.signature === entityMatch || e.cluster === entityMatch);
    if (twin?.likelyScenery) return null;
    if (twin) sig = { ...fromEntity(twin), ...Object.fromEntries(Object.entries(sig).filter(([, v]) => v)) };
  }
  const geos = /* @__PURE__ */ new Set();
  for (const p of sig.examples || []) {
    const o = scene && resolvePath(scene, p);
    if (o?.geometry && matchSignature(o, sig)) geos.add(o.geometry.uuid);
  }
  const esc6 = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRe = sig.name ? new RegExp(`^${esc6(sig.name)}([_\\-. ]?\\d+)?$`, "i") : null;
  const wordRe = sig.words ? new RegExp(`(^|[^a-z])(${sig.words.map(esc6).join("|")})s?([_\\-. ]?\\d+)?($|[^a-z])`, "i") : null;
  const byName = (o, re) => {
    for (let p = o; p && !p.isScene; p = p.parent) if (typeof p.name === "string" && re.test(p.name)) return p;
    return null;
  };
  const geoAlt = sig.geoUuid && sig.geometryType && (sig.materialType || sig.color) ? { geometryType: sig.geometryType, materialType: sig.materialType, color: sig.color, sizeM: sig.sizeM } : null;
  const fn = (o) => {
    if (!o?.isMesh) return null;
    if (nameRe) return byName(o, nameRe);
    if (sig.geoUuid) return o.geometry?.uuid === sig.geoUuid || geoAlt && matchSignature(o, geoAlt) ? o : null;
    if (wordRe) return byName(o, wordRe);
    return geos.has(o.geometry?.uuid) || matchSignature(o, sig) ? o : null;
  };
  fn.byName = !!(nameRe || wordRe);
  return fn;
}
function matchSignature(o, sig) {
  if (!o?.isMesh || !sig) return false;
  const m = Array.isArray(o.material) ? o.material[0] : o.material;
  if (sig.geometryType && o.geometry?.type !== sig.geometryType) return false;
  if (sig.materialType && m?.type !== sig.materialType) return false;
  if (sig.color) {
    const h = matHex(m);
    if (!h || hexDist(h, sig.color) > 0.12) return false;
  }
  if (sig.sizeM) {
    const g = geomRadius(o.geometry) * 2, w = g * worldScale(o), ok = (s) => s > sig.sizeM * 0.6 && s < sig.sizeM * 1.6 + 0.05;
    if (!ok(w) && !ok(g)) return false;
  }
  return true;
}
function resolvePath(scene, path) {
  if (typeof path !== "string" || !path.startsWith("/")) return null;
  let o = scene;
  for (const seg of path.split("/").filter(Boolean)) {
    const [label, idx] = seg.split("#");
    const kids = o.children || [];
    let next = Number.isInteger(+idx) ? kids[+idx] : null;
    if (next && label && next.name !== label && next.type !== label) next = kids.find((c) => c.name === label || c.type === label) || null;
    if (!next && label) next = kids.find((c) => c.name === label) || null;
    if (!next) return null;
    o = next;
  }
  return o === scene ? null : o;
}
function meshTris(o, n) {
  const g = o.geometry, pos = g.attributes.position, idx = g.index, e = o.matrixWorld.elements;
  const was = levelCache.get(o), ver = `${g.uuid}|${pos.version}|${idx ? idx.version : -1}|${n}`;
  if (was && was.ver === ver && sameMatrix(was.me, e)) return was;
  const tris = new Float32Array(Math.floor(n / 3) * 9);
  const direct = pos.array && !pos.isInterleavedBufferAttribute && pos.itemSize === 3 ? pos.array : null;
  const ia = idx ? idx.array : null;
  const bb = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let t = 0, k = 0; t + 2 < n; t += 3) {
    for (let c = 0; c < 3; c++) {
      const vi = ia ? ia[t + c] : t + c;
      const x = direct ? direct[vi * 3] : pos.getX(vi), y = direct ? direct[vi * 3 + 1] : pos.getY(vi), z = direct ? direct[vi * 3 + 2] : pos.getZ(vi);
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12], wy = e[1] * x + e[5] * y + e[9] * z + e[13], wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      tris[k++] = wx;
      tris[k++] = wy;
      tris[k++] = wz;
      if (wx < bb[0]) bb[0] = wx;
      if (wy < bb[1]) bb[1] = wy;
      if (wz < bb[2]) bb[2] = wz;
      if (wx > bb[3]) bb[3] = wx;
      if (wy > bb[4]) bb[4] = wy;
      if (wz > bb[5]) bb[5] = wz;
    }
  }
  const entry = { ver, me: Float64Array.from(e), tris, bb, boxes: runBoxes(tris) };
  levelCache.set(o, entry);
  return entry;
}
function levelMeshes(scene, exclude, minRadius) {
  const list = [];
  scene.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.geometry?.attributes?.position) return;
    if (exclude(o) || !shown(o)) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || m.visible === false || m.transparent && m.opacity < 0.3 || m.depthWrite === false && m.transparent) return;
    try {
      o.updateWorldMatrix ? o.updateWorldMatrix(true, false) : o.updateMatrixWorld(true);
    } catch {
    }
    if (geomRadius(o.geometry) * worldScale(o) < minRadius) return;
    list.push(o);
  });
  return list;
}
async function warmLevel(scene, sliceMs = 6) {
  try {
    const list = levelMeshes(scene, () => false, 0);
    const slice = () => new Promise((r4) => window.requestIdleCallback ? requestIdleCallback(() => r4(), { timeout: 200 }) : setTimeout(r4, 16));
    let t = performance.now();
    for (const o of list) {
      const n = triCount(o);
      if (n / 3 > 15e4) continue;
      if (performance.now() - t > sliceMs) {
        await slice();
        t = performance.now();
      }
      try {
        o.updateWorldMatrix ? o.updateWorldMatrix(true, false) : o.updateMatrixWorld(true);
        meshTris(o, n);
      } catch {
      }
    }
  } catch {
  }
}
function runBoxes(T) {
  const nRun = Math.ceil(T.length / 9 / TRIS_PER_RUN), nGrp = Math.ceil(nRun / RUNS_PER_GROUP);
  const runs = new Float32Array(nRun * 6), groups = new Float32Array(nGrp * 6);
  for (let g = 0; g < nGrp; g++) {
    groups[g * 6] = groups[g * 6 + 1] = groups[g * 6 + 2] = Infinity;
    groups[g * 6 + 3] = groups[g * 6 + 4] = groups[g * 6 + 5] = -Infinity;
  }
  for (let r4 = 0; r4 < nRun; r4++) {
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let i = r4 * TRIS_PER_RUN * 9, iEnd = Math.min(T.length, i + TRIS_PER_RUN * 9); i < iEnd; i += 3) {
      const x = T[i], y = T[i + 1], z = T[i + 2];
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (z < z0) z0 = z;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
      if (z > z1) z1 = z;
    }
    const R6 = r4 * 6;
    runs[R6] = x0;
    runs[R6 + 1] = y0;
    runs[R6 + 2] = z0;
    runs[R6 + 3] = x1;
    runs[R6 + 4] = y1;
    runs[R6 + 5] = z1;
    const g = r4 / RUNS_PER_GROUP | 0, G = g * 6;
    if (x0 < groups[G]) groups[G] = x0;
    if (y0 < groups[G + 1]) groups[G + 1] = y0;
    if (z0 < groups[G + 2]) groups[G + 2] = z0;
    if (x1 > groups[G + 3]) groups[G + 3] = x1;
    if (y1 > groups[G + 4]) groups[G + 4] = y1;
    if (z1 > groups[G + 5]) groups[G + 5] = z1;
  }
  return { runs, groups };
}
function buildGrid(meshes) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity, nRuns = 0;
  for (const m of meshes) {
    x0 = Math.min(x0, m.bb[0]);
    z0 = Math.min(z0, m.bb[2]);
    x1 = Math.max(x1, m.bb[3]);
    z1 = Math.max(z1, m.bb[5]);
    nRuns += m.boxes.runs.length / 6;
  }
  if (!(x0 < Infinity) || !nRuns) return null;
  x0 -= 0.05;
  z0 -= 0.05;
  x1 += 0.05;
  z1 += 0.05;
  const cs = Math.max((x1 - x0) / 96, (z1 - z0) / 96, Math.sqrt((x1 - x0) * (z1 - z0) / Math.max(64, nRuns)), 0.5);
  const nx = Math.max(1, Math.ceil((x1 - x0) / cs)), nz = Math.max(1, Math.ceil((z1 - z0) / cs));
  const cells = new Array(nx * nz);
  meshes.forEach((m, mi) => {
    var _a;
    const R = m.boxes.runs, n = R.length / 6;
    for (let r4 = 0; r4 < n; r4++) {
      const bb = R.subarray(r4 * 6, r4 * 6 + 6), run = { mi, s: r4 * TRIS_PER_RUN * 9, e: Math.min(m.tris.length, (r4 + 1) * TRIS_PER_RUN * 9), bb, stamp: 0 };
      const ca = Math.max(0, Math.floor((bb[0] - 0.01 - x0) / cs)), cb = Math.min(nx - 1, Math.floor((bb[3] + 0.01 - x0) / cs));
      const za = Math.max(0, Math.floor((bb[2] - 0.01 - z0) / cs)), zb = Math.min(nz - 1, Math.floor((bb[5] + 0.01 - z0) / cs));
      for (let z = za; z <= zb; z++) for (let x = ca; x <= cb; x++) (cells[_a = z * nx + x] || (cells[_a] = [])).push(run);
    }
  });
  return { x0, z0, cs, nx, nz, cells, stamp: 0 };
}
function rayBoxAt(ox, oy, oz, dx, dy, dz, A, k, far) {
  _rb[0] = 0;
  _rb[1] = far;
  slab(ox, dx, A[k] - 0.01, A[k + 3] + 0.01, _rb);
  if (_rb[0] > _rb[1]) return false;
  slab(oy, dy, A[k + 1] - 0.01, A[k + 4] + 0.01, _rb);
  if (_rb[0] > _rb[1]) return false;
  slab(oz, dz, A[k + 2] - 0.01, A[k + 5] + 0.01, _rb);
  return _rb[0] <= _rb[1];
}
function slab(o, d, lo, hi, r4) {
  if (Math.abs(d) < 1e-12) {
    if (o < lo || o > hi) r4[0] = Infinity;
    return;
  }
  let ta = (lo - o) / d, tb = (hi - o) / d;
  if (ta > tb) {
    const x = ta;
    ta = tb;
    tb = x;
  }
  if (ta > r4[0]) r4[0] = ta;
  if (tb < r4[1]) r4[1] = tb;
}
function findSpots(level, opts) {
  const u = opts.upm || 1, H = (opts.playerH || 1.8) * u, reach = (opts.reach || 16) * u, jump = (opts.jumpM || 1.1) * u;
  const { eye, feet } = opts;
  const fw = opts.forward && Math.hypot(opts.forward.x, opts.forward.z) > 1e-6 ? opts.forward : { x: 0, z: -1 };
  const fl = Math.hypot(fw.x, fw.z), fx = fw.x / fl, fz = fw.z / fl;
  const angOf = (p) => {
    const dx = p.x - eye.x, dz = p.z - eye.z, l = Math.hypot(dx, dz) || 1;
    return Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / l)));
  };
  const walls = [], floors = [];
  const keepApart = (list, p, min) => list.every((s) => dist(s.p, p) >= min);
  const origins = [eye];
  for (const [ox, oz] of [[fx * 3, fz * 3], [-fz * 3.5, fx * 3.5], [fz * 3.5, -fx * 3.5]]) {
    const o = { x: eye.x + ox * u, y: eye.y, z: eye.z + oz * u };
    if (level.clear(eye, o)) origins.push(o);
  }
  for (const o of origins) {
    for (let a = 0; a < 360; a += 7.5) {
      for (const el of [-14, -4, 6, 16]) {
        const r4 = a * Math.PI / 180, e = el * Math.PI / 180;
        const dx = Math.sin(r4) * Math.cos(e), dy = Math.sin(e), dz = -Math.cos(r4) * Math.cos(e);
        const h = level.raycast(o.x, o.y, o.z, dx, dy, dz, reach);
        if (!h || Math.abs(h.ny) > 0.3 || h.t < 2 * u) continue;
        const p = { x: h.x + h.nx * 0.05 * u, y: h.y, z: h.z + h.nz * 0.05 * u };
        if (p.y < feet.y + 0.45 * H || p.y > feet.y + 2.4 * H) continue;
        if (!flatAround(level, h, 0.5 * u)) continue;
        if (o !== eye && !level.clear(eye, p)) continue;
        if (!keepApart(walls, p, 1.7 * u)) continue;
        walls.push({ p, n: { x: h.nx, y: h.ny, z: h.nz }, d: distXZ(p, feet), ang: angOf(p), on: h.o.name || "" });
      }
    }
  }
  const step = 1.3 * u, R = reach * 0.85;
  for (let gx = -R; gx <= R; gx += step) {
    for (let gz = -R; gz <= R; gz += step) {
      const x = feet.x + gx, z = feet.z + gz;
      if (Math.hypot(gx, gz) > R) continue;
      const h = level.raycast(x, feet.y + 2.5 * H, z, 0, -1, 0, 6 * H);
      if (!h || h.ny < 0.9) continue;
      const up = level.raycast(h.x, h.y + 0.05 * u, h.z, 0, 1, 0, 1.6 * H);
      if (up) continue;
      const knee = h.y + 0.45 * u;
      let hug = false;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]]) {
        if (level.raycast(h.x, knee, h.z, dx, 0, dz, 1.1 * u)) {
          hug = true;
          break;
        }
      }
      if (hug) continue;
      const p = { x: h.x, y: h.y, z: h.z };
      const d = distXZ(p, feet);
      if (d < 2.6 * u) continue;
      const seen = level.clear(eye, { x: p.x, y: p.y + 0.9 * u, z: p.z });
      const reachable = Math.abs(p.y - feet.y) < jump && level.clear({ x: feet.x, y: feet.y + 0.5 * u, z: feet.z }, { x: p.x, y: p.y + 0.5 * u, z: p.z });
      floors.push({ p, d, ang: angOf(p), seen, reachable });
    }
  }
  for (const w of opts.hooks?.walls || []) {
    const p = Array.isArray(w.position) ? { x: w.position[0], y: w.position[1], z: w.position[2] } : null;
    if (!p || !Array.isArray(w.normal) || distXZ(p, feet) > reach || !keepApart(walls, p, 1.7 * u)) continue;
    if (p.y < feet.y + 0.45 * H || p.y > feet.y + 2.4 * H || !level.clear(eye, p)) continue;
    walls.push({ p: { x: p.x + w.normal[0] * 0.05, y: p.y, z: p.z + w.normal[2] * 0.05 }, n: { x: w.normal[0], y: w.normal[1], z: w.normal[2] }, d: distXZ(p, feet), ang: angOf(p), on: w.on || "" });
  }
  const pref = (opts.preferM || 8) * u;
  const score = (s) => s.ang * 2.2 + Math.abs(s.d - pref) / (5 * u);
  walls.sort((a, b) => score(a) - score(b));
  floors.sort((a, b) => score(a) - score(b));
  return { walls, floors };
}
function flatAround(level, h, r4) {
  const n = { x: h.nx, y: h.ny, z: h.nz };
  let t1 = { x: -n.z, y: 0, z: n.x };
  const l = Math.hypot(t1.x, t1.z) || 1;
  t1 = { x: t1.x / l, y: 0, z: t1.z / l };
  const t2 = { x: n.y * t1.z - n.z * t1.y, y: n.z * t1.x - n.x * t1.z, z: n.x * t1.y - n.y * t1.x };
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ox = h.x + n.x * 0.3 + (t1.x * a + t2.x * b) * r4, oy = h.y + n.y * 0.3 + (t1.y * a + t2.y * b) * r4, oz = h.z + n.z * 0.3 + (t1.z * a + t2.z * b) * r4;
    const q = level.raycast(ox, oy, oz, -n.x, -n.y, -n.z, 0.6);
    if (!q || Math.abs(q.t - 0.3) > 0.08) return false;
  }
  return true;
}
function pickSpread(list, count, minSep) {
  const out = [];
  for (const s of list) {
    if (out.length >= count) break;
    if (out.every((o) => dist(o.p, s.p) >= minSep)) out.push(s);
  }
  return out;
}
function findPath(scene) {
  const out = [];
  scene.traverse((o) => {
    const mm = /^(checkpoint|waypoint|gate|cp|ring)[_\-. ]?(\d+)$/i.exec(o.name || "");
    if (mm) out.push({ o, k: +mm[2], p: worldPos(o, {}) });
  });
  out.sort((a, b) => a.k - b.k);
  return out.length >= 3 ? out : [];
}
function pathAhead(path, feet, forward) {
  if (!path.length) return [];
  const fl = Math.hypot(forward.x, forward.z) || 1, fx = forward.x / fl, fz = forward.z / fl;
  let best = 0, bd = Infinity;
  for (let i = 0; i < path.length; i++) {
    const a = path[i].p, b = path[(i + 1) % path.length].p;
    const abx = b.x - a.x, abz = b.z - a.z, L = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((feet.x - a.x) * abx + (feet.z - a.z) * abz) / L));
    const d = Math.hypot(a.x + abx * t - feet.x, a.z + abz * t - feet.z) - 0.5 * ((abx * fx + abz * fz) / Math.sqrt(L));
    if (d < bd) {
      bd = d;
      best = (i + 1) % path.length;
    }
  }
  return [...path.slice(best), ...path.slice(0, best)];
}
function findPlayer(opts) {
  const { scene, camera, host, hooks, world, upm = 1 } = opts;
  const hp = hooks?.player || {};
  const heightM = +hp.heightM || +world?.scale?.playerHeightM || 1.8;
  let eye = (+hp.eyeHeightM || +world?.scale?.cameraHeightM || heightM * 0.92) * upm;
  const camPos = () => worldPos(camera);
  if (host?.getPlayerPosition) {
    let root = null;
    const p0 = host.getPlayerPosition();
    if (p0 && scene) scene.traverse((o) => {
      if (root || o === scene || o.isCamera || o.isLight || !o.children?.length) return;
      const w = worldPos(o);
      if (Math.hypot(w.x - p0.x, w.y - p0.y, w.z - p0.z) < 0.05 * upm) {
        let has = false;
        o.traverse((x) => {
          if (x.isMesh) has = true;
        });
        if (has) root = o;
      }
    });
    return { feet: () => {
      const p = host.getPlayerPosition();
      return p ? v3(p.x, p.y, p.z) : camPos();
    }, root, via: "host", heightM };
  }
  for (const path of hp.paths || []) {
    const root = resolvePath(scene, path);
    if (root) return { feet: () => worldPos(root), root, via: "hooks", heightM };
  }
  const camDist = +world?.scale?.cameraDistanceM;
  const chase = ["third-person", "vehicle", "top-down", "side-scroller"].includes(world?.cameraMode) || camDist > 1.5;
  const first = world?.cameraMode === "first-person" || !chase && (hp.cameraIsPlayer || camDist === 0);
  if (first || !scene) return { feet: () => {
    const c = camPos();
    c.y -= eye;
    return c;
  }, root: null, via: "camera", heightM, first: true, setEye: (v) => {
    eye = v;
  } };
  const subj = typeof world?.movement?.subject === "string" && world.movement.subject.startsWith("/") ? resolvePath(scene, world.movement.subject) : null;
  if (subj && !subj.isCamera) return { feet: () => worldPos(subj), root: subj, via: "movement", heightM };
  if (!opts.noNames) {
    let named = null;
    scene.traverse((o) => {
      if (!named && !o.isCamera && PLAYER_NAME.test(o.name || "")) named = o;
    });
    if (named) return { feet: () => worldPos(named), root: named, via: "name", heightM };
  }
  const dM = (+world?.scale?.cameraDistanceM || 6) * upm, hM = (+world?.scale?.cameraHeightM || 3) * upm;
  let fixedGuess = null;
  const guess = () => {
    if (fixedGuess) return v3(fixedGuess.x, fixedGuess.y, fixedGuess.z);
    const c = camPos(), e = camera.matrixWorld.elements, fx = -e[8], fz = -e[10], l = Math.hypot(fx, fz) || 1;
    return v3(c.x + fx / l * dM, c.y - hM, c.z + fz / l * dM);
  };
  const cands = [];
  const c0 = camPos();
  const camAncestors = /* @__PURE__ */ new Set();
  for (let p = camera.parent; p; p = p.parent) camAncestors.add(p);
  scene.traverse((o) => {
    if (o === scene || o.isCamera || o.isLight || !o.parent || camAncestors.has(o) || opts.exclude?.(o)) return;
    if (o.children.length === 0 && !o.isMesh) return;
    if (o.isMesh && o.parent && o.parent !== scene && !o.parent.isScene && o.children.length === 0 && o.parent.children.length > 1) return;
    const p = worldPos(o);
    const d = dist(p, c0);
    if (d < 25 * upm && d > 0.3 * upm) cands.push({ o, p0: { ...p }, score: 0, moved: 0 });
  });
  cands.sort((a, b) => dist(a.p0, c0) - dist(b.p0, c0));
  cands.length = Math.min(cands.length, 400);
  let best = null, last = { ...c0 }, keyAt = 0;
  const MOVE = /^(Key[WASD]|Arrow(Up|Down|Left|Right))$/;
  const held = /* @__PURE__ */ new Set();
  const kd = (e) => {
    if (MOVE.test(e.code)) {
      held.add(e.code);
      keyAt = performance.now();
    }
  };
  const ku = (e) => {
    held.delete(e.code);
  };
  addEventListener("keydown", kd, true);
  addEventListener("keyup", ku, true);
  const prev = new Map(cands.map((k) => [k, { ...k.p0 }]));
  let lastT = performance.now();
  const pick2 = () => {
    if (best) return best;
    const now2 = performance.now();
    if (now2 - lastT < 60) return null;
    lastT = now2;
    const c = camPos(), camMoved = dist(c, last) > 0.03 * upm;
    const keys = held.size > 0 || now2 - keyAt < 150;
    for (const k of cands) {
      const p = worldPos(k.o), q = prev.get(k), step = dist(p, q);
      prev.set(k, { ...p });
      const moving = step > 0.02 * upm;
      if (camMoved) {
        const steady = Math.abs(dist(p, c) - dist(k.p0, c0)) < 1.2 * upm;
        if (steady && moving) k.score += 1;
        else if (!steady && moving) k.score -= 0.5;
      }
      if (keys) k.score += moving ? 1 : -0.5;
      else if (moving) k.score -= 1.5;
    }
    last = c;
    let top = null;
    for (const k of cands) if (k.score > (top?.score ?? 0)) top = k;
    if (top && top.score >= 12) {
      let o = top.o;
      for (let p = o.parent; p && !p.isScene; p = p.parent) {
        const k = cands.find((q) => q.o === p);
        if (k && k.score >= top.score * 0.7) o = p;
      }
      best = o;
      removeEventListener("keydown", kd, true);
      removeEventListener("keyup", ku, true);
    }
    return best;
  };
  return {
    feet: () => {
      const o = pick2();
      return o ? worldPos(o) : guess();
    },
    get root() {
      return best;
    },
    get via() {
      return best ? "motion" : "view";
    },
    heightM,
    /** where the camera looks on the ground (the session ray-casts it): the best stand-in until the search locks on */
    setGuess: (p) => {
      fixedGuess = p;
    }
  };
}
function createProjectileTracker({ scene, camera, hooks, isOurs: isOurs2 = () => false, exclude = () => false, upm = 1, prefer = null }) {
  const sigs = (hooks?.projectiles || []).map((p) => p.signature).filter(Boolean);
  const maxR = Math.max(0.8, ...sigs.map((s) => (+s.radius || 0) * 2.5)) * upm;
  const vMax = Math.max(120, ...(hooks?.projectiles || []).map((p) => (+p.speedMps || 0) * 1.8)) * upm;
  const tracked = /* @__PURE__ */ new Map();
  let scanT = 0;
  const st = { fires: 0, lastFire: 0, confirmed: false, launches: 0, candidates: 0, signature: null };
  const fireKeys = new Set((hooks?.projectiles || []).map((p) => p.input).filter((k) => k && !/click/.test(k)));
  const onDown = (e) => {
    if (e.button === 0 || e.button === 2) {
      st.fires++;
      st.lastFire = performance.now();
    }
  };
  const onKey = (e) => {
    if (fireKeys.has(e.code) && !e.repeat) {
      st.fires++;
      st.lastFire = performance.now();
    }
  };
  addEventListener("mousedown", onDown, true);
  addEventListener("keydown", onKey, true);
  const matchesHook = (o) => sigs.some((s) => o.geometry?.type === s.geometryType && (!s.radius || Math.abs(geomRadius(o.geometry) - s.radius) < s.radius * 0.35 + 0.01)) || !!prefer?.(o);
  const cam = v3(), camPrev = v3();
  let camInit = false;
  const rescan = () => {
    const seen = /* @__PURE__ */ new Set();
    scene.traverse((o) => {
      if (!o.isMesh || isOurs2(o) || exclude(o) || under(o, camera)) return;
      const r4 = geomRadius(o.geometry) * worldScale(o);
      if (!(r4 > 0 && r4 < maxR) && !matchesHook(o)) return;
      seen.add(o);
      if (!tracked.has(o)) tracked.set(o, { prev: null, fastFrames: 0, r: Math.max(r4, 0.05 * upm), hook: matchesHook(o) });
    });
    for (const o of tracked.keys()) if (!seen.has(o)) tracked.delete(o);
    st.candidates = tracked.size;
  };
  return {
    stats: st,
    get confirmed() {
      return st.confirmed;
    },
    update(dt) {
      if ((scanT -= dt) <= 0) {
        scanT = 0.25;
        rescan();
      }
      worldPos(camera, cam);
      const camV = camInit && dt > 0 ? dist(cam, camPrev) / dt : 0;
      camPrev.x = cam.x;
      camPrev.y = cam.y;
      camPrev.z = cam.z;
      camInit = true;
      const out = [];
      const now2 = performance.now();
      for (const [o, k] of tracked) {
        const p = worldPos(o);
        if (!k.prev || dt <= 0) {
          k.prev = p;
          continue;
        }
        const d = dist(p, k.prev), speed = d / dt;
        if (d > Math.max(4 * upm, vMax * Math.min(dt, 0.1)) || !shown(o)) {
          k.prev = p;
          k.fastFrames = 0;
          continue;
        }
        const fast = speed > 3 * upm && Math.abs(speed - camV) > 1.5 * upm;
        if (fast) {
          k.fastFrames++;
          if (k.fastFrames === 2) {
            st.launches++;
            const d0 = dist(k.prev, cam), afterFire = now2 - st.lastFire < 1200;
            if (d0 < 3.5 * upm || afterFire && d0 < 6 * upm || k.hook && prefer?.(o)) {
              st.confirmed = true;
              st.signature || (st.signature = signature(o));
              st.preferred || (st.preferred = !!prefer?.(o));
            }
          }
          out.push({ a: k.prev, b: p, r: k.r, o });
        } else k.fastFrames = 0;
        k.prev = p;
      }
      return out;
    },
    dispose() {
      removeEventListener("mousedown", onDown, true);
      removeEventListener("keydown", onKey, true);
      tracked.clear();
    }
  };
}
function segPointDist(a, b, c) {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const L = abx * abx + aby * aby + abz * abz;
  let t = L > 0 ? ((c.x - a.x) * abx + (c.y - a.y) * aby + (c.z - a.z) * abz) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(a.x + abx * t - c.x, a.y + aby * t - c.y, a.z + abz * t - c.z);
}
var v3, dist, distXZ, matHex, hexDist, levelCache, sameMatrix, triCount, Level, TRIS_PER_RUN, RUNS_PER_GROUP, _rb, PLAYER_NAME;
var init_scan = __esm({
  "../../sdk/inworld/scan.js"() {
    v3 = (x = 0, y = 0, z = 0) => ({ x, y, z });
    dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    distXZ = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
    matHex = (m) => {
      try {
        return m?.color?.getHexString ? m.color.getHexString() : "";
      } catch {
        return "";
      }
    };
    hexDist = (a, b) => {
      const p = (h, i) => parseInt(h.substr(i, 2), 16) / 255;
      return Math.hypot(p(a, 0) - p(b, 0), p(a, 2) - p(b, 2), p(a, 4) - p(b, 4));
    };
    levelCache = /* @__PURE__ */ new WeakMap();
    sameMatrix = (a, e) => {
      for (let i = 0; i < 16; i++) if (a[i] !== e[i]) return false;
      return true;
    };
    triCount = (o) => o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count;
    Level = class {
      /** exclude(o) → true skips o (our objects, the player, the camera rig); small or invisible meshes are skipped */
      constructor(scene, { exclude = () => false, minRadius = 0.25, maxTris = 4e5 } = {}) {
        this.meshes = [];
        let total = 0;
        for (const o of levelMeshes(scene, exclude, minRadius)) {
          const n = triCount(o);
          if (n / 3 > 15e4 || total + n / 3 > maxTris) continue;
          const { tris, bb, boxes } = meshTris(o, n);
          total += tris.length / 9;
          this.meshes.push({ o, tris, bb, boxes });
        }
        this.triangles = total;
      }
      get empty() {
        return this.triangles === 0;
      }
      /** nearest hit along a ray: { t, x, y, z, nx, ny, nz (facing the ray origin), o } | null. d need not be unit. */
      raycast(ox, oy, oz, dx, dy, dz, far = 100) {
        const L = Math.hypot(dx, dy, dz) || 1;
        dx /= L;
        dy /= L;
        dz /= L;
        const G = this.grid || (this.grid = buildGrid(this.meshes));
        if (!G) return null;
        let t0 = 0, t1 = far;
        _rb[0] = 0;
        _rb[1] = far;
        slab(ox, dx, G.x0, G.x0 + G.nx * G.cs, _rb);
        slab(oz, dz, G.z0, G.z0 + G.nz * G.cs, _rb);
        if (_rb[0] > _rb[1]) return null;
        t0 = _rb[0];
        t1 = _rb[1];
        const stamp = ++G.stamp;
        let best = null, bt = far, bKey = Infinity;
        const px0 = ox + dx * t0, pz0 = oz + dz * t0;
        let cx = Math.min(G.nx - 1, Math.max(0, Math.floor((px0 - G.x0) / G.cs))), cz = Math.min(G.nz - 1, Math.max(0, Math.floor((pz0 - G.z0) / G.cs)));
        const sx = dx > 0 ? 1 : dx < 0 ? -1 : 0, sz = dz > 0 ? 1 : dz < 0 ? -1 : 0;
        const tdx = sx ? G.cs / Math.abs(dx) : Infinity, tdz = sz ? G.cs / Math.abs(dz) : Infinity;
        let tmx = sx ? (G.x0 + (cx + (sx > 0 ? 1 : 0)) * G.cs - ox) / dx : Infinity;
        let tmz = sz ? (G.z0 + (cz + (sz > 0 ? 1 : 0)) * G.cs - oz) / dz : Infinity;
        let tCell = t0;
        for (; ; ) {
          if (tCell > bt) break;
          const cell = G.cells[cz * G.nx + cx];
          if (cell) {
            for (let k = 0; k < cell.length; k++) {
              const run = cell[k];
              if (run.stamp === stamp) continue;
              run.stamp = stamp;
              if (!rayBoxAt(ox, oy, oz, dx, dy, dz, run.bb, 0, bt)) continue;
              const m = this.meshes[run.mi], T = m.tris;
              for (let i = run.s; i < run.e; i += 9) {
                const ax = T[i], ay = T[i + 1], az = T[i + 2];
                const e1x = T[i + 3] - ax, e1y = T[i + 4] - ay, e1z = T[i + 5] - az;
                const e2x = T[i + 6] - ax, e2y = T[i + 7] - ay, e2z = T[i + 8] - az;
                const qpx = dy * e2z - dz * e2y, qpy = dz * e2x - dx * e2z, qpz = dx * e2y - dy * e2x;
                const det = e1x * qpx + e1y * qpy + e1z * qpz;
                if (det > -1e-9 && det < 1e-9) continue;
                const inv = 1 / det, wx = ox - ax, wy = oy - ay, wz = oz - az;
                const u = (wx * qpx + wy * qpy + wz * qpz) * inv;
                if (u < 0 || u > 1) continue;
                const qx = wy * e1z - wz * e1y, qy = wz * e1x - wx * e1z, qz = wx * e1y - wy * e1x;
                const v = (dx * qx + dy * qy + dz * qz) * inv;
                if (v < 0 || u + v > 1) continue;
                const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
                if (t <= 1e-4 || t > bt) continue;
                const key = run.mi * 1e9 + i;
                if (t === bt && (!best || key > bKey)) continue;
                bt = t;
                bKey = key;
                let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
                const nl = Math.hypot(nx, ny, nz) || 1;
                nx /= nl;
                ny /= nl;
                nz /= nl;
                if (nx * dx + ny * dy + nz * dz > 0) {
                  nx = -nx;
                  ny = -ny;
                  nz = -nz;
                }
                best = { t, x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, nx, ny, nz, o: m.o };
              }
            }
          }
          if (tmx < tmz) {
            tCell = tmx;
            tmx += tdx;
            cx += sx;
            if (cx < 0 || cx >= G.nx) break;
          } else if (tmz < Infinity) {
            tCell = tmz;
            tmz += tdz;
            cz += sz;
            if (cz < 0 || cz >= G.nz) break;
          } else break;
          if (tCell > t1) break;
        }
        return best;
      }
      /** clear line between two points (nothing in between, small slack at both ends) */
      clear(a, b, slack = 0.15) {
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz);
        if (d < slack * 2) return true;
        const h = this.raycast(a.x, a.y, a.z, dx, dy, dz, d - slack);
        return !h || h.t < slack;
      }
      ground(x, y, z, down = 8) {
        const h = this.raycast(x, y, z, 0, -1, 0, down);
        return h && h.ny > 0.6 ? h : null;
      }
    };
    TRIS_PER_RUN = 16;
    RUNS_PER_GROUP = 16;
    _rb = [0, 0];
    PLAYER_NAME = /^((player|hero|avatar|character)([_\-. ]?\d+)?|(kart|car|vehicle|ship|boat|bike)[_\-. ]player|player[_\-. ](kart|car|vehicle|ship|boat|bike))$/i;
  }
});

// ../../sdk/inworld/takeover.js
function drawFit2(g, img, cx, cy, w, h) {
  const k = Math.min(w / img.width, h / img.height);
  g.drawImage(img, cx - img.width * k / 2, cy - img.height * k / 2, img.width * k, img.height * k);
}
function roundRect(g, x, y, w, h, r4) {
  g.beginPath();
  g.moveTo(x + r4, y);
  g.arcTo(x + w, y, x + w, y + h, r4);
  g.arcTo(x + w, y + h, x, y + h, r4);
  g.arcTo(x, y + h, x, y, r4);
  g.arcTo(x, y, x + w, y, r4);
  g.closePath();
}
function billboardCanvas(m, pal, logo, product) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 1024, 512);
  gr.addColorStop(0, pal.primary);
  gr.addColorStop(1, pal.secondary);
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 512);
  g.globalAlpha = 0.14;
  g.fillStyle = "#ffffff";
  for (let x = -512; x < 1024; x += 96) {
    g.beginPath();
    g.moveTo(x, 512);
    g.lineTo(x + 48, 512);
    g.lineTo(x + 560, 0);
    g.lineTo(x + 512, 0);
    g.fill();
  }
  g.globalAlpha = 1;
  const hasP = !!product;
  const lx = hasP ? 40 : 60, lw = hasP ? 640 : 904;
  g.fillStyle = "#ffffff";
  roundRect(g, lx, 52, lw, 300, 40);
  g.fill();
  if (logo) drawFit2(g, logo, lx + lw / 2, 202, lw - 60, 260);
  g.fillStyle = readableOn(pal.primary, "#ffffff");
  g.font = '900 72px system-ui, -apple-system, "Segoe UI", sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,.3)";
  g.shadowBlur = 10;
  g.fillText(String(m.brand.tagline || m.brand.name || "").slice(0, 28), lx + lw / 2, 430, lw);
  g.shadowBlur = 0;
  if (hasP) drawFit2(g, product, 852, 256, 300, 460);
  g.lineWidth = 18;
  g.strokeStyle = pal.accent;
  g.strokeRect(9, 9, 1006, 494);
  return c;
}
function decalCanvas(m, pal, logo) {
  const S3 = 1024, R = 500, c = document.createElement("canvas");
  c.width = c.height = S3;
  const g = c.getContext("2d");
  g.translate(S3 / 2, S3 / 2);
  g.fillStyle = pal.primary;
  g.beginPath();
  g.arc(0, 0, R, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 34;
  g.strokeStyle = pal.secondary;
  g.beginPath();
  g.arc(0, 0, R - 17, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 10;
  g.strokeStyle = pal.accent;
  g.beginPath();
  g.arc(0, 0, R - 46, 0, Math.PI * 2);
  g.stroke();
  const label = ` ${String(m.brand.name || "").toUpperCase()} \u2022 ${String(m.brand.tagline || "").toUpperCase()} \u2022 `;
  g.fillStyle = readableOn(pal.primary, "#ffffff");
  g.font = "900 54px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const rr = R - 100, per = g.measureText(label).width / rr, reps = Math.max(1, Math.floor(Math.PI * 2 / per));
  for (let i = 0; i < reps; i++) {
    let a = i / reps * Math.PI * 2;
    for (const ch of label) {
      const w = g.measureText(ch).width / rr;
      g.save();
      g.rotate(a + w / 2);
      g.translate(0, -rr);
      g.fillText(ch, 0, 0);
      g.restore();
      a += w;
    }
  }
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(0, 0, R - 150, (R - 150) * 0.55, 0, 0, Math.PI * 2);
  g.fill();
  if (logo) drawFit2(g, logo, 0, 0, (R - 170) * 2, (R - 170) * 1);
  return c;
}
function badgeCanvas(pal, logo, ring = true) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  if (ring) {
    g.fillStyle = pal.primary;
    g.beginPath();
    g.arc(256, 256, 252, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(256, 256, ring ? 222 : 252, 0, Math.PI * 2);
  g.fill();
  if (logo) drawFit2(g, logo, 256, 256, 380, 300);
  return c;
}
function bannerStripCanvas(m, pal, logo) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  roundRect(g, 4, 4, 1016, 248, 60);
  g.fill();
  g.lineWidth = 10;
  g.strokeStyle = pal.secondary;
  roundRect(g, 4, 4, 1016, 248, 60);
  g.stroke();
  if (logo) drawFit2(g, logo, 330, 128, 560, 200);
  g.fillStyle = pal.secondary;
  g.font = "900 64px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(m.brand.tagline || "").slice(0, 20), 790, 130, 400);
  return c;
}
function skyCanvas(pal) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, pal.primary);
  gr.addColorStop(0.42, pal.primary);
  gr.addColorStop(0.5, pal.background);
  gr.addColorStop(0.56, pal.secondary);
  gr.addColorStop(1, pal.secondary);
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  return c;
}
function particleKind(m) {
  const s = `${m.brand.name} ${m.brand.tagline} ${m.concept?.title || ""} ${m.brand.productName || ""}`;
  if (/soda|fizz|pop|drink|cola|sparkl|water|juice|beer|brew|bubbl|lemon/i.test(s)) return "bubbles";
  if (/energy|volt|power|electric|charge|tech|neon|battery|spark/i.test(s)) return "sparks";
  return "confetti";
}
function texRgb(t) {
  const img = t?.image;
  if (!img || !(img.width > 0)) return null;
  const was = texAvg.get(t);
  if (was && was.v === t.version && was.img === img) return was.rgb;
  let rgb = null;
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 16;
    const g = cv.getContext("2d");
    g.drawImage(img, 0, 0, 16, 16);
    const d = g.getImageData(0, 0, 16, 16).data;
    let r4 = 0, gg = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) {
      r4 += d[i];
      gg += d[i + 1];
      b += d[i + 2];
    }
    const n = d.length / 4;
    rgb = [r4 / n / 255, gg / n / 255, b / n / 255];
  } catch {
    rgb = null;
  }
  texAvg.set(t, { v: t.version, img, rgb });
  return rgb;
}
function texAverage(T, t) {
  const c = texRgb(t);
  return c ? new T.Color().setRGB(c[0], c[1], c[2], T.SRGBColorSpace) : null;
}
async function warmTextureAverages(scene, sliceMs = 6) {
  try {
    const maps = /* @__PURE__ */ new Set();
    scene.traverse((o) => {
      for (const mt of [o.material].flat().filter(Boolean)) if (mt.map?.image) maps.add(mt.map);
    });
    const slice = () => new Promise((r4) => window.requestIdleCallback ? requestIdleCallback(() => r4(), { timeout: 200 }) : setTimeout(r4, 16));
    let t = performance.now();
    for (const m of maps) {
      if (performance.now() - t > sliceMs) {
        await slice();
        t = performance.now();
      }
      texRgb(m);
    }
  } catch {
  }
}
function createWorldTakeover(o) {
  const { T, adapter, scene, camera, m, pal, level, upm: u, isOurs: isOurs2 } = o;
  const log2 = o.log || (() => {
  });
  const strength = clamp4(Number.isFinite(+o.strength) ? +o.strength : 0.72, 0.2, 1);
  const owned = [], undo = [];
  const own = (x) => {
    owned.push(x);
    return x;
  };
  const st = { materials: 0, uniforms: 0, billboards: 0, decal: false, blimps: 0, particles: 0, sky: null, kind: particleKind(m) };
  const C = (h) => new T.Color(h);
  const logo = trimmedLogo(o.logoImg) || logoCanvas(m.brand, pal, o.logoImg);
  const product = o.productImg ? trimmedLogo(o.productImg) || o.productImg : null;
  const logoAspect = logo.width / Math.max(1, logo.height);
  const roles = { primary: C(pal.primary), secondary: C(pal.secondary), accent: C(pal.accent) };
  const writes = [];
  const tmp = new T.Color();
  const hsl = {};
  const sampleTex = (t2) => texAverage(T, t2);
  const sampleVerts = (geo) => {
    const a = geo?.attributes?.color;
    if (!a) return null;
    let r4 = 0, g = 0, b = 0, n = 0;
    const step = Math.max(1, Math.floor(a.count / 256));
    for (let i = 0; i < a.count; i += step) {
      r4 += a.getX(i);
      g += a.getY(i);
      b += a.getZ(i);
      n++;
    }
    return n ? new T.Color(r4 / n, g / n, b / n) : null;
  };
  const vcAttrs = /* @__PURE__ */ new Map();
  function recolourVertices() {
    const clusters = /* @__PURE__ */ new Map();
    const keyOf2 = (r4, g, b) => `${Math.round(clamp4(r4, 0, 1) * 11)},${Math.round(clamp4(g, 0, 1) * 11)},${Math.round(clamp4(b, 0, 1) * 11)}`;
    for (const a of vcAttrs.keys()) {
      for (let i = 0; i < a.count; i++) {
        const r4 = a.getX(i), g = a.getY(i), b = a.getZ(i), k2 = keyOf2(r4, g, b);
        const c = clusters.get(k2) || { w: 0, r: 0, g: 0, b: 0 };
        c.w++;
        c.r += r4;
        c.g += g;
        c.b += b;
        clusters.set(k2, c);
      }
    }
    const list = [...clusters.entries()].sort((x, y) => y[1].w - x[1].w);
    const total = list.reduce((s0, [, c]) => s0 + c.w, 0) || 1;
    let cum = 0;
    const target = /* @__PURE__ */ new Map();
    for (const [k2, c] of list) {
      cum += c.w;
      const share = cum / total;
      const role = share <= 0.5 ? "primary" : share <= 0.82 ? "secondary" : "accent";
      const base = new T.Color(c.r / c.w, c.g / c.w, c.b / c.w);
      target.set(k2, targetFor(base, roles[role]));
    }
    for (const [a, e] of vcAttrs) {
      e.from = new Float32Array(a.count * 3);
      e.to = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) {
        const r4 = a.getX(i), g = a.getY(i), b = a.getZ(i), t2 = target.get(keyOf2(r4, g, b));
        e.from[i * 3] = r4;
        e.from[i * 3 + 1] = g;
        e.from[i * 3 + 2] = b;
        e.to[i * 3] = t2.r;
        e.to[i * 3 + 1] = t2.g;
        e.to[i * 3 + 2] = t2.b;
      }
    }
    st.vertexColours = { attributes: vcAttrs.size, clusters: list.length };
  }
  function applyVertices(k2) {
    for (const [a, e] of vcAttrs) {
      if (!e.from) continue;
      for (let i = 0; i < a.count; i++) a.setXYZ(i, e.from[i * 3] + (e.to[i * 3] - e.from[i * 3]) * k2, e.from[i * 3 + 1] + (e.to[i * 3 + 1] - e.from[i * 3 + 1]) * k2, e.from[i * 3 + 2] + (e.to[i * 3 + 2] - e.from[i * 3 + 2]) * k2);
      if (a.isInterleavedBufferAttribute) a.data.needsUpdate = true;
      else a.needsUpdate = true;
    }
  }
  undo.push(() => {
    for (const [a, e] of vcAttrs) {
      try {
        (a.isInterleavedBufferAttribute ? a.data.array : a.array).set(e.raw);
        if (a.isInterleavedBufferAttribute) a.data.needsUpdate = true;
        else a.needsUpdate = true;
      } catch {
      }
    }
  });
  let lightSum = 0;
  scene.traverse((x) => {
    if (!x.isLight || isOurs2(x)) return;
    const i = +x.intensity || 0;
    lightSum += x.isAmbientLight || x.isHemisphereLight ? i : x.isDirectionalLight ? i * 0.35 : 0;
  });
  if (scene.environment) lightSum += 0.4 * (+scene.environmentIntensity || 1);
  const darkness = clamp4(1 - lightSum / 1.2, 0, 1);
  st.darkness = +darkness.toFixed(2);
  function recolour() {
    const mats = /* @__PURE__ */ new Map();
    scene.traverse((x) => {
      if (!(x.isMesh || x.isSprite) || isOurs2(x) || o.keep?.(x)) return;
      const vcol = [x.material].flat().some((mt) => mt?.vertexColors) ? x.geometry?.attributes?.color : null;
      const pool = x.isInstancedMesh && (x.count < (x.instanceMatrix?.count ?? x.count) || x.instanceMatrix?.usage === 35048);
      const dyn = (v) => v.usage === 35048 || v.data?.usage === 35048;
      for (const a of [vcol, pool ? null : x.instanceColor].filter((v) => v && typeof v.getX === "function" && v.count > 0 && v.count < 4e5 && !dyn(v))) {
        if (!vcAttrs.has(a)) vcAttrs.set(a, { raw: (a.isInterleavedBufferAttribute ? a.data.array : a.array).slice() });
      }
      if (pool) return;
      const area = Math.max(1e-4, (geomRadius(x.geometry) * worldScale(x)) ** 2) * (x.isInstancedMesh ? Math.min(50, x.count || 1) : 1);
      for (const mt of [x.material].flat()) {
        if (!mt) continue;
        const e = mats.get(mt) || { area: 0, geo: x.geometry, vc: false };
        e.area += area;
        if (mt.vertexColors && x.geometry?.attributes?.color) e.geo = x.geometry, e.vc = true;
        if (x.instanceColor) e.vc = true;
        mats.set(mt, e);
      }
    });
    const list = [...mats.entries()].sort((a, b) => b[1].area - a[1].area);
    const total = list.reduce((s, [, e]) => s + e.area, 0) || 1;
    let cum = 0, tail = 0;
    for (const [mt, e] of list) {
      curMat = mt;
      cum += e.area;
      const share = cum / total;
      const glow = mt.blending === 2 || mt.emissive && (mt.emissive.r + mt.emissive.g + mt.emissive.b) / 3 * (mt.emissiveIntensity ?? 1) > 0.25;
      const big = e.area / total > 0.08;
      const role = glow && !big ? "accent" : share <= 0.55 ? "primary" : share <= 0.85 ? "secondary" : tail++ % 2 ? "secondary" : "primary";
      if (mt.uniforms) {
        for (const [name, un] of Object.entries(mt.uniforms)) {
          const v = un?.value;
          if (!v?.isColor) continue;
          const r4 = /top|sky|zenith|upper/i.test(name) ? "primary" : /bottom|horizon|ground|fog|lower/i.test(name) ? "secondary" : role;
          addWrite(v, roles[r4], 0.85, false);
          st.uniforms++;
        }
        continue;
      }
      if (!mt.color?.isColor) continue;
      if (e.vc && !mt.map) {
        st.materials++;
        continue;
      }
      const base = new T.Color(mt.color.r, mt.color.g, mt.color.b);
      const avg = mt.map && sampleTex(mt.map) || null;
      if (avg) base.multiply(avg);
      const tgt = targetFor(base, roles[role]);
      if (avg) {
        const cap = 3 + 6 * darkness;
        const mul2 = [tgt.r / Math.max(0.03, avg.r), tgt.g / Math.max(0.03, avg.g), tgt.b / Math.max(0.03, avg.b)].map((v) => clamp4(v, 0, cap));
        addWrite(mt.color, { r: mul2[0], g: mul2[1], b: mul2[2] }, 1, true);
      } else addWrite(mt.color, tgt, 1, true);
      if (mt.emissive?.isColor && mt.emissive.r + mt.emissive.g + mt.emissive.b > 0.02) {
        const em = roles[role].clone();
        em.getHSL(hsl);
        em.setHSL(hsl.h, Math.min(1, hsl.s * 1.1), clamp4(hsl.l, 0.35, 0.6));
        addWrite(mt.emissive, em, 1, false);
      } else if (mt.emissive?.isColor && !mt.transparent && (darkness > 0.15 || (avg || base).r + (avg || base).g + (avg || base).b < 0.3)) {
        const em = roles[role].clone().multiplyScalar(0.12 + 0.34 * darkness);
        addWrite(mt.emissive, em, 1, false);
      }
      if (!scene.environment && Number.isFinite(mt.metalness) && mt.metalness > 0.3) addNum(mt, "metalness", 0.25);
      st.materials++;
    }
  }
  function targetFor(base, brand2) {
    base.getHSL(hsl);
    const l0 = hsl.l;
    const t2 = brand2.clone();
    t2.getHSL(hsl);
    const k2 = 0.35 + 0.5 * strength;
    t2.setHSL(hsl.h, Math.max(hsl.s, 0.6), clamp4(l0 * (1 - k2) + hsl.l * k2, 0.18, 0.8));
    return t2;
  }
  let curMat = null;
  function addWrite(color, to, amt, _material) {
    if (writes.some((w) => w.color === color)) return;
    const from = [color.r, color.g, color.b];
    writes.push({ color, owner: curMat?.uuid || null, from, to: [from[0] + (to.r - from[0]) * amt, from[1] + (to.g - from[1]) * amt, from[2] + (to.b - from[2]) * amt], last: null });
  }
  const nums = [];
  function addNum(obj, key, to) {
    if (nums.some((x) => x.obj === obj && x.key === key)) return;
    nums.push({ obj, key, from: obj[key], to, last: null });
  }
  undo.push(() => {
    for (const x of nums) if (!x.dead) x.obj[x.key] = x.from;
  });
  let kNow = -1;
  function applyColours(k2) {
    if (Math.abs(k2 - kNow) < 1e-4) return;
    kNow = k2;
    for (const x of nums) {
      if (x.last !== null && x.obj[x.key] !== x.last) {
        x.dead = true;
        continue;
      }
      if (x.dead) continue;
      x.obj[x.key] = x.from + (x.to - x.from) * k2;
      x.last = x.obj[x.key];
    }
    for (const w of writes) {
      const c = w.color;
      if (w.last && (Math.abs(c.r - w.last[0]) > 1e-6 || Math.abs(c.g - w.last[1]) > 1e-6 || Math.abs(c.b - w.last[2]) > 1e-6)) {
        w.dead = true;
        continue;
      }
      if (w.dead) continue;
      c.r = w.from[0] + (w.to[0] - w.from[0]) * k2;
      c.g = w.from[1] + (w.to[1] - w.from[1]) * k2;
      c.b = w.from[2] + (w.to[2] - w.from[2]) * k2;
      w.last = [c.r, c.g, c.b];
    }
  }
  undo.push(() => {
    for (const w of writes) {
      if (w.dead) continue;
      w.color.r = w.from[0];
      w.color.g = w.from[1];
      w.color.b = w.from[2];
    }
  });
  let skyTex = null, skyWas, skyOn = false;
  const TX = o.textures || {};
  const imgTex = (img) => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c;
  };
  try {
    skyTex = adapter.texture(own(canvasTexture(T, TX.sky ? imgTex(TX.sky) : skyCanvas(pal))));
  } catch {
    skyTex = null;
  }
  skyWas = scene.background;
  st.sky = skyTex ? "gradient" : null;
  let dome = null, domeOf = null;
  try {
    const far = Number.isFinite(camera.far) ? camera.far : 1e3;
    scene.traverse((x) => {
      if (dome || !x.isMesh || isOurs2(x)) return;
      const mt = Array.isArray(x.material) ? x.material[0] : x.material;
      const r4 = geomRadius(x.geometry) * worldScale(x);
      if (!(mt?.side === 1 && (r4 > 0.3 * far || r4 > 150 * u))) return;
      const hasColours = mt.uniforms && Object.values(mt.uniforms).some((v) => v?.value?.isColor);
      if (mt.isShaderMaterial && !hasColours) {
        const R = Math.min(r4 * 0.92, far * 0.85);
        const tex = own(canvasTexture(T, skyCanvas(pal)));
        const geo = own(new T.SphereGeometry(1, 32, 16));
        const mat = own(new T.MeshBasicMaterial({ map: tex, side: T.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false, color: "#e6e6e6" }));
        dome = new T.Mesh(geo, mat);
        dome.name = "br:sky-dome";
        dome.scale.setScalar(R);
        dome.renderOrder = -9;
        dome.frustumCulled = false;
        domeOf = x;
        o.root.add(dome);
        st.sky = "dome";
      }
    });
  } catch (e) {
    log2(`takeover sky: ${e.message}`);
  }
  const eye = o.eye, tanHalf = Math.tan((Number.isFinite(camera.fov) ? camera.fov : 60) * Math.PI / 360);
  const viewH = (p) => 2 * tanHalf * dist(eye, p);
  const avoid = [...o.avoid || []];
  const carriers = [];
  const bbCanvas = TX.billboard ? imgTex(TX.billboard) : billboardCanvas(m, pal, logo, product);
  const bbAspect = bbCanvas.width / bbCanvas.height;
  const bbTex = own(canvasTexture(T, bbCanvas));
  const bbMat = own(new T.MeshBasicMaterial({ map: bbTex, color: "#ececec", side: T.DoubleSide }));
  const edgeMat = own(new T.MeshBasicMaterial({ map: own(glowTexture(T, pal.accent)), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.7, toneMapped: false }));
  const quad = own(new T.PlaneGeometry(1, 1));
  let skyV = null, skyP = null, skyT = null, padTex = null, padGeo = null;
  function billboard(p, n, w, h) {
    if (TX.billboard) h = w / bbAspect;
    const g = new T.Group();
    g.name = "br:billboard";
    const glow = new T.Mesh(quad, edgeMat);
    glow.scale.set(w * 1.18, h * 1.3, 1);
    glow.position.z = 0.02 * u;
    const panel = new T.Mesh(quad, bbMat);
    panel.scale.set(w, h, 1);
    panel.position.z = 0.06 * u;
    g.add(glow, panel);
    g.position.set(p.x, p.y, p.z);
    g.lookAt(p.x + n.x, p.y + n.y, p.z + n.z);
    o.root.add(g);
    carriers.push({ obj: g, size: h, kind: "billboard", c: { ...p } });
    return g;
  }
  function fits(h0, w, hh) {
    const n = { x: h0.nx, y: h0.ny, z: h0.nz };
    let t1 = { x: -n.z, y: 0, z: n.x };
    const l = Math.hypot(t1.x, t1.z) || 1;
    t1 = { x: t1.x / l, y: 0, z: t1.z / l };
    const t2 = { x: n.y * t1.z - n.z * t1.y, y: n.z * t1.x - n.x * t1.z, z: n.x * t1.y - n.y * t1.x };
    for (const [a, b] of [[0, 0], [0.48, 0.45], [-0.48, 0.45], [0.48, -0.45], [-0.48, -0.45]]) {
      const ox = h0.x + n.x * 0.5 * u + (t1.x * a * w + t2.x * b * hh), oy = h0.y + n.y * 0.5 * u + (t1.y * a * w + t2.y * b * hh), oz = h0.z + n.z * 0.5 * u + (t1.z * a * w + t2.z * b * hh);
      const q = level.raycast(ox, oy, oz, -n.x, -n.y, -n.z, 1.2 * u);
      if (!q || Math.abs(q.t - 0.5 * u) > 0.12 * u) return false;
    }
    return true;
  }
  function placeBillboards() {
    const feet = o.feet;
    const cands = [];
    for (let az = 0; az < 360; az += 6) {
      for (const el of [-6, 2, 10, 20, 32]) {
        const a = az * Math.PI / 180, e = el * Math.PI / 180;
        const dx = Math.sin(a) * Math.cos(e), dy = Math.sin(e), dz = -Math.cos(a) * Math.cos(e);
        const h0 = level.raycast(eye.x, eye.y, eye.z, dx, dy, dz, 140 * u);
        if (!h0 || Math.abs(h0.ny) > 0.4 || h0.t < 4 * u) continue;
        if (-(h0.nx * dx + h0.ny * dy + h0.nz * dz) < 0.35) continue;
        if (h0.y < feet.y + 0.9 * u && h0.t < 10 * u) continue;
        cands.push({ h0, az, d: h0.t });
      }
    }
    const picked = [];
    for (let s0 = 0; s0 < 360; s0 += 30) {
      const sec = cands.filter((c) => c.az >= s0 && c.az < s0 + 30).sort((a, b) => b.d - a.d);
      for (const c of sec) {
        const vh = viewH(c.h0);
        let done = false;
        for (const frac2 of [0.25, 0.2, 0.15, 0.1]) {
          const hh = clamp4(frac2 * vh, 1 * u, 14 * u), w = hh * 2;
          const p = { x: c.h0.x + c.h0.nx * 0.04 * u, y: c.h0.y, z: c.h0.z + c.h0.nz * 0.04 * u };
          if (picked.some((q) => dist(q.p, p) < (q.w + w) * 0.55)) continue;
          if (avoid.some((q) => dist(q, p) < (q.r || 1) + w * 0.55)) continue;
          if (!fits(c.h0, w, hh)) continue;
          picked.push({ p, n: { x: c.h0.nx, y: c.h0.ny, z: c.h0.nz }, w, hh });
          done = true;
          break;
        }
        if (done) break;
      }
      if (picked.length >= 12) break;
    }
    for (const q of picked) {
      billboard(q.p, q.n, q.w, q.hh);
      avoid.push({ ...q.p, r: q.w / 2 });
    }
    st.billboards = picked.length;
    if (picked.length < 6) {
      const e0 = camera.matrixWorld.elements, yaw0 = Math.atan2(-e0[8], -e0[10]);
      const camEl = Math.asin(clamp4(-e0[9], -1, 1)), fovV = 2 * Math.atan(tanHalf);
      let sky = 0;
      for (let k2 = 0; k2 < 8 && picked.length + sky < 8; k2++) {
        const yaw = yaw0 + (k2 % 2 ? 1 : -1) * Math.ceil(k2 / 2) * (Math.PI / 4) + (k2 === 0 ? 0.42 : 0);
        const el = Math.max(0.06, camEl + fovV * (0.1 + k2 % 3 * 0.05)), D = (45 + k2 % 2 * 15) * u;
        const p = { x: eye.x + Math.sin(yaw) * Math.cos(el) * D, y: eye.y + Math.sin(el) * D, z: eye.z + Math.cos(yaw) * Math.cos(el) * D };
        if (!level.clear(eye, p)) continue;
        const hh = clamp4(0.16 * viewH(p), 2 * u, 16 * u), w = hh * 2;
        const n = { x: eye.x - p.x, y: 0, z: eye.z - p.z }, nl = Math.hypot(n.x, n.z) || 1;
        const g = billboard(p, { x: n.x / nl, y: 0, z: n.z / nl }, w, hh);
        g.userData.skyOff = { x: p.x - eye.x, y: p.y - eye.y, z: p.z - eye.z };
        sky++;
      }
      st.skyBillboards = sky;
    }
  }
  let decal = null;
  const decals = [];
  function placeDecal() {
    const e = camera.matrixWorld.elements, fx = -e[8], fz = -e[10], fl = Math.hypot(fx, fz) || 1;
    const feet = o.feet;
    const tries = [];
    for (const d of [8, 12, 5, 16, 22, 30]) for (const side of [0, -9, 9, -16, 16]) tries.push([feet.x + fx / fl * d * u + -fz / fl * side * u, feet.z + fz / fl * d * u + fx / fl * side * u]);
    for (const [x, z] of tries) {
      const g0 = level.raycast(x, feet.y + 6 * u, z, 0, -1, 0, 14 * u);
      if (!g0 || g0.ny < 0.9) continue;
      let r4 = 30 * u;
      const rads = [];
      for (let a = 0; a < 8; a++) {
        const ang = a * 0.785;
        let rr = 0;
        for (let s = 1.5 * u; s <= 30 * u; s += 1.5 * u) {
          const q = level.raycast(g0.x + Math.cos(ang) * s, g0.y + 3 * u, g0.z + Math.sin(ang) * s, 0, -1, 0, 6 * u);
          if (!q || Math.abs(q.y - g0.y) > 0.25 * u || q.ny < 0.9) break;
          rr = s;
        }
        rads.push(rr);
      }
      rads.sort((a, b2) => a - b2);
      r4 = rads[2];
      if (r4 < 2.5 * u) continue;
      if (decals.some((d0) => dist(d0.c, g0) < (d0.D + r4 * 1.8) * 0.5)) continue;
      const D = clamp4(r4 * 1.8, 4 * u, 26 * u);
      const tex = own(canvasTexture(
        T,
        decalCanvas(m, pal, logo)
        /* floor decals are seen at grazing angles: always our big-logo disc */
      ));
      const mat = own(new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, color: "#e8e8e8" }));
      const geo = own(new T.PlaneGeometry(1, 1));
      geo.rotateX(-Math.PI / 2);
      const dm = new T.Mesh(geo, mat);
      dm.name = "br:decal";
      dm.renderOrder = 1;
      dm.scale.set(D, 1, D);
      dm.position.set(g0.x, g0.y + 0.03 * u, g0.z);
      dm.rotation.y = Math.atan2(fx, fz) + Math.PI;
      o.root.add(dm);
      decal || (decal = dm);
      decals.push({ m: dm, c: { x: g0.x, y: g0.y, z: g0.z }, D });
      carriers.push({ obj: dm, size: D * 0.3, kind: "decal", c: { x: g0.x, y: g0.y + 0.3 * u, z: g0.z } });
      st.decal = (st.decal ? st.decal + "," : "") + (D / u).toFixed(1);
      if (decals.length >= 3) return;
    }
  }
  const blimps = [];
  function placeBlimps() {
    const e = camera.matrixWorld.elements, yaw0 = Math.atan2(-e[8], -e[10]);
    const stripTex = own(canvasTexture(T, TX.banner ? imgTex(TX.banner) : bannerStripCanvas(m, pal, logo)));
    const stripMat = own(new T.MeshBasicMaterial({ map: stripTex, side: T.DoubleSide, color: "#eeeeee" }));
    const bodyMat = own(new T.MeshStandardMaterial({ color: pal.primary, emissive: pal.primary, emissiveIntensity: 0.35, roughness: 0.5 }));
    const finMat = own(new T.MeshStandardMaterial({ color: pal.secondary, emissive: pal.secondary, emissiveIntensity: 0.3, roughness: 0.5 }));
    const bodyGeo = own(new T.SphereGeometry(0.5, 24, 14));
    const finGeo = own(new T.BoxGeometry(0.02, 0.22, 0.18));
    const camEl = Math.asin(clamp4(-e[9], -1, 1)), fovV = 2 * Math.atan(tanHalf);
    for (const [dyaw, el0, dd] of [[0.35, 0.36, 1], [-0.3, 0.3, 1.15], [Math.PI, 0.36, 1]]) {
      const yaw = yaw0 + dyaw, el = Math.max(0.12, camEl + fovV * el0);
      const D = 55 * u * dd;
      const p = { x: eye.x + Math.sin(yaw) * Math.cos(el) * D, y: eye.y + Math.sin(el) * D, z: eye.z + Math.cos(yaw) * Math.cos(el) * D };
      if (!level.clear(eye, p)) continue;
      const L = clamp4(0.32 * 2 * tanHalf * D * (16 / 9), 8 * u, 40 * u);
      const g = new T.Group();
      g.name = "br:blimp";
      const body = new T.Mesh(bodyGeo, bodyMat);
      body.scale.set(L * 0.42, L * 0.42, L);
      g.add(body);
      for (const s of [-1, 1]) {
        const strip = new T.Mesh(quad, stripMat);
        strip.scale.set(L * 0.62, L * 0.155, 1);
        strip.position.set(s * L * 0.212, 0, 0);
        strip.rotation.y = s * Math.PI / 2;
        g.add(strip);
      }
      for (const r4 of [0, Math.PI / 2]) {
        const fin = new T.Mesh(finGeo, finMat);
        fin.scale.setScalar(L);
        fin.position.z = -L * 0.45;
        fin.rotation.z = r4;
        g.add(fin);
      }
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = Math.atan2(eye.x - p.x, eye.z - p.z) + Math.PI / 2;
      o.root.add(g);
      blimps.push({ g, base: { ...p }, off: { x: p.x - eye.x, y: p.y - eye.y, z: p.z - eye.z }, t: Math.random() * 6, L });
      carriers.push({ obj: g, size: L * 0.155, kind: "blimp", c: p });
    }
    st.blimps = blimps.length;
  }
  let heroLogo = null;
  function placeHeroLogo() {
    if (!o.heroPos) return;
    const tex = own(canvasTexture(T, badgeCanvas(pal, logo)));
    const mat = own(new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide, color: "#eeeeee" }));
    const geo = own(new T.CircleGeometry(0.5, 48));
    heroLogo = new T.Mesh(geo, mat);
    heroLogo.name = "br:hero-logo";
    const s = clamp4(o.heroH * 0.7, 1.5 * u, 10 * u);
    heroLogo.scale.setScalar(s);
    heroLogo.userData.base = { x: o.heroPos.x, y: o.heroPos.y + o.heroH * 0.5 + s * 0.65, z: o.heroPos.z };
    heroLogo.position.set(heroLogo.userData.base.x, heroLogo.userData.base.y, heroLogo.userData.base.z);
    o.root.add(heroLogo);
    carriers.push({ obj: heroLogo, size: s, kind: "hero-logo", c: heroLogo.userData.base });
  }
  const parts = [];
  function makeParticles() {
    const kind = st.kind, N = 70;
    const geo = own(kind === "bubbles" ? new T.SphereGeometry(0.5, 10, 8) : kind === "sparks" ? new T.OctahedronGeometry(0.5, 0) : new T.PlaneGeometry(1, 0.6));
    const mats = [pal.primary, pal.secondary, pal.accent, "#ffffff"].map((c) => own(new T.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: kind === "bubbles" ? 0.45 : 0.85,
      depthWrite: false,
      side: T.DoubleSide,
      blending: kind === "sparks" ? T.AdditiveBlending : T.NormalBlending,
      toneMapped: kind !== "sparks"
    })));
    const pg = new T.Group();
    pg.name = "br:particles";
    for (let i = 0; i < N; i++) {
      const mesh = new T.Mesh(geo, mats[i % mats.length]);
      const p = { mesh, v: [0, 0, 0], s: 0, life: 0 };
      parts.push(p);
      pg.add(mesh);
      respawnPart(p, true);
    }
    o.root.add(pg);
    st.particles = N;
  }
  const camBasis = () => {
    const e = camera.matrixWorld.elements;
    return { x: [e[0], e[1], e[2]], y: [e[4], e[5], e[6]], z: [e[8], e[9], e[10]], p: [e[12], e[13], e[14]] };
  };
  function respawnPart(p, initial) {
    const b = camBasis(), kind = st.kind;
    const lx = (Math.random() - 0.5) * 26 * u, ly = (initial ? Math.random() * 12 - 4 : -5) * u, lz = -(3 + Math.random() * 25) * u;
    p.mesh.position.set(b.p[0] + b.x[0] * lx + b.y[0] * ly + b.z[0] * lz, b.p[1] + b.x[1] * lx + b.y[1] * ly + b.z[1] * lz, b.p[2] + b.x[2] * lx + b.y[2] * ly + b.z[2] * lz);
    const sz = (kind === "bubbles" ? 0.12 + Math.random() * 0.35 : kind === "sparks" ? 0.08 + Math.random() * 0.12 : 0.15 + Math.random() * 0.2) * u;
    p.mesh.scale.setScalar(sz);
    p.v = kind === "sparks" ? [(Math.random() - 0.5) * 3, 1.5 + Math.random() * 3, (Math.random() - 0.5) * 3] : kind === "bubbles" ? [0, 0.8 + Math.random() * 1.4, 0] : [Math.random() - 0.5, -0.8 - Math.random(), Math.random() - 0.5];
    p.t = Math.random() * 6;
    p.life = 0;
  }
  function stepParticles(dt) {
    const b = camBasis();
    for (const p of parts) {
      p.t += dt;
      p.life += dt;
      const w = st.kind === "bubbles" ? Math.sin(p.t * 2.2) * 0.4 : 0;
      p.mesh.position.x += (p.v[0] + w) * u * dt;
      p.mesh.position.y += p.v[1] * u * dt;
      p.mesh.position.z += p.v[2] * u * dt;
      if (st.kind !== "bubbles") {
        p.mesh.rotation.x += dt * 3;
        p.mesh.rotation.y += dt * 2;
      }
      const dx = p.mesh.position.x - b.p[0], dy = p.mesh.position.y - b.p[1], dz = p.mesh.position.z - b.p[2];
      const lz = dx * b.z[0] + dy * b.z[1] + dz * b.z[2], ly = dx * b.y[0] + dy * b.y[1] + dz * b.y[2], lx = dx * b.x[0] + dy * b.x[1] + dz * b.x[2];
      if (lz > -2 * u || lz < -30 * u || Math.abs(lx) > 16 * u || ly > 10 * u || ly < -8 * u || p.life > 9) respawnPart(p, false);
    }
  }
  try {
    recolour();
  } catch (e) {
    log2(`takeover recolour: ${e.message}`);
  }
  try {
    recolourVertices();
  } catch (e) {
    log2(`takeover vertex colours: ${e.message}`);
  }
  function placeFocus() {
    const f = o.focus, P = f.points.map((q) => ({ x: +q[0], y: +q[1], z: +q[2] }));
    const half = (+f.width || +f.driveWidth || 10) / 2 * u;
    const cum = [0];
    for (let k2 = 1; k2 < P.length; k2++) cum.push(cum[k2 - 1] + dist(P[k2 - 1], P[k2]));
    const L = cum.at(-1) || 1;
    const at = (d) => {
      let k2 = 1;
      while (k2 < P.length - 1 && cum[k2] < d) k2++;
      const a = P[k2 - 1], b = P[k2], t2 = (d - cum[k2 - 1]) / Math.max(1e-6, cum[k2] - cum[k2 - 1]);
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
      return { p: { x: a.x + (b.x - a.x) * t2, y: a.y + (b.y - a.y) * t2, z: a.z + (b.z - a.z) * t2 }, t: { x: tx / tl, z: tz / tl } };
    };
    const step = clamp4(L / 7, 14 * u, 28 * u);
    let n = 0;
    for (let d = step * 0.6; d < L - 6 * u && n < 14; d += step) {
      const c = at(d);
      for (const side of [-1, 1]) {
        const back = o.eye && o.feet ? Math.hypot(o.eye.x - o.feet.x, o.eye.z - o.feet.z) : 6 * u;
        const out = half + Math.max(1.2 * u, back * 0.75);
        const px = c.p.x + -c.t.z * side * out, pz = c.p.z + c.t.x * side * out;
        const w = 7 * u, h = w / 2;
        const bk = { x: -c.t.x, z: -c.t.z }, inward = { x: c.t.z * side, z: -c.t.x * side };
        const nx = bk.x * 0.82 + inward.x * 0.57, nz = bk.z * 0.82 + inward.z * 0.57;
        const g = billboard({ x: px, y: c.p.y + 2.6 * u, z: pz }, { x: nx, y: 0, z: nz }, w, h);
        n++;
        void g;
      }
    }
    st.billboards = n;
    st.focusBillboards = n;
    const decalTex = own(canvasTexture(
      T,
      decalCanvas(m, pal, logo)
      /* floor decals are seen at grazing angles: always our big-logo disc */
    ));
    const geo = own(new T.PlaneGeometry(1, 1));
    geo.rotateX(-Math.PI / 2);
    for (const q of [0.2, 0.5, 0.8]) {
      const c = at(q * L);
      const g0 = level.ground(c.p.x, c.p.y + 3 * u, c.p.z, 8 * u);
      const D = clamp4(half * 1.7, 4 * u, 18 * u);
      const mat = own(new T.MeshBasicMaterial({ map: decalTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, color: "#e8e8e8" }));
      const dm = new T.Mesh(geo, mat);
      dm.name = "br:decal";
      dm.renderOrder = 1;
      dm.scale.set(D, 1, D);
      dm.position.set(c.p.x, (g0 ? g0.y : c.p.y) + 0.03 * u, c.p.z);
      dm.rotation.y = Math.atan2(c.t.x, c.t.z) + Math.PI;
      o.root.add(dm);
      decals.push({ m: dm, c: { ...c.p }, D });
      carriers.push({ obj: dm, size: D * 0.3, kind: "decal", c: { ...c.p } });
    }
    st.decal = `${decals.length} on the deck`;
  }
  if (o.focus?.points?.length > 2) {
    try {
      placeFocus();
    } catch (e) {
      log2(`takeover focus: ${e.message}`);
    }
  } else {
    try {
      placeBillboards();
    } catch (e) {
      log2(`takeover billboards: ${e.message}`);
    }
    try {
      placeDecal();
    } catch (e) {
      log2(`takeover decal: ${e.message}`);
    }
  }
  try {
    placeBlimps();
  } catch (e) {
    log2(`takeover blimps: ${e.message}`);
  }
  try {
    placeHeroLogo();
  } catch (e) {
    log2(`takeover hero logo: ${e.message}`);
  }
  try {
    makeParticles();
  } catch (e) {
    log2(`takeover particles: ${e.message}`);
  }
  let k = 0, dir = 1, t = 0;
  const camP = { x: 0, y: 0, z: 0 };
  return {
    stats: st,
    carriers,
    /** a flat logo pad on the ground (the session's moving ground logo): centre p, diameter D, upright for a viewer at
     *  `from`; returns the mesh (move it with .position) */
    pad(p, D, from) {
      const tex = padTex || (padTex = own(canvasTexture(T, decalCanvas(m, pal, logo))));
      const geo = padGeo || (padGeo = own(new T.PlaneGeometry(1, 1)));
      if (!geo.userData.flat) {
        geo.rotateX(-Math.PI / 2);
        geo.userData.flat = true;
      }
      const mat = own(new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, color: "#f0f0f0" }));
      const dm = new T.Mesh(geo, mat);
      dm.name = "br:logo-pad";
      dm.renderOrder = 1;
      dm.scale.set(D, 1, D);
      dm.position.set(p.x, p.y + 0.04 * u, p.z);
      if (from) dm.rotation.y = Math.atan2(from.x - p.x, from.z - p.z) + Math.PI;
      o.root.add(dm);
      decals.push({ m: dm, c: { ...p }, D });
      carriers.push({ obj: dm, size: D * 0.3, kind: "decal", c: { ...p } });
      return dm;
    },
    /** a free-standing logo board (the session's path boards): centre p, facing n, w × h; returns the group */
    board(p, n, w, h) {
      const g = billboard(p, n, w, h);
      g.userData.path = true;
      st.pathBoards = (st.pathBoards || 0) + 1;
      return g;
    },
    get k() {
      return k;
    },
    /** 'in' (0.6 s ease to full) | 'out' (0.6 s back) */
    set direction(d) {
      dir = d === "out" ? -1 : 1;
    },
    update(dt) {
      t += dt;
      k = clamp4(k + dir * dt / 0.6, 0, 1);
      const kPrev = kNow;
      applyColours(ease(k));
      if (kNow !== kPrev) applyVertices(kNow);
      if (skyTex) {
        const want = k > 0.5;
        if (want !== skyOn) {
          scene.background = want ? skyTex : skyWas;
          skyOn = want;
        }
      }
      const vis = k > 0.02;
      for (const c of carriers) c.obj.visible = vis && c.obj.userData.hidden !== true;
      for (const p of parts) p.mesh.visible = vis;
      if (!vis) return;
      const s = ease(k);
      for (const c of carriers) if (c.kind === "billboard") c.obj.scale.setScalar(Math.max(0.01, s));
      for (const d0 of decals) d0.m.material.opacity = s;
      if (dome) {
        const p0 = worldPos(domeOf, {});
        dome.position.set(p0.x, p0.y, p0.z);
        dome.material.opacity = s * 0.92;
      }
      worldPos(camera, camP);
      const moved = Math.hypot(camP.x - eye.x, camP.z - eye.z) > 20 * u;
      for (const bl of blimps) {
        bl.t += dt;
        const bx = moved ? camP.x + bl.off.x : bl.base.x, by = moved ? Math.max(bl.base.y, camP.y + bl.off.y) : bl.base.y, bz = moved ? camP.z + bl.off.z : bl.base.z;
        bl.g.position.set(bx + Math.sin(bl.t * 0.12) * bl.L * 0.6, by + Math.sin(bl.t * 0.5) * bl.L * 0.03, bz + Math.cos(bl.t * 0.12) * bl.L * 0.2);
        if (moved) bl.g.rotation.y = Math.atan2(camP.x - bl.g.position.x, camP.z - bl.g.position.z) + Math.PI / 2;
      }
      if (moved) for (const c of carriers) {
        const off = c.obj.userData.skyOff;
        if (!off) continue;
        c.obj.position.set(camP.x + off.x, camP.y + off.y, camP.z + off.z);
        c.obj.lookAt(camP.x, c.obj.position.y, camP.z);
      }
      try {
        const V = (skyV || (skyV = new T.Matrix4())).fromArray(camera.matrixWorldInverse.elements), P = (skyP || (skyP = new T.Matrix4())).fromArray(camera.projectionMatrix.elements);
        for (const c of carriers) {
          const off = c.obj.userData.skyOff;
          if (!off) continue;
          const q = c.obj.position, v = (skyT || (skyT = new T.Vector3())).set(q.x, q.y + c.size * 0.5, q.z).applyMatrix4(V);
          if (v.z > -0.1) continue;
          const zc = -v.z;
          v.applyMatrix4(P);
          if (v.y > 0.62) {
            const dy = (v.y - 0.62) * tanHalf * zc;
            q.y -= dy;
            off.y -= dy;
          }
        }
      } catch {
      }
      if (heroLogo) {
        worldPos(camera, camP);
        const b = heroLogo.userData.base;
        heroLogo.position.set(b.x, b.y + Math.sin(t * 1.6) * 0.15 * u, b.z);
        heroLogo.lookAt(camP.x, heroLogo.position.y, camP.z);
      }
      edgeMat.opacity = 0.5 + Math.sin(t * 3) * 0.2;
      stepParticles(dt);
    },
    /** logo carriers on screen right now (in the frustum, unoccluded, ≥ 3% of the view): for QA and debug() */
    logosInView(extra = []) {
      const out = [];
      try {
        camera.updateMatrixWorld?.();
        const vi = camera.matrixWorldInverse.elements, pr = camera.projectionMatrix.elements, ey = worldPos(camera, {});
        const pts = (c) => {
          const p0 = worldPos(c.obj, {});
          if (c.y) p0.y += c.y;
          if (c.kind !== "decal") return [p0];
          const R = c.size / 0.3 / 3;
          return [p0, { x: p0.x + R, y: p0.y, z: p0.z }, { x: p0.x - R, y: p0.y, z: p0.z }, { x: p0.x, y: p0.y, z: p0.z + R }, { x: p0.x, y: p0.y, z: p0.z - R }];
        };
        for (const c of [...carriers, ...extra]) {
          if (!c.obj.visible) continue;
          for (const p of pts(c)) {
            const x = vi[0] * p.x + vi[4] * p.y + vi[8] * p.z + vi[12], y = vi[1] * p.x + vi[5] * p.y + vi[9] * p.z + vi[13], z = vi[2] * p.x + vi[6] * p.y + vi[10] * p.z + vi[14];
            if (z > -0.3) continue;
            const cx = pr[0] * x + pr[4] * y + pr[8] * z + pr[12], cy = pr[1] * x + pr[5] * y + pr[9] * z + pr[13], cw = pr[3] * x + pr[7] * y + pr[11] * z + pr[15];
            if (Math.abs(cx / cw) > 0.95 || Math.abs(cy / cw) > 0.95) continue;
            const frac2 = c.size / (2 * tanHalf * Math.max(0.1, -z));
            if (frac2 < 0.03) continue;
            const tp = p;
            if (c.kind !== "decal" && !level.clear(ey, tp, 0.6 * u)) continue;
            out.push({ kind: c.kind, frac: +frac2.toFixed(3) });
            break;
          }
        }
      } catch {
      }
      return out;
    },
    /** after dispose: every value we wrote is back to its original, exactly (QA / debug) */
    verifyRestore() {
      let checked = 0, bad = 0, handedBack = 0;
      const handedBackMaterials = [];
      for (const w of writes) {
        if (w.dead) {
          handedBack++;
          if (w.owner) handedBackMaterials.push(w.owner);
          continue;
        }
        checked++;
        if (w.color.r !== w.from[0] || w.color.g !== w.from[1] || w.color.b !== w.from[2]) bad++;
      }
      for (const x of nums) {
        if (x.dead) {
          handedBack++;
          continue;
        }
        checked++;
        if (x.obj[x.key] !== x.from) bad++;
      }
      for (const [a, e] of vcAttrs) {
        checked++;
        const arr = a.isInterleavedBufferAttribute ? a.data.array : a.array;
        for (let i = 0; i < arr.length; i++) if (arr[i] !== e.raw[i]) {
          bad++;
          break;
        }
      }
      if (skyTex) {
        checked++;
        if (scene.background !== skyWas) bad++;
      }
      return { checked, bad, handedBack, handedBackMaterials };
    },
    dispose() {
      if (skyTex && skyOn) {
        scene.background = skyWas;
        skyOn = false;
      }
      for (let i = undo.length - 1; i >= 0; i--) {
        try {
          undo[i]();
        } catch (e) {
          log2(`takeover restore: ${e.message}`);
        }
      }
      for (const x of owned) {
        try {
          x.dispose?.();
        } catch {
        }
      }
    }
  };
}
var clamp4, ease, texAvg;
var init_takeover = __esm({
  "../../sdk/inworld/takeover.js"() {
    init_builders();
    init_props();
    init_scan();
    clamp4 = (v, a, b) => Math.max(a, Math.min(b, v));
    ease = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    texAvg = /* @__PURE__ */ new WeakMap();
  }
});

// ../../sdk/inworld/session.js
var session_exports = {};
__export(session_exports, {
  INTERACTIONS: () => INTERACTIONS,
  convertedAdapter: () => convertedAdapter,
  createSession: () => createSession,
  directAdapter: () => directAdapter,
  interactionOf: () => interactionOf,
  isInWorld: () => isInWorld
});
function interactionOf(m) {
  const r4 = m?.round || {};
  const want = r4.inworld?.interaction || r4.takeover?.interaction;
  if (INTERACTIONS.includes(want)) return want;
  return r4.mechanic === "shoot" ? "projectile-hit" : r4.mechanic === "race" ? "drive-through" : "player-touch";
}
function directAdapter(scene) {
  return {
    direct: true,
    add(obj, parent = scene) {
      obj.userData.__br = true;
      parent.add(obj);
      return obj;
    },
    remove(h) {
      h.parent?.remove(h);
    },
    sync() {
    },
    material: (mat) => mat,
    texture: (t) => t,
    dispose() {
    }
  };
}
function convertedAdapter(scene, conv) {
  return {
    add(obj, parent = scene) {
      const h = conv.convert(obj);
      if (!h) return null;
      h.userData.__br = true;
      parent.add(h);
      conv.sync();
      return h;
    },
    remove(h) {
      h?.parent?.remove(h);
    },
    sync() {
      conv.sync();
    },
    material: (mat) => conv.material(mat),
    texture: (t) => conv.texture(t),
    dispose() {
      conv.dispose();
    }
  };
}
function parseMood(takeover, pal, T) {
  const out = { light: null, lightAmt: 0.22, fog: null, fogAmt: 0.35 };
  const spec = takeover?.moodSpec, hx = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : null;
  if (spec && typeof spec === "object") {
    out.light = hx(spec.lightTint);
    out.fog = hx(spec.fogTint);
    if (Number.isFinite(+spec.lightAmount)) out.lightAmt = clamp5(+spec.lightAmount, 0, 0.5);
    if (Number.isFinite(+spec.fogAmount)) out.fogAmt = clamp5(+spec.fogAmount, 0, 0.85);
  }
  const s = out.light && out.fog ? "" : String(takeover?.mood || "");
  for (const clause of s.split(/[.;]|,\s*(?:and|then)\s+|\band\b/i)) {
    const hexes = clause.match(/#[0-9a-f]{6}\b/gi) || [];
    const toward = /(?:toward|towards|to)\s*[^#]{0,40}(#[0-9a-f]{6})/i.exec(clause)?.[1] || hexes.at(-1);
    const pct = /(\d{1,2})\s*%/.exec(clause);
    if (!toward) continue;
    if (/fog|haze|mist/i.test(clause)) {
      if (out.fog) continue;
      out.fog = toward;
      if (pct) out.fogAmt = clamp5(+pct[1] / 100, 0.08, 0.5);
    } else if (/light|sun|hemi|ambient|sky|tint|warm|cool/i.test(clause)) {
      if (out.light) continue;
      out.light = toward;
      if (pct) out.lightAmt = clamp5(+pct[1] / 100, 0.08, 0.4);
    }
  }
  const keep = (w) => new RegExp(`${w}[^.;,]{0,30}(unchanged|untouched|as is|stays)|(keep|leave|don't touch|do not touch)[^.;,]{0,20}${w}`, "i").test(s);
  if (keep("fog")) {
    out.fogAmt = 0;
    out.fog || (out.fog = "#000000");
  }
  if (keep("light")) {
    out.lightAmt = 0;
    out.light || (out.light = "#000000");
  }
  out.vignette = !/\b(no|without)\b[^.;]{0,40}vignette/i.test(s) && spec?.vignette !== false;
  const mix = (a, b, k) => "#" + new T.Color(a).lerp(new T.Color(b), k).getHexString();
  out.light || (out.light = mix(pal.secondary, "#ffffff", 0.45));
  out.fog || (out.fog = mix(pal.background, pal.primary, 0.25));
  return out;
}
function createMood(T, scene, pal, takeover) {
  const mood = parseMood(takeover, pal, T);
  const lt = new T.Color(mood.light), ft = new T.Color(mood.fog);
  const ents = [];
  const add = (color, target, amt) => {
    if (color && typeof color.r === "number" && color.setRGB) ents.push({ color, c0: [color.r, color.g, color.b], target, amt, last: null });
  };
  scene.traverse((o) => {
    if (!o.isLight || isOurs(o)) return;
    const amt = o.isAmbientLight || o.isHemisphereLight ? mood.lightAmt : mood.lightAmt * 0.6;
    add(o.color, lt, amt);
    if (o.isHemisphereLight) add(o.groundColor, lt, amt * 0.5);
  });
  if (scene.fog?.color) add(scene.fog.color, ft, mood.fogAmt);
  if (scene.background?.isColor) add(scene.background, ft, mood.fogAmt * 0.7);
  let k = 0;
  return {
    spec: mood,
    count: ents.length,
    set(v) {
      k = clamp5(v, 0, 1);
      for (const e of ents) {
        if (e.last && (Math.abs(e.color.r - e.last[0]) > 1e-6 || Math.abs(e.color.g - e.last[1]) > 1e-6 || Math.abs(e.color.b - e.last[2]) > 1e-6)) {
          e.c0 = [e.color.r, e.color.g, e.color.b];
        }
        const a = e.amt * k;
        const r4 = e.c0[0] + (e.target.r - e.c0[0]) * a, g = e.c0[1] + (e.target.g - e.c0[1]) * a, b = e.c0[2] + (e.target.b - e.c0[2]) * a;
        e.color.setRGB(r4, g, b);
        e.last = [e.color.r, e.color.g, e.color.b];
      }
    },
    get k() {
      return k;
    },
    /** exact restore, unless the host has changed the colour since our last write (then it's the host's) */
    restore() {
      for (const e of ents) {
        if (!e.last || Math.abs(e.color.r - e.last[0]) < 1e-6 && Math.abs(e.color.g - e.last[1]) < 1e-6 && Math.abs(e.color.b - e.last[2]) < 1e-6) e.color.setRGB(e.c0[0], e.c0[1], e.c0[2]);
      }
      k = 0;
    }
  };
}
function createSession(o) {
  const { T, adapter, scene, camera, m, pal } = o;
  const world = o.world || {};
  const hooks = world.gameplayHooks || {};
  const spec = m.round.inworld || {};
  const interaction = interactionOf(m);
  const full = (spec.takeover ?? m.round.takeover?.inworldTakeover ?? "full") !== "subtle";
  const upm = num3(world.scale?.unitsPerMeter, num3(hooks.units?.unitsPerMeter, 1)) || 1;
  const log2 = o.log || (() => {
  });
  const props = createProps({ T, m, pal, logoImg: o.logoImg, collectible: o.collectible });
  const undo = [];
  const items = [];
  const entities = /* @__PURE__ */ new Map();
  const tintCache = /* @__PURE__ */ new Map();
  let player = null, tracker2 = null, mood = null, bursts = null, root = null, rootHost = null;
  let elapsed = 0, scanT = 0, failed = null, built = false, nextGate = 0, prevFeet = null;
  let heroPos = null, hero = null, flashes = null;
  const sizing = {};
  const st = { interaction, spawned: 0, reskinned: 0, walls: 0, floors: 0, spots: null, player: null, hits: 0, touches: 0, gates: 0, level: 0 };
  const fail = (reason) => {
    if (failed) return;
    failed = reason;
    log2(`in-world: ${reason}`);
    o.onFail?.(reason);
  };
  const projSigs = (hooks.projectiles || []).map((p) => p.signature).filter(Boolean).map((s) => ({
    geometryType: s.geometryType,
    materialType: s.materialType || null,
    color: (s.materialColor || "").replace("#", "").toLowerCase() || null,
    sizeM: s.radius ? s.radius * 2 : null
  }));
  const ballMatch = spec.projectileMatch ? entityMatcher(spec.projectileMatch, hooks, scene) : null;
  const balls = [];
  let ballMode = false, ballMissingT = 0;
  const isProjectile = (mesh) => projSigs.some((s) => matchSignature(mesh, s)) || !!(ballMatch && ballMatch(mesh));
  function measure() {
    const H = num3(hooks.player?.heightM, num3(world.scale?.playerHeightM, num3(o.playerHeightM, 1.8)));
    const jump = num3(world.movement?.jumpHeightM, num3(world.movement?.jump?.heightM, num3(world.scale?.jumpHeightM, 1)));
    return { H: clamp5(H, 0.4, 4), jump: clamp5(jump, 0.3, 4) };
  }
  function selfLit(obj, k = 0.32) {
    obj.traverse?.((x) => {
      for (const mt of [x.material].flat().filter(Boolean)) {
        if (mt.userData?.__brLit) continue;
        if ("metalness" in mt) mt.metalness = Math.min(mt.metalness, 0.12);
        if ("roughness" in mt) mt.roughness = Math.max(mt.roughness, 0.45);
        if ("envMapIntensity" in mt) mt.envMapIntensity = Math.min(mt.envMapIntensity ?? 1, 0.5);
        if (mt.emissive && mt.color && !mt.transparent) {
          if (mt.map && "emissiveMap" in mt) {
            mt.emissive.setRGB(k, k, k);
            mt.emissiveMap = mt.map;
          } else mt.emissive.copy(mt.color).multiplyScalar(k);
          mt.needsUpdate = true;
        }
        mt.userData = { ...mt.userData || {}, __brLit: true };
      }
    });
    return obj;
  }
  function addItem(our, kind, extra = {}) {
    if (kind !== "gate") selfLit(our);
    root.add(our);
    const it = { i: items.length, kind, our, gone: false, ...extra };
    items.push(it);
    return it;
  }
  const centerOf = (it, out = { x: 0, y: 0, z: 0 }) => {
    if (it.entity) {
      worldPos(it.entity.root, out);
      const f = it.entity.off;
      if (f) {
        out.x += f.x;
        out.y += f.y;
        out.z += f.z;
      }
      return out;
    }
    if (!it.our && it.at) {
      out.x = it.at.x;
      out.y = it.at.y + (it.hitR || 0);
      out.z = it.at.z;
      return out;
    }
    const g = it.our, d = g.userData;
    out.x = g.position.x;
    out.z = g.position.z;
    out.y = g.position.y + (d.kind === "floater" ? d.lift + d.size * 0.5 : d.kind === "gate" ? d.h * 0.5 : 0);
    return out;
  };
  function spawnLocal(meas) {
    if (Array.isArray(spec.spawn) && spec.spawn.length === 0 && matchers.length > 0 && st.reskinned > 0) {
      st.spawned = 0;
      return null;
    }
    const { H, jump } = meas;
    const u = upm;
    const exclude = (x) => isOurs(x) || player.root && under(x, player.root) || under(x, camera);
    const level = new Level(scene, { exclude, minRadius: 0.25 * u });
    st.level = level.triangles;
    levelRef = level;
    if (level.empty) return "no_surfaces";
    const eye = worldPos(camera, { x: 0, y: 0, z: 0 });
    if (player.first && player.setEye) {
      const g0 = level.ground(eye.x, eye.y, eye.z, 4 * H * u);
      if (g0 && eye.y - g0.y > 0.3 * H * u && eye.y - g0.y < 1.6 * H * u) player.setEye(eye.y - g0.y);
    }
    if (player.setGuess && !player.root) {
      const e0 = camera.matrixWorld.elements;
      const hv = level.raycast(eye.x, eye.y, eye.z, -e0[8], -e0[9], -e0[10], 400 * u);
      if (hv && hv.ny > 0.5) player.setGuess({ x: hv.x, y: hv.y, z: hv.z });
    }
    const feet = player.feet();
    viewRef.eye = eye;
    viewRef.feet = feet;
    viewRef.H = H;
    const e = camera.matrixWorld.elements;
    const forward = { x: -e[8], z: -e[10] };
    const pj = (hooks.projectiles || []).find((x) => x.speedMps > 0);
    const throwM = pj ? clamp5(pj.speedMps ** 2 / Math.max(5, +pj.gravity || 9.8) / upm, 4, 30) : 10;
    const preferM = interaction === "projectile-hit" ? clamp5(throwM * 0.85, 4.5, 12) : 8;
    const spots = findSpots(level, { eye, feet, forward, upm: u, playerH: H, jumpM: jump, preferM, reach: interaction === "drive-through" ? 40 : interaction === "projectile-hit" ? clamp5(throwM * 1.8, 9, 18) : 15, hooks: hooks.surfaces });
    st.spots = { walls: spots.walls.length, floors: spots.floors.length };
    const usedP = [];
    const free = (p, min) => usedP.every((q) => dist(q, p) >= min);
    const take = (list, n, min) => {
      const out = [];
      for (const s of list) {
        if (out.length >= n) break;
        if (free(s.p, min)) {
          out.push(s);
          usedP.push(s.p);
        }
      }
      return out;
    };
    const wallD = clamp5(0.55 * H, 0.6, 1.15) * u;
    const tanHalf = Math.tan((Number.isFinite(camera.fov) ? camera.fov : 60) * Math.PI / 360);
    const viewH = (p) => 2 * tanHalf * dist(eye, p);
    const wallSize = (p) => clamp5(Math.max(wallD, 0.045 * viewH(p)), wallD, 1.8 * u);
    sizing.wallSize = wallSize;
    const speed = +world.movement?.walkTopSpeedMps || +world.scale?.walkSpeedMps || 0;
    const fast = world.cameraMode === "vehicle" || speed > 14 || /kart|car|vehicle|boat|bike/i.test(player.root?.name || "");
    const course = pathAhead(findPath(scene), feet, forward);
    st.course = course.length;
    viewRef.route = [feet, ...course.map((c) => c.p)];
    const itemH = (interaction === "player-touch" ? fast ? clamp5(0.65 * H, 1.6, 3) : clamp5(0.65 * H, 0.45, 2.4) : clamp5(m.round.collectible.heightM || 0.6, 0.3 * H, 0.6 * H)) * u;
    const minFrac = interaction === "projectile-hit" ? 0.045 : 0.03;
    const sizeAt = (p, lift) => clamp5(Math.max(itemH, minFrac * viewH({ x: p.x, y: p.y + lift, z: p.z })), itemH, 1.4 * H * u);
    let specs = Array.isArray(spec.spawn) && spec.spawn.length ? spec.spawn : null;
    if (!specs) {
      const n = clamp5(Math.round(num3(m.round.itemCount, 10)), 4, 16);
      specs = ballMode ? [{ asset: "banner", where: "goal", count: 2 }, { asset: "collectible", where: "boards", count: 4 }] : interaction === "projectile-hit" ? [{ asset: "collectible", where: "surfaces", count: n }] : interaction === "drive-through" ? [{ asset: "banner", where: "along-path", count: 6 }] : [{ asset: "collectible", where: "open-spots", count: n }];
    }
    const heroSpec = specs.find((x) => x.asset === "hero");
    specs = [...specs.filter((x) => x.asset === "hero" && x.where !== "gate"), ...specs.filter((x) => !(x.asset === "hero" && x.where !== "gate"))];
    const road = fast && course.length ? roadOf(level, course, feet, u) : null;
    if (o.focus?.points?.length > 2) {
      spawnFocus({ level, eye, feet, H, u, specs, tanHalf, viewH });
      st.spawned = items.filter((x) => x.our).length;
      return null;
    }
    for (const s of specs) {
      const count = clamp5(Math.round(num3(s.count, 6)), 1, 24);
      const where = s.where || "open-spots";
      const lift = clamp5(num3(s.heightM, interaction === "projectile-hit" ? 0.8 * H : 0.15 * H), 0, 3 * H) * u;
      if (s.asset === "hero" && where !== "gate") {
        spawnHero({ level, eye, feet, H, u, course, road, speed, tanHalf, viewH, cone: true });
        continue;
      }
      if (s.asset === "hero" && where === "gate" && interaction !== "drive-through") continue;
      if (s.asset === "hero" && where === "gate") continue;
      if ((interaction === "drive-through" || where === "along-path") && road) {
        const vEff = (speed > 0 ? speed : 25) * u * 0.85;
        const first = Math.max(20 * u, vEff * 1.8);
        const budget = vEff * (m.round.durationSec - 1);
        const designed = clamp5(Math.round(num3(m.round.itemCount, count)), count, 8);
        const spacing = Math.max(22 * u, vEff * 1.3, Math.min(vEff * 2.2, (budget - first) / Math.max(1, designed - 1)));
        const want = clamp5(Math.max(designed, Math.floor((budget - first) / spacing) + 1), 2, 8);
        let made = 0;
        for (let dd = first; made < want && dd <= budget + spacing * 0.5 && dd < road.length; ) {
          const c = road.centre(dd);
          if (!c) {
            dd += 5 * u;
            continue;
          }
          const gw = clamp5(c.w + 1.5 * u, 8 * u, 22 * u), h = chaseClearH(gw, eye, feet, u);
          const gate = props.gate(c.p, c.t, gw, h);
          addItem(gate, "gate", { hitR: Math.max(gw / 2 + 1.5 * u, gw * 0.78), order: made++ });
          st.gates++;
          dd += spacing;
        }
        if (heroSpec && st.gates && (heroSpec.where === "gate" || !heroPos)) {
          const gates = items.filter((x) => x.kind === "gate");
          heroOnGate(gates[Math.min(2, gates.length - 1)], { tanHalf, viewH });
        }
        continue;
      }
      if (where === "along-path" && s.asset === "collectible" && interaction !== "drive-through") {
        const fl = Math.hypot(forward.x, forward.z) || 1;
        const line = course.length ? [feet, ...course.map((c) => c.p)] : [feet, ...[1, 2, 3, 4].map((k) => ({ x: feet.x + forward.x / fl * 8 * k * u, y: feet.y, z: feet.z + forward.z / fl * 8 * k * u }))];
        const segL = [];
        let tot = 0;
        for (let k = 1; k < line.length; k++) {
          segL.push(dist(line[k - 1], line[k]));
          tot += segL.at(-1);
        }
        const reachM = Math.min(tot, Math.max(12 * u, (speed > 0 ? speed : 5.5) * u * m.round.durationSec * 0.6));
        const at = (d0) => {
          let d1 = d0;
          for (let k = 1; k < line.length; k++) {
            if (d1 <= segL[k - 1]) {
              const f = d1 / (segL[k - 1] || 1), a0 = line[k - 1], b0 = line[k];
              return { x: a0.x + (b0.x - a0.x) * f, y: Math.max(a0.y, b0.y), z: a0.z + (b0.z - a0.z) * f };
            }
            d1 -= segL[k - 1];
          }
          return line.at(-1);
        };
        let made = 0;
        for (let k = 0; k < count * 3 && made < count; k++) {
          const q = at(3.5 * u + (reachM - 3.5 * u) * (made + 0.5) / count + (k - made) * 1.5 * u);
          const g0 = level.ground(q.x, q.y + 3 * H * u, q.z, 8 * H * u);
          if (!g0 || Math.abs(g0.y - feet.y) > 6 * H * u || !free({ x: g0.x, y: g0.y, z: g0.z }, 1.6 * u)) continue;
          usedP.push({ x: g0.x, y: g0.y, z: g0.z });
          const sz = sizeAt(g0, lift);
          addItem(props.floater({ x: g0.x, y: g0.y, z: g0.z }, lift, sz), "floater", { hitR: sz * 0.62 });
          st.floors++;
          made++;
        }
        if (made) continue;
      }
      if ((interaction === "drive-through" || where === "along-path") && course.length) {
        const w = (fast ? 14 : 4) * u, h = (fast ? 5 : 2.8) * u;
        let made = 0, run = dist(feet, course[0].p);
        const budget = (speed > 0 ? speed : fast ? 25 : 6) * u * m.round.durationSec * 0.85;
        for (let k = 0; k < course.length && made < count; k++) {
          if (k > 0) run += dist(course[k - 1].p, course[k].p);
          if (made >= 2 && run > budget) break;
          const c = course[k], nx = course[(k + 1) % course.length];
          const g0 = level.ground(c.p.x, c.p.y + 4 * u, c.p.z, 12 * u);
          const base = { x: c.p.x, y: g0 ? g0.y : c.p.y, z: c.p.z };
          if (k === 0 && dist(base, feet) < 6 * u) continue;
          let span = 0;
          c.o.traverse((x) => {
            if (x !== c.o && x.position) span = Math.max(span, Math.abs(x.position.x) * 2 * worldScale(c.o));
          });
          const gw = span > 3 * u ? span * 0.92 : w;
          let dir = { x: nx.p.x - c.p.x, z: nx.p.z - c.p.z };
          const e2 = c.o.matrixWorld.elements, ax = [{ x: e2[8], z: e2[10] }, { x: e2[0], z: e2[2] }];
          const rotated = Math.abs(e2[8]) + Math.abs(e2[10]) > 1e-3 && !(Math.abs(e2[0] - 1) < 1e-6 && Math.abs(e2[10] - 1) < 1e-6);
          if (rotated) {
            let spreadX = 0, spreadZ = 0;
            c.o.traverse((x) => {
              if (x !== c.o && x.position) {
                spreadX = Math.max(spreadX, Math.abs(x.position.x));
                spreadZ = Math.max(spreadZ, Math.abs(x.position.z));
              }
            });
            const t = spreadX >= spreadZ ? ax[0] : ax[1];
            const pv = course[(k - 1 + course.length) % course.length].p, nrm = (v) => {
              const l = Math.hypot(v.x, v.z) || 1;
              return { x: v.x / l, z: v.z / l };
            };
            const inc = nrm({ x: c.p.x - pv.x, z: c.p.z - pv.z }), out = nrm(dir);
            const sgn = t.x * (inc.x * 2 + out.x) + t.z * (inc.z * 2 + out.z) >= 0 ? 1 : -1;
            dir = { x: t.x * sgn, z: t.z * sgn };
          }
          const gate = props.gate(base, dir, gw, h);
          addItem(gate, "gate", { hitR: fast ? Math.max(gw / 2, 7.5 * u) + 1.5 * u : gw / 2, order: made++ });
          st.gates++;
        }
        continue;
      }
      if (interaction === "drive-through" || where === "along-path") {
        const veh = world.cameraMode === "vehicle";
        const gap = (veh ? 14 : 6) * u, w = (veh ? 7 : 3.2) * u, h = (veh ? 4.5 : 2.6) * u;
        const fl = Math.hypot(forward.x, forward.z) || 1, fx = forward.x / fl, fz = forward.z / fl;
        let made = 0, y = feet.y;
        for (let k = 1; made < count && k < count * 3; k++) {
          const x = feet.x + fx * gap * k, z = feet.z + fz * gap * k;
          const g = level.ground(x, y + 3 * u, z, 10 * u);
          if (!g || Math.abs(g.y - y) > 2.5 * u) continue;
          y = g.y;
          const gate = props.gate({ x, y: g.y, z }, { x: fx, z: fz }, w, h);
          addItem(gate, "gate", { hitR: w / 2, order: made++ });
          st.gates++;
        }
        continue;
      }
      if (where === "goal") {
        spawnGoalZones(s, count, level, feet);
        if (heroSpec && !heroPos) spawnHero({ level, eye, feet, H, u, course, road, speed, tanHalf, viewH });
        continue;
      }
      if (where === "boards") {
        spawnBoards(s, count, level, feet, H);
        continue;
      }
      let list, floorRespawn = null;
      if (where === "surfaces" && interaction === "projectile-hit") {
        const nWall = Math.ceil(count * 0.6);
        const rs = respawnOf(s);
        const wallPool = heroPos ? spots.walls.filter((w) => dist(w.p, heroPos) > 2.5 * u) : spots.walls;
        const walls = take(wallPool, nWall, 1.8 * u);
        for (const w of walls) {
          const dM = wallSize(w.p);
          addItem(props.wallTarget(w.p, w.n, dM, viewRef.eye || eye), "wall", { hitR: dM * 0.62, ...rs, pool: wallPool });
          st.walls++;
        }
        const inView = (f) => f.seen && Math.abs(f.p.y - feet.y) < 1.2 * H * u && level.clear(eye, { x: f.p.x, y: f.p.y + lift + itemH * 0.5, z: f.p.z }) && (!heroPos || distXZ(f.p, heroPos) > 2.8 * u);
        let floors = spots.floors.filter(inView);
        if (heroPos) floors = floors.sort((a, b) => Math.abs(distXZ(a.p, heroPos) - 4.5 * u) - Math.abs(distXZ(b.p, heroPos) - 4.5 * u));
        list = take(floors, count - walls.length, 2.2 * u);
        floorRespawn = { rs, pool: floors };
      } else if (where === "near-player") {
        list = take(spots.floors.filter((f) => f.d < 7 * u && (interaction !== "player-touch" || f.reachable)), count, 1.8 * u);
      } else {
        const ok = (f) => interaction === "player-touch" ? f.reachable : f.seen;
        list = take(spots.floors.filter(ok), count, 2.2 * u);
      }
      if (fast && course.length && interaction !== "projectile-hit") {
        list = [];
        const poly = [{ x: feet.x, y: feet.y, z: feet.z }, ...course.map((c) => c.p)];
        const budget = (speed > 0 ? speed : 25) * u * m.round.durationSec * 0.8;
        const pairs = Math.max(1, Math.ceil(count / 2));
        const at = (dd) => {
          for (let k = 1; k < poly.length; k++) {
            const a = poly[k - 1], bq = poly[k], L = dist(a, bq);
            if (dd <= L) {
              const f = dd / L;
              return { x: a.x + (bq.x - a.x) * f, y: Math.max(a.y, bq.y), z: a.z + (bq.z - a.z) * f, dx: (bq.x - a.x) / L, dz: (bq.z - a.z) / L };
            }
            dd -= L;
          }
          return null;
        };
        const roadMats = /* @__PURE__ */ new Set();
        for (const q of [{ x: feet.x, y: feet.y, z: feet.z }, ...course.map((c) => c.p)]) {
          const g2 = level.ground(q.x, q.y + 2 * u, q.z, 8 * u);
          if (g2?.o?.material) roadMats.add(g2.o.material);
        }
        const onRoad = (x, y, z) => {
          const g2 = level.ground(x, y + 4 * u, z, 14 * u);
          return g2 && (!roadMats.size || roadMats.has(g2.o.material)) ? g2 : null;
        };
        for (let q = 0; q < pairs && list.length < count; q++) {
          const c = at(budget * (q + 0.6) / pairs);
          if (!c) break;
          const px = -c.dz, pz = c.dx;
          let hitOff = null;
          for (let o2 = 0; o2 <= 40 && hitOff === null; o2 += 2) for (const sg of o2 ? [1, -1] : [1]) if (hitOff === null && onRoad(c.x + px * sg * o2 * u, c.y, c.z + pz * sg * o2 * u)) hitOff = sg * o2;
          if (hitOff === null) continue;
          let lo = hitOff, hi = hitOff;
          while (hi - hitOff < 24 && onRoad(c.x + px * (hi + 1) * u, c.y, c.z + pz * (hi + 1) * u)) hi += 1;
          while (hitOff - lo < 24 && onRoad(c.x + px * (lo - 1) * u, c.y, c.z + pz * (lo - 1) * u)) lo -= 1;
          const mid = (lo + hi) / 2, half = Math.max(1.5, Math.min(3.5, (hi - lo) / 4));
          for (const side of [-half, half]) {
            if (list.length >= count) break;
            const g1 = onRoad(c.x + px * (mid + side) * u, c.y, c.z + pz * (mid + side) * u);
            if (g1) list.push({ p: { x: g1.x, y: g1.y, z: g1.z } });
          }
        }
      }
      const frs = floorRespawn?.rs || respawnOf(s);
      for (const f of list) {
        const sz = sizeAt(f.p, lift);
        addItem(props.floater(f.p, lift, sz), "floater", { hitR: sz * 0.62, ...frs, pool: floorRespawn?.pool || list });
        st.floors++;
      }
      floorRespawn = null;
    }
    st.spawned = items.filter((x) => x.our).length;
    const wanted = specs.reduce((a, s) => a + clamp5(Math.round(num3(s.count, 6)), 1, 24), 0);
    if (items.length < Math.min(3, Math.max(1, wanted))) return "no_surfaces";
    return null;
  }
  function respawnOf(s) {
    const cd = num3(s.cooldownSec ?? spec.targetCooldownSec, 0);
    return cd > 0 ? { cooldown: cd, rearm: true, respawn: s.respawn === "same" ? "same" : "move" } : {};
  }
  function inFrustum(p, margin = 0.85) {
    try {
      camera.updateMatrixWorld?.();
      const vi = camera.matrixWorldInverse.elements, pr = camera.projectionMatrix.elements;
      const x = vi[0] * p.x + vi[4] * p.y + vi[8] * p.z + vi[12], y = vi[1] * p.x + vi[5] * p.y + vi[9] * p.z + vi[13], z = vi[2] * p.x + vi[6] * p.y + vi[10] * p.z + vi[14];
      if (z > -0.2) return false;
      const cx = pr[0] * x + pr[4] * y + pr[8] * z + pr[12], cy = pr[1] * x + pr[5] * y + pr[9] * z + pr[13], cw = pr[3] * x + pr[7] * y + pr[11] * z + pr[15];
      return Math.abs(cx / cw) < margin && Math.abs(cy / cw) < margin;
    } catch {
      return true;
    }
  }
  function rearm(it) {
    it.down = false;
    const g = it.our, d = g.userData;
    if (it.respawn === "move" && it.pool?.length && levelRef) {
      const eye = worldPos(camera, {}), feet = player.feet();
      const live = items.filter((x) => x !== it && !x.gone && !x.down && x.our).map((x) => x.our.position);
      const cur = g.position;
      const ok = (q) => dist(q.p, cur) > 1.5 * upm && distXZ(q.p, feet) > 2.6 * upm && live.every((l) => dist(l, q.p) > 1.8 * upm) && (!heroPos || dist(q.p, heroPos) > 2.5 * upm);
      const lifted = (q) => d.kind === "floater" ? { x: q.p.x, y: q.p.y + d.lift + d.size * 0.5, z: q.p.z } : q.p;
      const cand = it.pool.filter(ok);
      const seen = cand.filter((q) => inFrustum(lifted(q)) && levelRef.clear(eye, lifted(q)));
      const pick2 = (seen.length ? seen : cand)[Math.floor(Math.random() * Math.min(4, (seen.length ? seen : cand).length))];
      if (pick2) {
        g.position.set(pick2.p.x, pick2.p.y, pick2.p.z);
        if (d.kind === "wall") {
          g.lookAt(pick2.p.x + pick2.n.x, pick2.p.y + pick2.n.y, pick2.p.z + pick2.n.z);
          d.base = sizing.wallSize ? sizing.wallSize(pick2.p) : d.base;
          it.hitR = d.base * 0.62;
        }
      }
    }
    props.rearm(g);
    st.rearmed = (st.rearmed || 0) + 1;
  }
  let levelRef = null, world2 = null;
  const viewRef = {};
  let followT = 0, heroAwayT = 0;
  function followTick(dt) {
    if ((followT -= dt) > 0) return;
    followT = 0.5;
    if (o.items || o.focus || interaction !== "player-touch" || !levelRef || !player?.feet) return;
    const feet = player.feet();
    if (!feet) return;
    const u = upm, H = measure().H * u, eye = worldPos(camera, {});
    const e = camera.matrixWorld.elements;
    let fx = -e[8], fz = -e[10];
    const fl = Math.hypot(fx, fz) || 1;
    fx /= fl;
    fz /= fl;
    const inView = (q) => {
      const p0 = ndcOf(q);
      return !!p0 && Math.abs(p0.x) < 1.05 && Math.abs(p0.y) < 1.05;
    };
    const live = items.filter((x) => !x.gone && x.our && x.kind === "floater");
    const near = live.filter((x) => distXZ(x.our.position, feet) < 22 * u).length;
    if (near >= Math.min(3, live.length)) return;
    const far = live.filter((x) => distXZ(x.our.position, feet) > 22 * u && !inView({ x: x.our.position.x, y: x.our.position.y + 0.5 * H, z: x.our.position.z }));
    let moved = 0;
    const used = live.filter((x) => !far.includes(x)).map((x) => x.our.position);
    for (const it of far.slice(0, 3)) {
      let spot = null;
      for (const d of [7, 10, 13, 5, 16]) {
        for (const side of [0, -2.5, 2.5, -4.5, 4.5]) {
          const x = feet.x + fx * d * u - fz * side * u, z = feet.z + fz * d * u + fx * side * u;
          const g0 = levelRef.ground(x, feet.y + 2.5 * H, z, 4 * H);
          if (!g0 || g0.ny < 0.7 || Math.abs(g0.y - feet.y) > 1.2 * H) continue;
          if (used.some((q) => Math.hypot(q.x - g0.x, q.z - g0.z) < 2.4 * u)) continue;
          if (!levelRef.clear(eye, { x: g0.x, y: g0.y + 0.6 * H, z: g0.z })) continue;
          spot = g0;
          break;
        }
        if (spot) break;
      }
      if (!spot) continue;
      it.our.position.set(spot.x, spot.y, spot.z);
      used.push(it.our.position);
      moved++;
    }
    if (moved) st.followed = (st.followed || 0) + moved;
    if (hero && !hero.parent?.userData?.kind) {
      const hp = worldPos(hero, {}), inF = inView({ x: hp.x, y: hp.y + hero.userData.h * 0.5, z: hp.z });
      heroAwayT = !inF && distXZ(hp, feet) > 30 * u ? heroAwayT + 0.5 : 0;
      if (heroAwayT >= 2) {
        heroAwayT = 0;
        const tanHalf = Math.tan((Number.isFinite(camera.fov) ? camera.fov : 60) * Math.PI / 360);
        const route = [...items.filter((x) => x.our && !x.gone).map((x) => x.our.position)];
        const c = coneSpot({ level: levelRef, eye, feet, H: measure().H, u, h: hero.userData.h, tanHalf, route });
        if (c && !c.weak) {
          hero.position.set(c.pos.x, c.pos.y, c.pos.z);
          hero.rotation.y = Math.atan2(c.face.x, c.face.z);
          heroPos = { x: c.pos.x, y: c.pos.y + hero.userData.h * 0.5, z: c.pos.z };
          st.heroFollowed = (st.heroFollowed || 0) + 1;
        }
      }
    }
  }
  const ndcOf = (q) => {
    try {
      return ndc(q);
    } catch {
      return null;
    }
  };
  const pathBoards = [];
  let boardAwayT = 0;
  function boardAhead(dAhead, side) {
    st.boardTries = (st.boardTries || 0) + 1;
    if (!world2?.board || !levelRef || !player?.feet) {
      st.boardWhy = "noworld";
      return null;
    }
    const feet = player.feet();
    if (!feet) return null;
    const u = upm, H = measure().H * u, eye = worldPos(camera, {});
    const e = camera.matrixWorld.elements;
    let fx = -e[8], fz = -e[10];
    const fl = Math.hypot(fx, fz) || 1;
    fx /= fl;
    fz /= fl;
    const tanHalf = Math.tan((Number.isFinite(camera.fov) ? camera.fov : 60) * Math.PI / 360);
    for (const dk of [0.6, 0.8, 1, 0.45, 1.25]) for (const sd of [side, side * 1.5, -side]) {
      const d = dAhead * dk * u, x = feet.x + fx * d - fz * sd * u, z = feet.z + fz * d + fx * sd * u;
      let g0 = levelRef.ground(x, feet.y + 3 * H, z, 6 * H);
      if (!g0 || g0.ny < 0.6 || Math.abs(g0.y - feet.y) > 2 * H) g0 = { x, y: feet.y + 0.2 * H, z, ny: 1, air: true };
      const dist0 = Math.hypot(x - eye.x, g0.y - eye.y, z - eye.z);
      const h0 = clamp5(0.3 * 2 * tanHalf * dist0, 1.2 * u, 4.6 * u);
      let h = 0, c = null, top = null, mid = null;
      for (const k of [1, 0.82, 0.68, 0.55]) {
        const hh = h0 * k, cc = { x: g0.x, y: g0.y + hh / 2 + 0.2 * u, z: g0.z };
        const tp = ndcOf({ x: cc.x, y: cc.y + hh / 2, z: cc.z }), md = ndcOf(cc);
        if (tp && md && tp.y <= 0.6 && Math.abs(md.x) <= 0.75) {
          h = hh;
          c = cc;
          top = tp;
          mid = md;
          break;
        }
        top = tp;
        mid = md;
      }
      if (!c) {
        st.boardWhy = `view ${top?.y?.toFixed(2)} ${mid?.x?.toFixed(2)}`;
        continue;
      }
      const w = h * 2;
      if (!levelRef.clear(eye, c)) {
        st.boardWhy = "occluded";
        continue;
      }
      if (items.some((it) => it.our && !it.gone && distXZ(it.our.position, c) < w * 0.6)) continue;
      const nx = eye.x - c.x, nz = eye.z - c.z, nl = Math.hypot(nx, nz) || 1;
      const g = world2.board(c, { x: nx / nl, y: 0, z: nz / nl }, w, h);
      g.userData.bh = h;
      return g;
    }
    return null;
  }
  function placePathBoards() {
    for (const [d, sd] of [[9, 3.4], [17, -3.8]]) {
      const g = boardAhead(d, sd);
      if (g) pathBoards.push(g);
    }
    st.pathBoards = pathBoards.length;
  }
  let pad = null, padT = 0;
  function padTick(dt) {
    if (!world2?.pad || !levelRef || !player?.feet || (padT -= dt) > 0) return;
    padT = 0.6;
    const feet = player.feet();
    if (!feet) return;
    const u = upm, H = measure().H * u, eye = worldPos(camera, {});
    const ok = pad && (() => {
      const q = ndcOf(pad.position);
      return q && Math.abs(q.x) < 0.8 && q.y < 0.55 && q.y > -0.9 && distXZ(pad.position, feet) < 9 * u;
    })();
    if (ok) return;
    const e = camera.matrixWorld.elements;
    let fx = -e[8], fz = -e[10];
    const fl = Math.hypot(fx, fz) || 1;
    fx /= fl;
    fz /= fl;
    for (const [d, sd] of [[3.5, 0], [3.5, 1.8], [3.5, -1.8], [2.2, 0], [5, 0], [1.2, 0]]) {
      const x = feet.x + fx * d * u - fz * sd * u, z = feet.z + fz * d * u + fx * sd * u;
      const g0 = levelRef.ground(x, feet.y + 1.5 * H, z, 3 * H);
      if (!g0 || g0.ny < 0.85 || Math.abs(g0.y - feet.y) > 0.8 * H) continue;
      const D = 3.6 * u;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
        const q2 = levelRef.ground(g0.x + a * D * 0.45, g0.y + H, g0.z + b * D * 0.45, 2 * H);
        return !q2 || Math.abs(q2.y - g0.y) > 0.25 * u;
      })) continue;
      const q = ndcOf(g0);
      if (!q || Math.abs(q.x) > 0.8 || q.y > 0.55) continue;
      if (!pad) pad = world2.pad(g0, D, eye);
      else {
        pad.position.set(g0.x, g0.y + 0.04 * u, g0.z);
        pad.rotation.y = Math.atan2(eye.x - g0.x, eye.z - g0.z) + Math.PI;
      }
      st.padMoves = (st.padMoves || 0) + 1;
      return;
    }
  }
  function boardTick(dt) {
    try {
      padTick(dt);
    } catch (e) {
      log2(`pad: ${e.message}`);
    }
    if (pathBoards.length < 2 && (boardAwayT += dt) > 1) {
      boardAwayT = 0;
      const g2 = boardAhead(10, pathBoards.length ? -3.2 : 3.2);
      if (g2) pathBoards.push(g2);
      return;
    }
    if (!pathBoards.length) return;
    const good = pathBoards.some((g2) => {
      const hh = (g2.userData.bh || 2 * upm) / 2;
      const q = ndcOf(g2.position), t0 = ndcOf({ x: g2.position.x, y: g2.position.y + hh, z: g2.position.z }), b0 = ndcOf({ x: g2.position.x, y: g2.position.y - hh, z: g2.position.z });
      return q && t0 && b0 && Math.abs(q.x) < 0.72 && t0.y < 0.7 && b0.y > -0.9 && (t0.y - b0.y) / 2 > 0.12;
    });
    boardAwayT = good ? 0 : boardAwayT + dt;
    if (boardAwayT < 1) return;
    boardAwayT = 0;
    const g = pathBoards.shift();
    const repl = boardAhead(10, (st.boardMoves || 0) % 2 ? -3.2 : 3.2);
    if (repl) {
      g.visible = false;
      g.userData.hidden = true;
      pathBoards.push(repl);
      st.boardMoves = (st.boardMoves || 0) + 1;
    } else pathBoards.unshift(g);
  }
  function respawnTick() {
    const now2 = performance.now();
    if (!o.items && !ballMode && interaction === "projectile-hit" && !st.wave2) {
      const set = items.filter((x) => x.our && !x.cosmetic && !x.cooldown && (x.kind === "wall" || x.kind === "floater"));
      const left0 = o.timeLeft ? o.timeLeft() : 99;
      if (set.length >= 3 && set.every((x) => x.gone) && left0 > 3) {
        st.wave2 = true;
        for (const it of set) {
          it.gone = false;
          it.rearm = true;
          it.cooldown = 2;
          it.respawn = "same";
          rearm(it);
        }
      }
    }
    const rs = items.filter((x) => x.rearm);
    if (!rs.length) return;
    for (const it of rs) if (it.down && now2 >= it.rearmAt) rearm(it);
    const left = o.timeLeft ? o.timeLeft() : 99;
    if (rs.every((x) => x.down) && left > 3) {
      for (const it of rs) rearm(it);
      st.refills = (st.refills || 0) + 1;
    }
  }
  function roadOf(level, course, feet, u) {
    const pts = course.map((c) => c.p);
    const poly = [{ x: feet.x, y: feet.y, z: feet.z }, ...pts, ...pts, pts[0]];
    const lens = [];
    let length = 0;
    for (let k = 1; k < poly.length; k++) {
      lens.push(dist(poly[k - 1], poly[k]));
      length += lens.at(-1);
    }
    const roadMats = /* @__PURE__ */ new Set();
    for (const q of [poly[0], ...pts]) {
      const g2 = level.ground(q.x, q.y + 2 * u, q.z, 8 * u);
      if (g2?.o?.material) roadMats.add(g2.o.material);
    }
    const onRoad = (x, y, z) => {
      const g2 = level.ground(x, y + 4 * u, z, 14 * u);
      return g2 && (!roadMats.size || roadMats.has(g2.o.material)) ? g2 : null;
    };
    const at = (dd) => {
      for (let k = 1; k < poly.length; k++) {
        const a = poly[k - 1], bq = poly[k], L = lens[k - 1];
        if (dd <= L) {
          const f = dd / L;
          return { x: a.x + (bq.x - a.x) * f, y: Math.max(a.y, bq.y), z: a.z + (bq.z - a.z) * f, dx: (bq.x - a.x) / L, dz: (bq.z - a.z) / L };
        }
        dd -= L;
      }
      return null;
    };
    const centreAt = (c) => {
      const px = -c.dz, pz = c.dx;
      let off = null;
      for (let o2 = 0; o2 <= 40 && off === null; o2 += 2) for (const sg of o2 ? [1, -1] : [1]) if (off === null && onRoad(c.x + px * sg * o2 * u, c.y, c.z + pz * sg * o2 * u)) off = sg * o2;
      if (off === null) return null;
      let lo = off, hi = off;
      while (hi - off < 24 && onRoad(c.x + px * (hi + 1) * u, c.y, c.z + pz * (hi + 1) * u)) hi += 1;
      while (off - lo < 24 && onRoad(c.x + px * (lo - 1) * u, c.y, c.z + pz * (lo - 1) * u)) lo -= 1;
      const mid = (lo + hi) / 2, g1 = onRoad(c.x + px * mid * u, c.y, c.z + pz * mid * u);
      return g1 ? { p: { x: g1.x, y: g1.y, z: g1.z }, w: (hi - lo) * u } : null;
    };
    return {
      length,
      onRoad,
      /** a gate spot at course distance dd: centreline point, its tangent, the road width; null under cover or on a jump */
      centre(dd) {
        const c = at(dd), c0 = at(Math.max(0, dd - 4 * u)), c1 = at(dd + 4 * u);
        if (!c || !c0 || !c1) return null;
        const m0 = centreAt(c), a = centreAt(c0), b = centreAt(c1);
        if (!m0 || !a || !b) return null;
        if (Math.abs(a.p.y - m0.p.y) > 0.8 * u || Math.abs(b.p.y - m0.p.y) > 0.8 * u) return null;
        if (level.raycast(m0.p.x, m0.p.y + 0.6 * u, m0.p.z, 0, 1, 0, 14 * u)) return null;
        const tx = b.p.x - a.p.x, tz = b.p.z - a.p.z, tl = Math.hypot(tx, tz) || 1;
        return { p: m0.p, t: { x: tx / tl, z: tz / tl }, w: m0.w };
      }
    };
  }
  function focusPath() {
    const f = o.focus, P = f.points.map((q) => ({ x: q[0] * 1, y: q[1] * 1, z: q[2] * 1 }));
    const cum = [0];
    for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + dist(P[k - 1], P[k]));
    const L = cum.at(-1) || 1;
    const at = (frac2) => {
      const d = clamp5(frac2, 0, 1) * L;
      let k = 1;
      while (k < P.length - 1 && cum[k] < d) k++;
      const a = P[k - 1], b = P[k], t = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
      return { p: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }, t: { x: tx / tl, z: tz / tl }, k };
    };
    let uturn = 0.5, best = -1;
    for (let q = 0.1; q <= 0.9; q += 0.02) {
      const a = at(q - 10 / L), b = at(q + 10 / L);
      const turn = Math.acos(clamp5(a.t.x * b.t.x + a.t.z * b.t.z, -1, 1));
      if (turn > best) {
        best = turn;
        uturn = q;
      }
    }
    return { P, L, at, uturn, turn: best, width: (+o.focus.width || +o.focus.driveWidth || 10) * upm, drive: (+o.focus.driveWidth || +o.focus.width || 10) * upm };
  }
  function chaseClearH(w, eye, feet, u) {
    const camH = Math.max(0, (eye?.y ?? 0) - (feet?.y ?? 0));
    return Math.max(5 * u, camH + w / 8 + 1.5 * u);
  }
  function spawnFocus({ level, eye, feet, H, u, specs, viewH }) {
    const fp = focusPath();
    st.focus = { length: +(fp.L / u).toFixed(1), width: +(fp.width / u).toFixed(1), uturnAt: +fp.uturn.toFixed(2), uturnDeg: Math.round(fp.turn * 180 / Math.PI) };
    const heroSpec = specs.find((x) => x.asset === "hero");
    const gateSpec = specs.find((x) => x.where === "along-path" || x.asset === "banner");
    const itemSpec = specs.find((x) => x.asset === "collectible");
    const nG = gateSpec ? clamp5(Math.round(num3(gateSpec.count, 5)), 4, 6) : 0;
    const gw = fp.drive + 1.2 * u, gh = chaseClearH(gw, eye, feet, u);
    const gateAt = [];
    for (let k = 0; k < nG; k++) {
      let q = 0.1 + 0.8 * k / Math.max(1, nG - 1);
      if (Math.abs(q - fp.uturn) < 0.06) q += q < fp.uturn ? -0.07 : 0.07;
      gateAt.push(q);
    }
    for (const [k, q] of gateAt.entries()) {
      const c = fp.at(q);
      const g0 = level.ground(c.p.x, c.p.y + 3 * u, c.p.z, 8 * u);
      const gate = props.gate({ x: c.p.x, y: g0 ? g0.y : c.p.y, z: c.p.z }, c.t, gw, gh);
      addItem(gate, "gate", { hitR: gw / 2 + 0.8 * u, order: k });
      st.gates++;
    }
    if (heroSpec && nG >= 2) heroOnGate(items.filter((x) => x.kind === "gate")[1], { viewH });
    const nI = itemSpec ? clamp5(Math.round(num3(itemSpec.count, 8)), 4, 14) : 0;
    const sz = clamp5(0.65 * H, 1.6, 2.6) * u;
    for (let k = 0; k < nI; k++) {
      const q = 0.14 + 0.74 * (k + 0.5) / nI;
      if (Math.abs(q - fp.uturn) < 0.04) continue;
      const c = fp.at(q), side = (k % 2 ? 1 : -1) * fp.drive * 0.12;
      const x = c.p.x + -c.t.z * side, z = c.p.z + c.t.x * side;
      const g0 = level.ground(x, c.p.y + 3 * u, z, 8 * u);
      addItem(props.floater({ x, y: g0 ? g0.y : c.p.y, z }, 0.35 * u, sz), "floater", { hitR: sz * 0.62, reachR: fp.drive * 0.4 });
      st.floors++;
    }
    if (heroSpec) {
      const c = fp.at(fp.uturn), a = fp.at(fp.uturn - 0.06), b = fp.at(fp.uturn + 0.06);
      const mid = { x: (a.p.x + b.p.x) / 2, z: (a.p.z + b.p.z) / 2 };
      let ox = c.p.x - mid.x, oz = c.p.z - mid.z;
      const ol = Math.hypot(ox, oz) || 1;
      ox /= ol;
      oz /= ol;
      const off = fp.width / 2 + 7 * u;
      const pos = { x: c.p.x + ox * off, y: c.p.y, z: c.p.z + oz * off };
      const g0 = level.ground(pos.x, pos.y + 6 * u, pos.z, 30 * u);
      if (g0) pos.y = g0.y;
      const h = heroHeight(u);
      const lm = makeLandmark(h);
      lm.position.set(pos.x, pos.y, pos.z);
      lm.rotation.y = Math.atan2(-ox, -oz);
      root.add(lm);
      if (!hero) {
        hero = lm;
        heroPos = { x: pos.x, y: pos.y + h * 0.5, z: pos.z };
      }
      landmarks.push(lm);
      st.landmark = { where: "uturn", heightM: +(h / u).toFixed(1), offsetM: +(off / u).toFixed(1) };
    }
  }
  const landmarks = [];
  function bakeSkinned(root0) {
    root0.updateMatrixWorld(true);
    const list = [];
    root0.traverse((x) => {
      if (x.isSkinnedMesh) list.push(x);
    });
    for (const sm of list) {
      try {
        const src = sm.geometry, pos = src.attributes.position, out = new Float32Array(pos.count * 3), v = new T.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          (sm.applyBoneTransform || sm.boneTransform).call(sm, i, v);
          out[i * 3] = v.x;
          out[i * 3 + 1] = v.y;
          out[i * 3 + 2] = v.z;
        }
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.BufferAttribute(out, 3));
        if (src.attributes.uv) g.setAttribute("uv", src.attributes.uv);
        if (src.index) g.setIndex(src.index);
        g.computeVertexNormals();
        const mesh = new T.Mesh(g, sm.material);
        mesh.position.copy(sm.position);
        mesh.quaternion.copy(sm.quaternion);
        mesh.scale.copy(sm.scale);
        mesh.name = sm.name;
        mesh.castShadow = true;
        sm.parent.add(mesh);
        sm.parent.remove(sm);
      } catch (e) {
        log2(`hero bake: ${e.message}`);
      }
    }
    return list.length;
  }
  function makeLandmark(h) {
    const hr = makeHero(T, m, o.heroGltf || null, pal, { pedestal: false, heightM: h });
    hr.play("idle");
    if (adapter.direct !== true) {
      hr.mixer?.update(0.01);
      if (bakeSkinned(hr.root)) hr.mixer = null;
    }
    try {
      hr.root.updateMatrixWorld(true);
      const bb = new T.Box3();
      hr.root.traverse((x) => {
        if (x.isMesh && x.geometry) {
          x.geometry.computeBoundingBox?.();
          bb.union(x.geometry.boundingBox.clone().applyMatrix4(x.matrixWorld));
        }
      });
      const got = bb.isEmpty() ? 0 : bb.max.y - bb.min.y;
      if (got > 1e-3 && Math.abs(got - h) / h > 0.04) {
        const k = h / got;
        hr.root.scale.multiplyScalar(k);
        hr.root.position.y -= bb.min.y * k - bb.min.y;
        hr.root.updateMatrixWorld(true);
      }
      const bb2 = new T.Box3();
      hr.root.traverse((x) => {
        if (x.isMesh && x.geometry) bb2.union(x.geometry.boundingBox.clone().applyMatrix4(x.matrixWorld));
      });
      if (!bb2.isEmpty() && Math.abs(bb2.min.y) > h * 0.02) hr.root.position.y -= bb2.min.y;
    } catch (e) {
      log2(`hero size: ${e.message}`);
    }
    hr.root.traverse((x) => {
      for (const mt of [x.material].flat().filter(Boolean)) {
        if ("metalness" in mt) mt.metalness = Math.min(mt.metalness, 0.12);
        if ("roughness" in mt) mt.roughness = Math.max(mt.roughness, 0.45);
        if ("envMapIntensity" in mt) mt.envMapIntensity = Math.min(mt.envMapIntensity ?? 1, 0.5);
      }
    });
    const g = new T.Group();
    g.name = "br:hero";
    g.add(hr.root);
    if (full) {
      hr.root.traverse((x) => {
        for (const mt of [x.material].flat().filter(Boolean)) if (mt.emissive && mt.color) {
          mt.emissive.copy(mt.color).multiplyScalar(0.28);
          if (mt.map && "emissiveMap" in mt) mt.emissiveMap = mt.map;
        }
      });
      const halo = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: glowTexture(T, pal.primary), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.75, toneMapped: false }));
      halo.scale.setScalar(h * 1.9);
      halo.position.y = h * 0.5;
      halo.renderOrder = -1;
      halo.name = "br:hero-halo";
      const ring = new T.Mesh(new T.RingGeometry(0.42, 0.5, 48), new T.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.8, side: T.DoubleSide, toneMapped: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.scale.setScalar(h * 0.9);
      ring.position.y = 0.04;
      g.add(halo, ring);
      g.userData.halo = halo;
    }
    const clips = !!hr.mixer && adapter.direct === true && hr.clips.length > 0;
    g.userData = { ...g.userData, kind: "hero", hero: hr, h, t: Math.random() * 6, idle: !clips };
    return g;
  }
  function heroOnGate(gateItem, { viewH }) {
    if (!gateItem) return;
    const gate = gateItem.our, gd = gate.userData;
    const top = { x: gate.position.x, y: gate.position.y + gd.h, z: gate.position.z };
    const [lo0, hi0] = full ? [0.25, 0.4] : [0.15, 0.35];
    const h = clamp5(num3(m.round.hero.heightM, 4) * upm, lo0 * viewH(top) * 0.6, hi0 * viewH(top) * 0.6);
    const lm = makeLandmark(Math.min(h, gd.w * 0.6, gd.h * 1.3));
    lm.position.set(0, gd.h - gd.w / 16, 0);
    lm.rotation.y = Math.PI;
    gate.add(lm);
    hero = lm;
    heroPos = top;
    st.hero = { where: "gate", heightM: +(lm.userData.h / upm).toFixed(2), gate: gateItem.order };
  }
  function heroHeight(u) {
    return clamp5(num3(m.round.hero?.heightM, 4), 0.5, 40) * u;
  }
  function ndc(p) {
    const V = new T.Matrix4().fromArray(camera.matrixWorldInverse.elements), P = new T.Matrix4().fromArray(camera.projectionMatrix.elements);
    const v = new T.Vector3(p.x, p.y, p.z).applyMatrix4(V);
    if (v.z > -0.1) return null;
    v.applyMatrix4(P);
    return { x: v.x, y: v.y };
  }
  function coneSpot({ level, eye, feet, H, u, h, tanHalf, route = [], road = null, offSurface = null, prefAng = 0.24 }) {
    const e = camera.matrixWorld.elements;
    let fx = -e[8], fz = -e[10];
    const fl = Math.hypot(fx, fz) || 1;
    fx /= fl;
    fz /= fl;
    const dStar = clamp5(h / (2 * tanHalf * 0.28), 7 * u, 90 * u);
    const halfW = Math.atan(tanHalf * (camera.aspect || 16 / 9));
    const clr = Math.max(3.5 * u, h * 0.45);
    let best = null;
    for (const dk of [1, 0.85, 1.2, 0.7, 1.45, 0.55]) for (const ang of [0.24, -0.24, 0.36, -0.36, 0.15, -0.15, 0.46, -0.46, 0.54, -0.54]) {
      if (Math.abs(ang) > halfW * 0.8) continue;
      const d = dStar * dk, c = Math.cos(ang), sn = Math.sin(ang);
      const dx = fx * c - fz * sn, dz = fx * sn + fz * c;
      const x = eye.x + dx * d, z = eye.z + dz * d;
      const g = level.ground(x, feet.y + h + 2 * u, z, h * 2 + 30 * u);
      const grounded = !!(g && g.y > feet.y - Math.max(h, 6 * u) && g.y < feet.y + h);
      const y = grounded ? g.y : feet.y - 0.1 * h;
      const pos = { x, y, z };
      if (distXZ(pos, feet) < Math.max(5 * u, h * 0.6)) continue;
      if (route.some((q2) => distXZ(q2, pos) < clr && Math.abs(q2.y - y) < h + 3 * u)) continue;
      if (road?.onRoad && [[0, 0], [clr, 0], [-clr, 0], [0, clr], [0, -clr]].some(([ox, oz]) => road.onRoad(x + ox, y, z + oz))) continue;
      const mid = { x, y: y + h * 0.5, z }, top = { x, y: y + h * 0.92, z };
      const q = ndc(mid), qt = ndc(top), qb = ndc(pos);
      if (!q || !qt || Math.abs(q.x) > 0.8 || qt.y > 0.92 || qb && qb.y < -1.05) continue;
      const vis = level.clear(eye, mid) || level.clear(eye, top);
      if (grounded && level.raycast(x, y + 0.3 * u, z, 0, 1, 0, h)) continue;
      if (offSurface && g?.o === offSurface) continue;
      const score = (grounded ? 0 : 2.5) + (vis ? 0 : 6) + Math.abs(dk - 1) * 2 + Math.abs(Math.abs(ang) - prefAng) * 3;
      if (!best || score < best.score) best = { pos, score, grounded, vis, face: { x: eye.x - x, z: eye.z - z } };
    }
    if (!best || !best.vis) return best && best.vis ? best : best ? { ...best, weak: true } : null;
    return best;
  }
  function spawnHero({ level, eye, feet, H, u, course, road, speed, viewH, tanHalf }) {
    let pos = null, face = null, how = "";
    const route = [...course.map((c) => c.p), ...[...entities.values()].map((en) => worldPos(en.mesh, {})), ...items.filter((x) => x.our).map((x) => centerOf(x, {}))];
    const hWant = heroHeight(u);
    const sport = !!(findGoal() && (ballMatch || /goal/i.test(spec.goalMatch || "")));
    const cone = coneSpot({ level, eye, feet, H, u, h: hWant, tanHalf, route, road, prefAng: interaction === "projectile-hit" ? 0.5 : 0.24, offSurface: sport ? level.ground(feet.x, feet.y + 1 * u, feet.z, 4 * u)?.o || null : null });
    const inFrame = (p, h2) => {
      const q = ndc({ x: p.x, y: p.y + h2 * 0.5, z: p.z }), qt = ndc({ x: p.x, y: p.y + h2 * 0.9, z: p.z });
      return !!(q && qt && Math.abs(q.x) < 0.85 && qt.y < 0.95) && (level.clear(eye, { x: p.x, y: p.y + h2 * 0.5, z: p.z }) || level.clear(eye, { x: p.x, y: p.y + h2 * 0.9, z: p.z }));
    };
    const goal = findGoal();
    if (goal && (ballMatch || /goal/i.test(spec.goalMatch || ""))) {
      const fr = goalFrame2(goal, level, feet);
      if (fr) {
        pos = { x: fr.mouthC.x - fr.n.x * (fr.depth + 2.2 * u), y: fr.ground, z: fr.mouthC.z - fr.n.z * (fr.depth + 2.2 * u) };
        face = fr.n;
        how = "behind-goal";
      }
      if (pos && !inFrame(pos, hWant)) {
        pos = null;
        face = null;
        how = "";
      }
    }
    if (!pos && cone && !cone.weak) {
      pos = cone.pos;
      face = cone.face;
      how = cone.grounded ? "view-cone" : "view-cone-floating";
    }
    if (!pos && road) {
      const vEff = (speed > 0 ? speed : 25) * u * 0.85;
      for (let dd = vEff * 5; dd < vEff * 9 && !pos; dd += 6 * u) {
        const c = road.centre(dd);
        if (!c) continue;
        const gw = clamp5(c.w + 1.5 * u, 8 * u, 22 * u);
        const gate = props.gate(c.p, c.t, gw, 5 * u);
        root.add(gate);
        heroOnGate({ our: gate, order: -1 }, { viewH });
        st.hero.where = "arch";
        return;
      }
    }
    if (!pos && course.length) {
      const next = course[0].p;
      let anchor = null;
      scene.traverse((x) => {
        if (anchor || isOurs(x) || !/bounce|spring|trampoline|jump_?pad|mushroom/i.test(x.name || "")) return;
        const p = worldPos(x, {});
        if (distXZ(p, feet) < 35 * u && distXZ(p, feet) > 3 * u) anchor = p;
      });
      const base = anchor || { x: feet.x + (next.x - feet.x) * 0.5, y: feet.y, z: feet.z + (next.z - feet.z) * 0.5 };
      const dx = next.x - feet.x, dz = next.z - feet.z, l = Math.hypot(dx, dz) || 1;
      for (const side of [3.2, -3.2, 5, -5]) {
        const x = base.x + -dz / l * side * u, z = base.z + dx / l * side * u;
        const g = level.ground(x, base.y + 4 * u, z, 10 * u);
        if (g && Math.abs(g.y - base.y) < 2.5 * u && level.clear(eye, { x: g.x, y: g.y + 1.5 * u, z: g.z })) {
          pos = { x: g.x, y: g.y, z: g.z };
          how = anchor ? "beside-pad" : "beside-route";
          break;
        }
      }
    }
    if (!pos) {
      let lo = { x: Infinity, z: Infinity }, hi = { x: -Infinity, z: -Infinity };
      for (const mm of level.meshes) {
        const bb = mm.bb;
        if (bb[1] > feet.y + 6 * H * u) continue;
        lo = { x: Math.min(lo.x, bb[0]), z: Math.min(lo.z, bb[2]) };
        hi = { x: Math.max(hi.x, bb[3]), z: Math.max(hi.z, bb[5]) };
      }
      const cx = (lo.x + hi.x) / 2, cz = (lo.z + hi.z) / 2;
      const tries = [[cx, cz]];
      for (let r4 = 2; r4 <= 14; r4 += 3) for (let a = 0; a < 8; a++) tries.push([cx + Math.cos(a * 0.785) * r4 * u, cz + Math.sin(a * 0.785) * r4 * u]);
      const glows = [];
      scene.traverse((x) => {
        if (!x.isMesh || isOurs(x) || !x.geometry) return;
        const mt = Array.isArray(x.material) ? x.material[0] : x.material;
        if (!(mt?.transparent || mt?.blending === 2)) return;
        const r4 = geomRadius(x.geometry) * worldScale(x);
        try {
          if (!x.geometry.boundingBox) x.geometry.computeBoundingBox?.();
        } catch {
        }
        const bb = x.geometry.boundingBox, tall = bb ? (bb.max.y - bb.min.y) * worldScale(x) : 0, wide = bb ? Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * worldScale(x) : 0;
        if (r4 > 1.2 * u && r4 < 15 * u && tall > 2 * u && tall > wide * 0.5) glows.push({ c: worldPos(x, {}), r: Math.max(1.5 * u, wide / 2 + 1 * u) });
      });
      const occupied = (g) => {
        for (let a = 0; a < 8; a++) {
          const ang = a * 0.785;
          if (level.raycast(g.x, g.y + 1 * u, g.z, Math.cos(ang), 0, Math.sin(ang), 2 * u)) return true;
        }
        if (level.raycast(g.x, g.y + 0.3 * u, g.z, 0, 1, 0, 6 * u)) return true;
        return glows.some((q) => distXZ(q.c, g) < q.r * 0.8 && Math.abs(q.c.y - g.y) < q.r + 3 * u);
      };
      for (const [x, z] of tries) {
        const g = level.raycast(x, feet.y + 3 * H * u, z, 0, -1, 0, 8 * H * u);
        if (!g || g.ny < 0.85 || Math.abs(g.y - feet.y) > 1.5 * H * u) continue;
        if (distXZ(g, feet) < 6 * u || !level.clear(eye, { x: g.x, y: g.y + 1.2 * u, z: g.z }) || occupied(g)) continue;
        pos = { x: g.x, y: g.y, z: g.z };
        how = "arena-centre";
        break;
      }
    }
    if (!pos) {
      log2("in-world: no landmark spot for the hero");
      st.hero = { where: "none" };
      return;
    }
    const seg = segPointDist({ x: eye.x, y: 0, z: eye.z }, { x: feet.x, y: 0, z: feet.z }, { x: pos.x, y: 0, z: pos.z });
    if (seg < 1.5 * u && how !== "behind-goal") {
      pos.x += (pos.x - feet.x) * 0.3;
      pos.z += (pos.z - feet.z) * 0.3;
    }
    const mid = { x: pos.x, y: pos.y + hWant * 0.5, z: pos.z };
    const h = Math.min(hWant, 0.4 * viewH(mid));
    const lm = makeLandmark(h);
    lm.position.set(pos.x, pos.y, pos.z);
    const f = face || { x: eye.x - pos.x, z: eye.z - pos.z };
    lm.rotation.y = Math.atan2(f.x, f.z);
    root.add(lm);
    hero = lm;
    heroPos = { x: pos.x, y: pos.y + h * 0.5, z: pos.z };
    st.hero = { where: how, heightM: +(h / u).toFixed(2), source: lm.userData.hero.source };
  }
  function goalFrame2(goal, level, feet) {
    let lo = { x: Infinity, y: Infinity, z: Infinity }, hi = { x: -Infinity, y: -Infinity, z: -Infinity };
    goal.traverse((x) => {
      if (!x.isMesh || isOurs(x) || !x.geometry) return;
      const g = x.geometry;
      try {
        if (!g.boundingBox) g.computeBoundingBox?.();
      } catch {
      }
      const bb = g.boundingBox;
      if (!bb) return;
      const e = x.matrixWorld.elements;
      for (let k = 0; k < 8; k++) {
        const px = k & 1 ? bb.max.x : bb.min.x, py = k & 2 ? bb.max.y : bb.min.y, pz = k & 4 ? bb.max.z : bb.min.z;
        const wx = e[0] * px + e[4] * py + e[8] * pz + e[12], wy = e[1] * px + e[5] * py + e[9] * pz + e[13], wz = e[2] * px + e[6] * py + e[10] * pz + e[14];
        lo = { x: Math.min(lo.x, wx), y: Math.min(lo.y, wy), z: Math.min(lo.z, wz) };
        hi = { x: Math.max(hi.x, wx), y: Math.max(hi.y, wy), z: Math.max(hi.z, wz) };
      }
    });
    if (!Number.isFinite(lo.x)) return null;
    const alongX = hi.x - lo.x < hi.z - lo.z;
    const ref = balls[0] ? ballCenter(balls[0]) : feet;
    const mid = { x: (lo.x + hi.x) / 2, z: (lo.z + hi.z) / 2 };
    const sgn = alongX ? Math.sign(ref.x - mid.x) || -1 : Math.sign(ref.z - mid.z) || -1;
    const n = alongX ? { x: sgn, y: 0, z: 0 } : { x: 0, y: 0, z: sgn };
    const depth = alongX ? hi.x - lo.x : hi.z - lo.z;
    const ground = Math.min(lo.y + 0.05, level.ground(mid.x, lo.y + 0.3, mid.z, 5)?.y ?? lo.y);
    const mouth = alongX ? sgn > 0 ? hi.x : lo.x : sgn > 0 ? hi.z : lo.z;
    const mouthC = alongX ? { x: mouth, y: ground, z: mid.z } : { x: mid.x, y: ground, z: mouth };
    return { lo, hi, n, depth, ground, mouthC };
  }
  const cooldownOf = (s, def) => {
    const v = s.cooldownSec ?? spec.zoneCooldownSec;
    return v === null || v === false || v === 0 ? 0 : num3(v, def);
  };
  function findGoal() {
    const mt = entityMatcher(spec.goalMatch || "name:goal_away", hooks, scene);
    let goal = null;
    scene.traverse((x) => {
      if (!goal && x.isMesh && !isOurs(x)) {
        const r4 = mt?.(x);
        if (r4) goal = r4;
      }
    });
    if (!goal) scene.traverse((x) => {
      if (!goal && /^goal([_\-. ]|$)/i.test(x.name || "") && x.children?.length) goal = x;
    });
    return goal;
  }
  function spawnGoalZones(s, count, level, feet) {
    const goal = findGoal();
    if (!goal) {
      log2("in-world: no goal object for goal zones");
      return;
    }
    let lo = { x: Infinity, y: Infinity, z: Infinity }, hi = { x: -Infinity, y: -Infinity, z: -Infinity };
    goal.traverse((x) => {
      if (!x.isMesh || isOurs(x) || !x.geometry) return;
      const g = x.geometry;
      try {
        if (!g.boundingBox) g.computeBoundingBox?.();
      } catch {
      }
      const bb = g.boundingBox;
      if (!bb) return;
      const e = x.matrixWorld.elements;
      for (let k = 0; k < 8; k++) {
        const px = k & 1 ? bb.max.x : bb.min.x, py = k & 2 ? bb.max.y : bb.min.y, pz = k & 4 ? bb.max.z : bb.min.z;
        const wx = e[0] * px + e[4] * py + e[8] * pz + e[12], wy = e[1] * px + e[5] * py + e[9] * pz + e[13], wz = e[2] * px + e[6] * py + e[10] * pz + e[14];
        lo = { x: Math.min(lo.x, wx), y: Math.min(lo.y, wy), z: Math.min(lo.z, wz) };
        hi = { x: Math.max(hi.x, wx), y: Math.max(hi.y, wy), z: Math.max(hi.z, wz) };
      }
    });
    if (!Number.isFinite(lo.x)) return;
    const alongX = hi.x - lo.x < hi.z - lo.z;
    const ref = balls[0] ? ballCenter(balls[0]) : feet;
    const mid = { x: (lo.x + hi.x) / 2, z: (lo.z + hi.z) / 2 };
    const sgn = alongX ? Math.sign(ref.x - mid.x) || -1 : Math.sign(ref.z - mid.z) || -1;
    const n = alongX ? { x: sgn, y: 0, z: 0 } : { x: 0, y: 0, z: sgn };
    const t = alongX ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
    const depth = alongX ? hi.x - lo.x : hi.z - lo.z, width = alongX ? hi.z - lo.z : hi.x - lo.x;
    const ground = Math.min(lo.y + 0.05, level.ground(mid.x, lo.y + 0.3, mid.z, 5)?.y ?? lo.y);
    const height = Math.max(0.5, hi.y - ground);
    const mouth = alongX ? sgn > 0 ? hi.x : lo.x : sgn > 0 ? hi.z : lo.z;
    const nz = clamp5(count, 1, 4), w = width * 0.96 / nz, cd = cooldownOf(s, 2);
    for (let k = 0; k < nz; k++) {
      const off = -width * 0.48 + w * (k + 0.5);
      const c = alongX ? { x: mouth - sgn * 0.04, y: ground + height * 0.5, z: mid.z + off } : { x: mid.x + off, y: ground + height * 0.5, z: mouth - sgn * 0.04 };
      const tp = { x: c.x + n.x * 1.6 * upm, z: c.z + n.z * 1.6 * upm };
      const g1 = level.ground(tp.x, ground + 2 * upm, tp.z, 6 * upm);
      if (g1 && g1.ny > 0.85) {
        const sz = clamp5(Math.min(w * 0.8, height * 0.9), 1 * upm, 1.8 * upm);
        addItem(props.floater({ x: g1.x, y: g1.y, z: g1.z }, 0.05 * upm, sz), "floater", { hitR: Math.max(sz * 0.7, w * 0.45), cooldown: cd });
        st.floors++;
        continue;
      }
      const g = props.goalZone(c, n, w * 0.94, height * 0.94);
      const vol = { c: { x: c.x - n.x * depth * 0.5, y: c.y, z: c.z - n.z * depth * 0.5 }, n, t, hw: w / 2, hh: height / 2, hd: depth / 2 + 0.05 };
      addItem(g, "zone", { hitR: Math.max(w, height) / 2, vol, cooldown: cd });
      st.zones = (st.zones || 0) + 1;
    }
  }
  function spawnBoards(s, count, level, feet, H) {
    const u = upm, ref = balls[0] ? ballCenter(balls[0]) : feet;
    const o0 = { x: ref.x, y: (level.ground(ref.x, ref.y + 2, ref.z, 6)?.y ?? feet.y) + 0.55 * u, z: ref.z };
    const goal = findGoal();
    const gc = goal ? boundsOf(goal).c : null;
    const near = (p) => gc && distXZ(p, gc) < 5 * u;
    const hits = [];
    for (let a = 0; a < 360; a += 4) {
      const r4 = a * Math.PI / 180, h = level.raycast(o0.x, o0.y, o0.z, Math.sin(r4), 0, -Math.cos(r4), 60 * u);
      if (!h || Math.abs(h.ny) > 0.3 || h.t < 3 * u || near(h)) continue;
      hits.push({ p: { x: h.x + h.nx * 0.04 * u, y: h.y, z: h.z + h.nz * 0.04 * u }, n: { x: h.nx, y: 0, z: h.nz }, d: h.t });
    }
    hits.sort((a, b) => a.d - b.d);
    const picked = pickSpread(hits, count, Math.max(4 * u, 2 * Math.PI * 12 * u / Math.max(4, count * 1.5)));
    const dM = clamp5(0.5 * H, 0.6, 1) * u, cd = cooldownOf(s, 0);
    for (const w of picked) {
      const d2 = sizing.wallSize ? Math.max(dM, Math.min(1.6 * u, sizing.wallSize(w.p))) : dM;
      const q = { x: w.p.x + w.n.x * 1.5 * u, z: w.p.z + w.n.z * 1.5 * u };
      const g0 = level.ground(q.x, w.p.y + 2 * u, q.z, 6 * u);
      if (g0 && g0.ny > 0.85) {
        const sz = Math.max(1.1 * u, d2 * 1.1);
        addItem(props.floater({ x: g0.x, y: g0.y, z: g0.z }, 0.05 * u, sz), "floater", { hitR: sz * 0.7, cooldown: cd });
        st.floors++;
      } else {
        addItem(props.wallTarget(w.p, w.n, d2, viewRef.eye), "wall", { hitR: d2 * 0.62, cooldown: cd });
        st.walls++;
      }
    }
  }
  const ballCenter = (b) => {
    const p = worldPos(b.root, {});
    return { x: p.x + b.off.x, y: p.y + b.off.y, z: p.z + b.off.z };
  };
  function scanBalls() {
    if (!ballMatch) return;
    scene.traverse((x) => {
      if (!x.isMesh || isOurs(x)) return;
      const r4 = ballMatch(x);
      if (!r4 || balls.some((b) => b.root === r4)) return;
      const rp = worldPos(r4, {}), g = x.geometry;
      try {
        if (!g.boundingSphere) g.computeBoundingSphere?.();
      } catch {
      }
      const bc = g.boundingSphere?.center || { x: 0, y: 0, z: 0 }, e = x.matrixWorld.elements;
      const c = { x: e[0] * bc.x + e[4] * bc.y + e[8] * bc.z + e[12], y: e[1] * bc.x + e[5] * bc.y + e[9] * bc.z + e[13], z: e[2] * bc.x + e[6] * bc.y + e[10] * bc.z + e[14] };
      balls.push({ root: r4, off: { x: c.x - rp.x, y: c.y - rp.y, z: c.z - rp.z }, r: geomRadius(g) * worldScale(x), prev: null });
    });
    st.balls = balls.length;
  }
  function ballSegments() {
    const out = [];
    for (const b of balls) {
      if (!under(b.root, scene) || !shown(b.root)) {
        b.prev = null;
        continue;
      }
      const p = ballCenter(b);
      if (b.prev) {
        const d = dist(p, b.prev);
        if (d > 1e-4 && d < 8 * upm) out.push({ a: b.prev, b: p, r: b.r, o: b.root });
      }
      b.prev = p;
    }
    return out;
  }
  function segHitsVol(a, b, r4, v) {
    const up = { x: 0, y: 1, z: 0 };
    let t0 = 0, t1 = 1;
    for (const [ax, h] of [[v.t, v.hw + r4], [up, v.hh + r4], [v.n, v.hd + r4]]) {
      const pa = (a.x - v.c.x) * ax.x + (a.y - v.c.y) * ax.y + (a.z - v.c.z) * ax.z;
      const pb = (b.x - v.c.x) * ax.x + (b.y - v.c.y) * ax.y + (b.z - v.c.z) * ax.z;
      const d = pb - pa;
      if (Math.abs(d) < 1e-9) {
        if (Math.abs(pa) > h) return false;
        continue;
      }
      let ta = (-h - pa) / d, tb = (h - pa) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) return false;
    }
    return true;
  }
  function spawnFromServer(meas) {
    const itemH = (interaction === "player-touch" ? 0.6 * meas.H : clamp5(m.round.collectible.heightM || 0.6, 0.3 * meas.H, 0.6 * meas.H)) * upm;
    const lift = clamp5(num3(spec.spawn?.find?.((s) => s.asset === "collectible")?.heightM, 0.2 * meas.H), 0, 3 * meas.H) * upm;
    o.items.forEach((s, i) => {
      if (s.host) {
        items.push({ i, kind: "host", our: null, gone: false, pending: true, at: { x: s.x, y: s.y, z: s.z }, hitR: Math.max(itemH * 0.6, 1.05 * upm) });
        return;
      }
      const g = props.floater({ x: s.x, y: s.y, z: s.z }, lift, itemH);
      root.add(g);
      items.push({ i, kind: "floater", our: g, gone: false, hitR: itemH * 0.62 });
    });
    st.spawned = items.filter((x) => x.our).length;
  }
  const matchers = (spec.reskin || []).map((r4) => ({ match: entityMatcher(r4.entityMatch, hooks, scene), look: r4.look || "" })).filter((x) => x.match);
  function tintOf(mat, mesh) {
    const key = mat;
    if (tintCache.has(key)) return tintCache.get(key);
    let c = null;
    try {
      c = mat.clone();
      c.color?.set?.(pal.accent);
      if (c.emissive) {
        c.emissive.set(pal.primary);
        c.emissiveIntensity = 0.15;
      }
      if (mesh.geometry?.attributes?.uv && "map" in c) {
        const tex = adapter.texture(props.printTexture());
        if (tex) {
          c.map = tex;
          c.color?.set?.("#ffffff");
        }
      }
      c.needsUpdate = true;
    } catch (e) {
      log2(`reskin tint: ${e.message}`);
      c = null;
    }
    tintCache.set(key, c);
    return c;
  }
  const hiddenCache = /* @__PURE__ */ new Map();
  function invisibleOf(mat) {
    if (hiddenCache.has(mat)) return hiddenCache.get(mat);
    let c = null;
    try {
      c = mat.clone();
      c.visible = false;
    } catch {
      c = null;
    }
    hiddenCache.set(mat, c);
    return c;
  }
  function swapMaterial(mesh, fn) {
    const orig = mesh.material;
    const next = Array.isArray(orig) ? orig.map(fn) : fn(orig);
    if (Array.isArray(next) ? next.some((x) => !x) : !next) return false;
    mesh.material = next;
    undo.push(() => {
      if (mesh.material === next) mesh.material = orig;
    });
    return true;
  }
  function boundsOf(root2) {
    const ms = [];
    root2.traverse((x) => {
      if (x.isMesh && !isOurs(x) && x.geometry) ms.push(x);
    });
    if (!ms.length) return { c: worldPos(root2), r: 0, meshes: ms };
    const cs = ms.map((x) => {
      const g = x.geometry;
      try {
        if (!g.boundingSphere) g.computeBoundingSphere?.();
      } catch {
      }
      const bc = g.boundingSphere?.center || { x: 0, y: 0, z: 0 }, e = x.matrixWorld.elements;
      return { x: e[0] * bc.x + e[4] * bc.y + e[8] * bc.z + e[12], y: e[1] * bc.x + e[5] * bc.y + e[9] * bc.z + e[13], z: e[2] * bc.x + e[6] * bc.y + e[10] * bc.z + e[14], r: geomRadius(g) * worldScale(x) };
    });
    const c = { x: 0, y: 0, z: 0 };
    for (const q of cs) {
      c.x += q.x / cs.length;
      c.y += q.y / cs.length;
      c.z += q.z / cs.length;
    }
    const r4 = Math.max(...cs.map((q) => dist(q, c) + q.r));
    return { c, r: r4, meshes: ms };
  }
  function reskin(root2, look, byName, over = null) {
    if (entities.has(root2)) return;
    try {
      root2.updateWorldMatrix ? root2.updateWorldMatrix(true, true) : root2.updateMatrixWorld?.(true);
    } catch {
    }
    const proj = !!root2.isMesh && isProjectile(root2);
    const b = boundsOf(root2);
    if (!b.meshes.length) return;
    const gSize = root2.isMesh ? geomRadius(root2.geometry) * 2 * (root2.scale?.x || 1) : 0;
    const wSize = b.r * 2;
    const size0 = Math.max(gSize, wSize);
    const pickup = !proj && size0 < 1.6 * upm && root2.parent;
    const rp = worldPos(root2, {});
    const ent = { mesh: root2, root: root2, dress: null, item: null, proj, off: { x: b.c.x - rp.x, y: b.c.y - rp.y, z: b.c.z - rp.z } };
    const ballMesh = ballMatch && b.meshes.find((x) => ballMatch(x));
    if (ballMesh) {
      const our = props.ballSkin(geomRadius(ballMesh.geometry));
      const h = adapter.add(our, ballMesh);
      if (!h) return;
      ent.dress = { our, h, skin: true };
      undo.push(() => adapter.remove(h));
      entities.set(root2, ent);
      st.reskinned++;
      return;
    }
    if (pickup && over === "hide") {
      for (const x of b.meshes) swapMaterial(x, invisibleOf);
      entities.set(root2, { ...ent, hiddenCap: true });
      return;
    }
    if (pickup) {
      for (const x of b.meshes) swapMaterial(x, invisibleOf);
      const size = Math.max(size0 * 1.3, 0.3 * upm, interaction === "player-touch" ? clamp5(0.5 * measure().H, 0.45, 1.6) * upm : 0);
      const our = selfLit(props.dress(size));
      let parent;
      if (byName || !root2.isMesh) {
        parent = root2;
        const ws = worldScale(root2) || 1;
        our.scale.multiplyScalar(1 / ws);
        let local = { x: 0, y: 0, z: 0 };
        try {
          const v = root2.position.clone();
          v.set(b.c.x, b.c.y, b.c.z);
          root2.worldToLocal(v);
          local = { x: v.x, y: v.y, z: v.z };
        } catch {
        }
        our.position.set(local.x, local.y - size * 0.5 / ws, local.z);
      } else {
        parent = root2.parent;
        our.position.set(root2.position.x, root2.position.y - size * 0.5, root2.position.z);
        for (const sib of parent.children) {
          if (sib === root2 || isOurs(sib) || entities.has(sib)) continue;
          const sm = sib.material;
          if (!sm || Array.isArray(sm) || !(sib.isSprite || sm.blending === 2 || sm.transparent && sm.depthWrite === false)) continue;
          swapMaterial(sib, (m0) => {
            try {
              const c = m0.clone();
              c.color?.set?.(pal.secondary);
              c.needsUpdate = true;
              return c;
            } catch {
              return null;
            }
          });
        }
      }
      const h = adapter.add(our, parent);
      if (h) {
        ent.dress = { our, h };
        undo.push(() => adapter.remove(h));
      }
    } else {
      let any = false;
      for (const x of b.meshes) any = swapMaterial(x, (m0) => tintOf(m0, x)) || any;
      if (!any) return;
      if (/flank|beside each|next to each|either side/i.test(String(look || ""))) {
        const dressed = [];
        for (const x of b.meshes.slice(0, 32)) {
          if (!x.parent) continue;
          try {
            x.geometry.computeBoundingBox?.();
          } catch {
          }
          const gb = x.geometry?.boundingBox, ws = worldScale(x) || 1;
          const hM = gb ? (gb.max.y - gb.min.y) * ws : 2 * upm;
          const size = clamp5(hM * 0.75, 1.6 * upm, 4.5 * upm);
          const our = selfLit(props.dress(size));
          const ps = worldScale(x.parent) || 1;
          our.scale.multiplyScalar(1 / ps);
          our.position.set(x.position.x, x.position.y + (gb ? gb.min.y * (x.scale?.y || 1) : 0), x.position.z);
          const h2 = adapter.add(our, x.parent);
          if (h2) {
            dressed.push({ our, h: h2 });
            undo.push(() => adapter.remove(h2));
          }
        }
        if (dressed.length) {
          ent.flanks = dressed;
          st.flanked = (st.flanked || 0) + dressed.length;
        }
      }
    }
    entities.set(root2, ent);
    st.reskinned++;
    const cosmetic = isCosmeticLook(look) || over === "cosmetic";
    if (!o.items && !proj && !cosmetic && interaction !== "drive-through") {
      const it = { i: items.length, kind: "host", our: null, entity: ent, gone: false, hitR: size0 * 0.6 + 0.1 * upm, wasShown: shown(root2), latent: !shown(root2) };
      items.push(it);
      ent.item = it;
    }
  }
  const isCosmeticLook = (look) => /not scored|cosmetic|decorat|unscored|no points|aim guide/i.test(String(look || ""));
  const plannedSpawns = (Array.isArray(spec.spawn) ? spec.spawn : []).filter((x) => x?.asset !== "hero").reduce((a, x) => a + clamp5(Math.round(num3(x.count, 0)), 0, 24), 0);
  const designedCap = Number.isFinite(+m.round.itemCount) && +m.round.itemCount > 0 ? Math.max(0, Math.round(+m.round.itemCount) - plannedSpawns) : Infinity;
  let reskinCap = designedCap, capFixed = false;
  const scoreableReskins = () => {
    let k = 0;
    for (const e of entities.values()) if (e.item && !e.item.cosmetic && !e.item.latent) k++;
    return k;
  };
  function scanReskin() {
    if (!matchers.length) return;
    const cand = [];
    scene.traverse((x) => {
      if (!x.isMesh || isOurs(x) || player?.root && under(x, player.root)) return;
      for (let p = x; p; p = p.parent) if (entities.has(p)) return;
      for (const mt of matchers) {
        const root2 = mt.match(x);
        if (root2 && !isOurs(root2) && !(player?.root && (under(root2, player.root) || under(player.root, root2)))) {
          if (!cand.some((c) => c.root === root2)) cand.push({ root: root2, mt });
          break;
        }
      }
    });
    const f = player?.feet?.() || viewRef.feet || worldPos(camera, {});
    const H0 = measure().H * upm;
    const d = (r4) => {
      const q = worldPos(r4, {});
      return Math.hypot(q.x - f.x, (q.y - f.y) * 2.5, q.z - f.z) + (Math.abs(q.y - f.y) > 2.5 * H0 ? 1e3 : 0);
    };
    if (!viewRef.route && player?.feet) {
      try {
        const f0 = player.feet(), e0 = camera.matrixWorld.elements;
        if (f0) viewRef.route = [f0, ...pathAhead(findPath(scene), f0, { x: -e0[8], z: -e0[10] }).map((c) => c.p)];
      } catch {
      }
    }
    const route = viewRef.route?.length > 1 ? viewRef.route : null;
    const dRoute = (r4) => {
      if (!route) return d(r4);
      const q = worldPos(r4, {});
      let best = Infinity;
      for (let k = 1; k < route.length; k++) best = Math.min(best, segPointDist(route[k - 1], route[k], q));
      return best * 1.5 + d(r4) * 0.25;
    };
    cand.sort((a, b) => dRoute(a.root) - dRoute(b.root));
    if (!capFixed && interaction === "player-touch" && route) {
      capFixed = true;
      const near = cand.filter(({ root: root2, mt }) => !isCosmeticLook(mt.look) && shown(root2) && (() => {
        const q = worldPos(root2, {});
        let best = Infinity;
        for (let k = 1; k < route.length; k++) best = Math.min(best, segPointDist(route[k - 1], route[k], q));
        return best < 6 * upm;
      })()).length;
      reskinCap = Math.max(designedCap === Infinity ? 0 : designedCap, Math.min(near, 40));
      st.routeGems = near;
    }
    let left = reskinCap - scoreableReskins(), skipped = 0;
    for (const { root: root2, mt } of cand) {
      const cos = isCosmeticLook(mt.look) || !!root2.isMesh && isProjectile(root2);
      if (!cos && left <= 0 && shown(root2)) {
        skipped++;
        const bq = boundsOf(root2);
        reskin(root2, mt.look, mt.match.byName, bq.meshes.length && bq.r * 2 < 1.6 * upm ? "hide" : "cosmetic");
        continue;
      }
      const before = entities.has(root2);
      reskin(root2, mt.look, mt.match.byName);
      if (!cos && !before && entities.get(root2)?.item && !entities.get(root2).item.cosmetic && !entities.get(root2).item.latent) left--;
    }
    if (reskinCap !== Infinity) {
      let hid = 0;
      for (const e of entities.values()) if (e.hiddenCap) hid++;
      st.reskin = { cap: reskinCap, scoreable: scoreableReskins(), hiddenPastCap: hid, cappedThisScan: skipped };
    }
    for (const it of items) {
      if (!it.pending) continue;
      let best = null, bd = 1.2 * upm;
      for (const ent of entities.values()) {
        if (ent.bound || ent.proj) continue;
        const p = worldPos(ent.mesh), d2 = distXZ(p, it.at);
        if (d2 < bd) {
          bd = d2;
          best = ent;
        }
      }
      if (!best) best = bindHostAt(it);
      if (best) {
        best.bound = it;
        it.entity = best;
        it.pending = false;
        if (it.gone) hideEntity(best);
      }
    }
  }
  const scoredLook = () => (matchers.find((x) => !isCosmeticLook(x.look)) || matchers[0])?.look || "";
  function bindHostAt(it) {
    if (!it.at) return null;
    let best = null, bd = 0.8 * upm;
    scene.traverse((x) => {
      if (!x.isMesh || isOurs(x) || player?.root && under(x, player.root) || x.isInstancedMesh) return;
      const r4 = geomRadius(x.geometry) * worldScale(x);
      if (!(r4 > 0.05 * upm && r4 < 0.8 * upm)) return;
      const p = worldPos(x, {});
      const d = distXZ(p, it.at);
      if (d < bd && Math.abs(p.y - (it.at.y ?? p.y)) < 2.5 * upm) {
        bd = d;
        best = x;
      }
    });
    if (!best) return null;
    let root0 = best;
    for (const e of entities.values()) if (e.root === best || under(best, e.root)) return e.bound ? null : e;
    const par = best.parent;
    if (par && !par.isScene && par.children.length <= 4 && boundsOf(par).r * 2 < 1.6 * upm) root0 = par;
    reskin(root0, scoredLook(), true);
    const ent = entities.get(root0);
    if (ent) {
      st.boundAtSpot = (st.boundAtSpot || 0) + 1;
      if (ent.item) {
        const k = items.indexOf(ent.item);
        if (k >= 0) items.splice(k, 1);
        ent.item = null;
      }
    }
    return ent || null;
  }
  function demoteProjectile(ent) {
    for (const e of entities.values()) {
      if (e.proj || e.mesh.geometry !== ent.mesh.geometry) continue;
      e.proj = true;
      if (e.item && !e.item.gone) {
        e.item.gone = true;
        e.item.cosmetic = true;
      }
    }
  }
  function hideEntity(ent) {
    if (ent.hidden) return;
    ent.hidden = true;
    if (ent.dress) ent.dress.our.visible = false;
  }
  const tmp = { x: 0, y: 0, z: 0 };
  function hit(it, how) {
    const now2 = performance.now();
    if (it.rearm) {
      if (it.down) return;
      it.down = true;
      it.rearmAt = now2 + it.cooldown * 1e3;
      if (o.claim(it.i, { repeat: true })) st.hits++;
      return;
    }
    if (it.cooldown) {
      if (it.lastHit && now2 - it.lastHit < it.cooldown * 1e3) return;
      it.lastHit = now2;
      if (o.claim(it.i, { repeat: true })) st.hits++;
      return;
    }
    if (it.gone || it.claiming && now2 - it.claiming < 800) return;
    it.claiming = now2;
    if (o.claim(it.i)) {
      if (how === "projectile") st.hits++;
      else if (how === "touch") st.touches++;
      else if (how === "gate") st.gatesPassed = (st.gatesPassed || 0) + 1;
    }
  }
  const fastPlayer = () => world.cameraMode === "vehicle" || (+world.movement?.walkTopSpeedMps || +world.scale?.walkSpeedMps || 0) > 14;
  function interact(dt, phase) {
    if (ballMode) {
      const present = balls.some((b) => under(b.root, scene));
      if (!present) {
        balls.length = 0;
        scanBalls();
      }
      if (!balls.length) {
        if (phase === "playing" && (ballMissingT += dt) > 2) fail("no_projectiles");
        return;
      }
      ballMissingT = 0;
      for (const s of ballSegments()) {
        st.ballM = (st.ballM || 0) + dist(s.a, s.b);
        for (const it of items) {
          if (it.gone || it.pending || it.down || it.kind === "gate") continue;
          if (it.vol) {
            if (segHitsVol(s.a, s.b, s.r, it.vol)) hit(it, "projectile");
            continue;
          }
          centerOf(it, tmp);
          if (segPointDist(s.a, s.b, tmp) < it.hitR + s.r) hit(it, "projectile");
        }
      }
      return;
    }
    if (interaction === "projectile-hit") {
      const segs = tracker2.update(dt);
      for (const s of segs) {
        const ent = entities.get(s.o);
        if (ent && !ent.proj) demoteProjectile(ent);
        if (ent?.item && !ent.item.cosmetic) continue;
        for (const it of items) {
          if (it.gone || it.pending || it.down || it.kind === "gate") continue;
          centerOf(it, tmp);
          if (segPointDist(s.a, s.b, tmp) < it.hitR + s.r) hit(it, "projectile");
        }
      }
      const ts = tracker2.stats;
      if (!ts.confirmed && ts.fires >= 2 && performance.now() - ts.lastFire > 1400 && elapsed < 10) fail("no_projectiles");
      return;
    }
    const feet = player.feet();
    if (!feet) return;
    const H = measure().H * upm;
    if (interaction === "drive-through") {
      const gates = items.filter((x) => x.kind === "gate").sort((a, b) => a.order - b.order);
      const cand = gates.filter((x) => !x.gone);
      for (const g of cand) if (prevFeet) {
        const q = g.our, ry = q.rotation.y, c = Math.cos(ry), s = Math.sin(ry);
        const loc = (p) => {
          const dx = p.x - q.position.x, dz = p.z - q.position.z;
          return { x: dx * c - dz * s, z: dx * s + dz * c };
        };
        const a = loc(prevFeet), b = loc(feet);
        if (a.z < 0 !== b.z < 0 || Math.abs(b.z) < 0.3 * upm) {
          const t = Math.abs(a.z) / (Math.abs(a.z - b.z) || 1), x = a.x + (b.x - a.x) * t;
          if (Math.abs(x) < g.hitR + 0.4 * upm && feet.y > q.position.y - H && feet.y < q.position.y + q.userData.h && distXZ(feet, q.position) < 12 * upm) hit(g, "gate");
        }
      }
      prevFeet = { ...feet };
      nextGate = gates.find((x) => !x.gone)?.order ?? gates.length;
      if (!o.focus) return;
    }
    for (const it of items) {
      if (it.gone || it.pending && !it.at || it.down || it.kind === "gate") continue;
      centerOf(it, tmp);
      const r4 = Math.max(0.9 * upm, it.reachR || 0, it.hitR + num3(hooks.player?.radiusM, fastPlayer() || o.live ? 2.2 : 0.4) * upm);
      const near = distXZ(feet, tmp) < r4 && tmp.y > feet.y - 0.6 * H && tmp.y < feet.y + 1.4 * H;
      if (it.entity) {
        const vis = shown(it.entity.root) && under(it.entity.root, scene);
        if (!vis) {
          if (it.wasShown && distXZ(feet, tmp) < 3 * upm) hit(it, "touch");
          it.wasShown = false;
          continue;
        }
        it.wasShown = true;
        it.latent = false;
      }
      if (near) hit(it, "touch");
    }
  }
  function* buildSteps() {
    root = new T.Group();
    root.name = "br:inworld";
    const meas = measure();
    player = findPlayer({ scene, camera, host: o.host, hooks, world, upm, noNames: world.__testNoPlayerNames === true });
    st.player = player.via;
    let reason = null;
    if (o.items) {
      spawnFromServer(meas);
      if ((spec.spawn || []).some((x) => x?.asset === "hero")) {
        try {
          levelRef = new Level(scene, { exclude: (x) => isOurs(x) || player.root && under(x, player.root) || under(x, camera), minRadius: 0.25 * upm });
          const eye = worldPos(camera, {}), feet = player.feet(), u = upm, H = meas.H;
          viewRef.eye = eye;
          viewRef.feet = feet;
          const tanHalf = Math.tan((Number.isFinite(camera.fov) ? camera.fov : 60) * Math.PI / 360);
          spawnHero({ level: levelRef, eye, feet, H, u, course: [], road: null, speed: 0, tanHalf, viewH: (p) => 2 * tanHalf * dist(eye, p) });
        } catch (e) {
          log2(`hero: ${e.message}`);
        }
      }
    } else {
      try {
        scanBalls();
        ballMode = balls.length > 0;
        scanReskin();
      } catch (e) {
        log2(`reskin: ${e.message}`);
      }
      yield;
      reason = spawnLocal(meas);
    }
    yield;
    bursts = props.bursts(60, upm);
    root.add(bursts.root);
    flashes = props.flashes(upm);
    root.add(flashes.root);
    if (full && !reason) {
      yield;
      try {
        if (!levelRef) levelRef = new Level(scene, { exclude: (x) => isOurs(x) || player.root && under(x, player.root) || under(x, camera), minRadius: 0.25 * upm });
        const eye = viewRef.eye || worldPos(camera, {}), feet = viewRef.feet || player.feet();
        const avoid = items.filter((x) => x.our).map((x) => ({ x: x.our.position.x, y: x.our.position.y, z: x.our.position.z, r: (x.hitR || 1) + 0.5 * upm }));
        if (heroPos) avoid.push({ ...heroPos, r: (hero?.userData.h || 3) * 0.7 });
        const keep = (x) => {
          if (player.root && under(x, player.root)) return true;
          if (under(x, camera)) return true;
          for (let p = x; p; p = p.parent) if (entities.has(p)) return true;
          return false;
        };
        world2 = createWorldTakeover({
          T,
          adapter,
          scene,
          camera,
          m,
          pal,
          logoImg: o.logoImg,
          productImg: o.productImg,
          level: levelRef,
          eye,
          feet,
          upm,
          H: meas.H,
          isOurs,
          keep,
          root,
          heroPos: hero ? worldPos(hero, {}) : null,
          heroH: hero?.userData.h || 0,
          avoid,
          strength: spec.takeoverStrength ?? m.round.takeover?.strength,
          log: log2,
          focus: o.focus || null,
          textures: o.textures || null
        });
        st.takeover = world2.stats;
        if (interaction === "player-touch" && !o.focus) {
          try {
            placePathBoards();
          } catch (e) {
            log2(`path boards: ${e.message}`);
          }
        }
      } catch (e) {
        log2(`takeover: ${e.message}`);
        world2 = null;
      }
    }
    yield;
    rootHost = adapter.add(root, scene);
    if (!rootHost) reason || (reason = "host_classes");
    else undo.push(() => adapter.remove(rootHost));
    if (world2) undo.push(() => {
      world2.dispose();
      st.restoreCheck = world2.verifyRestore();
    });
    if (interaction === "projectile-hit" && !ballMode) {
      tracker2 = createProjectileTracker({ scene, camera, hooks, isOurs, exclude: (x) => !!(player.root && under(x, player.root)), upm, prefer: ballMatch ? (x) => !!ballMatch(x) : null });
      undo.push(() => tracker2.dispose());
    }
    scanReskin();
    mood = createMood(T, scene, pal, full ? { ...m.round.takeover, moodSpec: {
      lightTint: "#" + new T.Color(pal.primary).lerp(new T.Color("#ffffff"), 0.45).getHexString(),
      lightAmount: 0.4,
      fogTint: "#" + new T.Color(pal.primary).lerp(new T.Color(pal.background), 0.18).getHexString(),
      fogAmount: 0.8,
      vignette: m.round.takeover?.moodSpec?.vignette
    } } : m.round.takeover);
    undo.push(() => mood.restore());
    built = true;
    if (reason) {
      failed = reason;
      return { ok: false, reason };
    }
    log2(`in-world: ${interaction}, ${st.spawned} spawned (${st.walls} walls, ${st.floors} floors, ${st.gates} gates), ${st.reskinned} reskinned, player via ${st.player}`);
    return { ok: true };
  }
  return {
    stats: st,
    get failed() {
      return failed;
    },
    get interaction() {
      return interaction;
    },
    get items() {
      return items;
    },
    /** → { ok, reason? } */
    build() {
      const it = buildSteps();
      let r4 = it.next();
      while (!r4.done) r4 = it.next();
      return r4.value;
    },
    /** the same build in stages, one frame apart (next() → Promise, e.g. the next animation frame), so a big level never
     *  stalls a frame: nothing of ours is drawn until the runner shows it (sdk/inworld/round.js warmOurs). → { ok, reason? } */
    async buildAsync(next) {
      const it = buildSteps();
      let r4 = it.next();
      while (!r4.done) {
        await next();
        if (failed === "disposed") {
          it.return();
          return { ok: false, reason: "disposed" };
        }
        r4 = it.next();
      }
      return r4.value;
    },
    /** dt in seconds; phase: 'intro' | 'playing' | 'leaderboard' */
    update(dt, phase = "playing") {
      if (!built || failed === "disposed") return;
      elapsed += dt;
      st.player = player.via;
      st.playerRoot = player.root ? player.root.name || `(unnamed ${player.root.type} in ${player.root.parent?.name || "scene"})` : null;
      if ((scanT -= dt) <= 0) {
        scanT = 0.3;
        try {
          scanReskin();
        } catch (e) {
          log2(`reskin: ${e.message}`);
        }
      }
      for (const it of items) if (it.our && it.our.visible) props.animate(it.our, dt);
      props.pulse(elapsed);
      if (hero) {
        const d = hero.userData;
        d.t += dt;
        d.hero.update(dt);
        if (d.idle) {
          hero.children[0].position.y = Math.sin(d.t * 1.4) * d.h * 0.03;
          hero.children[0].rotation.y = Math.sin(d.t * 0.5) * 0.35;
        }
        if (d.halo) {
          const cp = worldPos(camera, {});
          const hp = worldPos(hero, {});
          d.halo.rotation.y = Math.atan2(cp.x - hp.x, cp.z - hp.z) - hero.rotation.y;
          d.halo.material.opacity = 0.6 + Math.sin(d.t * 2) * 0.15;
        }
      }
      try {
        respawnTick();
      } catch (e) {
        log2(`respawn: ${e.message}`);
      }
      if (phase === "playing") {
        try {
          followTick(dt);
          boardTick(dt);
        } catch (e) {
          log2(`follow: ${e.message}`);
        }
      }
      if (world2) {
        world2.direction = phase === "exit" ? "out" : "in";
        try {
          world2.update(dt);
        } catch (e) {
          log2(`takeover: ${e.message}`);
        }
      }
      flashes.update(dt, worldPos(camera, {}));
      for (const ent of entities.values()) if (ent.dress && !ent.hidden) ent.dress.our.rotation.y += dt * 1.2;
      bursts.update(dt);
      mood.set(phase === "exit" || !full && phase === "leaderboard" ? Math.max(0, mood.k - dt * 1.7) : Math.min(1, mood.k + dt * 1.7));
      if (phase !== "leaderboard" && phase !== "exit" && !failed) interact(dt, phase);
      else if (tracker2) tracker2.update(dt);
      adapter.sync();
    },
    /** claim i confirmed (mine: by the local player). Exclusive items disappear for everyone; personal ones only for me. */
    claimed(i, mine) {
      const it = items[i];
      if (!it || it.gone) return;
      if (o.claimMode === "personal" && !mine) return;
      it.gone = true;
      centerOf(it, tmp);
      bursts.emit(tmp, mine ? 26 : 12, Math.max(1, (it.hitR || 0.5) / 0.6));
      if (mine && it.kind !== "gate") flashes.emit(tmp, (it.hitR || 0.5) * 2.4);
      if (it.our) {
        if (it.kind === "gate") it.our.userData.done = true;
        else props.pop(it.our);
      }
      if (it.entity) hideEntity(it.entity);
    },
    /** world-space centres of what's still live (viewability, bots, debug) */
    live() {
      return items.filter((x) => !x.gone && !x.pending && !x.down).map((x) => ({ i: x.i, kind: x.kind, ...centerOf(x, {}) }));
    },
    projectiles() {
      return tracker2 ? { ...tracker2.stats, preferMatch: !!ballMatch } : ballMode ? { ball: true, tracked: balls.length, travelledM: +(st.ballM || 0).toFixed(1) } : null;
    },
    /** a repeatable zone scored again: flash + burst, it stays up */
    scoredAgain(i) {
      const it = items[i];
      if (!it) return;
      centerOf(it, tmp);
      bursts.emit(tmp, 26, Math.max(1, (it.hitR || 0.5) / 0.6));
      flashes.emit(tmp, Math.min(2.5 * upm, (it.hitR || 0.5) * 2.2));
      if (it.rearm) props.pop(it.our);
      else if (it.our?.userData) it.our.userData.flash = 1;
    },
    nextGate: () => nextGate,
    /** full takeover: logo carriers on screen now ([{ kind, frac }]), and its stats */
    logosInView: () => {
      if (!world2) return [];
      const extra = [];
      for (const it of items) if (it.our && !it.gone && !it.down && it.our.visible && ["wall", "zone", "gate"].includes(it.kind)) extra.push({ obj: it.our, size: it.kind === "gate" ? it.our.userData.w / 8 : it.kind === "zone" ? it.our.userData.h : it.our.userData.base, kind: it.kind });
      if (hero) extra.push({ obj: hero, size: hero.userData.h * 0.4, kind: "hero", y: hero.userData.h * 0.5 });
      return world2.logosInView(extra);
    },
    takeover: () => world2 ? { ...world2.stats, k: +world2.k.toFixed(2) } : null,
    /** QA: the hero landmark as rendered — its model's world bbox (no halo / ring), the share of the view height it fills,
     *  whether it's in frame, and its distance; plus the extra U-turn landmarks */
    heroView: () => {
      const one = (g) => {
        if (!g) return null;
        try {
          root.updateMatrixWorld(true);
          const bb = new T.Box3();
          g.userData.hero?.root?.traverse?.((x) => {
            if (x.isMesh && x.geometry) {
              x.geometry.computeBoundingBox?.();
              const b = x.geometry.boundingBox.clone().applyMatrix4(x.matrixWorld);
              bb.union(b);
            }
          });
          if (bb.isEmpty()) return null;
          const cam = camera, e = cam.matrixWorld.elements, ce = { x: e[12], y: e[13], z: e[14] };
          const V = new T.Matrix4().fromArray(cam.matrixWorldInverse.elements), P = new T.Matrix4().fromArray(cam.projectionMatrix.elements);
          let lo = { x: 9, y: 9 }, hi = { x: -9, y: -9 }, front = 0;
          for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
            const v = new T.Vector3(x, y, z).applyMatrix4(V);
            if (v.z < 0) front++;
            v.applyMatrix4(P);
            lo = { x: Math.min(lo.x, v.x), y: Math.min(lo.y, v.y) };
            hi = { x: Math.max(hi.x, v.x), y: Math.max(hi.y, v.y) };
          }
          const cx = clamp5(lo.x, -1, 1), cxx = clamp5(hi.x, -1, 1), cy = clamp5(lo.y, -1, 1), cyy = clamp5(hi.y, -1, 1);
          const onScreen = front === 8 ? Math.max(0, cxx - cx) * Math.max(0, cyy - cy) / 4 : 0;
          const c = bb.getCenter(new T.Vector3());
          return {
            heightM: +((bb.max.y - bb.min.y) / upm).toFixed(2),
            wantM: num3(m.round.hero?.heightM, null),
            viewFracH: front === 8 ? +((cyy - cy) / 2).toFixed(3) : 0,
            areaFrac: +onScreen.toFixed(3),
            inFrame: front === 8 && onScreen > 2e-3,
            distM: +(Math.hypot(c.x - ce.x, c.y - ce.y, c.z - ce.z) / upm).toFixed(1),
            pos: [c.x, bb.min.y, c.z].map((v) => +(v / upm).toFixed(1))
          };
        } catch (err) {
          return { err: String(err.message || err) };
        }
      };
      return { hero: one(hero), where: st.hero?.where || null, landmarks: landmarks.filter((x) => x !== hero).map(one) };
    },
    get full() {
      return full;
    },
    mood: () => mood?.spec || null,
    dispose() {
      failed = failed || "disposed";
      for (let k = undo.length - 1; k >= 0; k--) {
        try {
          undo[k]();
        } catch (e) {
          log2(`restore: ${e.message}`);
        }
      }
      undo.length = 0;
      try {
        for (const c of tintCache.values()) c?.dispose?.();
      } catch {
      }
      try {
        adapter.dispose();
      } catch {
      }
      try {
        props.dispose();
      } catch {
      }
      entities.clear();
      items.length = 0;
      built = false;
    }
  };
}
var clamp5, num3, INTERACTIONS, isInWorld, isOurs;
var init_session = __esm({
  "../../sdk/inworld/session.js"() {
    init_scan();
    init_props();
    init_builders();
    init_takeover();
    clamp5 = (v, a, b) => Math.max(a, Math.min(b, v));
    num3 = (v, d) => Number.isFinite(+v) && v !== null && v !== "" ? +v : d;
    INTERACTIONS = ["projectile-hit", "player-touch", "drive-through"];
    isInWorld = (m) => m?.round?.takeover?.mode === "in-world";
    isOurs = (o) => {
      for (let p = o; p; p = p.parent) if (p.userData?.__br || typeof p.name === "string" && p.name.startsWith("br:")) return true;
      return false;
    };
  }
});

// ../../sdk/three-shim.js
function threeShim(THREE) {
  if (shimUrl && shimFor === THREE) return shimUrl;
  globalThis.__BONUSROUND_THREE__ = THREE;
  const names = Object.keys(THREE).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && k !== "default");
  const src = `const T = globalThis.__BONUSROUND_THREE__;
${names.map((k) => `export const ${k} = T[${JSON.stringify(k)}];`).join("\n")}
export default T;
`;
  shimUrl = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  shimFor = THREE;
  return shimUrl;
}
async function rewrite(url, shim) {
  if (blobs.has(url)) return blobs.get(url);
  const p = (async () => {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    let src = await res.text();
    const specs = /* @__PURE__ */ new Set();
    const re = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])([^'"\n]+)\2/g;
    for (const m of src.matchAll(re)) specs.add(m[3]);
    const map = {};
    for (const s of specs) {
      if (s === "three") map[s] = shim;
      else if (s.startsWith(".") || s.startsWith("/")) map[s] = await rewrite(new URL(s, url).href, shim);
    }
    src = src.replace(re, (all, pre, q, s) => map[s] ? `${pre}${q}${map[s]}${q}` : all);
    return URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  })();
  blobs.set(url, p);
  return p;
}
async function importAddon(base, path, THREE) {
  const url = `${base}/vendor/three/examples/jsm/${path}`;
  return import(await rewrite(url, threeShim(THREE)));
}
function gltfLoaderFor(base, THREE) {
  let p = null;
  return () => p || (p = importAddon(base, "loaders/GLTFLoader.js", THREE).catch(() => import("three/addons/loaders/GLTFLoader.js")).then(({ GLTFLoader }) => new GLTFLoader()));
}
var blobs, shimUrl, shimFor;
var init_three_shim = __esm({
  "../../sdk/three-shim.js"() {
    blobs = /* @__PURE__ */ new Map();
    shimUrl = null;
    shimFor = null;
  }
});

// ../../sdk/host-three.js
function ourThree(base) {
  return ourP || (ourP = (async () => {
    const prev = window.__THREE__;
    try {
      delete window.__THREE__;
    } catch {
    }
    try {
      return await import(`${base}/vendor/three/build/three.module.js`);
    } finally {
      if (prev !== void 0) window.__THREE__ = prev;
    }
  })());
}
function hookRecords() {
  const h = window.__THREE_DEVTOOLS__;
  const r4 = h?.__bonusround || h?.records || null;
  return { scenes: [...r4?.scenes || h?.scenes || []], renderers: [...r4?.renderers || h?.renderers || []], revision: r4?.revision || window.__THREE__ || null };
}
function watchRenderer(renderer) {
  if (!renderer || typeof renderer.render !== "function") return null;
  if (renderer.__bonusroundWatch) return renderer.__bonusroundWatch;
  const counts = /* @__PURE__ */ new Map(), cbs = [];
  const orig = renderer.render;
  const w = {
    renderer,
    frames: 0,
    main() {
      const recent = [...counts].filter(([, v]) => v.last >= w.frames - 90);
      const list = (recent.length ? recent : [...counts]).filter(([, v]) => v.camera?.isPerspectiveCamera !== false);
      const top = Math.max(0, ...list.map(([, v]) => v.n));
      let best = null, size = -1;
      for (const [scene, v] of list) {
        if (v.n < top * 0.9) continue;
        let k = 0;
        scene.traverse?.((o) => {
          if (o.isMesh) k++;
        });
        if (k > size) {
          best = { scene, camera: v.camera };
          size = k;
        }
      }
      return best;
    },
    get _counts() {
      return [...counts].map(([s, v]) => ({ uuid: s.uuid.slice(0, 6), n: v.n, last: v.last, persp: v.camera?.isPerspectiveCamera, kids: s.children.length }));
    },
    onFrame(cb) {
      cbs.push(cb);
    },
    offFrame(cb) {
      const i = cbs.indexOf(cb);
      if (i >= 0) cbs.splice(i, 1);
    },
    unwrap() {
      if (renderer.render === wrapped) renderer.render = orig;
      delete renderer.__bonusroundWatch;
    }
  };
  function wrapped(scene, camera) {
    try {
      w.frames++;
      if (scene?.isScene) {
        const v = counts.get(scene) || { n: 0, camera };
        v.n++;
        v.camera = camera;
        v.last = w.frames;
        counts.set(scene, v);
        for (const cb of cbs) cb(scene, camera);
      }
    } catch {
    }
    return orig.apply(this, arguments);
  }
  renderer.render = wrapped;
  renderer.__bonusroundWatch = w;
  return w;
}
async function warmProp(renderer, obj, scene, camera, maxMs = 3e3) {
  if (!renderer || !obj) return;
  const w = watchRenderer(renderer);
  const cam = camera || w?.main()?.camera || null;
  const target = await new Promise((res) => {
    if (!w || !scene) return res(void 0);
    let done = false;
    const cb = (s) => {
      if (s !== scene || done) return;
      done = true;
      w.offFrame(cb);
      res(renderer.getRenderTarget?.() ?? null);
    };
    w.onFrame(cb);
    setTimeout(() => {
      if (!done) {
        done = true;
        w.offFrame(cb);
        res(void 0);
      }
    }, 600);
  });
  try {
    if (typeof renderer.compileAsync === "function" && cam) {
      const prev = renderer.getRenderTarget?.() ?? null, waits = [];
      for (const t of target ? [target, null] : [null]) {
        try {
          renderer.setRenderTarget?.(t);
          waits.push(renderer.compileAsync(obj, cam, scene || null).catch(() => {
          }));
        } catch {
        }
      }
      try {
        renderer.setRenderTarget?.(prev);
      } catch {
      }
      await Promise.race([Promise.all(waits), new Promise((r4) => setTimeout(r4, maxMs))]);
    }
  } catch {
  }
  if (typeof renderer.initTexture !== "function") return;
  const tex = /* @__PURE__ */ new Set();
  obj.traverse?.((x) => {
    for (const m of [x.material].flat()) if (m) {
      for (const v of Object.values(m)) if (v?.isTexture && !v.isRenderTargetTexture) tex.add(v);
    }
  });
  for (const t of tex) {
    try {
      if (typeof t.image?.decode === "function") await t.image.decode();
    } catch {
    }
    try {
      renderer.initTexture(t);
    } catch {
    }
    await new Promise((r4) => requestAnimationFrame(r4));
  }
}
function baseOfType(C, want) {
  for (const c of chain(C)) {
    const o = tryNew(c);
    if (o && o.type === want) return c;
  }
  return null;
}
function harvest(scene) {
  const K = { Object3D: Object.getPrototypeOf(scene.constructor) };
  if (!tryNew(K.Object3D)?.isObject3D) return null;
  const mats = /* @__PURE__ */ new Map();
  scene.traverse((o) => {
    if (o.isMesh && !K.Mesh) for (const c of chain(o.constructor)) {
      const t = tryNew(c);
      if (t?.isMesh && !t.isInstancedMesh && !t.isSkinnedMesh && !t.isBatchedMesh && Object.getPrototypeOf(t) === c.prototype && c.name !== "InstancedMesh") {
        K.Mesh = c;
        break;
      }
    }
    if (o.type === "Group" && !K.Group && o.isGroup) {
      const t = tryNew(o.constructor);
      if (t?.isGroup && t.children.length === 0) K.Group = o.constructor;
    }
    if (o.isMesh && o.geometry) {
      if (!K.BufferGeometry) K.BufferGeometry = baseOfType(o.geometry.constructor, "BufferGeometry");
      for (const a of Object.values(o.geometry.attributes || {})) {
        if (K.BufferAttribute || !a?.isBufferAttribute || a.isInterleavedBufferAttribute) continue;
        for (const c of chain(a.constructor)) {
          const t = tryNew(c, new Uint16Array([1, 2, 3]), 1);
          if (t?.isBufferAttribute && t.array instanceof Uint16Array) {
            K.BufferAttribute = c;
            break;
          }
        }
      }
      for (const m of [o.material].flat()) if (m?.isMaterial) mats.set(m.type, m.constructor);
      for (const m of [o.material].flat()) {
        const t = m?.map;
        if (t?.isTexture && !K.Texture) for (const c of chain(t.constructor)) {
          const x = tryNew(c);
          if (x?.isTexture && !x.isCompressedTexture && !x.isDataTexture && !x.isVideoTexture && x.type !== void 0) K.Texture = c;
        }
      }
    }
  });
  if (!K.Texture && scene.background?.isTexture) for (const c of chain(scene.background.constructor)) {
    const x = tryNew(c);
    if (x?.isTexture) K.Texture = c;
  }
  const std = mats.get("MeshStandardMaterial") || mats.get("MeshPhysicalMaterial") && baseOfType(mats.get("MeshPhysicalMaterial"), "MeshStandardMaterial");
  K.Lit = std || mats.get("MeshPhongMaterial") || mats.get("MeshLambertMaterial") || mats.get("MeshToonMaterial") || null;
  K.Basic = mats.get("MeshBasicMaterial") || null;
  K.Group || (K.Group = K.Object3D);
  if (!K.Mesh || !K.BufferGeometry || !K.BufferAttribute || !(K.Lit || K.Basic)) return null;
  return K;
}
function attrToHost(K, a) {
  let array = a.array, itemSize = a.itemSize;
  if (a.isInterleavedBufferAttribute) {
    array = new Float32Array(a.count * itemSize);
    const get = ["getX", "getY", "getZ", "getW"];
    for (let i = 0; i < a.count; i++) for (let k = 0; k < itemSize; k++) array[i * itemSize + k] = a[get[k]](i);
  } else array = array.slice();
  return new K.BufferAttribute(array, itemSize, !!a.normalized);
}
function setColorSpace(t, srgb) {
  if (!srgb) return;
  if ("colorSpace" in t) t.colorSpace = "srgb";
  else if ("encoding" in t) t.encoding = 3001;
}
function makeConverter(K) {
  const geos = /* @__PURE__ */ new Map(), mats = /* @__PURE__ */ new Map(), texs = /* @__PURE__ */ new Map(), pairs = [];
  const tex = (t) => {
    if (!t || !K.Texture || !t.image) return null;
    if (texs.has(t)) return texs.get(t);
    const h = new K.Texture(t.image);
    for (const k of ["wrapS", "wrapT", "flipY", "anisotropy", "rotation"]) if (k in h && k in t) h[k] = t[k];
    for (const k of ["repeat", "offset", "center"]) if (h[k]?.copy && t[k]) h[k].set(t[k].x, t[k].y);
    setColorSpace(h, t.colorSpace === "srgb");
    h.needsUpdate = true;
    texs.set(t, h);
    return h;
  };
  const geo = (g) => {
    if (geos.has(g)) return geos.get(g);
    const h = new K.BufferGeometry();
    const set = (n, a) => h.setAttribute ? h.setAttribute(n, a) : h.addAttribute(n, a);
    for (const name of ["position", "normal", "uv", "color"]) if (g.attributes[name]) set(name, attrToHost(K, g.attributes[name]));
    if (g.index) h.setIndex(attrToHost(K, g.index));
    for (const gr of g.groups || []) h.addGroup(gr.start, gr.count, gr.materialIndex);
    h.computeBoundingSphere?.();
    h.computeBoundingBox?.();
    geos.set(g, h);
    return h;
  };
  const mat = (m) => {
    if (mats.has(m)) return mats.get(m);
    const unlit = m.isMeshBasicMaterial;
    const C = unlit ? K.Basic || K.Lit : K.Lit || K.Basic;
    const h = new C();
    const copy = (k) => {
      if (k in h && m[k] !== void 0 && typeof m[k] !== "object") h[k] = m[k];
    };
    for (const k of ["opacity", "transparent", "side", "depthWrite", "depthTest", "blending", "alphaTest", "toneMapped", "flatShading", "vertexColors", "roughness", "metalness", "emissiveIntensity", "fog"]) copy(k);
    if (h.color && m.color) h.color.setRGB(m.color.r, m.color.g, m.color.b);
    if (h.emissive && m.emissive) h.emissive.setRGB(m.emissive.r, m.emissive.g, m.emissive.b);
    if ("map" in h) h.map = tex(m.map);
    if ("emissiveMap" in h && m.emissiveMap) h.emissiveMap = tex(m.emissiveMap);
    if ("normalMap" in h && m.normalMap) h.normalMap = tex(m.normalMap);
    if (unlit && C !== K.Basic && h.emissive) {
      h.emissive.setRGB(1, 1, 1);
      h.color?.setRGB(0, 0, 0);
      if ("emissiveMap" in h) h.emissiveMap = tex(m.map);
    }
    h.needsUpdate = true;
    mats.set(m, h);
    return h;
  };
  const node = (o) => {
    if (o.isSprite || o.isLight || o.isCamera || o.isLine || o.isPoints || o.isInstancedMesh) return null;
    const h = o.isMesh ? new K.Mesh(geo(o.geometry), Array.isArray(o.material) ? o.material.map(mat) : mat(o.material)) : new K.Group();
    h.name = o.name ? `br:${o.name}` : "br:prop";
    h.castShadow = !!o.castShadow;
    h.receiveShadow = !!o.receiveShadow;
    h.renderOrder = o.renderOrder || 0;
    h.frustumCulled = o.frustumCulled !== false;
    pairs.push([o, h]);
    for (const c of o.children) {
      const hc = node(c);
      if (hc) h.add(hc);
    }
    return h;
  };
  return {
    convert(root) {
      return node(root);
    },
    /** a host-class copy of one of our materials / textures (in-world reskins) */
    material: (m) => mat(m),
    texture: (t) => tex(t),
    /** copy animated state (transforms, visibility, opacity, texture rotation) from ours to the host copy */
    sync() {
      for (const [o, h] of pairs) {
        h.position.set(o.position.x, o.position.y, o.position.z);
        h.quaternion.set(o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w);
        h.scale.set(o.scale.x, o.scale.y, o.scale.z);
        h.visible = o.visible;
        if (o.isMesh && !Array.isArray(o.material)) {
          const hm = mats.get(o.material);
          if (hm) {
            hm.opacity = o.material.opacity;
            if (hm.map && o.material.map) hm.map.rotation = o.material.map.rotation;
          }
        }
      }
    },
    dispose() {
      for (const g of geos.values()) g.dispose?.();
      for (const m of mats.values()) m.dispose?.();
      for (const t of texs.values()) t.dispose?.();
    }
  };
}
async function hostAmbient(opts) {
  try {
    const { base, manifestUrl, scene, renderer } = opts;
    if (!scene?.isScene || !renderer) return null;
    const K = harvest(scene);
    if (!K) return null;
    const T = await ourThree(base);
    if (!K.Texture && +String(hookRecords().revision || "").replace(/\D.*$/, "") >= 150) K.Texture = T.Texture;
    const abs = new URL(manifestUrl, location.href).href;
    const raw = await (await fetch(abs, { cache: "no-cache" })).json();
    const m = normalizeManifest(T, raw);
    const iw = m.inWorld || {};
    const place = opts.placement || (Array.isArray(iw.position) && iw.position.length === 3 ? { position: iw.position, rotationY: iw.rotationY } : null) || opts.world?.placement;
    if (!place?.position) return null;
    const upm = Number(opts.world?.scale?.unitsPerMeter) > 0 ? Number(opts.world.scale.unitsPerMeter) : 1;
    m.inWorld = { ...iw, enabled: true, position: place.position, rotationY: +place.rotationY || 0, kind: iw.kind || "billboard", heightM: iw.heightM || 3 };
    const rel = (p) => typeof p === "string" && p ? new URL(p, abs).href : null;
    let gltfP = null;
    const glb = (u) => u ? (gltfP || (gltfP = importAddon(base, "loaders/GLTFLoader.js", T).then(({ GLTFLoader }) => new GLTFLoader()))).then((l) => l.loadAsync(u)).catch(() => null) : null;
    const tex = (u) => u ? new T.TextureLoader().loadAsync(u).then((t2) => {
      t2.colorSpace = T.SRGBColorSpace;
      return t2;
    }).catch(() => null) : null;
    const img = (u) => u ? new Promise((res) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = u;
    }) : null;
    const kind = m.inWorld.kind;
    const [banner, logoImg, collectibleGltf, statueGltf] = await Promise.all([
      tex(rel(m.round.banners?.[0]?.image)),
      img(rel(m.brand.logo)),
      kind === "portal_arch" ? glb(rel(m.round.collectible.model)) : null,
      kind === "statue" ? glb(rel(m.round.hero.model)) : null
    ]);
    const built = buildInWorld(T, m, { bannerTex: [banner], logoImg, collectibleGltf, heroGltf: null, groundTex: null }, m.brand.palette, statueGltf);
    const ours = built.group;
    ours.scale.multiplyScalar(upm);
    const conv = makeConverter(K);
    const host = conv.convert(ours);
    if (!host) return null;
    conv.sync();
    host.name = "BonusRoundAmbient";
    await warmProp(renderer, host, scene, null);
    scene.add(host);
    ours.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(ours);
    const center = box.getCenter(new T.Vector3());
    const watch = watchRenderer(renderer);
    let last = performance.now(), engaged = false, t = 0, visible = true, curCam = null;
    const vw = createPropViewability({
      THREE: T,
      getCamera: () => curCam,
      frame: ours,
      targets: built.targets,
      scene,
      exclude: host,
      facing: facingFor(kind),
      rule: ambientRule(m.inWorld),
      onImpression: () => opts.onImpression?.(),
      onViewable: (rep) => opts.onViewable?.(rep.ms, rep)
    });
    const api = { kind, group: host, get viewMs() {
      return vw.viewable ? vw.tracker.report.ms : vw.runMs;
    }, viewability: () => vw.debug() };
    const ry = +m.inWorld.rotationY || 0;
    api.center = { x: center.x, y: center.y, z: center.z };
    api.top = { x: center.x, y: box.max.y, z: center.z };
    api.normal = { x: Math.sin(ry), y: 0, z: Math.cos(ry) };
    api.halfWidth = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
    api.heightM = m.inWorld.heightM;
    api.upm = upm;
    api.brand = { name: m.brand.name, palette: m.brand.palette };
    api.ctaUrl = m.round.ctaUrl || null;
    api.manifestUrl = abs;
    api.getCamera = () => curCam;
    const spinTarget = kind === "statue" ? ours.children.find((c) => c.children.length && !c.isMesh) : null;
    watch?.onFrame((s, cam) => {
      if (s !== scene || !visible) return;
      const now2 = performance.now(), dt = Math.min((now2 - last) / 1e3, 0.1);
      last = now2;
      t += dt;
      built.update(dt);
      if (spinTarget) spinTarget.rotation.y += dt * 0.4;
      conv.sync();
      if (!cam?.projectionMatrix) return;
      curCam = cam;
      vw.tick(now2, document.visibilityState === "visible");
      if (document.visibilityState !== "visible") return;
      const p = opts.getPlayerPosition?.() || (cam.matrixWorld ? { x: cam.matrixWorld.elements[12], z: cam.matrixWorld.elements[14] } : null);
      if (p && !engaged && Math.hypot(p.x - center.x, p.z - center.z) < Math.max(1.6, m.inWorld.heightM * 0.45) * upm) {
        engaged = true;
        opts.onEngage?.();
      }
    });
    api.setVisible = (on) => {
      visible = !!on;
      host.visible = visible;
    };
    api.dispose = () => {
      try {
        scene.remove(host);
        conv.dispose();
        built.dispose();
      } catch {
      }
    };
    return api;
  } catch (e) {
    console.warn("[bonusround] ambient prop skipped:", e?.message || e);
    return null;
  }
}
var ourP, chain, tryNew;
var init_host_three = __esm({
  "../../sdk/host-three.js"() {
    init_three_shim();
    init_builders();
    init_spatial_ads();
    init_viewability();
    ourP = null;
    chain = (C) => {
      const out = [];
      for (let c = C; c && c !== Function.prototype && c !== Object; c = Object.getPrototypeOf(c)) out.push(c);
      return out;
    };
    tryNew = (C, ...a) => {
      try {
        return new C(...a);
      } catch {
        return null;
      }
    };
  }
});

// ../../sdk/inworld/round.js
var round_exports = {};
__export(round_exports, {
  brandFlash: () => brandFlash,
  nextFrame: () => nextFrame,
  playInWorldRound: () => playInWorldRound,
  prepareInWorldRound: () => prepareInWorldRound,
  warmInWorldHost: () => warmInWorldHost,
  warmInWorldObjects: () => warmInWorldObjects
});
async function loadAssets(o, T) {
  const abs = new URL(o.manifestUrl, location.href).href;
  const raw = o.raw || await (await fetch(abs, { cache: "no-cache" })).json();
  const m = normalizeManifest(T, raw);
  const rel = (p) => typeof p === "string" && p ? new URL(p, abs).href : null;
  const notes = [];
  const gltfLoader = o.THREE ? gltfLoaderFor(o.base, o.THREE) : () => importAddon(o.base, "loaders/GLTFLoader.js", T).then(({ GLTFLoader }) => new GLTFLoader());
  const colUrl = rel(m.round.collectible.model) || rel(m.round.hero.model);
  const wantsHero = (m.round.inworld?.spawn || []).some((x) => x?.asset === "hero");
  const heroUrl = wantsHero ? rel(m.round.hero.model) : null;
  const texFiles = m.round.brandworld?.textures || m.round.inworld?.textures || null;
  const brandTextures = {};
  const [logoImg, colGltf, heroGltf, productImg] = await Promise.all([
    within(loadImage(rel(m.brand.logo)).then(decoded), 6e3),
    colUrl ? within(gltfLoader().then((l) => l.loadAsync(colUrl)), 12e3) : null,
    heroUrl ? within(gltfLoader().then((l) => l.loadAsync(heroUrl)), 15e3) : null,
    within(loadImage(rel(m.brand.product)).then(decoded), 6e3),
    texFiles && typeof texFiles === "object" ? Promise.all(Object.entries(texFiles).map(async ([k, f]) => {
      const img = await within(loadImage(rel(f)).then(decoded), 6e3);
      if (img) brandTextures[k] = img;
    })) : null
  ]);
  if (heroUrl && !heroGltf) notes.push("hero model failed to load: procedural fallback");
  if (colUrl && !colGltf) notes.push("collectible model failed to load: procedural fallback");
  return { raw, logoImg, colGltf, heroGltf, productImg, brandTextures, notes };
}
function prepareInWorldRound(o) {
  try {
    if (!o?.manifestUrl) return null;
    const key = keyOf(o);
    const hit = prepared.get(key);
    if (hit && Date.now() - hit.at < 12e4) return hit.p;
    const renderer = o.renderer || hookRecords().renderers.at(-1);
    const main = !o.scene && renderer ? watchRenderer(renderer)?.main?.() : null;
    const scene = o.scene || main?.scene, camera = o.camera || main?.camera;
    const idle = () => new Promise((r4) => window.requestIdleCallback ? requestIdleCallback(() => r4(), { timeout: 400 }) : setTimeout(r4, 30));
    const p = (async () => {
      const A = await loadAssets(o, o.THREE || await ourThree(o.base));
      if (scene?.isScene) {
        await warmLevel(scene);
        await warmTextureAverages(scene);
      }
      await idle();
      trimmedLogo(A.logoImg);
      await idle();
      if (A.productImg) trimmedLogo(A.productImg);
      return A;
    })();
    p.catch(() => prepared.delete(key));
    prepared.set(key, { at: Date.now(), p });
    warmHostScene(renderer, scene, camera);
    return p;
  } catch {
    return null;
  }
}
function targetOf(renderer, scene, ms = 300) {
  return new Promise((res) => {
    const r0 = renderer.render;
    let done = false;
    const end = (v) => {
      if (done) return;
      done = true;
      if (renderer.render === wrap) renderer.render = r0;
      res(v);
    };
    const wrap = function(s, c) {
      if (s === scene) end(this.getRenderTarget?.() ?? null);
      return r0.apply(this, arguments);
    };
    renderer.render = wrap;
    setTimeout(() => end(void 0), ms);
  });
}
async function compileFor(renderer, scene, camera, maxMs) {
  const rt = await targetOf(renderer, scene);
  const prev = renderer.getRenderTarget?.() ?? null;
  const waits = [];
  for (const t of rt === void 0 ? [null] : rt === null ? [null] : [rt, null]) {
    try {
      renderer.setRenderTarget?.(t);
      waits.push(renderer.compileAsync(scene, camera).catch(() => {
      }));
    } catch {
    }
  }
  try {
    renderer.setRenderTarget?.(prev);
  } catch {
  }
  await within(Promise.all(waits), maxMs);
  return rt ? "target" : "screen";
}
function warmHostScene(renderer, scene, camera) {
  if (!renderer?.compileAsync || !scene?.isScene || !camera || warmed.has(scene)) return;
  warmed.add(scene);
  compileFor(renderer, scene, camera, 1e4).catch(() => {
  });
}
async function warmOurs(renderer, scene, camera, maxMs = 2500) {
  const t0 = performance.now();
  const roots = scene.children.filter((c) => c.userData?.__br && c.visible);
  if (!roots.length || !renderer?.compileAsync) return { ms: 0, skipped: true };
  for (const r4 of roots) r4.visible = false;
  let textures = 0;
  const out = {};
  try {
    out.target = await compileFor(renderer, scene, camera, maxMs);
    const tex = /* @__PURE__ */ new Set();
    for (const r4 of roots) r4.traverse((x) => {
      for (const mt of [x.material].flat().filter(Boolean)) for (const v of Object.values(mt)) if (v?.isTexture && !v.isRenderTargetTexture) tex.add(v);
    });
    if (renderer.initTexture) {
      const frame = () => new Promise((res) => requestAnimationFrame(() => res()));
      let budget = performance.now();
      for (const t of tex) {
        if (performance.now() - t0 > maxMs) break;
        try {
          renderer.initTexture(t);
          textures++;
        } catch {
        }
        if (performance.now() - budget > 8) {
          await frame();
          budget = performance.now();
        }
      }
    }
  } catch {
  }
  for (const r4 of roots) r4.visible = true;
  return { ms: Math.round(performance.now() - t0), textures, ...out };
}
async function warmInWorldHost({ renderer, scene, camera }) {
  if (!scene?.isScene) return;
  warmHostScene(renderer, scene, camera);
  await warmLevel(scene);
  await warmTextureAverages(scene);
}
function brandFlash(overlay, pal, T, onDone) {
  const fade = overlay.root.querySelector(".sa-fade");
  if (fade && !overlay.root.querySelector("style[data-br-flash]")) {
    const glow = vivid(pal, T), st = document.createElement("style");
    st.setAttribute("data-br-flash", "");
    st.textContent = `.sa-root .sa-fade.br-flash{background:radial-gradient(ellipse at 50% 44%,color-mix(in srgb,${glow} 55%,transparent) 0,color-mix(in srgb,${glow} 18%,transparent) 38%,transparent 66%)}
      .sa-root .sa-fade.br-flash .sa-big{max-height:24vh;transition-duration:.3s}`;
    overlay.root.appendChild(st);
  }
  fade?.classList.add("br-flash");
  overlay.fade(true, 120);
  setTimeout(() => {
    overlay.fade(false, 220);
    onDone?.();
  }, 380);
}
function vivid(pal, T) {
  const sat = (h) => {
    const c = new T.Color(h), hsl = {};
    c.getHSL(hsl);
    return hsl.s * (1 - Math.abs(hsl.l - 0.5) * 1.6);
  };
  return [pal.primary, pal.secondary, pal.accent].sort((a, b) => sat(b) - sat(a))[0];
}
async function playInWorldRound(opts) {
  const o = { boardMs: 8e3, name: "You", ...opts };
  const out = { completed: false, score: 0, fallback: null, phase: "loading", stats: null, warnings: [] };
  const warn2 = (msg) => {
    out.warnings.push(msg);
    if (out.warnings.length > 20) out.warnings.shift();
    try {
      o.onWarn?.(msg);
    } catch {
    }
  };
  const undo = [];
  const runUndo = () => {
    for (let k = undo.length - 1; k >= 0; k--) {
      try {
        undo[k]();
      } catch (e) {
        warn2(`cleanup: ${e?.message || e}`);
      }
    }
    undo.length = 0;
  };
  const phase = (p, extra = {}) => {
    out.phase = p;
    try {
      o.onPhase?.(p, { score: out.score, ...extra });
    } catch {
    }
    publish(p);
  };
  const publish = (p) => {
    try {
      const active2 = ["intro", "playing", "leaderboard", "exit"].includes(p);
      window.__BONUSROUND_ROUND__ = { phase: p, active: active2, format: "inworld", live: !!o.live, at: Date.now() };
      window.dispatchEvent(new CustomEvent("bonusround-round", { detail: window.__BONUSROUND_ROUND__ }));
    } catch {
    }
  };
  const event = (type, value) => {
    try {
      o.onEvent?.(type, value);
    } catch {
    }
  };
  try {
    let liveToast = function() {
      const t = document.createElement("div");
      t.setAttribute("data-bonusround-endtoast", "");
      t.style.cssText = "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483646;pointer-events:none";
      const sh = t.attachShadow ? t.attachShadow({ mode: "open" }) : t;
      const prod = productImg ? `<img class="p" alt="" src="${rel(m.brand.product)}">` : "";
      const lg = logoImg ? `<img class="l" alt="${m.brand.name}" src="${rel(m.brand.logo)}">` : `<b>${m.brand.name}</b>`;
      sh.innerHTML = `<style>
        .c{display:flex;align-items:center;gap:12px;padding:8px 10px 8px 8px;border-radius:18px;background:#fff;color:#1b1b2a;font:700 14px system-ui,sans-serif;
          box-shadow:0 0 0 3px ${pal.primary},0 14px 40px rgba(0,0,0,.3);animation:in .45s cubic-bezier(.2,1.4,.4,1);pointer-events:auto;max-width:min(94vw,560px)}
        .p{height:58px;width:auto;object-fit:contain}.l{height:28px;max-width:150px;object-fit:contain;display:block}
        small{display:block;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;opacity:.6;margin-bottom:2px}
        .t{font-weight:900;color:${pal.primary};font-size:13px;margin-top:2px}
        a,button{all:unset;cursor:pointer;background:${pal.primary};color:#fff;font-weight:900;padding:9px 14px;border-radius:999px;white-space:nowrap}
        @keyframes in{from{opacity:0;transform:translateY(20px)}}</style>
        <div class="c">${prod}<div><small>Ad \xB7 ${m.brand.name} \xB7 you scored ${out.score}</small>${lg}${m.brand.tagline ? `<div class="t">${m.brand.tagline}</div>` : ""}</div>${cta.label ? `<button type="button">${cta.label} \u2197</button>` : ""}</div>`;
      sh.querySelector("button")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (cta.url) openCta(cta.url, { placement: "toast" });
        event("click", cta.url);
      });
      document.documentElement.appendChild(t);
      out.endToast = true;
      setTimeout(() => t.remove(), o.toastMs || 7e3);
    };
    const renderer = o.renderer || hookRecords().renderers.at(-1) || null;
    const watch = renderer ? watchRenderer(renderer) : null;
    let scene = o.scene || null, camera = o.camera || null;
    for (let i = 0; i < 30 && watch && (!scene || !camera) && !watch.main(); i++) await sleep(100);
    scene || (scene = watch?.main()?.scene || hookRecords().scenes.at(-1) || null);
    camera || (camera = watch?.main()?.camera || null);
    if (!camera && scene) scene.traverse((x) => {
      if (!camera && x.isPerspectiveCamera) camera = x;
    });
    if (!scene?.isScene || !camera) return { ...out, fallback: "no_scene" };
    const T = o.THREE || await ourThree(o.base);
    let adapter;
    if (o.THREE) adapter = directAdapter(scene);
    else {
      const K = harvest(scene);
      if (!K) return { ...out, fallback: "host_classes" };
      adapter = convertedAdapter(scene, makeConverter(K));
    }
    const abs = new URL(o.manifestUrl, location.href).href;
    const key = keyOf(o), pre = prepared.get(key);
    prepared.delete(key);
    out.preloaded = !!(pre && Date.now() - pre.at < 12e4);
    const A = await (out.preloaded && pre.p.catch(() => null) || null) || await loadAssets(o, T);
    for (const n of A.notes) warn2(n);
    const raw = A.raw;
    const m = normalizeManifest(T, raw);
    const pal = m.brand.palette;
    const httpUrl = (u) => typeof u !== "string" ? null : /^https?:\/\//i.test(u) ? u : /^\/[^/]/.test(u) ? new URL(u, abs).href : null;
    const cta = { label: o.cta?.label || m.round.cta || "", url: httpUrl(o.cta?.url) || httpUrl(m.round.ctaUrl) };
    if (cta.label) m.round.cta = String(cta.label).slice(0, 80);
    const rel = (p) => typeof p === "string" && p ? new URL(p, abs).href : null;
    let world = o.world || null;
    if (!world && o.worldUrl) world = await within(fetch(new URL(o.worldUrl, location.href).href).then((r4) => r4.ok ? r4.json() : null), 4e3);
    world || (world = {});
    const { logoImg, colGltf, heroGltf, productImg, brandTextures } = A;
    const staticModel = (g) => {
      let skinned = false;
      g?.scene?.traverse((x) => {
        if (x.isSkinnedMesh) skinned = true;
      });
      return g && !skinned ? g : null;
    };
    const collectible = collectibleFactory(T, m, m.round.collectible.model ? colGltf : staticModel(colGltf), pal);
    undo.push(() => collectible.dispose());
    if (!scene.environment) {
      const probe = collectible.make();
      probe.traverse((x) => {
        for (const mt of [x.material].flat().filter(Boolean)) {
          if ("metalness" in mt) mt.metalness = Math.min(mt.metalness, 0.1);
          if ("roughness" in mt) mt.roughness = Math.max(mt.roughness, 0.4);
        }
      });
    }
    if (m.round.inworld?.introText) m.round.introText = String(m.round.inworld.introText).slice(0, 80);
    if (m.round.inworld?.hudLabel) m.round.hudLabel = String(m.round.inworld.hudLabel).slice(0, 24);
    if (m.round.hudLabel) m.round.hudLabel = String(m.round.hudLabel).replace(/\s*(\/\s*\d+|\bof\s+\d+)\s*$/i, "").trim() || m.round.hudLabel;
    const hadStyle = !!document.getElementById("sa-style");
    const DOCKS = ["top", "top-right", "top-left", "bottom-left"];
    const dock = [o.dock, m.round.inworld?.hudDock, world.gameplayHooks?.hud?.dock].find((d) => DOCKS.includes(d)) || "top";
    out.dock = dock;
    const overlay = createOverlay(m, pal, logoImg ? rel(m.brand.logo) : null, {
      productUrl: m.brand.product ? rel(m.brand.product) : null,
      ctaUrl: cta.url,
      storage: () => o.storage !== false,
      dock,
      bigLogoUrl: (() => {
        try {
          return trimmedLogo(logoImg)?.toDataURL() || null;
        } catch {
          return null;
        }
      })(),
      onCta: () => {
        if (cta.url) openCta(cta.url, { placement: "endcard" });
        event("click", cta.url);
      }
    });
    const holder = document.createElement("div");
    holder.setAttribute("data-bonusround-inworld", "");
    holder.style.cssText = "position:fixed;inset:0;z-index:2147483646;pointer-events:none;";
    const shadow = holder.attachShadow ? holder.attachShadow({ mode: "open" }) : holder;
    const css2 = document.createElement("style");
    const glow = vivid(pal, T);
    css2.textContent = (document.getElementById("sa-style")?.textContent || "") + `.br-vig{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .6s ease;
          box-shadow:inset 0 0 140px 28px color-mix(in srgb,${glow} 42%,transparent),inset 0 0 0 3px color-mix(in srgb,${glow} 55%,transparent)}
         .br-vig.on{opacity:1}
         .br-vig.full{box-shadow:inset 0 0 180px 50px color-mix(in srgb,${glow} 55%,transparent),inset 0 0 0 5px color-mix(in srgb,${glow} 75%,transparent)}
         .sa-root .sa-bar{top:14px}`;
    shadow.appendChild(css2);
    const vig = document.createElement("div");
    vig.className = "br-vig" + ((m.round.inworld?.takeover ?? "full") !== "subtle" ? " full" : "");
    shadow.appendChild(vig);
    shadow.appendChild(overlay.root);
    if (!hadStyle) document.getElementById("sa-style")?.remove();
    document.documentElement.appendChild(holder);
    for (const t of ["mousedown", "mouseup", "pointerdown", "pointerup", "click"]) {
      holder.addEventListener(t, (e) => {
        if (e.composedPath().some((el) => el.tagName === "BUTTON")) e.stopPropagation();
      });
    }
    undo.push(() => {
      overlay.hideAll();
      overlay.dispose();
      holder.remove();
    });
    const voiceover = m.audio.voiceover && Array.isArray(m.audio.voiceover.tracks) ? { duckTo: Number.isFinite(+m.audio.voiceover.duckTo) ? +m.audio.voiceover.duckTo : 0.3, tracks: m.audio.voiceover.tracks.filter((t) => t?.file).map((t) => ({ ...t, url: rel(t.file) })) } : null;
    const audio = createAudio({ music: rel(m.audio.music), sfx: { collect: rel(m.audio.sfx.collect), start: rel(m.audio.sfx.start), win: rel(m.audio.sfx.win) }, voiceover }, m.audio.volume * (o.muted ? 0 : 1));
    undo.push(() => {
      audio.stopVoiceover();
      audio.stopMusic();
      setTimeout(() => audio.dispose(), 700);
    });
    const unlock = () => {
      unlockAudio();
      audio.unlock();
    };
    addEventListener("pointerdown", unlock, true);
    addEventListener("keydown", unlock, true);
    undo.push(() => {
      removeEventListener("pointerdown", unlock, true);
      removeEventListener("keydown", unlock, true);
    });
    const claimed = /* @__PURE__ */ new Set();
    let session = null, failReason = null;
    const clock = { t0: 0 };
    let introPoints = 0;
    const claim = (i, opts2 = {}) => {
      if (out.phase === "leaderboard" || out.phase === "done" || out.phase === "exit") return false;
      if (!opts2.repeat && claimed.has(i)) return false;
      if (out.phase !== "playing") {
        if (opts2.repeat) return false;
        claimed.add(i);
        session.claimed(i, true);
        introPoints++;
        return true;
      }
      if (!opts2.repeat) {
        claimed.add(i);
        session.claimed(i, true);
      } else session.scoredAgain(i);
      out.score++;
      overlay.count(out.score);
      overlay.toast("+1");
      audio.play("collect");
      if (out.score === 1) event("engagement", 1);
      return true;
    };
    session = createSession({
      T,
      adapter,
      scene,
      camera,
      m,
      pal,
      logoImg,
      collectible,
      world,
      host: o.host || null,
      claimMode: "exclusive",
      claim,
      onFail: (r4) => {
        failReason || (failReason = r4);
      },
      log: warn2,
      heroGltf,
      productImg,
      focus: o.focus || null,
      live: !!o.live,
      textures: brandTextures,
      timeLeft: () => clock.t0 ? (m.round.durationSec * 1e3 - (performance.now() - clock.t0)) / 1e3 : 99,
      playerHeightM: o.playerHeightM
    });
    undo.push(() => session.dispose());
    const built = session.buildAsync ? await session.buildAsync(nextFrame) : session.build();
    out.stats = session.stats;
    if (!built.ok) {
      runUndo();
      return { ...out, fallback: built.reason || "no_surfaces" };
    }
    if (renderer) out.warm = await warmOurs(renderer, scene, camera);
    const claimable = () => session.items.filter((x) => !x.cosmetic && !x.latent).length;
    const total0 = claimable();
    let totalShown = total0 > 0 && !session.items.some((x) => x.cooldown);
    overlay.total(totalShown ? total0 : null);
    out.total = total0;
    const dur = Number.isFinite(+o.liveEndsInMs) && +o.liveEndsInMs > 4e3 ? Math.min(m.round.durationSec * 1e3, +o.liveEndsInMs) : m.round.durationSec * 1e3;
    let t0 = performance.now(), last = t0, playing = false, resolve;
    const done = new Promise((r4) => {
      resolve = r4;
    });
    let voTimer = 0;
    let exiting = false;
    const finish = (extra = {}) => {
      if (out.phase === "done") return;
      if (!extra.fallback && !extra.timedOut && !extra.now && session.full && !exiting && out.phase === "leaderboard") {
        exiting = true;
        out.phase = "exit";
        overlay.hideBoard();
        vig.classList.remove("on");
        setTimeout(() => {
          out.phase = "leaderboard";
          finish({ ...extra, now: true });
        }, 650);
        return;
      }
      clearTimeout(voTimer);
      watch?.offFrame?.(onFrame);
      clearInterval(backup);
      runUndo();
      out.stats = { ...session.stats, projectiles: session.projectiles() };
      out.phase = "done";
      if (!extra.fallback && !o.live) {
        o.hostSession?.end?.();
      }
      phase("done", extra);
      resolve({ ...out, ...extra });
    };
    const toBoard = (why) => {
      if (out.phase !== "playing" && out.phase !== "intro") return;
      phase("leaderboard");
      out.completed = true;
      out.endReason = why || "time";
      event("complete", out.score);
      overlay.caption(null);
      overlay.intro(false);
      overlay.showHud(false);
      vig.classList.remove("on");
      if (o.live) {
        liveToast();
        audio.play("win");
        audio.stopMusic();
        finish();
        return;
      }
      o.hostSession?.begin?.();
      overlay.showBoard([{ id: "me", name: o.name || "You", score: out.score, color: pal.primary }], "me", { ms: o.boardMs, onDone: () => finish() });
      audio.play("win");
      audio.stopMusic();
    };
    const step = () => {
      const now2 = performance.now(), dt = Math.min((now2 - last) / 1e3, 0.1);
      last = now2;
      if (out.phase === "done") return;
      const el = now2 - t0;
      if (failReason && (out.phase === "intro" || out.phase === "playing" && el < 1e4)) {
        overlay.toast("Bonus arena!");
        const reason = failReason;
        failReason = null;
        warn2(`in-world fallback: ${reason}`);
        return finish({ fallback: reason });
      }
      if (out.phase === "exit") {
        try {
          session.update(dt, "exit");
        } catch {
        }
        return;
      }
      if (out.phase === "intro" && el > INTRO_MS) {
        phase("playing");
        overlay.intro(false);
        if (introPoints) {
          out.score += introPoints;
          introPoints = 0;
          overlay.count(out.score);
          overlay.toast("+1");
          event("engagement", 1);
        }
      }
      if (out.phase !== "leaderboard") overlay.timer((dur - el) / 1e3);
      if (el >= dur && out.phase !== "leaderboard") toBoard("time");
      try {
        session.update(dt, out.phase);
      } catch (e) {
        warn2(`session: ${e?.message || e}`);
      }
      if (out.phase === "exit") return;
      if (totalShown && (claimable() !== total0 || session.stats.wave2)) {
        totalShown = false;
        overlay.total(null);
      }
    };
    const onFrame = (s) => {
      if (s === scene) {
        playing = true;
        step();
      }
    };
    watch?.onFrame(onFrame);
    const backup = setInterval(() => {
      if (!playing || performance.now() - last > 250) step();
      playing = false;
    }, 250);
    const safety = setTimeout(() => finish({ timedOut: true }), dur + o.boardMs + 45e3);
    undo.push(() => clearTimeout(safety));
    if (session.full && o.live) setTimeout(() => {
      if (out.phase === "intro" || out.phase === "playing") overlay.intro(true);
    }, 300);
    else if (session.full) {
      brandFlash(overlay, pal, T, () => {
        if (out.phase === "intro" || out.phase === "playing") overlay.intro(true);
      });
    }
    t0 = last = performance.now();
    clock.t0 = t0;
    phase("intro", { brand: { name: m.brand.name, palette: pal }, interaction: interactionOf(m) });
    overlay.count(0);
    overlay.timer(m.round.durationSec);
    overlay.showHud(true);
    if (!session.full) overlay.intro(true);
    if (session.full || session.mood()?.vignette !== false) vig.classList.add("on");
    audio.play("start");
    audio.startMusic();
    const vo = m.audio.voiceover;
    if (vo && Array.isArray(vo.tracks) && vo.tracks.length) {
      voTimer = setTimeout(() => {
        if (out.phase !== "intro" && out.phase !== "playing") return;
        const track = audio.pickVoiceover((dur - (performance.now() - t0)) / 1e3);
        if (!track) return;
        audio.playVoiceover(track);
        overlay.caption(track.text || "", track.durationSec * 1e3);
      }, Math.max(0, (Number.isFinite(+vo.startAfterSec) ? +vo.startAfterSec : 1.2) * 1e3));
    }
    o.onHandle?.({ abort: () => finish({ aborted: true, now: true }), end: (why) => toBoard(why || "requested"), session, debug: () => ({ phase: out.phase, score: out.score, total: totalShown ? total0 : null, takeover: session.takeover(), logos: session.logosInView(), stats: session.stats, live: session.live().length, livePos: session.live().map((q) => [Math.round(q.x), Math.round(q.z), q.kind]), projectiles: session.projectiles(), mood: session.mood(), hero: session.heroView(), phaseAt: out.phase === "intro" || out.phase === "playing" ? Math.round(performance.now() - t0) : null }) });
    return await done;
  } catch (e) {
    warn2(`in-world error: ${e?.stack || e?.message || e}`);
    runUndo();
    return { ...out, fallback: "error", error: String(e?.message || e) };
  } finally {
    if (window.__BONUSROUND_ROUND__?.active) publish("done");
  }
}
var INTRO_MS, sleep, within, loadImage, prepared, warmed, decoded, keyOf, warmInWorldObjects, nextFrame;
var init_round = __esm({
  "../../sdk/inworld/round.js"() {
    init_host_three();
    init_three_shim();
    init_spatial_ads();
    init_builders();
    init_overlay();
    init_audio();
    init_session();
    init_props();
    init_scan();
    init_takeover();
    init_click();
    INTRO_MS = 2e3;
    sleep = (ms) => new Promise((r4) => setTimeout(r4, ms));
    within = (p, ms, v = null) => Promise.race([Promise.resolve(p).catch(() => v), sleep(ms).then(() => v)]);
    loadImage = (url) => new Promise((res) => {
      if (!url) return res(null);
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = url;
    });
    prepared = /* @__PURE__ */ new Map();
    warmed = /* @__PURE__ */ new WeakSet();
    decoded = (img) => img?.decode ? img.decode().then(() => img, () => img) : img;
    keyOf = (o) => `${new URL(o.manifestUrl, location.href).href}|${o.THREE ? "host" : "ours"}`;
    warmInWorldObjects = (renderer, scene, camera, maxMs) => warmOurs(renderer, scene, camera, maxMs);
    nextFrame = () => new Promise((r4) => {
      let done = false;
      const go = () => {
        if (!done) {
          done = true;
          r4();
        }
      };
      requestAnimationFrame(() => setTimeout(go, 0));
      setTimeout(go, 50);
    });
  }
});

// ../../sdk/spatial-ads.js
function iigAccrue(acc, run, minMs) {
  if (run >= minMs) {
    acc.ms += acc.prevRun < minMs ? run : run - acc.prevRun;
    acc.viewable = true;
  }
  acc.prevRun = run;
}
function merge(def, src) {
  if (src === void 0) return structuredClone(def);
  if (def === null || typeof def !== "object" || Array.isArray(def)) return src;
  if (src === null || typeof src !== "object" || Array.isArray(src)) return structuredClone(def);
  const out = {};
  for (const k of /* @__PURE__ */ new Set([...Object.keys(def), ...Object.keys(src)])) out[k] = k in def ? merge(def[k], src[k]) : src[k];
  return out;
}
function normalizeManifest(THREE, raw) {
  const m = merge(DEFAULTS, raw && typeof raw === "object" ? raw : {});
  const toHex = (v, fb) => "#" + new THREE.Color(hex(v, fb)).getHexString(THREE.SRGBColorSpace);
  const P = m.brand.palette, D = DEFAULTS.brand.palette;
  for (const k of Object.keys(D)) P[k] = toHex(P[k], D[k]);
  const a = m.round.arena;
  a.groundColor = toHex(a.groundColor, "#" + new THREE.Color(P.primary).lerp(new THREE.Color("#ffffff"), 0.35).getHexString());
  a.groundAccent = toHex(a.groundAccent, "#" + new THREE.Color(P.primary).lerp(new THREE.Color("#ffffff"), 0.7).getHexString());
  a.skyTop = toHex(a.skyTop, P.background);
  a.skyBottom = toHex(a.skyBottom, "#" + new THREE.Color(P.primary).lerp(new THREE.Color("#ffffff"), 0.6).getHexString());
  a.fogColor = toHex(a.fogColor, a.skyBottom);
  const num5 = (v, d, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+v) && v !== null ? +v : d));
  a.radius = num5(a.radius, 16, 6, 60);
  a.fogDensity = num5(a.fogDensity, 0.015, 0, 0.08);
  a.lightIntensity = num5(a.lightIntensity, 1, 0.2, 3);
  const r4 = m.round;
  r4.durationSec = num5(r4.durationSec, 15, 5, 60);
  r4.hero.heightM = num5(r4.hero.heightM, 4, 0.5, 20);
  r4.collectible.heightM = num5(r4.collectible.heightM, 0.9, 0.2, 3);
  if (!Array.isArray(r4.hero.position) || r4.hero.position.length < 3) r4.hero.position = [0, 0, -9];
  r4.hero.animations = r4.hero.animations || {};
  r4.hero.none = r4.hero.none === true || r4.hero.kind === "none";
  if (!Array.isArray(r4.banners)) r4.banners = [];
  m.audio.volume = num5(m.audio.volume, 0.5, 0, 1);
  m.audio.sfx = m.audio.sfx || {};
  return m;
}
var inWorldMod, inWorldRun, VERSION, ARENA_CENTER, INTRO_MS2, log, DEFAULTS, withTimeout, loadImage2, gltfLoaderP, defaultGltfLoader, Runtime, SpatialAds;
var init_spatial_ads = __esm({
  "../../sdk/spatial-ads.js"() {
    init_builders();
    init_overlay();
    init_audio();
    init_mechanics();
    init_viewability();
    init_countdown();
    init_props();
    init_proximity();
    init_click();
    inWorldMod = () => Promise.resolve().then(() => (init_session(), session_exports));
    inWorldRun = () => Promise.resolve().then(() => (init_round(), round_exports));
    VERSION = "1.0.0";
    ARENA_CENTER = [0, 0, 2e3];
    INTRO_MS2 = 2e3;
    log = (...a) => console.warn("[spatial-ads]", ...a);
    DEFAULTS = {
      version: 1,
      id: "ad",
      brand: { name: "Sponsored", tagline: "", palette: { primary: "#ff4f8b", secondary: "#ffc93c", accent: "#2ee6d6", background: "#2b1650", text: "#ffffff" }, logo: null },
      concept: { title: "", pitch: "" },
      round: {
        durationSec: 15,
        mechanic: "collect",
        itemCount: 14,
        introText: "Collect them all!",
        hudLabel: "Collected",
        outroText: "Thanks for playing!",
        cta: "",
        arena: { radius: 16, groundColor: null, groundAccent: null, skyTop: null, skyBottom: null, fogColor: null, fogDensity: 0.015, lightIntensity: 1, decor: "pillars", groundTexture: null },
        hero: { model: null, heightM: 4, position: [0, 0, -9], animations: {}, spin: false, fallbackColor: null },
        collectible: { model: null, heightM: 0.9, spin: true, bob: true, fallbackColor: null },
        banners: []
      },
      inWorld: { enabled: false, position: [12, 0, -6], rotationY: 0, kind: "portal_arch", heightM: 4.5 },
      audio: { music: null, volume: 0.5, sfx: { collect: null, start: null, win: null } }
    };
    withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} timed out`)), ms))]);
    loadImage2 = (url) => new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`image failed: ${url}`));
      img.src = url;
    });
    gltfLoaderP = null;
    defaultGltfLoader = () => gltfLoaderP || (gltfLoaderP = import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => new GLTFLoader()));
    Runtime = class {
      constructor(o) {
        this.THREE = o.THREE;
        this.scene = o.scene;
        this.camera = o.camera;
        this.renderer = o.renderer;
        this.worldRoot = o.worldRoot;
        this.host = o.host || {};
        this.volume = Number.isFinite(o.volume) ? o.volume : 1;
        this.gltfLoader = typeof o.gltfLoader === "function" ? o.gltfLoader : defaultGltfLoader;
        this.ctaDefault = o.cta && typeof o.cta === "object" ? o.cta : null;
        this.onEvent = typeof o.onEvent === "function" ? o.onEvent : null;
        this.boardMs = Number.isFinite(o.boardMs) ? o.boardMs : 8e3;
        this.inWorldEnabled = o.inWorld !== false;
        this.storage = o.storage !== false;
        this.worldManifest = o.worldManifest && typeof o.worldManifest === "object" ? o.worldManifest : null;
        this.hudDock = o.hudDock === "top-right" ? "top-right" : "top";
        const w = o.world || {};
        const ph = Number.isFinite(w.playerHeightM) ? w.playerHeightM : 1.8;
        this.world = {
          cameraMode: w.cameraMode || "third-person",
          playerHeightM: ph,
          eyeHeight: Number.isFinite(w.eyeHeight) ? w.eyeHeight : ph * 0.92,
          jumpVelocity: Number.isFinite(w.jumpVelocity) ? w.jumpVelocity : null,
          gravity: Number.isFinite(w.gravity) ? w.gravity : null,
          walkSpeedMps: Number.isFinite(w.walkSpeedMps) ? w.walkSpeedMps : null,
          itemCenterY: Number.isFinite(o.itemCenterY) ? o.itemCenterY : Number.isFinite(w.itemCenterY) ? w.itemCenterY : null,
          controls: Array.isArray(w.controls) ? w.controls : []
          // the game's own keys (the proximity card picks a free one)
        };
        this.ad = null;
        this.round = null;
        this.loading = null;
        this.loadToken = 0;
        this.disposed = false;
        this.errors = [];
        this.inWorldViewMs = 0;
        this.iigWorld = { ms: 0, prevRun: 0, viewable: false };
        this.fps = { v: 0, n: 0, t: 0 };
        const T = this.THREE;
        this.center = new T.Vector3(...ARENA_CENTER);
        this._frustum = new T.Frustum();
        this._m4 = new T.Matrix4();
        this._v = new T.Vector3();
        this._box = new T.Box3();
        const net = this.host.net;
        const on = (type, fn) => net?.on?.(type, (msg) => this._safe(() => fn.call(this, msg)));
        on("ad", this._onAd);
        on("adRoundStart", this.playRound);
        on("adPicked", this._onPicked);
        on("adRoundEnd", this.endRound);
        on("adSoon", (m) => {
          serverCountdown(this, m);
          this._safe(() => this._prepInWorld());
        });
        on("phase", (m) => {
          if (this.round?.phase === "leaderboard" && m?.phase === "round") this._exitRound(false);
        });
        net?.on?.("adSoon", () => this._safe(() => {
          if (this.round?.phase === "leaderboard") this._exitRound(false);
        }));
        net?.on?.("adRoundStart", () => finishCountdown("started"));
        this.host.onFrame?.((dt) => this._safe(() => this._frame(dt)));
        this._unlock = () => {
          unlockAudio();
          this.ad?.audio.unlock();
        };
        addEventListener("pointerdown", this._unlock);
        addEventListener("keydown", this._unlock);
        const api = { version: VERSION, runtime: this, debug: () => this.debug() };
        window.__SPATIAL_ADS__ = Object.assign(window.__SPATIAL_ADS__ || {}, api);
      }
      _safe(fn) {
        if (this.disposed) return void 0;
        try {
          const r4 = fn();
          if (r4 && typeof r4.catch === "function") r4.catch((e) => this._err("async", e));
          return r4;
        } catch (e) {
          this._err("sync", e);
          return void 0;
        }
      }
      _emit(type, data) {
        if (!this.onEvent) return;
        try {
          this.onEvent(type, { manifestUrl: this.round?.ad.url ?? this.ad?.url ?? null, extra: this.round?.ad.extra ?? this.ad?.extra ?? {}, ...data });
        } catch (e) {
          this._err("onEvent", e);
        }
      }
      setVolume(v) {
        this.volume = Math.max(0, Math.min(1, +v || 0));
        this.ad?.audio.setVolume?.(this.ad.m.audio.volume * this.volume);
      }
      /** the native prop's proximity card (statues / boards: learn more; a portal arch: the game's rewarded round, if any) */
      _proximity(ad) {
        if (ad.inWorldPx) return ad.inWorldPx;
        const g = ad.inWorld.group, T = this.THREE, ph = +this.world?.playerHeightM || 1.8;
        const box = () => ad.inWorldBox || (ad.inWorldBox = new T.Box3().setFromObject(g));
        const portal = ad.inWorld.kind === "portal_arch";
        const hw = (() => {
          const b = box();
          return Math.max(0.5, Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2);
        })();
        const evt = (type, v = {}) => this._emit("proximity", { type, brand: ad.m.brand.name, ...v });
        ad.inWorldPx = createProximity({
          kind: portal ? "portal" : "prop",
          brand: { name: ad.m.brand.name, palette: ad.pal },
          url: ad.cta?.url || null,
          reward: () => this.rewardLabel || null,
          key: chooseKey(this.world || {}, this.proximityKey || "E"),
          radiusM: Math.max(3, Math.min(6, 4 * ph / 1.8)),
          upm: 1,
          showMs: 4e3,
          camera: this.camera,
          domElement: this.renderer?.domElement || null,
          dock: this.hudDock || "top",
          facing: facingFor(ad.inWorld.kind),
          portalHalfWidth: hw * 0.8,
          getCenter: () => {
            const b = box();
            return { x: (b.min.x + b.max.x) / 2, y: b.min.y, z: (b.min.z + b.max.z) / 2 };
          },
          getAnchor: () => {
            const b = box();
            return { x: (b.min.x + b.max.x) / 2, y: b.min.y + (b.max.y - b.min.y) * 0.62, z: (b.min.z + b.max.z) / 2 };
          },
          getNormal: () => ({ x: Math.sin(g.rotation.y), y: 0, z: Math.cos(g.rotation.y) }),
          getPlayer: () => {
            const p = this.host.getPlayerPosition?.();
            return p ? { x: p.x, y: p.y, z: p.z } : null;
          },
          onShown: (info) => evt("proximity_shown", info),
          // client/debug only, never billed
          onPortalEnter: () => evt("portal_enter"),
          onPlay: () => {
            evt("portal_play");
            this.onPortalPlay?.();
          },
          onLearnMore: () => {
            evt("cta_click", { url: ad.cta?.url || null });
            this._emit("cta", { url: ad.cta?.url || null, source: "proximity" });
          },
          onDismiss: (why) => evt("proximity_dismissed", { why })
        });
        return ad.inWorldPx;
      }
      _cta(ad) {
        const url = ad.cta?.url;
        if (url && /^https?:/i.test(url)) openCta(url, { placement: "endcard" });
        this._emit("cta", { url: url || null });
      }
      _err(where, e) {
        const msg = `${where}: ${e?.message || e}`;
        this.errors.push(msg);
        if (this.errors.length > 50) this.errors.shift();
        log(msg);
      }
      // ---------- loading ----------
      _onAd(msg) {
        if (!msg.manifestUrl) return this.clear();
        if (this.ad && this.ad.url === msg.manifestUrl && this.ad.rev === msg.rev) return;
        if (this.loading && this.loading.url === msg.manifestUrl && this.loading.rev === msg.rev) return;
        const { t, manifestUrl, rev, ...extra } = msg;
        return this.load(manifestUrl, rev, extra);
      }
      load(manifestUrl, rev, extra = {}) {
        if (this.loading && this.loading.url === manifestUrl && (rev === void 0 || this.loading.rev === rev)) return this.loading.promise;
        if (this.ad && this.ad.url === manifestUrl && (rev === void 0 || this.ad.rev === rev)) return Promise.resolve(this.ad);
        const token = ++this.loadToken;
        const promise = this._build(manifestUrl, rev, extra).then((ad) => {
          if (this.loading?.promise === promise) this.loading = null;
          if (token !== this.loadToken || this.disposed) {
            this._disposeAd(ad);
            return null;
          }
          if (this.round) this._exitRound(true);
          this._disposeAd(this.ad);
          this.ad = ad;
          this.scene.add(ad.arena.group);
          if (ad.inWorld) {
            try {
              const g = ad.inWorld.group, q = this.host.placeProp?.({ x: g.position.x, y: g.position.y, z: g.position.z }, ad.inWorld.kind);
              if (q && [q.x, q.y, q.z].every(Number.isFinite)) g.position.set(q.x, q.y, q.z);
            } catch (e) {
              this._err("placeProp", e);
            }
            this.worldRoot.add(ad.inWorld.group);
          }
          return ad;
        }).catch((e) => {
          this._err("load", e);
          if (this.loading?.promise === promise) this.loading = null;
          return null;
        });
        this.loading = { url: manifestUrl, rev, promise };
        return promise;
      }
      async _build(url, rev, extra = {}) {
        const T = this.THREE;
        const abs = new URL(url, location.href).href;
        const status = {}, errors = [];
        let raw = null;
        try {
          const res = await withTimeout(fetch(abs, { cache: "no-cache" }), 1e4, "manifest");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          raw = await res.json();
        } catch (e) {
          errors.push(`manifest: ${e.message}`);
        }
        const m = normalizeManifest(T, raw);
        const pal = m.brand.palette;
        const over = (extra.cta && typeof extra.cta === "object" ? extra.cta : null) || this.ctaDefault || {};
        const httpUrl = (u) => typeof u !== "string" ? null : /^https?:\/\//i.test(u) ? u : /^\/[^/]/.test(u) ? new URL(u, abs).href : null;
        const cta = { label: over.label || m.round.cta || "", url: httpUrl(over.url) || httpUrl(m.round.ctaUrl) };
        if (cta.label) m.round.cta = String(cta.label).slice(0, 80);
        if (extra.inWorld === false || !this.inWorldEnabled) m.inWorld.enabled = false;
        const rel = (p) => typeof p === "string" && p ? new URL(p, abs).href : null;
        const attempt = async (key, path, fn) => {
          const u = rel(path);
          if (!u) {
            status[key] = "fallback";
            return null;
          }
          try {
            const v = await withTimeout(fn(u), 25e3, key);
            status[key] = "loaded";
            return v;
          } catch (e) {
            status[key] = "error";
            errors.push(`${key}: ${e?.message || e}`);
            return null;
          }
        };
        const glb = (u) => this.gltfLoader().then((l) => l.loadAsync(u));
        const tex = (u) => new T.TextureLoader().loadAsync(u).then(
          (t) => {
            t.colorSpace = T.SRGBColorSpace;
            t.anisotropy = 8;
            return t;
          },
          () => {
            throw new Error(`texture failed: ${u}`);
          }
        );
        const banners = m.round.banners;
        const statue = m.inWorld.enabled && m.inWorld.kind === "statue";
        const [heroGltf, collectibleGltf, logoImg, groundTex, statueGltf, ...bannerTex] = await Promise.all([
          attempt("hero", m.round.hero.model, glb),
          // collectibles ARE the product: without a collectible model, the product model (round.hero.model) is the pickup
          attempt("collectible", m.round.collectible.model || m.round.hero.model, (u) => glb(u).then((g) => {
            if (m.round.collectible.model) return g;
            let skinned = false;
            g.scene.traverse((x) => {
              if (x.isSkinnedMesh) skinned = true;
            });
            if (skinned) throw new Error("product stand-in is rigged");
            g.scene.traverse((x) => {
              for (const mt of [x.material].flat().filter(Boolean)) {
                if ("metalness" in mt) mt.metalness = Math.min(mt.metalness, 0.12);
                if ("roughness" in mt) mt.roughness = Math.max(mt.roughness, 0.45);
              }
            });
            return g;
          })),
          attempt("logo", m.brand.logo, loadImage2),
          attempt("groundTexture", m.round.arena.groundTexture, tex),
          statue ? attempt("statue", m.round.hero.model, glb) : null,
          ...banners.map((b, i) => attempt(`banner${i}`, b?.image, tex))
        ]);
        const bs = banners.map((_, i) => status[`banner${i}`]);
        status.banner = !bs.length ? "fallback" : bs.includes("error") ? "error" : bs.every((s) => s === "loaded") ? "loaded" : "fallback";
        const A = { heroGltf, collectibleGltf, logoImg, groundTex, bannerTex };
        const arena = buildArena(T, m, A, pal, this.center);
        const collectible = collectibleFactory(T, m, collectibleGltf, pal);
        const inWorld = m.inWorld.enabled ? buildInWorld(T, m, A, pal, statueGltf) : null;
        const vo = m.audio.voiceover && typeof m.audio.voiceover === "object" ? m.audio.voiceover : null;
        const voiceover = vo && Array.isArray(vo.tracks) ? { duckTo: Number.isFinite(+vo.duckTo) ? +vo.duckTo : 0.3, tracks: vo.tracks.filter((t) => t?.file).map((t) => ({ ...t, url: rel(t.file) })) } : null;
        const audio = createAudio({ music: rel(m.audio.music), sfx: { collect: rel(m.audio.sfx.collect), start: rel(m.audio.sfx.start), win: rel(m.audio.sfx.win) }, voiceover }, m.audio.volume * this.volume);
        const mech = await loadMechanic(m.round.mechanic);
        const adRef = {};
        const overlay = createOverlay(m, pal, logoImg ? rel(m.brand.logo) : null, { productUrl: m.brand.product ? rel(m.brand.product) : null, ctaUrl: cta?.url || null, onCta: () => this._safe(() => this._cta(adRef.ad)), storage: () => this.storage, bigLogoUrl: (() => {
          try {
            return logoImg ? trimmedLogo(logoImg)?.toDataURL() || null : null;
          } catch {
            return null;
          }
        })(), dock: m.round.takeover?.mode === "in-world" && m.round.inworld?.hudDock || this.hudDock });
        const env = this._envFor(m);
        arena.group.updateMatrixWorld(true);
        const boxOf = (o) => new T.Box3().setFromObject(o);
        const targets = [...m.round.hero.none ? [] : [arena.hero.root], ...arena.banners.map((b) => b.panel)].map(boxOf);
        for (const e of errors) this._err("asset", e);
        adRef.ad = { url, rev, abs, m, pal, status, errors, arena, collectible, inWorld, audio, overlay, env, targets, logoImg, extra, cta, mech };
        return adRef.ad;
      }
      _envFor(m) {
        try {
          const T = this.THREE;
          const s = new T.Scene();
          const a = m.round.arena;
          const dome = new T.Mesh(new T.SphereGeometry(10, 16, 8), new T.MeshBasicMaterial({ color: a.skyBottom, side: T.BackSide }));
          const top = new T.Mesh(new T.CircleGeometry(6, 16), new T.MeshBasicMaterial({ color: new T.Color(a.skyTop).multiplyScalar(2) }));
          top.position.y = 8;
          top.rotation.x = Math.PI / 2;
          const key = new T.Mesh(new T.PlaneGeometry(5, 5), new T.MeshBasicMaterial({ color: new T.Color("#ffffff").multiplyScalar(4), side: T.DoubleSide }));
          key.position.set(6, 5, 5);
          key.lookAt(0, 0, 0);
          s.add(dome, top, key);
          const pm = new T.PMREMGenerator(this.renderer);
          const rt = pm.fromScene(s, 0.02);
          pm.dispose();
          disposeTree(s);
          return rt;
        } catch (e) {
          this._err("env", e);
          return null;
        }
      }
      clear() {
        this.loadToken++;
        this.loading = null;
        if (this.round) this._exitRound(true);
        this._disposeAd(this.ad);
        this.ad = null;
      }
      _disposeAd(ad) {
        if (!ad) return;
        try {
          ad.arena.group.parent?.remove(ad.arena.group);
          disposeTree(ad.arena.group);
          ad.collectible.dispose();
          if (ad.inWorld) {
            ad.inWorld.group.parent?.remove(ad.inWorld.group);
            ad.inWorld.dispose();
          }
          ad.inWorldPx?.dispose();
          ad.audio.dispose();
          ad.overlay.dispose();
          ad.env?.dispose();
          ad.arena.hero.mixer?.stopAllAction();
        } catch (e) {
          this._err("dispose", e);
        }
      }
      // ---------- rounds ----------
      async playRound(msg) {
        const recvOffset = Number.isFinite(msg.now) ? msg.now - Date.now() : 0;
        const token = this.roundToken = (this.roundToken || 0) + 1;
        let ad = this.ad;
        if (this.loading) ad = await this.loading.promise;
        if (!ad || ad.url !== msg.manifestUrl) ad = await this.load(msg.manifestUrl, msg.rev);
        if (!ad || token !== this.roundToken || this.disposed) return;
        const left = msg.endsAt - (Date.now() + recvOffset);
        if (left < 1200) return;
        if (this.round) this._exitRound(true);
        if (msg.inWorld) return this._enterInWorld(ad, msg, recvOffset, token);
        this._enterRound(ad, msg, recvOffset);
      }
      /** the game server runs this round ON its own level (msg.inWorld): no teleport, no arena; branded objects + reskins
       *  in the host's scene, the host's own player and controls, the same claims/HUD/leaderboard/metrics as the arena */
      /** full takeover extras: a fresh copy of the hero model (the arena owns the first one) and the product image, loaded
       *  ahead (ad load / the adSoon countdown) so the round's start never waits on them; taken once per round */
      _iwExtras(ad, take = false) {
        if (!ad) return Promise.resolve([null, null]);
        if (!ad.iwPre) {
          const rel = (p2) => typeof p2 === "string" && p2 ? new URL(p2, ad.abs).href : null;
          const wantsHero = (ad.m.round.inworld?.spawn || []).some((x) => x?.asset === "hero");
          ad.iwPre = Promise.all([
            wantsHero && rel(ad.m.round.hero.model) ? this.gltfLoader().then((l) => l.loadAsync(rel(ad.m.round.hero.model))).catch(() => null) : null,
            rel(ad.m.brand.product) ? loadImage2(rel(ad.m.brand.product)).then((i) => i?.decode ? i.decode().then(() => i, () => i) : i).catch(() => null) : null
          ]);
        }
        const p = ad.iwPre;
        if (take) ad.iwPre = null;
        return p;
      }
      /** under the adSoon countdown: the in-world extras, and the island's level / textures / shaders warmed (sdk/inworld/round.js) */
      _prepInWorld() {
        const ad = this.ad;
        if (!ad || !(ad.m.round.takeover?.mode === "in-world" || ad.m.round.inworld)) return;
        this._iwExtras(ad);
        inWorldRun().then((mod) => mod.warmInWorldHost?.({ renderer: this.renderer, scene: this.scene, camera: this.camera })).catch(() => {
        });
      }
      async _enterInWorld(ad, msg, offset, token) {
        const T = this.THREE;
        const { createSession: createSession2, directAdapter: directAdapter2 } = await inWorldMod();
        const run = await inWorldRun().catch(() => null);
        const [heroGltf, productImg] = await this._iwExtras(ad, true);
        if (token !== this.roundToken || this.disposed) return;
        const r4 = {
          ad,
          msg,
          offset,
          center: new T.Vector3(...Array.isArray(msg.arenaCenter) ? msg.arenaCenter : [0, 0, 0]),
          phase: "intro",
          active: false,
          startedAt: performance.now(),
          picked: new Set(msg.picked || []),
          claimed: new Set(msg.picked || []),
          pending: /* @__PURE__ */ new Map(),
          score: 0,
          inWorld: true,
          home: null,
          met: { impressionMs: 0, viewableMs: 0, run: 0, impressed: false, pickups: 0, moved: 0, last: null },
          sent: false
        };
        this.round = r4;
        r4.ctx = this._mechCtx(r4);
        const c = r4.center, host = new Set(msg.inWorld?.hostItems || []);
        const items = r4.ctx.items.map(([x, z, y], i) => ({ x: c.x + x, y: c.y + (y ?? 0), z: c.z + z, host: host.has(i) }));
        r4.iw = createSession2({
          T,
          adapter: directAdapter2(this.scene),
          scene: this.scene,
          camera: this.camera,
          m: ad.m,
          pal: ad.pal,
          logoImg: ad.logoImg,
          collectible: ad.collectible,
          world: { cameraMode: this.world.cameraMode, scale: { playerHeightM: this.world.playerHeightM }, ...this.worldManifest || {} },
          host: this.host,
          items,
          claimMode: msg.claimMode || ad.mech.claimMode || "exclusive",
          claim: (i) => r4.ctx.claim(i),
          onFail: (why) => this._err("in-world", why),
          log: (m) => log(m),
          heroGltf,
          productImg
        });
        try {
          if (r4.iw.buildAsync && run?.nextFrame) await r4.iw.buildAsync(run.nextFrame);
          else r4.iw.build();
        } catch (e) {
          this._err("in-world build", e);
        }
        if (run?.warmInWorldObjects && this.renderer) {
          try {
            await run.warmInWorldObjects(this.renderer, this.scene, this.camera, 1500);
          } catch {
          }
        }
        if (token !== this.roundToken || this.disposed || this.round !== r4) {
          try {
            r4.iw.dispose();
          } catch {
          }
          return;
        }
        for (const i of r4.picked) r4.iw.claimed(i, false);
        ad.overlay.total?.(items.length);
        ad.overlay.count(0);
        if (r4.iw.full) {
          if (run?.brandFlash) run.brandFlash(ad.overlay, ad.pal, T, () => this._safe(() => {
            if (this.round === r4) ad.overlay.intro(true);
          }));
          else {
            ad.overlay.fade(true, 140);
            setTimeout(() => this._safe(() => {
              if (this.round === r4) {
                ad.overlay.fade(false, 320);
                ad.overlay.intro(true);
              }
            }), 820);
          }
        }
        ad.overlay.showHud(true);
        if (!r4.iw.full) ad.overlay.intro(true);
        ad.audio.play("start");
        ad.audio.startMusic();
        r4.active = true;
        r4.met.last = this.host.getPlayerPosition?.()?.clone?.() ?? null;
        this._emit("roundStart", { late: (msg.picked || []).length > 0, inWorld: true });
        const vo = ad.m.audio.voiceover;
        if (vo && Array.isArray(vo.tracks) && vo.tracks.length) {
          r4.voTimer = setTimeout(() => this._safe(() => {
            if (this.round !== r4 || r4.phase === "leaderboard") return;
            const track = ad.audio.pickVoiceover((r4.msg.endsAt - (Date.now() + r4.offset)) / 1e3);
            if (!track) return;
            r4.voState = ad.audio.playVoiceover(track);
            ad.overlay.caption(track.text || "", track.durationSec * 1e3);
          }), Math.max(0, (Number.isFinite(+vo.startAfterSec) ? +vo.startAfterSec : 1.2) * 1e3));
        }
      }
      _enterRound(ad, msg, offset) {
        const T = this.THREE;
        const center = Array.isArray(msg.arenaCenter) ? new T.Vector3(...msg.arenaCenter) : this.center.clone();
        const r4 = {
          ad,
          msg,
          offset,
          center,
          phase: "intro",
          active: false,
          startedAt: performance.now(),
          picked: new Set(msg.picked || []),
          claimed: new Set(msg.picked || []),
          pending: /* @__PURE__ */ new Map(),
          score: 0,
          home: this.host.getPlayerPosition?.()?.clone?.() ?? new T.Vector3(),
          met: { impressionMs: 0, viewableMs: 0, run: 0, impressed: false, pickups: 0, moved: 0, last: null },
          sent: false
        };
        this.round = r4;
        ad.overlay.fade(true, 280).then(() => this._safe(() => {
          if (this.round !== r4) return;
          r4.saved = { visible: this.worldRoot.visible, fog: this.scene.fog, bg: this.scene.background, env: this.scene.environment };
          this.worldRoot.visible = false;
          ad.arena.group.visible = true;
          this.scene.fog = ad.arena.fog;
          this.scene.background = ad.arena.bg;
          if (ad.env) this.scene.environment = ad.env.texture;
          const ls = ad.m.round.layout?.meta?.spawn, lry = ad.m.round.layout?.meta?.spawnRotY;
          let spawn;
          if (Array.isArray(ls) && ls.length >= 3 && ls.every(Number.isFinite)) {
            const j = (Math.random() - 0.5) * 1.2, ry = Number.isFinite(lry) ? lry : Math.PI;
            spawn = center.clone().add(new T.Vector3(ls[0] + Math.cos(ry) * j, ls[1], ls[2] - Math.sin(ry) * j));
          } else spawn = center.clone().add(new T.Vector3((Math.random() - 0.5) * 3, 0, 7.5));
          this.host.teleport?.(spawn);
          if (Number.isFinite(lry)) this.host.setFacing?.(lry);
          const hp = ad.m.round.hero.position, hr = Math.max(1.2, ad.arena.hero.heightM * 0.36) + 0.2;
          const obstacles = ad.m.round.hero.none ? [] : [{ x: center.x + hp[0], z: center.z + hp[2], r: hr }];
          this.host.setBounds?.({ center: center.clone(), radius: ad.m.round.arena.radius - 0.8, obstacles });
          r4.ctx = this._mechCtx(r4);
          try {
            r4.mstate = ad.mech.build(r4.ctx) || {};
          } catch (e) {
            this._err("mechanic build", e);
            r4.mstate = {};
          }
          this.host.setSupport?.(ad.mech.supportAt ? (x, z, y) => {
            try {
              return ad.mech.supportAt(x, z, y, r4.ctx, r4.mstate);
            } catch {
              return null;
            }
          } : null);
          ad.arena.hero.play("intro");
          ad.overlay.count(0);
          ad.audio.play("start");
          ad.audio.startMusic();
          r4.active = true;
          r4.met.last = this.host.getPlayerPosition?.()?.clone?.() ?? null;
          setTimeout(() => this._safe(() => {
            if (this.round !== r4) return;
            ad.overlay.fade(false, 450);
            ad.overlay.showHud(true);
            ad.overlay.intro(true);
            r4.startedAt = performance.now();
            this._emit("roundStart", { late: (msg.picked || []).length > 0 });
            const vo = ad.m.audio.voiceover;
            if (vo && Array.isArray(vo.tracks) && vo.tracks.length) {
              r4.voTimer = setTimeout(() => this._safe(() => {
                if (this.round !== r4 || r4.phase === "leaderboard") return;
                const left = (r4.msg.endsAt - (Date.now() + r4.offset)) / 1e3;
                const track = ad.audio.pickVoiceover(left);
                if (!track) return;
                r4.voState = ad.audio.playVoiceover(track);
                ad.overlay.caption(track.text || "", track.durationSec * 1e3);
              }), Math.max(0, (Number.isFinite(+vo.startAfterSec) ? +vo.startAfterSec : 1.2) * 1e3));
            }
          }), 380);
        }));
      }
      /** the context handed to mechanics plugins (CONTRACT.md "Mechanics plugins") */
      _mechCtx(r4) {
        const T = this.THREE, ad = r4.ad, g = ad.arena.group;
        const items = (Array.isArray(r4.msg.items) ? r4.msg.items : []).map((it) => [+it[0] || 0, +it[1] || 0, Number.isFinite(+it[2]) && it.length > 2 ? +it[2] : void 0]);
        return {
          THREE: T,
          mechanic: ad.mech.name,
          manifest: ad.m,
          round: ad.m.round,
          layout: ad.m.round.layout || null,
          course: ad.m.round.course || null,
          palette: ad.pal,
          items,
          picked: r4.picked,
          world: this.world,
          arena: { group: g, center: r4.center.clone(), radius: ad.m.round.arena.radius, local: (x, y, z) => new T.Vector3(r4.center.x - g.position.x + x, r4.center.y - g.position.y + y, r4.center.z - g.position.z + z) },
          assets: { collectible: ad.collectible, hero: ad.arena.hero },
          scene: this.scene,
          camera: this.camera,
          renderer: this.renderer,
          domElement: this.renderer.domElement,
          player: {
            position: () => this.host.getPlayerPosition?.() || null,
            id: () => this.host.getPlayerId?.() ?? null,
            /** move the local player within the arena (soft respawn); world space. false when the host can't teleport */
            teleport: (v) => {
              if (this.round !== r4 || !v || typeof this.host.teleport !== "function") return false;
              this.host.teleport(v.clone ? v.clone() : new T.Vector3(v.x, v.y, v.z));
              return true;
            }
          },
          /** claim item i (a pickup, hit, gate, goal…); de-duplicated for 800 ms; the server's adPicked confirms it */
          claim: (i) => {
            const ms = performance.now();
            if (r4.claimed.has(i) || r4.pending.has(i) && ms - r4.pending.get(i) < 800 || r4.phase === "leaderboard" || r4.iw && r4.phase === "intro") return false;
            r4.pending.set(i, ms);
            this.host.net?.send?.({ t: "adPickup", i });
            return true;
          },
          isClaimed: (i) => r4.claimed.has(i),
          burst: (pos, color, n) => this._burst(pos, color || ad.collectible.color, n),
          audio: { play: (name) => ad.audio.play(name) },
          hud: { toast: (t) => ad.overlay.toast(t), count: (n) => ad.overlay.count(n), layer: ad.overlay.root },
          time: { left: () => (r4.msg.endsAt - (Date.now() + r4.offset)) / 1e3, elapsed: () => (performance.now() - r4.startedAt) / 1e3 },
          phase: () => r4.phase,
          score: () => r4.score
        };
      }
      _onPicked(msg) {
        const r4 = this.round;
        if (!r4) return;
        const myId = this.host.getPlayerId?.();
        const mine = myId != null && msg.by === myId;
        const personal = (r4.ad.mech.claimMode || "exclusive") === "personal";
        if (!personal) r4.picked.add(msg.i);
        else if (!mine) return;
        if (r4.claimed.has(msg.i)) return;
        if (mine || !personal) r4.claimed.add(msg.i);
        r4.pending.delete(msg.i);
        if (r4.iw) {
          try {
            r4.iw.claimed(msg.i, mine);
          } catch (e) {
            this._err("in-world claimed", e);
          }
        } else if (r4.mstate) {
          try {
            r4.ad.mech.onClaimed?.(msg.i, msg.by, mine, r4.ctx, r4.mstate);
          } catch (e) {
            this._err("mechanic onClaimed", e);
          }
        }
        if (mine) {
          r4.score++;
          r4.met.pickups++;
          r4.ad.overlay.count(r4.score);
          r4.ad.overlay.toast("+1");
          r4.ad.audio.play("collect");
          this._emit("pickup", { score: r4.score, first: r4.score === 1 });
        }
      }
      endRound(msg) {
        const r4 = this.round;
        if (!r4) return;
        this._sendMetrics(r4);
        this._emit("roundEnd", { aborted: !!msg.aborted || !r4.active, score: r4.score, leaderboard: msg.leaderboard || [] });
        if (msg.aborted || !r4.active) return this._exitRound(!r4.active);
        r4.phase = "leaderboard";
        r4.ad.overlay.caption(null);
        r4.ad.overlay.intro(false);
        r4.ad.overlay.showHud(false);
        r4.ad.overlay.showBoard(
          Array.isArray(msg.leaderboard) ? msg.leaderboard : [],
          this.host.getPlayerId?.(),
          { ms: this.boardMs, onDone: () => this._safe(() => {
            if (this.round === r4) this._exitRound(false);
          }) }
        );
        r4.ad.arena.hero.play("celebrate");
        r4.ad.audio.play("win");
        r4.boardTimer = setTimeout(() => this._safe(() => {
          if (this.round === r4) this._exitRound(false);
        }), this.boardMs + 6e3);
      }
      _exitRound(immediate) {
        const r4 = this.round;
        if (!r4) return;
        this.round = null;
        clearTimeout(r4.boardTimer);
        clearTimeout(r4.voTimer);
        r4.ad.audio.stopVoiceover();
        r4.ad.overlay.caption(null);
        this._sendMetrics(r4);
        const ad = r4.ad;
        const restore = () => {
          try {
            r4.iw?.dispose();
            if (r4.iw) this.lastInWorldStats = { ...r4.iw.stats };
          } catch (e) {
            this._err("in-world dispose", e);
          }
          try {
            if (r4.mstate) ad.mech.dispose?.(r4.ctx, r4.mstate);
          } catch (e) {
            this._err("mechanic dispose", e);
          }
          r4.mstate = null;
          this.host.setSupport?.(null);
          ad.arena.group.visible = false;
          if (r4.saved) {
            this.worldRoot.visible = r4.saved.visible;
            this.scene.fog = r4.saved.fog;
            this.scene.background = r4.saved.bg;
            this.scene.environment = r4.saved.env;
            this.host.setBounds?.(null);
            this.host.teleport?.(r4.home);
          }
          ad.overlay.hideAll();
          ad.overlay.total?.(null);
          ad.audio.stopMusic();
          ad.arena.hero.play("idle");
        };
        const done = () => this._emit("roundExit", { score: r4.score });
        if (immediate || !r4.saved) {
          restore();
          ad.overlay.fade(false, 200);
          done();
          return;
        }
        ad.overlay.fade(true, 300).then(() => this._safe(() => {
          if (this.round) return;
          restore();
          ad.overlay.fade(false, 420).then(done);
        }));
      }
      _sendMetrics(r4) {
        if (r4.sent) return;
        r4.sent = true;
        const mt = r4.met;
        this.host.net?.send?.({
          t: "adMetrics",
          manifestUrl: r4.ad.url,
          impressionMs: Math.round(mt.impressionMs),
          viewableMs: Math.round(mt.viewableMs),
          impression: mt.impressed,
          pickups: mt.pickups,
          interacted: mt.pickups > 0 || mt.moved > 3,
          inWorldViewableMs: Math.round(this.inWorldViewMs),
          // IAB/MRC IIG 2.0 (sdk/viewability.js), alongside the legacy >= 2% fields above (kept for history)
          iig: { std: IIG_STD, viewable: !!r4.iig?.viewable, viewableMs: Math.round(r4.iig?.ms || 0), inWorldViewable: this.iigWorld.viewable, inWorldViewableMs: Math.round(this.iigWorld.ms) }
        });
        this.inWorldViewMs = 0;
        this.iigWorld = { ms: 0, prevRun: this.iigWorld.prevRun, viewable: false };
      }
      // ---------- per frame ----------
      _frame(dt) {
        const f = this.fps;
        f.n++;
        f.t += dt;
        if (f.t >= 1) {
          f.v = Math.round(f.n / f.t);
          f.n = 0;
          f.t = 0;
        }
        const ad = this.ad;
        if (!ad) return;
        if (this.worldRoot.visible && ad.inWorld) {
          ad.inWorld.update(dt);
          ad.inWorldBox || (ad.inWorldBox = new this.THREE.Box3().setFromObject(ad.inWorld.group));
          if (this._screenFraction(ad.inWorldBox) >= 0.02) this.inWorldViewMs += dt * 1e3;
          try {
            ad.inWorldVw || (ad.inWorldVw = createPropViewability({
              THREE: this.THREE,
              camera: this.camera,
              frame: ad.inWorld.group,
              targets: ad.inWorld.targets,
              scene: this.scene,
              exclude: ad.inWorld.group,
              facing: facingFor(ad.inWorld.kind),
              rule: ambientRule(ad.m.inWorld)
            }));
            ad.inWorldVw.tick(performance.now(), document.visibilityState === "visible");
            iigAccrue(this.iigWorld, ad.inWorldVw.runMs, ad.inWorldVw.rule.minMs);
          } catch (e) {
            this._err("viewability", e);
          }
          try {
            if (!this.round) this._proximity(ad).tick();
          } catch (e) {
            this._err("proximity", e);
          }
        }
        const r4 = this.round;
        if (!r4 || !r4.active) return;
        if (!r4.iw) ad.arena.update(dt);
        const now2 = Date.now() + r4.offset;
        const left = (r4.msg.endsAt - now2) / 1e3;
        if (r4.phase !== "leaderboard") ad.overlay.timer(left);
        if (r4.phase === "intro" && performance.now() - r4.startedAt > INTRO_MS2) {
          r4.phase = "playing";
          ad.overlay.intro(false);
        }
        if (left < -6 && r4.phase !== "leaderboard") return this._exitRound(false);
        if (r4.iw) {
          try {
            r4.iw.update(dt, r4.phase);
          } catch (e) {
            this._err("in-world update", e);
          }
        } else {
          try {
            ad.mech.update(dt, r4.ctx, r4.mstate);
          } catch (e) {
            this._err("mechanic update", e);
          }
        }
        this._updateBursts(dt);
        const p = this.host.getPlayerPosition?.();
        if (p && r4.phase !== "leaderboard" && r4.met.last) {
          r4.met.moved += Math.hypot(p.x - r4.met.last.x, p.z - r4.met.last.z);
          r4.met.last.copy(p);
        }
        let best = ad.targets.length && !r4.iw ? 0 : 0.25;
        if (!r4.iw) for (const b of ad.targets) best = Math.max(best, this._screenFraction(b));
        const mt = r4.met, ms = dt * 1e3;
        if (best >= 0.02) {
          mt.viewableMs += ms;
          mt.run += ms;
          if (mt.run >= 1e3) {
            if (!mt.impressed) {
              mt.impressed = true;
              mt.impressionMs += mt.run - ms;
            }
            mt.impressionMs += ms;
          }
        } else mt.run = 0;
        r4.iig || (r4.iig = { ms: 0, prevRun: 0, viewable: false, tracker: createTracker(RULES.takeover) });
        r4.iig.tracker.sample(performance.now(), takeoverSample(true, document.visibilityState === "visible"));
        iigAccrue(r4.iig, r4.iig.tracker.runMs, RULES.takeover.minMs);
      }
      _screenFraction(box) {
        const cam = this.camera;
        cam.updateMatrixWorld();
        this._m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
        this._frustum.setFromProjectionMatrix(this._m4);
        if (box.isEmpty() || !this._frustum.intersectsBox(box)) return 0;
        let x0 = 1, y0 = 1, x1 = -1, y1 = -1, front = 0;
        for (let i = 0; i < 8; i++) {
          const v = this._v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
          v.applyMatrix4(cam.matrixWorldInverse);
          if (v.z > -cam.near) continue;
          front++;
          v.applyMatrix4(cam.projectionMatrix);
          x0 = Math.min(x0, v.x);
          x1 = Math.max(x1, v.x);
          y0 = Math.min(y0, v.y);
          y1 = Math.max(y1, v.y);
        }
        if (!front) return 0;
        if (front < 8) return 0.25;
        const cl = (v) => Math.max(-1, Math.min(1, v));
        return Math.max(0, cl(x1) - cl(x0)) * Math.max(0, cl(y1) - cl(y0)) / 4;
      }
      // ---------- particles ----------
      _burst(pos, color, count = 28) {
        const T = this.THREE;
        if (!this._bursts) {
          const mesh = new T.InstancedMesh(new T.OctahedronGeometry(0.1, 0), new T.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), 300);
          mesh.frustumCulled = false;
          mesh.count = 0;
          this._bursts = { mesh, parts: [], o: new T.Object3D() };
          this.scene.add(mesh);
        }
        const b = this._bursts, c = new T.Color(color);
        for (let i = 0; i < count && b.parts.length < 300; i++) {
          const v = new T.Vector3(Math.random() - 0.5, Math.random() * 0.8 + 0.4, Math.random() - 0.5).normalize().multiplyScalar(3 + Math.random() * 4);
          b.parts.push({ p: pos.clone(), v, age: 0, life: 0.6 + Math.random() * 0.5, c: c.clone().lerp(new T.Color("#ffffff"), Math.random() * 0.6) });
        }
      }
      _updateBursts(dt) {
        const b = this._bursts;
        if (!b) return;
        b.parts = b.parts.filter((q) => (q.age += dt) < q.life);
        b.parts.forEach((q, i) => {
          q.v.y -= 10 * dt;
          q.p.addScaledVector(q.v, dt);
          b.o.position.copy(q.p);
          b.o.rotation.set(q.age * 7, q.age * 5, 0);
          b.o.scale.setScalar(1.5 * (1 - q.age / q.life));
          b.o.updateMatrix();
          b.mesh.setMatrixAt(i, b.o.matrix);
          b.mesh.setColorAt(i, q.c);
        });
        b.mesh.count = b.parts.length;
        b.mesh.instanceMatrix.needsUpdate = true;
        if (b.mesh.instanceColor) b.mesh.instanceColor.needsUpdate = true;
      }
      // ---------- agent hooks ----------
      debug() {
        const ad = this.ad, r4 = this.round;
        let phase = "idle";
        if (this.loading) phase = "loading";
        if (r4) phase = r4.phase === "leaderboard" ? "leaderboard" : r4.active ? r4.phase : "loading";
        const hero = ad?.arena.hero;
        const st = ad?.status || {};
        return JSON.parse(JSON.stringify({
          phase,
          manifestUrl: ad?.url ?? this.loading?.url ?? null,
          assets: ad ? {
            hero: st.hero,
            collectible: st.collectible,
            banner: st.banner,
            music: ad.audio.status.music,
            voiceover: ad.audio.status.voiceover,
            logo: st.logo,
            groundTexture: st.groundTexture,
            sfx: { collect: ad.audio.status.collect, start: ad.audio.status.start, win: ad.audio.status.win }
          } : {},
          errors: [...this.errors],
          hero: hero ? { heightM: hero.heightM, source: hero.source, clips: hero.clips.map((c) => c.name), playing: hero.playing } : null,
          inWorld: ad?.inWorld ? { kind: ad.inWorld.kind, visible: this.worldRoot.visible } : null,
          itemsLeft: (() => {
            try {
              return r4?.iw ? r4.iw.live().length : r4 && r4.mstate ? r4.ad.mech.itemsLeft?.(r4.mstate) ?? 0 : 0;
            } catch {
              return 0;
            }
          })(),
          // the in-world round (Hop Isle's server-coordinated rounds), in the same shape the injector's handle reports
          inworld: !!r4?.iw,
          stats: r4?.iw ? r4.iw.stats : null,
          total: r4?.iw ? r4.iw.items.filter((x) => !x.cosmetic).length : null,
          mechanic: ad ? { name: ad.mech.name, requested: ad.mech.requested } : null,
          voiceover: ad?.audio.voiceover || null,
          score: r4?.score ?? 0,
          inWorldRound: r4?.iw ? { stats: r4.iw.stats, live: r4.iw.live().length, mood: r4.iw.mood(), failed: r4.iw.failed } : null,
          metrics: r4 ? { impressionMs: Math.round(r4.met.impressionMs), viewableMs: Math.round(r4.met.viewableMs), pickups: r4.met.pickups, iigViewable: !!r4.iig?.viewable, iigViewableMs: Math.round(r4.iig?.ms || 0) } : null,
          inWorldViewability: ad?.inWorldVw ? ad.inWorldVw.debug() : null,
          fps: this.fps.v
        }));
      }
      dispose() {
        if (this.disposed) return;
        this.clear();
        if (this._bursts) {
          this.scene.remove(this._bursts.mesh);
          this._bursts.mesh.geometry.dispose();
          this._bursts.mesh.material.dispose();
          this._bursts.mesh.dispose?.();
        }
        removeEventListener("pointerdown", this._unlock);
        removeEventListener("keydown", this._unlock);
        this.disposed = true;
      }
    };
    SpatialAds = {
      version: VERSION,
      attach(opts) {
        const rt = new Runtime(opts);
        return {
          load: (url, extra) => rt._safe(() => rt.load(url, void 0, extra)) ?? Promise.resolve(null),
          setVolume: (v) => rt._safe(() => rt.setVolume(v)),
          runtime: rt,
          playRound: (msg) => rt._safe(() => rt.playRound(msg)),
          endRound: (msg) => rt._safe(() => rt.endRound(msg)),
          clear: () => rt._safe(() => rt.clear()),
          debug: () => rt.debug(),
          dispose: () => rt.dispose()
        };
      }
    };
  }
});

// ../../sdk/br-core.js
init_spatial_ads();
init_builders();

// ../../sdk/round-layout.js
var WALK_R = 23.2;
var ARENA_CENTER2 = [0, 0, 2e3];
function rng2(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var r = rng2(7);
var TREES = [];
for (let i = 0; i < 30; i++) {
  const a = i / 30 * Math.PI * 2 + (r() - 0.5) * 0.18;
  const rad = 18 + r() * 4.6;
  TREES.push([Math.cos(a) * rad, Math.sin(a) * rad, 0.85 + r() * 0.55]);
}
var ROCKS = [];
for (let i = 0; i < 14; i++) {
  const a = r() * Math.PI * 2;
  const rad = 15.5 + r() * 7.5;
  ROCKS.push([Math.cos(a) * rad, Math.sin(a) * rad, 0.5 + r() * 0.9]);
}
var HOP_PAD = { x: 0, z: 0, r: 1.15, top: 0.85, launch: 15 };
var OBSTACLES = [
  ...TREES.map(([x, z, s]) => [x, z, 0.45 * s + 0.15]),
  ...ROCKS.filter(([, , s]) => s > 0.8).map(([x, z, s]) => [x, z, 0.75 * s])
];
function pushOutOfObstacles(x, z, radius = 0.45) {
  for (const [ox, oz, or] of OBSTACLES) {
    const dx = x - ox, dz = z - oz, min = or + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min && d2 > 1e-8) {
      const d = Math.sqrt(d2);
      x = ox + dx / d * min;
      z = oz + dz / d * min;
    }
  }
  return [x, z];
}
function clampDisc(x, z, cx, cz, R) {
  const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
  if (d <= R) return [x, z];
  return [cx + dx / d * R, cz + dz / d * R];
}
function freeSpot(rand, maxR, clearance = 0.9) {
  for (let k = 0; k < 40; k++) {
    const a = rand() * Math.PI * 2, rad = Math.sqrt(rand()) * maxR;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (OBSTACLES.every(([ox, oz, or]) => Math.hypot(x - ox, z - oz) > or + clearance)) return [x, z];
  }
  return [0, 0];
}

// ../../sdk/mechanics/bot-brains.js
init_physics();
init_race_rules();
init_platform_rules();
init_sports_rules();
init_smash_rules();
function makeMechBot(layout, opts = {}) {
  if (!layout || !Array.isArray(layout.elements)) return null;
  const mech = layout.mechanic;
  const make = { race: raceBot, platform: platformBot, sports: sportsBot, smash: smashBot }[mech];
  if (!make) return null;
  const P = layout.meta?.physics;
  if (!P) return null;
  const index = num2(opts.index, 0);
  const rand = rng(num2(opts.seed, layout.meta?.seed || 1) + index * 7919 >>> 0);
  const ci = claimIndex(layout.elements);
  const spawn = layout.meta?.botSpawns?.[index % Math.max(1, layout.meta.botSpawns.length)] || layout.meta?.spawn || [0, 0, 6];
  const ctx2 = { layout, P, rand, ci, spawn, index, isTaken: opts.isTaken || (() => false), startDelay: num2(opts.startDelay, 1.3), t: 0 };
  return make(ctx2);
}
var claimOf2 = (c, el) => c.ci.byEl.get(c.layout.elements.indexOf(el));
function offHero(c, me) {
  const h = c.layout.meta?.hero;
  if (!h) return;
  const r4 = num2(h.clearanceM, 0) - 0.1, dx = me.x - h.position[0], dz = me.z - h.position[2], d = Math.hypot(dx, dz);
  if (d < r4 && d > 1e-6) {
    me.x = h.position[0] + dx / d * r4;
    me.z = h.position[2] + dz / d * r4;
  }
}
function raceBot(c) {
  const T = trackFrom(c.layout);
  const pace = 0.8 + c.rand() * 0.12, lane = (c.rand() - 0.5) * T.width * 0.45;
  const r4 = makeRacer(c.spawn[0], c.spawn[2], num2(c.layout.meta?.spawnRotY, 0), { lane, pace });
  const bot = { kind: "race", x: r4.x, y: 0, z: r4.z, ry: r4.ry, racer: r4, track: T, get done() {
    return r4.done;
  } };
  bot.step = (dt) => {
    c.t += dt;
    const claims = [];
    if (c.t < c.startDelay || r4.done) return { claims };
    const crossed = stepRacer(r4, T, dt, c.P, { pace, lane, sprint: true });
    if (crossed) {
      const i = claimOf2(c, crossed.el);
      if (i !== void 0) claims.push(i);
    }
    bot.x = r4.x;
    bot.z = r4.z;
    bot.ry = r4.ry;
    return { claims };
  };
  return bot;
}
function platformBot(c) {
  const C = courseFrom(c.layout);
  const b = makeBody(c.spawn[0], c.spawn[1], c.spawn[2]);
  const mem2 = { k: 0 };
  const skill = { sprint: c.rand() < 0.55, pace: 0.9 + c.rand() * 0.1, hesitate: 0.012 + c.rand() * 0.02, aimX: 0, aimZ: 0 };
  const claimEls = c.layout.elements.map((el, k) => ({ el, i: c.ci.byEl.get(k) })).filter((x) => x.i !== void 0);
  let respawnAt = 0, falls = 0;
  const bot = { kind: "platform", x: b.x, y: b.y, z: b.z, ry: Math.PI, body: b, falls: 0 };
  bot.step = (dt) => {
    c.t += dt;
    const claims = [];
    if (c.t < c.startDelay) return { claims };
    if (respawnAt) {
      if (c.t < respawnAt) return { claims };
      const p = checkpointFor(C, mem2);
      Object.assign(b, makeBody(p[0], p[1] + 0.05, p[2]));
      respawnAt = 0;
    }
    const sub = Math.max(1, Math.ceil(dt / (1 / 90)));
    for (let k = 0; k < sub; k++) {
      const h = dt / sub, t = c.t - dt + h * (k + 1);
      const { wish, jump } = platformBrain(b, C, t, c.P, mem2, { ...skill, hesitate: 0 });
      const late = jump && c.rand() < skill.hesitate * 3;
      stepBody(b, wish, jump && !late, h, C.surfs, t, c.P, 0);
    }
    if (b.grounded && !b.on && b.y <= C.fallY && c.t > c.startDelay + 0.2) {
      falls++;
      bot.falls = falls;
      respawnAt = c.t + 0.6;
    }
    for (const { el, i } of claimEls) {
      if (c.isTaken(i)) continue;
      const d = Math.hypot(b.x - el.pos[0], b.z - el.pos[2]);
      if (el.type === "pickup") {
        if (d < num2(el.radius, 1) && Math.abs(b.y + c.P.heightM * 0.5 - el.pos[1]) < c.P.heightM) claims.push(i);
        continue;
      }
      if (b.grounded && b.on && Math.abs(b.y - el.pos[1]) < 0.4 && d < Math.max(1, num2(el.radius, 1.5)) + 0.5) claims.push(i);
    }
    bot.x = b.x;
    bot.y = b.y;
    bot.z = b.z;
    bot.ry = b.ry;
    return { claims };
  };
  return bot;
}
function sportsBot(c) {
  const pitch = pitchFrom(c.layout);
  const ball = makeBall(pitch.balls[(c.index + 1) % Math.max(1, pitch.balls.length)]);
  const me = { x: c.spawn[0], z: c.spawn[2], vx: 0, vz: 0, r: 0.35 * c.P.heightM / 1.8 + 0.1 };
  const skill = { pace: 0.84 + c.rand() * 0.12, aim: (c.rand() - 0.5) * 1.2, sprint: true };
  const slots = c.layout.elements.map((el, k) => ({ el, i: c.ci.byEl.get(k) })).filter((x) => x.el.type === "goal" && x.i !== void 0).map((x) => x.i);
  const bot = { kind: "sports", x: me.x, y: 0, z: me.z, ry: 0, ball, goals: 0 };
  bot.step = (dt) => {
    c.t += dt;
    const claims = [];
    if (c.t < c.startDelay) {
      stepBall(ball, dt, [], pitch);
      return { claims };
    }
    if (ball.cool <= 0) {
      const w = strikerBrain(me, ball, pitch, c.P, skill);
      const k = Math.min(1, c.P.accelK * dt);
      me.vx += (w.x - me.vx) * k;
      me.vz += (w.z - me.vz) * k;
    } else {
      me.vx *= 0.9;
      me.vz *= 0.9;
    }
    me.x += me.vx * dt;
    me.z += me.vz * dt;
    const rr = Math.hypot(me.x, me.z), lim = pitch.R - 1;
    if (rr > lim) {
      me.x *= lim / rr;
      me.z *= lim / rr;
    }
    offHero(c, me);
    if (stepBall(ball, dt, [me], pitch) === "goal") {
      bot.goals++;
      skill.aim = (c.rand() - 0.5) * 1.2;
      const free = slots.find((i) => !c.isTaken(i));
      if (free !== void 0) claims.push(free);
    }
    bot.x = me.x;
    bot.z = me.z;
    if (Math.hypot(me.vx, me.vz) > 0.3) bot.ry = Math.atan2(me.vx, me.vz);
    return { claims };
  };
  return bot;
}
function smashBot(c) {
  const T = targetsFrom(c.layout);
  const ids = T.map((t) => c.ci.byEl.get(c.layout.elements.indexOf(t.el)));
  const me = { x: c.spawn[0], z: c.spawn[2], cluster: -1 };
  const speed = c.P.walkMps * (0.7 + c.rand() * 0.15);
  let target = null, think = 0, pause = 0;
  const bot = { kind: "smash", x: me.x, y: 0, z: me.z, ry: 0 };
  bot.step = (dt) => {
    c.t += dt;
    const claims = [];
    if (c.t < c.startDelay) return { claims };
    T.forEach((t, k) => {
      if (c.isTaken(ids[k])) t.popped = true;
    });
    if ((pause -= dt) > 0) return { claims };
    think -= dt;
    if (!target || target.popped || think <= 0) {
      think = 0.8 + c.rand() * 0.8;
      let best = null, bd = Infinity;
      for (const t of T) {
        if (t.popped) continue;
        const d = Math.hypot(t.x - me.x, t.z - me.z) + (me.cluster === t.cluster ? 0 : 3) + c.rand() * 4;
        if (d < bd) {
          bd = d;
          best = t;
        }
      }
      target = best;
      if (best) me.cluster = best.cluster;
    }
    if (target) {
      const dx = target.x - me.x, dz = target.z - me.z, d = Math.hypot(dx, dz);
      if (d > 0.2) {
        const s = Math.min(d, speed * dt);
        me.x += dx / d * s;
        me.z += dz / d * s;
        bot.ry = Math.atan2(dx, dz);
      }
      offHero(c, me);
    }
    T.forEach((t, k) => {
      if (!t.popped && touches(t, me.x, 0, me.z, c.P.heightM, 0.45)) {
        t.popped = true;
        pause = 0.3;
        if (ids[k] !== void 0) claims.push(ids[k]);
      }
    });
    bot.x = me.x;
    bot.z = me.z;
    return { claims };
  };
  return bot;
}

// ../../sdk/round-core.js
var COLORS = ["#ff5d8f", "#4cc9f0", "#ffd23f", "#7ae582", "#b392f0", "#ff8c42", "#2ec4b6", "#f15bb5", "#9bf6ff", "#c0fdfb"];
var BOT_NAMES = ["Bloop", "Wobbles", "Jellybean", "Squish"];
var r2 = (v) => Math.round(v * 100) / 100;
var num4 = (v, d) => Number.isFinite(+v) && v !== null && v !== "" ? +v : d;
var clamp6 = (v, a, b) => Math.max(a, Math.min(b, v));
var GRAV2 = 24;
var ITEM_R = 1.2;
var CLAIM_SLACK = 3;
var MECH_RULES = {
  collect: { claimMode: "exclusive", claimRange: CLAIM_SLACK, botRange: ITEM_R - 0.1 },
  gates: { claimMode: "exclusive", claimRange: CLAIM_SLACK, botRange: ITEM_R - 0.1 },
  smash: { claimMode: "exclusive", claimRange: CLAIM_SLACK + 1, botRange: ITEM_R },
  sports: { claimMode: "exclusive", claimRange: Infinity, botRange: 6 },
  shoot: { claimMode: "exclusive", claimRange: Infinity, botRange: 7 },
  race: { claimMode: "personal", ordered: true, claimRange: CLAIM_SLACK + 1, botRange: ITEM_R + 0.4 },
  platform: { claimMode: "personal", ordered: false, claimRange: CLAIM_SLACK + 1, botRange: ITEM_R }
};
var PACED = /* @__PURE__ */ new Set(["shoot", "smash", "sports"]);
var BOT_COOLDOWN_MS = [1500, 2500];
var BOT_SHARE = 0.4;
var BOT_ENDGAME_MS = 3e3;
var CLAIM_TYPES2 = ["item", "target", "gate", "checkpoint", "goal", "coin", "finish", "collectible"];
function layoutItems(layout) {
  const els = Array.isArray(layout?.elements) ? layout.elements : [];
  const out = [];
  for (const el of els) {
    if (!(el && (el.claim === true || el.claim !== false && CLAIM_TYPES2.includes(el.type)))) continue;
    const p = Array.isArray(el.position) ? el.position : [el.x, el.y, el.z];
    const [x, y, z] = p.map((v) => Number.isFinite(+v) ? +v : 0);
    out.push([r2(x), r2(z), r2(y)]);
  }
  return out;
}
var GameCore = class {
  constructor(opts = {}) {
    this.o = {
      roundMs: 45e3,
      interMs: 15e3,
      boardMs: 9e3,
      bots: 3,
      orbs: true,
      maxOrbs: 14,
      inWorld: false,
      // true: this game supports in-world takeovers (round.takeover.mode 'in-world' plays ON the island)
      countdownMs: 0,
      // > 0: announce every ad round this long ahead with { t:'adSoon', startsAt } (the "Ad · Bonus Round in 5" card)
      now: () => Date.now(),
      loadManifest: async () => null,
      send: () => {
      },
      seed: Date.now() & 65535,
      ...opts
    };
    this.rand = rng2(this.o.seed);
    this.clients = /* @__PURE__ */ new Map();
    this.players = /* @__PURE__ */ new Map();
    this.orbs = /* @__PURE__ */ new Map();
    this.seq = { player: 1, orb: 1, ad: 0, rev: 0 };
    this.metricsBy = /* @__PURE__ */ new Map();
    this.activeAd = null;
    this.platformAd = null;
    this.ad = null;
    this.round = 0;
    this.lastTick = this.o.now();
    this.lastOrbSpawn = 0;
    for (let i = 0; i < this.o.bots; i++) this._addBot(i);
    this._startRound();
  }
  // ---------- transport ----------
  _send(cid, msg) {
    this.o.send(cid, typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  _broadcast(msg, exceptCid) {
    const s = JSON.stringify(msg);
    for (const cid of this.clients.keys()) if (cid !== exceptCid) this.o.send(cid, s);
  }
  connect(cid) {
    this.clients.set(cid, { cid, playerId: null, spectator: true, lastAdSeq: -1 });
  }
  disconnect(cid) {
    const c = this.clients.get(cid);
    this.clients.delete(cid);
    if (c?.playerId && this.players.has(c.playerId)) {
      this.players.delete(c.playerId);
      this._broadcast({ t: "leave", id: c.playerId });
    }
  }
  handle(cid, msg) {
    const c = this.clients.get(cid);
    if (!c || !msg || typeof msg.t !== "string") return;
    const p = c.playerId ? this.players.get(c.playerId) : null;
    switch (msg.t) {
      case "hello":
        return this._hello(c, msg);
      case "pos":
        if (p) this._pos(p, msg);
        return;
      case "orb":
        if (p) this._claimOrb(p, msg.id);
        return;
      case "adPickup":
        if (p) this._adPickup(p, msg.i);
        return;
      case "adMetrics":
        return this._adMetrics(c, msg);
      case "breakTaken":
        if (p) this._breakTaken(p, msg, c);
        return;
    }
  }
  // ---------- frequency guard: a sponsored break the player took outside this core (a Brand World round) ----------
  // { t:'breakTaken', ms } when it starts (ms = how long it expects to take), { t:'breakTaken', end:true } when it ends.
  // While every human in the room is on a break, or within one full island round after it, no ad round is announced or
  // started here: the intermission is a plain one and the player comes back to normal play.
  _breakTaken(p, msg, c = null) {
    const now2 = this.o.now();
    p.breakUntil = msg.end ? now2 : Math.max(p.breakUntil || 0, now2 + clamp6(num4(msg.ms, 4e4), 0, 12e4));
    p.breakFree = p.breakUntil + this.o.roundMs + this.o.interMs;
    if (this._onBreak() && this.soon) this._cancelSoon();
    if (msg.end && c) {
      this._send(c.cid, { t: "phase", now: now2, ...this._phaseFields() });
      this._send(c.cid, { t: "orbs", orbs: this._orbList() });
    }
  }
  _onBreak() {
    const now2 = this.o.now(), humans = [...this.players.values()].filter((q) => !q.bot);
    return humans.length > 0 && humans.every((q) => (q.breakFree || 0) > now2);
  }
  // ---------- players ----------
  _color() {
    const used = new Set([...this.players.values()].map((p) => p.color));
    return COLORS.find((c) => !used.has(c)) || COLORS[Math.floor(this.rand() * COLORS.length)];
  }
  _newPlayer(name, bot) {
    let [x, z] = freeSpot(this.rand, 7);
    if (Math.hypot(x, z) < 2.4) {
      const a = this.rand() * Math.PI * 2;
      x = Math.cos(a) * 3.5;
      z = Math.sin(a) * 3.5;
    }
    const p = {
      id: (bot ? "b" : "p") + this.seq.player++,
      name,
      bot,
      color: this._color(),
      x,
      y: 0,
      z,
      ry: 0,
      vy: 0,
      score: 0,
      adScore: 0,
      home: null,
      think: 0,
      target: null,
      speed: 4.3 + this.rand() * 0.8,
      adSpeed: 2.3 + this.rand() * 0.5
    };
    this.players.set(p.id, p);
    return p;
  }
  _addBot(i) {
    this._newPlayer(BOT_NAMES[i % BOT_NAMES.length], true);
  }
  _pub(p) {
    return { id: p.id, name: p.name, color: p.color, bot: p.bot, score: p.score, adScore: p.adScore, p: [r2(p.x), r2(p.y), r2(p.z)], ry: r2(p.ry) };
  }
  _hello(c, msg) {
    if (c.playerId) return;
    c.agent = msg.agent === true;
    const now2 = this.o.now();
    let me = null;
    if (!msg.spectate) {
      const name = String(msg.name || "").replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 16) || `Player ${this.seq.player}`;
      me = this._newPlayer(name, false);
      if (typeof msg.color === "string" && /^#[0-9a-f]{6}$/i.test(msg.color)) me.color = msg.color;
      c.playerId = me.id;
      c.spectator = false;
    }
    this._send(c.cid, {
      t: "welcome",
      id: me?.id ?? null,
      name: me?.name,
      color: me?.color,
      spawn: me ? [r2(me.x), 0, r2(me.z)] : null,
      now: now2,
      ...this._phaseFields(),
      players: [...this.players.values()].map((p) => this._pub(p)),
      orbs: this._orbList(),
      activeAd: this.activeAd?.url ?? null,
      rev: this.activeAd?.rev ?? 0
    });
    if (me) this._broadcast({ t: "join", player: this._pub(me) }, c.cid);
    const live = this.ad?.src || this.activeAd || this.platformAd;
    if (live) this._send(c.cid, this._adMsg(live));
    if (this.soon) this._send(c.cid, this._soonMsg());
    if (this.ad && this.sub === "play") {
      if (me) {
        me.home = [me.x, me.y, me.z];
        this.ad.reached.add(me.id);
        this._metric(this.ad.url).reached.add(me.id);
      }
      this._send(c.cid, this._adStartMsg(now2));
    }
  }
  _pos(p, msg) {
    const a = msg.p;
    if (!Array.isArray(a) || a.length < 3 || !a.every(Number.isFinite)) return;
    p.x = a[0];
    p.y = a[1];
    p.z = a[2];
    if (Number.isFinite(msg.ry)) p.ry = msg.ry;
  }
  // ---------- phases ----------
  _phaseFields() {
    return { phase: this.phase, endsAt: this.endsAt, adRound: !!this.ad, sub: this.sub, round: this.round };
  }
  _broadcastPhase() {
    this._broadcast({ t: "phase", now: this.o.now(), ...this._phaseFields() });
  }
  _startRound() {
    const now2 = this.o.now();
    this._sendBotsHome();
    if (this.soon) this._cancelSoon();
    this._clearPlatformAd();
    this.ad = null;
    this.sub = null;
    this.phase = "round";
    this.round++;
    this.endsAt = now2 + this.o.roundMs;
    for (const p of this.players.values()) {
      p.score = 0;
      p.adScore = 0;
    }
    this.orbs.clear();
    if (this.o.orbs) for (let i = 0; i < this.o.maxOrbs; i++) this._spawnOrb(false);
    this._broadcastPhase();
    this._broadcast({ t: "orbs", orbs: this._orbList() });
  }
  _adMsg(src) {
    return { ...src.extra || {}, t: "ad", manifestUrl: src.url, rev: src.rev };
  }
  _clearPlatformAd() {
    if (!this.platformAd) return;
    this.platformAd = null;
    this._broadcast({ t: "ad", manifestUrl: this.activeAd?.url ?? null, rev: this.activeAd?.rev ?? ++this.seq.rev, ...this.activeAd?.extra || {} });
  }
  _usePlatformAd(pa) {
    this.platformAd = { url: pa.url, manifest: pa.manifest, rev: ++this.seq.rev, extra: { ...pa.extra || {}, inWorld: false }, platform: true };
    this._broadcast(this._adMsg(this.platformAd));
    if (this.o.countdownMs > 0) return this._soonIntermission(this.platformAd, this.o.countdownMs);
    this._startAdRound(this.platformAd);
  }
  /** Ad-server fill that arrived after the intermission began: play it if the intermission is still a plain one. */
  startPlatformAd(pa) {
    if (this.phase !== "intermission" || this.ad || this.soon || this.activeAd || !pa?.url || !pa.manifest || this._onBreak()) return false;
    this._usePlatformAd(pa);
    return true;
  }
  _startIntermission() {
    const soon = this.soon;
    this.soon = null;
    const onBreak = this._onBreak();
    if (onBreak && soon) this._broadcast({ t: "adSoon", cancelled: true, now: this.o.now() });
    if (onBreak) {
      this.phase = "intermission";
      this.sub = null;
      this.endsAt = this.o.now() + this.o.interMs;
      this.orbs.clear();
      this._broadcastPhase();
      this._broadcast({ t: "orbs", orbs: [] });
      return;
    }
    if (this.activeAd) return this._startAdRound(this.activeAd);
    if (soon?.src?.platform && soon.src === this.platformAd) return this._startAdRound(this.platformAd);
    const pa = this.o.pickAd?.();
    if (pa?.url && pa.manifest) return this._usePlatformAd(pa);
    this.phase = "intermission";
    this.sub = null;
    this.endsAt = this.o.now() + this.o.interMs;
    this.orbs.clear();
    this._broadcastPhase();
    this._broadcast({ t: "orbs", orbs: [] });
    this.o.onIntermission?.();
  }
  _startAdRound(src = this.activeAd) {
    const now2 = this.o.now();
    this.soon = null;
    const m = src.manifest || {}, rd = m.round || {};
    const durMs = clamp6(num4(rd.durationSec, 15), 5, 60) * 1e3;
    const count = Math.round(clamp6(num4(rd.itemCount, 14), 1, 60));
    const radius = clamp6(num4(rd.arena?.radius, 16), 6, 60);
    const noHero2 = rd.hero?.none === true || rd.hero?.kind === "none";
    const hero = noHero2 ? [0, 0, -1e4] : Array.isArray(rd.hero?.position) ? rd.hero.position : [0, 0, -9];
    const base = MECH_RULES[rd.mechanic] || MECH_RULES.collect, lo = rd.layout || {};
    const rules = {
      mechanic: MECH_RULES[rd.mechanic] ? rd.mechanic : "collect",
      ...base,
      ...lo.claimMode === "exclusive" || lo.claimMode === "personal" ? { claimMode: lo.claimMode } : {},
      ...typeof lo.ordered === "boolean" ? { ordered: lo.ordered } : {},
      ...Number.isFinite(+lo.claimRange) && lo.claimRange !== null ? { claimRange: +lo.claimRange } : {}
    };
    const fromLayout = layoutItems(lo);
    const iw = this.o.inWorld === true && rd.takeover?.mode === "in-world";
    const iwPlan = iw ? this._inWorldItems(rd, count) : null;
    this.ad = {
      seq: ++this.seq.ad,
      url: src.url,
      rev: src.rev,
      src,
      radius: iw ? WALK_R - 2 : radius,
      rules,
      inWorld: iw,
      center: iw ? [0, 0, 0] : ARENA_CENTER2,
      orbOf: iwPlan?.orbOf || [],
      hostItems: iwPlan?.hostItems || [],
      items: iw ? iwPlan.items : fromLayout.length ? fromLayout : this._layoutItems(count, radius, hero),
      picked: /* @__PURE__ */ new Map(),
      claims: /* @__PURE__ */ new Map(),
      reached: /* @__PURE__ */ new Set(),
      startedAt: now2,
      heroObs: noHero2 ? [0, -1e6, 0] : [ARENA_CENTER2[0] + hero[0], ARENA_CENTER2[2] + hero[2], Math.max(1.2, clamp6(num4(rd.hero?.heightM, 4), 0.5, 20) * 0.36) + 0.65]
    };
    this.phase = "intermission";
    this.sub = "play";
    this.endsAt = now2 + durMs;
    this.orbs.clear();
    if (iw) {
      for (const [i, id] of this.ad.orbOf.entries()) if (id != null) this.orbs.set(id, [this.ad.items[i][0], this.ad.items[i][1]]);
    }
    this._broadcast({ t: "orbs", orbs: this._orbList() });
    const met = this._metric(this.ad.url);
    met.rounds++;
    let bi = 0;
    for (const p of this.players.values()) {
      p.adScore = 0;
      p.adLastAt = 0;
      p.home = iw ? null : [p.x, p.y, p.z];
      if (iw) {
        if (p.bot) {
          p.mbot = null;
          p.target = null;
          p.think = 0.4 + this.rand() * 0.5;
        } else {
          this.ad.reached.add(p.id);
          met.reached.add(p.id);
        }
        continue;
      }
      if (p.bot) {
        p.x = ARENA_CENTER2[0] + [-5.5, 5.5, -9, 9][bi % 4];
        p.z = ARENA_CENTER2[2] + 5 + (bi >> 1) * 1.5;
        p.y = 0;
        p.vy = 0;
        p.target = null;
        p.think = 0.4 + this.rand() * 0.5;
        p.mbot = null;
        try {
          p.mbot = makeMechBot(rd.layout, { index: bi, seed: this.seq.ad * 31 + bi, isTaken: (i) => this._botHas(p, i) });
        } catch {
          p.mbot = null;
        }
        if (p.mbot) {
          p.x = ARENA_CENTER2[0] + p.mbot.x;
          p.y = ARENA_CENTER2[1] + (p.mbot.y || 0);
          p.z = ARENA_CENTER2[2] + p.mbot.z;
          p.ry = p.mbot.ry || 0;
        }
        bi++;
      } else {
        this.ad.reached.add(p.id);
        met.reached.add(p.id);
      }
    }
    this._broadcastPhase();
    this._broadcast(this._adStartMsg(now2));
  }
  _adStartMsg(now2) {
    const a = this.ad;
    return {
      t: "adRoundStart",
      manifestUrl: a.url,
      rev: a.rev,
      endsAt: this.endsAt,
      now: now2,
      arenaCenter: a.center,
      radius: a.radius,
      items: a.items,
      picked: [...a.picked.keys()],
      mechanic: a.rules.mechanic,
      claimMode: a.rules.claimMode,
      ordered: !!a.rules.ordered,
      ...a.inWorld ? { inWorld: { hostItems: a.hostItems } } : {}
    };
  }
  /** in-world item plan on the island: orbs (reskinned by the client) first, then spawned brand pickups */
  _inWorldItems(rd, count) {
    const spawnN = (rd.inworld?.spawn || []).filter((s) => s && s.asset !== "banner").reduce((n, s) => n + Math.max(0, Math.round(num4(s.count, 0))), 0);
    const reskin = Array.isArray(rd.inworld?.reskin) && rd.inworld.reskin.length > 0;
    const orbN = reskin ? Math.max(0, count - Math.min(spawnN, count)) : 0;
    const total = reskin ? count : Math.max(1, Math.min(spawnN || count, 60));
    const items = [], orbOf = [], hostItems = [];
    for (let tries = 0; items.length < total && tries < 3e3; tries++) {
      const [x, z] = freeSpot(this.rand, WALK_R - 2.5, 1.1);
      if (Math.hypot(x - HOP_PAD.x, z - HOP_PAD.z) < HOP_PAD.r + 1.6) continue;
      if (items.some(([ox, oz]) => Math.hypot(x - ox, z - oz) < (tries > 1500 ? 1.8 : 2.8))) continue;
      const i = items.length;
      items.push([r2(x), r2(z), 0]);
      if (i < orbN) {
        orbOf[i] = this.seq.orb++;
        hostItems.push(i);
      } else orbOf[i] = null;
    }
    return { items, orbOf, hostItems };
  }
  _layoutItems(count, radius, hero) {
    const out = [], maxR = radius * 0.86;
    let spacing = Math.min(2.6, radius * 0.3);
    for (let tries = 0; out.length < count && tries < 4e3; tries++) {
      if (tries % 500 === 499) spacing *= 0.8;
      const a = this.rand() * Math.PI * 2, rad = 2 + Math.sqrt(this.rand()) * (maxR - 2);
      const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      if (Math.hypot(x - hero[0], z - hero[2]) < 3.4) continue;
      if (out.some(([ox, oz]) => Math.hypot(x - ox, z - oz) < spacing)) continue;
      out.push([r2(x), r2(z)]);
    }
    while (out.length < count) out.push([r2((this.rand() - 0.5) * radius), r2((this.rand() - 0.5) * radius)]);
    return out;
  }
  _endAdPlay(aborted) {
    if (!this.ad) return;
    const t0 = this.ad.startedAt;
    const timeOf = (p) => p.adLastAt ? p.adLastAt - t0 : Infinity;
    const leaderboard = [...this.players.values()].sort((a, b) => b.adScore - a.adScore || timeOf(a) - timeOf(b) || a.name.localeCompare(b.name)).map((p) => ({ id: p.id, name: p.name, score: p.adScore, bot: p.bot, color: p.color, timeMs: p.adLastAt ? p.adLastAt - t0 : null }));
    this._broadcast({ t: "adRoundEnd", manifestUrl: this.ad.url, leaderboard, aborted: !!aborted });
    if (aborted) {
      this._sendBotsHome();
      if (this.ad?.src?.platform) queueMicrotask(() => this._clearPlatformAd());
      this.ad = null;
      this.sub = null;
      this.phase = "intermission";
      this.endsAt = this.o.now() + 3e3;
    } else {
      this.sub = "board";
      this.endsAt = this.o.now() + this.o.boardMs;
    }
    this._broadcastPhase();
  }
  _sendBotsHome() {
    for (const p of this.players.values()) {
      if (p.bot && p.home) {
        [p.x, p.y, p.z] = p.home;
        p.vy = 0;
        p.target = null;
      }
      if (p.bot) p.mbot = null;
      p.home = null;
    }
  }
  // ---------- pre-round countdown: { t:'adSoon' } (CONTRACT.md "Ad-round messages") ----------
  // Natural path: during the island round, countdownMs before it ends, when the next intermission will be an ad round
  // (the manual ad, or a platform fill taken now). The round keeps running under the countdown; the ad round starts at
  // exactly startsAt (= the round's endsAt) for every player. A fill that lands later stretches the round to a full countdown.
  _soonMsg() {
    const s = this.soon, b = s.src.manifest?.brand || {}, x = s.src.extra?.brand || {};
    const name = x.name || b.name || null;
    return {
      t: "adSoon",
      manifestUrl: s.src.url,
      rev: s.src.rev ?? null,
      startsAt: s.startsAt,
      now: this.o.now(),
      sec: Math.max(1, Math.round(s.ms / 1e3)),
      sponsor: name ? { name, palette: b.palette || x.palette || null, logo: typeof b.logo === "string" ? b.logo : null } : null
    };
  }
  _announceSoon(src, startsAt, ms) {
    this.soon = { src, startsAt, ms, round: this.round };
    this._broadcast(this._soonMsg());
  }
  _cancelSoon() {
    if (!this.soon) return;
    this.soon = null;
    this._broadcast({ t: "adSoon", cancelled: true, now: this.o.now() });
    if (this.phase === "intermission" && this.sub === "soon") {
      this.sub = null;
      this.endsAt = this.o.now() + 3e3;
      this._broadcastPhase();
    }
  }
  /** plain intermission → countdown → ad round (late platform fills, forceAd({ countdownMs }) outside the island round) */
  _soonIntermission(src, ms) {
    const now2 = this.o.now();
    this._sendBotsHome();
    this.ad = null;
    this.phase = "intermission";
    this.sub = "soon";
    this.endsAt = now2 + ms;
    this._broadcastPhase();
    this._announceSoon(src, this.endsAt, ms);
  }
  _soonTick(now2) {
    const ms = this.o.countdownMs;
    if (!(ms > 0) || this.phase !== "round") return;
    if (this._onBreak()) {
      if (this.soon) this._cancelSoon();
      return;
    }
    if (this.soon) {
      if (this.soon.src !== (this.activeAd || this.platformAd)) this._cancelSoon();
      return;
    }
    if (this.endsAt - now2 > ms) return;
    let src = this.activeAd || this.platformAd;
    if (!src) {
      const pa = this.o.pickAd?.();
      if (!pa?.url || !pa.manifest) return;
      src = this.platformAd = { url: pa.url, manifest: pa.manifest, rev: ++this.seq.rev, extra: { ...pa.extra || {}, inWorld: false }, platform: true };
      this._broadcast(this._adMsg(src));
    }
    if (this.endsAt - now2 < ms - 250) {
      this.endsAt = now2 + ms;
      this._broadcastPhase();
    }
    this._announceSoon(src, this.endsAt, ms);
  }
  // ---------- orbs ----------
  _orbList() {
    return [...this.orbs].map(([id, [x, z]]) => [id, r2(x), r2(z)]);
  }
  _spawnOrb(announce = true) {
    const [x, z] = freeSpot(this.rand, WALK_R - 1.5);
    const id = this.seq.orb++;
    this.orbs.set(id, [x, z]);
    if (announce) this._broadcast({ t: "orbSpawn", orbs: [[id, r2(x), r2(z)]] });
  }
  // The island is live during the round AND during the "Ad in 5" countdown that follows it (the card sits over normal
  // play), so orbs stay collectable then; they clear when the ad round itself starts.
  _orbsLive() {
    return this.phase === "round" || this.phase === "intermission" && this.sub === "soon";
  }
  _claimOrb(p, id) {
    if (!this._orbsLive()) return;
    const o = this.orbs.get(id);
    if (!o || Math.hypot(p.x - o[0], p.z - o[1]) > CLAIM_SLACK || Math.abs(p.y) > 3) return;
    this.orbs.delete(id);
    p.score++;
    this._broadcast({ t: "orbTaken", id, by: p.id, score: p.score });
  }
  // ---------- ad round ----------
  _adPickup(p, i) {
    const a = this.ad;
    if (!a || this.sub !== "play" || !Number.isInteger(i) || i < 0 || i >= a.items.length) return;
    const personal = a.rules.claimMode === "personal";
    const mine = personal ? a.claims.get(p.id) || a.claims.set(p.id, /* @__PURE__ */ new Set()).get(p.id) : null;
    if (personal ? mine.has(i) || a.rules.ordered && i !== mine.size : a.picked.has(i)) return;
    if (p.bot && !personal && !this._botMayClaim(p)) return;
    const [ix, iz] = a.items[i];
    if (Number.isFinite(a.rules.claimRange) && Math.hypot(p.x - (a.center[0] + ix), p.z - (a.center[2] + iz)) > a.rules.claimRange) return;
    if (personal) mine.add(i);
    else a.picked.set(i, p.id);
    const orb = a.orbOf[i];
    if (orb != null && this.orbs.delete(orb)) this._broadcast({ t: "orbTaken", id: orb, by: p.id, score: p.score, ad: true });
    p.adScore++;
    p.adLastAt = this.o.now();
    if (p.bot) p.adCooldown = BOT_COOLDOWN_MS[0] + this.rand() * (BOT_COOLDOWN_MS[1] - BOT_COOLDOWN_MS[0]);
    const met = this._metric(a.url);
    if (p.bot) met.botPickups++;
    else met.pickups++;
    this._broadcast({ t: "adPicked", i, by: p.id, ...personal ? { personal: true } : {} });
    const humans = [...this.players.values()].filter((x) => !x.bot);
    const done = personal ? humans.length > 0 && humans.every((h) => (a.claims.get(h.id)?.size || 0) >= a.items.length) : a.picked.size >= a.items.length;
    if (done) this._endAdPlay(false);
  }
  /**
   * Bot pacing for exclusive rounds, so a 15 s round lasts ~15 s and a human can always win:
   *  - shoot / smash / sports: a per-bot cooldown of 1.5–2.5 s between claims (they "aim");
   *  - while a human is in the round, the bots' combined claims are capped at 40% of the items until the last 3 s;
   *  - bots never take the last item before the last 3 s, so the board only empties early when a human empties it.
   */
  _botMayClaim(b) {
    const a = this.ad, now2 = this.o.now(), left = this.endsAt - now2;
    if (PACED.has(a.rules.mechanic) && b.adLastAt && now2 - b.adLastAt < (b.adCooldown || BOT_COOLDOWN_MS[0])) return false;
    if (left <= BOT_ENDGAME_MS) return true;
    if (a.picked.size + 1 >= a.items.length) return false;
    const humanIn = [...a.reached].some((id) => this.players.get(id)?.bot === false);
    if (humanIn) {
      let botClaims = 0;
      for (const by of a.picked.values()) if (this.players.get(by)?.bot) botClaims++;
      if (botClaims + 1 > Math.max(1, Math.floor(a.items.length * BOT_SHARE))) return false;
    }
    return true;
  }
  _adMetrics(c, msg) {
    const url = typeof msg.manifestUrl === "string" ? msg.manifestUrl : this.ad?.url;
    if (!url || c.lastAdSeq === this.seq.ad) return;
    c.lastAdSeq = this.seq.ad;
    const m = this._metric(url), f = (v) => clamp6(num4(v, 0), 0, 6e5);
    m.reports++;
    m.impressionMs += f(msg.impressionMs);
    m.viewableMs += f(msg.viewableMs);
    m.inWorldViewableMs += f(msg.inWorldViewableMs);
    if (msg.iig && typeof msg.iig === "object") {
      if (msg.iig.viewable === true) m.iigViewables++;
      m.iigViewableMs += f(msg.iig.viewableMs);
      m.inWorldIigViewableMs += f(msg.iig.inWorldViewableMs);
    }
    if (f(msg.impressionMs) > 0 || msg.impression === true) m.impressions++;
    if (msg.interacted) m.interacted++;
    m.reportedPickups += Math.round(clamp6(num4(msg.pickups, 0), 0, 1e3));
  }
  _metric(url) {
    if (!this.metricsBy.has(url)) {
      this.metricsBy.set(url, {
        manifestUrl: url,
        rounds: 0,
        reached: /* @__PURE__ */ new Set(),
        reports: 0,
        impressions: 0,
        impressionMs: 0,
        viewableMs: 0,
        inWorldViewableMs: 0,
        iigViewables: 0,
        iigViewableMs: 0,
        inWorldIigViewableMs: 0,
        pickups: 0,
        botPickups: 0,
        reportedPickups: 0,
        interacted: 0
      });
    }
    return this.metricsBy.get(url);
  }
  metrics() {
    const fmt = (m) => {
      const { reached, ...rest } = m;
      return { ...rest, playersReached: reached.size, viewableSec: r2(m.viewableMs / 1e3), inWorldViewableSec: r2(m.inWorldViewableMs / 1e3) };
    };
    const byManifest = {};
    const totals = fmt(this._blank());
    delete totals.manifestUrl;
    for (const [url, m] of this.metricsBy) {
      const o = byManifest[url] = fmt(m);
      for (const k of Object.keys(totals)) if (typeof o[k] === "number") totals[k] = r2(totals[k] + o[k]);
    }
    return { totals, byManifest };
  }
  _blank() {
    return { manifestUrl: "", rounds: 0, reached: /* @__PURE__ */ new Set(), reports: 0, impressions: 0, impressionMs: 0, viewableMs: 0, inWorldViewableMs: 0, iigViewables: 0, iigViewableMs: 0, inWorldIigViewableMs: 0, pickups: 0, botPickups: 0, reportedPickups: 0, interacted: 0 };
  }
  /** true when every connected player is a learning agent (the server then requests no ad-server fills) */
  onlyAgents() {
    const humans = [...this.clients.values()].filter((c) => c.playerId);
    return humans.length > 0 && humans.every((c) => c.agent);
  }
  // ---------- control API ----------
  async setAd(url, extra = {}) {
    if (url === null || url === void 0 || url === "") {
      if (this.soon && !this.soon.src.platform) this._cancelSoon();
      if (this.ad && this.sub === "play") this._endAdPlay(true);
      this.activeAd = null;
      this._broadcast({ t: "ad", manifestUrl: null, rev: ++this.seq.rev });
      return { ok: true, activeAd: null };
    }
    if (typeof url !== "string") return { error: "manifestUrl must be a string or null" };
    const manifest = await this.o.loadManifest(url);
    if (!manifest || typeof manifest !== "object") return { error: `could not load manifest ${url}` };
    if (this.ad && this.sub === "play") this._endAdPlay(true);
    if (this.soon && !this.soon.src.platform) this._cancelSoon();
    this.activeAd = { url, rev: ++this.seq.rev, manifest, extra: extra && typeof extra === "object" ? extra : {} };
    this._broadcast(this._adMsg(this.activeAd));
    return { ok: true, activeAd: url, rev: this.activeAd.rev };
  }
  next() {
    if (this.phase === "round") this._startIntermission();
    else if (this.ad && this.sub === "play") this._endAdPlay(false);
    else this._startRound();
    return { ok: true, ...this._phaseFields() };
  }
  /** forceAd() jumps straight in; forceAd({ countdownMs }) announces it first (adSoon), like a natural break */
  forceAd(o = {}) {
    if (!this.activeAd) return { error: "no active ad: POST /api/game/ad first" };
    if (this.ad && this.sub === "play") return { ok: true, already: true, ...this._phaseFields() };
    const ms = Math.min(1e4, Math.max(0, +o?.countdownMs || 0));
    if (ms > 0) {
      if (this.soon) return { ok: true, already: true, startsAt: this.soon.startsAt, ...this._phaseFields() };
      if (this.phase === "round") {
        this.endsAt = this.o.now() + ms;
        this._broadcastPhase();
        this._announceSoon(this.activeAd, this.endsAt, ms);
      } else this._soonIntermission(this.activeAd, ms);
      return { ok: true, startsAt: this.soon.startsAt, ...this._phaseFields() };
    }
    this._startAdRound(this.activeAd);
    return { ok: true, ...this._phaseFields() };
  }
  state() {
    return {
      now: this.o.now(),
      ...this._phaseFields(),
      players: [...this.players.values()].map((p) => this._pub(p)),
      spectators: [...this.clients.values()].filter((c) => c.spectator).length,
      activeAd: this.activeAd?.url ?? null,
      soon: this.soon ? { manifestUrl: this.soon.src.url, startsAt: this.soon.startsAt, sec: Math.round(this.soon.ms / 1e3) } : null,
      ad: this.ad ? { manifestUrl: this.ad.url, items: this.ad.items.length, itemsLeft: this.ad.items.length - this.ad.picked.size, source: this.ad.src?.platform ? "platform" : "manual", requestId: this.ad.src?.extra?.requestId ?? null } : null,
      orbs: this.orbs.size,
      metrics: this.metrics()
    };
  }
  // ---------- simulation ----------
  tick() {
    const now2 = this.o.now();
    const dt = clamp6((now2 - this.lastTick) / 1e3, 0, 0.1);
    this.lastTick = now2;
    this._soonTick(now2);
    if (now2 >= this.endsAt) {
      if (this.phase === "round") this._startIntermission();
      else if (this.sub === "soon" && this.soon) this._startAdRound(this.soon.src);
      else if (this.ad && this.sub === "play") this._endAdPlay(false);
      else this._startRound();
    }
    if (this._orbsLive() && this.o.orbs && this.orbs.size < this.o.maxOrbs && now2 - this.lastOrbSpawn > 1100) {
      this.lastOrbSpawn = now2;
      this._spawnOrb(true);
    }
    for (const p of this.players.values()) if (p.bot) this._botStep(p, dt);
    if (this.clients.size) {
      this._broadcast({ t: "snap", now: now2, p: [...this.players.values()].map((p) => [p.id, r2(p.x), r2(p.y), r2(p.z), r2(p.ry), p.score, p.adScore]) });
    }
  }
  _botStep(b, dt) {
    if (b.mbot && this.ad) {
      if (this.sub !== "play") return;
      const { claims } = b.mbot.step(dt);
      b.x = ARENA_CENTER2[0] + b.mbot.x;
      b.y = ARENA_CENTER2[1] + (b.mbot.y || 0);
      b.z = ARENA_CENTER2[2] + b.mbot.z;
      b.ry = b.mbot.ry || 0;
      for (const i of claims) this._adPickup(b, i);
      return;
    }
    const inAd = !!(this.ad && this.sub === "play");
    const inArena = !!this.ad && !this.ad.inWorld;
    const [cx, cz] = inArena ? [ARENA_CENTER2[0], ARENA_CENTER2[2]] : [0, 0];
    b.think -= dt;
    const stale = b.target?.kind === "item" && (!inAd || this._botHas(b, b.target.i));
    const staleOrb = b.target?.kind === "orb" && !this.orbs.has(b.target.id);
    if (b.think <= 0 || stale || staleOrb) {
      b.think = inAd ? 1 + this.rand() * 0.8 : 0.55 + this.rand() * 0.6;
      b.target = this._botTarget(b, inAd, cx, cz);
    }
    let speed = 1.5;
    if (inAd) speed = this.o.now() - this.ad.startedAt < (this.ad.rules.claimRange === Infinity ? 2600 : 1300) ? 0 : b.adSpeed * (this.ad.inWorld ? 1.15 : 1);
    else if (this.phase === "round") speed = b.speed;
    let moving = false;
    if (b.target) {
      const dx = b.target.x - b.x, dz = b.target.z - b.z, d = Math.hypot(dx, dz);
      const stopAt = b.target.kind === "item" && (this.ad?.rules.botRange || 0) > 3 ? this.ad.rules.botRange - 1.5 : 0.25;
      if (d > stopAt) {
        const s = Math.min(d - stopAt * 0.5, speed * dt);
        b.x += dx / d * s;
        b.z += dz / d * s;
        b.ry = Math.atan2(dx, dz);
        moving = true;
      } else if (b.target.kind === "wander") b.target = null;
    }
    for (const o of this.players.values()) {
      if (o === b) continue;
      const dx = b.x - o.x, dz = b.z - o.z, d = Math.hypot(dx, dz);
      if (d > 1e-3 && d < 0.95) {
        b.x += dx / d * (0.95 - d) * 0.5;
        b.z += dz / d * (0.95 - d) * 0.5;
      }
    }
    if (inArena) {
      [b.x, b.z] = clampDisc(b.x, b.z, cx, cz, this.ad.radius - 1);
      const [hx, hz, hr] = this.ad.heroObs, dx = b.x - hx, dz = b.z - hz, d = Math.hypot(dx, dz);
      if (d < hr && d > 1e-6) {
        b.x = hx + dx / d * hr;
        b.z = hz + dz / d * hr;
      }
    } else {
      [b.x, b.z] = clampDisc(b.x, b.z, 0, 0, WALK_R);
      [b.x, b.z] = pushOutOfObstacles(b.x, b.z);
    }
    if (b.y <= 0 && this.rand() < (moving ? 0.6 : 0.15) * dt) b.vy = 7 + this.rand() * 1.5;
    if (!inArena && b.vy <= 0 && b.y < HOP_PAD.top + 0.1 && Math.hypot(b.x - HOP_PAD.x, b.z - HOP_PAD.z) < HOP_PAD.r + 0.35) b.vy = HOP_PAD.launch;
    b.vy -= GRAV2 * dt;
    b.y += b.vy * dt;
    if (b.y <= 0) {
      b.y = 0;
      b.vy = 0;
    }
    if (this._orbsLive()) {
      for (const [id, [ox, oz]] of this.orbs) if (Math.hypot(b.x - ox, b.z - oz) < ITEM_R) this._claimOrb(b, id);
    } else if (inAd && speed > 0) {
      const range = this.ad.rules.botRange ?? ITEM_R - 0.1;
      this.ad.items.forEach(([ix, iz], i) => {
        if (!this.ad || this._botHas(b, i) || Math.hypot(b.x - cx - ix, b.z - cz - iz) >= range) return;
        if (range > 3 && this.rand() > 0.9 * dt) return;
        this._adPickup(b, i);
      });
    }
  }
  _botHas(b, i) {
    const a = this.ad;
    return a.rules.claimMode === "personal" ? !!a.claims.get(b.id)?.has(i) : a.picked.has(i);
  }
  _botTarget(b, inAd, cx, cz) {
    const noisy = (d) => d + this.rand() * (inAd ? 7 : 4);
    let best = null, bd = Infinity;
    if (inAd && this.ad.rules.ordered) {
      const i = this.ad.claims.get(b.id)?.size || 0, it = this.ad.items[i];
      if (it) return { kind: "item", i, x: cx + it[0], z: cz + it[1] };
    } else if (inAd) {
      this.ad.items.forEach(([ix, iz], i) => {
        if (this._botHas(b, i)) return;
        const d = noisy(Math.hypot(b.x - cx - ix, b.z - cz - iz));
        if (d < bd) {
          bd = d;
          best = { kind: "item", i, x: cx + ix, z: cz + iz };
        }
      });
    } else if (this.phase === "round") {
      for (const [id, [ox, oz]] of this.orbs) {
        const d = noisy(Math.hypot(b.x - ox, b.z - oz));
        if (d < bd) {
          bd = d;
          best = { kind: "orb", id, x: ox, z: oz };
        }
      }
    }
    if (best) return best;
    if (b.target?.kind === "wander") return b.target;
    const R = this.ad ? this.ad.radius * 0.6 : 16;
    const a = this.rand() * Math.PI * 2, rad = Math.sqrt(this.rand()) * R;
    return { kind: "wander", x: cx + Math.cos(a) * rad, z: cz + Math.sin(a) * rad };
  }
};

// ../../sdk/local-net.js
function relay() {
  const handlers = /* @__PURE__ */ new Map();
  return {
    on(type, cb) {
      if (!handlers.has(type)) handlers.set(type, []);
      handlers.get(type).push(cb);
    },
    emit(msg) {
      for (const cb of [...handlers.get(msg.t) || [], ...handlers.get("*") || []]) {
        try {
          cb(msg);
        } catch (e) {
          console.error("[bonusround] handler", msg.t, e);
        }
      }
    }
  };
}
function createLocalNet(manifestUrl, opts = {}) {
  const r4 = relay();
  let paused = false, pausedAt = 0, shift = 0;
  const held = [];
  const clock = opts.now || (() => Date.now());
  const now2 = () => (paused ? pausedAt : clock()) - shift;
  const core = new GameCore({
    roundMs: 1300,
    interMs: 1e3,
    boardMs: 9e3,
    bots: 2,
    orbs: false,
    ...opts,
    now: now2,
    send: (_cid, s) => {
      if (paused) held.push(s);
      else queueMicrotask(() => r4.emit(JSON.parse(s)));
    },
    loadManifest: async (url) => {
      try {
        return await (await fetch(url, { cache: "no-cache" })).json();
      } catch {
        return null;
      }
    }
  });
  core.connect(1);
  const timer = setInterval(() => {
    if (!paused) core.tick();
  }, 50);
  queueMicrotask(() => r4.emit({ t: "open" }));
  if (manifestUrl) core.setAd(manifestUrl).then((out) => {
    if (out.error) console.warn("[bonusround]", out.error);
  });
  return {
    core,
    on: r4.on,
    send(msg) {
      queueMicrotask(() => core.handle(1, JSON.parse(JSON.stringify(msg))));
    },
    close() {
      clearInterval(timer);
    },
    pause() {
      if (paused) return;
      pausedAt = clock();
      paused = true;
    },
    resume() {
      if (!paused) return;
      shift += clock() - pausedAt;
      paused = false;
      for (const s of held.splice(0)) queueMicrotask(() => r4.emit(JSON.parse(s)));
      queueMicrotask(() => {
        try {
          core._broadcastPhase();
        } catch {
        }
      });
    },
    get paused() {
      return paused;
    }
  };
}

// ../../sdk/br-core.js
init_three_shim();

// ../../sdk/br-ui.js
init_click();
var CSS4 = `
:host{all:initial}
*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
iframe{position:fixed;inset:0;width:100vw;height:100vh;border:0;margin:0;padding:0;background:transparent;color-scheme:normal;
  opacity:0;pointer-events:none;transition:opacity .25s ease;z-index:1}
iframe.on{opacity:1;pointer-events:auto}
.pill{position:fixed;right:18px;bottom:18px;z-index:3;pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:10px;border:0;
  padding:10px 18px 10px 10px;border-radius:999px;font-weight:800;font-size:14px;line-height:1.1;color:#fff;text-align:left;
  background:linear-gradient(120deg,var(--p),var(--s));box-shadow:0 8px 28px rgba(0,0,0,.35),inset 0 0 0 2px rgba(255,255,255,.6);
  transition:transform .2s,opacity .25s;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.pill:hover{transform:translateY(-2px) scale(1.03)}
.pill:focus-visible{outline:3px solid #fff;outline-offset:2px}
.pill small{display:block;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:.85;margin-top:3px}
.ico{width:30px;height:30px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;position:relative}
.ico.gift::before{content:"";width:14px;height:11px;border-radius:2px;background:var(--p);margin-top:4px;box-shadow:inset 0 0 0 0 #fff}
.ico.gift::after{content:"";position:absolute;width:4px;height:15px;left:13px;top:8px;background:var(--s)}
.ico.play::before{content:"";margin-left:3px;border-left:11px solid var(--p);border-top:7px solid transparent;border-bottom:7px solid transparent}
.hide{opacity:0!important;pointer-events:none!important;transform:translateY(10px)!important}
.offer{position:fixed;right:18px;bottom:18px;z-index:3;width:300px;pointer-events:auto;border-radius:20px;overflow:hidden;background:#fff;color:#1d1a33;
  box-shadow:0 18px 50px rgba(0,0,0,.35);transform:translateY(20px);opacity:0;transition:all .35s cubic-bezier(.2,1.3,.4,1)}
.offer.on{transform:none;opacity:1}
.offer header{display:flex;gap:10px;align-items:center;padding:12px 14px;color:#fff;background:linear-gradient(120deg,var(--p),var(--s))}
.offer header b{font-size:15px;font-weight:900;display:block}
.offer header small{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:800;opacity:.9}
.offer p{margin:10px 14px 4px;font-size:13px;font-weight:600;line-height:1.35}
.offer .row{display:flex;gap:8px;padding:10px 14px 14px}
.offer button{flex:1;border:0;border-radius:999px;padding:10px 12px;font-weight:800;font-size:14px;cursor:pointer}
.offer .go{background:var(--p);color:#fff}
.offer .no{background:#efecf5;color:#1d1a33}
.offer .bar{height:4px;background:var(--s);transform-origin:left;transition:transform linear}
.chip{position:fixed;left:50%;bottom:24px;transform:translate(-50%,16px);opacity:0;z-index:4;display:flex;gap:10px;align-items:center;pointer-events:auto;
  padding:8px 8px 8px 14px;border-radius:999px;background:rgba(20,16,40,.9);color:#fff;font-size:13px;font-weight:700;transition:all .3s;white-space:nowrap}
.chip.on{opacity:1;transform:translate(-50%,0)}
.chip small{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;opacity:.7;font-weight:800}
.chip a{color:#1d1a33;background:#fff;border-radius:999px;padding:6px 12px;text-decoration:none;font-weight:800}
.chip button{border:0;background:none;color:#fff;opacity:.6;cursor:pointer;font-size:16px;padding:0 6px}
.toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;z-index:4;padding:10px 16px;border-radius:999px;background:rgba(20,16,40,.88);
  color:#fff;font-size:13px;font-weight:700;transition:all .3s;pointer-events:none;white-space:nowrap}
.toast.on{opacity:1;transform:translate(-50%,0)}
`;
var esc5 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var BR_PAL = { primary: "#6b4dff", secondary: "#ff5d8f" };
function createUi() {
  const holder = document.createElement("div");
  holder.setAttribute("data-bonusround", "");
  holder.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;";
  const root = holder.attachShadow ? holder.attachShadow({ mode: "open" }) : holder;
  root.innerHTML = `<style>${CSS4}</style><div class="toast"></div>`;
  holder.style.setProperty("--p", BR_PAL.primary);
  holder.style.setProperty("--s", BR_PAL.secondary);
  document.documentElement.appendChild(holder);
  const toastEl = root.querySelector(".toast");
  let toastT = 0, rewardedBtn = null, offerEl = null;
  const palette = (el, pal) => {
    el.style.setProperty("--p", pal?.primary || BR_PAL.primary);
    el.style.setProperty("--s", pal?.secondary || BR_PAL.secondary);
  };
  function gameCanvas() {
    let best = null, area = 0;
    for (const c of document.querySelectorAll("canvas")) {
      const r4 = c.getBoundingClientRect(), a = r4.width * r4.height;
      if (a > area) {
        area = a;
        best = c;
      }
    }
    return best;
  }
  return {
    holder,
    toast(text, ms = 2600) {
      toastEl.textContent = text;
      toastEl.classList.add("on");
      clearTimeout(toastT);
      toastT = setTimeout(() => toastEl.classList.remove("on"), ms);
    },
    /** "Sponsored by <brand> · Learn more" chip, shown when the player interacts with an ambient prop */
    sponsorChip({ brand: brand2, url, onClick, ms = 6e3 }) {
      root.querySelector(".chip")?.remove();
      const el = document.createElement("div");
      el.className = "chip";
      el.innerHTML = `<span><small>Ad</small> ${esc5(brand2 || "Brand")}</span>${url ? `<a href="${esc5(ctaHref(url, { placement: "toast", format: "prop" }))}" target="_blank" rel="noopener sponsored">Learn more \u2197</a>` : ""}<button type="button" aria-label="Dismiss">\xD7</button>`;
      el.querySelector("a")?.addEventListener("click", () => onClick?.());
      el.querySelector("button").addEventListener("click", () => el.remove());
      root.appendChild(el);
      requestAnimationFrame(() => el.classList.add("on"));
      setTimeout(() => {
        el.classList.remove("on");
        setTimeout(() => el.remove(), 400);
      }, ms);
    },
    /** full-viewport transparent iframe for overlay rounds */
    roundFrame(src) {
      const f = document.createElement("iframe");
      f.title = "Bonus Round";
      f.allow = "autoplay; fullscreen; gamepad";
      f.setAttribute("allowtransparency", "true");
      f.src = src;
      root.appendChild(f);
      return {
        el: f,
        show() {
          if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
          f.classList.add("on");
          f.focus();
          try {
            f.contentWindow.focus();
          } catch {
          }
        },
        remove() {
          f.classList.remove("on");
          try {
            f.blur();
          } catch {
          }
          const c = gameCanvas();
          window.focus();
          if (c && c.tabIndex >= 0) c.focus({ preventScroll: true });
          else if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur?.();
          setTimeout(() => f.remove(), 300);
        }
      };
    },
    rewardedButton(label, onClick) {
      rewardedBtn?.remove();
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pill";
      b.innerHTML = `<span class="ico gift"></span><span>${esc5(label)}<small>Ad \xB7 bonusround.io \xB7 15 s</small></span>`;
      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      b.addEventListener("keydown", (e) => e.stopPropagation());
      root.appendChild(b);
      rewardedBtn = b;
      return {
        el: b,
        hide(on = true) {
          b.classList.toggle("hide", on);
        },
        remove() {
          b.remove();
          if (rewardedBtn === b) rewardedBtn = null;
        }
      };
    },
    hideRewarded(on) {
      rewardedBtn?.classList.toggle("hide", on);
    },
    /** interval offer: resolves true (play) or false (dismissed / timed out) */
    offer({ brand: brand2, palette: pal, seconds = 10 }) {
      offerEl?.remove();
      const el = document.createElement("div");
      el.className = "offer";
      palette(el, pal);
      el.innerHTML = `<header><span class="ico play"></span><span><small>Ad \xB7 bonusround.io \xB7 15 s</small><b>${esc5(brand2 || "Bonus Round")}</b></span></header>
        <p>Jump into a quick sponsored round, then you're straight back in the game.</p>
        <div class="row"><button class="no" type="button">Not now</button><button class="go" type="button">Play</button></div><div class="bar"></div>`;
      root.appendChild(el);
      offerEl = el;
      rewardedBtn?.classList.add("hide");
      return new Promise((resolve) => {
        const bar = el.querySelector(".bar");
        requestAnimationFrame(() => {
          el.classList.add("on");
          bar.style.transitionDuration = `${seconds}s`;
          bar.style.transform = "scaleX(0)";
        });
        const done = (v) => {
          clearTimeout(t);
          el.classList.remove("on");
          setTimeout(() => el.remove(), 350);
          if (offerEl === el) offerEl = null;
          rewardedBtn?.classList.remove("hide");
          resolve(v);
        };
        const t = setTimeout(() => done(false), seconds * 1e3);
        el.querySelector(".go").addEventListener("click", (e) => {
          e.stopPropagation();
          done(true);
        });
        el.querySelector(".no").addEventListener("click", (e) => {
          e.stopPropagation();
          done(false);
        });
        el.addEventListener("keydown", (e) => e.stopPropagation());
      });
    }
  };
}

// ../../sdk/bots.js
function tag(THREE, name, color) {
  const c = document.createElement("canvas"), g = c.getContext("2d");
  g.font = "800 44px system-ui, sans-serif";
  const w = Math.ceil(g.measureText(name).width) + 64;
  c.width = w;
  c.height = 72;
  g.font = "800 44px system-ui, sans-serif";
  g.fillStyle = "rgba(35,38,74,0.72)";
  g.beginPath();
  g.roundRect ? g.roundRect(2, 2, w - 4, 68, 34) : g.rect(2, 2, w - 4, 68);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.arc(30, 36, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#fff";
  g.textBaseline = "middle";
  g.fillText(name, 48, 38);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(0.36 * w / 72, 0.36, 1);
  s.position.y = 2.3;
  s.renderOrder = 20;
  return s;
}
function createBots(THREE, scene, opts = {}) {
  const tracers = createTracers(THREE, scene);
  const root = new THREE.Group();
  root.name = "BonusRoundBots";
  root.visible = false;
  scene.add(root);
  const body = new THREE.CapsuleGeometry(0.46, 0.86, 6, 16);
  const eye = new THREE.SphereGeometry(0.12, 12, 8), pupil = new THREE.SphereGeometry(0.06, 10, 6);
  const white = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.3 });
  const black = new THREE.MeshStandardMaterial({ color: "#1b1d33", roughness: 0.3 });
  const bots = /* @__PURE__ */ new Map();
  return {
    root,
    add(p) {
      if (!p.bot || bots.has(p.id)) return;
      const g = new THREE.Group(), pivot = new THREE.Group();
      g.add(pivot);
      const mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.35 });
      const b = new THREE.Mesh(body, mat);
      b.position.y = 0.89;
      b.castShadow = true;
      pivot.add(b);
      for (const s of [-1, 1]) {
        const e = new THREE.Mesh(eye, white);
        e.scale.set(1, 1.25, 0.55);
        e.position.set(0.15 * s, 1.42, 0.4);
        pivot.add(e);
        const q = new THREE.Mesh(pupil, black);
        q.position.set(0.16 * s, 1.4, 0.47);
        pivot.add(q);
      }
      g.add(tag(THREE, p.name, p.color));
      const v = new THREE.Vector3(...p.p || [0, 0, 0]);
      g.position.copy(v);
      root.add(g);
      bots.set(p.id, { g, pivot, mat, target: v.clone(), ry: p.ry || 0, last: v.clone(), t: Math.random() * 6 });
    },
    /** a bot's claim of a target at `to` (world Vector3): the visible trace of a hidden bot */
    shot(id, to) {
      const b = bots.get(id);
      if (!b || !to) return;
      tracers.fire(b.g.position.clone().add(new THREE.Vector3(0, 1.35, 0)), to, "#" + b.mat.color.getHexString());
    },
    hidden: !!opts.hideBodies,
    snap(rows) {
      for (const [id, x, y, z, ry] of rows) {
        const b = bots.get(id);
        if (b) {
          b.target.set(x, y, z);
          b.ry = ry;
        }
      }
    },
    update(dt, visible) {
      tracers.update(dt);
      root.visible = visible && !opts.hideBodies;
      if (!visible) return;
      for (const b of bots.values()) {
        b.last.copy(b.g.position);
        if (b.g.position.distanceTo(b.target) > 25) b.g.position.copy(b.target);
        else b.g.position.lerp(b.target, 1 - Math.exp(-14 * dt));
        let d = b.ry - b.g.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        b.g.rotation.y += d * Math.min(1, dt * 10);
        const sp = Math.hypot(b.g.position.x - b.last.x, b.g.position.z - b.last.z) / Math.max(dt, 1e-3);
        b.t += dt * (5 + sp * 1.6);
        const k = Math.min(sp / 6, 1);
        b.pivot.position.y = b.g.position.y > 0.05 ? 0 : Math.abs(Math.sin(b.t)) * 0.09 * k;
        b.pivot.rotation.z = Math.sin(b.t) * 0.06 * k;
      }
    }
  };
}
function createTracers(THREE, scene) {
  const root = new THREE.Group();
  root.name = "BonusRoundTracers";
  scene.add(root);
  const geo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  geo.translate(0, 0.5, 0);
  geo.rotateX(Math.PI / 2);
  const spark = new THREE.SphereGeometry(1, 10, 8);
  const live = [];
  return {
    root,
    fire(from, to, color = "#ffffff") {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const beam = new THREE.Mesh(geo, mat);
      beam.position.copy(from);
      beam.lookAt(to);
      beam.scale.set(0.035, 0.035, from.distanceTo(to));
      const s = new THREE.Mesh(spark, mat);
      s.position.copy(to);
      s.scale.setScalar(0.18);
      root.add(beam, s);
      live.push({ beam, s, mat, age: 0 });
    },
    update(dt) {
      for (let i = live.length - 1; i >= 0; i--) {
        const t = live[i];
        t.age += dt;
        const k = Math.max(0, 1 - t.age / 0.45);
        t.mat.opacity = 0.9 * k;
        t.s.scale.setScalar(0.18 + t.age * 1.2);
        if (k <= 0) {
          root.remove(t.beam, t.s);
          t.mat.dispose();
          live.splice(i, 1);
        }
      }
    },
    dispose() {
      for (const t of live) {
        root.remove(t.beam, t.s);
        t.mat.dispose();
      }
      live.length = 0;
      scene.remove(root);
      geo.dispose();
      spark.dispose();
    }
  };
}

// ../../sdk/host-session.js
var CHIP_CSS = `:host{all:initial}
button{all:unset;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483647;cursor:pointer;
  display:flex;align-items:center;gap:10px;padding:12px 20px 12px 14px;border-radius:999px;background:rgba(20,16,40,.86);color:#fff;
  font:800 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 0 0 2px rgba(255,255,255,.25);
  animation:in .3s cubic-bezier(.2,1.4,.4,1)}
button:hover{background:rgba(20,16,40,.95)}
button:focus-visible{outline:3px solid #fff;outline-offset:3px}
i{width:22px;height:22px;border-radius:50%;background:#fff;position:relative;flex:none}
i::after{content:"";position:absolute;left:6px;top:5px;width:6px;height:9px;border:2px solid #1d1a33;border-radius:5px 5px 6px 6px}
small{font-weight:600;opacity:.7;font-size:12px}
@keyframes in{from{opacity:0;transform:translate(-50%,-40%) scale(.9)}}`;
function createHostSession() {
  let lockedEl = null, kbLocked = false, chip = null;
  const removeChip = () => {
    chip?.remove();
    chip = null;
    document.removeEventListener("pointerlockchange", onLockChange);
  };
  const onLockChange = () => {
    if (document.pointerLockElement) removeChip();
  };
  return {
    get lockedEl() {
      return lockedEl;
    },
    /** call at round start, from inside the game's document */
    begin() {
      removeChip();
      lockedEl = document.pointerLockElement || null;
      try {
        if (lockedEl && document.exitPointerLock) document.exitPointerLock();
      } catch {
      }
      try {
        if (navigator.keyboard?.unlock) {
          navigator.keyboard.unlock();
          kbLocked = true;
        }
      } catch {
      }
    },
    /** call when the round is over and the game is visible again */
    end() {
      const el = lockedEl;
      lockedEl = null;
      if (!el || !el.isConnected || document.pointerLockElement) return;
      const holder = document.createElement("div");
      holder.setAttribute("data-bonusround-resume", "");
      const root = holder.attachShadow ? holder.attachShadow({ mode: "open" }) : holder;
      root.innerHTML = `<style>${CHIP_CSS}</style><button type="button"><i></i><span>Click to resume <small>\xB7 back to the game</small></span></button>`;
      const btn = root.querySelector("button");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeChip();
        try {
          const p = el.requestPointerLock?.();
          if (p && typeof p.catch === "function") p.catch(() => {
          });
        } catch {
        }
        void kbLocked;
      });
      document.documentElement.appendChild(holder);
      chip = holder;
      document.addEventListener("pointerlockchange", onLockChange);
      btn.focus({ preventScroll: true });
    },
    dispose() {
      removeChip();
    }
  };
}

// ../../sdk/br-core.js
init_host_three();
init_countdown();
init_proximity();
init_viewability();
init_click();

// ../../sdk/ivt.js
var now = () => performance.now();
var S2 = { on: false, inputs: [], holds: [], down: /* @__PURE__ */ new Map(), vis: [], foc: [], ratio: null, ov: null, rounds: /* @__PURE__ */ new Map(), gl: void 0, glv: null, px: 0, py: 0, np: null, cdp: false };
var MOVE_KEYS = /* @__PURE__ */ new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "ShiftLeft", "ShiftRight"]);
function glRenderer() {
  if (S2.gl !== void 0) return S2.gl;
  S2.gl = null;
  try {
    const c = document.createElement("canvas");
    const g = c.getContext("webgl") || c.getContext("experimental-webgl");
    const ext = g && g.getExtension("WEBGL_debug_renderer_info");
    S2.gl = g ? String(g.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : g.RENDERER) || "").slice(0, 120) : null;
    S2.glv = g ? String(g.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : g.VENDOR) || "").slice(0, 60) : null;
    g?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    S2.gl = null;
  }
  return S2.gl;
}
function automationCount() {
  let n = 0;
  try {
    const w = window;
    for (const k of ["__playwright__binding__", "__pwInitScripts", "_playwrightRecorder", "__puppeteer_evaluation_script__", "callPhantom", "_phantom", "__nightmare", "domAutomation", "domAutomationController", "_selenium", "__selenium_unwrapped", "__webdriver_evaluate", "__driver_evaluate", "__webdriverFunc", "__lastWatirAlert"]) if (k in w) n++;
    for (const k of Object.keys(document)) if (/^\$?cdc_|^\$wdc_|webdriver/i.test(k)) n++;
    if (document.documentElement?.getAttribute("webdriver") != null) n++;
  } catch {
  }
  return n;
}
var fnv = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
};
function startIvt() {
  if (S2.on || typeof window === "undefined") return;
  S2.on = true;
  const t = now();
  S2.vis.push([t, document.visibilityState === "visible"]);
  S2.foc.push([t, document.hasFocus ? document.hasFocus() : true]);
  const add = (k) => (e) => {
    if (k === "m" && document.pointerLockElement) {
      S2.px += e.movementX || 0;
      S2.py += e.movementY || 0;
    }
    const locked = k === "m" && !!document.pointerLockElement;
    const x = locked ? S2.px : e.clientX ?? e.touches?.[0]?.clientX ?? null, y = locked ? S2.py : e.clientY ?? e.touches?.[0]?.clientY ?? null;
    const kc = k === "k" ? MOVE_KEYS.has(e.code) ? "v" : "o" : k;
    S2.inputs.push({ t: now(), k: kc, x, y, tr: e.isTrusted !== false });
    if (S2.inputs.length > 1500) S2.inputs.splice(0, 500);
  };
  const opt = { passive: true, capture: true };
  addEventListener("pointermove", add("m"), opt);
  addEventListener("pointerdown", add("d"), opt);
  addEventListener("touchstart", add("d"), opt);
  addEventListener("wheel", add("w"), opt);
  addEventListener("keydown", (e) => {
    if (e.repeat) return;
    add("k")(e);
    S2.down.set(e.code, now());
  }, opt);
  addEventListener("keyup", (e) => {
    const d = S2.down.get(e.code);
    if (d != null) {
      S2.holds.push({ t: now(), ms: now() - d });
      S2.down.delete(e.code);
      if (S2.holds.length > 300) S2.holds.splice(0, 100);
    }
  }, opt);
  document.addEventListener("visibilitychange", () => S2.vis.push([now(), document.visibilityState === "visible"]));
  addEventListener("focus", () => S2.foc.push([now(), true]));
  addEventListener("blur", () => S2.foc.push([now(), false]));
  try {
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          S2.ratio = e.intersectionRatio;
          if (typeof e.isVisible === "boolean") S2.ov = e.isVisible;
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], trackVisibility: true, delay: 250 }
    );
    io.observe(document.documentElement);
  } catch {
  }
  try {
    if (typeof Notification !== "undefined" && navigator.permissions?.query) navigator.permissions.query({ name: "notifications" }).then((p) => {
      S2.np = Notification.permission === "denied" && p.state === "prompt";
    }, () => {
    });
  } catch {
  }
  try {
    const e = new Error("");
    Object.defineProperty(e, "stack", { get() {
      S2.cdp = true;
      return "";
    } });
    console.debug(e);
  } catch {
  }
}
function onMs(log2, from, to) {
  let ms = 0, state = log2.length ? log2[0][1] : true, at = from;
  for (const [t, v] of log2) {
    if (t <= from) {
      state = v;
      continue;
    }
    if (t >= to) break;
    if (state) ms += t - at;
    at = t;
    state = v;
  }
  if (state) ms += to - at;
  return Math.max(0, ms);
}
var changes = (log2, from, to) => log2.filter(([t]) => t > from && t < to).length;
var r3 = (v) => Math.round(v * 1e3) / 1e3;
var cvOf = (xs) => {
  if (xs.length < 4) return null;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  if (!(m > 0)) return 0;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  return r3(sd / m);
};
var mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
function inputStats(from, full) {
  const ev = S2.inputs.filter((e) => e.t >= from);
  const discrete = ev.filter((e) => e.k === "v" || e.k === "o" || e.k === "d").map((e) => e.t);
  const gaps = discrete.slice(1).map((t, i) => t - discrete[i]).filter((g) => g < 5e3);
  const holds = S2.holds.filter((h) => h.t >= from).map((h) => h.ms);
  const mv = ev.filter((e) => e.k === "m" && e.x != null);
  let path = 0, disp = 0, turns = 0, pauses = 0, jitter = 0, curv = 0;
  const bins = new Array(8).fill(0), speeds = [];
  for (let i = 1, start = mv[0]; i < mv.length; i++) {
    const a = mv[i - 1], b = mv[i], dt = b.t - a.t;
    if (dt > 250) {
      pauses++;
      disp += start ? Math.hypot(a.x - start.x, a.y - start.y) : 0;
      start = b;
      continue;
    }
    const step = Math.hypot(b.x - a.x, b.y - a.y);
    path += step;
    if (dt > 0) speeds.push(step / dt);
    if (i >= 2 && mv[i - 2]) {
      const p = mv[i - 2];
      const a1 = Math.atan2(a.y - p.y, a.x - p.x), a2 = Math.atan2(b.y - a.y, b.x - a.x);
      let d = a2 - a1;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      if (step > 0.5) {
        bins[Math.min(7, Math.floor((d + Math.PI) / (2 * Math.PI) * 8))]++;
        turns++;
        curv += Math.abs(d);
        if (Math.abs(d) > 1.2 && step < 4) jitter++;
      }
    }
    if (i === mv.length - 1) disp += start ? Math.hypot(b.x - start.x, b.y - start.y) : 0;
  }
  const ent = turns ? -bins.filter(Boolean).reduce((s, c) => s + c / turns * Math.log2(c / turns), 0) : null;
  const med = holds.length >= 4 ? [...holds].sort((a, b) => a - b)[holds.length >> 1] : null;
  const out = {
    n: ev.length,
    cv: cvOf(gaps),
    kv: holds.length >= 4 ? cvOf(holds) : null,
    kh: med == null ? null : Math.round(med),
    mv: path > 50 ? r3(Math.min(1, disp / path)) : null,
    ang: ent == null || turns < 20 ? null : Math.round(ent * 100) / 100,
    tr: ev.length ? r3(ev.filter((e) => e.tr).length / ev.length) : null
  };
  if (!full) return out;
  const counts = {};
  for (const e of ev) counts[e.k] = (counts[e.k] || 0) + 1;
  let last = from;
  const tl = ev.slice(-400).map((e) => {
    const d = Math.max(0, Math.round(e.t - last));
    last = e.t;
    return `${e.k}${d}`;
  }).join(" ");
  return {
    ...out,
    counts,
    gapMean: gaps.length ? Math.round(mean(gaps)) : null,
    path: { len: Math.round(path), speed: speeds.length ? r3(mean(speeds)) : null, speedCv: cvOf(speeds), curv: turns ? r3(curv / turns) : null, jitter, pauses },
    tl
  };
}
function ivtSignals(key = null, { full = false } = {}) {
  startIvt();
  let fr = false;
  try {
    fr = window.top !== window.self;
  } catch {
    fr = true;
  }
  const nav = navigator, uad = nav.userAgentData;
  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  })();
  const base = {
    wd: nav.webdriver === true,
    au: automationCount(),
    gl: glRenderer(),
    fr,
    vw: Math.round(innerWidth),
    vh: Math.round(innerHeight),
    sw: screen?.width || null,
    sh: screen?.height || null,
    vis: fr && S2.ratio != null ? Math.round(S2.ratio * 100) / 100 : null,
    ov: fr ? S2.ov : null,
    pl: nav.plugins?.length ?? null,
    ch: typeof window.chrome === "object",
    np: S2.np,
    cdp: S2.cdp,
    uab: uad?.brands ? uad.brands.map((b) => b.brand).join(",").slice(0, 120) : null,
    fp: fnv([glRenderer(), screen?.width, screen?.height, devicePixelRatio, tz, nav.language, nav.hardwareConcurrency, nav.deviceMemory, nav.platform, nav.maxTouchPoints].join("|"))
  };
  if (full) Object.assign(base, {
    glv: S2.glv,
    dpr: devicePixelRatio,
    tz,
    lang: nav.language,
    cores: nav.hardwareConcurrency ?? null,
    mem: nav.deviceMemory ?? null,
    uap: uad?.platform ?? null,
    uam: uad?.mobile ?? null,
    ref: (() => {
      try {
        return document.referrer ? new URL(document.referrer).hostname : null;
      } catch {
        return null;
      }
    })()
  });
  if (!key) return base;
  if (!S2.rounds.has(key)) {
    S2.rounds.set(key, now());
    if (S2.rounds.size > 20) S2.rounds.delete(S2.rounds.keys().next().value);
  }
  const from = S2.rounds.get(key), to = now();
  return {
    ...base,
    rm: Math.round(to - from),
    hid: Math.round(to - from - onMs(S2.vis, from, to)),
    foc: Math.round(onMs(S2.foc, from, to)),
    ...full ? { visChanges: changes(S2.vis, from, to), focChanges: changes(S2.foc, from, to) } : {},
    ...inputStats(from, full)
  };
}

// ../../sdk/br-core.js
var ctaAs = (cta, fm) => cta ? { ...cta, url: withFormat(cta.url, fm) } : null;
var DEFAULT_SETTINGS = {
  formats: { takeover: { enabled: true, triggers: ["intermission", "rewarded"], intervalSec: 300 }, ambient: { enabled: true } },
  frequencyCap: { perHour: 0 }
};
var unfilled = (reason, extra = {}) => ({ filled: false, completed: false, reason, ...extra });
var clamp7 = (v, a, b) => Math.max(a, Math.min(b, v));
var sleep2 = (ms) => new Promise((r4) => setTimeout(r4, ms));
var timeout = (p, ms, v) => Promise.race([p, sleep2(ms).then(() => v)]);
var WARNINGS = [];
function warn(msg, err) {
  const text = `${msg}${err ? `: ${err?.message || err}` : ""}`;
  WARNINGS.push({ at: (/* @__PURE__ */ new Date()).toISOString(), text: text.slice(0, 300) });
  if (WARNINGS.length > 10) WARNINGS.shift();
  if (err !== void 0) console.warn(`[bonusround] ${msg}`, err);
  else console.warn(`[bonusround] ${msg}`);
}
var KEYS = ["br_pid", "br_rounds", "br_captions"];
var mem = /* @__PURE__ */ new Map();
var allowStorage = false;
function forgetStored() {
  try {
    for (const k of KEYS) localStorage.removeItem(k);
  } catch {
  }
}
var SESSION_ID = "s_" + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => (b % 36).toString(36)).join("");
function store(key, fallback) {
  if (!allowStorage) return mem.has(key) ? mem.get(key) : fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return mem.has(key) ? mem.get(key) : fallback;
  }
}
function save(key, v) {
  mem.set(key, v);
  if (allowStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
    }
  }
}
function setStorage(on) {
  if (allowStorage && !on) {
    try {
      for (const k of KEYS) localStorage.removeItem(k);
    } catch {
    }
  }
  if (!allowStorage && on) {
    for (const [k, v] of mem) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
      }
    }
  }
  allowStorage = on;
}
function playerId() {
  let id = store("br_pid", null);
  if (typeof id !== "string" || !/^p_[a-z0-9]{8,}$/.test(id)) {
    id = "p_" + Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => (b % 36).toString(36)).join("");
    save("br_pid", id);
  }
  return id;
}
function mergeSettings(s) {
  const t = s?.formats?.takeover || {}, a = s?.formats?.ambient || {};
  return {
    formats: {
      takeover: { ...DEFAULT_SETTINGS.formats.takeover, ...t, triggers: Array.isArray(t.triggers) ? t.triggers : DEFAULT_SETTINGS.formats.takeover.triggers },
      ambient: { ...DEFAULT_SETTINGS.formats.ambient, ...a }
    },
    frequencyCap: { ...DEFAULT_SETTINGS.frequencyCap, ...s?.frequencyCap || {} }
  };
}
function pageBreak(phase, ms = 0) {
  try {
    const g = window.__BONUSROUND_BREAK__ || (window.__BONUSROUND_BREAK__ = {});
    if (phase === "start") Object.assign(g, { format: "brandworld", active: true, startedAt: Date.now(), endedAt: null, ms });
    else Object.assign(g, { active: false, held: false, endedAt: Date.now() });
    window.dispatchEvent(new CustomEvent("bonusround:break", { detail: { phase, format: "brandworld", ms } }));
  } catch {
  }
}
function createCore(env) {
  return new Core(env);
}
var Core = class {
  constructor(env) {
    Object.assign(this, env);
    this.childDirected = false;
    this.contextual = true;
    this.privacy = { contextualOnly: true, reasons: ["pending"] };
    setStorage(this.storageAllowed());
    this.playerId = SESSION_ID;
    this.state.ping?.then?.((p) => {
      if (p) this._privacyFrom(p);
    }, () => {
    });
    this.settings = mergeSettings(null);
    this.world = null;
    this.testMode = null;
    this.mode = null;
    this.attached = null;
    this.busy = false;
    this.beacons = [];
    this.requests = [];
    this.sentOnce = /* @__PURE__ */ new Set();
    this.frameCbs = [];
    this.lastInput = performance.now();
    this.lastRoundAt = 0;
    this.lastOfferAt = 0;
    this.measure = { speeds: [], last: null };
    this.ui = null;
    this.session = createHostSession();
    const input = () => {
      this.lastInput = performance.now();
    };
    for (const t of ["keydown", "pointerdown", "wheel", "touchstart"]) addEventListener(t, input, { passive: true, capture: true });
    addEventListener("pointermove", () => {
      if (document.pointerLockElement) input();
    }, { passive: true, capture: true });
    if (!this.state.agent && !this.state.loadOffline && typeof window !== "undefined") this._autoStart();
  }
  /** tag-only mode (sdk/tag-only.js): the game never calls attach() → auto-attach 3 s after its first render */
  _autoStart() {
    import(`${this.base}/sdk/tag-only.js?v=${this.version}`).then((m) => {
      if (!this.attaching && !this.attached) this.tagOnlyCtl = m.startTagOnly(this);
    }).catch(() => {
    });
  }
  /** the developer's own attach() after tag-only mode auto-attached: theirs wins, nothing is attached twice */
  async _takeOver(o) {
    const a = this.attached;
    this.autoAttached = false;
    this.forceTest = false;
    const sameScene = (!o.scene || o.scene === a.scene) && !o.host && !o.worldRoot;
    console.info(`[bonusround] attach() took over from tag-only mode${sameScene ? " (same scene: the ambient prop stays)" : ""}`);
    if (sameScene) {
      Object.assign(a, { THREE: o.THREE || a.THREE, camera: o.camera || a.camera, renderer: o.renderer || a.renderer, explicitScene: !!o.scene, hudDock: o.hudDock === "top-right" ? "top-right" : a.hudDock });
      this.emitter.emit("attach", { mode: this.mode, takeover: true });
      return { mode: this.mode, playerId: this.playerId, takeover: true };
    }
    this._dropAmbient();
    if (this.autoHint && this.state.ambientHint === this.autoHint) this.state.ambientHint = null;
    this.attached = null;
    this.attaching = this._attach(o).finally(() => {
      this.attaching = null;
    });
    return this.attaching.then((r4) => ({ ...r4, takeover: true }));
  }
  _dropAmbient() {
    try {
      const amb = this.ambient;
      if (amb) {
        amb.px?.dispose();
        amb.built?.group.parent?.remove(amb.built.group);
        amb.built?.dispose?.();
      }
    } catch {
    }
    try {
      this.hostProx?.dispose();
      this.hostProp?.dispose();
    } catch {
    }
    this.ambient = null;
    this.hostProp = null;
    this.hostProx = null;
  }
  // ---------- attach ----------
  attach(o) {
    if (!o.__auto) this.tagOnlyCtl?.stop("attach");
    if (this.attached && this.autoAttached && !o.__auto) return this._takeOver(o);
    if (this.attached) return Promise.resolve({ mode: this.mode, already: true });
    if (this.attaching) return this.attaching.then((r4) => ({ ...r4, already: true }));
    this.attaching = this._attach(o).finally(() => {
      this.attaching = null;
    });
    return this.attaching;
  }
  /** break()/rewarded() called while attach() is still in flight (e.g. the line after a queued attach) wait for it (≤10 s) */
  async _whenAttached(what) {
    if (this.attached) return true;
    if (this.attaching) {
      await timeout(this.attaching.catch(() => null), 1e4, null);
      if (this.attached) return true;
    }
    warn(`${what}() called before attach(): call BonusRound.attach({ THREE, scene, camera, renderer }) first`);
    return false;
  }
  async _attach(o) {
    const THREE = o.THREE || window.THREE;
    const scene = o.scene || this.seen.scenes[this.seen.scenes.length - 1];
    const renderer = o.renderer || this.seen.renderers[this.seen.renderers.length - 1];
    let camera = o.camera || null;
    if (!camera && scene) scene.traverse((x) => {
      if (!camera && x.isCamera) camera = x;
    });
    const h0 = o.host || null;
    const wantsNative = !!(h0 && typeof h0.getPlayerPosition === "function" && typeof h0.teleport === "function" && typeof h0.setBounds === "function");
    if (wantsNative && (!THREE || !scene || !renderer || !camera)) throw new Error("BonusRound.attach with a host needs { THREE, scene, camera, renderer }");
    this.repingIfNeeded?.(THREE?.REVISION || this.seen.revision);
    const ping = await timeout(this.state.ping, 2500, null);
    if (ping) {
      this._privacyFrom(ping);
      this.settings = mergeSettings(ping.settings || ping.game?.settings);
      this.world = ping.world || ping.game?.world || null;
      this.testMode = ping.testMode ?? ping.game?.testMode ?? null;
    }
    const h = o.host || null;
    const native = wantsNative;
    this.mode = native ? h.net ? "native-net" : "native-local" : "overlay";
    this.autoAttached = !!o.__auto;
    this.attached = { THREE, scene, camera, renderer, explicitScene: !!o.scene && !o.__auto, worldRoot: o.worldRoot || null, host: h, hudDock: o.hudDock === "top-right" ? "top-right" : "top" };
    this.ui || (this.ui = createUi());
    if (native) this._attachNative(o, h);
    if (!this.looping) {
      this.looping = true;
      this._loop();
    }
    if (this.settings.formats.ambient.enabled !== false) {
      if (THREE && scene && camera) this._ambient().catch((e) => warn("ambient", e));
      else this._ambientHost(scene, renderer).catch(() => {
      });
    }
    this.emitter.emit("attach", { mode: this.mode });
    return { mode: this.mode, playerId: this.playerId };
  }
  _attachNative(o, h) {
    const { THREE, scene, camera, renderer } = this.attached;
    let net = h.net;
    if (!net) {
      const local = this.local = createLocalNet(null, { roundMs: 1e9, interMs: 1e9, boardMs: 9e3, bots: 2, orbs: false });
      local.on("open", () => local.send({ t: "hello", name: "You" }));
      const fp = (o.world?.cameraMode || this.world?.cameraMode) === "first-person" || this.world?.gameplayHooks?.player?.cameraIsPlayer === true;
      this.bots = createBots(THREE, scene, { hideBodies: fp });
      local.on("welcome", (m) => {
        this.localId = m.id;
        for (const p of m.players) this.bots.add(p);
      });
      local.on("join", (m) => this.bots.add(m.player));
      local.on("snap", (m) => this.bots.snap(m.p));
      let ctr = [0, 0, 0], its = [];
      local.on("adRoundStart", (m) => {
        ctr = m.arenaCenter || ctr;
        its = m.items || [];
      });
      local.on("adPicked", (m) => {
        if (!this.bots.hidden || m.by === this.localId || !its[m.i]) return;
        const [x, z, y] = its[m.i];
        this.bots.shot(m.by, new THREE.Vector3(ctr[0] + x, ctr[1] + (Number.isFinite(y) ? y : (o.world?.playerHeightM || 1.8) * 0.55), ctr[2] + z));
      });
      net = { send: local.send, on: local.on };
    } else if (this.state.agent) {
      const AD_MSGS = /* @__PURE__ */ new Set(["ad", "adSoon", "adRoundStart", "adPicked", "adRoundEnd"]), inner = net;
      net = { send: (m) => {
        if (!AD_MSGS.has(m?.t) && m?.t !== "adPickup" && m?.t !== "adMetrics") inner.send(m);
      }, on: (type, cb) => {
        if (!AD_MSGS.has(type)) inner.on(type, cb);
      } };
    } else {
      const inner = net, ROOM = /* @__PURE__ */ new Set(["adSoon", "adRoundStart", "adPicked", "adRoundEnd"]);
      let skipping = false;
      inner.on("adSoon", () => {
        if (this.personalRewarded) skipping = true;
      });
      inner.on("adRoundStart", () => {
        this.serverRoundAt = performance.now();
        if (this.personalRewarded) {
          skipping = true;
          warn("room round skipped: this player is in a rewarded round");
          return;
        }
        skipping = false;
        this.inWorldHandle?.abort?.();
      });
      inner.on("adRoundEnd", () => queueMicrotask(() => {
        skipping = false;
      }));
      net = { ...inner, send: (m) => {
        if (skipping && (m?.t === "adPickup" || m?.t === "adMetrics")) return;
        inner.send(m);
      }, on: (type, cb) => inner.on(type, ROOM.has(type) ? (m) => {
        if (!skipping) cb(m);
      } : cb) };
      net.on("ad", (m) => {
        if (m?.manifestUrl && m.source === "platform") this._noteTakeover({ manifestUrl: new URL(m.manifestUrl, location.href).href, brand: m.brand || null, token: m.token || null }, "room fill");
      });
      net.on("adSoon", (m) => {
        this.serverSoonAt = m?.cancelled ? 0 : performance.now();
      });
    }
    let worldRoot = o.worldRoot;
    if (!worldRoot) {
      worldRoot = new THREE.Group();
      worldRoot.name = "BonusRoundWorldProxy";
      scene.add(worldRoot);
    }
    if (typeof h.onFrame === "function") h.onFrame((dt) => this._runFrame(dt));
    else this.ownFrames = true;
    this.ads = SpatialAds.attach({
      THREE,
      scene,
      camera,
      renderer,
      worldRoot,
      host: {
        getPlayerPosition: () => h.getPlayerPosition(),
        getPlayerId: () => h.getPlayerId ? h.getPlayerId() : this.localId,
        teleport: (v) => h.teleport(v),
        setBounds: (b) => h.setBounds(b),
        setSupport: (fn) => h.setSupport?.(fn),
        onFrame: (cb) => this.frameCbs.push(cb),
        net
      },
      gltfLoader: gltfLoaderFor(this.base, THREE),
      // attach({ world }) from the developer wins over the play agent's measurements (ping → world)
      world: {
        cameraMode: o.world?.cameraMode || this.world?.cameraMode || "third-person",
        playerHeightM: +o.world?.playerHeightM || +this.world?.scale?.playerHeightM || void 0,
        walkSpeedMps: +o.world?.walkSpeedMps || +this.world?.scale?.walkSpeedMps || void 0,
        jumpVelocity: +o.world?.jumpVelocity || void 0,
        gravity: +o.world?.gravity || void 0
      },
      volume: this.state.muted ? 0 : 1,
      storage: this.storageAllowed(),
      hudDock: o.hudDock,
      boardMs: 8e3,
      onEvent: (type, data) => this._roundEvent(type, data)
    });
  }
  _runFrame(dt) {
    for (const cb of this.frameCbs) {
      try {
        cb(dt);
      } catch (e) {
        warn("frame", e);
      }
    }
  }
  /** localStorage is used only when: not config({ storage:false }) / data-storage="none", consent isn't false,
   *  Global Privacy Control is off (or the CMP gave consent), and the game isn't child-directed */
  storageAllowed() {
    const st = this.state;
    if (st.storage === false || st.consent === false || this.childDirected || this.contextual) return false;
    if (navigator.globalPrivacyControl === true && st.consent !== true) return false;
    return true;
  }
  /** contextual-only: the server says so (ping.privacy), or this page may not store anything (GPC, consent, storage:false) */
  contextualOnly() {
    return this.contextual || !this.storageAllowed();
  }
  _privacyFrom(ping) {
    this.childDirected = !!(ping.settings?.directedToChildren || ping.game?.settings?.directedToChildren);
    const p = ping.privacy && typeof ping.privacy === "object" ? ping.privacy : { contextualOnly: true, reasons: ["no_privacy_info"] };
    this.privacy = { contextualOnly: p.contextualOnly !== false, reasons: Array.isArray(p.reasons) ? p.reasons.slice(0, 6) : [] };
    this.contextual = this.privacy.contextualOnly;
    if (this.contextual) forgetStored();
    this._syncIdentity();
  }
  /** storage on → the anonymous persistent id; off → the per-page session id (and nothing stored) */
  _syncIdentity() {
    const on = this.storageAllowed();
    setStorage(on);
    this.playerId = on ? playerId() : SESSION_ID;
    if (this.ads) this.ads.runtime.storage = on;
  }
  configChanged() {
    this.ads?.setVolume(this.state.muted ? 0 : 1);
    this._syncIdentity();
  }
  // ---------- serving ----------
  async _request(format, trigger) {
    if (this.state.agent) return { fill: false, format, trigger, reason: "agent" };
    const test = this.state.test || this.forceTest;
    const body = { pub: this.pub, format, trigger: test ? "test" : trigger, playerId: this.playerId, origin: location.origin, sdkVersion: this.version };
    if (test) {
      body.test = true;
      body.requestedTrigger = trigger;
    }
    if (this.contextualOnly()) body.contextualOnly = true;
    body.iv = this._iv(null);
    let j = null;
    try {
      const res = await timeout(fetch(`${this.api || this.base}/v1/ad`, { method: "POST", mode: "cors", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), 4e3, null);
      noteApi(!!res);
      j = res && res.ok ? await res.json() : null;
    } catch {
      j = null;
      noteApi(false);
    }
    const ad = j && j.fill && j.manifestUrl ? { ...j, fill: true, format, trigger, manifestUrl: new URL(j.manifestUrl, this.base + "/").href } : { fill: false, format, trigger, reason: j?.reason || (j ? "no_fill" : "ad_server_unreachable") };
    this.requests.push({ at: Date.now(), format, trigger, fill: ad.fill, requestId: ad.requestId || null, reason: ad.reason || null, test: !!ad.test });
    if (format === "takeover" && ad.fill) this._noteTakeover(ad, trigger === "rewarded" ? "rewarded fill" : "fill");
    if (ad.fill && ad.cta) registerCta(ad.cta);
    if (this.requests.length > 20) this.requests.shift();
    return ad;
  }
  _beacon(token, type, value, once = true, extra = null) {
    var _a;
    if (!token) return;
    const key = `${token}:${type}`;
    if (once && this.sentOnce.has(key)) return;
    this.sentOnce.add(key);
    const body = { token, type, value: value ?? null, playerId: this.playerId, ...extra || {}, iv: this._iv(token, type) };
    this.beacons.push({ at: Date.now(), type, value: body.value });
    if (this.beacons.length > 50) this.beacons.shift();
    this.emitter.emit("event", { type, value: body.value });
    try {
      if (type === "complete" && this.run?.token === token) (_a = this.run).completeAt || (_a.completeAt = performance.now());
      fetch(`${this.api || this.base}/v1/event`, { method: "POST", mode: "cors", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(() => noteApi(true), () => noteApi(false));
    } catch {
    }
  }
  /** invalid-traffic signals (sdk/ivt.js); no device-trait hash on contextual-only inventory */
  _iv(key, type = null) {
    try {
      const ctxOnly = this.contextualOnly();
      const iv = ivtSignals(key, { full: type === "complete" && !ctxOnly });
      if (ctxOnly) delete iv.fp;
      return iv;
    } catch {
      return null;
    }
  }
  _capped() {
    const per = +this.settings.frequencyCap.perHour || 0;
    if (!per) return false;
    const now2 = Date.now(), list = store("br_rounds", []).filter((t) => now2 - t < 36e5);
    return list.length >= per;
  }
  _noteRound() {
    const now2 = Date.now();
    save("br_rounds", [...store("br_rounds", []).filter((t) => now2 - t < 36e5), now2]);
    this.lastRoundAt = performance.now();
  }
  // ---------- takeover ----------
  async breakRound(trigger = "intermission", opts = {}) {
    if (this.state.agent) return unfilled("agent");
    if (!opts.__internal) {
      this.devBreaks = true;
      if (this.autoAttached) this.tagOnlyCtl?.stop("break");
    }
    if (trigger === "intermission") this.zonesDone?.clear();
    if (!this.attached && !await this._whenAttached("break")) return unfilled("not_attached");
    if (this.busy) return unfilled("busy");
    const bg = typeof window !== "undefined" ? window.__BONUSROUND_BREAK__ : null;
    if (trigger !== "test" && bg && (bg.active || bg.endedAt && Date.now() - bg.endedAt < 6e4)) return unfilled("frequency_cap");
    const tk = this.settings.formats.takeover;
    if (tk.enabled === false) return unfilled("takeover_disabled");
    if (!["rewarded", "test"].includes(trigger) && Array.isArray(tk.triggers) && !tk.triggers.includes(trigger)) return unfilled("trigger_disabled");
    if (trigger !== "test" && this._capped()) return unfilled("frequency_cap");
    const gap = breakGuard(this, trigger);
    if (gap) return unfilled(gap);
    if (this.mode === "native-net") return this._serverRound(trigger);
    const pre = trigger === "rewarded" && this.prefetch && Date.now() - this.prefetch.at < 3e5 ? this.prefetch.ad : null;
    if (pre) this.prefetch = null;
    let ad = pre || await this._request("takeover", trigger);
    if (!ad.fill) {
      const off = await this._offlineTestAd(ad, trigger);
      if (!off) return unfilled(ad.reason);
      ad = off;
    }
    return this._play(ad, trigger, opts);
  }
  /** The npm package's bundled test round (the bonusround.io fallback round) (state.loadOffline), so a developer and their agent's headless browser see
   *  a real round when the ad server can't be reached or doesn't know this game yet. Only when this can't be a paid ad: no or a
   *  placeholder publisher id (anything but pub_ + 16 hex), or a test break (break('test'), config({ test:true }), test mode)
   *  that couldn't reach the ad server. A live game whose ad server is unreachable gets nothing: live ads are never faked. */
  async _offlineTestAd(ad, trigger) {
    if (!this.state.loadOffline || ad.reason === "agent") return null;
    const placeholder = !this.pub || !/^pub_[0-9a-f]{16}$/i.test(this.pub);
    const unreachable = ad.reason === "ad_server_unreachable";
    const testBreak = trigger === "test" || !!this.state.test || this.testMode === true;
    const server = this.api || this.base;
    if (!placeholder && !(unreachable && testBreak)) {
      if (unreachable) console.info(`[bonusround] ${server}/v1/ad unreachable: no Bonus Round this break (live ads are never faked). break('test') plays the bundled bonusround.io test round.`);
      return null;
    }
    let mod;
    try {
      mod = await this.state.loadOffline();
    } catch (e) {
      warn("the bundled test round could not load", e);
      return null;
    }
    const why = unreachable ? `${server}/v1/ad is unreachable (network, DNS or firewall)` : `the ad server answered "${ad.reason}"`;
    const who = placeholder ? `${this.pub ? `"${this.pub}" is a placeholder publisher id` : "no publisher id is set"}; get yours at https://bonusround.io/app/games/ (BonusRound.init({ pub }) or the script tag's data-pub)` : "this is a test break";
    console.info(`[bonusround] ${why} and ${who}. Playing the bundled ${String(mod.label || "bonusround.io test round").replace(/^the /, "")} locally (a TEST round): not an ad, nothing is requested or billed. Live ads always come from the ad server.`);
    const off = await mod.offlineTestAd({ trigger });
    this.requests.push({ at: Date.now(), format: "takeover", trigger, fill: true, requestId: null, reason: "offline_test_round", test: true, offline: true });
    return off;
  }
  _newRun(ad, trigger) {
    let resolve;
    const done = new Promise((r4) => {
      resolve = r4;
    });
    this.run = { ad, trigger, token: ad?.token || null, started: false, completed: false, engaged: false, score: 0, viewMs: 0, resolve, done };
    const run = this.run;
    registerCta(ad?.cta, () => ({ score: run.score, completed: run.completed, dwell: run.startedAt ? ((run.completeAt ?? performance.now()) - run.startedAt) / 1e3 : null }));
    return this.run;
  }
  _finish(run, extra = {}) {
    if (!run || run.finished) return;
    run.finished = true;
    this.busy = false;
    this.ui?.hideRewarded(false);
    const out = { filled: true, completed: run.completed, score: run.score, trigger: run.trigger, requestId: run.ad?.requestId || null, brand: run.ad?.brand?.name || null, ...extra };
    if (run.session && run.session !== "inworld") this.session.end();
    if (run.started) this.emitter.emit("end", out);
    this.lastToken = run.token || this.lastToken;
    if (this.run === run) this.run = null;
    run.resolve(out);
  }
  async _play(ad, trigger, opts = {}) {
    this.busy = true;
    this.ui?.hideRewarded(true);
    const run = this._newRun(ad, trigger);
    run.opts = opts || {};
    this._noteRound();
    const maxMs = 6e4;
    const pocket = async () => {
      if (this.mode === "overlay") {
        this._overlayRound(run);
        return null;
      }
      const cur = this.local.core.activeAd;
      const pcta = ctaAs(ad.cta, "arena");
      const sameCta = JSON.stringify(cur?.extra?.cta || null) === JSON.stringify(pcta);
      if (!(cur && cur.url === ad.manifestUrl && sameCta)) {
        const out = await this.local.core.setAd(ad.manifestUrl, { token: ad.token, requestId: ad.requestId, cta: pcta, test: !!ad.test, inWorld: false });
        if (out.error) {
          this._finish(run);
          return unfilled("manifest_error");
        }
      }
      this.local.core.forceAd();
      return null;
    };
    const raw = await timeout(fetch(ad.manifestUrl, { cache: "no-cache" }).then((r4) => r4.ok ? r4.json() : null).catch(() => null), 4e3, null);
    this._prepInWorld(ad, raw);
    const bwBreak = raw?.round?.format === "brandworld" && this.state.brandworld !== false;
    if (bwBreak) pageBreak("start", Math.round(((+raw.round.durationSec || 15) + 24) * 1e3 + 8e3));
    const cd = await coreCountdown(this, run, raw);
    if (!cd.completed) {
      if (bwBreak) pageBreak("end");
      this._finish(run, { filled: false, reason: `countdown_${cd.reason || "cancelled"}` });
      return run.done;
    }
    const fmt = raw?.round?.format;
    if (fmt === "brandworld" && this.state.brandworld !== false) this._brandWorldRound(run, raw, pocket);
    else if ((raw?.round?.takeover?.mode === "in-world" || fmt === "inworld" || raw?.round?.inworld && typeof raw.round.inworld === "object") && this.state.inworld !== false) this._inWorldRound(run, raw, pocket);
    else {
      const err = await pocket();
      if (err) return err;
    }
    return timeout(run.done, maxMs, null).then((r4) => r4 || (this._finish(run, { timedOut: true }), run.done));
  }
  /** the learned world manifest (gameplayHooks, scale, movement) from the ping's worldUrl, fetched once */
  async _worldManifest() {
    if (this.worldFull !== void 0) return this.worldFull;
    const u = this.world?.worldUrl ? new URL(this.world.worldUrl, this.base + "/").href : null;
    this.worldFull = u ? await timeout(fetch(u).then((r4) => r4.ok ? r4.json() : null).catch(() => null), 4e3, null) : null;
    return this.worldFull;
  }
  /** in-world creative: start sdk/inworld/round.js prepareInWorldRound() now (same options _inWorldRound passes) */
  _prepInWorld(ad, raw) {
    const fmt = raw?.round?.format;
    if (!raw || fmt === "brandworld" || this.state.inworld === false || !(raw.round?.takeover?.mode === "in-world" || fmt === "inworld" || raw.round?.inworld)) return;
    const { THREE, scene, camera, renderer } = this.attached || {};
    import(`${this.base}/sdk/inworld/round.js?v=${this.version}`).then((mod) => mod.prepareInWorldRound?.({
      base: this.base,
      manifestUrl: ad.manifestUrl,
      raw,
      THREE: THREE || null,
      renderer,
      scene: this.attached.explicitScene ? scene : null,
      camera: this.attached.explicitScene ? camera : null
    })).catch(() => {
    });
  }
  async _inWorldRound(run, raw, pocket) {
    const { THREE, scene, camera, renderer, host } = this.attached;
    const ad = run.ad;
    let mod = null;
    try {
      mod = await import(`${this.base}/sdk/inworld/round.js?v=${this.version}`);
    } catch (e) {
      warn("in-world runtime unavailable, using the pocket arena", e);
    }
    if (!mod) return pocket();
    const world = { ...this.world || {}, ...await this._worldManifest() || {} };
    run.session = "inworld";
    const r4 = await mod.playInWorldRound({
      // a scene/camera the developer passed are used as given; a guessed one (attach({}): the last scene created, which can
      // be a weapon-viewmodel or HUD scene) is left to the runner, which picks the main scene from the render calls
      base: this.base,
      manifestUrl: ad.manifestUrl,
      raw,
      world,
      THREE: THREE || null,
      scene: this.attached.explicitScene ? scene : null,
      camera: this.attached.explicitScene ? camera : null,
      renderer,
      host: host && typeof host.getPlayerPosition === "function" ? host : null,
      cta: ctaAs(ad.cta, "inworld"),
      muted: this.state.muted,
      storage: this.storageAllowed(),
      name: "You",
      hostSession: this.session,
      onPhase: (p, info) => {
        if (p === "intro") {
          run.visible = true;
          this._started(run);
        }
        if (p === "leaderboard") run.score = info.score ?? run.score;
        if (p === "done") run.visible = false;
      },
      onEvent: (type, value) => {
        if (type === "engagement" && !run.engaged) {
          run.engaged = true;
          this._beacon(run.token, "engagement", 1);
        }
        if (type === "complete") {
          run.completed = true;
          run.score = value ?? run.score;
          this._beacon(run.token, "complete", run.score);
        }
        if (type === "click") this._beacon(run.token, "click", value || ad.cta?.url || null, false);
      },
      onWarn: (m) => warn(m),
      onHandle: (h) => {
        this.inWorldHandle = h;
      }
    });
    this.inWorldHandle = null;
    this.lastInWorld = { fallback: r4.fallback || null, score: r4.score, stats: r4.stats || null };
    if (r4.fallback) {
      warn(`in-world round fell back to the pocket arena (${r4.fallback})`);
      run.visible = false;
      run.session = null;
      const err = await pocket();
      if (err) this._finish(run, { filled: false, reason: "manifest_error" });
      return;
    }
    run.score = r4.score;
    this._finish(run, { inWorld: true });
  }
  // ---------- personal rounds in a server-coordinated game (native-net): the player's own in-world round ----------
  async _personalRound(trigger) {
    if (this.busy) return unfilled("busy");
    if (this.ads?.runtime.round?.active) return unfilled("busy");
    const pre = this.prefetch && Date.now() - this.prefetch.at < 3e5 ? this.prefetch.ad : null;
    if (pre) this.prefetch = null;
    this.busy = true;
    if (trigger === "rewarded") this.personalRewarded = true;
    const ad = pre || await this._request("takeover", trigger);
    if (!ad.fill) {
      this.busy = false;
      this.personalRewarded = false;
      return unfilled(ad.reason);
    }
    const run = this._newRun(ad, trigger);
    run.done.then(() => {
      this.personalRewarded = false;
    }, () => {
      this.personalRewarded = false;
    });
    const raw = await timeout(fetch(ad.manifestUrl, { cache: "no-cache" }).then((r4) => r4.ok ? r4.json() : null).catch(() => null), 4e3, null);
    if (!raw) {
      this._finish(run, { filled: false, reason: "manifest_error" });
      return run.done;
    }
    this._prepInWorld(ad, raw);
    const cd = await coreCountdown(this, run, raw);
    if (!cd.completed) {
      this._finish(run, { filled: false, reason: `countdown_${cd.reason || "cancelled"}` });
      return run.done;
    }
    this._noteRound();
    this._inWorldRound(run, raw, async () => {
      this._finish(run, { filled: false, reason: "inworld_unavailable" });
      return null;
    });
    return timeout(run.done, 6e4, null).then((r4) => r4 || (this._finish(run, { timedOut: true }), run.done));
  }
  // ---------- priming: the ambient prop/portal shows the brand of the player's NEXT takeover ----------
  _noteTakeover(ad, source) {
    const prev = this.nextTakeover;
    this.nextTakeover = { manifestUrl: ad.manifestUrl, brand: ad.brand?.name || null, source, at: Date.now() };
    if (!prev || prev.manifestUrl !== ad.manifestUrl) this._reprime?.();
  }
  /** brand name of a manifest (cached) */
  async _manifestBrand(url) {
    this._brandCache || (this._brandCache = /* @__PURE__ */ new Map());
    if (!this._brandCache.has(url)) this._brandCache.set(url, timeout(fetch(url, { cache: "no-cache" }).then((r4) => r4.ok ? r4.json() : null).then((j) => j ? { name: j.brand?.name || null, raw: j } : null).catch(() => null), 4e3, null));
    return this._brandCache.get(url);
  }
  /**
   * The prop's creative: the ambient fill, unless the player's next takeover is a different brand → that creative (primed).
   * A primed prop is NOT billed (its exposures are recorded in debug().priming only): only an ambient fill of the same
   * brand is. Portals prefetch the rewarded fill they lead to (once), so the portal and the round match from the start.
   */
  async _primeFor(ad, kind) {
    if (kind === "portal_arch" && !this.nextTakeover && !this.prefetch && this.settings.formats.takeover.enabled !== false) {
      const pf = await this._request("takeover", "rewarded");
      if (pf.fill) this.prefetch = { ad: pf, at: Date.now() };
    }
    const nt = this.nextTakeover;
    const amb = await this._manifestBrand(ad.manifestUrl);
    const out = { manifestUrl: ad.manifestUrl, token: ad.token, ambientBrand: amb?.name || ad.brand?.name || null, takeoverBrand: null, primed: false, source: null };
    if (nt && nt.manifestUrl !== ad.manifestUrl) {
      const tb = await this._manifestBrand(nt.manifestUrl);
      out.takeoverBrand = tb?.name || nt.brand;
      if (tb?.raw && tb.name && tb.name !== out.ambientBrand) {
        out.manifestUrl = nt.manifestUrl;
        out.token = null;
        out.primed = true;
        out.source = nt.source;
      }
    } else if (nt) {
      out.takeoverBrand = out.ambientBrand;
      out.source = nt.source;
    }
    this.priming = { ...out, token: void 0, billed: !out.primed, at: (/* @__PURE__ */ new Date()).toISOString() };
    return out;
  }
  // ---------- proximity CTAs (sdk/proximity.js) ----------
  _proxSettings() {
    const a = this.settings.formats.ambient || {};
    const ph = +this.world?.scale?.playerHeightM || +this.attached?.host?.playerHeightM || 1.8;
    const pub = Number.isFinite(+a.proximityM) && a.proximityM !== null ? +a.proximityM : null;
    return {
      radiusM: pub !== null ? clamp7(pub, 3, 6) : clamp7(4 * (ph / 1.8), 3, 6),
      key: chooseKey({ ...this.world || {}, ...this.worldFull || {} }, this.state.proximityKey || a.proximityKey || "E"),
      showMs: Number.isFinite(+a.proximityShowMs) ? clamp7(+a.proximityShowMs, 2e3, 8e3) : 4e3
    };
  }
  /** one proximity CTA for a placed prop. g: { kind, brand, url, center(), top(), normal(), halfWidth, upm, camera(), token } */
  _makeProximity(g) {
    const cfg = this._proxSettings();
    const ev = (type, value) => {
      this.beacons.push({ at: Date.now(), type, value, local: true });
      if (this.beacons.length > 50) this.beacons.shift();
      this.emitter.emit("proximity", { type, ...value });
    };
    let portalEngaged = false;
    const portal = g.kind === "portal_arch";
    const px = createProximity({
      kind: portal ? "portal" : "prop",
      brand: g.brand,
      url: withFormat(g.url, portal ? "portal" : "prop"),
      key: cfg.key,
      radiusM: cfg.radiusM * (g.upm || 1),
      upm: g.upm || 1,
      showMs: cfg.showMs,
      reward: () => this.rewardedHandler?.label || this.settings.formats.takeover.rewardLabel || null,
      camera: g.camera(),
      domElement: this.attached.renderer?.domElement || null,
      dock: this.worldFull?.gameplayHooks?.hud?.dock || this.world?.gameplayHooks?.hud?.dock || this.attached?.hudDock || "top",
      getAnchor: g.top,
      getCenter: g.center,
      getNormal: g.normal,
      facing: facingFor(g.kind),
      portalHalfWidth: g.halfWidth,
      getPlayer: g.player,
      onShown: (info) => ev("proximity_shown", { ...info, brand: g.brand?.name || null }),
      // client + debug only, never billed
      onPortalEnter: () => {
        ev("portal_enter", { brand: g.brand?.name || null });
        if (!portalEngaged && g.token()) {
          portalEngaged = true;
          this._beacon(g.token(), "engagement", 1);
        }
      },
      onPlay: () => this._portalPlay(),
      onLearnMore: () => {
        ev("cta_click", { url: g.url || null });
        if (g.token()) {
          this._beacon(g.token(), "engagement", 1);
          this._beacon(g.token(), "click", g.url || null, false);
        }
      },
      onDismiss: (why, mode) => ev("proximity_dismissed", { why, mode })
    });
    px.cfg = cfg;
    return px;
  }
  /** E on a portal (or "Enter Bonus Round?" accepted): the rewarded round (3 s countdown → in-world / Brand World → onReward) */
  _portalPlay() {
    if (this.busy) return;
    const h = this.rewardedHandler;
    this._rewardedRun(h?.onReward).catch((e) => warn("portal round", e));
  }
  // ---------- live zone takeover: BonusRound.zone(name, { live, countdownEndsAt }) ----------
  /** the game's player is approaching a named zone (a racer's pier): the zone becomes the ad while the game keeps going.
   *  Never a pocket arena or an interstitial: if the in-world zone runtime can't run, nothing plays ({ filled:false }). */
  async zoneRound(zone, opts = {}) {
    if (this.state.agent) return unfilled("agent");
    if (!zone || typeof zone !== "string") return unfilled("bad_zone");
    this.devBreaks = true;
    if (this.autoAttached) this.tagOnlyCtl?.stop("zone");
    if (!this.attached && !await this._whenAttached("zone")) return unfilled("not_attached");
    if (this.busy) return unfilled("busy");
    const tk = this.settings.formats.takeover;
    if (tk.enabled === false) return unfilled("takeover_disabled");
    if (this._capped()) return unfilled("frequency_cap");
    const gap = breakGuard(this, "zone");
    if (gap) return unfilled(gap);
    const zkey = `${zone}:${opts.race ?? ""}`;
    if ((this.zonesDone || (this.zonesDone = /* @__PURE__ */ new Set())).has(zkey)) return unfilled("zone_once_per_race");
    const ce = Number(opts.countdownEndsAt);
    const endsAt = Number.isFinite(ce) && ce > 0 ? ce > 1e12 ? ce : Date.now() + (ce - performance.now()) : Date.now() + 3e3;
    this.busy = true;
    const ad = await this._request("takeover", "zone");
    if (!ad.fill) {
      this.busy = false;
      return unfilled(ad.reason);
    }
    const run = this._newRun(ad, "zone");
    const raw = await timeout(fetch(ad.manifestUrl, { cache: "no-cache" }).then((r5) => r5.ok ? r5.json() : null).catch(() => null), 4e3, null);
    if (!raw?.round || !(raw.round.inworld || raw.round.takeover?.mode === "in-world")) {
      this._finish(run, { filled: false, reason: "not_zone_capable" });
      return run.done;
    }
    let mod = null;
    try {
      mod = await import(`${this.base}/sdk/inworld/zones.js?v=${this.version}`);
    } catch (e) {
      warn("zone runtime unavailable: nothing plays", e);
    }
    if (!mod) {
      this._finish(run, { filled: false, reason: "zone_runtime_unavailable" });
      return run.done;
    }
    this._noteRound();
    this.zonesDone.add(zkey);
    noteBreak(this.__breaks || (this.__breaks = { last: 0, count: 0 }));
    const world = { ...this.world || {}, ...await this._worldManifest() || {} };
    const abs = (p) => typeof p === "string" && p ? new URL(p, ad.manifestUrl).href : null;
    const { renderer } = this.attached;
    run.session = "inworld";
    const native = this.mode !== "overlay";
    const r4 = await mod.runZoneRound({
      base: this.base,
      manifestUrl: ad.manifestUrl,
      raw,
      world,
      zone,
      countdownEndsAt: endsAt,
      graceMs: opts.graceMs,
      THREE: native ? this.attached.THREE || null : null,
      scene: native ? this.attached.scene : null,
      camera: native ? this.attached.camera : null,
      renderer,
      host: null,
      cta: ctaAs(ad.cta, "zone"),
      muted: this.state.muted,
      storage: this.storageAllowed(),
      name: "You",
      brand: { name: raw.brand?.name || ad.brand?.name || "", palette: raw.brand?.palette || null },
      logoUrl: abs(raw.brand?.logo),
      onPhase: (p, info) => {
        if (p === "intro") {
          run.visible = true;
          this._started(run);
        }
        if (p === "leaderboard") run.score = info.score ?? run.score;
        if (p === "done") run.visible = false;
      },
      onEvent: (type, value) => {
        if (type === "engagement" && !run.engaged) {
          run.engaged = true;
          this._beacon(run.token, "engagement", 1);
        }
        if (type === "complete") {
          run.completed = true;
          run.score = value ?? run.score;
          this._beacon(run.token, "complete", run.score);
        }
        if (type === "click") this._beacon(run.token, "click", value || ad.cta?.url || null, false);
      },
      onWarn: (m) => warn(m),
      onHandle: (h) => {
        this.inWorldHandle = h;
      }
    }).catch((e) => {
      warn("zone round failed: nothing plays", e);
      return { played: false, reason: "error" };
    });
    this.inWorldHandle = null;
    this.lastInWorld = { zone, played: !!r4.played, reason: r4.reason || r4.fallback || null, score: r4.score ?? 0, endReason: r4.endReason || null, stats: r4.stats || null };
    if (!r4.played) {
      run.started = false;
      this._finish(run, { filled: false, reason: r4.reason || r4.fallback || "zone_not_played", zone });
      return run.done;
    }
    run.score = r4.score;
    this._finish(run, { inWorld: true, zone, live: true, endReason: r4.endReason || null });
    return run.done;
  }
  async _brandWorldRound(run, raw, pocket) {
    const { THREE, scene, camera, renderer, host } = this.attached;
    const ad = run.ad;
    let mod = null;
    try {
      mod = await import(`${this.base}/sdk/brandworld/round.js?v=${this.version}`);
    } catch (e) {
      warn("Brand World runtime unavailable, using the pocket arena", e);
    }
    if (!mod) return pocket();
    const world = { ...this.world || {}, ...await this._worldManifest() || {} };
    run.session = "inworld";
    const r4 = await mod.playBrandWorldRound({
      base: this.base,
      manifestUrl: ad.manifestUrl,
      raw,
      world,
      THREE: THREE || null,
      scene,
      camera,
      renderer,
      playerUrl: this.world?.playerUrl ? new URL(this.world.playerUrl, this.base + "/").href : null,
      countdown: false,
      // shown above
      host: host && typeof host.pause === "function" ? host : null,
      cta: ctaAs(ad.cta, "brandworld"),
      muted: this.state.muted,
      storage: this.storageAllowed(),
      name: "You",
      hostSession: this.session,
      onPhase: (p, info) => {
        if (p === "intro") {
          run.visible = true;
          this._started(run);
        }
        if (p === "leaderboard") run.score = info.score ?? run.score;
        if (p === "done") run.visible = false;
      },
      onEvent: (type, value) => {
        if (type === "engagement" && !run.engaged) {
          run.engaged = true;
          this._beacon(run.token, "engagement", 1);
        }
        if (type === "complete") {
          run.completed = true;
          run.score = value ?? run.score;
          this._beacon(run.token, "complete", run.score);
        }
        if (type === "click") this._beacon(run.token, "click", value || ad.cta?.url || null, false);
      },
      onWarn: (m) => warn(m),
      onHandle: (h) => {
        this.brandWorldHandle = h;
      }
    });
    this.brandWorldHandle = null;
    this.lastBrandWorld = { fallback: r4.fallback || null, score: r4.score, stats: r4.stats || null };
    if (r4.fallback) {
      warn(`Brand World fell back to the pocket arena (${r4.fallback})`);
      run.visible = false;
      run.session = null;
      const err = await pocket();
      if (err) this._finish(run, { filled: false, reason: "manifest_error" });
      return;
    }
    run.score = r4.score;
    this._finish(run, { brandWorld: true });
  }
  async _serverRound(trigger) {
    const t0 = performance.now();
    const live = () => this.ads?.runtime.round || this.serverRoundAt && performance.now() - this.serverRoundAt < 3e3;
    const soon = () => this.serverSoonAt && performance.now() - this.serverSoonAt < 11e3;
    while (!live() && (performance.now() - t0 < 3e3 || soon()) && performance.now() - t0 < 14e3) await sleep2(100);
    if (!live()) return unfilled("no_fill");
    this.busy = true;
    const run = this.run && !this.run.finished ? this.run : this._newRun(null, trigger);
    run.trigger = trigger;
    return timeout(run.done, 6e4, null).then((r4) => r4 || (this._finish(run, { timedOut: true }), run.done));
  }
  /** Native runtime lifecycle → events/beacons. data.extra carries the ad server's token/cta for this ad. */
  _roundEvent(type, data) {
    let run = this.run;
    if (type === "roundStart" && !run) run = this._newRun(null, "intermission");
    if (!run) return;
    const token = run.token || data?.extra?.token || null;
    run.token = token;
    if (data?.extra && !run.ad) run.ad = { token, requestId: data.extra.requestId, cta: data.extra.cta, brand: data.extra.brand, test: data.extra.test };
    if (type === "roundStart") this._started(run);
    else if (type === "pickup") {
      run.score = data.score;
      if (!run.engaged) {
        run.engaged = true;
        this._beacon(token, "engagement", 1);
      }
    } else if (type === "roundEnd") {
      run.score = data.score ?? run.score;
      if (!data.aborted) {
        run.completed = true;
        this._beacon(token, "complete", run.score);
      }
    } else if (type === "cta") this._beacon(token, "click", data.url || null, false);
    else if (type === "roundExit") this._finish(run);
  }
  _started(run) {
    if (run.started || run.finished) return;
    run.started = true;
    if (!run.session) {
      run.session = true;
      this.session.begin();
    }
    run.startedAt = performance.now();
    this._beacon(run.token, "impression", 1);
    this._beacon(run.token, "start", 1);
    this.emitter.emit("start", { format: "takeover", trigger: run.trigger, brand: run.ad?.brand?.name || null, requestId: run.ad?.requestId || null, test: !!run.ad?.test });
  }
  _overlayWorld() {
    if (this.world && typeof this.world === "object" && (this.world.scale || this.world.cameraMode)) {
      const { gameTitle, cameraMode, scale, controls } = this.world;
      return { gameTitle, cameraMode, scale, controls };
    }
    const { camera } = this.attached, h = this.attached.host;
    let cam = null;
    if (camera) {
      camera.updateMatrixWorld?.();
      const e = camera.matrixWorld.elements;
      cam = { x: e[12], y: e[13], z: e[14] };
    }
    const p = h?.getPlayerPosition?.();
    const speeds = this.measure.speeds.filter((s) => s > 0.8).sort((a, b) => a - b);
    const q = (k) => speeds[Math.floor((speeds.length - 1) * k)];
    const walk = speeds.length >= 10 ? q(0.5) : null, sprint = speeds.length >= 10 ? q(0.92) : null;
    let mode = "third-person", height = 1.8, dist2 = 7, camH = 3.5;
    if (cam && p) {
      dist2 = Math.hypot(cam.x - p.x, cam.z - p.z);
      camH = cam.y - p.y;
      if (dist2 < 0.8) {
        mode = "first-person";
        height = clamp7(camH / 0.92, 1, 2.4);
      }
    } else if (cam && cam.y > 0.9 && cam.y < 2.2) {
      mode = "first-person";
      height = clamp7(cam.y / 0.92, 1, 2.4);
    } else if (cam) camH = clamp7(cam.y, 1, 20);
    return {
      gameTitle: document.title.slice(0, 60),
      cameraMode: mode,
      measuredBy: "br.js",
      scale: { playerHeightM: height, walkSpeedMps: walk ?? 5.8, sprintSpeedMps: sprint && walk && sprint > walk * 1.15 ? sprint : (walk ?? 5.8) * 1.6, cameraDistanceM: clamp7(dist2, 2, 20), cameraHeightM: clamp7(camH, 0.5, 20) }
    };
  }
  _overlayRound(run) {
    const ad = run.ad;
    const world = this._overlayWorld();
    const playerUrl = this.world?.playerUrl ? new URL(this.world.playerUrl, this.base + "/").href : "";
    const worldParam = this.world?.worldUrl ? new URL(this.world.worldUrl, this.base + "/").href : "data:application/json," + encodeURIComponent(JSON.stringify(world));
    const q = new URLSearchParams({
      manifest: ad.manifestUrl,
      world: worldParam,
      player: playerUrl,
      autostart: "0",
      loop: "0",
      name: "You",
      cta: ad.cta?.label || "",
      ctaUrl: withFormat(ad.cta?.url, "arena") || "",
      muted: this.state.muted ? "1" : "0",
      tag: "0",
      dock: this.attached?.hudDock === "top-right" ? "right" : "top",
      storage: this.storageAllowed() ? "1" : "0",
      ...ad.cta?.fallback ? { ctaFb: JSON.stringify(ad.cta.fallback) } : {},
      ...globalThis.__brClick?.down ? { apiDown: "1" } : {}
    });
    const frame = this.ui.roundFrame(ad.overlayUrl ? `${ad.overlayUrl}#${q}` : `${this.base}/overlay/?${q}`);
    let readyT = setTimeout(() => {
      cleanup2();
      this._finish(run, { filled: false, reason: "load_timeout" });
    }, 2e4);
    const onMsg = (e) => {
      if (e.source !== frame.el.contentWindow || e.data?.source !== "spatial-ads") return;
      const d = e.data;
      if (d.event === "engagement" && !run.engaged) {
        run.engaged = true;
        this._beacon(run.token, "engagement", 1);
      }
      if (d.event === "click") this._beacon(run.token, "click", ad.cta?.url || null, false);
      if (d.phase === "ready" && readyT) {
        clearTimeout(readyT);
        readyT = 0;
        if (!run.session) {
          run.session = true;
          this.session.begin();
        }
        frame.show();
        frame.el.contentWindow.postMessage({ source: "spatial-ads-host", cmd: "start" }, "*");
      }
      if (d.phase === "intro") {
        run.visible = true;
        this._started(run);
      }
      if (d.phase === "playing") run.visible = true;
      if (d.phase === "leaderboard") {
        run.score = d.score ?? run.score;
        run.completed = true;
        this._beacon(run.token, "complete", run.score);
      }
      if (d.phase === "done") {
        run.visible = false;
        cleanup2();
        this._finish(run);
      }
    };
    const cleanup2 = () => {
      removeEventListener("message", onMsg);
      frame.remove();
    };
    addEventListener("message", onMsg);
  }
  // ---------- rewarded ----------
  async rewarded({ onReward, label, button } = {}) {
    if (this.state.agent) return unfilled("agent");
    this.rewardedHandler = { onReward, label };
    this.devBreaks = true;
    if (this.autoAttached) this.tagOnlyCtl?.stop("rewarded");
    if (button === "portal") return { registered: true, label: label || null };
    if (button === false) return this._rewardedRun(onReward);
    if (!this.attached && !await this._whenAttached("rewarded")) return unfilled("not_attached");
    const tk = this.settings.formats.takeover;
    if (tk.enabled === false || Array.isArray(tk.triggers) && !tk.triggers.includes("rewarded") || this.mode === "native-net") {
      return Promise.resolve(unfilled(this.mode === "native-net" ? "server_coordinated" : "trigger_disabled"));
    }
    const b = this.ui.rewardedButton(label || "Play a Bonus Round for a reward", () => this._rewardedRun(onReward));
    return Promise.resolve({ shown: true, hide: () => b.remove(), start: () => this._rewardedRun(onReward) });
  }
  async _rewardedRun(onReward) {
    const r4 = this.mode === "native-net" ? await this._personalRound("rewarded") : await this.breakRound("rewarded", { __internal: true });
    if (!r4.filled) {
      if (r4.reason !== "busy") this.ui?.toast("No Bonus Round available right now. Try again soon.");
      return { ...r4, rewarded: false };
    }
    if (r4.completed) {
      try {
        onReward?.(r4);
      } catch (e) {
        warn("onReward threw", e);
      }
      this._beacon(r4.token || this.lastToken, "reward", 1);
      this.emitter.emit("reward", r4);
    }
    return { ...r4, rewarded: r4.completed };
  }
  // ---------- loop: frames, viewability, interval, ambient ----------
  _loop() {
    let last = performance.now(), posT = 0, intervalT = 0;
    const tick = (now2) => {
      const dt = Math.min((now2 - last) / 1e3, 0.1);
      last = now2;
      try {
        if (this.ownFrames) this._runFrame(dt);
        const h = this.attached.host;
        if (this.local && this.localId && h && (posT += dt) > 1 / 15) {
          posT = 0;
          const p = h.getPlayerPosition();
          if (p) this.local.send({ t: "pos", p: [p.x, p.y, p.z], ry: 0 });
        }
        if (h?.getPlayerPosition && !this.busy) this._sampleSpeed(h.getPlayerPosition(), dt);
        const run = this.run;
        if (run) {
          const showing = !!(run.visible || this.ads?.runtime.round?.active);
          run.vt || (run.vt = createTracker(RULES.takeover));
          run.vt.sample(now2, takeoverSample(showing, document.visibilityState === "visible"));
          run.viewMs = run.vt.fired ? run.vt.report.ms : run.vt.runMs;
          if (run.vt.fired && run.token) this._beacon(run.token, "viewable", run.vt.report.ms, true, { vw: run.vt.report });
        }
        if (this.ambient) this._ambientFrame(dt);
        if (this.hostProx && !this.busy) this.hostProx.tick();
        if (this.bots) this.bots.update(dt, !!this.ads?.runtime.round?.active);
        if ((intervalT += dt) > 1) {
          intervalT = 0;
          this._intervalCheck();
        }
      } catch (e) {
        warn("loop", e);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  _sampleSpeed(p, dt) {
    if (!p) return;
    const m = this.measure;
    if (m.last && dt > 0) {
      const s = Math.hypot(p.x - m.last.x, p.z - m.last.z) / dt;
      if (s < 40) {
        m.speeds.push(s);
        if (m.speeds.length > 600) m.speeds.shift();
      }
    }
    m.last = { x: p.x, z: p.z };
  }
  _safeMoment() {
    if (this.state.safe === true) return true;
    if (this.state.safe === false) return false;
    return performance.now() - this.lastInput > 1500;
  }
  async _intervalCheck() {
    if (this.autoAttached) return;
    const tk = this.settings.formats.takeover;
    if (!tk.enabled || !Array.isArray(tk.triggers) || !tk.triggers.includes("interval") || this.mode === "native-net") return;
    if (this.busy || this.offering) return;
    const every = clamp7(+tk.intervalSec || 300, 20, 3600) * 1e3, now2 = performance.now();
    const since = Math.max(this.lastRoundAt, this.lastOfferAt, this.attachedAt || (this.attachedAt = now2));
    if (now2 - since < every || !this._safeMoment() || this._capped()) return;
    this.offering = true;
    this.lastOfferAt = now2;
    try {
      const ad = await this._request("takeover", "interval");
      if (!ad.fill || this.busy) return;
      const play = await this.ui.offer({ brand: ad.brand?.name, palette: ad.brand?.palette });
      if (play && !this.busy) this._play(ad, "interval");
    } finally {
      this.offering = false;
    }
  }
  // ---------- ambient ----------
  async _ambientHost(scene, renderer) {
    const rec = hookRecords();
    renderer || (renderer = rec.renderers[rec.renderers.length - 1]);
    if (!renderer) return;
    const watch = watchRenderer(renderer);
    if (!scene) {
      for (let i = 0; i < 40 && !watch.main(); i++) await sleep2(100);
      scene = watch.main()?.scene;
    }
    if (!scene) return;
    const ad0 = await this._request("ambient", "ambient");
    if (!ad0.fill) return;
    const kind0 = (await this._manifestBrand(ad0.manifestUrl))?.raw?.inWorld?.kind || "billboard";
    const prime = await this._primeFor(ad0, kind0);
    const ad = prime.primed ? { ...ad0, token: null, manifestUrl: prime.manifestUrl, brand: { name: prime.takeoverBrand } } : ad0;
    const token = ad.token;
    const a = await hostAmbient({
      base: this.base,
      manifestUrl: ad.manifestUrl,
      scene,
      renderer,
      world: this.world,
      placement: this.state.ambientHint || null,
      onImpression: () => this._beacon(token, "impression", 1),
      onViewable: (ms, rep) => this._beacon(token, "viewable", ms, true, rep ? { vw: rep } : null)
    });
    if (a) {
      this.hostProp = a;
      this.emitter.emit("ambient", { placed: true, kind: a.kind, brand: ad.brand?.name || null, mode: "host-classes" });
      this._hostProximity(a, ad, scene);
    }
  }
  /** proximity CTA for a host-classes prop (overlay mode, no THREE): the player from the host adapter, the hooks or the camera */
  async _hostProximity(a, ad, scene) {
    for (let i = 0; i < 50 && !a.getCamera?.(); i++) await sleep2(100);
    const cam = a.getCamera?.();
    if (!cam) return;
    let player = null;
    try {
      const { findPlayer: findPlayer2 } = await import(`${this.base}/sdk/inworld/scan.js?v=${this.version}`);
      const world = { ...this.world || {}, ...await this._worldManifest() || {} };
      player = findPlayer2({ scene, camera: cam, host: this.attached.host || null, hooks: world.gameplayHooks || {}, world, upm: a.upm || 1 });
    } catch (e) {
      warn("proximity: no player", e);
    }
    this.hostProx = this._makeProximity({
      kind: a.kind,
      brand: a.brand,
      url: ad.cta?.url || a.ctaUrl || null,
      center: () => a.center,
      top: () => ({ x: a.center.x, y: a.center.y + (a.top.y - a.center.y) * 0.25, z: a.center.z }),
      normal: () => a.normal,
      halfWidth: a.halfWidth * 0.8,
      upm: a.upm || 1,
      camera: () => a.getCamera() || cam,
      token: () => ad.token,
      player: () => player?.feet?.() || null
    });
  }
  async _ambient() {
    const ad = await this._request("ambient", "ambient");
    if (!ad.fill) return;
    const T = this.attached.THREE;
    const raw0 = await (await fetch(ad.manifestUrl, { cache: "no-cache" })).json();
    const prime = await this._primeFor(ad, raw0?.inWorld?.kind || "portal_arch");
    const raw = prime.primed ? (await this._manifestBrand(prime.manifestUrl))?.raw || raw0 : raw0;
    const m = normalizeManifest(T, raw);
    if (ad.cta?.label && !prime.primed) m.round.cta = ad.cta.label;
    if (prime.primed && raw0?.inWorld) m.inWorld = { ...m.inWorld, kind: raw0.inWorld.kind || m.inWorld.kind, heightM: raw0.inWorld.heightM || m.inWorld.heightM };
    this.ambient = { ad: prime.primed ? { ...ad, token: null, manifestUrl: prime.manifestUrl, brand: { name: prime.takeoverBrand } } : ad, origAd: ad, primed: prime.primed, m, built: null, hint: null, viewMs: 0, engaged: false };
    this.placeAmbient(this.state.ambientHint);
  }
  /** the next takeover changed after the prop was built: rebuild it in that brand (primed) */
  _reprime() {
    const amb = this.ambient;
    if (!amb?.built || amb.repriming) return;
    amb.repriming = true;
    this._primeFor(amb.origAd, amb.m.inWorld.kind).then(async (prime) => {
      if (!prime.primed || prime.manifestUrl === amb.ad.manifestUrl) return;
      const raw = (await this._manifestBrand(prime.manifestUrl))?.raw;
      if (!raw) return;
      const place = { position: amb.built.group.position.toArray(), rotationY: amb.built.group.rotation.y };
      const kind = amb.m.inWorld.kind, h = amb.m.inWorld.heightM;
      amb.built.group.parent?.remove(amb.built.group);
      amb.built.dispose?.();
      amb.px?.dispose();
      amb.px = null;
      amb.vw = null;
      amb.box = null;
      amb.m = normalizeManifest(this.attached.THREE, raw);
      amb.m.inWorld = { ...amb.m.inWorld, kind, heightM: h };
      amb.ad = { ...amb.origAd, token: null, manifestUrl: prime.manifestUrl, brand: { name: prime.takeoverBrand } };
      amb.primed = true;
      amb.built = null;
      await this._buildAmbient(amb, place);
    }).catch((e) => warn("reprime", e)).finally(() => {
      amb.repriming = false;
    });
  }
  placeAmbient(hint) {
    const amb = this.ambient;
    if (!amb) return;
    if (hint) amb.hint = hint;
    const iw = amb.m.inWorld;
    const place = amb.hint || raw(iw) && { position: iw.position, rotationY: iw.rotationY } || this.world?.placement?.position && this.world.placement;
    function raw(x) {
      return x && x.position && Array.isArray(x.position);
    }
    if (!place?.position) return;
    if (amb.built) {
      amb.built.group.position.set(...place.position);
      amb.built.group.rotation.y = +place.rotationY || 0;
      amb.box = null;
      amb.vw?.reset();
      return;
    }
    if (amb.building) return;
    amb.building = true;
    this._buildAmbient(amb, place).catch((e) => warn("ambient build", e)).finally(() => {
      amb.building = false;
    });
  }
  async _buildAmbient(amb, place) {
    const { THREE: T, scene, worldRoot } = this.attached;
    const m = amb.m, abs = amb.ad.manifestUrl;
    const rel = (p) => typeof p === "string" && p ? new URL(p, abs).href : null;
    m.inWorld = { ...m.inWorld, enabled: true, position: place.position, rotationY: +place.rotationY || 0, kind: m.inWorld.kind || "portal_arch", heightM: m.inWorld.heightM || 4 };
    const gltf = gltfLoaderFor(this.base, T);
    const glb = (u) => u ? gltf().then((l) => l.loadAsync(u)).catch(() => null) : Promise.resolve(null);
    const tex = (u) => u ? new T.TextureLoader().loadAsync(u).then((t) => {
      t.colorSpace = T.SRGBColorSpace;
      return t;
    }).catch(() => null) : Promise.resolve(null);
    const img = (u) => u ? new Promise((res) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = u;
    }) : Promise.resolve(null);
    const kind = m.inWorld.kind;
    const [banner, logoImg, collectibleGltf, statueGltf] = await Promise.all([
      tex(rel(m.round.banners?.[0]?.image)),
      img(rel(m.brand.logo)),
      kind === "portal_arch" ? glb(rel(m.round.collectible.model)) : null,
      kind === "statue" ? glb(rel(m.round.hero.model)) : null
    ]);
    const built = buildInWorld(T, m, { bannerTex: [banner], logoImg, collectibleGltf, heroGltf: null, groundTex: null }, m.brand.palette, statueGltf);
    await warmProp(this.attached.renderer, built.group, scene, this.attached.camera);
    (worldRoot || scene).add(built.group);
    amb.built = built;
    amb.placedAt = performance.now();
    this.emitter.emit("ambient", { placed: true, kind: built.kind, brand: amb.ad.brand?.name || m.brand.name });
  }
  _ambientFrame(dt) {
    const amb = this.ambient, b = amb.built;
    if (!b) return;
    b.update(dt);
    const { camera, worldRoot, THREE: T, host, scene } = this.attached;
    if (!camera) {
      amb.viewMs = 0;
      return;
    }
    const token = amb.ad.token;
    amb.vw || (amb.vw = createPropViewability({
      THREE: T,
      camera,
      frame: b.group,
      targets: b.targets,
      scene,
      exclude: b.group,
      facing: facingFor(b.kind),
      rule: ambientRule(amb.m.inWorld),
      onImpression: () => this._beacon(token, "impression", 1),
      onViewable: (rep) => this._beacon(token, "viewable", rep.ms, true, { vw: rep })
    }));
    amb.vw.tick(performance.now(), !(worldRoot && !worldRoot.visible) && document.visibilityState === "visible");
    amb.viewMs = amb.vw.viewable ? amb.vw.tracker.report.ms : amb.vw.runMs;
    if (worldRoot && !worldRoot.visible || document.visibilityState !== "visible") return;
    if (!amb.box) {
      b.group.updateMatrixWorld(true);
      amb.box = new T.Box3().setFromObject(b.group);
    }
    if (!amb.px && !this.busy) {
      const c = amb.box.getCenter(new T.Vector3()), top = { x: c.x, y: amb.box.min.y + (amb.box.max.y - amb.box.min.y) * 0.62, z: c.z };
      const ry = b.group.rotation.y, n = { x: Math.sin(ry), y: 0, z: Math.cos(ry) };
      const hw = Math.max(amb.box.max.x - amb.box.min.x, amb.box.max.z - amb.box.min.z) / 2;
      const cp = new T.Vector3();
      amb.px = this._makeProximity({
        kind: b.kind,
        brand: { name: amb.m.brand.name || amb.ad.brand?.name, palette: amb.m.brand.palette },
        url: amb.ad.cta?.url || amb.m.round.ctaUrl || null,
        center: () => c,
        top: () => top,
        normal: () => n,
        halfWidth: hw * 0.8,
        upm: 1,
        camera: () => camera,
        token: () => amb.ad.token,
        player: () => host?.getPlayerPosition?.() || camera.getWorldPosition(cp)
      });
    }
    if (amb.px && !this.busy) amb.px.tick();
  }
  debug() {
    return JSON.parse(JSON.stringify({
      version: this.version,
      pub: this.pub,
      base: this.base,
      api: this.api || this.base,
      mode: this.mode,
      attached: !!this.attached,
      playerId: this.playerId,
      testMode: this.testMode,
      test: this.state.test,
      muted: this.state.muted,
      settings: this.settings,
      world: this.world ? { cameraMode: this.world.cameraMode, placement: this.world.placement || null } : null,
      busy: this.busy,
      run: this.run ? { trigger: this.run.trigger, started: this.run.started, completed: this.run.completed, score: this.run.score, viewMs: Math.round(this.run.viewMs) } : null,
      ambient: this.ambient ? { placed: !!this.ambient.built, kind: this.ambient.built?.kind || null, viewMs: Math.round(this.ambient.viewMs), engaged: this.ambient.engaged, viewability: this.ambient.vw?.debug() || null } : this.hostProp ? { placed: true, kind: this.hostProp.kind, viewMs: Math.round(this.hostProp.viewMs), via: "host-classes", viewability: this.hostProp.viewability?.() || null } : null,
      privacy: { contextualOnly: this.contextualOnly(), reasons: this.privacy?.reasons || [], storage: this.storageAllowed(), playerIdScope: this.storageAllowed() ? "persistent" : "session" },
      threeRevision: this.seen.revision,
      observed: { scenes: this.seen.scenes.length, renderers: this.seen.renderers.length },
      requests: this.requests.slice(-10),
      events: this.beacons.slice(-20),
      warnings: WARNINGS.slice(-10),
      runtime: this.ads ? this.ads.debug() : null,
      inWorld: this.inWorldHandle ? this.inWorldHandle.debug() : this.lastInWorld || null,
      priming: this.priming ? { ...this.priming, next: this.nextTakeover || null, prefetched: !!this.prefetch } : { next: this.nextTakeover || null, prefetched: !!this.prefetch },
      proximity: this.ambient?.px || this.hostProx ? { ...(this.ambient?.px || this.hostProx).stats, radiusM: (this.ambient?.px || this.hostProx).cfg?.radiusM, keyCode: (this.ambient?.px || this.hostProx).cfg?.key?.code, avoided: (this.ambient?.px || this.hostProx).cfg?.key?.avoided || null } : null,
      tagOnly: this.tagOnlyCtl ? { autoAttached: !!this.autoAttached, ...this.tagOnlyCtl.debug() } : null,
      brandWorld: this.brandWorldHandle ? this.brandWorldHandle.debug() : this.lastBrandWorld || null
    }));
  }
};
export {
  createCore,
  warn
};
