import { init, resize, tick, updateScene, renderer, scene, camera, isReady } from './scene.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('hero-canvas');
init(canvas);

// Hide preloader when scene is ready
const preloader = document.getElementById('preloader');
if (isReady) {
  preloader.classList.add('hidden');
}

// Check periodically if scene becomes ready (assets may load asynchronously)
let preloaderCheckCount = 0;
const preloaderCheckInterval = setInterval(() => {
  if (isReady) {
    preloader.classList.add('hidden');
    clearInterval(preloaderCheckInterval);
  }
  preloaderCheckCount++;
  // Stop checking after 100 attempts ( ~5 seconds at 50ms interval )
  if (preloaderCheckCount > 100) {
    clearInterval(preloaderCheckInterval);
  }
}, 50);

// Disable smooth scrolling and ScrollTrigger animations in reduced motion mode
if (prefersReducedMotion) {
  document.body.style.overflowY = 'auto';
}

const quoteEl = document.getElementById('hero-quote');
const titleEl = document.getElementById('hero-title');
const awardsCard = document.getElementById('awards-card');
const fadeOverlay = document.getElementById('fade-overlay');

const lenis = new Lenis({
  duration: prefersReducedMotion ? 0 : 1.2,
  easing: prefersReducedMotion ? undefined : (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: !prefersReducedMotion,
  wheelMultiplier: 1,
  infinite: false,
});

lenis.on('scroll', (e) => {
  if (!prefersReducedMotion) {
    ScrollTrigger.update();
  }
});

ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom bottom',
  pin: true,
  scrub: 0.3,
  onUpdate: (self) => {
    const p = self.progress;
    updateScene(p);

    quoteEl.style.opacity = 1 - smoothstep(p, 0, 0.2, 0, 1);
    quoteEl.style.transform = `translateY(${-p * 30}px)`;

    // Title is now always visible; subtle upward movement on scroll
    titleEl.style.transform = `translateY(${-p * 10}px)`;

    const cardFade = smoothstep(p, 0.55, 0.85, 0, 1);
    awardsCard.style.opacity = cardFade;
    awardsCard.style.transform = `translateX(-50%) translateY(${(1 - cardFade) * 15}px)`;

    const heroFade = smoothstep(p, 0.85, 1, 0, 1);
    fadeOverlay.style.opacity = heroFade;
  },
  onLeave: () => {
    fadeOverlay.style.opacity = 0;
  },
  onEnterBack: () => {
    fadeOverlay.style.opacity = 1;
  },
});

ScrollTrigger.refresh();

window.addEventListener('resize', () => {
  resize(window.innerWidth, window.innerHeight);
  ScrollTrigger.refresh();
});

/* ── Section scroll animations ── */

const scrollTriggerConfig = {
  trigger: '.section',
  start: 'top 85%',
  end: 'top 40%',
  scrub: 1,
};

document.querySelectorAll('.section').forEach((section) => {
  const image = section.querySelector('.section-image');
  const content = section.querySelector('.section-content');

  if (image) {
    gsap.from(image, {
      opacity: 0,
      y: 40,
      duration: prefersReducedMotion ? 0.01 : 1,
      ease: prefersReducedMotion ? undefined : 'power2.out',
      scrollTrigger: prefersReducedMotion ? {} : {
        trigger: section,
        start: 'top 85%',
        end: 'top 40%',
        scrub: 1,
      },
    });
  }

  if (content) {
    gsap.from(content, {
      opacity: 0,
      y: 40,
      duration: prefersReducedMotion ? 0.01 : 1,
      ease: prefersReducedMotion ? undefined : 'power2.out',
      scrollTrigger: prefersReducedMotion ? {} : {
        trigger: section,
        start: 'top 85%',
        end: 'top 40%',
        scrub: 1,
      },
    });
  }
});

/* ── Smooth scroll anchor links ── */

document.querySelectorAll('.footer-links a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      if (prefersReducedMotion) {
        target.scrollIntoView({ behavior: 'instant' });
      } else {
        lenis.scrollTo(target);
      }
    }
  });
});

let lastTime = 0;

