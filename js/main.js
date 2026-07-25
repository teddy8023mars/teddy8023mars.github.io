// ═══════════════════════════════════════════════════════════════
//  Teddy's Studio — a low-poly room you can poke around.
//  Vanilla Three.js. No build step. The cat watches your cursor.
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── project data ────────────────────────────────────────────────
const PROJECTS = {
  quickmd: {
    kicker: 'macOS app',
    title: 'QuickMD',
    sub: 'Native Markdown previewer for macOS',
    desc: 'Double-click any .md file and get a beautifully rendered preview instantly. GitHub-flavored Markdown, syntax highlighting, Mermaid diagrams, LaTeX math, dark mode.',
    points: [
      'Native AppKit — cold-opens faster than an Electron app finishes splashing',
      'Quick Look extension included',
      'Race-condition fixes verified through adversarial review',
    ],
    stack: ['Swift', 'AppKit', 'WebKit', 'Mermaid', 'KaTeX'],
    link: 'https://github.com/teddy8023mars/QuickMD',
  },
  deskcat: {
    kicker: 'macOS app · 3D',
    title: 'DeskCat',
    sub: 'A 3D companion that lives on your desktop',
    desc: 'A teddy bear (or this very cat) sits on your desktop and its head smoothly follows your mouse. The bear is fully procedural — SDF-modeled glasses, suit and tie, no mesh files.',
    points: [
      'SceneKit + procedural SDF modeling',
      'Gaze tracking tuned to feel like a plush toy, not a security camera',
      'The cat in this room is the same glTF model (Quaternius, CC0)',
    ],
    stack: ['Swift', 'SceneKit', 'SDF', 'glTF'],
    link: 'https://github.com/teddy8023mars/DeskCat',
  },
  tradingbot: {
    kicker: 'trading system',
    title: 'Intraday Trading Bot',
    sub: 'US equities, moomoo API, shadow-mode first',
    desc: 'A deterministic intraday trading system where the LLM never touches the order trigger. Code decides; models only inform. Hardened through TDD and six rounds of independent adversarial review.',
    points: [
      'Multi-layer hard risk controls (position, loss, frequency, denylist)',
      'Shadow mode (DRY_RUN) validation before any live order',
      'Deterministic execution — reproducible decisions, auditable ledger',
    ],
    stack: ['Python', 'moomoo API', 'TDD', 'Risk Controls'],
    link: null,
    lockNote: 'Source private — it trades a real account. Happy to walk through the architecture.',
  },
  skinlesion: {
    kicker: 'deep learning · medical imaging',
    title: 'Skin Lesion Analysis',
    sub: 'U-Net segmentation + EfficientNet classification',
    desc: 'Automated dermoscopy analysis in two stages: a U-Net that segments the lesion region pixel-by-pixel, then an EfficientNet that classifies the lesion type — aimed at assisting early skin-cancer diagnosis.',
    points: [
      'U-Net encoder–decoder with skip connections for pixel-level segmentation',
      'EfficientNet transfer learning for multi-class lesion classification',
      'Full pipeline in reproducible notebooks: preprocessing → training → evaluation',
    ],
    stack: ['Python', 'U-Net', 'EfficientNet', 'Jupyter'],
    link: 'https://github.com/teddy8023mars/Skin-lesion-classification',
  },
  leetcode: {
    kicker: 'full-stack web',
    title: 'LeetCode Tracker',
    sub: 'Self-hosted practice platform with a local judge',
    desc: 'Syncs problems from LeetCode (EN + CN), organizes study plans, tracks progress with spaced repetition, and judges solutions in a local sandbox — with an AI tutor on the side.',
    points: [
      'Bilingual sync pipeline: LeetCode GraphQL + community data + LLM translation fallback',
      'Local online judge: sandboxed runner, LLM-generated test suites',
      'React 19 · tRPC · Drizzle — 130+ tests in CI',
    ],
    stack: ['TypeScript', 'React 19', 'tRPC', 'Drizzle', 'MySQL'],
    link: 'https://github.com/teddy8023mars/leetcode-tracker',
  },
};

