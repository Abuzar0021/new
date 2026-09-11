/* Pear — motion layer
   Lenis (smooth scroll) + GSAP ScrollTrigger + canvas film scrub */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     1. Smooth scroll
  ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); scrollTo(id); }
  }));

  /* ------------------------------------------------------------------
     2. Text splitting (chars / words / lines)
  ------------------------------------------------------------------ */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    el.setAttribute('aria-label', text);
    text.split(' ').forEach((word, i, arr) => {
      const w = document.createElement('span'); w.className = 'word'; w.setAttribute('aria-hidden', 'true');
      [...word].forEach((ch) => { const c = document.createElement('span'); c.className = 'char'; c.textContent = ch; w.appendChild(c); });
      el.appendChild(w);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.char', el);
  }
  $$('[data-split]').forEach(splitChars);
  $$('[data-split-lines] > span').forEach((line) => { const inner = document.createElement('span'); inner.textContent = line.textContent; line.textContent = ''; line.appendChild(inner); });
  $$('[data-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  });

  /* ------------------------------------------------------------------
     3. Film: preload frames, draw to canvas, scrub with scroll
  ------------------------------------------------------------------ */
  const FRAMES = 48;
  const canvas = $('#filmCanvas');
  const ctx = canvas.getContext('2d');
  const frames = [];
  const film = { i: 0 };
  let loaded = 0;

  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    drawFrame(film.i);
  }
  function drawFrame(i) {
    const img = frames[Math.round(i)] || frames.find(Boolean);
    if (!img || !img.complete) return;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.width, ch / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.fillStyle = '#f2f1ed'; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    $('#frameNo').textContent = String(Math.round(i) + 1).padStart(3, '0');
  }

  const pctEl = $('#loaderPct'), barEl = $('#loaderBar');
  function onProgress() {
    loaded++;
    const p = Math.round((loaded / FRAMES) * 100);
    pctEl.textContent = p + '%';
    gsap.to(barEl, { width: p + '%', duration: 0.3, ease: 'power2.out' });
    if (loaded === 1) sizeCanvas();
    if (loaded === FRAMES) document.fonts.ready.then(intro);
  }
  for (let i = 0; i < FRAMES; i++) {
    const img = new Image();
    img.src = `film/f${String(i).padStart(3, '0')}.jpg`;
    img.onload = img.onerror = onProgress;
    frames.push(img);
  }
  addEventListener('resize', sizeCanvas);

  /* ------------------------------------------------------------------
     4. Intro
  ------------------------------------------------------------------ */
  let introDone = false;
  function intro() {
    if (introDone) return; introDone = true;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut', delay: 0.3 })
      .set('#loader', { display: 'none' })
      .add(() => { body.classList.remove('is-loading'); lenis && lenis.start(); }, '<')
      .from('#heroTitle .char', { yPercent: 110, rotate: 4, duration: 1.2, stagger: 0.025 }, '-=0.7')
      .from('.hero__sub > span > span', { yPercent: 110, duration: 1, stagger: 0.12 }, '-=0.9')
      .from('.film__title .btn', { opacity: 0, y: 16, duration: 0.8 }, '-=0.6')
      .from('.header', { yPercent: -100, opacity: 0, duration: 0.9 }, '-=0.9')
      .from('.film__caption', { opacity: 0, x: 20, duration: 0.8 }, '-=0.6')
      .add(buildScroll, '-=0.8');
  }
  setTimeout(intro, 7000); // safety net

  /* ------------------------------------------------------------------
     5. Scroll choreography
  ------------------------------------------------------------------ */
  function buildScroll() {
    // -- film scrub
    gsap.to(film, {
      i: FRAMES - 1, ease: 'none', snap: 'i',
      scrollTrigger: { trigger: '#film', start: 'top top', end: 'bottom bottom', scrub: 0.35 },
      onUpdate: () => drawFrame(film.i),
    });
    // title drifts away while the film develops
    gsap.to('.film__title', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#film', start: '35% top', end: '75% top', scrub: true } });
    gsap.to('.film__hint', { opacity: 0, scrollTrigger: { trigger: '#film', start: '10% top', end: '20% top', scrub: true } });

    // -- Ch.1 pinned statements: one at a time, letterpress-y slide
    const lines = $$('.model__line');
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#model', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    lines.forEach((line, i) => {
      tl.fromTo(line, { opacity: 0, yPercent: 30, filter: 'blur(6px) url(#misregister)' }, { opacity: 1, yPercent: 0, filter: 'blur(0px) url(#misregister)', duration: 1 })
        .to(line, { opacity: i === lines.length - 1 ? 1 : 0, yPercent: i === lines.length - 1 ? 0 : -30, duration: 1 }, '+=0.6');
    });

    // -- Lede: words ink in as you scroll
    const words = $$('.lede__text .w');
    ScrollTrigger.create({
      trigger: '.lede__text', start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: (self) => { const n = Math.floor(self.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i <= n)); },
    });

    // -- generic reveals
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
    });
    // split headlines
    $$('.terms h2[data-split], .apply h2[data-split]').forEach((h) => {
      gsap.from($$('.char', h), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.012, scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
    });

    // -- Ch.2 painting: halftone dissolves to full colour as you scroll ("gilding")
    $$('[data-halftone]').forEach((wrap) => {
      const dots = $('[class*="--dots"]', wrap);
      gsap.fromTo(dots, { '--reveal': '0%' }, { '--reveal': '100%', ease: 'none', scrollTrigger: { trigger: wrap.closest('section'), start: 'top 70%', end: 'top -40%', scrub: 0.4 } });
    });
    // cards: sliding paper sheets
    $$('[data-card]').forEach((card, i) => {
      gsap.fromTo(card, { clipPath: 'inset(0 0 100% 0)', y: 60 }, { clipPath: 'inset(0 0 0% 0)', y: 0, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
      gsap.to(card, { y: -80 * (i + 1) * 0.5, ease: 'none', scrollTrigger: { trigger: '#work', start: 'top top', end: 'bottom bottom', scrub: true } });
    });

    // -- parallax bits (clouds, paintings)
    $$('[data-parallax]').forEach((el) => {
      const k = parseFloat(el.dataset.parallax);
      gsap.to(el, { yPercent: -60 * k, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // -- paper plane flight in the application section
    gsap.fromTo('#plane', { x: -80, y: 260, rotate: -20, opacity: 0 }, {
      x: 60, y: 0, rotate: 0, opacity: 1, ease: 'power2.out',
      scrollTrigger: { trigger: '#apply', start: 'top 70%', end: 'center center', scrub: 1 },
    });

    // -- header colour + hide on scroll down
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const h = $('#header');
        h.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 200);
      },
    });
    ['#work', '.footer'].forEach((sel) => ScrollTrigger.create({
      trigger: sel, start: 'top 40px', end: 'bottom 40px',
      onToggle: (s) => $('#header').classList.toggle('on-dark', s.isActive),
    }));
    // active chapter
    $$('[data-nav]').forEach((a) => ScrollTrigger.create({
      trigger: a.getAttribute('href'), start: 'top center', end: 'bottom center',
      onToggle: (s) => a.classList.toggle('is-active', s.isActive),
    }));

    ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------
     6. Cursor + magnetic buttons
  ------------------------------------------------------------------ */
  const cursor = $('#cursor');
  if (matchMedia('(pointer: fine)').matches && !reduced) {
    const setX = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
    const setY = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
    addEventListener('mousemove', (e) => { setX(e.clientX); setY(e.clientY); });
    $$('a, button, summary').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
    $$('input, textarea').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-text'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-text'));
    });
    const label = $('.cursor__label');
    $('#film').addEventListener('mouseenter', () => { label.textContent = 'Scroll'; cursor.classList.add('has-label'); });
    $('#film').addEventListener('mouseleave', () => cursor.classList.remove('has-label'));

    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.35);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* ------------------------------------------------------------------
     7. Mobile menu
  ------------------------------------------------------------------ */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = (open) => {
    burger.classList.toggle('is-open', open); menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    open ? lenis?.stop() : lenis?.start();
    body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ------------------------------------------------------------------
     8. FAQ accordion (animated height, one open)
  ------------------------------------------------------------------ */
  const items = $$('.faq__item');
  items.forEach((item) => {
    const bodyEl = $('.faq__body', item);
    $('summary', item).addEventListener('click', (e) => {
      e.preventDefault();
      if (item.open) {
        gsap.to(bodyEl, { height: 0, opacity: 0, duration: 0.45, ease: 'expo.out', onComplete: () => { item.open = false; gsap.set(bodyEl, { clearProps: 'all' }); } });
      } else {
        items.forEach((o) => o !== item && o.open && $('summary', o).click());
        item.open = true;
        gsap.from(bodyEl, { height: 0, opacity: 0, duration: 0.6, ease: 'expo.out', clearProps: 'all', onUpdate: ScrollTrigger.update });
      }
    });
  });

  /* ------------------------------------------------------------------
     9. Form
  ------------------------------------------------------------------ */
  const form = $('#applyForm'), note = $('#applyNote'), formPear = $('#formPear');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('.field', form).forEach((f) => { const i = $('input, textarea', f); const bad = !i.checkValidity(); f.classList.toggle('is-invalid', bad); ok = ok && !bad; });
    if (!ok) { note.textContent = 'A few fields still need an answer.'; gsap.fromTo(form, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }); return; }
    note.textContent = 'Sending…';
    gsap.to(formPear, { rotate: 360, duration: 0.9, ease: 'power2.inOut' });
    gsap.to('#plane', { x: '+=500', y: '-=400', rotate: 15, opacity: 0, duration: 1.4, ease: 'power2.in' });
    setTimeout(() => { note.textContent = 'Received. If the model fits, you’ll hear from us within a week.'; form.reset(); }, 1000);
  });
})();