function animate(time) {
  lenis.raf(time);

  try {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
    lastTime = time;

    if (isReady) {
      tick(dt);
      renderer.render(scene, camera);
    }
  } catch (e) {
    console.error('animate error:', e);
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function smoothstep(t, a, b, va, vb) {
  if (t <= a) return va;
  if (t >= b) return vb;
  const x = (t - a) / (b - a);
  const ease = x * x * (3 - 2 * x);
  return va + (vb - va) * ease;
}

// Sound Toggle
function toggleSound() {
  const btn = document.querySelector('.sound-toggle');
  if (!btn) return;
  
  const isOn = btn.classList.toggle('sound-on');
  localStorage.setItem('soundOn', isOn);
  
  const svg = btn.querySelector('svg');
  if (isOn) {
    svg.innerHTML = '<path d="M16.5 16.5l2.121-2.121L16.5 16.5M12 7l-4.5 4.5-1.421-1.421L12 7M19.653 19.653L18.28 18.28M7 12l4.5 4.5 1.421-1.421L7 12"/>';
  } else {
    svg.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="5" x2="9" y2="19"/><line x1="9" y1="19" x2="15" y2="5"/>';
  }
}

// Initialize sound state on load
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.sound-toggle');
  const saved = localStorage.getItem('soundOn') === 'true';
  if (saved && btn) {
    btn.classList.add('sound-on');
    const svg = btn.querySelector('svg');
    svg.innerHTML = '<path d="M16.5 16.5l2.121-2.121L16.5 16.5M12 7l-4.5 4.5-1.421-1.421L12 7M19.653 19.653L18.28 18.28M7 12l4.5 4.5 1.421-1.421L7 12"/>';
  }
});

// Progress Rail Animation
function initProgressRail() {
  const rail = document.querySelector('.progress-rail');
  if (!rail) return;
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollTop / scrollHeight;
    
    rail.style.background = `linear-gradient(to bottom, var(--gold) ${progress * 100}%, transparent ${progress * 100}%)`;
  });
}

initProgressRail();

// Hero → Postcard Transition (M2)
// Hero → Postcard Transition (M2) - Using ScrollTrigger pinning
function initHeroPostcardTransition() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  const paperBg = document.createElement('div');
  paperBg.className = 'paper-bg';
  hero.appendChild(paperBg);
  
  const wrapper = document.createElement('div');
  wrapper.className = 'hero-wrapper';
  
  const heroInner = hero.querySelector('.hero-overlay');
  if (heroInner) {
    wrapper.appendChild(heroInner);
  }
  hero.innerHTML = '';
  hero.appendChild(wrapper);
  
  // Pin hero section during postcard transition
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: '+=150%',
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;
      
      const scale = 1 - (0.14 * progress);
      const rotate = -2 * progress;
      const radius = 12 * progress;
      
      const wrapper = document.querySelector('.hero-wrapper');
      const paperBg = document.querySelector('.paper-bg');
      const cue = document.querySelector('.scroll-hint');
      
      if (wrapper) {
        wrapper.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
        wrapper.style.borderRadius = radius + 'px';
      }
      if (paperBg) {
        paperBg.style.opacity = progress;
      }
      if (cue) {
        cue.style.opacity = 1 - Math.min(progress * 10, 1);
      }
    },
  });
  
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const wrapper = document.querySelector('.hero-wrapper');
    const paperBg = document.querySelector('.paper-bg');
    const cue = document.querySelector('.scroll-hint');
    if (wrapper) {
      wrapper.style.transform = '';
      wrapper.style.borderRadius = '';
    }
    if (paperBg) paperBg.style.opacity = 1;
    if (cue) cue.style.opacity = 1;
  }
}

initHeroPostcardTransition();

// Drifting Mosaic Cards (M8)
function initDriftingMosaic() {
  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  
  const cards = document.querySelectorAll('.mosaic-image.parallax-image');
  if (!cards.length) return;
  
  let ticking = false;
  
  function update() {
    if (ticking) return;
    ticking = true;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    
    cards.forEach(card => {
      const speed = parseFloat(card.getAttribute('data-speed')) || 1;
      const rect = card.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const offset = (centerY - windowHeight / 2) * speed * 0.15;
      
      card.style.transform = `translateY(${offset}px)`;
    });
    
    ticking = false;
  }
  
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
  
  // Click to open story/lightbox (placeholder)
  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Open story or lightbox - placeholder
      console.log('Open story for:', card.className);
    });
  });
}

initDriftingMosaic();