// ── theme definitions ───────────────────────────────────────────
const THEMES = {
  day: {
    bg: 0xf5e8d0, fogFar: 46,
    ambient: { color: 0xfff2dd, intensity: 0.9 },
    sun: { color: 0xffe3b0, intensity: 2.6 },
    lampOn: false,
    windowGlow: 0xbfe3f0, windowIntensity: 0.55,
    screenBoost: 1.0,
  },
  night: {
    bg: 0x141b26, fogFar: 40,
    ambient: { color: 0x4a5a7a, intensity: 0.45 },
    sun: { color: 0x8fa3c8, intensity: 0.35 },
    lampOn: true,
    windowGlow: 0x1b2a45, windowIntensity: 0.9,
    screenBoost: 1.6,
  },
};

// ── boot / fallback ─────────────────────────────────────────────
const canvas = document.getElementById('scene');
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const textVersion = document.getElementById('textVersion');

buildTextCards();

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  enterTextVersion(true);
  throw e;
}

const skipBtn = document.getElementById('loaderSkip');
setTimeout(() => skipBtn.classList.add('show'), 3000);
skipBtn.addEventListener('click', () => { loader.classList.add('done'); enterTextVersion(false); });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
camera.position.set(9.5, 7.5, 9.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, -0.8);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 5.5;
controls.maxDistance = 17;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 1.35;
controls.minAzimuthAngle = -0.15;
controls.maxAzimuthAngle = Math.PI / 2 + 0.15;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotate = !reducedMotion;
controls.autoRotateSpeed = 0.5;
renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; }, { once: true });
window.__cam = camera; window.__controls = controls;

// ── lights ──────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xfff2dd, 0.9);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffe3b0, 2.6);
sun.position.set(-7, 9, 5);           // through the window on the -x wall
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
sun.shadow.bias = -0.0004;
scene.add(sun);

const lampLight = new THREE.PointLight(0xffc46e, 0, 9, 2);
lampLight.position.set(-2.8, 3.1, -3.4);
scene.add(lampLight);

// ── materials helper ────────────────────────────────────────────
const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.0, ...opts });
const box = (w, h, d, material) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

// ── room ────────────────────────────────────────────────────────
const room = new THREE.Group();
scene.add(room);

const floor = box(11, 0.5, 11, mat(0xe0b57f));
floor.position.y = -0.25;
room.add(floor);

// plinth shadow edge (gives the "toy diorama" look)
const plinth = box(11.8, 0.35, 11.8, mat(0xc99e6a));
plinth.position.y = -0.6;
room.add(plinth);

const wallL = box(0.35, 5, 11, mat(0xe8d6b4));   // -x wall (window + whiteboard)
wallL.position.set(-5.5, 2.5, 0);
room.add(wallL);
const wallB = box(11.35, 5, 0.35, mat(0xf2e3c8)); // -z wall (chart screen + shelf)
wallB.position.set(0, 2.5, -5.5);
room.add(wallB);

// rug
const rug = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.06, 28), mat(0xd96e5a));
rug.receiveShadow = true;
rug.position.set(0.7, 0.03, 1.2);
room.add(rug);
const rugRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.045, 8, 40), mat(0xf0a390));
rugRing.rotation.x = Math.PI / 2;
rugRing.position.set(0.7, 0.075, 1.2);
room.add(rugRing);

// ── window (on -x wall) ─────────────────────────────────────────
const winFrame = box(0.28, 2.4, 2.2, mat(0x8a6a3e));
winFrame.position.set(-5.42, 2.9, 2.5);
room.add(winFrame);
const winGlassMat = new THREE.MeshStandardMaterial({ color: 0xbfe3f0, emissive: 0xbfe3f0, emissiveIntensity: 0.55, roughness: 0.4 });
const winGlass = box(0.1, 2.1, 1.9, winGlassMat);
winGlass.position.set(-5.32, 2.9, 2.5);
room.add(winGlass);
const winBarV = box(0.06, 2.1, 0.09, mat(0x8a6a3e)); winBarV.position.set(-5.24, 2.9, 2.5); room.add(winBarV);
const winBarH = box(0.06, 0.09, 1.9, mat(0x8a6a3e)); winBarH.position.set(-5.24, 2.9, 2.5); room.add(winBarH);

