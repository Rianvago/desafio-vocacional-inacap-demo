/* =========================================================================
   Desafío DISEÑO E INDUSTRIA DIGITAL · ESTUDIO GLITCH
   Etapas: 1 Color · 2 Web · 3 Animación · 4 Mundo jugable
   ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const V3 = THREE.Vector3;

  G.defineBlock('d_floor', { color: '#272040', pattern: 'grid', accent: '#3a3164', noise: 0.04 });
  G.defineBlock('d_glitch', { color: '#888888', pattern: 'glitch' });
  G.defineBlock('d_wall', { color: '#2a2048', noise: 0.05 });
  G.defineBlock('d_band', { color: '#2a2048', pattern: 'stripe', accent: '#ff2bd6', noise: 0.05 });
  G.defineBlock('d_ceil', { color: '#17122b', pattern: 'panel', noise: 0.04 });
  G.defineBlock('d_lamp', { color: '#f3eeff', pattern: 'lamp', emissive: true });
  G.defineBlock('d_neon', { color: '#22e4ff', pattern: 'lamp', emissive: true });
  G.defineBlock('d_door', { color: '#8b5cf6', pattern: 'panel' });
  G.defineBlock('d_build', { color: '#ff9f1c', pattern: 'brick' });
  G.defineBlock('d_void', { color: '#0b0820', pattern: 'grid', accent: '#22e4ff', emissive: true, noise: 0.02 });
  G.defineBlock('d_plat', { color: '#3a3060', pattern: 'tile', noise: 0.05 });

  const C = { mag: '#ff2bd6', cyan: '#22e4ff', yel: '#ffd23f', vio: '#8b5cf6', dark: '#140f26' };

  /* ---------- helpers ---------- */
  function hitbox(w, h, d, y) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.y = y;
    return m;
  }
  function bob(obj, base, amp = 0.08, sp = 2.2) {
    const ph = Math.random() * 6;
    G.tick((dt, t) => {
      if (!obj.parent) return false;
      obj.position.y = base + Math.sin(t * sp + ph) * amp;
    });
  }
  function spin(obj, sp = 0.8) {
    G.tick((dt) => {
      if (!obj.parent) return false;
      obj.rotation.y += dt * sp;
    });
  }
  function pedestal(x, z, top = C.cyan) {
    const g = new THREE.Group();
    g.position.set(x, 1, z);
    G.box(0.9, 0.9, 0.9, '#3a3060', 0, 0.45, 0, g);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 0.94), new THREE.MeshBasicMaterial({ color: top }));
    t.position.y = 0.92;
    g.add(t);
    g.userData.top = t;
    G.scene.add(g);
    G.collider(x - 0.45, 1, z - 0.45, x + 0.45, 1.95, z + 0.45);
    return g;
  }
  function lever(x, z, color) {
    const g = new THREE.Group();
    g.position.set(x, 1, z);
    G.box(0.5, 0.9, 0.5, '#3a3060', 0, 0.45, 0, g);
    const pv = new THREE.Group();
    pv.position.set(0, 0.92, 0);
    g.add(pv);
    G.box(0.08, 0.5, 0.08, '#d9d4ee', 0, 0.25, 0, pv);
    G.box(0.2, 0.2, 0.2, color, 0, 0.52, 0, pv);
    pv.rotation.x = 0.6;
    g.add(hitbox(0.7, 1.6, 0.7, 0.8));
    g.userData.pv = pv;
    G.scene.add(g);
    G.collider(x - 0.27, 1, z - 0.27, x + 0.27, 2, z + 0.27);
    return g;
  }
  function pull(l) {
    const pv = l.userData.pv;
    let t = 0;
    G.tick((dt) => {
      t += dt * 5;
      pv.rotation.x = 0.6 - Math.min(1, t) * 1.2;
      if (t > 1) return false;
    });
    setTimeout(() => (pv.rotation.x = 0.6), 1400);
  }
  function canvasPlane(w, h, px, draw) {
    const { canvas, tex } = G.textCanvas(Math.round(w * px), Math.round(h * px), () => {});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.userData.redraw = (...a) => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(ctx, canvas.width, canvas.height, ...a);
      tex.needsUpdate = true;
    };
    return m;
  }

  /* ---------- datos ---------- */
  const PALETTES = [
    { name: 'Atardecer eléctrico', cols: ['#ff4d6d', '#ffb703', '#7209b7'], ok: true },
    { name: 'Oficina', cols: ['#8d8d8d', '#c8b99a', '#6b4f3a'], why: 'Transmite sobriedad y seriedad, no energía.' },
    { name: 'Spa', cols: ['#a8dadc', '#cdeccf', '#d8c8f0'], why: 'Los tonos pastel transmiten calma: sirven para bienestar, no para un festival energético.' },
  ];
  const TEXTS = [
    { name: 'Texto amarillo', col: '#ffd23f', ok: true },
    { name: 'Texto violeta', col: '#5a2bbf', why: 'Casi no se lee: tiene muy poco contraste con el fondo.' },
    { name: 'Texto gris', col: '#6f6a85', why: 'Poco contraste: muchas personas no podrían leerlo.' },
  ];
  const MODULES = [
    { id: 'header', icon: '🧭', name: 'Menú de navegación', hint: 'El menú va arriba de todo: es lo primero que ves para orientarte.' },
    { id: 'hero', icon: '🖼️', name: 'Banner principal', hint: 'El banner presenta la idea principal y va justo bajo el menú.' },
    { id: 'cta', icon: '👉', name: 'Botón «Inscríbete»', hint: 'El botón de acción va después del banner que convence, y antes del cierre.' },
    { id: 'footer', icon: '📎', name: 'Pie de página', hint: 'El pie de página cierra la web: va al final.' },
  ];
  const POSES = [
    { id: 'crouch', name: 'Agacharse', sub: 'anticipación', hint: 'Antes de saltar, el personaje se prepara agachándose: eso se llama anticipación.' },
    { id: 'push', name: 'Impulso', sub: 'despegue', hint: 'El impulso viene justo después de agacharse: estira el cuerpo para despegar.' },
    { id: 'air', name: 'En el aire', sub: 'punto más alto', hint: 'En el aire va después del impulso y antes de caer.' },
    { id: 'land', name: 'Aterrizaje', sub: 'amortiguar', hint: 'El aterrizaje es lo último: el cuerpo amortigua la caída.' },
  ];
  const MATERIALS = [
    { icon: '🟧', name: 'Bloque sólido', ok: true },
    { icon: '🫥', name: 'Vidrio invisible', why: 'Los jugadores no verían el camino: un buen nivel se entiende a simple vista.' },
    { icon: '🌋', name: 'Lava decorativa', why: '¡Dañaría a quien juegue! Un obstáculo debe ser justo y claro.' },
  ];

  /* ---------- dibujos ---------- */
  function drawPoster(ctx, w, h, st) {
    if (!st.palette) {
      for (let y = 0; y < h; y += 6)
        for (let x = 0; x < w; x += 6) {
          const v = 70 + Math.random() * 90;
          ctx.fillStyle = `rgb(${v},${v},${v + 8})`;
          ctx.fillRect(x, y, 6, 6);
        }
      ctx.fillStyle = 'rgba(20,15,38,.75)';
      ctx.fillRect(0, h * 0.36, w, h * 0.28);
      ctx.fillStyle = '#cfcfe0';
      ctx.font = `800 ${h * 0.09}px ${G.FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('ERROR · COLOR NO ENCONTRADO', w / 2, h * 0.48);
      ctx.font = `600 ${h * 0.055}px ${G.FONT}`;
      ctx.fillText('Elige una paleta para restaurar el afiche', w / 2, h * 0.58);
      return;
    }
    const [a, b, c] = st.palette;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c);
    g.addColorStop(1, '#2b0a5a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.72, h * 0.62, 10, w * 0.72, h * 0.62, h * 0.42);
    sun.addColorStop(0, b);
    sun.addColorStop(1, a);
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.62, h * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) ctx.fillRect(w * 0.5, h * 0.6 + i * h * 0.07, w * 0.5, h * 0.025);
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.25, h * 0.72);
    ctx.lineTo(w * 0.45, h * 0.88);
    ctx.lineTo(w * 0.62, h * 0.76);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.textAlign = 'left';
    if (st.text) {
      ctx.fillStyle = st.text;
      ctx.font = `900 ${h * 0.15}px ${G.FONT}`;
      ctx.fillText('FESTIVAL', w * 0.06, h * 0.24);
      ctx.fillText('DE VERANO', w * 0.06, h * 0.4);
      ctx.font = `700 ${h * 0.065}px ${G.FONT}`;
      ctx.fillText('Música · Arte · Juegos', w * 0.065, h * 0.52);
    } else {
      ctx.setLineDash([16, 12]);
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 5;
      ctx.strokeRect(w * 0.05, h * 0.08, w * 0.5, h * 0.36);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = `700 ${h * 0.06}px ${G.FONT}`;
      ctx.fillText('TÍTULO: elige su color', w * 0.08, h * 0.28);
    }
  }
  function drawModule(ctx, w, h, id, idx) {
    if (!id) {
      ctx.fillStyle = 'rgba(34,228,255,.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.setLineDash([14, 10]);
      ctx.strokeStyle = '#22e4ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.setLineDash([]);
      ctx.fillStyle = '#7ff0ff';
      ctx.font = `700 ${h * 0.32}px ${G.FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`ESPACIO ${idx + 1} · coloca un bloque aquí`, w / 2, h / 2);
      return;
    }
    ctx.textBaseline = 'middle';
    if (id === 'header') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.mag;
      ctx.fillRect(h * 0.25, h * 0.25, h * 0.5, h * 0.5);
      ctx.fillStyle = '#1d1830';
      ctx.font = `900 ${h * 0.36}px ${G.FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('EXPO', h * 0.95, h / 2);
      ctx.font = `600 ${h * 0.26}px ${G.FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText('Inicio    Carreras    Galería    Contacto', w - h * 0.3, h / 2);
    } else if (id === 'hero') {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#7209b7');
      g.addColorStop(1, '#ff4d6d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(w * 0.82, h * 0.55, h * 0.3, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${h * 0.4}px ${G.FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('EXPO DISEÑO 2026', h * 0.3, h * 0.45);
      ctx.font = `600 ${h * 0.2}px ${G.FONT}`;
      ctx.fillText('Animación · Web · Videojuegos · Identidad', h * 0.32, h * 0.8);
    } else if (id === 'cta') {
      ctx.fillStyle = '#f3f0ff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.mag;
      G.roundRect(ctx, w / 2 - w * 0.17, h * 0.18, w * 0.34, h * 0.64, h * 0.32);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${h * 0.32}px ${G.FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('INSCRÍBETE', w / 2, h / 2);
    } else if (id === 'footer') {
      ctx.fillStyle = '#1d1830';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#a49dc4';
      ctx.font = `600 ${h * 0.24}px ${G.FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('© Estudio Digital  ·  Instagram  ·  TikTok  ·  Contacto', w / 2, h / 2);
    }
  }
  function drawBrowser(ctx, w, h, done) {
    ctx.fillStyle = '#0d0a1c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2d2550';
    ctx.fillRect(0, 0, w, h * 0.09);
    ['#ff5f57', '#ffbd2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(h * 0.04 + i * h * 0.045, h * 0.045, h * 0.015, 0, 7);
      ctx.fill();
    });
    ctx.fillStyle = '#17122b';
    G.roundRect(ctx, w * 0.22, h * 0.02, w * 0.56, h * 0.05, h * 0.02);
    ctx.fill();
    ctx.fillStyle = done ? '#3ddc84' : '#a49dc4';
    ctx.font = `600 ${h * 0.03}px ${G.FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(done ? '🔒 expo-diseno.cl · ¡PUBLICADA!' : 'expo-diseno.cl · sin publicar', w / 2, h * 0.045);
    ctx.strokeStyle = done ? '#3ddc84' : C.vio;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
  }
  function drawPose(ctx, w, h, pose) {
    ctx.fillStyle = '#fff8e8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1d1830';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    // perforaciones de cinta
    ctx.fillStyle = '#1d1830';
    for (let y = 22; y < h - 60; y += 34) {
      ctx.fillRect(14, y, 12, 16);
      ctx.fillRect(w - 26, y, 12, 16);
    }
    const gy = h * 0.74;
    ctx.fillStyle = '#c9c1e8';
    ctx.fillRect(34, gy, w - 68, 6);
    const cx = w / 2,
      u = 14;
    const fig = { crouch: { y: 0, body: 3.2, legs: 1.6, arms: 'back', bend: true }, push: { y: -0.6, body: 4.4, legs: 3.6, arms: 'up' }, air: { y: -5.2, body: 4, legs: 2, arms: 'out', tuck: true }, land: { y: 0, body: 3, legs: 1.4, arms: 'out', bend: true } }[pose];
    const footY = gy + fig.y * u;
    const legH = fig.legs * u,
      bodyH = fig.body * u;
    ctx.fillStyle = '#2d3142';
    if (fig.tuck) {
      ctx.fillRect(cx - 2.2 * u, footY - legH, 1.6 * u, legH * 0.7);
      ctx.fillRect(cx + 0.6 * u, footY - legH, 1.6 * u, legH * 0.7);
    } else if (fig.bend) {
      ctx.fillRect(cx - 2.4 * u, footY - legH, 1.6 * u, legH);
      ctx.fillRect(cx + 0.8 * u, footY - legH, 1.6 * u, legH);
    } else {
      ctx.fillRect(cx - 1.6 * u, footY - legH, 1.4 * u, legH);
      ctx.fillRect(cx + 0.2 * u, footY - legH, 1.4 * u, legH);
    }
    const bodyTop = footY - legH - bodyH;
    ctx.fillStyle = C.mag;
    ctx.fillRect(cx - 1.8 * u, bodyTop, 3.6 * u, bodyH);
    ctx.fillStyle = '#e0ac8a';
    ctx.fillRect(cx - 1.5 * u, bodyTop - 3 * u, 3 * u, 3 * u);
    ctx.fillStyle = '#3b2618';
    ctx.fillRect(cx - 1.5 * u, bodyTop - 3 * u, 3 * u, 0.8 * u);
    ctx.fillStyle = '#e0ac8a';
    if (fig.arms === 'up') {
      ctx.fillRect(cx - 2.8 * u, bodyTop - 3.4 * u, 1 * u, 3.6 * u);
      ctx.fillRect(cx + 1.8 * u, bodyTop - 3.4 * u, 1 * u, 3.6 * u);
    } else if (fig.arms === 'back') {
      ctx.save();
      ctx.translate(cx - 1.8 * u, bodyTop + 0.3 * u);
      ctx.rotate(0.7);
      ctx.fillRect(-1 * u, 0, 1 * u, 3.2 * u);
      ctx.restore();
      ctx.save();
      ctx.translate(cx + 1.8 * u, bodyTop + 0.3 * u);
      ctx.rotate(-0.7);
      ctx.fillRect(0, 0, 1 * u, 3.2 * u);
      ctx.restore();
    } else {
      ctx.fillRect(cx - 4.6 * u, bodyTop + 0.3 * u, 2.8 * u, 1 * u);
      ctx.fillRect(cx + 1.8 * u, bodyTop + 0.3 * u, 2.8 * u, 1 * u);
    }
    if (pose === 'air') {
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 2 * u + i * 2 * u, footY + 1.6 * u);
        ctx.lineTo(cx - 2 * u + i * 2 * u, footY + 3.4 * u);
        ctx.stroke();
      }
    }
    if (pose === 'land' || pose === 'crouch') {
      ctx.fillStyle = 'rgba(29,24,48,.18)';
      ctx.fillRect(cx - 3.4 * u, gy - 4, 6.8 * u, 4);
    }
  }

  G.challenges.diseno = {
    id: 'diseno',
    tag: 'DISEÑO E INDUSTRIA DIGITAL',
    short: 'Diseño',
    title: 'Estudio Glitch',
    endTitle: '¡Expo abierta!',
    endDelay: 3600,
    learn: ['Teoría del color: el color comunica emociones.', 'Contraste y legibilidad: diseñar para que todos lean.', 'Diseño web: jerarquía y llamado a la acción.', 'Animación: anticipación y fotogramas clave.', 'Diseño de niveles: construir, probar e iterar.'],
    career: 'Así se trabaja en Diseño e Industria Digital: se comunica con imagen, se diseñan experiencias y se construyen mundos interactivos.',
    build() {
      G.newScene({ sky: '#0b0820', fog: '#0b0820', fogNear: 16, fogFar: 46, hemi: 1.05, sun: 0.45, ground: 0x4a3f7a });
      const w = G.world,
        sc = G.scene;
      const R = { h: 5, floor: 'd_floor', wall: 'd_wall', band: 'd_band', ceil: 'd_ceil', lamp: 'd_lamp' };
      w.room(0, 0, 14, 12, Object.assign({}, R, { h: 6, wall: 'd_glitch', band: 'd_glitch' })); // 1 color
      w.room(-2, -16, 16, 0, Object.assign({}, R, { h: 6 })); // 2 web
      w.room(-2, -32, 16, -16, Object.assign({}, R, { h: 6 })); // 3 animación
      w.room(-2, -52, 16, -32, Object.assign({}, R, { h: 6 })); // 4 mundos
      // neones
      w.fill(-2, 6, -16, 16, 6, -16, 'd_neon');
      w.fill(-2, 6, -32, 16, 6, -32, 'd_neon');
      G.BLOCKS.d_lamp.mat.color.set('#ffffff');
      const door1 = G.doorCells(11, 1, 0, 12, 3, 0);
      const door2 = G.doorCells(13, 1, -16, 14, 3, -16);
      const door3 = G.doorCells(13, 1, -32, 14, 3, -32);
      [...door1, ...door2, ...door3].forEach(([x, y, z]) => w.set(x, y, z, 'd_door'));
      // foso de la sala 4
      w.carve(-1, 0, -43, 15, 0, -39);
      w.fill(-1, -3, -43, 15, -3, -39, 'd_void');
      w.fill(-1, -2, -44, 15, -1, -44, 'd_wall');
      w.fill(-1, -2, -38, 15, -1, -38, 'd_wall');
      w.fill(-2, -3, -44, -2, 0, -38, 'd_wall');
      w.fill(16, -3, -44, 16, 0, -38, 'd_wall');
      w.fill(-1, 0, -37, 15, 0, -33, 'd_plat');
      w.fill(-1, 0, -51, 15, 0, -45, 'd_plat');
      w.fill(-1, 0, -38, 15, 0, -38, 'd_plat');
      w.fill(-1, 0, -44, 15, 0, -44, 'd_plat');

      /* ===== ETAPA 1 · COLOR ===== */
      const st1 = { palette: null, text: null };
      const poster = canvasPlane(7, 3.6, 110, drawPoster);
      poster.position.set(5.5, 4.85, 1.02);
      sc.add(poster);
      poster.userData.redraw(st1);
      let glitchT = 0;
      G.tick((dt) => {
        if (!poster.parent || st1.palette) return false;
        glitchT += dt;
        if (glitchT > 0.18) {
          glitchT = 0;
          poster.userData.redraw(st1);
        }
      });
      const brief = G.sign('BRIEF DEL CLIENTE\nAfiche para un festival de verano\nDebe transmitir ENERGÍA y ALEGRÍA', { w: 4.2, h: 1.7, bg: C.dark, fg: '#ffffff', borderColor: C.mag });
      brief.position.set(13.98, 3.6, 6);
      brief.rotation.y = -Math.PI / 2;
      sc.add(brief);
      const s1 = G.sign('ETAPA 1 · COLOR E IDENTIDAD', { w: 4, h: 0.55, bg: C.dark, fg: C.cyan, borderColor: C.cyan });
      s1.position.set(7, 5.4, 11.98);
      s1.rotation.y = Math.PI;
      sc.add(s1);
      let palDone = false;
      const palPeds = [];
      G.shuffle(PALETTES).forEach((p, i) => {
        const x = [3.5, 7, 10.5][i],
          z = 7.5;
        const ped = pedestal(x, z, '#d9d4ee');
        const holder = new THREE.Group();
        holder.position.y = 1.3;
        p.cols.forEach((c, k) => G.box(0.32, 0.32, 0.32, c, (k - 1) * 0.36, 0, 0, holder));
        ped.add(holder);
        spin(holder, 0.7);
        bob(holder, 1.3, 0.05);
        const l = G.label(p.name, { scale: 1.9 });
        l.position.y = 1.85;
        ped.add(l);
        ped.add(hitbox(1, 1.9, 1, 0.95));
        palPeds.push(ped);
        G.interact(ped, {
          label: `Elegir paleta «${p.name}»`,
          onUse() {
            if (palDone) return;
            if (p.ok) {
              palDone = true;
              st1.palette = p.cols;
              poster.userData.redraw(st1);
              G.sfx.pick();
              G.burst(new V3(5.5, 4.8, 1.6), p.cols.concat(['#ffffff']), 40, 4);
              w.replace(0, 2, 0, 14, 6, 12, 'd_glitch', 'd_wall');
              w.replace(0, 1, 0, 14, 1, 12, 'd_glitch', 'd_band');
              palPeds.forEach((pp) => G.unInteract(pp));
              ped.userData.top.material.color.set('#3ddc84');
              G.toast('🎨 ¡Esa paleta transmite energía! Ahora elige el color del título.', 'good');
              G.setObjective('Elige el color del <b>título</b> del afiche', 'Debe leerse bien sobre el fondo: piensa en el contraste.');
              showBuckets();
            } else G.mistake(`🎨 <b>${p.name}</b>: ${p.why}`);
          },
        });
      });
      const buckets = [];
      function showBuckets() {
        G.shuffle(TEXTS).forEach((t, i) => {
          const x = [3.5, 7, 10.5][i],
            z = 4.2;
          const g = new THREE.Group();
          g.position.set(x, 1, z);
          G.box(0.6, 0.6, 0.6, '#d9d4ee', 0, 0.3, 0, g);
          G.box(0.5, 0.06, 0.5, t.col, 0, 0.62, 0, g);
          G.box(0.08, 0.35, 0.08, '#d9d4ee', 0.26, 0.82, 0, g);
          const big = G.box(0.4, 0.4, 0.4, t.col, 0, 1.4, 0, g);
          spin(big, 1.1);
          const l = G.label(t.name, { scale: 1.6 });
          l.position.y = 2.0;
          g.add(l);
          g.add(hitbox(0.8, 1.8, 0.8, 0.9));
          sc.add(g);
          buckets.push(g);
          G.burst(new V3(x, 1.6, z), [t.col, '#ffffff'], 12, 2);
          G.interact(g, {
            label: `Pintar el título: ${t.name}`,
            onUse() {
              st1.text = t.col;
              poster.userData.redraw(st1);
              if (t.ok) {
                buckets.forEach((b) => G.unInteract(b));
                G.sfx.pick();
                G.toast('✨ ¡Se lee perfecto! Buen contraste = diseño accesible.', 'good');
                G.openCells(door1, C.vio);
                G.stageDone();
              } else {
                G.mistake(`🔤 <b>${t.name}</b>: ${t.why}`);
                G.unInteract(g);
                g.visible = false;
              }
            },
          });
        });
      }

      /* ===== ETAPA 2 · WEB ===== */
      const browser = canvasPlane(6.6, 5.6, 90, drawBrowser);
      browser.position.set(6.5, 3.95, -14.97);
      sc.add(browser);
      browser.userData.redraw(false);
      const s2 = G.sign('ETAPA 2 · ARMA LA WEB', { w: 3.6, h: 0.55, bg: C.dark, fg: C.cyan, borderColor: C.cyan });
      s2.position.set(6.5, 6.4, -0.02);
      s2.rotation.y = Math.PI;
      sc.add(s2);
      let carry = null,
        placed = 0;
      const slots = [];
      [5.65, 4.45, 3.25, 2.05].forEach((y, i) => {
        const sl = canvasPlane(6.0, 1.05, 100, drawModule);
        sl.position.set(6.5, y, -14.93);
        sl.userData.redraw(null, i);
        sc.add(sl);
        const cfg = G.interact(sl, {
          label: `Colocar en el espacio ${i + 1}`,
          onUse() {
            if (!carry) return G.toast('Primero toma un bloque de la web (están repartidos por la sala).');
            const m = carry;
            if (MODULES.indexOf(m) === i) {
              carry = null;
              G.removeItem('mod_' + m.id);
              sl.userData.redraw(m.id, i);
              cfg.enabled = false;
              cfg.disabledLabel = `✔ ${m.name}`;
              placed++;
              G.sfx.pick();
              G.burst(new V3(6.5, sl.position.y, -14.5), [C.cyan, C.mag, '#ffffff'], 16, 2);
              G.setObjective(`Arma la página de la Expo <b>(${placed}/4)</b>`, 'Toma un bloque y colócalo en el espacio que le corresponde.');
              if (placed === 4) {
                browser.userData.redraw(true);
                G.toast('🌐 ¡Web publicada! Orden claro = mejor experiencia de usuario (UX).', 'good');
                G.openCells(door2, C.vio);
                G.stageDone();
              }
            } else G.mistake(`${m.icon} <b>${m.name}</b> no va en el espacio ${i + 1}. <b>Pista:</b> ${m.hint}`);
          },
        });
        slots.push(sl);
      });
      const crateSpots = G.shuffle([[1, -4], [12.5, -5], [1.5, -11], [12, -11.5]]);
      MODULES.forEach((m, i) => {
        const [x, z] = crateSpots[i];
        const g = new THREE.Group();
        g.position.set(x, 1, z);
        const face = canvasPlane(0.9, 0.9, 120, (ctx, cw, ch) => {
          ctx.fillStyle = '#1d1830';
          ctx.fillRect(0, 0, cw, ch);
          ctx.strokeStyle = C.cyan;
          ctx.lineWidth = 8;
          ctx.strokeRect(4, 4, cw - 8, ch - 8);
          ctx.font = `${ch * 0.5}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(m.icon, cw / 2, ch / 2 + 4);
        });
        face.userData.redraw();
        const cube = G.box(0.85, 0.85, 0.85, '#2d2550', 0, 0.75, 0, g);
        [0, 1, 2, 3].forEach((k) => {
          const f = face.clone();
          f.position.set(Math.sin((k * Math.PI) / 2) * 0.43, 0, Math.cos((k * Math.PI) / 2) * 0.43);
          f.rotation.y = (k * Math.PI) / 2;
          cube.add(f);
        });
        spin(cube, 0.6);
        bob(cube, 0.75, 0.07);
        const l = G.label(m.name, { scale: 2 });
        l.position.y = 1.65;
        g.add(l);
        g.add(hitbox(1, 1.5, 1, 0.75));
        sc.add(g);
        G.interact(g, {
          label: `Tomar bloque: ${m.name}`,
          onUse() {
            if (carry) return G.toast(`Ya llevas <b>${carry.name}</b>. Colócalo primero en la pantalla.`);
            carry = m;
            G.unInteract(g);
            sc.remove(g);
            G.sfx.pick();
            G.addItem({ id: 'mod_' + m.id, icon: m.icon, name: m.name });
            G.toast(`Llevas: ${m.icon} <b>${m.name}</b>. Ahora apunta al espacio correcto de la pantalla.`);
          },
        });
      });

      /* ===== ETAPA 3 · ANIMACIÓN ===== */
      const s3 = G.sign('ETAPA 3 · ANIMA AL PERSONAJE', { w: 4.2, h: 0.55, bg: C.dark, fg: C.cyan, borderColor: C.cyan });
      s3.position.set(6.5, 6.4, -16.02);
      s3.rotation.y = Math.PI;
      sc.add(s3);
      const tl = G.sign('LÍNEA DE TIEMPO  ▶  1 · 2 · 3 · 4', { w: 6, h: 0.6, bg: C.dark, fg: C.yel, borderColor: C.yel });
      tl.position.set(7.75, 5, -30.98);
      sc.add(tl);
      let carryF = null,
        framesPlaced = 0,
        animReady = false,
        animDone = false;
      const frameX = [4, 6.5, 9, 11.5];
      frameX.forEach((x, i) => {
        const z = -29.6;
        const ped = pedestal(x, z, C.yel);
        const n = G.label(String(i + 1), { scale: 1.2, bg: 'rgba(255,210,63,.95)', fg: '#1d1830' });
        n.position.y = 1.25;
        ped.add(n);
        const holder = canvasPlane(1.5, 1.88, 140, (ctx, cw, ch, pose) => {
          if (!pose) {
            ctx.fillStyle = 'rgba(255,210,63,.1)';
            ctx.fillRect(0, 0, cw, ch);
            ctx.setLineDash([12, 10]);
            ctx.strokeStyle = C.yel;
            ctx.lineWidth = 6;
            ctx.strokeRect(4, 4, cw - 8, ch - 8);
            ctx.setLineDash([]);
            ctx.fillStyle = C.yel;
            ctx.font = `800 ${ch * 0.09}px ${G.FONT}`;
            ctx.textAlign = 'center';
            ctx.fillText(`FOTOGRAMA ${i + 1}`, cw / 2, ch / 2);
          } else drawPose(ctx, cw, ch, pose);
        });
        holder.position.set(0, 2.45, 0);
        holder.userData.redraw(null);
        ped.add(holder);
        ped.add(hitbox(1.5, 3.2, 1, 1.6));
        const cfg = G.interact(ped, {
          label: `Poner en el fotograma ${i + 1}`,
          onUse() {
            if (!carryF) return G.toast('Primero toma una lámina de fotograma (están en la sala).');
            const p = carryF;
            if (POSES.indexOf(p) === i) {
              carryF = null;
              G.removeItem('pose_' + p.id);
              holder.userData.redraw(p.id);
              cfg.enabled = false;
              cfg.disabledLabel = `✔ ${p.name}`;
              ped.userData.top.material.color.set('#3ddc84');
              framesPlaced++;
              G.sfx.pick();
              G.setObjective(`Ordena los fotogramas del salto <b>(${framesPlaced}/4)</b>`, 'Toma una lámina y ponla en su lugar de la línea de tiempo.');
              if (framesPlaced === 4) {
                animReady = true;
                playCfg.enabled = true;
                G.toast('🎞️ ¡Línea de tiempo lista! Activa la palanca ▶ REPRODUCIR.', 'good');
                G.setObjective('Activa la palanca <b>▶ REPRODUCIR</b> y mira tu animación', 'Está junto al escenario del personaje.');
              }
            } else G.mistake(`🎞️ <b>${p.name}</b> no va en el fotograma ${i + 1}. <b>Pista:</b> ${p.hint}`);
          },
        });
      });
      const cardSpots = G.shuffle([[0.5, -19.5], [13.5, -20.5], [0.5, -26], [13.5, -26.5]]);
      POSES.forEach((p, i) => {
        const [x, z] = cardSpots[i];
        const g = new THREE.Group();
        g.position.set(x, 1, z);
        g.rotation.y = x < 7 ? Math.PI / 2 : -Math.PI / 2;
        G.box(0.08, 1.1, 0.08, '#8b6b4a', -0.45, 0.55, -0.1, g);
        G.box(0.08, 1.1, 0.08, '#8b6b4a', 0.45, 0.55, -0.1, g);
        const card = canvasPlane(1.1, 1.38, 150, (ctx, cw, ch) => drawPose(ctx, cw, ch, p.id));
        card.userData.redraw();
        card.position.set(0, 1.55, 0);
        g.add(card);
        const back = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.38), G.lam('#2d2550'));
        back.position.set(0, 1.55, -0.01);
        back.rotation.y = Math.PI;
        g.add(back);
        const l = G.label(`${p.name} · ${p.sub}`, { scale: 2.1 });
        l.position.y = 2.55;
        g.add(l);
        g.add(hitbox(1.2, 2.4, 0.5, 1.2));
        sc.add(g);
        G.interact(g, {
          label: `Tomar lámina: ${p.name}`,
          onUse() {
            if (carryF) return G.toast(`Ya llevas la lámina <b>${carryF.name}</b>. Ponla primero en la línea de tiempo.`);
            carryF = p;
            G.unInteract(g);
            sc.remove(g);
            G.sfx.pick();
            G.addItem({ id: 'pose_' + p.id, icon: '🎞️', name: p.name });
            G.toast(`Llevas la lámina 🎞️ <b>${p.name}</b>. ¿En qué fotograma va?`);
          },
        });
      });
      // escenario y personaje
      const stage = G.box(3, 0.3, 3, '#3a3060', 7.5, 1.15, -23.5);
      sc.add(stage);
      G.collider(6, 1, -25, 9, 1.3, -22);
      const ring = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.04, 3.1), new THREE.MeshBasicMaterial({ color: C.mag }));
      ring.position.set(7.5, 1.31, -23.5);
      sc.add(ring);
      const hero = G.person({ skin: '#e0ac8a', shirt: C.mag, pants: '#2d3142', hair: '#3b2618' });
      hero.scale.setScalar(1.5);
      hero.position.set(7.5, 1.3, -23.5);
      hero.rotation.y = Math.PI / 4;
      sc.add(hero);
      const heroL = G.label('Personaje · sin animar', { scale: 2.2 });
      heroL.position.set(7.5, 4.6, -23.5);
      sc.add(heroL);
      const playLv = lever(10, -21.2, '#3ddc84');
      const pl = G.label('▶ REPRODUCIR', { scale: 1.6, bg: 'rgba(61,220,132,.92)', fg: '#0b0820' });
      pl.position.set(10, 2.9, -21.2);
      sc.add(pl);
      const playCfg = G.interact(playLv, {
        label: '▶ Reproducir la animación',
        enabled: false,
        disabledLabel: '▶ Reproducir (completa la línea de tiempo)',
        disabledMsg: 'Primero ordena los 4 fotogramas en la línea de tiempo.',
        onUse() {
          pull(playLv);
          playJump(2);
          if (!animDone) {
            animDone = true;
            setTimeout(() => {
              G.toast('🎬 ¡Se mueve! La anticipación hace que el salto se sienta real.', 'good');
              G.openCells(door3, C.vio);
              G.stageDone();
            }, 2200);
          }
        },
      });
      function poseAt(t) {
        // t en segundos dentro de un ciclo de 1.6 s
        const P = hero.userData.parts;
        let y = 0,
          sy = 1,
          arm = 0,
          leg = 0;
        if (t < 0.4) {
          const k = t / 0.4;
          sy = 1 - 0.18 * k;
          arm = 0.7 * k;
          leg = 0;
        } else if (t < 0.55) {
          const k = (t - 0.4) / 0.15;
          sy = 0.82 + 0.3 * k;
          arm = 0.7 - 3.5 * k;
          y = 0.3 * k;
        } else if (t < 1.15) {
          const k = (t - 0.55) / 0.6;
          y = 0.3 + Math.sin(k * Math.PI) * 2.2 - 0.3 * k;
          sy = 1.05;
          arm = -2.8 + 1.2 * k;
          leg = -0.8 * Math.sin(k * Math.PI);
        } else {
          const k = Math.min(1, (t - 1.15) / 0.45);
          sy = k < 0.4 ? 1 - 0.2 * (k / 0.4) : 0.8 + 0.2 * ((k - 0.4) / 0.6);
          arm = -1.6 + 1.6 * k;
        }
        hero.position.y = 1.3 + y;
        hero.scale.set(1.5, 1.5 * sy, 1.5);
        P.armL.rotation.x = arm;
        P.armR.rotation.x = arm;
        P.legL.rotation.x = leg;
        P.legR.rotation.x = leg;
      }
      function playJump(times) {
        let t = 0;
        heroL.visible = false;
        G.tick((dt) => {
          t += dt;
          if (t >= 1.6 * times) {
            poseAt(1.6);
            return false;
          }
          poseAt(t % 1.6);
        });
      }

      /* ===== ETAPA 4 · MUNDO JUGABLE ===== */
      const s4 = G.sign('ETAPA 4 · CONSTRUYE Y PRUEBA EL NIVEL', { w: 5, h: 0.55, bg: C.dark, fg: C.cyan, borderColor: C.cyan });
      s4.position.set(6.5, 6.4, -32.02);
      s4.rotation.y = Math.PI;
      sc.add(s4);
      const metaS = G.sign('META ★ EXPO', { w: 3, h: 0.8, bg: C.mag, fg: '#ffffff' });
      metaS.position.set(7.5, 4.5, -50.98);
      sc.add(metaS);
      // bandera meta
      const flag = new THREE.Group();
      flag.position.set(7.5, 1, -47);
      G.box(0.1, 2.4, 0.1, '#d9d4ee', 0, 1.2, 0, flag);
      const cloth = G.box(0.9, 0.55, 0.05, C.yel, 0.5, 2.1, 0, flag);
      sc.add(flag);
      G.tick((dt, t) => {
        if (!flag.parent) return false;
        cloth.rotation.y = Math.sin(t * 3) * 0.2;
      });
      let blocksGiven = false,
        built = 0,
        testing = false,
        levelDone = false;
      const gx = 7;
      const ghosts = [];
      for (let z = -39; z >= -43; z--) {
        const gm = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.98, 0.98), new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0.22, depthWrite: false }));
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(gm.geometry), new THREE.LineBasicMaterial({ color: C.cyan }));
        gm.add(edges);
        gm.position.set(gx + 0.5, 0.5, z + 0.5);
        sc.add(gm);
        ghosts.push(gm);
        G.tick((dt, t) => {
          if (!gm.parent) return false;
          gm.material.opacity = 0.16 + 0.12 * Math.abs(Math.sin(t * 2 + z));
        });
        const cfg = G.interact(gm, {
          label: 'Colocar bloque aquí',
          onUse() {
            if (!blocksGiven || !G.hasItem('bloque')) return G.toast('Primero consigue bloques en el <b>DISPENSADOR</b>.');
            G.removeItem('bloque');
            w.set(gx, 0, z, 'd_build');
            G.unInteract(gm);
            sc.remove(gm);
            built++;
            G.sfx.pick();
            G.burst(new V3(gx + 0.5, 1, z + 0.5), ['#ff9f1c', '#ffffff'], 10, 2);
            G.setObjective(`Construye el puente <b>(${built}/5)</b> y luego haz el <b>playtest</b>`, 'Apunta a los bloques fantasma. Cuando esté listo, activa la palanca ▶ PROBAR NIVEL.');
          },
        });
      }
      // dispensador
      const disp = new THREE.Group();
      disp.position.set(3, 1, -35);
      G.box(0.9, 1.4, 0.9, '#2d2550', 0, 0.7, 0, disp);
      const dTop = G.box(0.5, 0.5, 0.5, '#ff9f1c', 0, 1.75, 0, disp);
      spin(dTop, 1.2);
      const dl = G.label('DISPENSADOR DE BLOQUES', { scale: 2.6, bg: 'rgba(255,159,28,.92)', fg: '#0b0820' });
      dl.position.y = 2.5;
      disp.add(dl);
      disp.add(hitbox(1, 2.2, 1, 1.1));
      sc.add(disp);
      G.collider(2.55, 1, -35.45, 3.45, 2.4, -34.55);
      const dispCfg = G.interact(disp, {
        label: 'Elegir material para el puente',
        onUse() {
          G.modal({
            title: '🧱 Dispensador de bloques',
            text: 'Vas a construir el camino que usarán los jugadores. ¿Qué material eliges?',
            layout: 'cards',
            options: G.shuffle(MATERIALS).map((m) => ({
              icon: m.icon,
              label: m.name,
              onPick(btn) {
                if (m.ok) {
                  blocksGiven = true;
                  G.addItem({ id: 'bloque', icon: '🟧', name: 'Bloque sólido', count: 5 });
                  dispCfg.enabled = false;
                  dispCfg.disabledLabel = 'Dispensador · ya tienes tus bloques';
                  G.closeModal();
                  G.sfx.pick();
                  G.toast('🟧 5 bloques sólidos. ¡A construir el puente!', 'good');
                  G.setObjective(`Construye el puente <b>(${built}/5)</b> y luego haz el <b>playtest</b>`, 'Apunta a los bloques fantasma. Cuando esté listo, activa la palanca ▶ PROBAR NIVEL.');
                } else {
                  btn.disabled = true;
                  btn.classList.add('wrong');
                  G.mistake(`${m.icon} <b>${m.name}</b>: ${m.why}`);
                }
              },
            })),
          });
        },
      });
      // tester + palanca de prueba
      const tester = G.person({ skin: '#c98d6b', shirt: C.cyan, pants: '#1d1830', hair: '#1c1c1c', cap: '#ff9f1c' });
      tester.position.set(gx + 0.5, 1, -35.5);
      tester.rotation.y = Math.PI;
      sc.add(tester);
      const tl2 = G.label('TESTER', { scale: 1, bg: 'rgba(34,228,255,.9)', fg: '#0b0820' });
      tl2.position.set(0, 2.3, 0);
      tester.add(tl2);
      const testLv = lever(11, -35.5, '#3ddc84');
      const tll = G.label('▶ PROBAR NIVEL', { scale: 1.7, bg: 'rgba(61,220,132,.92)', fg: '#0b0820' });
      tll.position.set(11, 2.9, -35.5);
      sc.add(tll);
      G.interact(testLv, {
        label: '▶ Probar el nivel (playtest)',
        onUse() {
          if (testing || levelDone) return;
          pull(testLv);
          runTest();
        },
      });
      function runTest() {
        testing = true;
        let z = -35.5,
          y = 1,
          vy = 0,
          falling = false,
          t = 0;
        tester.position.set(gx + 0.5, 1, z);
        G.tick((dt, tt) => {
          t += dt;
          if (!falling) {
            z -= dt * 2.6;
            G.walkAnim(tester, tt * 8, 0.6);
            const cz = Math.floor(z);
            if (!w.isSolid(gx, 0, cz)) falling = true;
            if (z <= -46.6) {
              testing = false;
              levelDone = true;
              G.walkAnim(tester, 0, 0);
              tester.userData.parts.armL.rotation.x = -2.8;
              tester.userData.parts.armR.rotation.x = -2.8;
              win();
              return false;
            }
          } else {
            vy -= 20 * dt;
            y += vy * dt;
            if (y < -1.8) {
              testing = false;
              G.mistake('🐞 <b>¡Bug!</b> El tester se cayó al vacío. Completa el puente antes de probar.');
              setTimeout(() => {
                tester.position.set(gx + 0.5, 1, -35.5);
                G.walkAnim(tester, 0, 0);
              }, 900);
              return false;
            }
          }
          tester.position.set(gx + 0.5, y, z);
        });
      }
      function win() {
        G.BLOCKS.d_lamp.mat.color.set('#ffd6f6');
        w.replace(-2, 1, -52, 16, 6, 12, 'd_wall', 'd_band');
        G.confetti(new V3(7.5, 3, -46));
        G.confetti(new V3(7.5, 3, -40));
        G.banner('Estudio Glitch', '¡NIVEL APROBADO · EXPO ABIERTA!', 3200);
        G.stageDone();
      }
      /* --- marca INACAP: afiches, carteles y fichas --- */
      G.poster('afiche3', 'W', 0, 6, 3.5, 2.2);
      G.wallPlace(G.brandSign('Estudio Digital · Diseño e Industria Digital', 5.2, 0.75), 'S', 12, 7, 4.35);
      G.poster('afiche5', 'W', -2, -8, 3.35, 2.2);
      G.poster('afiche4', 'E', 16, -8, 3.35, 2.2);
      G.poster('afiche4', 'W', -2, -23, 3.35, 2.2);
      G.poster('afiche3', 'E', 16, -23.5, 3.35, 2.2);
      G.poster('afiche5', 'W', -2, -36, 3.35, 2.2);
      G.wallPlace(G.brandSign('Expo Diseño', 3, 0.6), 'N', -52, 12.5, 3.2);
      G.placeFichas('diseno', [[2, 1.6, 10.5], [-0.5, 1.6, -14], [-0.5, 1.6, -30.5]]);

      G.checkpoint = { x: 7.5, y: 1, z: -35.8 };
      G.voidY = -1;
      G.onFall = () => G.toast('Caíste al vacío 😅 Por eso los niveles se construyen… ¡y se prueban!', 'info');

      return {
        spawn: { x: 7.5, y: 1, z: 10.5, yaw: 0 },
        intro: {
          title: '🎨 Estudio Glitch',
          text: '<p>Un <b>glitch</b> borró los colores y archivos del <b>Estudio Digital</b> justo antes de la Expo.</p><p>Eres parte del equipo creativo. Restaura el estudio en 4 desafíos:</p><ol class="steps"><li>Color e identidad: restaura el afiche</li><li>Diseño web: arma la página de la Expo</li><li>Animación: haz saltar al personaje</li><li>Videojuegos: construye y prueba un nivel</li></ol>',
        },
        stages: [
          { title: 'Color e identidad visual', short: 'Color', points: 20, objective: 'Restaura el afiche: elige la <b>paleta</b> que pide el cliente', sub: 'Lee el BRIEF en la pared derecha: energía y alegría.', skip: () => { G.openCells(door1); G.stageDone(20); } },
          { title: 'Arma la web de la Expo', short: 'Web', points: 25, objective: 'Arma la página de la Expo <b>(0/4)</b>', sub: 'Toma un bloque y colócalo en el espacio que le corresponde.', skip: () => { G.openCells(door2); G.stageDone(25); } },
          { title: 'Anima al personaje', short: 'Animación', points: 30, objective: 'Ordena los fotogramas del salto <b>(0/4)</b>', sub: 'Toma una lámina y ponla en su lugar de la línea de tiempo.', skip: () => { G.openCells(door3); G.stageDone(30); } },
          { title: 'Construye y prueba el nivel', short: 'Nivel', points: 25, objective: 'Consigue bloques en el <b>DISPENSADOR</b> y construye el puente', sub: 'El tester debe poder llegar a la META.', skip: () => { if (!levelDone) { levelDone = true; win(); } } },
        ],
      };
    },
  };
})();
