import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../hooks/useLenis';
import { Glass, GlassButton, Eyebrow } from './ui';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
function useReveal(ref, opts = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll('[data-reveal]');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 36, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: opts.stagger ?? 0.08, scrollTrigger: { trigger: el, start: 'top 78%', once: true } },
      );
    }, el);
    return () => ctx.revert();
  }, [ref, opts.stagger]);
}

function SplitWords({ text, className = '' }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <span data-word className="inline-block will-change-transform">{w}&nbsp;</span>
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
export function Hero({ theme, ready }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('[data-word]', { yPercent: 110, rotate: 2, duration: 1.3, stagger: 0.035 }, 0.2)
        .from('[data-hero-fade]', { opacity: 0, y: 14, duration: 1, stagger: 0.12 }, '-=0.9');
      gsap.to(ref.current, { opacity: 0, y: -60, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom 30%', scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, [ready]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-end px-5 pb-14 pt-32 sm:px-10 lg:px-16">
      <div className="max-w-5xl">
        <div data-hero-fade className="mb-6 flex flex-wrap items-center gap-3">
          <Glass className="!rounded-full px-3 py-1.5">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/80">
              <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-berry" />
              Theme {String(theme.id).padStart(2, '0')} · {theme.label}
            </span>
          </Glass>
          <Eyebrow>Reload for another</Eyebrow>
        </div>
        <h1 className="font-serif text-[clamp(2.6rem,7.2vw,7rem)] font-light leading-[0.98] tracking-[-0.02em] text-white">
          <SplitWords text="Strawberry builds fast, self-hosted websites you own outright." />
        </h1>
        <p data-hero-fade className="mt-7 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          You get the code, the keys, and the root access. Freshly cultivated digital systems with no monthly platform fees.
        </p>
        <div data-hero-fade className="mt-9 flex flex-wrap items-center gap-3">
          <GlassButton href="#contact" primary>Taste the Difference</GlassButton>
          <GlassButton href="#philosophy">How it grows</GlassButton>
        </div>
      </div>

      <div data-hero-fade className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-1 sm:right-10 md:flex lg:right-16">
        <Eyebrow className="!text-white/80">Scroll to scrub</Eyebrow>
        <Eyebrow>Idle to glitch</Eyebrow>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Philosophy — 3 columns                                              */
/* ------------------------------------------------------------------ */
const PILLARS = [
  { n: '01', title: 'Own the Harvest', body: 'The repository, the design assets, and the deploy pipeline are handed over in full. Hire anyone next. Or nobody.' },
  { n: '02', title: 'Zero Recurring Fees', body: 'Hosting runs a few dollars a month, paid directly to your host, not to us. No plan tiers, no ransom on your own pages.' },
  { n: '03', title: 'Built for Speed', body: 'Hand-picked, hand-written markup. No artificial plugin sediment. Sub-second loads on a phone with two bars of signal.' },
];

export function Philosophy() {
  const ref = useRef(null);
  useReveal(ref, { stagger: 0.12 });
  return (
    <section id="philosophy" ref={ref} className="relative px-5 py-28 sm:px-10 lg:px-16">
      <div data-reveal className="mb-10 flex items-end justify-between gap-6">
        <div>
          <Eyebrow>The core philosophy</Eyebrow>
          <h2 className="mt-3 font-serif text-4xl font-light leading-none tracking-tight text-white sm:text-6xl">Three roots, <em className="italic text-white/80">one plant.</em></h2>
        </div>
        <Eyebrow className="hidden sm:block">Ch. 01</Eyebrow>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PILLARS.map((p) => (
          <Glass key={p.n} data-reveal className="group p-7 transition-colors duration-500 hover:bg-white/[0.1] sm:p-8">
            <div className="mb-14 flex items-center justify-between">
              <span className="font-mono text-xs text-white/60">{p.n}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-berry opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
            <h3 className="font-serif text-3xl font-light leading-none tracking-tight text-white">{p.title}</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{p.body}</p>
          </Glass>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services — staggered grid                                           */
/* ------------------------------------------------------------------ */
const SERVICES = [
  { title: 'Website Development', desc: 'Hand-grown storefronts, rooted in clean markup.', span: 'md:col-span-7' },
  { title: 'Custom Web Applications', desc: 'Bespoke systems cultivated to your soil, not a template’s.', span: 'md:col-span-5 md:translate-y-10' },
  { title: 'API Integrations', desc: 'Organically integrated APIs, grafted without scar tissue.', span: 'md:col-span-4' },
  { title: 'AI Automation', desc: 'Self-watering workflows that tend themselves overnight.', span: 'md:col-span-4 md:translate-y-10' },
  { title: 'SaaS Platforms', desc: 'Perennial products built to bear fruit season after season.', span: 'md:col-span-4 md:translate-y-20' },
  { title: 'Technical SEO', desc: 'Pruned, structured and indexed so search engines can find the ripe pages.', span: 'md:col-span-12 lg:col-span-7 lg:col-start-6' },
];

export function Services() {
  const ref = useRef(null);
  useReveal(ref, { stagger: 0.1 });
  useEffect(() => {
    // parallax drift between cards for depth
    const ctx = gsap.context(() => {
      ref.current.querySelectorAll('[data-drift]').forEach((el, i) => {
        gsap.to(el, { y: (i % 3) * -18 - 10, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <section id="services" ref={ref} className="relative px-5 py-28 sm:px-10 lg:px-16">
      <div data-reveal className="mb-14 max-w-3xl">
        <Eyebrow>Ch. 02 · Services</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl font-light leading-none tracking-tight text-white sm:text-6xl">Our Cultivation Process</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-12">
        {SERVICES.map((s, i) => (
          <Glass key={s.title} data-reveal className={`${s.span}`}>
            <div data-drift className="flex h-full min-h-[200px] flex-col justify-between p-7 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white/60">{String(i + 1).padStart(2, '0')}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-white/50"><path d="M7 17 17 7M9 7h8v8" /></svg>
              </div>
              <div>
                <h3 className="font-serif text-2xl font-light leading-none tracking-tight text-white sm:text-3xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{s.desc}</p>
              </div>
            </div>
          </Glass>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Manifesto band + contact + footer                                   */
/* ------------------------------------------------------------------ */
export function Manifesto() {
  const ref = useRef(null);
  useEffect(() => {
    const words = ref.current.querySelectorAll('[data-w]');
    const st = ScrollTrigger.create({
      trigger: ref.current, start: 'top 75%', end: 'bottom 45%', scrub: true,
      onUpdate: (s) => { const n = Math.floor(s.progress * words.length); words.forEach((w, i) => w.style.opacity = i <= n ? 1 : 0.18); },
    });
    return () => st.kill();
  }, []);
  const text = 'Most sites are rented. Ours are grown, harvested and handed over — root, stem and fruit.';
  return (
    <section ref={ref} className="px-5 py-32 sm:px-10 lg:px-16">
      <p className="mx-auto max-w-4xl text-center font-serif text-3xl font-light leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
        {text.split(' ').map((w, i) => <span key={i} data-w className="inline-block transition-opacity duration-300" style={{ opacity: 0.18 }}>{w}&nbsp;</span>)}
      </p>
    </section>
  );
}

export function Contact() {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <section id="contact" ref={ref} className="px-5 pb-28 sm:px-10 lg:px-16">
      <Glass data-reveal className="mx-auto max-w-4xl p-8 text-center sm:p-14">
        <Eyebrow>Get in touch</Eyebrow>
        <h2 className="mt-4 font-serif text-4xl font-light leading-none tracking-tight text-white sm:text-6xl">Ready to plant something <em className="italic text-white/80">you keep?</em></h2>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">Send one paragraph about your business. You’ll get a straight answer on cost, timeline and whether we’re the right people for it.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GlassButton href="mailto:hello@strawberry.digital" primary>Taste the Difference</GlassButton>
          <GlassButton href="mailto:hello@strawberry.digital">hello@strawberry.digital</GlassButton>
        </div>
      </Glass>
    </section>
  );
}

export function Footer({ theme }) {
  return (
    <footer className="px-5 pb-8 sm:px-10 lg:px-16">
      <Glass className="flex flex-col gap-6 p-7 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div className="max-w-md">
          <span className="font-sans text-lg tracking-tight text-white">Strawberry</span>
          <p className="mt-3 text-sm leading-relaxed text-white/70">One developer, start to finish. Nothing about your site lives anywhere you can't reach.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <a href="mailto:hello@strawberry.digital" className="border-b border-white/30 pb-0.5 text-sm text-white transition-colors hover:border-white">hello@strawberry.digital</a>
          <Eyebrow>© {new Date().getFullYear()} · Theme {String(theme.id).padStart(2, '0')} loaded</Eyebrow>
        </div>
      </Glass>
    </footer>
  );
}