// stars behind the glass at night (toggled by theme)
const stars = new THREE.Group();
for (let i = 0; i < 10; i++) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff3c0 }));
  s.position.set(-5.36, 2.2 + Math.abs(Math.sin(i * 3.7)) * 1.4, 1.75 + (i * 0.163) % 1.5);
  stars.add(s);
}
stars.visible = false;
room.add(stars);

// ── desk ────────────────────────────────────────────────────────
const desk = new THREE.Group();
const deskTop = box(3.6, 0.18, 1.7, mat(0xc99e6a));
deskTop.position.y = 1.45;
desk.add(deskTop);
for (const [dx, dz] of [[-1.6, -0.65], [1.6, -0.65], [-1.6, 0.65], [1.6, 0.65]]) {
  const leg = box(0.16, 1.45, 0.16, mat(0xa87d4a));
  leg.position.set(dx, 0.725, dz);
  desk.add(leg);
}
desk.position.set(0.7, 0, -3.1);
room.add(desk);

// ── canvas-texture helper ───────────────────────────────────────
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { texture: t, canvas: c, ctx };
}

// ── monitor (QuickMD) on desk ───────────────────────────────────
const monitor = new THREE.Group();
const monFrame = box(1.7, 1.15, 0.09, mat(0x4a3a28, { roughness: 0.6 }));
monFrame.position.y = 2.35;
monitor.add(monFrame);
const md = canvasTexture(512, 340, (ctx, w, h) => {
  ctx.fillStyle = '#faf6ec'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#4a3a28'; ctx.font = 'bold 38px Georgia'; ctx.fillText('# README.md', 30, 60);
  ctx.fillStyle = '#d96e5a'; ctx.fillRect(30, 80, 190, 6);
  ctx.fillStyle = '#9a8a70';
  for (const [y, len] of [[120, 380], [150, 300], [180, 350], [240, 260], [270, 330]])
    ctx.fillRect(30, y, len, 12);
  ctx.fillStyle = '#7ba86a'; ctx.fillRect(30, 210, 150, 12); // a "code" line
});
const monScreenMat = new THREE.MeshStandardMaterial({ map: md.texture, emissive: 0xffffff, emissiveMap: md.texture, emissiveIntensity: 0.35, roughness: 0.5 });
const monScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 1.0), monScreenMat);
monScreen.position.set(0, 2.35, 0.051);
monitor.add(monScreen);
const monStand = box(0.14, 0.5, 0.14, mat(0x4a3a28, { roughness: 0.6 })); monStand.position.y = 1.7; monitor.add(monStand);
const monBase = box(0.7, 0.06, 0.4, mat(0x4a3a28, { roughness: 0.6 })); monBase.position.y = 1.57; monitor.add(monBase);
monitor.position.set(-0.1, 0, -3.15);
monitor.rotation.y = 0.22;
room.add(monitor);

// keyboard
const kb = box(0.95, 0.06, 0.34, mat(0xfaf6ec, { roughness: 0.7 }));
kb.position.set(0.05, 1.58, -2.55);
kb.rotation.y = 0.18;
room.add(kb);

// ── trading screen (portfolio-tracker) on -z wall ───────────────
const chartFrame = box(2.9, 1.75, 0.12, mat(0x2a2418, { roughness: 0.55 }));
chartFrame.position.set(-2.1, 2.9, -5.28);
room.add(chartFrame);
const chart = canvasTexture(512, 300, () => {});   // drawn per-frame below
const chartMat = new THREE.MeshStandardMaterial({ map: chart.texture, emissive: 0xffffff, emissiveMap: chart.texture, emissiveIntensity: 0.6, roughness: 0.4 });
const chartScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.55), chartMat);
chartScreen.position.set(-2.1, 2.9, -5.21);
room.add(chartScreen);

