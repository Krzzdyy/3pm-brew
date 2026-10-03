// ============================================
//   3PM BREW — Main JavaScript
//   GSAP + ScrollTrigger + SplitText, smooth scrolling via Lenis
// ============================================

(() => {
  const root = document.documentElement;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const hasSplit = hasGSAP && !!window.SplitText;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = hasGSAP && !reduceMotion;

  // If GSAP failed to load, never leave content hidden
  if (!animate) root.classList.remove('motion');

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (hasSplit) gsap.registerPlugin(SplitText);
    if (window.Flip) gsap.registerPlugin(Flip);
    gsap.defaults({ ease: 'power3.out' });
  }

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ---- SMOOTH SCROLL (Lenis driven by the GSAP ticker) ----
  let lenis = null;
  if (animate && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const lockScroll = () => { lenis ? lenis.stop() : (document.body.style.overflow = 'hidden'); };
  const unlockScroll = () => { lenis ? lenis.start() : (document.body.style.overflow = ''); };

  const navbar = $('#navbar');
  const navOffset = () => (navbar ? navbar.offsetHeight - 1 : 0);

  function scrollToHash(hash) {
    const target = hash === '#home' || hash === '#' ? 0 : $(hash);
    if (target === null) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -navOffset(), duration: 1.4 });
    } else {
      const y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY - navOffset();
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href');
      if (hash.length < 2 && hash !== '#') return;
      e.preventDefault();
      closeMobileNav();
      scrollToHash(hash);
    });
  });

  // ---- OPEN / CLOSED STATUS (Asia/Manila, 3 PM – 10 PM) ----
  function updateOpenStatus() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila', hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === 'hour').value, 10) % 24;
    const m = parseInt(parts.find((p) => p.type === 'minute').value, 10);
    const mins = h * 60 + m;
    const isOpen = mins >= 15 * 60 && mins < 22 * 60;
    const text = isOpen
      ? 'Open now, until 10:00 PM'
      : mins < 15 * 60 ? 'Closed now, opens today at 3:00 PM' : 'Closed now, opens tomorrow at 3:00 PM';
    $$('.open-status').forEach((el) => {
      el.classList.toggle('is-open', isOpen);
      $('.open-text', el).textContent = text;
    });
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60 * 1000);

  // ---- CLOCK TICKS ----
  const ticks = $('#clock-ticks');
  if (ticks) {
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      const a = (i / 60) * Math.PI * 2;
      const r1 = major ? 166 : 176;
      const r2 = 184;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 200 + Math.sin(a) * r1);
      line.setAttribute('y1', 200 - Math.cos(a) * r1);
      line.setAttribute('x2', 200 + Math.sin(a) * r2);
      line.setAttribute('y2', 200 - Math.cos(a) * r2);
      if (major) line.classList.add('major');
      ticks.appendChild(line);
    }
  }

  // ---- MOBILE NAV ----
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobile-nav');
  const mobileClose = $('#mobile-close');
  let mobileOpen = false;
  let mobileTl = null;

  if (animate && mobileNav) {
    mobileTl = gsap.timeline({ paused: true })
      .set(mobileNav, { visibility: 'visible' })
      .fromTo(mobileNav,
        { clipPath: 'circle(0% at 92% 4%)' },
        { clipPath: 'circle(150% at 92% 4%)', duration: 0.8, ease: 'power3.inOut' })
      .from($$('nav a, .mobile-nav-hours', mobileNav), {
        y: 40, autoAlpha: 0, stagger: 0.05, duration: 0.6,
      }, '-=0.4');
  }

  function openMobileNav() {
    if (!mobileNav || mobileOpen) return;
    mobileOpen = true;
    mobileNav.setAttribute('aria-hidden', 'false');
    hamburger?.setAttribute('aria-expanded', 'true');
    if (mobileTl) mobileTl.timeScale(1).play();
    else { mobileNav.style.visibility = 'visible'; mobileNav.style.clipPath = 'none'; }
    lockScroll();
    mobileClose?.focus();
  }

  function closeMobileNav() {
    if (!mobileNav || !mobileOpen) return;
    mobileOpen = false;
    mobileNav.setAttribute('aria-hidden', 'true');
    hamburger?.setAttribute('aria-expanded', 'false');
    if (mobileTl) mobileTl.timeScale(1.6).reverse();
    else { mobileNav.style.visibility = ''; mobileNav.style.clipPath = ''; }
    unlockScroll();
  }

  hamburger?.addEventListener('click', openMobileNav);
  mobileClose?.addEventListener('click', closeMobileNav);

  // ---- NAVBAR: solid after hero start, hide on scroll down, show on scroll up ----
  if (hasGSAP) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        navbar.classList.toggle('scrolled', y > 60);
        if (mobileOpen) return;
        if (self.direction === 1 && y > window.innerHeight * 0.6) navbar.classList.add('nav-hidden');
        else if (self.direction === -1) navbar.classList.remove('nav-hidden');
      },
    });
  } else {
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
  }
  // Keyboard users tabbing into the nav should always see it
  navbar.addEventListener('focusin', () => navbar.classList.remove('nav-hidden'));

  // ---- FEATURED DRINK (hero) ----
  const drinks = [
    { name: 'Spanish Latte', desc: 'Rich espresso meets sweet condensed milk for a bold, velvety kick.', img: 'images/drinks/spanish-latte.webp', price: '₱89' },
    { name: 'Matcha Latte', desc: 'Ceremonial-grade matcha blended with creamy milk. Earthy and smooth.', img: 'images/drinks/matcha-latte.webp', price: '₱99' },
    { name: 'Strawberry Milk', desc: 'Real strawberry chunks swirled into silky fresh milk. Pure joy in a cup.', img: 'images/drinks/strawberry-milk.webp', price: '₱89' },
    { name: 'Caramel Macchiato', desc: 'Espresso layered over vanilla milk with a golden caramel drizzle.', img: 'images/drinks/caramel-macchiato.webp', price: '₱89' },
  ];
  // Warm the cache so swaps never flash
  drinks.forEach((d) => { const i = new Image(); i.src = d.img; });

  const featuredImg = $('#featured-img');
  const featuredText = $('.featured-text');
  const featuredName = $('#featured-name');
  const featuredDesc = $('#featured-desc');
  const featuredPrice = $('#featured-price');
  const drinkDots = $$('.drink-dot');
  let currentDrink = 0;
  let autoplay = null;

  function applyDrink(d) {
    featuredImg.src = d.img;
    featuredImg.alt = d.name;
    featuredName.textContent = d.name;
    featuredDesc.textContent = d.desc;
    featuredPrice.textContent = d.price;
  }

  function showDrink(index) {
    if (!featuredImg || index === currentDrink) return;
    currentDrink = index;
    drinkDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-selected', i === index);
    });
    const d = drinks[index];

    if (!animate) { applyDrink(d); return; }

    gsap.timeline({ defaults: { overwrite: 'auto' } })
      .to(featuredImg, { autoAlpha: 0, scale: 0.85, rotation: -8, duration: 0.35, ease: 'power2.in' }, 0)
      .to([featuredText, featuredPrice], { autoAlpha: 0, y: 8, duration: 0.25, ease: 'power2.in' }, 0)
      .add(() => applyDrink(d))
      .fromTo(featuredImg, { rotation: 8, scale: 0.85 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.6)' })
      .to([featuredText, featuredPrice], { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05 }, '<0.1');
  }

  function scheduleNext() {
    if (!hasGSAP) return;
    autoplay?.kill();
    autoplay = gsap.delayedCall(4.5, () => {
      showDrink((currentDrink + 1) % drinks.length);
      scheduleNext();
    });
  }

  drinkDots.forEach((dot, i) => dot.addEventListener('click', () => { showDrink(i); scheduleNext(); }));
  if (hasGSAP) {
    scheduleNext();
  } else {
    setInterval(() => showDrink((currentDrink + 1) % drinks.length), 4500);
  }

  // ---- MENU BOARD: tabs, filtering, live preview ----
  const tabs = $$('.menu-tab');
  const tabIndicator = $('.menu-tab-indicator');
  const menuGroups = $$('.menu-group');
  const menuItems = $$('.menu-item');
  const menuList = $('.menu-list');
  const previewImg = $('.menu-preview-img');
  const previewText = $('.menu-preview-text');
  const previewCat = $('.menu-preview-cat');
  const previewName = $('.menu-preview-name');
  const previewDesc = $('.menu-preview-desc');
  const previewPrice = $('.menu-preview-price');
  const desktopBoard = window.matchMedia('(min-width: 1025px)');
  let activeItem = null;
  let pointerInList = false;

  const itemData = (item) => ({
    img: item.dataset.img,
    name: $('.menu-item-name', item).textContent.trim(),
    desc: item.dataset.desc,
    price: $('.menu-item-price', item).textContent.trim(),
    cat: item.dataset.cat,
  });

  function previewItem(item, instant = false) {
    if (!item || item === activeItem || !previewImg || !desktopBoard.matches) return;
    activeItem?.classList.remove('is-active');
    activeItem = item;
    item.classList.add('is-active');

    const d = itemData(item);
    const apply = () => {
      previewImg.src = d.img;
      previewCat.textContent = d.cat;
      previewName.textContent = d.name;
      previewDesc.textContent = d.desc;
      previewPrice.textContent = d.price;
    };
    if (!animate || instant) { apply(); return; }

    gsap.to(previewImg, {
      autoAlpha: 0, y: 24, rotation: -5, duration: 0.18, ease: 'power2.in', overwrite: true,
      onComplete: () => {
        apply();
        gsap.fromTo(previewImg,
          { y: 40, rotation: 6, scale: 0.92 },
          { autoAlpha: 1, y: 0, rotation: 0, scale: 1, duration: 0.7, ease: 'back.out(1.6)', overwrite: true });
      },
    });
    gsap.fromTo([previewText, previewPrice], { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.05, delay: 0.2, overwrite: true });
    gsap.to('.menu-preview-ring circle', { rotation: '+=24', svgOrigin: '200 200', duration: 0.9, ease: 'power3.out' });
  }

  const firstVisibleItem = () => menuItems.find((item) => !item.closest('.menu-group').hidden);

  menuItems.forEach((item) => {
    item.addEventListener('pointerenter', () => previewItem(item));
    item.addEventListener('focus', () => previewItem(item));
    item.addEventListener('click', () => openModal(itemData(item)));
  });
  menuList?.addEventListener('pointerenter', () => { pointerInList = true; });
  menuList?.addEventListener('pointerleave', () => { pointerInList = false; });

  // The highlight only makes sense alongside the desktop preview panel
  const syncBoardMode = () => {
    if (desktopBoard.matches) previewItem(firstVisibleItem(), true);
    else { activeItem?.classList.remove('is-active'); activeItem = null; }
  };
  desktopBoard.addEventListener('change', syncBoardMode);
  syncBoardMode();

  // Preload the drink photos shortly before the menu scrolls into view
  if (menuList && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      new Set(menuItems.map((i) => i.dataset.img)).forEach((src) => { new Image().src = src; });
      io.disconnect();
    }, { rootMargin: '800px 0px' });
    io.observe(menuList);
  }

  function moveIndicator(tab, instant) {
    if (!tabIndicator || !tab) return;
    const props = { x: tab.offsetLeft, width: tab.offsetWidth };
    if (hasGSAP) gsap.to(tabIndicator, { ...props, duration: instant || !animate ? 0 : 0.55, ease: 'power3.out' });
    else Object.assign(tabIndicator.style, { transform: `translateX(${props.x}px)`, width: `${props.width}px` });
  }

  function filterMenu(cat) {
    const apply = () => menuGroups.forEach((g) => { g.hidden = cat !== 'all' && g.dataset.menu !== cat; });

    if (animate && window.Flip) {
      const state = Flip.getState(menuGroups);
      apply();
      Flip.from(state, {
        duration: 0.6, ease: 'power3.inOut', absolute: true,
        onEnter: (groups) => {
          gsap.set(groups, { autoAlpha: 1 });
          return gsap.fromTo(
            groups.flatMap((g) => [$('.menu-group-title', g), ...$$('.menu-row', g)]),
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.03, delay: 0.15 });
        },
        onLeave: (groups) => gsap.to(groups, { autoAlpha: 0, duration: 0.25 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else {
      apply();
    }

    // Keep the tabs in view when the list gets shorter
    const tabsBar = $('.menu-tabs');
    if (tabsBar && tabsBar.getBoundingClientRect().top < 0) scrollToHash('#menu');
    activeItem?.classList.remove('is-active');
    activeItem = null;
    previewItem(firstVisibleItem());
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;
      tabs.forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      moveIndicator(tab);
      filterMenu(tab.dataset.tab);
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => moveIndicator($('.menu-tab.active'), true), 150);
  });

  // ---- DRINK MODAL ----
  const modal = $('#menu-modal');
  const modalCard = $('.menu-modal-card', modal);
  const modalImg = $('#modal-img');
  const modalName = $('#modal-name');
  const modalDesc = $('#modal-desc');
  const modalPrice = $('#modal-price');
  const modalClose = $('#menu-modal-close');
  let modalReturnFocus = null;
  let modalOpen = false;

  function openModal(d) {
    modalImg.src = d.img;
    modalImg.alt = d.name;
    modalName.textContent = d.name;
    modalDesc.textContent = d.desc;
    modalPrice.textContent = d.price;

    modalReturnFocus = document.activeElement;
    modal.hidden = false;
    modalOpen = true;
    lockScroll();
    modalCard.scrollTop = 0;

    if (animate) {
      gsap.timeline({ defaults: { overwrite: true } })
        .fromTo(modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' })
        .fromTo(modalCard, { y: 60, scale: 0.94 }, { y: 0, scale: 1, duration: 0.6, ease: 'expo.out' }, 0)
        .fromTo(modalImg, { y: 40, rotation: -8, autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.5)' }, 0.1)
        .fromTo($$('.menu-modal-body > *', modal), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 }, 0.15);
    }
    modalClose.focus();
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    const finish = () => {
      modal.hidden = true;
      unlockScroll();
      modalReturnFocus?.focus?.({ preventScroll: true });
    };
    if (animate) {
      gsap.timeline({ onComplete: finish, defaults: { overwrite: true } })
        .to(modalCard, { y: 40, scale: 0.96, duration: 0.3, ease: 'power2.in' }, 0)
        .to(modal, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0);
    } else {
      finish();
    }
  }

  $$('.drink-card').forEach((card) => {
    const open = () => openModal({
      img: $('img', card).src,
      name: $('.drink-card-name', card).textContent.trim(),
      desc: $('.drink-card-desc', card).textContent.trim(),
      price: $('.drink-card-price', card).textContent.trim(),
    });
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Keep keyboard focus inside the open modal
  modal?.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = $$('button, a[href]', modal);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modalOpen) closeModal();
    else closeMobileNav();
  });

  // ============================================
  //   ANIMATIONS (skipped entirely for reduced motion / no GSAP)
  // ============================================
  moveIndicator($('.menu-tab.active'), true);
  if (!animate) {
    if (!hasGSAP) $('.menu-tabs')?.classList.add('no-indicator');
    return;
  }

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);

  fontsReady.then(() => {
    moveIndicator($('.menu-tab.active'), true);
    heroIntro();
    heroScroll();
    marquee();
    splitHeadings();
    revealBatches();
    aboutScenes();
    experienceScenes();
    menuBoardScenes();
    footerWordmark();
    navActiveLinks();

    gsap.to('.scroll-progress span', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });

    // Triggers were created in mixed order (pinned section in matchMedia);
    // sort by page position so refresh/pin-spacing math is correct.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  // ---- HERO INTRO ----
  function heroIntro() {
    const title = $('#hero-title');
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    gsap.set(title, { autoAlpha: 1 });
    if (hasSplit) {
      const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'hero-line' });
      tl.from(split.lines, { yPercent: 115, duration: 1.2, stagger: 0.14 }, 0.1);
    } else {
      tl.from(title, { autoAlpha: 0, y: 40, duration: 1 }, 0.1);
    }

    tl.from($$('.hero-left [data-hero]'), { autoAlpha: 0, y: 28, duration: 1, stagger: 0.09 }, 0.45)
      .from('.hero-stage', { autoAlpha: 0, scale: 0.9, duration: 1.6, ease: 'expo.out' }, 0.2)
      .from('#clock-ticks line', { autoAlpha: 0, duration: 0.4, stagger: 0.012, ease: 'none' }, 0.3)
      .from('.clock-hour', { rotation: -90, svgOrigin: '200 200', duration: 1.8, ease: 'expo.inOut' }, 0.35)
      .from('#clock-minute line', { rotation: -360, svgOrigin: '200 200', duration: 2, ease: 'expo.inOut' }, 0.3)
      .from('.hero-drink-wrap', { yPercent: 35, autoAlpha: 0, duration: 1.5, ease: 'expo.out' }, 0.55)
      .from('.hero-right [data-hero]', { autoAlpha: 0, y: 20, duration: 0.9 }, 0.9)
      .from('.count-up', {
        textContent: 0, duration: 1.8, ease: 'power2.out',
        snap: { textContent: 1 }, stagger: 0.1,
      }, 0.8)
      .from('.scroll-cue', { autoAlpha: 0, duration: 0.6 }, 1.4);

    // Gentle float on the cup, paused whenever the hero is off-screen
    const float = gsap.to('.featured-drink-img', { y: -14, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) { float.resume(); autoplay?.resume(); }
        else { float.pause(); autoplay?.pause(); }
      },
    });
  }

  // ---- HERO SCROLL-OUT ----
  function heroScroll() {
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      defaults: { ease: 'none' },
    })
      .to('.hero-left', { y: -90, opacity: 0.15 }, 0)
      .to('.hero-right', { y: 70 }, 0)
      .to('#clock-minute', { rotation: 300, svgOrigin: '200 200' }, 0)
      .to('.hero-drink-wrap', { rotation: 6, scale: 0.94 }, 0)
      .to('.hero-bg-text', { xPercent: 18 }, 0);
  }

  // ---- MARQUEE (speeds up with scroll velocity) ----
  function marquee() {
    const loop = gsap.to('.marquee-track', { xPercent: -50, ease: 'none', duration: 32, repeat: -1 });
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 6);
        gsap.to(loop, {
          timeScale: boost, duration: 0.2, overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1.2, ease: 'power2.out' }),
        });
      },
    });
  }

  // ---- SECTION HEADINGS: masked line reveal ----
  function splitHeadings() {
    $$('.section-title[data-split]').forEach((heading) => {
      gsap.set(heading, { autoAlpha: 1 });
      if (!hasSplit) {
        gsap.from(heading, { autoAlpha: 0, y: 30, duration: 1, scrollTrigger: { trigger: heading, start: 'top 88%', once: true } });
        return;
      }
      SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
        }),
      });
    });
  }

  // ---- GENERIC REVEALS (batched, staggered) ----
  function revealBatches() {
    const els = $$('[data-reveal]').filter((el) => !el.closest('.hero'));
    gsap.set(els, { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, overwrite: true,
        clearProps: 'transform',
      }),
    });
  }

  // ---- ABOUT: clip reveal + image parallax ----
  function aboutScenes() {
    gsap.fromTo('.collage-img',
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', stagger: 0.15,
        scrollTrigger: { trigger: '.about-img-collage', start: 'top 80%', once: true },
      });

    $$('.collage-img img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    gsap.fromTo('.about-bg-text', { xPercent: 10 }, {
      xPercent: -30, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  // ---- EXPERIENCE: pinned horizontal scroll on desktop, parallax stack on mobile ----
  function experienceScenes() {
    const section = $('#experience');
    const track = $('.exp-track', section);
    const cards = $$('.exp-card', section);
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1025px)', () => {
      section.classList.add('exp-horizontal');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const horizontal = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.exp-pin',
          pin: true,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      cards.forEach((card) => {
        gsap.fromTo($('.exp-card-img', card), { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: horizontal, start: 'left right', end: 'right left', scrub: true },
        });
        gsap.from($('.exp-card-content', card), {
          y: 40, autoAlpha: 0, duration: 0.9,
          scrollTrigger: { trigger: card, containerAnimation: horizontal, start: 'left 75%', toggleActions: 'play none none reverse' },
        });
      });

      return () => section.classList.remove('exp-horizontal');
    });

    mm.add('(max-width: 1024px)', () => {
      cards.forEach((card) => {
        gsap.from(card, {
          y: 50, autoAlpha: 0, duration: 1,
          scrollTrigger: { trigger: card, start: 'top 90%', once: true },
        });
        gsap.fromTo($('.exp-card-img', card), { yPercent: -6 }, {
          yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });

    // Re-sort after breakpoint changes rebuild the pinned section
    ScrollTrigger.addEventListener('refreshInit', () => ScrollTrigger.sort());
  }

  // ---- MENU BOARD: preview follows the row at the middle of the screen ----
  function menuBoardScenes() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1025px)', () => {
      menuItems.forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => { if (self.isActive && !pointerInList) previewItem(item); },
        });
      });
    });

    gsap.from('.menu-preview-inner', {
      clipPath: 'inset(12% 8% 12% 8% round 32px)', autoAlpha: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.menu-board', start: 'top 80%', once: true },
    });
  }

  // ---- FOOTER WORDMARK ----
  function footerWordmark() {
    const mark = $('.footer-wordmark');
    if (!mark || !hasSplit) return;
    const split = SplitText.create(mark, { type: 'chars', mask: 'chars', charsClass: 'char' });
    gsap.from(split.chars, {
      yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.045,
      scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true },
    });
  }

  // ---- ACTIVE NAV LINK ----
  function navActiveLinks() {
    const links = $$('.nav-links a');
    links.forEach((link) => {
      const section = $(link.getAttribute('href'));
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => link.classList.toggle('active', self.isActive),
      });
    });
  }
})();
