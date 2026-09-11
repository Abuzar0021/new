// Shared mutable store bridging GSAP/Lenis (DOM world) and the R3F render loop (WebGL world).
// Kept outside React state on purpose: it changes every frame and must not trigger re-renders.
export const scrollState = {
  progress: 0,   // 0..1 through the film section
  velocity: 0,   // eased, normalised scroll velocity (0 = idle)
  rawVelocity: 0,
  idle: true,
};