let chartData = Array.from({ length: 60 }, (_, i) => 150 + Math.sin(i * 0.4) * 30);
let chartTick = 0;
function drawChart() {
  const { ctx, canvas: c } = chart;
  const w = c.width, h = c.height;
  ctx.fillStyle = '#10161d'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#1f2a38'; ctx.lineWidth = 1;
  for (let y = 40; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // ticker header
  ctx.fillStyle = '#3ddc84'; ctx.font = 'bold 22px monospace'; ctx.fillText('DRY_RUN · shadow mode', 16, 28);
  // line
  ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3; ctx.beginPath();
  chartData.forEach((v, i) => {
    const x = (i / (chartData.length - 1)) * w;
    const y = h - 30 - (v - 90) * (h - 80) / 140;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // last-price dot
  const lv = chartData[chartData.length - 1];
  ctx.fillStyle = '#8fd6a0';
  ctx.beginPath();
  ctx.arc(w - 4, h - 30 - (lv - 90) * (h - 80) / 140, 6, 0, Math.PI * 2);
  ctx.fill();
  chart.texture.needsUpdate = true;
}
function stepChart() {
  const last = chartData[chartData.length - 1];
  const next = Math.max(100, Math.min(220, last + Math.sin(chartTick * 1.7) * 6 + Math.sin(chartTick * 0.31) * 4));
  chartData.push(next); chartData.shift();
  chartTick++;
}

// ── whiteboard (leetcode-tracker) on -x wall ────────────────────
const boardFrame = box(0.12, 1.9, 2.7, mat(0x8a6a3e));
boardFrame.position.set(-5.35, 2.7, -1.6);
room.add(boardFrame);
const wb = canvasTexture(512, 360, (ctx, w, h) => {
  ctx.fillStyle = '#fbfbf7'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#5a7fd6'; ctx.lineWidth = 5; ctx.fillStyle = '#fbfbf7';
  const nodes = [[130, 90], [300, 90], [215, 210], [390, 210], [215, 310]];
  const edges = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]];
  for (const [a, b] of edges) {
    ctx.beginPath(); ctx.moveTo(...nodes[a]); ctx.lineTo(...nodes[b]); ctx.stroke();
  }
  for (const [x, y] of nodes) {
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#d96e5a'; ctx.font = 'bold 30px monospace'; ctx.fillText('LC 75 ✓', 360, 60);
  ctx.fillStyle = '#5a7fd6'; ctx.font = 'bold 24px monospace'; ctx.fillText('O(n log n)', 60, 340);
});
const boardMat = new THREE.MeshStandardMaterial({ map: wb.texture, emissive: 0xffffff, emissiveMap: wb.texture, emissiveIntensity: 0.15, roughness: 0.85 });
const board = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.7), boardMat);
board.rotation.y = Math.PI / 2;
board.position.set(-5.28, 2.7, -1.6);
room.add(board);

// ── dermoscopy scan frame (Skin Lesion Analysis) on -x wall ─────
const scanFrame = box(0.1, 1.35, 1.75, mat(0x8a6a3e));
scanFrame.position.set(-5.38, 2.75, 0.55);
room.add(scanFrame);
const scan = canvasTexture(512, 384, (ctx, w, h) => {
  // dermoscopy plate: skin field + lesion + segmentation outline
  ctx.fillStyle = '#e8c4a8'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {                     // skin texture noise
    ctx.fillStyle = `rgba(180,120,90,${0.05 + (i % 5) * 0.012})`;
    const x = (i * 197) % w, y = (i * 311) % h;
    ctx.beginPath(); ctx.arc(x, y, 8 + (i % 4) * 5, 0, Math.PI * 2); ctx.fill();
  }
  // lesion blob (irregular)
  ctx.fillStyle = '#5a3a2e';
  ctx.beginPath();
  ctx.moveTo(200, 140);
  ctx.bezierCurveTo(280, 100, 350, 140, 340, 210);
  ctx.bezierCurveTo(330, 280, 240, 300, 190, 260);
  ctx.bezierCurveTo(150, 225, 150, 170, 200, 140);
  ctx.fill();
  ctx.fillStyle = '#3e2620';
  ctx.beginPath(); ctx.arc(265, 200, 38, 0, Math.PI * 2); ctx.fill();
  // U-Net segmentation outline (dashed)
  ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 5; ctx.setLineDash([14, 9]);
  ctx.beginPath();
  ctx.moveTo(196, 128);
  ctx.bezierCurveTo(288, 84, 366, 132, 354, 214);
  ctx.bezierCurveTo(342, 292, 236, 316, 178, 270);
  ctx.bezierCurveTo(134, 230, 136, 164, 196, 128);
  ctx.stroke();
  ctx.setLineDash([]);
  // labels
  ctx.fillStyle = '#134e4a'; ctx.font = 'bold 26px monospace';
  ctx.fillText('U-Net ▸ mask', 24, 40);
  ctx.font = 'bold 22px monospace'; ctx.fillStyle = '#7c2d12';
  ctx.fillText('EfficientNet ▸ melanoma 0.87', 24, h - 22);
});
const scanMat = new THREE.MeshStandardMaterial({ map: scan.texture, emissive: 0xffffff, emissiveMap: scan.texture, emissiveIntensity: 0.15, roughness: 0.85 });
const scanPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.15), scanMat);
scanPlate.rotation.y = Math.PI / 2;
scanPlate.position.set(-5.31, 2.75, 0.55);
room.add(scanPlate);

