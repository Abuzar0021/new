import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../hooks/useLenis';
import { scrollState } from '../hooks/scrollState';
import { Glass, Eyebrow } from './ui';

/* Header: glass pill nav that hides on scroll-down */
export function Header({ lenisRef }) {
  const ref = useRef(null);
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (s) => gsap.to(ref.current, { yPercent: s.direction === 1 && s.scroll() > 160 ? -140 : 0, duration: 0.6, ease: 'expo.out', overwrite: true }),
    });
    return () => st.kill();
  }, []);
  const go = (e, id) => { e.preventDefault(); lenisRef.current ? lenisRef.current.scrollTo(id, { duration: 1.6 }) : document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); };
  const links = [['#philosophy', 'Philosophy'], ['#services', 'Services'], ['#contact', 'Contact']];
  return (
    <header ref={ref} className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 sm:px-10 lg:px-16">
      <a href="#top" onClick={(e) => go(e, 'top')} className="flex items-center gap-2 text-white">
        <span className="h-2 w-2 rounded-full bg-berry shadow-[0_0_14px_2px_rgba(224,38,61,0.8)]" />
        <span className="text-base tracking-tight">Strawberry</span>
      </a>
      <Glass className="!rounded-full px-2 py-1.5">
        <nav className="flex items-center gap-1">
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={(e) => go(e, href)} className="rounded-full px-4 py-1.5 text-xs text-white/75 transition-colors hover:bg-white/10 hover:text-white">{label}</a>
          ))}
          <a href="mailto:hello@strawberry.digital" className="ml-1 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/90">Start</a>
        </nav>
      </Glass>
    </header>
  );
}

/* Loader: shown until the theme's first video frame is decodable, never beyond 4s */
export function Loader({ ready, theme }) {
  const ref = useRef(null);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const o = { p: 0 };
    const tw = gsap.to(o, { p: 92, duration: 2.2, ease: 'power1.out', onUpdate: () => setPct(Math.round(o.p)) });
    return () => tw.kill();
  }, []);
  useEffect(() => {
    if (!ready) return;
    setPct(100);
    gsap.to(ref.current, { yPercent: -100, duration: 1, ease: 'expo.inOut', delay: 0.25, onComplete: () => ref.current && (ref.current.style.display = 'none') });
  }, [ready]);
  return (
    <div ref={ref} className="fixed inset-0 z-50 grid place-items-center bg-black">
      <div className="w-[min(320px,72vw)] text-center">
        <span className="mx-auto mb-5 block h-2 w-2 animate-pulseDot rounded-full bg-berry shadow-[0_0_16px_3px_rgba(224,38,61,0.8)]" />
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/70">Cultivating theme {String(theme.id).padStart(2, '0')} <span className="text-white">{pct}%</span></p>
        <div className="mt-4 h-px w-full bg-white/15"><span className="block h-full bg-white transition-[width] duration-200" style={{ width: pct + '%' }} /></div>
      </div>
    </div>
  );
}

/* HUD: scrub progress + idle/scroll state (bottom-left) */
export function Hud() {
  const barRef = useRef(null);
  const stateRef = useRef(null);
  useEffect(() => {
    const tick = () => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${scrollState.progress})`;
      if (stateRef.current) {
        const idle = scrollState.idle;
        stateRef.current.textContent = idle ? 'IDLE · GLITCH ACTIVE' : 'SCRUBBING';
        stateRef.current.style.color = idle ? 'rgb(224 38 61)' : 'rgba(255,255,255,0.8)';
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-30 hidden sm:left-10 md:block lg:left-16">
      <Glass className="!rounded-full px-4 py-2">
        <div className="flex items-center gap-4">
          <span ref={stateRef} className="font-mono text-[10px] tracking-[0.22em]">IDLE · GLITCH ACTIVE</span>
          <span className="h-px w-24 overflow-hidden bg-white/20"><span ref={barRef} className="block h-full w-full origin-left bg-white" style={{ transform: 'scaleX(0)' }} /></span>
        </div>
      </Glass>
    </div>
  );
}

/* Cursor with magnetic buttons (fine pointers only) */
export function Cursor() {
  const ref = useRef(null);
  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return;
    const el = ref.current;
    const x = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3' });
    const move = (e) => { x(e.clientX); y(e.clientY); };
    const over = (e) => { if (e.target.closest('a, button')) el.classList.add('is-hover'); };
    const out = (e) => { if (e.target.closest('a, button')) el.classList.remove('is-hover'); };
    window.addEventListener('mousemove', move); document.addEventListener('mouseover', over); document.addEventListener('mouseout', out);

    const magnets = Array.from(document.querySelectorAll('[data-magnetic]')).map((m) => {
      const mx = gsap.quickTo(m, 'x', { duration: 0.5, ease: 'power3' }), my = gsap.quickTo(m, 'y', { duration: 0.5, ease: 'power3' });
      const mm = (e) => { const r = m.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.3); };
      const ml = () => { mx(0); my(0); };
      m.addEventListener('mousemove', mm); m.addEventListener('mouseleave', ml);
      return () => { m.removeEventListener('mousemove', mm); m.removeEventListener('mouseleave', ml); };
    });
    return () => { window.removeEventListener('mousemove', move); document.removeEventListener('mouseover', over); document.removeEventListener('mouseout', out); magnets.forEach((f) => f()); };
  }, []);
  return (
    <div ref={ref} className="cursor pointer-events-none fixed left-0 top-0 z-[60] hidden [@media(pointer:fine)]:block">
      <span className="cursor__dot block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference transition-transform duration-300" />
    </div>
  );
}

export { Eyebrow };
