import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Lenis smooth scroll wired into GSAP's ticker + ScrollTrigger. Returns the Lenis instance ref. */
export function useLenis(enabled = true) {
  const ref = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.9, smoothWheel: true });
    ref.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); ref.current = null; };
  }, [enabled]);
  return ref;
}

export { gsap, ScrollTrigger };
