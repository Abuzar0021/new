import { useCallback, useEffect, useMemo, useState } from 'react';
import { pickRandomTheme } from './data/themes';
import { useLenis, ScrollTrigger } from './hooks/useLenis';
import Background from './components/Background';
import { Header, Loader, Hud, Cursor } from './components/Chrome';
import { Hero, Philosophy, Services, Manifesto, Contact, Footer } from './components/Sections';

export default function App() {
  // "Refresh" mechanic — chosen once per page load
  const theme = useMemo(() => pickRandomTheme(), []);
  const [ready, setReady] = useState(false);
  const lenisRef = useLenis(true);
  const onReady = useCallback(() => setReady(true), []);

  // Lock scroll while loading; refresh triggers once layout is final
  useEffect(() => {
    const l = lenisRef.current;
    if (!l) return;
    if (!ready) l.stop(); else { l.start(); requestAnimationFrame(() => ScrollTrigger.refresh()); }
  }, [ready, lenisRef]);

  useEffect(() => { document.documentElement.dataset.theme = theme.slug; }, [theme]);

  return (
    <>
      <Background theme={theme} onReady={onReady} />
      <Loader ready={ready} theme={theme} />
      <Header lenisRef={lenisRef} />
      <Cursor />
      <Hud />

      <main id="top" className="relative z-10">
        <Hero theme={theme} ready={ready} />
        {/* scroll runway: gives the film room to scrub before content arrives */}
        <div aria-hidden className="h-[60vh]" />
        <Philosophy />
        <Manifesto />
        <Services />
        <Contact />
        <Footer theme={theme} />
      </main>
    </>
  );
}
