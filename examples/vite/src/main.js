// Bonus Round in a Vite + three.js game: npm i bonusround, then import, init, attach, break.
import * as THREE from 'three';
import { BonusRound } from 'bonusround';

BonusRound.init({ pub: 'pub_XXXXXXXX' });   // your publisher id; with the placeholder only the test round plays

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(5, 10, 4); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x4caf50 }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);

BonusRound.attach({ THREE, scene, camera, renderer });   // once, after the renderer, scene and camera exist

const player = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1, 4, 8), new THREE.MeshStandardMaterial({ color: 0xff7043 }));
player.position.y = 1; scene.add(player);
const orbs = [];
const spawnOrb = () => {
  const o = new THREE.Mesh(new THREE.SphereGeometry(0.4), new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0x664400 }));
  o.position.set((Math.random() - 0.5) * 30, 0.6, (Math.random() - 0.5) * 30); scene.add(o); orbs.push(o);
};
for (let i = 0; i < 12; i++) spawnOrb();
const keys = {};
addEventListener('keydown', (e) => { keys[e.code] = true; });
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

let score = 0, timeLeft = 20, playing = true;
const $ = (id) => document.getElementById(id);

// The natural break: the round is over, so a Bonus Round plays before the next one.
async function gameOver() {
  playing = false;
  $('over').style.display = 'grid';
  await BonusRound.break('intermission');   // resolves when the round ends, or right away if there's no ad
  $('over').style.display = 'none';
  score = 0; timeLeft = 20; playing = true; player.position.set(0, 1, 0);
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  if (playing) {
    const v = 8 * dt;
    if (keys.KeyW) player.position.z -= v;
    if (keys.KeyS) player.position.z += v;
    if (keys.KeyA) player.position.x -= v;
    if (keys.KeyD) player.position.x += v;
    for (let i = orbs.length - 1; i >= 0; i--) if (orbs[i].position.distanceTo(player.position) < 1.1) { scene.remove(orbs[i]); orbs.splice(i, 1); score++; spawnOrb(); }
    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; gameOver(); }
    $('score').textContent = score; $('time').textContent = Math.ceil(timeLeft);
  }
  camera.position.set(player.position.x, 8, player.position.z + 12);
  camera.lookAt(player.position);
  renderer.render(scene, camera);
});
