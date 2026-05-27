import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export let scene, camera, renderer;
export let isReady = false;

let stars, starMaterial;
let shootingStars = [];
let cloudsGroup;
let cetGroup;
let campusLights;
let cetRevealValue = 0;
let starBaseOpacity = 1;
let cloudDescendOffset = 0;

export function init(canvas) {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  scene = new THREE.Scene();
  scene.background = createNightSkyTexture();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 1, 12);

  const ambient = new THREE.AmbientLight(0x222244, 0.6);
  scene.add(ambient);

  const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3);
  fillLight.position.set(-5, 0, 10);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0x88aaff, 0.8);
  rimLight.position.set(-4, 6, -8);
  scene.add(rimLight);

  const warmFill = new THREE.DirectionalLight(0xff8844, 0.4);
  warmFill.position.set(6, 2, -6);
  scene.add(warmFill);

  createMoon();
  createStars();
  createShootingStars();
  createClouds();
  loadCETModel();

  isReady = true;
}

export function resize(w, h) {
  if (!renderer) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

export function tick(dt) {
  if (!isReady) return;

  updateShootingStars(dt);
  animateStars(dt);
  animateClouds(dt);
  animateCET(dt);
}

/* ── Night Sky Background ── */

function createNightSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#000001');
  grad.addColorStop(0.15, '#010105');
  grad.addColorStop(0.3, '#02020e');
  grad.addColorStop(0.5, '#040416');
  grad.addColorStop(0.7, '#06061e');
  grad.addColorStop(0.85, '#080824');
  grad.addColorStop(1, '#0a0a28');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 1024);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  return texture;
}

/* ── Moon ── */

let moonMesh, moonGlow, moonPhase;

function getMoonPhase() {
  const now = new Date();
  function jd(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  const jdNow = jd(now.getFullYear(), now.getMonth() + 1, now.getDate()) + (now.getHours() - 12) / 24 + now.getMinutes() / 1440 + now.getSeconds() / 86400;
  return ((jdNow - 2451549.5) / 29.53058867) % 1;
}

function createMoon() {
  const moonLight = new THREE.DirectionalLight(0x8888cc, 1.2);
  moonLight.position.set(0, 15, -15);
  scene.add(moonLight);

  const geo = new THREE.SphereGeometry(0.8, 48, 48);
  moonPhase = getMoonPhase();

  const tex = new THREE.TextureLoader().load('/models/Solarsystemscope_texture_8k_moon.jpg');
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.8,
    metalness: 0.0,
    color: 0xffffff,
    emissive: 0xffcc88,
    emissiveIntensity: 3,
  });

  moonMesh = new THREE.Mesh(geo, mat);
  moonMesh.position.set(0, 15, -15);
  scene.add(moonMesh);

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d');
  const gGrad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gGrad.addColorStop(0, 'rgba(200,200,255,0.5)');
  gGrad.addColorStop(0.2, 'rgba(160,160,230,0.25)');
  gGrad.addColorStop(0.5, 'rgba(120,120,210,0.08)');
  gGrad.addColorStop(1, 'rgba(80,80,180,0)');
  gctx.fillStyle = gGrad;
  gctx.fillRect(0, 0, 256, 256);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);

  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 1,
  });
  moonGlow = new THREE.Sprite(glowMat);
  moonGlow.position.set(0, 15, -15);
  moonGlow.scale.set(6, 6, 1);
  scene.add(moonGlow);
}

/* ── Stars ── */

function createStars() {
  const count = 8000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.9 + 0.1);
    const r = 200 + Math.random() * 250;

    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.cos(phi) * r;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r - 40;

    const brightness = 0.5 + Math.random() * 0.5;
    const tint = Math.random();
    if (tint < 0.08) {
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.8;
      colors[i * 3 + 2] = brightness * 0.5;
    } else if (tint < 0.16) {
      colors[i * 3] = brightness * 0.7;
      colors[i * 3 + 1] = brightness * 0.8;
      colors[i * 3 + 2] = brightness;
    } else {
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const texture = createStarTexture();

  starMaterial = new THREE.PointsMaterial({
    size: 0.6,
    map: texture,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    sizeAttenuation: true,
  });

  stars = new THREE.Points(geometry, starMaterial);
  scene.add(stars);
}