// ── bookshelf filler (right of chart screen) ────────────────────
const shelf = new THREE.Group();
const shelfBody = box(1.5, 3.0, 0.55, mat(0xa87d4a));
shelfBody.position.y = 1.5;
shelf.add(shelfBody);
const bookColors = [0xd96e5a, 0x7ba86a, 0xe8a33d, 0x5a7fd6, 0xf0a390, 0x8a6a3e];
for (let r = 0; r < 3; r++) {
  let bx = -0.55;
  for (let i = 0; i < 4; i++) {
    const bw = 0.16 + ((r * 4 + i) % 3) * 0.05;
    const bh = 0.5 + ((r + i) % 2) * 0.12;
    const b = box(bw, bh, 0.34, mat(bookColors[(r * 4 + i) % bookColors.length], { roughness: 0.8 }));
    b.position.set(bx + bw / 2, 0.62 + r * 0.92 + bh / 2 - 0.25, 0.14);
    shelf.add(b);
    bx += bw + 0.06;
  }
}
shelf.position.set(3.6, 0, -5.0);
room.add(shelf);

// ── plant ───────────────────────────────────────────────────────
const plant = new THREE.Group();
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.5, 10), mat(0xd96e5a));
pot.castShadow = true; pot.position.y = 0.25;
plant.add(pot);
for (let i = 0; i < 5; i++) {
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.85, 6), mat(0x7ba86a, { roughness: 0.8 }));
  leaf.castShadow = true;
  const a = (i / 5) * Math.PI * 2;
  leaf.position.set(Math.cos(a) * 0.16, 0.85, Math.sin(a) * 0.16);
  leaf.rotation.set(Math.sin(a) * 0.35, 0, Math.cos(a) * -0.35);
  plant.add(leaf);
}
plant.position.set(-4.3, 0, 4.1);
room.add(plant);

// ── floor lamp ──────────────────────────────────────────────────
const lamp = new THREE.Group();
const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 8), mat(0x8a6a3e));
lampPole.castShadow = true; lampPole.position.y = 1.45;
lamp.add(lampPole);
const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.1, 12), mat(0x8a6a3e));
lampBase.position.y = 0.05;
lamp.add(lampBase);
const lampShadeMat = new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xffc46e, emissiveIntensity: 0.0, roughness: 0.7 });
const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.55, 12, 1, true), lampShadeMat);
lampShade.position.y = 3.05;
lamp.add(lampShade);
lamp.position.set(-2.8, 0, -3.4);
room.add(lamp);

// ── the cat (DeskCat) ───────────────────────────────────────────
const catAnchor = new THREE.Group();
catAnchor.position.set(1.75, 1.54, -3.0);   // sits on the desk
catAnchor.rotation.y = Math.PI / 5;         // faces the camera quadrant
room.add(catAnchor);

let catModel = null;
let catHead = null;
let catRig = null;                 // {bone, base} — skinned cat's root bone
let catHeadRest = null;            // head bone rest rotation (bind pose)
const catHeadCur = { yaw: 0, pitch: 0 };
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, l, t) => { loaderFill.style.width = `${Math.round(l / t * 100)}%`; };

