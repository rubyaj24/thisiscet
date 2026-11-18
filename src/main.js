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