function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

let starPulsePhase = 0;

function animateStars(dt) {
  starPulsePhase += dt * 0.8;
  const pulse = 0.92 + Math.sin(starPulsePhase) * 0.08;
  starMaterial.opacity = starBaseOpacity * pulse;
}

/* ── Shooting Stars ── */

function createShootingStars() {
  const count = 4;
  for (let i = 0; i < count; i++) {
    const segments = 25;
    const positions = new Float32Array(segments * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      map: createStarTexture(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const mesh = new THREE.Points(geometry, material);

    shootingStars.push({
      mesh,
      geometry,
      material,
      positions: new Float32Array(segments * 3),
      segments,
      active: false,
      life: 0,
      duration: 0.6 + Math.random() * 0.4,
      speed: 25 + Math.random() * 20,
      direction: new THREE.Vector3(),
      spawnTimer: Math.random() * 5,
      delay: 2 + Math.random() * 4,
    });

    scene.add(mesh);
  }
}

function spawnShootingStar(s) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * 0.4;
  const r = 60 + Math.random() * 40;

  const startX = Math.sin(theta) * Math.cos(phi) * r;
  const startY = Math.sin(phi) * r * 0.8 + 5;
  const startZ = -Math.cos(theta) * Math.cos(phi) * r - 15;

  s.direction.set(
    (Math.random() - 0.5) * 0.4,
    -(0.3 + Math.random() * 0.5),
    (Math.random() - 0.5) * 0.3,
  ).normalize();

  const length = 3 + Math.random() * 5;

  for (let i = 0; i < s.segments; i++) {
    const t = i / (s.segments - 1);
    s.positions[i * 3] = startX + s.direction.x * (-t * length);
    s.positions[i * 3 + 1] = startY + s.direction.y * (-t * length);
    s.positions[i * 3 + 2] = startZ + s.direction.z * (-t * length);
  }

  s.geometry.attributes.position.array.set(s.positions);
  s.geometry.attributes.position.needsUpdate = true;
  s.active = true;
  s.life = 0;
  s.material.opacity = 0;
  s.speed = 25 + Math.random() * 20;
  s.duration = 0.6 + Math.random() * 0.4;
}

function updateShootingStars(dt) {
  for (const s of shootingStars) {
    if (!s.active) {
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        spawnShootingStar(s);
        s.spawnTimer = s.delay + Math.random() * 3;
      }
      continue;
    }

    s.life += dt;
    const progress = s.life / s.duration;

    if (progress >= 1) {
      s.active = false;
      s.material.opacity = 0;
      continue;
    }

    const opacity = progress < 0.1 ? progress / 0.1 : 1 - Math.pow((progress - 0.1) / 0.9, 1.5);
    s.material.opacity = opacity * 0.9;

    const moveAmount = dt * s.speed;
    const dx = s.direction.x * moveAmount;
    const dy = s.direction.y * moveAmount;
    const dz = s.direction.z * moveAmount;

    const pos = s.geometry.attributes.position.array;
    for (let i = 0; i < s.segments; i++) {
      pos[i * 3] += dx;
      pos[i * 3 + 1] += dy;
      pos[i * 3 + 2] += dz;
    }
    s.geometry.attributes.position.needsUpdate = true;
  }
}

/* ── Clouds ── */

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.4)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createCloudCluster(texture, scale) {
  const group = new THREE.Group();
  const count = 25 + Math.floor(Math.random() * 20);
  const sx = scale * (0.7 + Math.random() * 0.3);
  const sy = scale * (0.15 + Math.random() * 0.1);
  const sz = scale * (0.25 + Math.random() * 0.15);

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * 0.9;
    const px = Math.sin(phi) * Math.cos(theta) * r * sx;
    const py = Math.sin(phi) * Math.sin(theta) * r * sy;
    const pz = Math.cos(phi) * r * sz;

    const size = (0.3 + Math.random() * 0.7) * scale * 0.5;
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(px, py, pz);
    sprite.scale.set(size, size, 1);
    group.add(sprite);
  }

  return group;
}

