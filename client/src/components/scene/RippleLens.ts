/**
 * RippleLens - WebGL 1 Hero Ripple Shader Pipeline with Chromatic Aberration
 *
 * Requirements:
 * - Backing size = viewport x min(devicePixelRatio, 1.5)
 * - Full-screen quad; vUv = position * 0.5 + 0.5
 * - Video frame re-uploaded as RGB texture (flip-Y, clamp to edge, linear)
 * - Cover fit: A = canvas aspect, V = 1276/720; scale * 0.975
 * - Fragment shader:
 *     dist = distance(vUv, mouse)
 *     ripple = sin(dist * 20 - time * 5) * 0.006
 *     strength = smoothstep(0.2, 0.0, dist) * presence
 *     offset = normalize(vUv - mouse + 1e-5) * ripple * strength
 *     R at uv + offset + (0.005, 0) * strength
 *     G at uv + offset
 *     B at uv + offset - (0.005, 0) * strength
 * - Eased presence and pointer tilt
 * - Disabled on touch devices and under reduced motion
 * - Graceful skip if video is missing or WebGL fails
 */

export interface RippleLensOptions {
  videoSrc?: string;
  reduceEffects?: boolean;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 vUv;

void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision mediump float;
varying vec2 vUv;

uniform sampler2D u_texture;
uniform vec2 u_mouse;
uniform float u_presence;
uniform vec2 u_tilt;
uniform vec2 u_scale;
uniform float u_time;

void main() {
  // Cover fit with scale and tilt
  vec2 baseUv = (vUv - 0.5) * u_scale + 0.5 + u_tilt;

  float dist = distance(vUv, u_mouse);
  float ripple = sin(dist * 20.0 - u_time * 5.0) * 0.006;
  float strength = smoothstep(0.2, 0.0, dist) * u_presence;
  vec2 offset = normalize(vUv - u_mouse + 1e-5) * ripple * strength;

  vec2 uvDistorted = baseUv + offset;
  vec2 chromaOffset = vec2(0.005, 0.0) * strength;

  float r = texture2D(u_texture, uvDistorted + chromaOffset).r;
  float g = texture2D(u_texture, uvDistorted).g;
  float b = texture2D(u_texture, uvDistorted - chromaOffset).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

export class RippleLens {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private buffer: WebGLBuffer | null = null;
  private video: HTMLVideoElement | null = null;
  private animId: number | null = null;

  // Uniform locations
  private uTextureLoc: WebGLUniformLocation | null = null;
  private uMouseLoc: WebGLUniformLocation | null = null;
  private uPresenceLoc: WebGLUniformLocation | null = null;
  private uTiltLoc: WebGLUniformLocation | null = null;
  private uScaleLoc: WebGLUniformLocation | null = null;
  private uTimeLoc: WebGLUniformLocation | null = null;

  // State
  private mouse = { x: 0.5, y: 0.5 };
  private presence = 0;
  private targetPresence = 0;
  private tilt = { x: 0, y: 0 };
  private targetTilt = { x: 0, y: 0 };
  private lastTime = performance.now();
  private totalTime = 0;
  private isDestroyed = false;

  constructor(canvas: HTMLCanvasElement, options: RippleLensOptions = {}) {
    this.canvas = canvas;

    // Check environment support: touch devices, reduced motion, or reduceEffects
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion || options.reduceEffects) {
      this.canvas.style.display = 'none';
      return;
    }

    const videoSrc = options.videoSrc || '/media/hero-loop.mp4';
    this.initVideo(videoSrc);
  }

  private initVideo(src: string): void {
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    video.onerror = () => {
      // Missing video: gracefully hide canvas and let plate background show
      this.canvas.style.display = 'none';
      this.destroy();
    };

    video.onloadeddata = () => {
      if (this.isDestroyed) return;
      this.video = video;
      video.play().catch(() => {
        // Autoplay policy prevented playback
        this.canvas.style.display = 'none';
      });
      this.initWebGL();
    };

    video.load();
  }

  private initWebGL(): void {
    try {
      const gl = this.canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        antialias: false,
        powerPreference: 'high-performance',
      });
      if (!gl) {
        this.canvas.style.display = 'none';
        return;
      }
      this.gl = gl;

      // Compile shaders
      const vert = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
      const frag = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
      if (!vert || !frag) {
        this.canvas.style.display = 'none';
        return;
      }

      const program = gl.createProgram();
      if (!program) {
        this.canvas.style.display = 'none';
        return;
      }
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        this.canvas.style.display = 'none';
        return;
      }
      this.program = program;

