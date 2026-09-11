/* OmniStack — motion layer
   Lenis smooth scroll + GSAP ScrollTrigger + scroll-scrubbed <video> through a WebGL halftone shader */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  gsap.registerPlugin(ScrollTrigger);

  /* 1. Smooth scroll ------------------------------------------------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (t) => lenis ? lenis.scrollTo(t, { duration: 1.6 }) : $(t)?.scrollIntoView({ behavior: 'smooth' });
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length > 1 && $(id)) { e.preventDefault(); scrollTo(id); } }));

  /* 2. Split text ---------------------------------------------------- */
  function splitChars(el) {
    const text = el.textContent.trim(); el.textContent = ''; el.setAttribute('aria-label', text);
    text.split(' ').forEach((word, i, arr) => {
      const w = document.createElement('span'); w.className = 'word'; w.setAttribute('aria-hidden', 'true');
      [...word].forEach((ch) => { const c = document.createElement('span'); c.className = 'char'; c.textContent = ch; w.appendChild(c); });
      el.appendChild(w); if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  $$('[data-split]').forEach(splitChars);
  $$('[data-split-lines] > span').forEach((l) => { const i = document.createElement('span'); i.textContent = l.textContent; l.textContent = ''; l.appendChild(i); });
  $$('[data-words]').forEach((el) => { el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' '); });

  /* 3. Film: video + WebGL ------------------------------------------- */
  const video = $('#filmVideo');
  const glCanvas = $('#filmGL');
  let halftone = null;
  const filmState = { t: 0 };
  let introDone = false;
  const pctEl = $('#loaderPct'), barEl = $('#loaderBar');
  let progress = 0;
  const setProgress = (p) => { progress = Math.max(progress, Math.min(100, Math.round(p))); pctEl.textContent = progress + '%'; gsap.to(barEl, { width: progress + '%', duration: 0.3, ease: 'power2.out' }); };

  // fake-ish progress tied to actual buffering
  const bufferTick = () => {
    try { if (video.buffered.length && video.duration) setProgress((video.buffered.end(video.buffered.length - 1) / video.duration) * 100); } catch (e) {}
    if (progress < 100 && !introDone) setTimeout(bufferTick, 120);
  };

  function initGL() {
    if (halftone || !window.HalftoneGL) return;
    halftone = window.HalftoneGL(glCanvas, video);
    if (!halftone) { glCanvas.style.display = 'none'; video.style.opacity = 1; }
    else {
      const poster = new Image(); poster.crossOrigin = 'anonymous'; poster.src = 'media/hero-poster.jpg';
      poster.onload = () => { if (video.readyState < 2) halftone.uploadPoster(poster); };
    }
  }
  initGL();
  // Release the loader as soon as the first frame is decodable; never block on canplaythrough.
  const ready = () => { setProgress(100); document.fonts.ready.then(intro); };
  video.addEventListener('loadedmetadata', () => { try { video.currentTime = 0.001; } catch (e) {} }, { once: true });
  video.addEventListener('loadeddata', ready, { once: true });
  video.addEventListener('canplay', ready, { once: true });
  video.addEventListener('error', ready, { once: true });
  if (video.readyState >= 2) ready();
  video.load(); bufferTick();
  // time-based floor so the bar always moves, and a hard cap so the page can never stay hidden
  gsap.to({ p: 0 }, { p: 90, duration: 3, ease: 'power1.out', onUpdate: function () { if (!introDone) setProgress(this.targets()[0].p); } });
  setTimeout(intro, 2500);
  addEventListener('error', () => intro());
  // iOS: unlock scrubbing after first gesture
  const unlock = () => { video.play().then(() => video.pause()).catch(() => {}); removeEventListener('touchstart', unlock); };
  addEventListener('touchstart', unlock, { passive: true });

  /* 4. Intro --------------------------------------------------------- */
  function intro() {
    if (introDone) return; introDone = true;
    const forceShow = () => { window.__reveal && window.__reveal('js-fallback'); lenis && lenis.start(); };
    if (window.__revealed) { forceShow(); try { buildScroll(); } catch (e2) { console.error(e2); } return; }
    try { runIntro(); } catch (err) { console.error(err); forceShow(); try { buildScroll(); } catch (e2) { console.error(e2); } }
  }
  function runIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut', delay: 0.25 })
      .set('#loader', { display: 'none' })
      .add(() => { window.__reveal && window.__reveal('intro'); lenis && lenis.start(); }, '<')
      .from('[data-reveal-now]', { opacity: 0, y: 10, duration: 0.8 }, '-=0.8')
      .from('#heroTitle .char', { yPercent: 110, rotate: 3, duration: 1.2, stagger: 0.02 }, '-=0.7')
      .from('.film__sub > span > span', { yPercent: 110, duration: 1, stagger: 0.1 }, '-=0.9')
      .from('.film__actions .btn', { opacity: 0, y: 14, duration: 0.8, stagger: 0.1 }, '-=0.6')
      .from('.header', { yPercent: -100, opacity: 0, duration: 0.9 }, '-=0.9')
      .from('.film__meta, .film__ticker', { opacity: 0, duration: 0.8 }, '-=0.6')
      .add(buildScroll, '-=0.8');
  }

  /* 5. Scroll choreography ------------------------------------------ */
  function buildScroll() {
    // -- film scrub: video.currentTime follows scroll; shader develops the print
    const dur = () => (isFinite(video.duration) && video.duration) || 6;
    const fmt = (s) => '00:' + String(Math.floor(s)).padStart(2, '0');
    gsap.to(filmState, {
      t: 1, ease: 'none',
      scrollTrigger: {
        trigger: '#film', start: 'top top', end: 'bottom bottom', scrub: 0.4,
        onUpdate: (self) => {
          const t = self.progress * dur();
          if (Math.abs(video.currentTime - t) > 0.02) video.currentTime = t;
          $('#frameNo').textContent = fmt(t);
          halftone && halftone.setProgress(self.progress * 1.6);
        },
      },
    });
    gsap.to('.film__copy', { yPercent: 30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#film', start: '30% top', end: '70% top', scrub: true } });
    gsap.to('.film__hint', { opacity: 0, scrollTrigger: { trigger: '#film', start: '8% top', end: '18% top', scrub: true } });

    // -- Ch.1 pinned statements
    const lines = $$('.model__line');
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#why', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    lines.forEach((line, i) => {
      const last = i === lines.length - 1;
      tl.fromTo(line, { opacity: 0, yPercent: 30, filter: 'blur(8px)' }, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1 })
        .to(line, { opacity: last ? 1 : 0, yPercent: last ? 0 : -30, duration: 1 }, '+=0.6');
    });

    // -- word ink-in
    $$('[data-words]').forEach((el) => {
      const words = $$('.w', el);
      ScrollTrigger.create({ trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true, onUpdate: (s) => { const n = Math.floor(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i <= n)); } });
    });

    // -- reveals
    ScrollTrigger.batch('[data-reveal]', { start: 'top 88%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true }) });
    $$('h2[data-split]').forEach((h) => gsap.from($$('.char', h), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.012, scrollTrigger: { trigger: h, start: 'top 85%', once: true } }));

    // -- Ch.2: halftone video → colour ("polishing"), paper cards
    gsap.fromTo('.work__video--dots', { '--reveal': '0%' }, { '--reveal': '100%', ease: 'none', scrollTrigger: { trigger: '#build', start: 'top 60%', end: '40% top', scrub: 0.4 } });
    gsap.fromTo('.apply__video--dots', { '--reveal': '0%' }, { '--reveal': '100%', ease: 'none', scrollTrigger: { trigger: '#cta', start: 'top 70%', end: 'center center', scrub: 0.4 } });
    $$('[data-card]').forEach((card, i) => {
      gsap.fromTo(card, { clipPath: 'inset(0 0 100% 0)', y: 60 }, { clipPath: 'inset(0 0 0% 0)', y: 0, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
      gsap.to(card, { y: -40 * (i + 1), ease: 'none', scrollTrigger: { trigger: '#build', start: 'top top', end: 'bottom bottom', scrub: true } });
    });
    $$('[data-parallax]').forEach((el) => gsap.to(el, { yPercent: -60 * parseFloat(el.dataset.parallax), ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }));

    // -- Ch.4 horizontal gallery
    const track = $('#galleryTrack');
    const dist = () => track.scrollWidth - innerWidth + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) * 2 + 40;
    gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#work', start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true } });
    const trackTween = gsap.getTweensOf(track)[0];
    $$('.piece__media').forEach((m) => gsap.fromTo(m, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: m, containerAnimation: trackTween, start: 'left 95%', end: 'left 60%', scrub: true } }));

    // -- header
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => $('#header').classList.toggle('is-hidden', s.direction === 1 && s.scroll() > 200) });
    ['#work', '.footer'].forEach((sel) => ScrollTrigger.create({ trigger: sel, start: 'top 40px', end: 'bottom 40px', onToggle: (s) => $('#header').classList.toggle('on-dark', s.isActive) }));
    $$('[data-nav]').forEach((a) => ScrollTrigger.create({ trigger: a.getAttribute('href'), start: 'top center', end: 'bottom center', onToggle: (s) => a.classList.toggle('is-active', s.isActive) }));

    // ambient loops only play when visible
    $$('video[data-autoplay]').forEach((v) => ScrollTrigger.create({ trigger: v, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? v.play().catch(() => {}) : v.pause()) }));

    ScrollTrigger.refresh();
  }

  /* 6. Cursor, magnetic, tilt, shader mouse --------------------------- */
  const cursor = $('#cursor');
  if (matchMedia('(pointer: fine)').matches && !reduced) {
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' }), cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
    addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY); halftone && halftone.setMouse(e.clientX / innerWidth, e.clientY / innerHeight); });
    $$('a, button, summary').forEach((el) => { el.addEventListener('mouseenter', () => cursor.classList.add('is-hover')); el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover')); });
    $$('input, textarea').forEach((el) => { el.addEventListener('mouseenter', () => cursor.classList.add('is-text')); el.addEventListener('mouseleave', () => cursor.classList.remove('is-text')); });
    const label = $('.cursor__label');
    const setLabel = (el, txt) => { el.addEventListener('mouseenter', () => { label.textContent = txt; cursor.classList.add('has-label'); }); el.addEventListener('mouseleave', () => cursor.classList.remove('has-label')); };
    setLabel($('#film'), 'Scroll'); $$('.piece').forEach((p) => setLabel(p, 'View'));
    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.3); });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
    $$('[data-tilt]').forEach((el) => {
      const m = $('.piece__media', el);
      el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); gsap.to(m, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 8, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 8, transformPerspective: 800, duration: 0.6, ease: 'power3' }); });
      el.addEventListener('mouseleave', () => gsap.to(m, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3' }));
    });
  }

  /* 7. Menu ------------------------------------------------------------ */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = (o) => { burger.classList.toggle('is-open', o); menu.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', String(o)); o ? lenis?.stop() : lenis?.start(); body.style.overflow = o ? 'hidden' : ''; };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* 8. Form ------------------------------------------------------------ */
  const form = $('#applyForm'), note = $('#applyNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault(); let ok = true;
    $$('.field', form).forEach((f) => { const i = $('input, textarea', f); const bad = !i.checkValidity(); f.classList.toggle('is-invalid', bad); ok = ok && !bad; });
    if (!ok) { note.textContent = 'A few fields still need an answer.'; gsap.fromTo(form, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }); return; }
    note.textContent = 'Sending…';
    // TODO: wire to your backend / form provider
    setTimeout(() => { note.textContent = 'Received. You’ll hear back within one business day.'; form.reset(); }, 900);
  });
})();
