// Idle "matrix glitch" shader — fragment logic supplied by the brief, used verbatim.
// Extra uniforms (uResolution / uTexAspect) only handle cover-fit of the video texture.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;     // The current video frame
uniform float uTime;            // Continuously updating time variable
uniform float uScrollVelocity;  // Updated by GSAP: 0.0 when stopped, >0.0 when scrolling
uniform float uGlitchIntensity; // Base intensity of the glitch (default: 0.5)
uniform vec2  uResolution;      // canvas size (for cover-fit)
uniform float uTexAspect;       // video aspect (for cover-fit)

varying vec2 vUv;

// Standard pseudo-random noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / uResolution.y;
    vec2 scale = screenAspect > uTexAspect
        ? vec2(1.0, uTexAspect / screenAspect)
        : vec2(screenAspect / uTexAspect, 1.0);
    return (uv - 0.5) * scale + 0.5;
}

void main() {
    vec2 uv = coverUv(vUv);

    // 1. Calculate Idle State
    // As velocity approaches 0, idleFactor approaches 1 (full glitch).
    float idleFactor = 1.0 - clamp(abs(uScrollVelocity) * 5.0, 0.0, 1.0);
    float activeIntensity = uGlitchIntensity * idleFactor;

    // 2. Matrix Block Distortion
    // Snap UVs to a grid to create chunky, digital artifacts
    float gridSize = 60.0;
    vec2 blockUv = floor(uv * gridSize) / gridSize;

    // Generate chaotic time-based noise for this specific block
    float blockNoise = random(blockUv + vec2(floor(uTime * 10.0), 0.0));

    // Determine if this specific pixel block should glitch right now
    float isGlitching = step(0.95, blockNoise) * activeIntensity;

    // 3. Chromatic Aberration (RGB Split)
    // Shift the red and blue channels horizontally when glitching
    float splitAmount = 0.02 * isGlitching;
    vec2 rUv = vec2(uv.x + splitAmount, uv.y);
    vec2 gUv = uv;
    vec2 bUv = vec2(uv.x - splitAmount, uv.y);

    // 4. Sample the Video Texture
    float r = texture2D(uTexture, rUv).r;
    float g = texture2D(uTexture, gUv).g;
    float b = texture2D(uTexture, bUv).b;
    vec3 finalColor = vec3(r, g, b);

    // 5. Scanlines / Dither Overlay
    // High-frequency sine wave based on Y position and Time to keep the frame feeling "alive"
    float scanline = sin(uv.y * 800.0 - uTime * 15.0) * 0.04 * idleFactor;
    finalColor -= scanline;

    // 6. TV Static
    float staticNoise = (random(uv + uTime) - 0.5) * 0.1 * activeIntensity;
    finalColor += staticNoise;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;