new GLTFLoader(manager).load('assets/cat.glb', (gltf) => {
  // The glb is rigged; skinned meshes don't obey ancestor transforms, which
  // makes placement fragile. Its bind pose IS the standing cat, so bake the
  // skinned vertices (bind pose x the mesh's full node transform) into a
  // plain static mesh that behaves like any other object.
  let skinned = null;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((n) => { if (n.isSkinnedMesh && !skinned) skinned = n; });
  if (!skinned) { finishLoading(); return; }

  const geo = skinned.geometry.clone();
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    skinned.getVertexPosition(i, v);          // bind-pose vertex, local space
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.deleteAttribute('skinIndex');
  geo.deleteAttribute('skinWeight');
  // a mirrored node transform (negative determinant) flips triangle winding —
  // un-flip it so faces point outward again
  if (skinned.matrixWorld.determinant() < 0) {
    if (geo.index) {
      const idx = geo.index.array;
      for (let i = 0; i < idx.length; i += 3) {
        const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t;
      }
      geo.index.needsUpdate = true;
    }
  }
  geo.computeVertexNormals();

  const bakedMat = skinned.material.clone();
  bakedMat.side = THREE.DoubleSide;
  const baked = new THREE.Mesh(geo, bakedMat);
  baked.castShadow = true;
  baked.receiveShadow = true;

  catModel = new THREE.Group();
  baked.rotation.x = -Math.PI / 2;   // armature axis fix: stand the cat on its feet
  catModel.add(baked);

  // normalize while detached (world == local): ~1.1 units tall,
  // feet at y=0, centred on origin — then hand it to the anchor
  let b = new THREE.Box3().setFromObject(catModel);
  const size = b.getSize(new THREE.Vector3());
  const s = 1.1 / Math.max(size.y, 1e-6);
  catModel.scale.setScalar(s);
  catModel.updateMatrixWorld(true);
  b = new THREE.Box3().setFromObject(catModel);
  const c = b.getCenter(new THREE.Vector3());
  catModel.position.set(-c.x, -b.min.y, -c.z);
  catAnchor.add(catModel);
  finishLoading();
}, undefined, () => {
  // model failed to load — build a stand-in low-poly cat so the room still works
  const stand = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), mat(0xe8a33d));
  body.position.y = 0.3; body.scale.set(1, 0.85, 1.2); body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mat(0xf0b455));
  head.position.set(0, 0.72, 0.12); head.castShadow = true;
  const earGeo = new THREE.ConeGeometry(0.09, 0.16, 4);
  const earL = new THREE.Mesh(earGeo, mat(0xe8a33d)); earL.position.set(-0.12, 0.92, 0.1);
  const earR = new THREE.Mesh(earGeo, mat(0xe8a33d)); earR.position.set(0.12, 0.92, 0.1);
  stand.add(body, head, earL, earR);
  catHead = head;
  catHeadRest = head.rotation.clone();
  catModel = stand;
  catAnchor.add(stand);
  finishLoading();
});

let loadingDone = false;
function finishLoading() {
  if (loadingDone) return;
  loadingDone = true;
  loaderFill.style.width = '100%';
  setTimeout(() => loader.classList.add('done'), 350);
  setTimeout(() => document.getElementById('hint').classList.add('fade'), 9000);
}
// safety net: never trap the visitor on the loader
setTimeout(finishLoading, 8000);