      // Full screen quad (-1..1)
      const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      this.buffer = buffer;

      const aPos = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      // Texture
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      this.texture = texture;

      // Uniforms
      this.uTextureLoc = gl.getUniformLocation(program, 'u_texture');
      this.uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
      this.uPresenceLoc = gl.getUniformLocation(program, 'u_presence');
      this.uTiltLoc = gl.getUniformLocation(program, 'u_tilt');
      this.uScaleLoc = gl.getUniformLocation(program, 'u_scale');
      this.uTimeLoc = gl.getUniformLocation(program, 'u_time');

      this.setupListeners();
      this.resize();
      this.lastTime = performance.now();
      this.render();
    } catch {
      this.canvas.style.display = 'none';
    }
  }

  private compileShader(type: number, src: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private handlePointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;

    this.mouse.x = Math.max(0, Math.min(1, x));
    this.mouse.y = Math.max(0, Math.min(1, y));
    this.targetPresence = 1.0;

    // Pointer mapped to -1..1
    this.targetTilt.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.targetTilt.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private handlePointerLeave = (): void => {
    this.targetPresence = 0.0;
    this.targetTilt.x = 0;
    this.targetTilt.y = 0;
  };

  private handleResize = (): void => {
    this.resize();
  };

  private setupListeners(): void {
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  private resize(): void {
    if (!this.canvas || !this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  private render = (): void => {
    if (this.isDestroyed || !this.gl || !this.program || !this.video) return;

    this.animId = requestAnimationFrame(this.render);

    // Only draw when video has played and readyState >= 2
    if (this.video.readyState < 2 || this.video.paused) {
      return;
    }

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.totalTime += dt;

    // Presence easing: k = 1 - e^(-6dt)
    const kPres = 1 - Math.exp(-6 * dt);
    this.presence += (this.targetPresence - this.presence) * kPres;

    // Tilt easing: k = 1 - e^(-dt/0.1)
    const kTilt = 1 - Math.exp(-dt / 0.1);
    this.tilt.x += (this.targetTilt.x - this.tilt.x) * kTilt;
    this.tilt.y += (this.targetTilt.y - this.tilt.y) * kTilt;

    const gl = this.gl;
    gl.useProgram(this.program);

    // Cover fit: A = canvas aspect, V = 1276 / 720
    const A = this.canvas.width / this.canvas.height;
    const V = 1276 / 720;
    let scaleX = 1.0;
    let scaleY = 1.0;

    if (A > V) {
      scaleX = 1.0;
      scaleY = V / A;
    } else {
      scaleX = A / V;
      scaleY = 1.0;
    }

    scaleX *= 0.975;
    scaleY *= 0.975;

    // Tilt uniform = (tx * 0.009 * scale.x, ty * 0.009 * scale.y)
    const tiltUniformX = this.tilt.x * 0.009 * scaleX;
    const tiltUniformY = this.tilt.y * 0.009 * scaleY;

    // Upload video frame to texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video);

    // Set uniforms
    gl.uniform1i(this.uTextureLoc, 0);
    gl.uniform2f(this.uMouseLoc, this.mouse.x, this.mouse.y);
    gl.uniform1f(this.uPresenceLoc, this.presence);
    gl.uniform2f(this.uTiltLoc, tiltUniformX, tiltUniformY);
    gl.uniform2f(this.uScaleLoc, scaleX, scaleY);
    gl.uniform1f(this.uTimeLoc, this.totalTime);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    window.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('resize', this.handleResize);

    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video = null;
    }

    if (this.gl) {
      if (this.buffer) this.gl.deleteBuffer(this.buffer);
      if (this.texture) this.gl.deleteTexture(this.texture);
      if (this.program) this.gl.deleteProgram(this.program);
    }
  }
}

export default RippleLens;