// Floating Moon 3D (M9)
function initFloatingMoon() {
  const moonContainer = document.createElement('div');
  moonContainer.className = 'floating-moon';
  document.body.appendChild(moonContainer);
  
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  moonContainer.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  // Draw moon texture using the existing moon texture
  const moonImg = new Image();
  moonImg.crossOrigin = 'anonymous';
  moonImg.src = '/models/Solarsystemscope_texture_8k_moon.jpg';
  
  let angle = 0;
  
  function drawMoon() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.clip();
    
    if (moonImg.complete) {
      ctx.drawImage(moonImg, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback: draw procedural moon
      ctx.fillStyle = '#C9D6E8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add craters
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = Math.random() * 20 + 5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.1 + 0.05) + ')';
        ctx.fill();
      }
    }
    
    ctx.restore();
    
    // Add glow
    ctx.shadowColor = 'rgba(201, 214, 232, 0.5)';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(128, 128, 130, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201, 214, 232, 0.1)';
    ctx.fill();
  }
  
  moonImg.onload = drawMoon;
  drawMoon();
  
  // Subtle rotation animation
  let rotationAngle = 0;
  function animateMoon() {
    rotationAngle += 0.0005;
    const moonCanvas = document.querySelector('.floating-moon canvas');
    if (moonCanvas) {
      moonCanvas.style.transform = `rotate(${rotationAngle}rad)`;
    }
    requestAnimationFrame(animateMoon);
  }
  animateMoon();
  
  // Pause on reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    moonContainer.style.animation = 'none';
  }
}

initFloatingMoon();

// Explore 3D Pill (M10)
function initExplore3DPill() {
  const pill = document.createElement('a');
  pill.className = 'explore-3d-pill';
  pill.href = '#';
  pill.innerHTML = `
    <div class="pill-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    </div>
    <div class="pill-text">
      <span class="pill-label">Explore</span>
      <span class="pill-title">Campus in 3D</span>
    </div>
    <div class="pill-thumb"></div>
  `;
  
  pill.addEventListener('click', (e) => {
    e.preventDefault();
    // Toggle fullscreen 3D scene
    toggleFullscreen3D();
  });
  
  document.body.appendChild(pill);
  
  // Load thumbnail image
  const thumb = pill.querySelector('.pill-thumb');
  const thumbImg = new Image();
  thumbImg.src = '/models/cet_campus.glb'; // placeholder
  thumbImg.onload = () => {
    thumb.style.backgroundImage = `url(${thumbImg.src})`;
    thumb.style.backgroundSize = 'cover';
    thumb.style.backgroundPosition = 'center';
  };
}

initExplore3DPill();

// Toggle fullscreen 3D scene
function toggleFullscreen3D() {
  const existing = document.querySelector('.fullscreen-3d');
  if (existing) {
    existing.remove();
    document.body.style.overflow = '';
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-3d';
  overlay.innerHTML = `
    <div class="fullscreen-3d-close" aria-label="Close 3D view">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
    <canvas id="fullscreen-3d-canvas"></canvas>
  `;
  
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  
  // Close button
  overlay.querySelector('.fullscreen-3d-close').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = '';
  });
  
  // ESC to close
  function onEsc(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
    }
  }
  document.addEventListener('keydown', onEsc);
  
  // Initialize Three.js scene for fullscreen
  initFullscreen3DScene(overlay.querySelector('#fullscreen-3d-canvas'));
}

function initFullscreen3DScene(canvas) {
  if (!canvas) return;
  
  // Use existing Three.js setup from scene.js
  // This is a placeholder - would integrate with existing scene.js
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  
  // Simple placeholder - in production would init Three.js here
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  function draw() {
    ctx.fillStyle = '#0B0D12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw something to indicate 3D view
    ctx.fillStyle = 'rgba(201, 214, 232, 0.3)';
    ctx.font = '2rem Akira Expanded, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CET Campus 3D View', canvas.width / 2, canvas.height / 2);
    
    if (document.querySelector('.fullscreen-3d')) {
      requestAnimationFrame(draw);
    }
  }
  draw();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}


