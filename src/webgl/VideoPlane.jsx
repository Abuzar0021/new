import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './glitchShader';
import { scrollState } from '../hooks/scrollState';

/**
 * Full-screen plane that renders the current <video> frame through the idle-glitch shader.
 * - uTime advances every frame (glitch pulses while idle)
 * - uScrollVelocity is read from a shared mutable store that GSAP ScrollTrigger writes into
 * - the video texture only re-uploads when currentTime actually changes (scrub-driven)
 */
export default function VideoPlane({ video, intensity = 0.5 }) {
  const { size, gl } = useThree();
  const matRef = useRef();
  const lastTime = useRef(-1);

  const texture = useMemo(() => {
    const t = new THREE.VideoTexture(video);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [video]);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
      uScrollVelocity: { value: 0 },
      uGlitchIntensity: { value: intensity },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTexAspect: { value: 16 / 9 },
    }),
    [texture, intensity],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio());
  }, [size, gl, uniforms]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const u = uniforms;
    u.uTime.value = state.clock.elapsedTime;
    // velocity is smoothed in the shared store; shader reads the eased value
    u.uScrollVelocity.value = scrollState.velocity;
    if (video.videoWidth) u.uTexAspect.value = video.videoWidth / video.videoHeight;

    // Only push new pixels to the GPU when the scrubbed frame changed.
    if (video.readyState >= 2 && video.currentTime !== lastTime.current) {
      texture.needsUpdate = true;
      lastTime.current = video.currentTime;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} depthTest={false} depthWrite={false} />
    </mesh>
  );
}
