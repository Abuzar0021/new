(function () {
  const body = document.body;

  /* ---------------- Loader ---------------- */
  const loader = document.getElementById('loader');
  const pctEl = document.getElementById('loaderPct');
  const barEl = document.getElementById('loaderBar');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  body.classList.add('is-loading');

  function finishLoading() {
    loader.classList.add('is-done');
    body.classList.remove('is-loading');
    body.classList.add('is-ready');
  }

  if (reduced) {
    finishLoading();
  } else {
    let pct = 0;
    const tick = () => {
      pct = Math.min(100, pct + Math.random() * 14 + 4);
      const v = Math.round(pct);
      pctEl.textContent = v + '%';
      barEl.style.width = v + '%';
      if (pct < 100) setTimeout(tick, 60 + Math.random() * 90);
      else setTimeout(finishLoading, 350);
    };
    // Wait for fonts so the hero title animates in its final face
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(tick);
    setTimeout(() => { if (!body.classList.contains('is-ready')) finishLoading(); }, 4000);
  }

  /* ---------------- Header hide on scroll ---------------- */
  const header = document.querySelector('.header');
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > 120 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4) header.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  /* ---------------- Mobile nav ---------------- */
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  const setMenu = (open) => {
    burger.classList.toggle('is-open', open);
    mobileNav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!mobileNav.classList.contains('is-open')));
  mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------- FAQ: one open at a time + animated height ---------------- */
  const items = document.querySelectorAll('.faq__item');
  items.forEach((item) => {
    const summary = item.querySelector('summary');
    const bodyEl = item.querySelector('.faq__body');

    summary.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (reduced) {
        item.open = !item.open;
        return;
      }
      if (item.open) {
        // close
        const h = bodyEl.offsetHeight;
        const anim = bodyEl.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
        anim.onfinish = () => { item.open = false; };
      } else {
        items.forEach((o) => { if (o !== item && o.open) o.querySelector('summary').click(); });
        item.open = true;
        const h = bodyEl.offsetHeight;
        bodyEl.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  });

  /* ---------------- Application form ---------------- */
  const form = document.getElementById('applyForm');
  const note = document.getElementById('applyNote');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    let valid = true;
    form.querySelectorAll('.field').forEach((f) => {
      const input = f.querySelector('input, textarea');
      if (!input) return;
      const bad = !input.checkValidity();
      f.classList.toggle('is-invalid', bad);
      if (bad) valid = false;
    });
    if (!valid) {
      note.textContent = 'A few fields still need an answer.';
      return;
    }
    const btn = form.querySelector('button');
    btn.disabled = true;
    note.textContent = 'Sending…';
    // Demo submission — wire this to your backend / form provider.
    setTimeout(() => {
      note.textContent = 'Received. If the model fits, you’ll hear from us within a week.';
      form.reset();
      btn.disabled = false;
    }, 900);
  });
})();