// Welcome Section Scroll Animation (M4-M7)
function initWelcomeAnimation() {
  const welcome = document.querySelector('.welcome');
  if (!welcome) return;
  
  const keralaSilhouette = welcome.querySelector('.kerala-silhouette');
  const keralaPath = welcome.querySelector('.kerala-path');
  const blueFill = welcome.querySelector('.welcome-blue-fill');
  const headlineClipped = welcome.querySelector('.welcome-headline-clipped');
  
  let stageA = false;
  let stageB = false;
  
  function update() {
    if (!welcome) return;
    
    const rect = welcome.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const progress = 1 - rect.top / (rect.height + window.innerHeight);
    const clamped = Math.max(0, Math.min(1, progress));
    
    // Stage A: Kerala rises (0-45%)
    if (clamped > 0.1 && clamped < 0.45 && !stageA) {
      stageA = true;
      document.body.classList.add('welcome-stage-a');
    }
    
    // Stage B: Kerala fills, blue fills, headline reveals (45-100%)
    if (clamped >= 0.45 && !stageB) {
      stageB = true;
      document.body.classList.add('welcome-stage-b');
      
      // Animate Kerala path to full scale
      const keralaPath = document.querySelector('.kerala-path');
      if (keralaPath) {
        keralaPath.style.transform = 'scaleY(1)';
        keralaPath.style.transition = 'transform 1.5s ease-out';
      }
      
      // Fade in blue fill
      const blueFill = document.querySelector('.welcome-blue-fill');
      if (blueFill) {
        blueFill.style.opacity = '1';
        blueFill.style.transition = 'opacity 1s ease-out 0.5s';
      }
      
      // Reveal clipped headline
      const clipped = document.querySelector('.welcome-headline-clipped');
      if (clipped) {
        clipped.style.clipPath = 'inset(0 0 0 0)';
        clipped.style.transition = 'clip-path 0.8s ease-out 0.8s';
      }
    }
    
    // Parallax on eyebrow (subtle)
    const eyebrow = document.querySelector('.welcome-eyebrow');
    if (eyebrow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      eyebrow.style.transform = `translateX(-50%) translateY(${scrollTop * 0.15}px)`;
    }
  }
  
  function onScroll() {
    window.requestAnimationFrame(update);
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
  
  // Reduced motion: skip all animations, show final state
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const keralaPath = document.querySelector('.kerala-path');
    if (keralaPath) keralaPath.style.transform = 'scaleY(1)';
    const blueFill = document.querySelector('.welcome-blue-fill');
    if (blueFill) blueFill.style.opacity = '1';
    const clipped = document.querySelector('.welcome-headline-clipped');
    if (clipped) clipped.style.clipPath = 'inset(0 0 0 0)';
  }
}

initWelcomeAnimation();

// Add SVG clipPath definition to document for Kerala mask
function injectKeralaClipPath() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'welcome-clip-path');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.innerHTML = `
    <defs>
      <clipPath id="keralaClip" clipPathUnits="objectBoundingBox">
        <path d="M0.5,0.917 L0.5,0.833 L0.475,0.8 L0.45,0.817 L0.425,0.783 L0.413,0.75 L0.388,0.733 L0.363,0.7 L0.338,0.667 L0.325,0.633 L0.313,0.6 L0.3,0.567 L0.295,0.533 L0.295,0.5 L0.295,0.467 L0.3,0.433 L0.319,0.417 L0.338,0.383 L0.363,0.367 L0.388,0.358 L0.413,0.358 L0.45,0.367 L0.475,0.4 L0.513,0.417 L0.538,0.433 L0.55,0.45 L0.563,0.467 L0.575,0.5 L0.575,0.533 L0.575,0.567 L0.575,0.6 L0.575,0.633 L0.563,0.667 L0.55,0.683 L0.538,0.717 L0.513,0.75 L0.488,0.783 L0.463,0.817 L0.438,0.833 L0.413,0.85 L0.413,0.883 L0.5,0.917 Z" transform="scale(0.00125, 0.001667)"/>
      </clipPath>
    </defs>
  `;
  document.body.appendChild(svg);
}

document.addEventListener('DOMContentLoaded', injectKeralaClipPath);

