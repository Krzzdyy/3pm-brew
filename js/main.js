// ============================================
//   3PM BREW — Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- NAVBAR SCROLL ----
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // ---- MOBILE NAV ----
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-close');

  hamburger?.addEventListener('click', () => {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  const closeMobileNav = () => {
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  };

  mobileClose?.addEventListener('click', closeMobileNav);

  // Close on any link click
  mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileNav));

  // Close on backdrop click (clicking outside the links)
  mobileNav?.addEventListener('click', (e) => {
    if (e.target === mobileNav) closeMobileNav();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // ---- PARTICLES ----
  const particlesContainer = document.getElementById('hero-particles');
  if (particlesContainer) {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        width: ${2 + Math.random() * 4}px;
        height: ${2 + Math.random() * 4}px;
        animation-duration: ${5 + Math.random() * 10}s;
        animation-delay: ${Math.random() * 8}s;
        opacity: ${0.2 + Math.random() * 0.5};
      `;
      particlesContainer.appendChild(p);
    }
  }

  // ---- SCROLL REVEAL ----
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // ---- MENU TABS ----
  const tabs = document.querySelectorAll('.menu-tab');
  const menuSections = document.querySelectorAll('.menu-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      menuSections.forEach(section => {
        section.style.display = section.dataset.menu === target ? 'grid' : 'none';
      });
    });
  });

  // ---- COUNTER ANIMATION ----
  const counters = document.querySelectorAll('.count-up');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
          current = Math.min(current + increment, target);
          el.textContent = Math.floor(current) + suffix;
          if (current >= target) clearInterval(timer);
        }, 16);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));



  // ---- SMOOTH REVEAL HERO ELEMENTS ----
  const heroElements = document.querySelectorAll('[data-hero-delay]');
  heroElements.forEach(el => {
    const delay = el.dataset.heroDelay || 0;
    el.style.animationDelay = delay + 'ms';
  });

  // ---- ADD TO CART BUTTON ANIMATION ----
  document.querySelectorAll('.drink-card-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const original = btn.innerHTML;
      btn.innerHTML = '✓';
      btn.style.background = 'var(--sage)';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
      }, 1200);
    });
  });

  // ---- FEATURED DRINK CAROUSEL ----
  const drinks = [
    {
      name: 'Spanish Latte',
      desc: 'Rich espresso meets sweet condensed milk for a bold, velvety kick.',
      img: 'images/spanish latte.png',
      price: '₱89'
    },
    {
      name: 'Matcha Latte',
      desc: 'Ceremonial-grade matcha blended with creamy milk — earthy and smooth.',
      img: 'images/matcha latte.png',
      price: '₱99'
    },
    {
      name: 'Strawberry Milk',
      desc: 'Real strawberry chunks swirled into silky fresh milk. Pure joy in a cup.',
      img: 'images/strawberry milk.png',
      price: '₱89'
    },
    {
      name: 'Caramel Macchiato',
      desc: 'Espresso layered over vanilla milk with a golden caramel drizzle.',
      img: 'images/caramel macchiato.png',
      price: '₱89'
    }
  ];

  let currentDrink = 0;
  const featuredImg = document.getElementById('featured-img');
  const featuredName = document.getElementById('featured-name');
  const featuredDesc = document.getElementById('featured-desc');
  const featuredPrice = document.getElementById('featured-price');
  const drinkDots = document.querySelectorAll('.drink-dot');

  function updateFeatured(index) {
    if (!featuredImg) return;
    featuredImg.style.opacity = '0';
    featuredImg.style.transform = 'translateY(10px)';

    setTimeout(() => {
      const d = drinks[index];
      featuredImg.src = d.img;
      featuredName.textContent = d.name;
      featuredDesc.textContent = d.desc;
      featuredPrice.textContent = d.price;

      featuredImg.style.opacity = '1';
      featuredImg.style.transform = 'translateY(0)';

      drinkDots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }, 300);
  }

  featuredImg?.style && (featuredImg.style.transition = 'opacity 0.3s ease, transform 0.3s ease');

  drinkDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentDrink = i;
      updateFeatured(i);
    });
  });

  // Auto-rotate featured drink
  setInterval(() => {
    currentDrink = (currentDrink + 1) % drinks.length;
    updateFeatured(currentDrink);
  }, 4000);

});
