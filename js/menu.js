/* Escena del menú (diorama) + arranque */
(function () {
  'use strict';
  const G = window.G;
  G.defineBlock('m_grass', { color: '#5fbf4a', noise: 0.1 });
  G.defineBlock('m_dirt', { color: '#8a5a35', noise: 0.1 });
  G.defineBlock('m_path', { color: '#cdb98f', pattern: 'tile', noise: 0.08 });
  G.defineBlock('m_wood', { color: '#7a5230', pattern: 'plank' });
  G.defineBlock('m_leaf', { color: '#3f9b3a', pattern: 'leaves' });
  G.defineBlock('m_roof', { color: '#5a6670', pattern: 'panel' });
  G.defineBlock('m_glass', { color: '#9be3ff', noise: 0.05, transparent: true, opacity: 0.55, solid: true });
  G.defineBlock('m_water', { color: '#3aa0e8', noise: 0.06, transparent: true, opacity: 0.8 });

  function tree(w, x, z, h = 4) {
    w.fill(x, 1, z, x, h, z, 'm_wood');
    w.fill(x - 2, h - 1, z - 2, x + 2, h, z + 2, 'm_leaf');
    w.fill(x - 1, h + 1, z - 1, x + 1, h + 1, z + 1, 'm_leaf');
    w.set(x, h + 2, z, 'm_leaf');
  }

  G.buildMenuScene = function () {
    G.newScene({ sky: '#8fd0f7', fogNear: 40, fogFar: 95, hemi: 0.95, sun: 0.6, ground: 0x3d6b2a });
    const w = G.world;
    w.fill(-22, -1, -22, 22, -1, 22, 'm_dirt');
    w.fill(-22, 0, -22, 22, 0, 22, 'm_grass');
    w.fill(-1, 0, -22, 1, 0, 22, 'm_path');
    w.fill(-22, 0, 7, 22, 0, 9, 'm_path');
    w.fill(-6, 0, 14, 6, 0, 19, 'm_water');
    // edificio Enfermería
    w.room(-17, -12, -4, 3, { h: 6, floor: 'n_floor', wall: 'n_wall', band: 'n_band', ceil: 'm_roof' });
    w.fill(-17, 4, 3, -4, 4, 3, 'n_band');
    for (let x = -15; x <= -6; x += 3) w.fill(x, 2, 3, x + 1, 3, 3, 'm_glass');
    w.carve(-11, 1, 3, -10, 3, 3);
    w.fill(-12, 7, 3, -9, 7, 3, 'n_cross');
    w.fill(-11, 8, 3, -10, 8, 3, 'n_cross');
    // edificio Diseño
    w.room(4, -12, 17, 3, { h: 7, floor: 'd_floor', wall: 'd_wall', band: 'd_band', ceil: 'd_ceil' });
    w.fill(4, 5, 3, 17, 5, 3, 'd_neon');
    for (let x = 6; x <= 15; x += 3) w.fill(x, 2, 3, x + 1, 3, 3, 'm_glass');
    w.carve(10, 1, 3, 11, 3, 3);
    w.fill(8, 8, 3, 13, 8, 3, 'd_band');
    tree(w, -19, 12);
    tree(w, 18, 13, 5);
    tree(w, -14, 19, 5);
    tree(w, 13, 19);
    tree(w, -20, -17, 5);
    tree(w, 20, -16);
    const s1 = G.sign('ENFERMERÍA', { w: 5, h: 1, bg: '#17a58b' });
    s1.position.set(-10.5, 5.5, 4.03);
    G.scene.add(s1);
    const s2 = G.sign('DISEÑO E INDUSTRIA DIGITAL', { w: 7, h: 1, bg: '#140f26', fg: '#22e4ff', borderColor: '#ff2bd6' });
    s2.position.set(10.5, 6.6, 4.03);
    G.scene.add(s2);
    const bb = G.brandSign((window.CONFIG && window.CONFIG.sede) || '', 7, 1.4, { double: true });
    bb.position.set(0.5, 7.4, -1.5);
    G.scene.add(bb);
    G.scene.add(G.box(0.3, 6.1, 0.3, '#3d3d3d', -2.6, 4.05, -1.5));
    G.scene.add(G.box(0.3, 6.1, 0.3, '#3d3d3d', 3.6, 4.05, -1.5));
    // afiches INACAP en el campus
    G.poster('afiche6', 'E', -17, -4.5, 3.4, 2.4);
    G.poster('afiche8', 'W', 17, -4.5, 3.6, 2.4);
    [['afiche10', -5], ['afiche5', 6]].forEach(([k, x]) => {
      G.poster(k, 'N', 11, x, 2.6, 1.5);
      G.scene.add(G.box(1.7, 2.2, 0.12, '#3d3d3d', x, 2.6, 11.88));
      G.scene.add(G.box(0.12, 1.6, 0.12, '#3d3d3d', x - 0.6, 0.8 + 1, 11.88));
      G.scene.add(G.box(0.12, 1.6, 0.12, '#3d3d3d', x + 0.6, 0.8 + 1, 11.88));
    });
    // estudiantes caminando
    const people = [
      { x: 0.3, z: 16, sp: 1.2, c: '#e3242b' },
      { x: -0.6, z: -4, sp: 0.9, c: '#4d8fd6' },
      { x: -8, z: 8.3, sp: 1.1, c: '#ffb703', axis: 'x' },
      { x: 9, z: 7.6, sp: 0.8, c: '#8b5cf6', axis: 'x' },
    ].map((d, i) => {
      const p = G.person({ shirt: d.c, skin: ['#e0ac8a', '#c98d6b', '#f0c8a8', '#a8724f'][i], hair: ['#3b2618', '#1c1c1c', '#7a4a1e', '#2a1a10'][i] });
      p.position.set(d.x, 1, d.z);
      G.scene.add(p);
      d.p = p;
      d.o = d.axis === 'x' ? d.x : d.z;
      return d;
    });
    G.tick((dt, t) => {
      if (G.state !== 'menu') return false;
      people.forEach((d, i) => {
        const k = Math.sin(t * d.sp * 0.25 + i) * 9;
        const dir = Math.cos(t * d.sp * 0.25 + i) >= 0 ? 1 : -1;
        if (d.axis === 'x') {
          d.p.position.x = d.o + k;
          d.p.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          d.p.position.z = d.o + k;
          d.p.rotation.y = dir > 0 ? 0 : Math.PI;
        }
        G.walkAnim(d.p, t * 6 + i, 0.5);
      });
    });
    G.menuCenter = new THREE.Vector3(0, 0, -2);
    w.rebuild();
  };

  /* --- datos del jugador (pantalla de inicio) --- */
  const $ = G.$;
  const nameEl = $('playerName');
  const F = { nombre: nameEl, rut: $('pfRut'), telefono: $('pfTel'), correo: $('pfMail'), colegio: $('pfColegio') };
  const okEl = $('pfOk');
  const cap = (t) => t.toLowerCase().replace(/(^|\s)(\S)/g, (m, sp, ch) => sp + ch.toUpperCase());

  // RUT chileno: valida dígito verificador (módulo 11) y lo deja como 12.345.678-5
  const rutLimpio = (s) => String(s).toUpperCase().replace(/[^0-9K]/g, '');
  function rutValido(s) {
    const c = rutLimpio(s);
    if (!/^\d{7,8}[0-9K]$/.test(c)) return false;
    let sum = 0,
      m = 2;
    for (let i = c.length - 2; i >= 0; i--) {
      sum += Number(c[i]) * m;
      m = m === 7 ? 2 : m + 1;
    }
    const r = 11 - (sum % 11);
    return c.slice(-1) === (r === 11 ? '0' : r === 10 ? 'K' : String(r));
  }
  function rutFormato(s) {
    const c = rutLimpio(s);
    if (c.length < 2) return s;
    return c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + c.slice(-1);
  }
  // Celular chileno: 9 dígitos que empiezan con 9 (acepta +56 adelante)
  function telDigitos(s) {
    let d = String(s).replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('56')) d = d.slice(2);
    return d;
  }
  const telValido = (s) => /^9\d{8}$/.test(telDigitos(s));
  const telFormato = (s) => {
    const d = telDigitos(s);
    return telValido(s) ? `+56 9 ${d.slice(1, 5)} ${d.slice(5)}` : s;
  };
  const mailValido = (s) => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(String(s).trim());
  const palabras = (s) => String(s).trim().split(/\s+/).filter((w) => w.length >= 2);

  const checks = {
    nombre: [(v) => palabras(v).length >= 2, '✍️ Escribe tu <b>nombre y apellido</b>.'],
    rut: [rutValido, '🪪 Revisa tu <b>RUT</b> (incluye el dígito verificador).'],
    telefono: [telValido, '📱 Revisa tu <b>celular</b>: 9 dígitos, empieza con 9.'],
    correo: [mailValido, '✉️ Revisa tu <b>email</b>.'],
    colegio: [(v) => String(v).trim().length >= 3, '🏫 Escribe el nombre de tu <b>colegio</b>.'],
  };
  const fmt = { rut: rutFormato, telefono: telFormato, nombre: (v) => cap(v.trim().replace(/\s+/g, ' ')), colegio: (v) => v.trim().replace(/\s+/g, ' ') };
  Object.keys(F).forEach((k) => {
    F[k].addEventListener('blur', () => {
      const v = F[k].value;
      if (!v.trim()) return F[k].classList.remove('ok');
      if (fmt[k] && checks[k][0](v)) F[k].value = fmt[k](v);
      F[k].classList.toggle('ok', checks[k][0](F[k].value));
    });
    F[k].addEventListener('input', () => F[k].classList.remove('need'));
    // Enter pasa al siguiente campo
    F[k].addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const ks = Object.keys(F);
      const nx = F[ks[ks.indexOf(k) + 1]];
      (nx || okEl).focus();
    });
  });
  okEl.addEventListener('change', () => okEl.parentElement.classList.remove('need'));

  function flag(el) {
    el.classList.remove('need');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('need');
  }
  // Devuelve los datos limpios del jugador, o null si falta algo (y marca el campo)
  function leerJugador() {
    const bad = Object.keys(F).filter((k) => !checks[k][0](F[k].value));
    if (bad.length) {
      bad.forEach((k) => flag(F[k]));
      F[bad[0]].focus();
      G.toast(checks[bad[0]][1], 'bad', 3400);
      return null;
    }
    if (!okEl.checked) {
      flag(okEl.parentElement);
      G.toast('☑️ Marca la casilla de autorización para poder jugar.', 'bad', 3400);
      return null;
    }
    const full = fmt.nombre(F.nombre.value);
    const [nombre, ...rest] = full.split(' ');
    return {
      nombre,
      apellido: rest.join(' '),
      rut: rutFormato(F.rut.value),
      telefono: telFormato(F.telefono.value),
      correo: F.correo.value.trim().toLowerCase(),
      colegio: fmt.colegio(F.colegio.value),
    };
  }
  G.resetPlayerForm = function () {
    $('playerForm').reset();
    Object.values(F).forEach((el) => el.classList.remove('ok', 'need'));
    G.jugador = null;
  };

  /* Registro local de cada partida terminada (datos + puntaje + tiempo) */
  const PLAYS_KEY = 'demoVocacional_partidas';
  G.recordPlay = function (r) {
    const p = G.jugador;
    if (!p || !r.result) return;
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(PLAYS_KEY) || '[]');
    } catch (e) {}
    list.push(Object.assign({ fecha: new Date().toISOString() }, p, { desafio: r.id, puntaje: r.result.total, tiempo: Math.round(r.result.time), errores: r.errors }));
    try {
      localStorage.setItem(PLAYS_KEY, JSON.stringify(list));
    } catch (e) {}
  };

  document.querySelectorAll('[data-ch]').forEach((b) =>
    b.addEventListener('click', () => {
      G.sfx.init();
      let name;
      if (G.participant) {
        name = nameEl.value.trim();
      } else {
        const p = leerJugador();
        if (!p) return G.sfx.bad();
        G.jugador = p;
        name = `${p.nombre} ${p.apellido.charAt(0)}.`;
      }
      G.startChallenge(b.dataset.ch, name);
    })
  );
  // Al volver al menú después de terminar una partida, el formulario queda limpio para el siguiente jugador
  const toMenu = G.toMenu;
  G.toMenu = function () {
    const terminado = G.run && G.run.done;
    toMenu.apply(this, arguments);
    if (terminado && !G.participant) G.resetPlayerForm();
  };
  G.$('btnAlbum').addEventListener('click', () => G.openAlbum());
  G.loadImages().then(() => {
    G.buildMenuScene();
    G.initWelcome();
    // Modo kiosco: se parte directo en la pantalla con los datos del jugador
    if (window.CONFIG && window.CONFIG.modoKiosco) G.enterMenu(null);
    else G.showWelcome();
    G.startLoop();
  });
})();