// ── interactivity ───────────────────────────────────────────────
const targets = [
  { id: 'quickmd', label: 'QuickMD', objects: [monitor, kb], focus: { cam: [2.3, 2.9, -0.9], look: [-0.2, 2.35, -3.15] } },
  { id: 'deskcat', label: 'DeskCat', objects: [catAnchor], focus: { cam: [3.9, 2.7, -0.7], look: [1.75, 2.1, -3.0] } },
  { id: 'tradingbot', label: 'Intraday Trading Bot', objects: [chartFrame, chartScreen], focus: { cam: [-2.1, 3.0, -1.5], look: [-2.1, 2.9, -5.2] } },
  { id: 'leetcode', label: 'LeetCode Tracker', objects: [boardFrame, board], focus: { cam: [-1.6, 2.7, -1.6], look: [-5.3, 2.7, -1.6] } },
  { id: 'skinlesion', label: 'Skin Lesion Analysis', objects: [scanFrame, scanPlate], focus: { cam: [-2.0, 2.75, 0.55], look: [-5.3, 2.75, 0.55] } },
];
const pickMeshes = [];
for (const t of targets) {
  for (const o of t.objects) {
    o.traverse ? o.traverse((n) => { if (n.isMesh) { n.userData.targetId = t.id; pickMeshes.push(n); } })
               : null;
  }
}
// cat meshes register after async load
function registerCatMeshes() {
  if (!catModel) return;
  catModel.traverse((n) => { if (n.isMesh && !n.userData.targetId) { n.userData.targetId = 'deskcat'; pickMeshes.push(n); } });
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(10, 10);   // offscreen until first move
let pointerPx = { x: 0, y: 0 };
let hovered = null;

addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  pointerPx = { x: e.clientX, y: e.clientY };
});

const tooltip = document.getElementById('tooltip');
function setHover(id) {
  if (hovered === id) return;
  hovered = id;
  document.body.style.cursor = id ? 'pointer' : '';
  if (id) {
    const t = targets.find((t) => t.id === id);
    tooltip.textContent = t.label;
    tooltip.classList.add('show');
  } else {
    tooltip.classList.remove('show');
  }
}

// ── camera focus tween ──────────────────────────────────────────
const panel = document.getElementById('panel');
const panelBody = document.getElementById('panelBody');
let focusState = null;           // {savedCam, savedTarget}
let tween = null;                // {t, dur, fromCam, toCam, fromLook, toLook, onDone}

function startTween(toCam, toLook, onDone) {
  tween = {
    t: 0, dur: reducedMotion ? 0.01 : 1.1,
    fromCam: camera.position.clone(),
    toCam: new THREE.Vector3(...toCam),
    fromLook: controls.target.clone(),
    toLook: new THREE.Vector3(...toLook),
    onDone,
  };
  controls.enabled = false;
}

function openProject(id) {
  const t = targets.find((t) => t.id === id);
  const p = PROJECTS[t.id === 'deskcat' ? 'deskcat' : t.id];
  if (!focusState) {
    focusState = { savedCam: camera.position.clone(), savedTarget: controls.target.clone() };
  }
  controls.autoRotate = false;
  startTween(t.focus.cam, t.focus.look, null);
  panelBody.innerHTML = `
    <div class="kicker">${p.kicker}</div>
    <h2>${p.title}</h2>
    <p class="sub">${p.sub}</p>
    <p class="desc">${p.desc}</p>
    <ul>${p.points.map((x) => `<li>${x}</li>`).join('')}</ul>
    <div class="stack">${p.stack.map((x) => `<span>${x}</span>`).join('')}</div>
    ${p.link
      ? `<a class="cta" href="${p.link}" target="_blank" rel="noopener">View on GitHub ↗</a>`
      : `<span class="cta ghosted">🔒 ${p.lockNote}</span>`}
  `;
  panel.classList.add('open');
}

function closeProject() {
  if (!focusState) return;
  panel.classList.remove('open');
  startTween(focusState.savedCam.toArray(), focusState.savedTarget.toArray(), () => {
    controls.enabled = true;
  });
  focusState = null;
}

document.getElementById('panelClose').addEventListener('click', closeProject);
window.__open = openProject;
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProject(); });

let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) return;                       // it was a drag, not a click
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickMeshes, false)[0];
  if (hit) openProject(hit.object.userData.targetId);
  else if (focusState) closeProject();
});

// ── theme ───────────────────────────────────────────────────────
let themeName = matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
const themeBtn = document.getElementById('themeBtn');

