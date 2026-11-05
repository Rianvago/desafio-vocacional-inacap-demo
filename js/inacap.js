/* =========================================================================
   Marca INACAP: afiches, carteles, Fichas INACAP coleccionables y
   simulación de inscripción con QR → código + PIN (solo local, sin servidor).
   ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const A = window.ASSETS || {};
  const C = window.CONFIG || {};
  const RED = '#CC0000',
    GRAY = '#3D3D3D';
  G.BRAND = { RED, GRAY };

  /* ---------------- imágenes precargadas ---------------- */
  G.imgs = {};
  G.loadImages = function () {
    return Promise.all(
      Object.keys(A).map(
        (k) =>
          new Promise((res) => {
            const im = new Image();
            im.onload = im.onerror = () => res();
            im.src = A[k];
            G.imgs[k] = im;
          })
      )
    );
  };
  const texCache = {};
  G.assetTex = function (key) {
    if (texCache[key]) return texCache[key];
    const t = new THREE.Texture(G.imgs[key]);
    t.needsUpdate = true;
    t.anisotropy = 8;
    t.__shared = true;
    texCache[key] = t;
    return t;
  };

  /* ---------------- afiches y carteles 3D ---------------- */
  // side: 'W' muro oeste (mira +x), 'E' muro este, 'N' muro norte (mira +z), 'S' muro sur.
  // wall: coordenada del bloque del muro. along: posición a lo largo del muro.
  G.wallPlace = function (obj, side, wall, along, y) {
    if (side === 'W') obj.position.set(wall + 1.02, y, along), (obj.rotation.y = Math.PI / 2);
    if (side === 'E') obj.position.set(wall - 0.02, y, along), (obj.rotation.y = -Math.PI / 2);
    if (side === 'N') obj.position.set(along, y, wall + 1.02), (obj.rotation.y = 0);
    if (side === 'S') obj.position.set(along, y, wall - 0.02), (obj.rotation.y = Math.PI);
    G.scene.add(obj);
    return obj;
  };
  G.poster = function (key, side, wall, along, y, w = 1.5) {
    const h = w * (4 / 3);
    const g = new THREE.Group();
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.14, h + 0.14), new THREE.MeshBasicMaterial({ color: '#222222' }));
    g.add(fr);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: G.assetTex(key) }));
    p.position.z = 0.01;
    g.add(p);
    return G.wallPlace(g, side, wall, along, y);
  };
  // Cartel rojo con el logo blanco + texto
  G.brandSign = function (text, w = 4, h = 0.8, opts = {}) {
    const px = 170;
    const { tex } = G.textCanvas(Math.round(w * px), Math.round(h * px), (ctx, cw, ch) => {
      ctx.fillStyle = RED;
      ctx.fillRect(0, 0, cw, ch);
      const lg = G.imgs.logoBlanco;
      const lh = ch * 0.46,
        lw = (lg.width / lg.height) * lh;
      const pad = ch * 0.27;
      ctx.drawImage(lg, pad, (ch - lh) / 2, lw, lh);
      if (text) {
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillRect(pad * 2 + lw, ch * 0.22, Math.max(3, ch * 0.025), ch * 0.56);
        let size = ch * 0.34;
        ctx.font = `700 ${size}px ${G.FONT}`;
        const maxW = cw - (pad * 3 + lw) - pad;
        const tw = ctx.measureText(text).width;
        if (tw > maxW) {
          size *= maxW / tw;
          ctx.font = `700 ${size}px ${G.FONT}`;
        }
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pad * 3 + lw, ch / 2 + ch * 0.02);
      }
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: opts.double ? THREE.DoubleSide : THREE.FrontSide }));
  };

  /* ---------------- Fichas INACAP ---------------- */
  G.fichaTotal = 0;
  G.placeFichas = function (id, spots) {
    const phrases = (C.fichas && C.fichas[id]) || [];
    G.fichaTotal = spots.length;
    spots.forEach((s, i) => {
      const g = new THREE.Group();
      g.position.set(s[0], s[1], s[2]);
      const face = new THREE.MeshBasicMaterial({ map: G.assetTex('ficha') });
      const edge = new THREE.MeshBasicMaterial({ color: RED });
      const coin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), [edge, edge, edge, edge, face, face]);
      g.add(coin);
      const halo = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.02), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.25 }));
      coin.add(halo);
      const l = G.label('FICHA INACAP', { scale: 1.25, bg: 'rgba(204,0,0,.94)' });
      l.position.y = 0.7;
      g.add(l);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
      hb.position.y = 0.1;
      g.add(hb);
      G.scene.add(g);
      const ph = Math.random() * 6;
      G.tick((dt, t) => {
        if (!g.parent) return false;
        coin.rotation.y += dt * 1.8;
        coin.position.y = Math.sin(t * 2.4 + ph) * 0.1;
      });
      G.interact(g, {
        label: 'Tomar Ficha INACAP',
        onUse() {
          G.unInteract(g);
          G.scene.remove(g);
          G.burst(g.position.clone(), [RED, '#ffffff', '#ff6b6b'], 22, 2.6);
          G.sfx.pick();
          G.sfx.tone(1320, 0.18, 'square', 0.04, 0, 0.12);
          collect(phrases[i] || '');
        },
      });
    });
  };
  function collect(text) {
    const r = G.run;
    if (!r) return;
    r.fichas.push(text);
    G.updateFichas();
    G.toast(
      `<div class="ficha-toast"><img src="${A.ficha}" alt=""><div><b>${G.t('¡{n}, encontraste una Ficha INACAP!')} ${r.fichas.length}/${G.fichaTotal}</b> · +${C.puntosPorFicha || 2} pts bonus<br><span>“${G.escapeHtml(text)}”</span></div></div>`,
      'brand',
      5600
    );
  }
  G.updateFichas = function () {
    const el = G.$('fichas');
    if (el && G.run && G.run.fichas) el.textContent = `${G.run.fichas.length}/${G.fichaTotal}`;
    if (G.refreshScore) G.refreshScore();
    if (G.updateSecrets) G.updateSecrets();
  };

  /* ---------------- Inscripción simulada ---------------- */
  const $ = G.$;
  const REG_KEY = 'demoVocacional_inscritos';
  const loadRegs = () => {
    try {
      return JSON.parse(localStorage.getItem(REG_KEY) || '[]');
    } catch (e) {
      return memRegs;
    }
  };
  let memRegs = [];
  const saveRegs = (l) => {
    memRegs = l;
    try {
      localStorage.setItem(REG_KEY, JSON.stringify(l));
    } catch (e) {}
  };
  // Hash simple (demo): el PIN no se guarda en texto plano.
  function hashPin(code, pin) {
    let h = 2166136261;
    const s = code + ':' + pin + ':demo-sal';
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }
  function newCode(regs) {
    const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c;
    do {
      c = 'INA';
      for (let i = 0; i < 5; i++) c += ch[Math.floor(Math.random() * ch.length)];
    } while (regs.some((r) => r.codigo === c));
    return c;
  }
  G.participant = null;

  function drawQR() {
    const cv = $('qr');
    if (!cv || typeof qrcode === 'undefined') return;
    if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const qr = qrcode(0, 'H');
    qr.addData(C.qrTexto || 'DEMO');
    qr.make();
    const n = qr.getModuleCount();
    const size = cv.width;
    const cell = Math.floor(size / (n + 6));
    const off = Math.floor((size - cell * n) / 2);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = GRAY;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) ctx.fillRect(off + x * cell, off + y * cell, cell, cell);
    const f = G.imgs.ficha,
      s = cell * 9;
    ctx.fillStyle = '#fff';
    ctx.fillRect((size - s) / 2 - cell, (size - s) / 2 - cell, s + 2 * cell, s + 2 * cell);
    ctx.drawImage(f, (size - s) / 2, (size - s) / 2, s, s);
  }

  G.showWelcome = function () {
    G.state = 'welcome';
    $('menu').classList.remove('show');
    $('welcome').classList.add('show');
    $('regCount').textContent = loadRegs().length;
  };
  function enterMenu(p) {
    G.participant = p;
    $('welcome').classList.remove('show');
    $('login').classList.remove('show');
    $('phone').classList.remove('show');
    G.state = 'menu';
    $('menu').classList.add('show');
    const who = $('who'),
      name = $('playerName');
    document.querySelectorAll('.card').forEach((c) => c.classList.remove('pick'));
    if (p) {
      who.innerHTML = `<span class="who-tag">Participante</span><b>${G.escapeHtml(p.nombre)} ${G.escapeHtml(p.apellido.charAt(0))}.</b><code>${p.codigo}</code><button class="linkbtn" id="whoOut">Cambiar</button>`;
      who.classList.add('show');
      name.value = `${p.nombre} ${p.apellido.charAt(0)}.`;
      name.disabled = true;
      const c = document.querySelector(`.card[data-ch="${p.desafio}"]`);
      if (c) c.classList.add('pick');
      $('whoOut').onclick = () => {
        G.participant = null;
        name.disabled = false;
        name.value = '';
        who.classList.remove('show');
        G.showWelcome();
      };
      G.toast(`¡Hola, <b>${G.escapeHtml(p.nombre)}</b>! Tu código <b>${p.codigo}</b> quedó vinculado. Elige tu desafío.`, 'good', 4500);
    } else {
      who.classList.remove('show');
      name.disabled = false;
    }
  }
  G.enterMenu = enterMenu;

  function initWelcome() {
    $('wHero').style.backgroundImage = `url(${A.bienvenida})`;
    document.querySelectorAll('.logo-blanco').forEach((i) => (i.src = A.logoBlanco));
    document.querySelectorAll('.logo-color').forEach((i) => (i.src = A.logoColor));
    $('wDate').textContent = `${C.evento} · ${C.sede}`;
    drawQR();
    $('btnScan').onclick = () => {
      G.sfx.init();
      G.sfx.click();
      $('regForm').reset();
      $('phoneForm').style.display = '';
      $('phoneDone').style.display = 'none';
      $('regErr').textContent = '';
      $('phone').classList.add('show');
      $('phoneScroll').scrollTop = 0;
    };
    $('phoneClose').onclick = () => $('phone').classList.remove('show');
    $('btnHaveCode').onclick = () => openLogin('');
    $('btnGuest').onclick = () => enterMenu(null);
    $('regForm').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const v = (k) => String(f.get(k) || '').trim();
      // "ignacio pérez" → "Ignacio Pérez"
      const cap = (t) => t.toLowerCase().replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());
      const err = $('regErr');
      if (!v('nombre') || !v('apellido')) return (err.textContent = 'Completa tu nombre y apellido.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('correo'))) return (err.textContent = 'Revisa tu correo electrónico.');
      if (!/^\+?[\d\s]{8,15}$/.test(v('telefono'))) return (err.textContent = 'Revisa tu número de celular.');
      const edad = parseInt(v('edad'), 10);
      if (!(edad >= 10 && edad <= 99)) return (err.textContent = 'Escribe tu edad (solo números).');
      if (!v('establecimiento') || !v('curso')) return (err.textContent = 'Completa tu establecimiento y curso.');
      if (!f.get('consentimiento')) return (err.textContent = 'Debes aceptar el consentimiento para participar.');
      const regs = loadRegs();
      const codigo = newCode(regs);
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      regs.push({
        codigo,
        pinHash: hashPin(codigo, pin),
        nombre: cap(v('nombre')),
        apellido: cap(v('apellido')),
        rut: v('rut'),
        telefono: v('telefono'),
        correo: v('correo'),
        edad,
        tipo: v('tipo'),
        establecimiento: v('establecimiento'),
        curso: v('curso'),
        desafio: v('desafio'),
        consentimiento: true,
        admision: !!f.get('admision'),
        fecha: new Date().toISOString(),
      });
      saveRegs(regs);
      G.sfx.good();
      $('pdName').textContent = cap(v('nombre'));
      $('pdCode').textContent = codigo;
      $('pdPin').textContent = pin;
      $('pdMail').textContent = v('correo');
      $('phoneForm').style.display = 'none';
      $('phoneDone').style.display = '';
      $('phoneScroll').scrollTop = 0;
      $('regCount').textContent = regs.length;
      $('pdGo').onclick = () => {
        $('phone').classList.remove('show');
        openLogin(codigo);
      };
    };
    $('loginForm').onsubmit = (e) => {
      e.preventDefault();
      const code = $('lgCode').value.trim().toUpperCase();
      const pin = $('lgPin').value.trim();
      const r = loadRegs().find((x) => x.codigo === code);
      if (!r || r.pinHash !== hashPin(code, pin)) {
        G.sfx.bad();
        $('lgErr').textContent = 'Código o PIN incorrecto. Revisa el mensaje que recibiste.';
        return;
      }
      G.sfx.good();
      enterMenu(r);
    };
    $('loginBack').onclick = () => $('login').classList.remove('show');
  }
  function openLogin(code) {
    G.sfx.init();
    $('lgCode').value = code;
    $('lgPin').value = '';
    $('lgErr').textContent = '';
    $('login').classList.add('show');
    setTimeout(() => (code ? $('lgPin') : $('lgCode')).focus(), 50);
  }
  G.initWelcome = initWelcome;
})();