function createClouds() {
  cloudsGroup = new THREE.Group();
  const texture = createCloudTexture();

  const layers = [
    { yRange: [10, 16], zRange: [-12, -6], scaleRange: [7, 11], count: 5, opacity: 0.5 },
    { yRange: [6, 11], zRange: [-5, 0], scaleRange: [5, 9], count: 4, opacity: 0.4 },
    { yRange: [3, 7], zRange: [1, 5], scaleRange: [4, 7], count: 3, opacity: 0.3 },
  ];

  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const scale = layer.scaleRange[0] + Math.random() * (layer.scaleRange[1] - layer.scaleRange[0]);
      const cloudGroup = createCloudCluster(texture, scale);

      const y = layer.yRange[0] + Math.random() * (layer.yRange[1] - layer.yRange[0]);
      const z = layer.zRange[0] + Math.random() * (layer.zRange[1] - layer.zRange[0]);
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      cloudGroup.position.set(Math.cos(angle) * radius, y, z + Math.sin(angle) * radius);

      cloudGroup.userData = {
        baseY: y,
        baseZ: z,
        floatSpeed: 0.2 + Math.random() * 0.3,
        floatPhase: Math.random() * Math.PI * 2,
        layerType: layer.opacity,
      };

      cloudsGroup.add(cloudGroup);
    }
  }

  cloudsGroup.visible = true;
  scene.add(cloudsGroup);
}

function animateClouds(dt) {
  for (const cloudGroup of cloudsGroup.children) {
    const ud = cloudGroup.userData;
    if (!ud) continue;
    const floatOffset = Math.sin(Date.now() * 0.001 * ud.floatSpeed + ud.floatPhase) * 0.3;
    cloudGroup.position.y = ud.baseY - cloudDescendOffset + floatOffset;
  }
}

/* ── Campus Lights ── */

function createCampusLights() {
  const lightGroup = new THREE.Group();
  const warmColor = 0xffaa55;
  const coolColor = 0x4488ff;

  const configs = [
    { angle: 0, radius: 9, height: 0.3, color: warmColor, intensity: 2 },
    { angle: Math.PI * 0.25, radius: 10, height: 0.2, color: coolColor, intensity: 1.5 },
    { angle: Math.PI * 0.5, radius: 8.4, height: 0.4, color: warmColor, intensity: 2.5 },
    { angle: Math.PI * 0.75, radius: 9.6, height: 0.15, color: coolColor, intensity: 1.2 },
    { angle: Math.PI, radius: 9.2, height: 0.3, color: warmColor, intensity: 2 },
    { angle: Math.PI * 1.25, radius: 10.4, height: 0.25, color: warmColor, intensity: 1.8 },
    { angle: Math.PI * 1.5, radius: 8, height: 0.35, color: coolColor, intensity: 1.5 },
    { angle: Math.PI * 1.75, radius: 8.8, height: 0.2, color: warmColor, intensity: 2.2 },
  ];

  for (const cfg of configs) {
    const light = new THREE.PointLight(cfg.color, 0, 16);
    light.position.set(
      Math.cos(cfg.angle) * cfg.radius,
      cfg.height,
      Math.sin(cfg.angle) * cfg.radius,
    );
    lightGroup.add(light);

    const helper = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: cfg.color }),
    );
    helper.position.copy(light.position);
    lightGroup.add(helper);
  }

  return lightGroup;
}