function applyTheme(name) {
  themeName = name;
  const t = THEMES[name];
  document.body.classList.toggle('night', name === 'night');
  themeBtn.textContent = name === 'night' ? '☀️' : '🌙';
  scene.background = new THREE.Color(t.bg);
  scene.fog = new THREE.Fog(t.bg, 22, t.fogFar);
  ambient.color.set(t.ambient.color); ambient.intensity = t.ambient.intensity;
  sun.color.set(t.sun.color); sun.intensity = t.sun.intensity;
  lampLight.intensity = t.lampOn ? 2.4 : 0;
  lampShadeMat.emissiveIntensity = t.lampOn ? 0.9 : 0;
  winGlassMat.color.set(t.windowGlow);
  winGlassMat.emissive.set(t.windowGlow);
  winGlassMat.emissiveIntensity = t.windowIntensity;
  stars.visible = name === 'night';
  monScreenMat.emissiveIntensity = 0.35 * t.screenBoost;
  chartMat.emissiveIntensity = 0.6 * t.screenBoost;
  scanMat.emissiveIntensity = 0.15 * t.screenBoost;
  boardMat.emissiveIntensity = 0.15 * t.screenBoost;
}
themeBtn.addEventListener('click', () => applyTheme(themeName === 'day' ? 'night' : 'day'));
applyTheme(themeName);

// ── text version ────────────────────────────────────────────────
function buildTextCards() {
  const holder = document.getElementById('tvCards');
  holder.innerHTML = Object.values(PROJECTS).map((p) => `
    <div class="tv-card">
      <div class="kicker">${p.kicker}</div>
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
      ${p.link
        ? `<a href="${p.link}" target="_blank" rel="noopener">View on GitHub ↗</a>`
        : `<span class="lock">🔒 ${p.lockNote}</span>`}
    </div>`).join('');
}
function enterTextVersion(permanent) {
  textVersion.classList.add('show');
  if (permanent) document.getElementById('tvBack').style.display = 'none';
}
document.getElementById('textBtn').addEventListener('click', () => enterTextVersion(false));
document.getElementById('tvBack').addEventListener('click', () => textVersion.classList.remove('show'));

// ── resize ──────────────────────────────────────────────────────
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ── main loop ───────────────────────────────────────────────────
const clock = new THREE.Clock();
let catRegistered = false;
let frame = 0;

function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  frame++;

  if (!catRegistered && catModel) { registerCatMeshes(); catRegistered = true; }

  // camera tween
  if (tween) {
    tween.t += dt / tween.dur;
    const k = easeInOutCubic(Math.min(tween.t, 1));
    camera.position.lerpVectors(tween.fromCam, tween.toCam, k);
    controls.target.lerpVectors(tween.fromLook, tween.toLook, k);
    if (tween.t >= 1) { const done = tween.onDone; tween = null; done && done(); }
  }
  controls.update();

  // hover raycast (skip while a panel is open or mid-tween)
  if (!tween && !focusState && frame % 3 === 0) {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickMeshes, false)[0];
    setHover(hit ? hit.object.userData.targetId : null);
    if (hovered) {
      tooltip.style.left = `${pointerPx.x}px`;
      tooltip.style.top = `${pointerPx.y}px`;
    }
  }

  // cat: breathing + head tracking
  if (catModel) {
    const breathe = 1 + Math.sin(clock.elapsedTime * 1.8) * 0.012;
    if (catRig) catRig.bone.scale.setScalar(catRig.base * breathe);
    else catModel.scale.y = catModel.scale.x * breathe;
    const yaw = THREE.MathUtils.clamp(pointer.x * 0.55, -0.6, 0.6);
    const pitch = THREE.MathUtils.clamp(-pointer.y * 0.28, -0.35, 0.35);
    if (catHead && catHeadRest) {
      catHeadCur.yaw += (yaw - catHeadCur.yaw) * 0.08;
      catHeadCur.pitch += (pitch - catHeadCur.pitch) * 0.08;
      catHead.rotation.set(catHeadRest.x + catHeadCur.pitch, catHeadRest.y + catHeadCur.yaw, catHeadRest.z);
    } else {
      const rest = Math.PI / 5;
      catAnchor.rotation.y += (rest + yaw * 0.5 - catAnchor.rotation.y) * 0.06;
    }
  }

  // trading chart: advance ~4×/sec
  if (frame % 15 === 0) { stepChart(); drawChart(); }

  renderer.render(scene, camera);
});
