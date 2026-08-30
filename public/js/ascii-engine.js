/* ==========================================================================
   LIVE ASCII STREAM ENGINE - CORE CANVAS & MATH VISUALIZER
   ========================================================================== */

class AsciiEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // Configurable Parameters
    this.mode = 'glitch'; // 'matrix' | 'donut' | 'glitch' | 'wave' | 'starfield' | 'live-server'
    this.charSetKey = 'cyber';
    this.customCharSet = 'ANTIGRAVITY 01';
    this.targetFps = 120;
    this.fontSize = 15;
    this.theme = 'white';
    this.mouseRippleEnabled = false;
    this.audioEnabled = false;
    this.volume = 0.3;

    // Grid Dimensions
    this.cols = 0;
    this.rows = 0;
    this.charWidth = 0;
    this.charHeight = 0;

    // Tick & Time Stats
    this.tickCount = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = performance.now();
    this.isRunning = true;
    this.liveServerData = null;

    // Interactive Shockwaves & Letter Mask State
    this.ripples = [];
    this.activeLetterMask = null;
    this.letterMaskOpacity = 0;
    this.currentTypedChar = '';
    this.outlineBlockChars = ['█', '▓', '▒', '░', '#', '@', '%', '$', 'X', 'O', '8', '0', '&', 'W', 'M'];

    // Mode Specific Internal States
    this.matrixColumns = [];
    this.stars = [];
    this.donutA = 0;
    this.donutB = 0;
    this.glitchBuffer = [];

    // Audio Context Setup
    this.audioCtx = null;

    // Primary Colors per Theme (Uniform single text color per theme)
    this.themeColors = {
      white: { main: '#ffffff', glow: '#ffffff', lead: '#ffffff', dim: '#ffffff', bg: '#050505' },
      inverted: { main: '#050505', glow: '#050505', lead: '#050505', dim: '#050505', bg: '#ffffff' },
      matrix: { main: '#00ff66', glow: '#00ff66', lead: '#00ff66', dim: '#00ff66', bg: '#040805' },
      amber: { main: '#ffaa00', glow: '#ffaa00', lead: '#ffaa00', dim: '#ffaa00', bg: '#0a0601' },
      synthwave: { main: '#ff007f', glow: '#ff007f', lead: '#ff007f', dim: '#ff007f' },
      blood: { main: '#ff2a2a', glow: '#ff2a2a', lead: '#ff2a2a', dim: '#ff2a2a' },
      hologram: { main: '#00e5ff', glow: '#00e5ff', lead: '#00e5ff', dim: '#00e5ff' },
      rainbow: { main: '#e040fb', glow: '#e040fb', lead: '#e040fb', dim: '#e040fb' }
    };

    // Character Sets Lookup
    this.charSets = {
      cyber: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:",.<>/?`~\\',
      matrix: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      symbols: ' !@#$%^&*()_+-=[]{}|;:",.<>/?`~\\',
      dense: ' .:-=+*#%@',
      hex: '0123456789ABCDEFx0123456789abcdef',
      blocks: ' .:-=+*#%@',
      custom: ''
    };

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initModeState();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    this.ctx.scale(dpr, dpr);
    this.ctx.font = `${this.fontSize}px 'Fira Code', 'Courier New', monospace`;

    // Measure Monospace font metrics
    const metrics = this.ctx.measureText('M');
    this.charWidth = Math.max(metrics.width, this.fontSize * 0.6);
    this.charHeight = this.fontSize * 1.25;

    this.cols = Math.floor(this.width / this.charWidth) + 1;
    this.rows = Math.floor(this.height / this.charHeight) + 1;

    this.initModeState();
  }

  initModeState() {
    // 1. Matrix Rain State
    this.matrixColumns = [];
    for (let i = 0; i < this.cols; i++) {
      this.matrixColumns.push({
        y: Math.floor(Math.random() * -this.rows),
        speed: 0.5 + Math.random() * 1.5,
        length: 8 + Math.floor(Math.random() * 24),
        chars: []
      });
      // Fill random characters
      for (let j = 0; j < 40; j++) {
        this.matrixColumns[i].chars.push(this.getRandomChar());
      }
    }

    // 2. Starfield State
    this.stars = [];
    for (let i = 0; i < 400; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * this.width * 2,
        y: (Math.random() - 0.5) * this.height * 2,
        z: Math.random() * 1000 + 1,
        char: this.getRandomChar()
      });
    }

    // 3. Glitch Buffer State
    this.glitchBuffer = [];
    for (let r = 0; r < this.rows; r++) {
      const rowArr = [];
      for (let c = 0; c < this.cols; c++) {
        rowArr.push(this.getRandomChar());
      }
      this.glitchBuffer.push(rowArr);
    }
  }

  setMode(mode) {
    this.mode = mode;
    this.initModeState();
  }

  setTheme(theme) {
    if (this.themeColors[theme]) {
      this.theme = theme;
    }
  }

  toggleInvertedMode() {
    if (this.theme === 'inverted') {
      this.theme = 'white';
      document.body.classList.remove('theme-inverted');
      document.body.classList.add('theme-white');
    } else {
      this.theme = 'inverted';
      document.body.classList.remove('theme-white');
      document.body.classList.add('theme-inverted');
    }
  }

  setFontSize(size) {
    this.fontSize = parseInt(size, 10);
    this.resize();
  }

  setTargetFps(fps) {
    this.targetFps = parseInt(fps, 10);
  }

  setCharSet(key, customString = '') {
    this.charSetKey = key;
    if (key === 'custom') {
      this.customCharSet = customString || 'ANTIGRAVITY 01';
      this.charSets.custom = this.customCharSet;
    }
  }

  getRandomChar() {
    let chars = this.charSets[this.charSetKey];
    if (this.charSetKey === 'custom') chars = this.customCharSet || 'ANTIGRAVITY';
    if (!chars || chars.length === 0) chars = this.charSets.dense;
    return chars[Math.floor(Math.random() * chars.length)];
  }

  addRipple(x, y, maxRadius = 100) {
    this.ripples.push({
      x, y,
      radius: 0,
      maxRadius,
      speed: 4 + Math.random() * 3
    });
    if (this.ripples.length > 12) this.ripples.shift();
  }

  setOutlineText(text) {
    if (text === null || text === undefined || text === '') {
      this.activeLetterMask = null;
      this.letterMaskOpacity = 0;
      this.currentTypedChar = '';
      return;
    }

    const str = String(text).toUpperCase();
    this.currentTypedChar = str;

    if (this.ttsBot) {
      this.ttsBot.speakChar(str);
    }

    if (str.trim() === '') {
      this.activeLetterMask = null;
      this.letterMaskOpacity = 0;
      return;
    }

    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.cols;
    offCanvas.height = this.rows;
    const offCtx = offCanvas.getContext('2d');

    // Use a fixed uniform font size (48% of grid height) so all words render at the exact same size
    let fontSize = Math.floor(this.rows * 0.48);
    offCtx.font = `900 ${fontSize}px 'Outfit', 'Fira Code', 'Arial Black', sans-serif`;

    const maxAllowedWidth = this.cols * 0.90;
    let totalWidth = offCtx.measureText(str).width;

    // Only shrink if an unusually long word exceeds 90% of screen width
    while (totalWidth > maxAllowedWidth && fontSize > 4) {
      fontSize -= 1;
      offCtx.font = `900 ${fontSize}px 'Outfit', 'Fira Code', 'Arial Black', sans-serif`;
      totalWidth = offCtx.measureText(str).width;
    }

    offCtx.fillStyle = '#000000';
    offCtx.fillRect(0, 0, this.cols, this.rows);

    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#ffffff';
    offCtx.fillText(str, this.cols / 2, this.rows / 2);

    const imgData = offCtx.getImageData(0, 0, this.cols, this.rows);
    const data = imgData.data;

    // Calculate exact pixel boundaries for each character accounting for variable letter widths
    const charBounds = [];
    const x0 = (this.cols - totalWidth) / 2;

    for (let i = 0; i < str.length; i++) {
      const startX = x0 + offCtx.measureText(str.slice(0, i)).width;
      const endX = x0 + offCtx.measureText(str.slice(0, i + 1)).width;
      charBounds.push({ char: str[i], startX, endX });
    }

    function getCharForColumn(col) {
      const cMid = col + 0.5;
      for (let i = 0; i < charBounds.length; i++) {
        if (cMid >= charBounds[i].startX && cMid <= charBounds[i].endX) {
          return charBounds[i].char;
        }
      }
      if (cMid < charBounds[0].startX) return charBounds[0].char;
      return charBounds[charBounds.length - 1].char;
    }

    this.activeLetterMask = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        const idx = (r * this.cols + c) * 4;
        if (data[idx] > 35 && data[idx + 3] > 35) {
          row.push(getCharForColumn(c));
        } else {
          row.push(null);
        }
      }
      this.activeLetterMask.push(row);
    }

    this.letterMaskOpacity = 1.0;
  }

  // Web Audio Synth Generator
  playTickAudio() {
    if (!this.audioEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = Math.random() < 0.5 ? 'sine' : 'square';
      osc.frequency.setValueAtTime(400 + Math.random() * 800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.02);

      gain.gain.setValueAtTime(this.volume * 0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.02);
    } catch (e) {
      // Audio context policy fallback
    }
  }

  // ==========================================================================
  // RENDERER & TICK LOOP
  // ==========================================================================
  render(currentTime) {
    if (!this.isRunning) return;

    const interval = 1000 / this.targetFps;
    const delta = currentTime - this.lastFrameTime;

    if (delta >= interval) {
      this.lastFrameTime = currentTime - (delta % interval);
      this.tickCount++;
      this.frameCount++;

      // Update FPS counter every second
      if (currentTime - this.fpsTimer >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.fpsTimer = currentTime;
      }

      // Update Ripples Physics
      this.updateRipples();

      // Clear Canvas Background
      const themeCol = this.themeColors[this.theme] || this.themeColors.matrix;
      const bgColor = themeCol.bg || '#050505';
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Render Selected ASCII Mode
      this.ctx.font = `${this.fontSize}px 'Fira Code', 'Courier New', monospace`;
      this.ctx.textBaseline = 'top';

      switch (this.mode) {
        case 'matrix':
          this.renderMatrixRain(themeCol);
          break;
        case 'donut':
          this.render3dDonut(themeCol);
          break;
        case 'glitch':
          this.renderCyberGlitch(themeCol);
          break;
        case 'wave':
          this.renderPerlinWave(themeCol);
          break;
        case 'starfield':
          this.renderStarfield(themeCol);
          break;
        case 'live-server':
          this.renderLiveServerStream(themeCol);
          break;
        default:
          this.renderMatrixRain(themeCol);
      }

      // Audio Click Tick Feedback
      if (this.tickCount % Math.max(1, Math.floor(60 / (this.targetFps * 0.5))) === 0) {
        this.playTickAudio();
      }
    }

    requestAnimationFrame((t) => this.render(t));
  }

  updateRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      if (r.radius > r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }

  getRippleDistortion(x, y) {
    if (this.ripples.length === 0) return false;
    for (const r of this.ripples) {
      const dx = x - r.x;
      const dy = y - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(dist - r.radius) < 18) {
        return true;
      }
    }
    return false;
  }

  // ==========================================================================
  // MODE 1: MATRIX DIGITAL RAIN
  // ==========================================================================
  renderMatrixRain(themeCol) {
    for (let c = 0; c < this.cols; c++) {
      const col = this.matrixColumns[c];
      if (!col) continue;

      col.y += col.speed;
      if (col.y > this.rows + col.length) {
        col.y = -Math.floor(Math.random() * 20);
        col.speed = 0.5 + Math.random() * 1.5;
        col.length = 8 + Math.floor(Math.random() * 24);
      }

      const x = c * this.charWidth;
      const headY = Math.floor(col.y);

      for (let i = 0; i < col.length; i++) {
        const ry = headY - i;
        if (ry < 0 || ry >= this.rows) continue;

        const y = ry * this.charHeight;
        const isDistorted = this.getRippleDistortion(x, y);

        // Randomly mutate character every tick
        if (Math.random() < 0.08 || isDistorted) {
          col.chars[i] = this.getRandomChar();
        }

        const char = isDistorted ? '!' : (col.chars[i] || '0');

        if (i === 0) {
          // Glowing Head Character
          this.ctx.fillStyle = themeCol.lead;
          this.ctx.shadowColor = themeCol.glow;
          this.ctx.shadowBlur = 8;
        } else {
          // Tail fading
          const alpha = 1 - (i / col.length);
          this.ctx.fillStyle = themeCol.main;
          this.ctx.globalAlpha = alpha;
          this.ctx.shadowBlur = 0;
        }

        this.ctx.fillText(char, x, y);
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
      }
    }
  }

  // ==========================================================================
  // MODE 2: 3D ASCII ROTATING DONUT
  // ==========================================================================
  render3dDonut(themeCol) {
    this.donutA += 0.04;
    this.donutB += 0.02;

    const b = [];
    const z = [];
    const size = this.cols * this.rows;

    for (let i = 0; i < size; i++) {
      b[i] = ' ';
      z[i] = 0;
    }

    const R1 = 1;
    const R2 = 2;
    const K2 = 5;
    const K1 = this.cols * K2 * 3 / (8 * (R1 + R2));

    const chars = this.charSets[this.charSetKey] || this.charSets.dense;

    for (let j = 0; j < 6.28; j += 0.07) {
      for (let i = 0; i < 6.28; i += 0.02) {
        const cA = Math.cos(this.donutA), sA = Math.sin(this.donutA);
        const cB = Math.cos(this.donutB), sB = Math.sin(this.donutB);
        const ct = Math.cos(j), st = Math.sin(j);
        const cp = Math.cos(i), sp = Math.sin(i);

        const ox = R2 + R1 * ct;
        const oy = R1 * st;

        const x = ox * (cB * cp + sA * sB * sp) - oy * cA * sB;
        const y = ox * (sB * cp - sA * cB * sp) + oy * cA * cB;
        const ooz = 1 / (R1 * st * sA + ox * cA * sp + K2 + 3);

        const xp = Math.floor(this.cols / 2 + K1 * ooz * x);
        const yp = Math.floor(this.rows / 2 + (K1 * ooz * y) * 0.5);

        const L = (((sp * sA - st * cA * cp) * cB) - st * cA * sp - sp * cA - st * sA);
        const luminanceIndex = Math.floor(Math.max(0, L) * 8);

        if (yp >= 0 && yp < this.rows && xp >= 0 && xp < this.cols) {
          const idx = xp + yp * this.cols;
          if (ooz > z[idx]) {
            z[idx] = ooz;
            b[idx] = chars[luminanceIndex % chars.length] || chars[chars.length - 1];
          }
        }
      }
    }

    // Render 3D Donut ASCII Buffer
    this.ctx.fillStyle = themeCol.main;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const char = b[c + r * this.cols];
        if (char !== ' ') {
          const x = c * this.charWidth;
          const y = r * this.charHeight;

          if (this.getRippleDistortion(x, y)) {
            this.ctx.fillStyle = themeCol.lead;
            this.ctx.fillText('#', x, y);
          } else {
            this.ctx.fillStyle = themeCol.main;
            this.ctx.fillText(char, x, y);
          }
        }
      }
    }
  }

  // ==========================================================================
  // MODE 3: CYBER GLITCH MEMORY DUMP STREAM
  // ==========================================================================
  renderCyberGlitch(themeCol) {
    const chars = this.charSets[this.charSetKey] || this.charSets.hex;
    const mutationRate = this.targetFps >= 100 ? 0.75 : 0.40;

    this.ctx.fillStyle = themeCol.main;
    this.ctx.shadowBlur = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.charWidth;
        const y = r * this.charHeight;

        // Rapid character mutation per tick
        if (Math.random() < mutationRate || this.getRippleDistortion(x, y)) {
          this.glitchBuffer[r][c] = chars[Math.floor(Math.random() * chars.length)];
        }

        let char = this.glitchBuffer[r][c] || '0';

        // Check if pixel belongs to typed letter outline mask
        if (this.activeLetterMask && this.activeLetterMask[r] && this.activeLetterMask[r][c]) {
          if (Math.random() < this.letterMaskOpacity) {
            const baseChar = this.activeLetterMask[r][c];
            // Constantly switch between uppercase and lowercase (e.g. S and s) for dynamic flickering effect
            char = Math.random() < 0.5 ? baseChar.toUpperCase() : baseChar.toLowerCase();
          }
        }

        // Render all characters in exact same text color
        this.ctx.fillText(char, x, y);
      }
    }

    // Slowly decay letter mask opacity over time if set via one-shot keypress
    if (this.letterMaskOpacity > 0.05 && !this.isSequenceRunning) {
      this.letterMaskOpacity -= 0.002;
    }
  }

  // ==========================================================================
  // MODE 4: PERLIN / TRIGONOMETRIC FLUID WAVE FIELD
  // ==========================================================================
  renderPerlinWave(themeCol) {
    const chars = this.charSets[this.charSetKey] || this.charSets.dense;
    const time = this.tickCount * 0.05;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.charWidth;
        const y = r * this.charHeight;

        // Wave density math formula
        const v1 = Math.sin(c * 0.06 + time);
        const v2 = Math.cos(r * 0.06 + time * 1.2);
        const v3 = Math.sin((c + r) * 0.04 + time * 0.8);
        const norm = (v1 + v2 + v3 + 3) / 6; // Normalize to 0..1

        let charIdx = Math.floor(norm * chars.length);
        charIdx = Math.max(0, Math.min(chars.length - 1, charIdx));

        const char = this.getRippleDistortion(x, y) ? '@' : chars[charIdx];

        // Color intensity based on wave height
        if (norm > 0.75) {
          this.ctx.fillStyle = themeCol.lead;
        } else if (norm > 0.4) {
          this.ctx.fillStyle = themeCol.main;
        } else {
          this.ctx.fillStyle = themeCol.dim;
        }

        this.ctx.fillText(char, x, y);
      }
    }
  }

  // ==========================================================================
  // MODE 5: HYPERSPACE 3D STARFIELD TUNNEL
  // ==========================================================================
  renderStarfield(themeCol) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const chars = this.charSets[this.charSetKey] || this.charSets.dense;

    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];

      s.z -= 15;
      if (s.z <= 0) {
        s.x = (Math.random() - 0.5) * this.width * 2;
        s.y = (Math.random() - 0.5) * this.height * 2;
        s.z = 1000;
        s.char = this.getRandomChar();
      }

      const k = 400 / s.z;
      const px = s.x * k + cx;
      const py = s.y * k + cy;

      if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
        const charIdx = Math.floor((1 - s.z / 1000) * chars.length);
        const char = s.char || chars[charIdx % chars.length];

        if (s.z < 250) {
          this.ctx.fillStyle = themeCol.lead;
          this.ctx.shadowColor = themeCol.glow;
          this.ctx.shadowBlur = 6;
        } else {
          this.ctx.fillStyle = themeCol.main;
          this.ctx.shadowBlur = 0;
        }

        this.ctx.fillText(char, px, py);
        this.ctx.shadowBlur = 0;
      }
    }
  }

  // ==========================================================================
  // MODE 6: LIVE SERVER SSE STREAM DISPLAY
  // ==========================================================================
  updateLiveServerData(data) {
    this.liveServerData = data;
  }

  renderLiveServerStream(themeCol) {
    if (!this.liveServerData) {
      this.ctx.fillStyle = themeCol.main;
      this.ctx.fillText('CONNECTING TO LIVE SERVER TICK STREAM (/api/ascii-stream)...', 40, 100);
      return;
    }

    const { tick, serverUptime, cpuUsage, activeClients, asciiChunk, hexChunk } = this.liveServerData;

    // Header Stream Status
    this.ctx.fillStyle = themeCol.lead;
    this.ctx.fillText(`► SERVER LIVE SSE TICK: #${tick}  |  UPTIME: ${serverUptime}s  |  CPU LOAD: ${cpuUsage}%  |  CLIENTS: ${activeClients}`, 20, 20);

    // Stream Grid Matrix
    const streamString = (asciiChunk + hexChunk + ' ').repeat(40);
    let strIdx = 0;

    for (let r = 2; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.charWidth;
        const y = r * this.charHeight;
        const char = streamString[strIdx % streamString.length];
        strIdx++;

        if (this.getRippleDistortion(x, y)) {
          this.ctx.fillStyle = themeCol.lead;
          this.ctx.fillText('★', x, y);
        } else if ((r + c + this.tickCount) % 17 === 0) {
          this.ctx.fillStyle = themeCol.lead;
          this.ctx.fillText(char, x, y);
        } else {
          this.ctx.fillStyle = themeCol.main;
          this.ctx.fillText(char, x, y);
        }
      }
    }
  }
}
