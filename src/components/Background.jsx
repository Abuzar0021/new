import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import VideoPlane from '../webgl/VideoPlane';
import { scrollState } from '../hooks/scrollState';
import { gsap, ScrollTrigger } from '../hooks/useLenis';

/**
 * Fixed full-screen WebGL background.
 * - Owns a hidden <video> for the chosen theme.
 * - GSAP ScrollTrigger scrubs video.currentTime across the whole document.
 * - ScrollTrigger's getVelocity() feeds uScrollVelocity (eased to 0 when idle → glitch).
 */
export default function Background({ theme, onReady }) {
  const [ready, setReady] = useState(false);

  const video = useMemo(() => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.src = theme.src;
    v.poster = theme.poster;
    return v;
  }, [theme]);

  // Load + readiness (never block forever)
  useEffect(() => {
    let done = false;
    const finish = () => { if (done) return; done = true; setReady(true); onReady?.(); };
    const onLoaded = () => { try { video.currentTime = 0.001; } catch (e) {} finish(); };
    video.addEventListener('loadeddata', onLoaded, { once: true });
    video.addEventListener('canplay', onLoaded, { once: true });
    video.addEventListener('error', finish, { once: true });
    video.load();
    const cap = setTimeout(finish, 4000);
    // iOS: unlock seeking on first touch
    const unlock = () => { video.play().then(() => video.pause()).catch(() => {}); window.removeEventListener('touchstart', unlock); };
    window.addEventListener('touchstart', unlock, { passive: true });
    return () => { clearTimeout(cap); window.removeEventListener('touchstart', unlock); video.pause(); video.removeAttribute('src'); video.load(); };
  }, [video, onReady]);

  // Scroll → video time + velocity uniform
  useEffect(() => {
    if (!ready) return;
    const dur = () => (isFinite(video.duration) && video.duration > 0 ? video.duration : 8);
    const target = { t: 0 };
    let seekPending = false;

    const applySeek = () => {
      seekPending = false;
      const t = target.t * dur();
      if (Math.abs(video.currentTime - t) > 1 / 60) {
        // fastSeek is smoother on Safari; fall back to currentTime
        if (typeof video.fastSeek === 'function' && Math.abs(video.currentTime - t) > 0.5) video.fastSeek(t);
        else video.currentTime = t;
      }
    };

    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      scrub: 0.6,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        target.t = self.progress;
        if (!seekPending) { seekPending = true; requestAnimationFrame(applySeek); }
        // normalise px/s to ~0..1 range (1000 px/s ≈ 1.0)
        scrollState.rawVelocity = Math.min(1.5, Math.abs(self.getVelocity()) / 1000);
      },
    });

    // Ease the velocity toward the raw value; decays to 0 when idle → shader glitch ramps in.
    const easeTick = () => {
      const k = scrollState.rawVelocity > scrollState.velocity ? 0.35 : 0.06;
      scrollState.velocity += (scrollState.rawVelocity - scrollState.velocity) * k;
      scrollState.rawVelocity *= 0.85; // velocity from getVelocity is momentary; decay it
      scrollState.idle = scrollState.velocity < 0.02;
    };
    gsap.ticker.add(easeTick);

    // Seek the video with a gentle inertia so frames feel continuous
    return () => { st.kill(); gsap.ticker.remove(easeTick); };
  }, [ready, video]);

  return (
    <div className="fixed inset-0 -z-10 bg-black">
      {/* Poster shows instantly under the canvas while the first frame decodes */}
      <img src={theme.poster} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true" />
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        frameloop="always"
        className="!absolute inset-0"
      >
        <VideoPlane video={video} intensity={0.5} />
      </Canvas>
      {/* vignette to keep glass panels legible */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_35%,rgba(0,0,0,0.65)_100%)]" />
    </div>
  );
}
