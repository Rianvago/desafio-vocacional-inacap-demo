/* =========================================================================
   SECRETOS, PERSONAJES Y "MIS HALLAZGOS"
   - Catálogo de secretos por nivel (se colocan desde nursing.js / design.js)
   - Pasadizos secretos (paredes agrietadas)
   - Personajes que hablan con el jugador por su nombre y hacen preguntas
   - Afiches que se "descubren" al mirarlos
   - Panel de hallazgos (tecla C) y álbum guardado por jugador
   ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const V3 = THREE.Vector3;
  const A = window.ASSETS || {};
  const PTS_SECRETO = 3,
    PTS_PREGUNTA = 3;

  /* ---------------- catálogo ---------------- */
  G.SECRETS = {
    enfermeria: [
      { id: 'estetoscopio', icon: '🩺', name: 'Estetoscopio dorado', desc: 'El estetoscopio permite escuchar el corazón y los pulmones: es una de las primeras herramientas que aprendes a usar en Enfermería.', hint: 'En el triage, agáchate con la mirada: algo brilla bajo una cama.' },
      { id: 'gato', icon: '🐈', name: 'Michi, el gato de terapia', desc: 'Las terapias asistidas con animales ayudan a bajar el estrés de pacientes y equipos de salud.', hint: 'Alguien duerme junto al sillón de la Sala de Estudio.' },
      { id: 'lampara', icon: '🪔', name: 'La lámpara de Florence', desc: 'Florence Nightingale, «la dama de la lámpara», recorría de noche las salas cuidando a los heridos. Es considerada la fundadora de la enfermería moderna.', hint: 'Mira hacia arriba, sobre las estanterías de la Sala de Estudio.' },
      { id: 'pasadizo', icon: '🧱', name: 'Sala de Simulación secreta', desc: 'Encontraste la Sala de Simulación Avanzada: aquí se practica con maniquíes de alta fidelidad antes de atender a personas reales.', hint: 'Una pared de la Estación de enfermería está agrietada. ¡Súbete al mesón!' },
      { id: 'diario', icon: '📓', name: 'Diario del turno de noche', desc: '«Día 3: el equipo aplicó el protocolo y nadie más se contagió. La clave fue la más simple: lavarse bien las manos.»', hint: 'Dentro de la sala secreta, revisa el escritorio.' },
    ],
    diseno: [
      { id: 'pixel', icon: '🟨', name: 'Píxel dorado', desc: 'Un píxel es la unidad mínima de una imagen digital. Todo lo que ves en una pantalla está hecho de millones de ellos.', hint: 'En la sala de la web, revisa las esquinas del fondo.' },
      { id: 'boceto', icon: '✏️', name: 'Boceto perdido', desc: 'Todo personaje empieza como un garabato: se hacen decenas de bocetos antes de llegar al diseño final.', hint: 'En el Taller de Ilustración, mira bajo las mesas de dibujo.' },
      { id: 'cassette', icon: '📼', name: 'Cassette del soundtrack', desc: 'La música y el diseño sonoro son la mitad de la experiencia de un videojuego. ¡Dale play!', hint: 'En el Estudio de Sonido, revisa la repisa de las cintas.' },
      { id: 'arcade', icon: '🕹️', name: 'Arcade secreto', desc: 'Uno de los primeros videojuegos de la historia fue «Tennis for Two» (1958), creado en un laboratorio usando un osciloscopio.', hint: 'Una pared de la sala de animación tiene un glitch… y se ve agrietada.' },
      { id: 'glitchy', icon: '👾', name: 'Glitchy, la mascota', desc: 'Glitchy causó el desorden del estudio… pero también inspiró la Expo. A veces los errores son el inicio de una gran idea.', hint: 'En la sala del nivel jugable, algo se esconde en una esquina.' },
    ],
  };
  const POSTERS = {
    afiche1: 'Tu vocación es cuidar',
    afiche2: 'Equipo, protocolo y seguridad',
    afiche3: 'Diseña lo que imaginas',
    afiche4: 'De la idea al juego',
    afiche5: 'Tu futuro empieza aquí',
    afiche6: 'Cuidar también es escuchar',
    afiche7: 'Practica hoy, cuida mañana',
    afiche8: 'Todo empieza con un boceto',
    afiche9: 'Dale sonido a tus ideas',
    afiche10: 'Tu lugar está en Valpo',
  };
  G.POSTER_TITLES = POSTERS;
  G.LEVEL_POSTERS = {
    enfermeria: ['afiche1', 'afiche2', 'afiche5', 'afiche6', 'afiche7', 'afiche10'],
    diseno: ['afiche3', 'afiche4', 'afiche5', 'afiche8', 'afiche9', 'afiche10'],
  };

  /* --- se reinicia todo al construir un escenario nuevo --- */
  const _newScene = G.newScene;
  G.newScene = function (o) {
    const s = _newScene(o);
    G.levelPosters = [];
    G.secretTotal = 0;
    return s;
  };
  const curId = () => (G.run && G.run.id) || null;

  /* ---------------- secretos ---------------- */
  function def(id) {
    const lvl = curId();
    return (G.SECRETS[lvl] || []).find((s) => s.id === id);
  }
  G.findSecret = function (id) {
    const r = G.run;
    if (!r || !r.found || r.found['s_' + id]) return;
    const d = def(id);
    if (!d) return;
    r.found['s_' + id] = true;
    G.addBonus('secreto', d.name, PTS_SECRETO);
    G.updateSecrets();
    G.sfx.tone(784, 0.12, 'square', 0.04);
    G.sfx.tone(1046, 0.12, 'square', 0.04, 0, 0.1);
    G.sfx.tone(1568, 0.22, 'square', 0.04, 0, 0.2);
    const n = Object.keys(r.found).filter((k) => k.startsWith('s_')).length;
    G.toast(`<div class="ficha-toast"><span style="font-size:2rem;font-style:normal">${d.icon}</span><div><b>${G.t('¡Secreto encontrado, {n}!')}</b> ${n}/${G.secretTotal} · +${PTS_SECRETO} pts<br><b style="color:#ffd23f">${d.name}</b> — <span style="color:#f1e6b8">${d.desc}</span></div></div>`, 'gold', 7000);
  };
  G.updateSecrets = function () {
    const el = G.$('secretos');
    if (!el || !G.run || !G.run.found) return;
    const n = Object.keys(G.run.found).filter((k) => k.startsWith('s_')).length;
    el.textContent = `${n}/${G.secretTotal}`;
  };

  // Objeto secreto (sprite emoji o un modelo propio) que se examina con E
  G.placeSecret = function (id, x, y, z, o = {}) {
    G.secretTotal = (G.SECRETS[curId()] || []).length;
    const d = def(id);
    const g = new THREE.Group();
    g.position.set(x, y, z);
    if (o.model) g.add(o.model);
    else {
      const e = G.emoji(d.icon, o.size || 0.45);
      g.add(e);
      const ph = Math.random() * 6;
      G.tick((dt, t) => {
        if (!g.parent) return false;
        e.position.y = Math.sin(t * 2 + ph) * 0.05;
        e.material.opacity = 0.75 + 0.25 * Math.abs(Math.sin(t * 3 + ph));
      });
    }
    const hb = new THREE.Mesh(new THREE.BoxGeometry(o.hw || 0.7, o.hh || 0.7, o.hw || 0.7), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.y = o.hy || 0;
    g.add(hb);
    G.scene.add(g);
    G.interact(g, {
      label: o.label || 'Examinar…',
      onUse() {
        if (!o.keep) {
          G.unInteract(g);
          G.burst(g.position.clone(), ['#ffd23f', '#ffffff', '#fff3b0'], 22, 2.4);
          G.scene.remove(g);
        }
        if (o.onUse) o.onUse(g);
        G.findSecret(id);
      },
    });
    return g;
  };

  // Pared agrietada → al golpearla se abre y revela un pasadizo (cuenta como secreto)
  G.secretWall = function (id, cells, faceX, faceY, faceZ, rotY, color = '#8a8a8a') {
    G.secretTotal = (G.SECRETS[curId()] || []).length;
    cells.forEach(([x, y, z]) => G.world.set(x, y, z, 'crack_' + curId()));
    const hb = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.set(faceX, faceY, faceZ);
    hb.rotation.y = rotY;
    G.scene.add(hb);
    let hits = 0;
    G.interact(hb, {
      label: 'Esta pared se ve agrietada… ¿golpearla?',
      onUse() {
        hits++;
        G.sfx.hit();
        G.burst(new V3(faceX, faceY, faceZ), [color, '#cccccc'], 10, 2);
        if (hits < 2) return G.toast(G.t('Suena hueco… {n}, ¡golpéala otra vez!'), 'info', 2000);
        G.unInteract(hb);
        G.scene.remove(hb);
        G.openCells(cells, color);
        G.findSecret(id);
      },
    });
  };
  G.defineBlock('crack_enfermeria', { color: '#cfe3de', pattern: 'crack', noise: 0.05 });
  G.defineBlock('crack_diseno', { color: '#4a3f7a', pattern: 'crack', noise: 0.08 });

  /* ---------------- modelos pequeños ---------------- */
  G.voxCat = function () {
    const g = new THREE.Group();
    const c = '#e8a25a',
      d = '#b86f2c';
    G.box(0.5, 0.26, 0.26, c, 0, 0.18, 0, g);
    G.box(0.24, 0.22, 0.24, c, 0.32, 0.3, 0, g);
    G.box(0.06, 0.08, 0.06, d, 0.28, 0.45, -0.08, g);
    G.box(0.06, 0.08, 0.06, d, 0.28, 0.45, 0.08, g);
    G.box(0.04, 0.04, 0.04, '#1d1d1d', 0.445, 0.33, -0.06, g);
    G.box(0.04, 0.04, 0.04, '#1d1d1d', 0.445, 0.33, 0.06, g);
    const tail = G.box(0.32, 0.07, 0.07, d, -0.36, 0.3, 0, g);
    tail.rotation.z = 0.7;
    [[-0.16, -0.08], [-0.16, 0.08], [0.16, -0.08], [0.16, 0.08]].forEach(([x, z]) => G.box(0.08, 0.08, 0.08, d, x, 0.04, z, g));
    const zz = G.label('z z z', { scale: 0.8, bg: 'rgba(0,0,0,0)', fg: '#ffffff' });
    zz.position.set(0.3, 0.75, 0);
    g.add(zz);
    G.tick((dt, t) => {
      if (!g.parent) return false;
      g.scale.y = 1 + Math.sin(t * 2) * 0.03;
    });
    return g;
  };
  G.voxGlitchy = function () {
    const g = new THREE.Group();
    const body = G.box(0.5, 0.45, 0.5, '#8b5cf6', 0, 0.3, 0, g);
    G.box(0.1, 0.1, 0.02, '#ffffff', -0.11, 0.38, 0.26, g);
    G.box(0.1, 0.1, 0.02, '#ffffff', 0.11, 0.38, 0.26, g);
    G.box(0.05, 0.05, 0.02, '#140f26', -0.1, 0.37, 0.275, g);
    G.box(0.05, 0.05, 0.02, '#140f26', 0.12, 0.37, 0.275, g);
    G.box(0.08, 0.16, 0.08, '#22e4ff', -0.18, 0.6, 0, g);
    G.box(0.08, 0.16, 0.08, '#ff2bd6', 0.18, 0.6, 0, g);
    G.tick((dt, t) => {
      if (!g.parent) return false;
      body.position.x = Math.random() < 0.04 ? (Math.random() - 0.5) * 0.08 : 0;
      g.position.y = Math.abs(Math.sin(t * 3)) * 0.12;
    });
    return g;
  };

  /* ---------------- personajes que hablan ---------------- */
  // o: { name, role, avatar, look:{...G.person}, x, z, rotY, lines:[...], quiz:{q, opts:[{t, ok, why}]} }
  G.npc = function (o) {
    const p = G.person(o.look || {});
    p.position.set(o.x, o.y || 1, o.z);
    p.rotation.y = o.rotY || 0;
    G.scene.add(p);
    const tag = G.label(o.name, { scale: 1.5, bg: o.tagBg || 'rgba(204,0,0,.92)' });
    tag.position.set(0, 2.35, 0);
    p.add(tag);
    const bubble = G.emoji('💬', 0.45);
    bubble.position.set(0.45, 2.15, 0);
    p.add(bubble);
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.y = 1;
    p.add(hb);
    if (!o.noCollide) G.collider(o.x - 0.35, 1, o.z - 0.35, o.x + 0.35, 2.8, o.z + 0.35);
    let talks = 0,
      answered = false;
    G.tick((dt, t) => {
      if (!p.parent) return false;
      bubble.visible = !answered || talks === 0;
      bubble.position.y = 2.15 + Math.sin(t * 3) * 0.05;
      // mira al jugador cuando está cerca
      const P = G.player.pos,
        dx = P.x - o.x,
        dz = P.z - o.z;
      if (dx * dx + dz * dz < 20) {
        let d = Math.atan2(dx, dz) - p.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d)); // camino más corto
        p.rotation.y += d * Math.min(1, dt * 4);
      }
    });
    G.interact(p, {
      label: `Hablar con ${o.name}`,
      onUse() {
        talks++;
        G.sfx.click();
        const say = (html) => `<div class="npc-say"><span class="av">${o.avatar || '🧑'}</span><div>${html}</div></div>`;
        if (o.quiz && !answered) {
          const q = o.quiz;
          G.modal({
            title: `${o.avatar || ''} ${o.name} · <span class="dim" style="font-weight:600">${o.role || ''}</span>`,
            text: say(`<p>${G.t(o.lines[0])}</p><p><b>${G.t(q.q)}</b></p>`),
            layout: q.opts.length === 4 ? 'cards4' : 'cards',
            closeLabel: 'Ahora no (Esc)',
            options: G.shuffle(q.opts).map((op) => ({
              icon: op.icon || '',
              label: op.t,
              onPick() {
                answered = true;
                if (op.ok) {
                  G.addBonus('pregunta', o.name, PTS_PREGUNTA);
                  G.sfx.good();
                  G.closeModal();
                  G.toast(`${o.avatar || ''} <b>${G.t(G.pick(['¡Correcto, {n}!', '¡Exacto, {n}!', '¡Muy bien, {n}!']))}</b> ${op.why || ''} <b>+${PTS_PREGUNTA} pts</b>`, 'gold', 6500);
                } else {
                  G.sfx.bad();
                  G.closeModal();
                  G.toast(`${o.avatar || ''} ${G.t('Casi, {n}.')} ${q.answer} <i>(sin descuento: ¡aprender también es equivocarse!)</i>`, 'info', 7000);
                }
              },
            })),
          });
        } else {
          const pool = o.lines.slice(1);
          G.modal({
            title: `${o.avatar || ''} ${o.name}`,
            text: say(`<p>${G.t(pool.length ? pool[(talks - 1) % pool.length] : o.lines[0])}</p>`),
            closeLabel: 'Gracias (Esc)',
          });
        }
      },
    });
    return p;
  };

  /* ---------------- afiches: se descubren al mirarlos ---------------- */
  const _poster = G.poster;
  G.poster = function (key, side, wall, along, y, w) {
    const g = _poster(key, side, wall, along, y, w);
    (G.levelPosters = G.levelPosters || []).push({ key, obj: g });
    return g;
  };
  const tmpDir = new V3(),
    tmpTo = new V3(),
    tmpN = new V3();
  let scanT = 0;
  function scanPosters(dt) {
    const r = G.run;
    if (!r || !r.found || r.done || G.state !== 'play' || G.modalOpen) return;
    scanT += dt;
    if (scanT < 0.25) return;
    scanT = 0;
    const cam = G.camera;
    cam.getWorldDirection(tmpDir);
    for (const p of G.levelPosters || []) {
      if (r.found['p_' + p.key]) continue;
      tmpTo.copy(p.obj.position).sub(cam.position);
      const dist = tmpTo.length();
      if (dist > 7.5) continue;
      tmpTo.normalize();
      if (tmpDir.dot(tmpTo) < 0.9) continue;
      tmpN.set(0, 0, 1).applyQuaternion(p.obj.quaternion);
      if (tmpN.dot(tmpTo) > -0.2) continue; // está de espaldas
      if (G.world.ray(cam.position, tmpTo, dist) < dist - 0.3) continue; // hay un muro
      r.found['p_' + p.key] = true;
      const lvl = G.LEVEL_POSTERS[r.id] || [];
      const seen = lvl.filter((k) => r.found['p_' + k]).length;
      G.sfx.tone(1200, 0.08, 'sine', 0.03);
      G.toast(`<div class="ficha-toast"><img src="${A[p.key]}" alt="" style="width:34px;height:45px;object-fit:cover"><div><b>Afiche descubierto ${seen}/${lvl.length}</b><br><span>«${POSTERS[p.key] || ''}»</span></div></div>`, 'brand', 3200);
    }
  }
  // Los "tickers" se reinician con cada escena: se registra el escáner en cada una
  const _ns2 = G.newScene;
  G.newScene = function (o) {
    const s = _ns2(o);
    G.tick((dt) => {
      scanPosters(dt);
    });
    return s;
  };

  /* ---------------- panel "Mis hallazgos" ---------------- */
  function collectionHTML(lvl, st) {
    // st: { fichas:[frases], secretos:Set, afiches:Set }
    const C = window.CONFIG || {};
    const fr = (C.fichas && C.fichas[lvl]) || [];
    const sec = G.SECRETS[lvl] || [];
    const pos = G.LEVEL_POSTERS[lvl] || [];
    const nS = sec.filter((s) => st.secretos.has(s.id)).length;
    const nP = pos.filter((k) => st.afiches.has(k)).length;
    let h = `<div class="hz-sum"><span>🟥 Fichas ${st.fichas.length}/${fr.length}</span><span>🔎 Secretos ${nS}/${sec.length}</span><span>🖼️ Afiches ${nP}/${pos.length}</span></div>`;
    h += `<div class="hz-sec">Fichas INACAP</div><div class="hz-grid">`;
    fr.forEach((f) => {
      const got = st.fichas.includes(f);
      h += `<div class="hz-item brand ${got ? 'got' : 'no'}"><span class="ic"><img src="${A.ficha}" alt="" style="width:28px;height:28px;border-radius:4px"></span><b>${got ? 'Ficha INACAP' : 'Ficha sin encontrar'}</b><small>${got ? '“' + G.escapeHtml(f) + '”' : 'Están escondidas por el mapa. Busca la moneda roja que gira.'}</small></div>`;
    });
    h += `</div><div class="hz-sec">Secretos</div><div class="hz-grid">`;
    sec.forEach((s) => {
      const got = st.secretos.has(s.id);
      h += `<div class="hz-item ${got ? 'got' : 'no'}"><span class="ic">${got ? s.icon : '❔'}</span><b>${got ? s.name : '???'}</b><small>${got ? s.desc : '💡 Pista: ' + s.hint}</small></div>`;
    });
    h += `</div><div class="hz-sec">Afiches INACAP</div><div class="hz-pos">`;
    pos.forEach((k) => {
      const got = st.afiches.has(k);
      h += `<figure class="${got ? 'got' : 'no'}" title="${got ? POSTERS[k] : 'Afiche sin descubrir: recorre el mapa y míralo de cerca'}"><img src="${A[k]}" alt=""></figure>`;
    });
    return h + '</div>';
  }
  function runState(r) {
    return {
      fichas: r.fichas.slice(),
      secretos: new Set(Object.keys(r.found).filter((k) => k.startsWith('s_')).map((k) => k.slice(2))),
      afiches: new Set(Object.keys(r.found).filter((k) => k.startsWith('p_')).map((k) => k.slice(2))),
    };
  }
  G.openHallazgos = function () {
    const r = G.run;
    if (!r || !r.found) return G.openAlbum();
    G.sfx.click();
    G.modal({
      kind: 'hallazgos',
      wide: true,
      title: `📒 ${G.t('Hallazgos de {n}')} · ${r.ch.title}`,
      text: collectionHTML(r.id, runState(r)),
      closeLabel: G.state === 'play' ? 'Volver al juego (C)' : 'Cerrar',
    });
  };

  /* ---------------- álbum (se acumula entre partidas) ---------------- */
  const albumKey = () => {
    const p = G.participant;
    const nm = p ? p.codigo : (G.$('playerName').value || '').trim().toLowerCase();
    return nm ? 'demoVocacional_album_' + nm : null;
  };
  function loadAlbum() {
    const k = albumKey();
    try {
      return (k && JSON.parse(localStorage.getItem(k) || '{}')) || {};
    } catch (e) {
      return {};
    }
  }
  G.saveAlbum = function (r) {
    const k = albumKey();
    if (!k) return;
    const al = loadAlbum();
    const cur = al[r.id] || { fichas: [], secretos: [], afiches: [] };
    const st = runState(r);
    cur.fichas = [...new Set(cur.fichas.concat(st.fichas))];
    cur.secretos = [...new Set(cur.secretos.concat([...st.secretos]))];
    cur.afiches = [...new Set(cur.afiches.concat([...st.afiches]))];
    al[r.id] = cur;
    try {
      localStorage.setItem(k, JSON.stringify(al));
    } catch (e) {}
  };
  G.openAlbum = function () {
    const k = albumKey();
    G.sfx.init();
    G.sfx.click();
    if (!k) {
      G.toast('Escribe tu nombre (o ingresa con tu código) para ver tu álbum.', 'info');
      G.$('playerName').focus();
      return;
    }
    const al = loadAlbum();
    const sec = (id, title) => {
      const a = al[id] || { fichas: [], secretos: [], afiches: [] };
      return `<h3 style="margin:18px 0 4px">${title}</h3>` + collectionHTML(id, { fichas: a.fichas, secretos: new Set(a.secretos), afiches: new Set(a.afiches) });
    };
    const who = G.participant ? G.participant.nombre : G.$('playerName').value.trim();
    G.modal({
      kind: 'album',
      wide: true,
      title: `📒 Álbum de hallazgos de ${G.escapeHtml(G.firstName(who))}`,
      text: `<p class="dim" style="margin:0">Todo lo que has encontrado en tus partidas. ¡Completa el álbum!</p>` + sec('enfermeria', '🏥 Enfermería · Protocolo Z') + sec('diseno', '🎨 Diseño · Estudio Glitch'),
      closeLabel: 'Cerrar',
    });
  };
})();
