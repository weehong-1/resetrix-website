// ===== Header Scroll =====
const header = document.getElementById('header');
const navBackdrop = document.getElementById('navBackdrop');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== Mobile Nav =====
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

function setNavOpen(isOpen) {
  if (!mainNav || !header) return;
  mainNav.classList.toggle('open', isOpen);
  header.classList.toggle('menu-open', isOpen);
  document.body.classList.toggle('nav-drawer-open', isOpen);
  if (navBackdrop) {
    navBackdrop.classList.toggle('is-active', isOpen);
    navBackdrop.toggleAttribute('hidden', !isOpen);
    navBackdrop.setAttribute('aria-hidden', String(!isOpen));
  }
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  }
}

function closeNav() {
  setNavOpen(false);
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    setNavOpen(!mainNav.classList.contains('open'));
  });
}

if (navBackdrop) {
  navBackdrop.addEventListener('click', closeNav);
}

// Close nav on link click (not the Services parent — it toggles the submenu on mobile)
if (mainNav) {
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 992 && link.matches('.has-dropdown > a')) return;
      closeNav();
    });
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mainNav?.classList.contains('open')) {
    closeNav();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 992 && mainNav?.classList.contains('open')) {
    closeNav();
  }
});

// Mobile dropdown toggle
document.querySelectorAll('.has-dropdown > a').forEach(link => {
  link.addEventListener('click', (e) => {
    if (window.innerWidth <= 992) {
      e.preventDefault();
      link.parentElement.classList.toggle('open');
    }
  });
});

// ===== Simple Carousel Helper =====
function createSlider(slidesSelector, prevBtn, nextBtn, auto = false) {
  const slides = document.querySelectorAll(slidesSelector);
  if (!slides.length) return;
  let current = 0;

  function show(index) {
    slides[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
  }

  if (prevBtn) document.getElementById(prevBtn).addEventListener('click', () => show(current - 1));
  if (nextBtn) document.getElementById(nextBtn).addEventListener('click', () => show(current + 1));

  if (auto) {
    setInterval(() => show(current + 1), auto);
  }
}

// Process slider
createSlider('.process-slide', 'processPrev', 'processNext', 5000);

// ===== Services Carousel (horizontal scroll) =====
(function() {
  const track = document.getElementById('servicesTrack');
  if (!track) return;
  const cards = track.querySelectorAll('.service-card');
  let offset = 0;

  function getVisibleCards() {
    const firstCard = cards[0];
    if (!firstCard) return 1;
    const trackStyles = window.getComputedStyle(track);
    const gap = parseFloat(trackStyles.columnGap || trackStyles.gap || '0') || 0;
    const cardWidth = firstCard.getBoundingClientRect().width;
    if (!cardWidth) return 1;
    return Math.max(1, Math.floor((track.clientWidth + gap) / (cardWidth + gap)));
  }

  function getMaxOffsetIndex() {
    const visibleCards = getVisibleCards();
    return Math.max(0, cards.length - visibleCards);
  }

  function render() {
    const maxIndex = getMaxOffsetIndex();
    offset = Math.max(0, Math.min(offset, maxIndex));
    const targetLeft = cards[offset]?.offsetLeft ?? 0;
    track.style.transition = 'transform 0.5s ease';
    track.style.transform = `translateX(-${targetLeft}px)`;
  }

  function slide(dir) {
    offset += dir;
    render();
  }

  const prevBtn = document.getElementById('servicesPrev');
  const nextBtn = document.getElementById('servicesNext');
  if (prevBtn) prevBtn.addEventListener('click', () => slide(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => slide(1));

  // Initial position (avoids first paint with stale offset)
  render();

  window.addEventListener('resize', () => {
    // Re-clamp to the newest layout on breakpoint changes.
    render();
  });

  // Auto
  setInterval(() => {
    const maxIndex = getMaxOffsetIndex();
    offset = offset >= maxIndex ? 0 : offset + 1;
    render();
  }, 7000);
})();

// ===== Accordion =====
document.querySelectorAll('.accordion-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isActive = item.classList.contains('active');

    // Close all
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));

    if (!isActive) {
      item.classList.add('active');
    }
  });
});

// ===== Counter Animation =====
function animateCounters() {
  document.querySelectorAll('.counter-number').forEach(counter => {
    if (counter.dataset.animated) return;
    const target = parseInt(counter.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(update);
      else counter.dataset.animated = 'true';
    }

    requestAnimationFrame(update);
  });
}

// ===== Scroll Animations (IntersectionObserver) =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      // Trigger counters
      if (entry.target.closest('.counters-section')) {
        animateCounters();
      }
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// Also observe counters and skills sections directly
const counterSection = document.querySelector('.counters-section');
if (counterSection) observer.observe(counterSection);

// ===== Lightbox =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');
let currentLightbox = 0;
const lightboxUrls = Array.from(lightboxTriggers).map(t => t.href);

lightboxTriggers.forEach((trigger, i) => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    currentLightbox = i;
    lightboxImg.src = lightboxUrls[i];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.getElementById('lightboxPrev').addEventListener('click', (e) => {
  e.stopPropagation();
  currentLightbox = (currentLightbox - 1 + lightboxUrls.length) % lightboxUrls.length;
  lightboxImg.src = lightboxUrls[currentLightbox];
});

document.getElementById('lightboxNext').addEventListener('click', (e) => {
  e.stopPropagation();
  currentLightbox = (currentLightbox + 1) % lightboxUrls.length;
  lightboxImg.src = lightboxUrls[currentLightbox];
});

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
  if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
});

// ===== Smooth scroll for nav links =====
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== Active nav on scroll =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.main-nav a[href="#${id}"]`);
    if (link) {
      link.classList.toggle('active', scrollY >= top && scrollY < top + height);
    }
  });
});
