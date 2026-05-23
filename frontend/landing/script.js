// ── NAV dark/light ────────────────────────────────────────────────────────────
const nav = document.getElementById('mainNav');
const phoneSection = document.getElementById('how');

function updateNav() {
  const vRect = phoneSection.getBoundingClientRect();
  const inSection = vRect.top <= 64 && vRect.bottom >= 64;
  nav.classList.toggle('dark-nav', inSection);
}
window.addEventListener('scroll', updateNav, { passive: true });

// ── PHONE SCENE SCROLL ────────────────────────────────────────────────────────
const psLayers = [0,1,2,3].map(i => document.getElementById('psl'+i));
const psSteps  = [0,1,2,3].map(i => document.getElementById('pss'+i));
const psStats  = [0,1,2,3].map(i => document.getElementById('psr'+i));
const psDots   = [0,1,2,3].map(i => document.getElementById('psd'+i));
const psBar    = document.getElementById('psBar');
const psProgress = document.getElementById('psProgress');
const psPhone  = document.getElementById('psPhone');

let curPS = 0;
let psBarDone = false;

function setPS(n) {
  if (n === curPS) return;
  psLayers[curPS].classList.remove('on');
  psSteps[curPS].classList.remove('on');
  psStats[curPS].classList.remove('on');
  psDots[curPS].classList.remove('on');
  psLayers[n].classList.add('on');
  psSteps[n].classList.add('on');
  psStats[n].classList.add('on');
  psDots[n].classList.add('on');
  curPS = n;

  // glow on menu/done screens
  psPhone.classList.toggle('glow', n >= 2);

  // animate boot bar once
  if (n === 1 && !psBarDone) {
    psBarDone = true;
    psBar.style.width = '0%';
    setTimeout(() => { psBar.style.width = '100%'; }, 100);
  }
}

function onPhoneScroll() {
  const rect = phoneSection.getBoundingClientRect();
  const totalScroll = phoneSection.offsetHeight - window.innerHeight;
  const scrolled = Math.max(0, -rect.top);
  const progress = Math.min(1, scrolled / totalScroll);

  // Update progress bar
  if (psProgress) psProgress.style.width = (progress * 100) + '%';

  // Update step
  const step = Math.min(3, Math.floor(progress * 4));
  setPS(step);
}

window.addEventListener('scroll', onPhoneScroll, { passive: true });
onPhoneScroll();

// ── INTERSECTION OBSERVER ─────────────────────────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-in');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
fadeEls.forEach(el => io.observe(el));