async function loadCETModel() {
  try {
    const gltf = await new GLTFLoader().loadAsync('/models/cet_campus.glb');
    cetGroup = new THREE.Group();
    cetGroup.scale.set(0, 0, 0);

    const model = gltf.scene;
    model.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0;
        child.frustumCulled = false;
      }
    });

    cetGroup.add(model);
    scene.add(cetGroup);

    campusLights = createCampusLights();
    campusLights.visible = false;
    scene.add(campusLights);
  } catch {
    createCETPlaceholder();
  }
}

function createCETPlaceholder() {
  cetGroup = new THREE.Group();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d1a,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 1,
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(4.5, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  cetGroup.add(ground);

  const buildingMat1 = new THREE.MeshStandardMaterial({
    color: 0x8B0000,
    roughness: 0.5,
    metalness: 0.4,
    transparent: true,
    opacity: 1,
  });
  const buildingMat2 = new THREE.MeshStandardMaterial({
    color: 0x6B0000,
    roughness: 0.5,
    metalness: 0.3,
    transparent: true,
    opacity: 1,
  });
  const buildingMat3 = new THREE.MeshStandardMaterial({
    color: 0xCD7F32,
    roughness: 0.6,
    metalness: 0.2,
    transparent: true,
    opacity: 1,
  });
  const configs = [
    { pos: [-1.8, -1.8], h: 0.8, mat: buildingMat1 },
    { pos: [1.8, -1.8], h: 1.0, mat: buildingMat2 },
    { pos: [-1.8, 1.8], h: 0.6, mat: buildingMat1 },
    { pos: [1.8, 1.8], h: 1.2, mat: buildingMat3 },
    { pos: [-1.0, -1.0], h: 1.5, mat: buildingMat2 },
    { pos: [1.0, -1.0], h: 0.7, mat: buildingMat1 },
    { pos: [-1.0, 1.0], h: 1.1, mat: buildingMat3 },
    { pos: [1.0, 1.0], h: 0.9, mat: buildingMat2 },
    { pos: [0, -2.2], h: 0.5, mat: buildingMat1 },
    { pos: [-2.2, 0], h: 0.7, mat: buildingMat3 },
    { pos: [2.2, 0], h: 0.6, mat: buildingMat2 },
    { pos: [0, 2.2], h: 0.8, mat: buildingMat1 },
  ];

  for (const cfg of configs) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, cfg.h, 0.5),
      cfg.mat,
    );
    box.position.set(cfg.pos[0], cfg.h / 2, cfg.pos[1]);
    cetGroup.add(box);
  }

  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x8B0000,
    roughness: 0.3,
    metalness: 0.6,
    transparent: true,
    opacity: 1,
  });
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.35, 3.5, 8),
    towerMat,
  );
  tower.position.set(0, 1.75, 0);
  cetGroup.add(tower);

  const spireMat = new THREE.MeshStandardMaterial({
    color: 0xDAA520,
    roughness: 0.2,
    metalness: 0.9,
    transparent: true,
    opacity: 1,
  });
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.6, 6),
    spireMat,
  );
  spire.position.set(0, 3.55, 0);
  cetGroup.add(spire);

  const glowGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xDAA520,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, 3.9, 0);
  glow.userData = { isGlow: true };
  cetGroup.add(glow);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x8B0000,
    transparent: true,
    opacity: 0.15,
    wireframe: true,
  });
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 2.2, 48),
    ringMat,
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  ring.userData = { isRing: true };
  cetGroup.add(ring);

  cetGroup.scale.set(0, 0, 0);
  scene.add(cetGroup);

  campusLights = createCampusLights();
  campusLights.visible = false;
  scene.add(campusLights);
}

function animateCET(dt) {
  if (!cetGroup) return;
  for (const child of cetGroup.children) {
    if (child.userData.isRing) {
      child.rotation.z += dt * 0.2;
    }
    if (child.userData.isGlow) {
      child.material.opacity = cetRevealValue * (0.2 + Math.sin(Date.now() * 0.002) * 0.1);
    }
  }
}

/* ── Scene Update (called from ScrollTrigger) ── */

