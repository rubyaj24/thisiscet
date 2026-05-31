import { init, resize, tick, updateScene, renderer, scene, camera, isReady } from './scene.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById('hero-canvas');
init(canvas);

const quoteEl = document.getElementById('hero-quote');
const titleEl = document.getElementById('hero-title');
const awardsCard = document.getElementById('awards-card');
const fadeOverlay = document.getElementById('fade-overlay');

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  infinite: false,
});

lenis.on('scroll', (e) => {
  ScrollTrigger.update();
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

    const titleFade = smoothstep(p, 0.7, 0.9, 0, 1);
    titleEl.style.opacity = titleFade;
    titleEl.style.transform = `translateY(${(1 - titleFade) * 20}px)`;

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

document.querySelectorAll('.section').forEach((section) => {
  const image = section.querySelector('.section-image');
  const content = section.querySelector('.section-content');

  if (image) {
    gsap.from(image, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
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
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
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
      lenis.scrollTo(target);
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
