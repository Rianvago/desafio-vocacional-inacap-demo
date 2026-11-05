/* =========================================================================
   Motor voxel mínimo para el Demo Vocacional (Three.js r128, sin módulos)
   Expone el objeto global G que usan los niveles (nursing.js / design.js).
   ========================================================================= */
(function () {
  'use strict';
  const G = (window.G = {});
  const V3 = THREE.Vector3;

  /* ---------------------------------------------------------------- utils */
  G.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  function hexToRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb(r, g, b) {
    return `rgb(${G.clamp(r | 0, 0, 255)},${G.clamp(g | 0, 0, 255)},${G.clamp(b | 0, 0, 255)})`;
  }
  function shade(h, f) {
    const [r, g, b] = hexToRgb(h);
    return rgb(r * f, g * f, b * f);
  }
  G.shade = shade;
  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }

  /* ------------------------------------------------------- block textures */
  function canvasTex(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    draw(ctx, size);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  }
  const PAT = {
    noise(ctx, s, o, r) {
      const a = o.noise == null ? 0.07 : o.noise;
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          ctx.fillStyle = shade(o.color, 1 + (r() - 0.5) * 2 * a);
          ctx.fillRect(x, y, 1, 1);
        }
    },
    tile(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = shade(o.color, 0.82);
      ctx.fillRect(0, 0, s, 1);
      ctx.fillRect(0, 0, 1, s);
    },
    brick(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = shade(o.color, 0.7);
      for (let y = 0; y < s; y += 4) {
        ctx.fillRect(0, y, s, 1);
        const off = (y / 4) % 2 ? 4 : 0;
        for (let x = off; x < s; x += 8) ctx.fillRect(x, y, 1, 4);
      }
    },
    plank(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = shade(o.color, 0.75);
      for (let y = 3; y < s; y += 4) ctx.fillRect(0, y, s, 1);
      ctx.fillRect(5, 0, 1, 3);
      ctx.fillRect(11, 4, 1, 3);
      ctx.fillRect(3, 8, 1, 3);
      ctx.fillRect(9, 12, 1, 3);
    },
    panel(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = shade(o.color, 0.72);
      ctx.fillRect(0, 0, s, 1);
      ctx.fillRect(0, s - 1, s, 1);
      ctx.fillRect(0, 0, 1, s);
      ctx.fillRect(s - 1, 0, 1, s);
      ctx.fillStyle = shade(o.color, 1.12);
      ctx.fillRect(1, 1, s - 2, 1);
      ctx.fillRect(1, 1, 1, s - 2);
    },
    stripe(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = o.accent;
      ctx.fillRect(0, 6, s, 4);
      ctx.fillStyle = shade(o.accent, 0.8);
      ctx.fillRect(0, 9, s, 1);
    },
    grid(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = o.accent;
      ctx.fillRect(0, 0, s, 1);
      ctx.fillRect(0, 0, 1, s);
      ctx.fillRect(0, 8, s, 1);
      ctx.fillRect(8, 0, 1, s);
    },
    lamp(ctx, s, o) {
      ctx.fillStyle = o.color;
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = shade(o.color, 0.8);
      ctx.fillRect(0, 0, s, 2);
      ctx.fillRect(0, s - 2, s, 2);
      ctx.fillRect(0, 0, 2, s);
      ctx.fillRect(s - 2, 0, 2, s);
    },
    glitch(ctx, s, o, r) {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const v = 95 + r() * 60;
          ctx.fillStyle = rgb(v, v, v + 6);
          ctx.fillRect(x, y, 1, 1);
        }
      const cols = ['#ff2bd6', '#22e4ff', '#d9ff3a'];
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = cols[Math.floor(r() * 3)];
        ctx.globalAlpha = 0.55;
        ctx.fillRect(Math.floor(r() * 6), Math.floor(r() * s), 4 + Math.floor(r() * 10), 1);
      }
      ctx.globalAlpha = 1;
    },
    cross(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = o.accent;
      ctx.fillRect(6, 3, 4, 10);
      ctx.fillRect(3, 6, 10, 4);
    },
    shelf(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = shade(o.color, 0.6);
      ctx.fillRect(0, 7, s, 1);
      ctx.fillRect(0, 15, s, 1);
      const cols = ['#e63946', '#2a9d8f', '#f4a261', '#4cc9f0', '#ffffff', '#8338ec'];
      for (let row = 0; row < 2; row++)
        for (let x = 1; x < s - 1; x += 3) {
          if (r() < 0.25) continue;
          ctx.fillStyle = cols[Math.floor(r() * cols.length)];
          const h = 3 + Math.floor(r() * 3);
          ctx.fillRect(x, row * 8 + 7 - h, 2, h);
        }
    },
    checker(ctx, s, o, r) {
      PAT.noise(ctx, s, o, r);
      ctx.fillStyle = o.accent;
      for (let y = 0; y < s; y += 8) for (let x = (y / 8) % 2 ? 8 : 0; x < s; x += 16) ctx.fillRect(x, y, 8, 8);
    },
    leaves(ctx, s, o, r) {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          ctx.fillStyle = r() < 0.18 ? shade(o.color, 0.6) : shade(o.color, 0.85 + r() * 0.35);
          ctx.fillRect(x, y, 1, 1);
        }
    },
    ghost(ctx, s, o) {
      ctx.clearRect(0, 0, s, s);
      ctx.fillStyle = o.color;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(0, 0, s, s);
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, s, 1);
      ctx.fillRect(0, s - 1, s, 1);
      ctx.fillRect(0, 0, 1, s);
      ctx.fillRect(s - 1, 0, 1, s);
    },
  };

  const BLOCKS = (G.BLOCKS = {});
  let blockSeed = 7;
  G.defineBlock = function (name, o) {
    o = Object.assign({ pattern: 'noise', solid: true }, o);
    const r = seeded(blockSeed++ * 97);
    const tex = canvasTex(16, (ctx, s) => PAT[o.pattern](ctx, s, o, r));
    let mat;
    if (o.emissive) mat = new THREE.MeshBasicMaterial({ map: tex });
    else mat = new THREE.MeshLambertMaterial({ map: tex });
    if (o.transparent) {
      mat.transparent = true;
      mat.opacity = o.opacity == null ? 0.6 : o.opacity;
      mat.depthWrite = false;
    }
    BLOCKS[name] = { name, mat, solid: o.solid, transparent: !!o.transparent, color: o.color };
    return BLOCKS[name];
  };

  /* --------------------------------------------------------------- world */
  const GEO = new THREE.BoxGeometry(1, 1, 1);
  class World {
    constructor(scene) {
      this.cells = new Map();
      this.group = new THREE.Group();
      scene.add(this.group);
      this.dirty = true;
    }
    k(x, y, z) {
      return x + '|' + y + '|' + z;
    }
    set(x, y, z, t) {
      const k = this.k(x, y, z);
      if (t) this.cells.set(k, [x, y, z, t]);
      else this.cells.delete(k);
      this.dirty = true;
    }
    get(x, y, z) {
      const v = this.cells.get(this.k(x, y, z));
      return v ? v[3] : null;
    }
    isSolid(x, y, z) {
      const t = this.get(x, y, z);
      return !!t && BLOCKS[t].solid;
    }
    isOpaque(x, y, z) {
      const t = this.get(x, y, z);
      return !!t && !BLOCKS[t].transparent;
    }
    fill(x1, y1, z1, x2, y2, z2, t) {
      const [ax, bx] = [Math.min(x1, x2), Math.max(x1, x2)];
      const [ay, by] = [Math.min(y1, y2), Math.max(y1, y2)];
      const [az, bz] = [Math.min(z1, z2), Math.max(z1, z2)];
      for (let x = ax; x <= bx; x++) for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) this.set(x, y, z, t);
    }
    replace(x1, y1, z1, x2, y2, z2, from, to) {
      for (const v of this.cells.values()) {
        if (v[3] !== from) continue;
        if (v[0] < Math.min(x1, x2) || v[0] > Math.max(x1, x2)) continue;
        if (v[1] < Math.min(y1, y2) || v[1] > Math.max(y1, y2)) continue;
        if (v[2] < Math.min(z1, z2) || v[2] > Math.max(z1, z2)) continue;
        v[3] = to;
      }
      this.dirty = true;
    }
    /* Habitación con piso, muros y techo. Interior: x1+1..x2-1, z1+1..z2-1, y 1..h */
    room(x1, z1, x2, z2, o) {
      const h = o.h || 4;
      this.fill(x1, 0, z1, x2, 0, z2, o.floor);
      for (let y = 1; y <= h; y++) {
        const t = o.band && y === 1 ? o.band : o.wall;
        this.fill(x1, y, z1, x2, y, z1, t);
        this.fill(x1, y, z2, x2, y, z2, t);
        this.fill(x1, y, z1, x1, y, z2, t);
        this.fill(x2, y, z1, x2, y, z2, t);
      }
      if (o.ceil) {
        this.fill(x1, h + 1, z1, x2, h + 1, z2, o.ceil);
        if (o.lamp) {
          for (let x = x1 + 2; x < x2 - 1; x += o.lampStep || 4)
            for (let z = z1 + 2; z < z2 - 1; z += o.lampStep || 4) this.set(x, h + 1, z, o.lamp);
        }
      }
    }
    carve(x1, y1, z1, x2, y2, z2) {
      this.fill(x1, y1, z1, x2, y2, z2, null);
    }
    hidden(x, y, z) {
      return (
        this.isOpaque(x + 1, y, z) &&
        this.isOpaque(x - 1, y, z) &&
        this.isOpaque(x, y + 1, z) &&
        this.isOpaque(x, y - 1, z) &&
        this.isOpaque(x, y, z + 1) &&
        this.isOpaque(x, y, z - 1)
      );
    }
    rebuild() {
      while (this.group.children.length) this.group.remove(this.group.children[0]);
      const byType = {};
      for (const v of this.cells.values()) {
        if (this.hidden(v[0], v[1], v[2])) continue;
        (byType[v[3]] = byType[v[3]] || []).push(v);
      }
      const m = new THREE.Matrix4();
      for (const t in byType) {
        const arr = byType[t];
        const mesh = new THREE.InstancedMesh(GEO, BLOCKS[t].mat, arr.length);
        arr.forEach((v, i) => {
          m.makeTranslation(v[0] + 0.5, v[1] + 0.5, v[2] + 0.5);
          mesh.setMatrixAt(i, m);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.frustumCulled = false;
        if (BLOCKS[t].transparent) mesh.renderOrder = 2;
        this.group.add(mesh);
      }
      this.dirty = false;
    }
    /* Raycast voxel (Amanatides-Woo). Devuelve distancia al primer bloque opaco. */
    ray(o, d, max) {
      let x = Math.floor(o.x),
        y = Math.floor(o.y),
        z = Math.floor(o.z);
      const sx = Math.sign(d.x),
        sy = Math.sign(d.y),
        sz = Math.sign(d.z);
      const tdx = sx ? Math.abs(1 / d.x) : Infinity,
        tdy = sy ? Math.abs(1 / d.y) : Infinity,
        tdz = sz ? Math.abs(1 / d.z) : Infinity;
      let tmx = sx ? (sx > 0 ? x + 1 - o.x : o.x - x) * tdx : Infinity;
      let tmy = sy ? (sy > 0 ? y + 1 - o.y : o.y - y) * tdy : Infinity;
      let tmz = sz ? (sz > 0 ? z + 1 - o.z : o.z - z) * tdz : Infinity;
      let t = 0;
      while (t <= max) {
        if (tmx < tmy && tmx < tmz) {
          x += sx;
          t = tmx;
          tmx += tdx;
        } else if (tmy < tmz) {
          y += sy;
          t = tmy;
          tmy += tdy;
        } else {
          z += sz;
          t = tmz;
          tmz += tdz;
        }
        if (this.isOpaque(x, y, z)) return t;
      }
      return Infinity;
    }
  }
  G.World = World;

  /* -------------------------------------------------------------- sonido */
  G.sfx = {
    ctx: null,
    muted: false,
    init() {
      if (this.ctx) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    },
    tone(f, d, type = 'square', v = 0.045, slide = 0, delay = 0) {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(),
        g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + d + 0.03);
    },
    pick() {
      this.tone(660, 0.08);
      this.tone(990, 0.1, 'square', 0.045, 0, 0.07);
    },
    good() {
      [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'square', 0.045, 0, i * 0.09));
    },
    bad() {
      this.tone(220, 0.28, 'sawtooth', 0.05, -90);
    },
    door() {
      this.tone(120, 0.45, 'triangle', 0.09, -50);
      this.tone(180, 0.3, 'square', 0.02, -60, 0.05);
    },
    win() {
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.2, 'square', 0.045, 0, i * 0.12));
    },
    alarm() {
      this.tone(880, 0.2, 'sine', 0.02);
      this.tone(660, 0.2, 'sine', 0.02, 0, 0.22);
    },
    click() {
      this.tone(520, 0.05, 'square', 0.03);
    },
    hit() {
      this.tone(140, 0.2, 'sawtooth', 0.05, -40);
    },
    toggle() {
      this.muted = !this.muted;
      G.toast(this.muted ? 'Sonido desactivado (M)' : 'Sonido activado (M)');
    },
  };

  /* ------------------------------------------------------------ renderer */
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 200);
  camera.rotation.order = 'YXZ';
  G.renderer = renderer;
  G.camera = camera;
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  G.newScene = function (opts = {}) {
    if (G.scene) disposeScene(G.scene);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(opts.sky || '#9fd3f5');
    scene.fog = new THREE.Fog(opts.fog || opts.sky || '#9fd3f5', opts.fogNear || 22, opts.fogFar || 70);
    const hemi = new THREE.HemisphereLight(0xffffff, opts.ground || 0x556677, opts.hemi == null ? 0.85 : opts.hemi);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, opts.sun == null ? 0.55 : opts.sun);
    sun.position.set(0.6, 1, 0.35);
    scene.add(sun);
    G.scene = scene;
    G.lights = { hemi, sun };
    G.world = new World(scene);
    G.interactables = [];
    G.colliders = [];
    G.tickers = [];
    G.hover = null;
    return scene;
  };
  function disposeScene(scene) {
    scene.traverse((o) => {
      if (o.isMesh || o.isSprite) {
        if (o.geometry && o.geometry !== GEO) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (!m || isBlockMat(m)) return;
          if (m.map && !m.map.__shared) m.map.dispose();
          m.dispose();
        });
      }
    });
  }
  function isBlockMat(m) {
    for (const k in BLOCKS) if (BLOCKS[k].mat === m) return true;
    return false;
  }

  /* -------------------------------------------------- props & helpers 3D */
  const lamCache = {};
  G.lam = function (color) {
    if (!lamCache[color]) lamCache[color] = new THREE.MeshLambertMaterial({ color });
    return lamCache[color];
  };
  function isCachedLam(m) {
    for (const k in lamCache) if (lamCache[k] === m) return true;
    return false;
  }
  const _origIsBlock = isBlockMat;
  isBlockMat = function (m) {
    return _origIsBlock(m) || isCachedLam(m);
  };

  G.box = function (w, h, d, color, x = 0, y = 0, z = 0, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? G.lam(color) : color);
    m.position.set(x, y, z);
    if (parent) parent.add(m);
    return m;
  };

  function textCanvas(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return { canvas: c, tex: t };
  }
  G.textCanvas = textCanvas;
  const FONT = '"Segoe UI", "Rubik", Arial, sans-serif';
  G.FONT = FONT;

  /* Cartel plano (sin iluminación) */
  G.sign = function (text, o = {}) {
    const w = o.w || 3,
      h = o.h || 0.8;
    const px = 160;
    const { tex } = textCanvas(Math.round(w * px), Math.round(h * px), (ctx, cw, ch) => {
      ctx.fillStyle = o.bg || '#12263a';
      ctx.fillRect(0, 0, cw, ch);
      if (o.border !== false) {
        ctx.strokeStyle = o.borderColor || o.fg || '#ffffff';
        ctx.lineWidth = Math.max(6, ch * 0.05);
        ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, cw - ctx.lineWidth, ch - ctx.lineWidth);
      }
      const lines = String(text).split('\n');
      let size = o.size ? o.size * px : (ch / lines.length) * 0.52;
      ctx.font = `${o.weight || 800} ${size}px ${FONT}`;
      const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (maxW > cw * 0.9) {
        size *= (cw * 0.9) / maxW;
        ctx.font = `${o.weight || 800} ${size}px ${FONT}`;
      }
      ctx.fillStyle = o.fg || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lh = size * 1.18;
      const y0 = ch / 2 - ((lines.length - 1) * lh) / 2;
      lines.forEach((l, i) => ctx.fillText(l, cw / 2, y0 + i * lh));
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.transparent }));
    return m;
  };

  /* Sprite con emoji o texto, siempre mirando a la cámara */
  G.emoji = function (ch, size = 0.6) {
    const { tex } = textCanvas(128, 128, (ctx) => {
      ctx.font = `96px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, 64, 72);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
    s.scale.set(size, size, size);
    return s;
  };
  G.label = function (text, o = {}) {
    const { canvas: c, tex } = textCanvas(512, 128, (ctx, w, h) => {
      ctx.font = `800 52px ${FONT}`;
      const tw = ctx.measureText(text).width + 48;
      const bw = Math.min(w, tw);
      ctx.fillStyle = o.bg || 'rgba(10,20,35,0.82)';
      roundRect(ctx, (w - bw) / 2, 22, bw, 84, 18);
      ctx.fill();
      ctx.fillStyle = o.fg || '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, 66, w - 30);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, depthTest: o.depthTest !== false }));
    const sc = o.scale || 1.6;
    s.scale.set(sc, sc / 4, 1);
    return s;
  };
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  G.roundRect = roundRect;

  /* Personaje de cubos (mirando hacia +z). Pivotes para animar. */
  G.person = function (o = {}) {
    const g = new THREE.Group();
    const skin = o.skin || '#e0ac8a',
      shirt = o.shirt || '#3a7bd5',
      pants = o.pants || '#2d3142',
      hair = o.hair || '#3b2618',
      shoes = o.shoes || '#1d1d1d';
    const pivot = (x, y) => {
      const p = new THREE.Group();
      p.position.set(x, y, 0);
      g.add(p);
      return p;
    };
    const legL = pivot(-0.13, 0.72),
      legR = pivot(0.13, 0.72);
    [legL, legR].forEach((p) => {
      G.box(0.24, 0.6, 0.26, pants, 0, -0.3, 0, p);
      G.box(0.25, 0.13, 0.3, shoes, 0, -0.66, 0.02, p);
    });
    const body = G.box(0.52, 0.7, 0.3, shirt, 0, 1.07, 0, g);
    if (o.cross) {
      const c = G.box(0.16, 0.05, 0.02, o.cross, 0.12, 1.25, 0.16, g);
      G.box(0.05, 0.16, 0.02, o.cross, 0.12, 1.25, 0.165, g);
      c.position.z = 0.16;
    }
    const armL = pivot(-0.37, 1.38),
      armR = pivot(0.37, 1.38);
    [armL, armR].forEach((p) => {
      G.box(0.2, 0.42, 0.22, shirt, 0, -0.2, 0, p);
      G.box(0.18, 0.26, 0.2, skin, 0, -0.53, 0, p);
    });
    // cabeza con cara
    const face = textCanvas(32, 32, (ctx) => {
      ctx.fillStyle = skin;
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = hair;
      ctx.fillRect(0, 0, 32, 7);
      if (o.mask) {
        ctx.fillStyle = o.mask;
        ctx.fillRect(4, 17, 24, 11);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 12, 6, 5);
      ctx.fillRect(19, 12, 6, 5);
      ctx.fillStyle = o.eyes || '#20252c';
      ctx.fillRect(9, 13, 3, 4);
      ctx.fillRect(21, 13, 3, 4);
      if (o.tired) {
        ctx.fillStyle = 'rgba(70,40,90,.55)';
        ctx.fillRect(7, 17, 6, 2);
        ctx.fillRect(19, 17, 6, 2);
      }
      if (!o.mask) {
        ctx.fillStyle = o.mouth || '#8a4b3c';
        ctx.fillRect(12, 22, 8, 2);
      }
    }).tex;
    face.magFilter = THREE.NearestFilter;
    const skinM = G.lam(skin);
    const faceM = new THREE.MeshLambertMaterial({ map: face });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), [skinM, skinM, G.lam(hair), skinM, faceM, skinM]);
    const headPivot = pivot(0, 1.43);
    head.position.y = 0.23;
    headPivot.add(head);
    G.box(0.5, 0.1, 0.5, hair, 0, 0.5, -0.01, headPivot);
    G.box(0.5, 0.3, 0.08, hair, 0, 0.32, -0.23, headPivot);
    if (o.cap) G.box(0.52, 0.08, 0.52, o.cap, 0, 0.55, 0, headPivot);
    g.userData.parts = { legL, legR, armL, armR, head: headPivot, body };
    return g;
  };
  G.walkAnim = function (p, t, amp = 0.6) {
    const s = Math.sin(t) * amp;
    const P = p.userData.parts;
    P.legL.rotation.x = s;
    P.legR.rotation.x = -s;
    P.armL.rotation.x = -s * 0.8;
    P.armR.rotation.x = s * 0.8;
  };

  /* Interactuables */
  G.interact = function (obj, cfg) {
    cfg.obj = obj;
    if (cfg.enabled == null) cfg.enabled = true;
    obj.userData.interact = cfg;
    obj.traverse((c) => (c.userData.owner = obj));
    G.interactables.push(obj);
    return cfg;
  };
  G.unInteract = function (obj) {
    G.interactables = G.interactables.filter((o) => o !== obj);
    delete obj.userData.interact;
    if (G.hover && G.hover.obj === obj) G.hover = null;
  };
  G.collider = function (x1, y1, z1, x2, y2, z2) {
    const b = new THREE.Box3(new V3(Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)), new V3(Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)));
    G.colliders.push(b);
    return b;
  };
  G.removeCollider = (b) => (G.colliders = G.colliders.filter((c) => c !== b));
  G.tick = (fn) => G.tickers.push(fn);

  /* Partículas de cubos */
  G.burst = function (pos, colors, n = 18, speed = 3, life = 1.2, size = 0.12) {
    const parts = [];
    for (let i = 0; i < n; i++) {
      const m = G.box(size, size, size, colors[i % colors.length], pos.x, pos.y, pos.z);
      m.userData.v = new V3(G.rand(-1, 1), G.rand(0.4, 1.6), G.rand(-1, 1)).multiplyScalar(speed);
      G.scene.add(m);
      parts.push(m);
    }
    let t = 0;
    G.tick((dt) => {
      t += dt;
      parts.forEach((m) => {
        m.userData.v.y -= 9 * dt;
        m.position.addScaledVector(m.userData.v, dt);
        m.rotation.x += dt * 4;
        m.rotation.y += dt * 3;
        const s = Math.max(0.01, 1 - t / life);
        m.scale.setScalar(s);
      });
      if (t > life) {
        parts.forEach((m) => {
          G.scene.remove(m);
          m.geometry.dispose();
        });
        return false;
      }
    });
  };
  G.confetti = function (pos) {
    const cols = ['#ff2bd6', '#22e4ff', '#ffd23f', '#3ddc84', '#ff6b35', '#ffffff', '#8b5cf6'];
    for (let i = 0; i < 4; i++) setTimeout(() => G.scene && G.burst(pos, cols, 40, 5.5, 2.2, 0.14), i * 220);
  };

  /* Abre "puertas" de bloques con efecto */
  G.openCells = function (cells, color = '#ffffff') {
    const w = G.world;
    let cx = 0,
      cy = 0,
      cz = 0;
    cells.forEach(([x, y, z]) => {
      w.set(x, y, z, null);
      cx += x;
      cy += y;
      cz += z;
    });
    const n = cells.length || 1;
    G.burst(new V3(cx / n + 0.5, cy / n + 0.5, cz / n + 0.5), [color, '#ffffff', '#cccccc'], 26, 3.5);
    G.sfx.door();
  };
  G.doorCells = function (x1, y1, z1, x2, y2, z2) {
    const out = [];
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) out.push([x, y, z]);
    return out;
  };

  /* ------------------------------------------------------------- jugador */
  const P = (G.player = { pos: new V3(), vel: new V3(), yaw: 0, pitch: 0, onGround: false, w: 0.3, h: 1.7, eye: 1.58, push: new V3(), stun: 0, respawn: null });
  const keys = {};
  function collides(px, py, pz) {
    const w = G.world;
    for (let x = Math.floor(px - P.w); x <= Math.floor(px + P.w); x++)
      for (let y = Math.floor(py); y <= Math.floor(py + P.h - 0.001); y++)
        for (let z = Math.floor(pz - P.w); z <= Math.floor(pz + P.w); z++) if (w.isSolid(x, y, z)) return true;
    for (const b of G.colliders) {
      if (px + P.w > b.min.x && px - P.w < b.max.x && py + P.h > b.min.y && py < b.max.y && pz + P.w > b.min.z && pz - P.w < b.max.z) return true;
    }
    return false;
  }
  G.collides = collides;
  G.setPlayer = function (x, y, z, yaw = 0) {
    P.pos.set(x, y, z);
    P.vel.set(0, 0, 0);
    P.push.set(0, 0, 0);
    P.yaw = yaw;
    P.pitch = 0;
    P.respawn = { x, y, z, yaw };
  };
  function updatePlayer(dt) {
    let fx = 0,
      fz = 0;
    if (P.stun <= 0) {
      if (keys.KeyW || keys.ArrowUp) fz += 1;
      if (keys.KeyS || keys.ArrowDown) fz -= 1;
      if (keys.KeyA) fx -= 1;
      if (keys.KeyD) fx += 1;
      if (keys.ArrowLeft) P.yaw += 2.2 * dt;
      if (keys.ArrowRight) P.yaw -= 2.2 * dt;
    } else P.stun -= dt;
    const len = Math.hypot(fx, fz) || 1;
    const speed = keys.ShiftLeft ? 6 : 4.4;
    const sin = Math.sin(P.yaw),
      cos = Math.cos(P.yaw);
    let vx = ((-sin * fz + cos * fx) / len) * speed;
    let vz = ((-cos * fz - sin * fx) / len) * speed;
    vx += P.push.x;
    vz += P.push.z;
    P.push.multiplyScalar(Math.max(0, 1 - dt * 5));
    P.vel.y -= 22 * dt;
    if (keys.Space && P.onGround && P.stun <= 0) {
      P.vel.y = 7.2;
      P.onGround = false;
    }
    let nx = P.pos.x + vx * dt;
    if (!collides(nx, P.pos.y, P.pos.z)) P.pos.x = nx;
    let nz = P.pos.z + vz * dt;
    if (!collides(P.pos.x, P.pos.y, nz)) P.pos.z = nz;
    let ny = P.pos.y + P.vel.y * dt;
    if (!collides(P.pos.x, ny, P.pos.z)) {
      P.pos.y = ny;
      P.onGround = false;
    } else {
      if (P.vel.y < 0) {
        P.onGround = true;
        P.pos.y = Math.ceil(ny - 0.001) > ny ? Math.floor(P.pos.y + 0.0001) : P.pos.y;
      }
      P.vel.y = 0;
    }
    if (P.pos.y < (G.voidY == null ? -12 : G.voidY)) {
      if (G.onFall) G.onFall();
      const r = G.checkpoint || P.respawn;
      P.pos.set(r.x, r.y, r.z);
      P.vel.set(0, 0, 0);
    }
    camera.position.set(P.pos.x, P.pos.y + P.eye, P.pos.z);
    camera.rotation.set(P.pitch, P.yaw, 0);
  }

  /* ---------------------------------------------------------------- input */
  const isTyping = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  window.addEventListener('keydown', (e) => {
    if (isTyping(e)) return;
    keys[e.code] = true;
    if (G.state !== 'play') return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (G.modalOpen) {
      if (e.code === 'Escape' && G._modalClosable) G.closeModal();
      return;
    }
    if (e.code === 'KeyE' || e.code === 'Enter') tryInteract();
    if (e.code === 'KeyM') G.sfx.toggle();
    if (e.code === 'KeyN' && e.shiftKey) G.skipStage();
  });
  window.addEventListener('keyup', (e) => (keys[e.code] = false));
  window.addEventListener('blur', () => Object.keys(keys).forEach((k) => (keys[k] = false)));

  let dragging = false,
    downX = 0,
    downY = 0,
    moved = 0;
  G.lockFailed = false;
  const isLocked = () => document.pointerLockElement === canvas;
  G.requestLock = function () {
    if (G.lockFailed || isLocked()) return;
    try {
      const p = canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  };
  document.addEventListener('pointerlockerror', () => {
    G.lockFailed = true;
    hidePause();
  });
  document.addEventListener('pointerlockchange', () => {
    if (isLocked()) hidePause();
    else if (G.state === 'play' && !G.modalOpen && !G.lockFailed) showPause();
  });
  canvas.addEventListener('mousedown', (e) => {
    G.sfx.init();
    dragging = true;
    downX = e.clientX;
    downY = e.clientY;
    moved = 0;
  });
  window.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    if (G.state !== 'play' || G.modalOpen) return;
    if (moved > 6) return;
    if (isLocked() || G.lockFailed) tryInteract();
    else G.requestLock();
  });
  window.addEventListener('mousemove', (e) => {
    if (G.state !== 'play' || G.modalOpen) return;
    if (isLocked()) {
      P.yaw -= e.movementX * 0.0022;
      P.pitch -= e.movementY * 0.0022;
    } else if (dragging) {
      moved += Math.abs(e.movementX) + Math.abs(e.movementY);
      P.yaw -= e.movementX * 0.005;
      P.pitch -= e.movementY * 0.005;
    }
    P.pitch = G.clamp(P.pitch, -1.45, 1.45);
  });
  const pauseEl = document.getElementById('pause');
  function showPause() {
    pauseEl.classList.add('show');
  }
  function hidePause() {
    pauseEl.classList.remove('show');
  }
  pauseEl.addEventListener('click', () => {
    G.sfx.init();
    hidePause();
    G.requestLock();
  });
  document.getElementById('pauseMenu').addEventListener('click', (e) => {
    e.stopPropagation();
    hidePause();
    G.toMenu();
  });

  /* ------------------------------------------------------ hover/interact */
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  const promptEl = document.getElementById('prompt');
  function updateHover() {
    raycaster.setFromCamera(center, camera);
    raycaster.far = 4.6;
    const hits = raycaster.intersectObjects(G.interactables, true);
    let found = null;
    if (hits.length) {
      const wallD = G.world.ray(raycaster.ray.origin, raycaster.ray.direction, 4.6);
      for (const h of hits) {
        if (h.distance > wallD + 0.05) break;
        const owner = h.object.userData.owner;
        if (owner && owner.userData.interact && owner.visible) {
          found = owner.userData.interact;
          break;
        }
      }
    }
    G.hover = found;
    if (found) {
      promptEl.innerHTML = found.enabled
        ? `<kbd>E</kbd><span>${found.label}</span>`
        : `<span class="dim">${found.disabledLabel || found.label}</span>`;
      promptEl.classList.add('show');
    } else promptEl.classList.remove('show');
    document.getElementById('crosshair').classList.toggle('on', !!(found && found.enabled));
  }
  function tryInteract() {
    const h = G.hover;
    if (!h) return;
    if (!h.enabled) {
      if (h.disabledMsg) G.toast(h.disabledMsg);
      return;
    }
    h.onUse(h.obj);
  }
  G.tryInteract = tryInteract;

  /* ----------------------------------------------------------------- HUD */
  const $ = (id) => document.getElementById(id);
  G.$ = $;
  G.toast = function (msg, kind = 'info', ms = 3200) {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = msg;
    $('toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => {
      el.classList.remove('in');
      setTimeout(() => el.remove(), 400);
    }, ms);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  };
  G.flash = function (color) {
    const f = $('flash');
    f.style.background = color;
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  };
  G.banner = function (kicker, title, ms = 2600) {
    const b = $('banner');
    b.innerHTML = `<div class="kicker">${kicker}</div><div class="title">${title}</div>`;
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
    clearTimeout(G._bannerT);
    G._bannerT = setTimeout(() => b.classList.remove('show'), ms);
  };
  G.setObjective = function (main, sub) {
    $('objMain').innerHTML = main;
    $('objSub').innerHTML = sub || '';
    const o = $('objective');
    o.classList.remove('pulse');
    void o.offsetWidth;
    o.classList.add('pulse');
  };

  /* Inventario */
  G.inv = [];
  G.addItem = function (it) {
    const ex = G.inv.find((i) => i.id === it.id);
    if (ex) ex.count = (ex.count || 1) + (it.count || 1);
    else G.inv.push(Object.assign({ count: 1 }, it));
    renderInv(it.id);
  };
  G.removeItem = function (id, n = 1) {
    const ex = G.inv.find((i) => i.id === id);
    if (!ex) return;
    ex.count -= n;
    if (ex.count <= 0) G.inv = G.inv.filter((i) => i !== ex);
    renderInv();
  };
  G.hasItem = (id) => G.inv.find((i) => i.id === id);
  G.clearInv = () => {
    G.inv = [];
    renderInv();
  };
  function renderInv(flashId) {
    const bar = $('hotbar');
    bar.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const it = G.inv[i];
      const s = document.createElement('div');
      s.className = 'slot' + (it && it.id === flashId ? ' new' : '');
      if (it) s.innerHTML = `<span class="ico">${it.icon}</span>${it.count > 1 ? `<b>${it.count}</b>` : ''}<i>${it.name}</i>`;
      bar.appendChild(s);
    }
  }

  /* Modal de elección */
  G.modalOpen = false;
  G.modal = function (o) {
    G.modalOpen = true;
    G._modalClosable = o.closable !== false;
    G._modalOnClose = o.onClose;
    if (isLocked()) document.exitPointerLock();
    const m = $('modal');
    m.querySelector('.m-title').innerHTML = o.title || '';
    m.querySelector('.m-text').innerHTML = o.text || '';
    const opts = m.querySelector('.m-opts');
    opts.innerHTML = '';
    opts.className = 'm-opts' + (o.layout ? ' ' + o.layout : '');
    (o.options || []).forEach((op) => {
      const b = document.createElement('button');
      b.className = 'm-opt' + (op.cls ? ' ' + op.cls : '');
      b.innerHTML = `${op.icon ? `<span class="ico">${op.icon}</span>` : ''}<span class="lbl">${op.label}</span>${op.sub ? `<span class="sub">${op.sub}</span>` : ''}`;
      if (op.disabled) b.disabled = true;
      b.addEventListener('click', () => {
        G.sfx.click();
        op.onPick(b);
      });
      opts.appendChild(b);
    });
    const c = m.querySelector('.m-close');
    c.style.display = G._modalClosable ? '' : 'none';
    c.textContent = o.closeLabel || 'Cerrar (Esc)';
    m.classList.add('show');
  };
  G.closeModal = function () {
    $('modal').classList.remove('show');
    G.modalOpen = false;
    const cb = G._modalOnClose;
    G._modalOnClose = null;
    if (cb) cb();
    if (G.state === 'play') G.requestLock();
  };
  $('modal').querySelector('.m-close').addEventListener('click', () => G.closeModal());

  /* ---------------------------------------------------------- partida */
  G.challenges = {};
  G.state = 'menu';
  G.run = null;
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  G.fmtTime = fmtTime;
  const now = () => performance.now() / 1000;

  G.startChallenge = function (id, name) {
    const ch = G.challenges[id];
    G.sfx.init();
    G.closeModalSilently();
    G.clearInv();
    G.checkpoint = null;
    G.voidY = null;
    G.onFall = null;
    const def = ch.build();
    G.run = { id, ch, name: name || 'Jugador/a', code: G.participant ? G.participant.codigo : null, stages: def.stages, idx: -1, scores: [], stageErr: 0, errors: 0, fichas: [], t0: now(), stageT0: now(), presenter: false, done: false };
    if (G.updateFichas) G.updateFichas();
    G.setPlayer(def.spawn.x, def.spawn.y, def.spawn.z, def.spawn.yaw || 0);
    document.body.dataset.theme = id;
    $('menu').classList.remove('show');
    $('results').classList.remove('show');
    $('hud').classList.add('show');
    $('hudTitle').innerHTML = `<span class="tag">${ch.tag}</span>${ch.title}`;
    G.state = 'play';
    G.world.rebuild();
    $('timer').textContent = '0:00';
    $('score').textContent = '0';
    const r = G.run;
    if (def.intro) {
      r.paused = true;
      G.modal({
        title: def.intro.title,
        text: def.intro.text,
        closable: false,
        options: [
          {
            label: '¡Comenzar misión!',
            cls: 'go',
            onPick() {
              r.t0 = now();
              r.paused = false;
              G.closeModal();
              G.nextStage();
            },
          },
        ],
      });
    } else {
      G.nextStage();
      G.requestLock();
    }
  };
  G.closeModalSilently = function () {
    $('modal').classList.remove('show');
    G.modalOpen = false;
    G._modalOnClose = null;
  };
  G.nextStage = function () {
    const r = G.run;
    r.idx++;
    r.stageErr = 0;
    r.stageT0 = now();
    const st = r.stages[r.idx];
    renderStages();
    G.banner(`Etapa ${r.idx + 1} de ${r.stages.length}`, st.title);
    G.setObjective(st.objective, st.sub);
    if (st.onEnter) st.onEnter();
  };
  G.stageScore = function () {
    const r = G.run,
      st = r.stages[r.idx];
    return Math.max(0, st.points - 5 * r.stageErr);
  };
  G.stageDone = function (override) {
    const r = G.run;
    if (!r || r.done) return;
    const st = r.stages[r.idx];
    const pts = override != null ? override : G.stageScore();
    r.scores.push({ title: st.title, pts, max: st.points, errors: r.stageErr, time: now() - r.stageT0 });
    G.sfx.good();
    G.toast(`<b>¡Etapa completada!</b> +${pts} pts`, 'good');
    G.flash('rgba(80,255,170,.25)');
    renderStages();
    if (r.idx + 1 < r.stages.length) setTimeout(() => G.run === r && !r.done && G.nextStage(), 900);
    else G.finish();
  };
  G.mistake = function (msg, penalty = true) {
    const r = G.run;
    if (penalty) {
      r.stageErr++;
      r.errors++;
    }
    G.sfx.bad();
    G.flash('rgba(255,60,60,.28)');
    G.toast(msg + (penalty ? ' <b class="neg">−5 pts</b>' : ''), 'bad', 4200);
  };
  G.skipStage = function () {
    const r = G.run;
    if (!r || r.done) return;
    r.presenter = true;
    G.toast('Modo presentador: etapa saltada (no guarda ranking)', 'info');
    const st = r.stages[r.idx];
    if (st.skip) st.skip();
    else G.stageDone(st.points);
  };
  function renderStages() {
    const r = G.run;
    const el = $('stages');
    el.innerHTML = r.stages
      .map((s, i) => {
        const sc = r.scores[i];
        const cls = sc ? 'done' : i === r.idx ? 'cur' : '';
        return `<div class="chip ${cls}" title="${s.title}"><b>${i + 1}</b><span>${s.short || s.title}</span></div>`;
      })
      .join('');
    const total = r.scores.reduce((a, s) => a + s.pts, 0);
    $('score').textContent = total;
  }

  G.finish = function () {
    const r = G.run;
    r.done = true;
    r.tEnd = now();
    const time = r.tEnd - r.t0;
    const base = r.scores.reduce((a, s) => a + s.pts, 0);
    const bonusTime = time < 12 * 60 ? 10 : 0;
    const bonusClean = r.errors === 0 ? 5 : 0;
    const bonusFichas = r.fichas.length * ((window.CONFIG && window.CONFIG.puntosPorFicha) || 2);
    const total = base + bonusTime + bonusClean + bonusFichas;
    r.result = { base, bonusTime, bonusClean, bonusFichas, total, time };
    G.sfx.win();
    setTimeout(() => {
      if (G.run !== r) return;
      G.state = 'results';
      if (isLocked()) document.exitPointerLock();
      showResults(r);
    }, r.ch.endDelay || 3200);
  };

  /* Ranking local (solo este computador) */
  function loadRank(id) {
    try {
      return JSON.parse(localStorage.getItem('demoVocacional_rank_' + id) || '[]');
    } catch (e) {
      return [];
    }
  }
  function saveRank(id, list) {
    try {
      localStorage.setItem('demoVocacional_rank_' + id, JSON.stringify(list));
    } catch (e) {}
  }
  function showResults(r) {
    const res = r.result;
    let rank = loadRank(r.id);
    let entry = null;
    if (!r.presenter) {
      entry = { name: r.name, code: r.code, total: res.total, time: Math.round(res.time), at: Date.now() };
      rank.push(entry);
      rank.sort((a, b) => b.total - a.total || a.time - b.time);
      rank = rank.slice(0, 50);
      saveRank(r.id, rank);
    }
    const pos = entry ? rank.indexOf(entry) + 1 : null;
    const ch = r.ch;
    $('hud').classList.remove('show');
    const el = $('results');
    el.querySelector('.r-kicker').textContent = ch.tag + ' · Misión completada';
    el.querySelector('.r-title').textContent = ch.endTitle;
    el.querySelector('.r-total').innerHTML = `${res.total}<small>pts</small>`;
    el.querySelector('.r-meta').innerHTML = `${escapeHtml(r.name)}${r.code ? ` · <code>${r.code}</code>` : ''} · Tiempo ${fmtTime(res.time)}${pos ? ` · Puesto #${pos} en este computador` : ' · Modo presentador'}`;
    el.querySelector('.r-break').innerHTML =
      r.scores
        .map((s, i) => `<tr><td>Etapa ${i + 1} · ${s.title}</td><td>${s.errors ? `${s.errors} error${s.errors > 1 ? 'es' : ''}` : 'sin errores'}</td><td><b>${s.pts}</b>/${s.max}</td></tr>`)
        .join('') +
      `<tr class="bonus"><td>Bonus tiempo (bajo 12:00)</td><td></td><td><b>+${res.bonusTime}</b></td></tr>` +
      `<tr class="bonus"><td>Bonus misión sin errores</td><td></td><td><b>+${res.bonusClean}</b></td></tr>` +
      `<tr class="bonus brand"><td>Fichas INACAP (${r.fichas.length}/${G.fichaTotal || 0})</td><td></td><td><b>+${res.bonusFichas}</b></td></tr>`;
    el.querySelector('.r-learn').innerHTML = `<h4>Lo que acabas de practicar</h4><ul>${ch.learn.map((l) => `<li>${l}</li>`).join('')}</ul><p class="r-career">${ch.career}</p>` +
      (r.fichas.length ? `<h4 style="margin-top:14px">Tus Fichas INACAP</h4><ul class="r-fichas">${r.fichas.map((f) => `<li>“${escapeHtml(f)}”</li>`).join('')}</ul>` : `<p class="dim" style="margin-top:12px">Tip: hay ${G.fichaTotal || 3} Fichas INACAP escondidas en el nivel (+${(window.CONFIG && window.CONFIG.puntosPorFicha) || 2} pts c/u).</p>`);
    el.querySelector('.r-rank').innerHTML =
      `<h4>Ranking · este computador</h4><ol>` +
      rank
        .slice(0, 6)
        .map((e) => `<li class="${e === entry ? 'me' : ''}"><span>${escapeHtml(e.name)}</span><b>${e.total}</b><i>${fmtTime(e.time)}</i></li>`)
        .join('') +
      `</ol>${rank.length ? '' : '<p class="dim">Aún no hay registros.</p>'}`;
    const other = r.id === 'enfermeria' ? 'diseno' : 'enfermeria';
    const ob = el.querySelector('.r-other');
    ob.textContent = 'Probar ' + G.challenges[other].short;
    ob.onclick = () => G.startChallenge(other, r.name);
    el.querySelector('.r-again').onclick = () => G.startChallenge(r.id, r.name);
    el.querySelector('.r-menu').onclick = () => G.toMenu();
    el.classList.add('show');
    G.confettiDom();
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  G.escapeHtml = escapeHtml;
  G.confettiDom = function () {
    const box = $('confetti');
    box.innerHTML = '';
    const cols = ['#ff2bd6', '#22e4ff', '#ffd23f', '#3ddc84', '#ff6b35', '#8b5cf6'];
    for (let i = 0; i < 70; i++) {
      const d = document.createElement('i');
      d.style.left = Math.random() * 100 + '%';
      d.style.background = cols[i % cols.length];
      d.style.animationDelay = Math.random() * 1.2 + 's';
      d.style.animationDuration = 2.2 + Math.random() * 1.8 + 's';
      box.appendChild(d);
    }
    setTimeout(() => (box.innerHTML = ''), 4800);
  };

  G.toMenu = function () {
    G.state = 'menu';
    G.run = null;
    G.closeModalSilently();
    if (isLocked()) document.exitPointerLock();
    $('hud').classList.remove('show');
    $('results').classList.remove('show');
    $('pause').classList.remove('show');
    document.body.dataset.theme = '';
    G.buildMenuScene();
    $('menu').classList.add('show');
  };

  /* --------------------------------------------------------------- loop */
  const clock = new THREE.Clock();
  G.time = 0;
  let menuAngle = 0;
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    G.time += dt;
    if (!G.scene) return;
    if (G.state === 'play') {
      if (!G.modalOpen) updatePlayer(dt);
      else {
        camera.position.set(P.pos.x, P.pos.y + P.eye, P.pos.z);
        camera.rotation.set(P.pitch, P.yaw, 0);
      }
      const r = G.run;
      if (r && !r.done && !r.paused) $('timer').textContent = fmtTime(now() - r.t0);
      if (r && !r.done && !G.modalOpen) updateHover();
      else promptEl.classList.remove('show');
    } else if (G.state === 'menu' || G.state === 'welcome') {
      menuAngle += dt * 0.08;
      const c = G.menuCenter || new V3();
      camera.position.set(c.x + Math.sin(menuAngle) * 30, 15, c.z + Math.cos(menuAngle) * 30);
      camera.lookAt(c.x, 3, c.z);
    }
    G.tickers = G.tickers.filter((fn) => fn(dt, G.time) !== false);
    if (G.world.dirty) G.world.rebuild();
    renderer.render(G.scene, camera);
  }
  G.startLoop = () => loop();
})();