export function updateScene(progress) {
  if (!isReady) return;

  const p = progress;

  /* Camera */
  const camPositions = [
    { t: 0, pos: [0, 1, 12] },
    { t: 0.3, pos: [0, 2.5, 10] },
    { t: 0.55, pos: [0, 4, 7] },
    { t: 0.75, pos: [0, 2.5, 5] },
    { t: 1, pos: [0, 1.5, 4.5] },
  ];

  const camTargets = [
    { t: 0, pos: [0, 7, -15] },
    { t: 0.3, pos: [0, 4, -5] },
    { t: 0.55, pos: [0, 1, 0] },
    { t: 0.75, pos: [0, 0, 0] },
    { t: 1, pos: [0, 0, 0] },
  ];

  const pos = interpolateKeyframes(camPositions, p);
  camera.position.set(pos[0], pos[1], pos[2]);

  const target = interpolateKeyframes(camTargets, p);
  camera.lookAt(target[0], target[1], target[2]);

  /* Stars */
  starBaseOpacity = smoothstep(p, 0, 0.35, 1, 0);

  /* Shooting stars - stop spawning after star phase */
  const starsActive = p < 0.35;
  for (const s of shootingStars) {
    if (!starsActive && !s.active) {
      s.material.opacity = 0;
    }
    if (!starsActive) {
      s.spawnTimer = Infinity;
    }
  }

  /* Clouds */
  const cloudAppear = smoothstep(p, 0.25, 0.5, 0, 1);
  const cloudFade = smoothstep(p, 0.6, 0.8, 1, 0);
  const cloudOpacity = Math.min(cloudAppear, cloudFade) * cloudAppear;

  for (const cloudGroup of cloudsGroup.children) {
    const targetOpacity = cloudOpacity * cloudGroup.userData.layerType;
    if (cloudGroup.children.length > 0) {
      cloudGroup.children[0].material.opacity = targetOpacity;
    }
  }

  /* Clouds descend as they appear */
  const descendProgress = smoothstep(p, 0.25, 0.6, 0, 1);
  cloudDescendOffset = descendProgress * 12;

  /* CET model */
  if (cetGroup) {
    const cetReveal = smoothstep(p, 0.6, 0.85, 0, 1);
    const cetScale = smoothstep(p, 0.6, 0.9, 0, 0.2);
    const easeScale = 1 - Math.pow(1 - cetScale, 3);
    cetGroup.scale.set(easeScale, easeScale, easeScale);

    const cetRotate = smoothstep(p, 0.6, 1, 0, Math.PI * -1);
    cetGroup.rotation.y = cetRotate;

    cetRevealValue = cetReveal;

    cetGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = child.userData?.isGlow
          ? cetReveal * (0.2 + Math.sin(Date.now() * 0.002) * 0.1)
          : cetReveal;
      }
    });

    if (campusLights) {
      campusLights.visible = cetReveal > 0;
      const lightIntensity = Math.pow(cetReveal, 1.5) * 3;
      campusLights.children.forEach((child) => {
        if (child.isPointLight) {
          child.intensity = lightIntensity;
        }
      });
    }
  }
}

/* ── Helpers ── */

function smoothstep(t, a, b, va, vb) {
  if (t <= a) return va;
  if (t >= b) return vb;
  const x = (t - a) / (b - a);
  const ease = x * x * (3 - 2 * x);
  return va + (vb - va) * ease;
}

function interpolateKeyframes(kfs, t) {
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const x = (t - a.t) / (b.t - a.t);
      const ease = x * x * (3 - 2 * x);
      return [
        a.pos[0] + (b.pos[0] - a.pos[0]) * ease,
        a.pos[1] + (b.pos[1] - a.pos[1]) * ease,
        a.pos[2] + (b.pos[2] - a.pos[2]) * ease,
      ];
    }
  }
  return kfs[kfs.length - 1].pos;
}

export function dispose() {
  renderer.dispose();
  scene = null;
  camera = null;
  renderer = null;
  isReady = false;
}