// Story Screen + Wavy Trail (M12-M13)
const storyData = [
  { 
    id: 1, 
    title: 'FROM KULATHOOR TO THE MOON', 
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&h=900&fit=crop',
    number: '01',
    stops: [
      { title: 'Origins', image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=200&fit=crop' },
      { title: 'Academics', image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop' },
      { title: 'Festivals', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop' },
      { title: 'Events', image: 'https://images.unsplash.com/photo-1504307651254-35680f356bae?w=200&h=200&fit=crop' },
      { title: 'Sports', image: 'https://images.unsplash.com/photo-1517351164595-61138a6d1551?w=200&h=200&fit=crop' },
    ]
  },
  { 
    id: 2, 
    title: 'ACADEMIC EXCELLENCE', 
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&h=900&fit=crop',
    number: '02',
    stops: [
      { title: 'CS Dept', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop' },
      { title: 'ECE Dept', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop' },
      { title: 'Mech Dept', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop' },
      { title: 'EEE Dept', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop' },
      { title: 'Civil Dept', image: 'https://images.unsplash.com/photo-1504307651254-35680f356bae?w=200&h=200&fit=crop' },
    ]
  },
  { 
    id: 3, 
    title: 'CET FESTIVALS', 
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&h=900&fit=crop',
    number: '03',
    stops: [
      { title: 'Drishti', image: 'https://images.unsplash.com/photo-1504307651254-35680f356bae?w=200&h=200&fit=crop' },
      { title: 'Dhwani', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop' },
      { title: 'Disha', image: 'https://images.unsplash.com/photo-1517351164595-61138a6d1551?w=200&h=200&fit=crop' },
      { title: 'Behind Scenes', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop' },
      { title: 'Photo Wall', image: 'https://images.unsplash.com/photo-1517351164595-61138a6d1551?w=200&h=200&fit=crop' },
    ]
  },
];

let currentStoryIndex = 0;

function initStoryScreen() {
  const storyScreen = document.getElementById('story-screen');
  const closeBtn = document.querySelector('.story-screen-close');
  const prevBtn = document.querySelector('.story-nav-diamond-btn.prev');
  const nextBtn = document.querySelector('.story-nav-diamond-btn.next');
  const trailStopsContainer = document.getElementById('trail-stops');
  
  if (!storyScreen) return;
  
  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeStoryScreen);
  }
  
  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !storyScreen.hasAttribute('hidden')) {
      closeStoryScreen();
    }
  });
  
  // Prev/Next navigation
  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateStory(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateStory(1));
  }
  
  // Keyboard arrows
  document.addEventListener('keydown', (e) => {
    if (storyScreen.hasAttribute('hidden')) return;
    if (e.key === 'ArrowLeft') navigateStory(-1);
    if (e.key === 'ArrowRight') navigateStory(1);
  });
  
  // Initialize trail stops
  initTrailStops();
  
  // Open story from READ pills (if any)
  document.querySelectorAll('.story-read-pill, .cta-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openStoryScreen(0);
    });
  });
  
  // Also open from chapter story carousel items
  document.querySelectorAll('.story-carousel-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      openStoryScreen(index % storyData.length);
    });
  });
}

function openStoryScreen(index) {
  currentStoryIndex = index;
  updateStoryScreen();
  document.getElementById('story-screen').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeStoryScreen() {
  document.getElementById('story-screen').hidden = true;
  document.body.style.overflow = '';
}

function navigateStory(direction) {
  const total = storyData.length;
  currentStoryIndex = (currentStoryIndex + direction + total) % total;
  updateStoryScreen();
}

function updateStoryScreen() {
  const story = storyData[currentStoryIndex];
  
  // Update title
  const titleEl = document.getElementById('story-title');
  if (titleEl) titleEl.textContent = story.title;
  
  // Update hero image
  const heroImg = document.getElementById('story-hero-img');
  if (heroImg) heroImg.src = story.image;
  
  // Update shield number
  const shieldNumber = document.getElementById('story-number');
  if (shieldNumber) shieldNumber.textContent = story.number;
  
  // Update trail stops
  updateTrailStops(story.stops);
}

function initTrailStops() {
  const container = document.getElementById('trail-stops');
  if (!container) return;
  
  // Use first story's stops initially
  const stops = storyData[0].stops;
  
  stops.forEach((stop, index) => {
    const stopEl = document.createElement('div');
    stopEl.className = 'trail-stop' + (index === 0 ? ' active' : '');
    stopEl.innerHTML = `<img src="${stop.image}" alt="${stop.title}">`;
    stopEl.addEventListener('click', () => setActiveTrailStop(index));
    container.appendChild(stopEl);
  });
}

function updateTrailStops(stops) {
  const container = document.getElementById('trail-stops');
  if (!container) return;
  
  container.innerHTML = '';
  
  stops.forEach((stop, index) => {
    const stopEl = document.createElement('div');
    stopEl.className = 'trail-stop' + (index === 0 ? ' active' : '');
    stopEl.innerHTML = `<img src="${stop.image}" alt="${stop.title}">`;
    stopEl.addEventListener('click', () => setActiveTrailStop(index));
    container.appendChild(stopEl);
  });
}

function setActiveTrailStop(index) {
  document.querySelectorAll('.trail-stop').forEach((stop, i) => {
    stop.classList.toggle('active', i === index);
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initStoryScreen);
