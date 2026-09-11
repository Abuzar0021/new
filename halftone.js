/* Halftone/ink-bleed WebGL layer over a <video>.
   Renders the video as a texture; a fragment shader mixes a CMYK-ish halftone
   print of it with the full-colour frame, driven by `progress` (scroll) and a
   mouse "lens" that develops the film locally under the pointer. */
window.HalftoneGL = function (canvas, video) {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;

  const VS = `attribute vec2 p; varying vec2 v; void main(){ v = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;
  const FS = `
    precision highp float;
    varying vec2 v;
    uniform sampler2D tex;
    uniform vec2 res, texRes, mouse;
    uniform float progress, time, dotScale;

    // cover-fit uv
    vec2 coverUV(vec2 uv){
      float ra = res.x/res.y, ta = texRes.x/texRes.y;
      vec2 s = (ra > ta) ? vec2(1., ta/ra) : vec2(ra/ta, 1.);
      return (uv-0.5)*s + 0.5;
    }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }

    // one halftone screen at a given angle
    float screen(vec2 px, float ang, float lum, float cell){
      float c = cos(ang), s = sin(ang);
      vec2 r = mat2(c,-s,s,c)*px;
      vec2 g = fract(r/cell)-0.5;
      float rad = (1.-lum)*0.72;
      return 1.-smoothstep(rad-0.09, rad+0.09, length(g));
    }

    void main(){
      vec2 uv = coverUV(vec2(v.x, 1.-v.y));
      vec2 px = v*res;
      float cell = dotScale;

      // ink-bleed edge : noisy threshold so the picture "develops" like a print
      float n = noise(px/180. + time*0.05) * 0.55 + noise(px/40.)*0.25;
      float mouseD = distance(v*vec2(res.x/res.y,1.), mouse*vec2(res.x/res.y,1.));
      float lens = 1.-smoothstep(0.0, 0.32, mouseD);
      float dev = smoothstep(0.0, 1.0, progress*1.35 + lens*0.9 - n*0.9);

      vec4 col = texture2D(tex, uv);
      float lum = dot(col.rgb, vec3(0.299,0.587,0.114));

      // misregistered plates: K (ink) + a red plate offset
      float k = screen(px, 0.785, lum, cell);
      float r = screen(px + vec2(1.4,-0.8), 0.262, min(1., lum*0.85+0.25), cell*1.05);
      vec3 paper = vec3(1.0, 0.98, 0.917);            // #FFFAEA
      vec3 ink   = vec3(0.043, 0.039, 0.035);         // #0B0A09
      vec3 berry = vec3(0.54, 0.11, 0.17);
      vec3 print = paper;
      print = mix(print, berry, r*0.55);
      print = mix(print, ink, k);

      // slight vignette + paper grain on the print
      float g = hash(px + fract(time))*0.06;
      print -= g;

      vec3 outc = mix(print, col.rgb, dev);
      gl_FragColor = vec4(outc, 1.0);
    }`;

  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 250, 234]));

  const U = (n) => gl.getUniformLocation(prog, n);
  const u = { res: U('res'), texRes: U('texRes'), mouse: U('mouse'), progress: U('progress'), time: U('time'), dotScale: U('dotScale') };

  const state = { progress: 0, mouse: { x: 0.5, y: 0.5 }, target: { x: 0.5, y: 0.5 }, dpr: Math.min(devicePixelRatio || 1, 1.5) };
  let uploaded = false;

  function resize() {
    canvas.width = Math.floor(canvas.clientWidth * state.dpr);
    canvas.height = Math.floor(canvas.clientHeight * state.dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', resize); resize();

  function upload(source, w, h) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    gl.uniform2f(u.texRes, w, h);
    uploaded = true;
  }

  let lastTime = -1;
  function frame(t) {
    // ease mouse
    state.mouse.x += (state.target.x - state.mouse.x) * 0.08;
    state.mouse.y += (state.target.y - state.mouse.y) * 0.08;

    if (video.readyState >= 2 && video.videoWidth) {
      if (video.currentTime !== lastTime || !uploaded) { upload(video, video.videoWidth, video.videoHeight); lastTime = video.currentTime; }
    }
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.mouse, state.mouse.x, state.mouse.y);
    gl.uniform1f(u.progress, state.progress);
    gl.uniform1f(u.time, t * 0.001);
    gl.uniform1f(u.dotScale, 6.5 * state.dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setProgress: (p) => { state.progress = Math.max(0, Math.min(1, p)); },
    setMouse: (x, y) => { state.target.x = x; state.target.y = y; },
    uploadPoster: (img) => upload(img, img.naturalWidth, img.naturalHeight),
  };
};
