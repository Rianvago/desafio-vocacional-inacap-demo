/* =========================================================================
   Desafío ENFERMERÍA · PROTOCOLO Z
   Etapas: 1 EPP · 2 Triage · 3 Insumos · 4 Protocolo de contención
   ========================================================================= */
(function () {
  'use strict';
  const G = window.G;
  const V3 = THREE.Vector3;

  G.defineBlock('n_floor', { color: '#c4d2d8', pattern: 'tile', noise: 0.05 });
  G.defineBlock('n_wall', { color: '#dcefea', noise: 0.035 });
  G.defineBlock('n_band', { color: '#dcefea', pattern: 'stripe', accent: '#17a58b', noise: 0.035 });
  G.defineBlock('n_ceil', { color: '#f2f5f6', pattern: 'panel', noise: 0.03 });
  G.defineBlock('n_lamp', { color: '#fffbe6', pattern: 'lamp', emissive: true });
  G.defineBlock('n_alarm', { color: '#ffffff', pattern: 'lamp', emissive: true });
  G.defineBlock('n_door', { color: '#c8323b', pattern: 'panel' });
  G.defineBlock('n_hazard', { color: '#f2b632', pattern: 'stripe', accent: '#25282c' });
  G.defineBlock('n_counter', { color: '#b7c3cb', pattern: 'panel' });
  G.defineBlock('n_shelf', { color: '#d9cbb0', pattern: 'shelf' });
  G.defineBlock('n_cross', { color: '#ffffff', pattern: 'cross', accent: '#e0313b' });
  G.defineBlock('n_floor2', { color: '#a9c7d2', pattern: 'tile', noise: 0.05 });

  const CLR = { teal: '#17a58b', dark: '#12263a', red: '#d9343e' };

  /* ---------- props ---------- */
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
  function bed(x, z, blanket) {
    const g = new THREE.Group();
    g.position.set(x, 1, z);
    G.box(1.2, 0.12, 2.2, '#9aa7b0', 0, 0.45, 0, g);
    [[-0.55, -1], [0.55, -1], [-0.55, 1], [0.55, 1]].forEach(([a, b]) => G.box(0.08, 0.45, 0.08, '#7d8a93', a, 0.22, b * 1.02, g));
    G.box(1.16, 0.2, 2.14, '#ffffff', 0, 0.61, 0, g);
    G.box(1.2, 0.08, 1.25, blanket, 0, 0.74, 0.45, g);
    G.box(0.8, 0.14, 0.4, '#f7f7f7', 0, 0.78, -0.85, g);
    G.box(1.2, 0.5, 0.08, '#9aa7b0', 0, 0.75, -1.1, g);
    G.scene.add(g);
    G.collider(x - 0.62, 1, z - 1.12, x + 0.62, 1.9, z + 1.12);
    return g;
  }
  function chest(x, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, 1, z);
    g.rotation.y = rotY;
    G.box(0.95, 0.55, 0.65, '#8b5a2b', 0, 0.28, 0, g);
    const lid = G.box(0.97, 0.2, 0.67, '#a36a33', 0, 0.65, 0, g);
    G.box(0.99, 0.08, 0.69, '#c9a227', 0, 0.55, 0, g);
    G.box(0.14, 0.18, 0.04, '#e3c04a', 0, 0.5, 0.34, g);
    g.add(hitbox(1, 1, 0.8, 0.45));
    G.scene.add(g);
    G.collider(x - 0.5, 1, z - 0.5, x + 0.5, 1.8, z + 0.5);
    g.userData.lid = lid;
    return g;
  }
  function lever(x, z, color = CLR.red) {
    const g = new THREE.Group();
    g.position.set(x, 1, z);
    G.box(0.4, 0.9, 0.4, '#56636d', 0, 0.45, 0, g);
    const pv = new THREE.Group();
    pv.position.set(0, 0.92, 0);
    g.add(pv);
    G.box(0.08, 0.5, 0.08, '#cfd6db', 0, 0.25, 0, pv);
    G.box(0.18, 0.18, 0.18, color, 0, 0.52, 0, pv);
    pv.rotation.x = 0.6;
    g.add(hitbox(0.6, 1.6, 0.6, 0.8));
    g.userData.pv = pv;
    G.scene.add(g);
    G.collider(x - 0.22, 1, z - 0.22, x + 0.22, 2, z + 0.22);
    return g;
  }
  function pullLever(l) {
    const pv = l.userData.pv;
    let t = 0;
    G.tick((dt) => {
      t += dt * 5;
      pv.rotation.x = 0.6 - Math.min(1, t) * 1.2;
      if (t > 1) return false;
    });
  }
  function monitor(text, color) {
    const { canvas, tex } = G.textCanvas(320, 180, () => {});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.68), new THREE.MeshBasicMaterial({ map: tex }));
    m.userData.draw = (txt, col, phase = 0) => {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#071318';
      ctx.fillRect(0, 0, 320, 180);
      ctx.strokeStyle = '#2b3c44';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 312, 172);
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 14; x < 306; x += 2) {
        const k = (x + phase) % 90;
        const y = 70 + (k > 40 && k < 46 ? -34 : k > 46 && k < 52 ? 26 : 0);
        x === 14 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = `800 30px ${G.FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(txt, 160, 150);
      tex.needsUpdate = true;
    };
    m.userData.draw(text, color);
    return m;
  }

  /* ---------- datos del desafío ---------- */
  const EPP = [
    { id: 'mascarilla', icon: '😷', name: 'Mascarilla', ok: true },
    { id: 'guantes', icon: '🧤', name: 'Guantes', ok: true },
    { id: 'pechera', icon: '🥼', name: 'Pechera / bata', ok: true },
    { id: 'joyas', icon: '💍', name: 'Anillos y reloj', why: 'Las joyas y el reloj acumulan microorganismos: se retiran antes de atender.' },
    { id: 'celular', icon: '📱', name: 'Celular', why: 'El celular es un foco de contaminación: se queda fuera del área clínica.' },
    { id: 'sandwich', icon: '🥪', name: 'Sándwich', why: 'En un área clínica no se come.' },
    { id: 'audifonos', icon: '🎧', name: 'Audífonos', why: 'Necesitas escuchar a tus pacientes y a tu equipo.' },
  ];
  const PATIENTS = [
    { key: 'sano', name: 'Tomás R.', skin: '#e0ac8a', mon: 'FC 74 · SpO₂ 98%', col: '#3ddc84', vit: 'Temp 36,6 °C · FC 74 lpm · SpO₂ 98%', obs: 'Conversa con normalidad y no tiene síntomas. Vino a acompañar a un familiar.' },
    { key: 'leve', name: 'Valentina P.', skin: '#d8b48c', mon: 'FC 92 · SpO₂ 96%', col: '#d9ff3a', vit: 'Temp 37,8 °C · FC 92 lpm · SpO₂ 96%', obs: 'Tos leve y dolor de cabeza. Camina sin ayuda.' },
    { key: 'deso', name: 'Matías L.', skin: '#c3bf8e', tired: true, mon: 'FC 108 · SpO₂ 94%', col: '#ffb23f', vit: 'Temp 38,6 °C · FC 108 lpm · SpO₂ 94%', obs: 'No recuerda dónde está ni qué día es. Está inquieto.' },
    { key: 'crit', name: 'Sofía T.', skin: '#a9c69a', tired: true, mon: 'FC 128 · SpO₂ 86%', col: '#ff4d4d', vit: 'Temp 39,4 °C · FC 128 lpm · SpO₂ 86%', obs: 'Respira con mucha dificultad, tiene los labios azulados y responde con esfuerzo.' },
  ];
  const CHESTS = [
    { room: 'Farmacia', ok: { id: 'suero', icon: '💧', name: 'Suero fisiológico' }, bad: [{ icon: '🍯', name: 'Jarabe para la tos', why: 'El jarabe alivia la tos, pero no es parte de la cura.' }, { icon: '🥤', name: 'Bebida energética', why: 'No es un insumo clínico.' }] },
    { room: 'Sala de curaciones', ok: { id: 'jeringa', icon: '💉', name: 'Jeringa estéril' }, bad: [{ icon: '✂️', name: 'Tijeras', why: 'Sirven para cortar vendajes, no para administrar la cura.' }, { icon: '🩹', name: 'Parche curita', why: 'Es para heridas pequeñas: no sirve para administrar la cura.' }] },
    { room: 'Laboratorio', ok: { id: 'antidoto', icon: '🧪', name: 'Antídoto base (rotulado)' }, bad: [{ icon: '⚗️', name: 'Frasco sin rótulo', why: 'Nunca se usa algo sin rotular: no sabes qué contiene.' }, { icon: '🧫', name: 'Placa de cultivo', why: 'Es una muestra de laboratorio, no un tratamiento.' }] },
    { room: 'Estación de enfermería', ok: { id: 'ficha', icon: '📋', name: 'Ficha del paciente' }, bad: [{ icon: '📰', name: 'Revista', why: 'No aporta información clínica.' }, { icon: '🎮', name: 'Control de videojuego', why: '¡Buen intento! Pero no es un insumo clínico.' }] },
  ];
  const STEPS = [
    { icon: '🧼', name: 'Higiene de manos', hint: 'Antes de tocar al paciente, siempre va la higiene de manos.' },
    { icon: '🪪', name: 'Verificar identidad', hint: 'Antes de administrar algo, confirma con pulsera y ficha que es el paciente correcto.' },
    { icon: '💉', name: 'Administrar la cura', hint: 'La cura se administra solo después de verificar la identidad.' },
    { icon: '📝', name: 'Registrar en la ficha', hint: 'Lo que no se registra, no se hizo: se anota justo después de administrar.' },
    { icon: '🧤', name: 'Retirar EPP + higiene de manos', hint: 'El EPP se retira al final, al terminar la atención.' },
  ];

  G.challenges.enfermeria = {
    id: 'enfermeria',
    tag: 'ENFERMERÍA',
    short: 'Enfermería',
    title: 'Protocolo Z',
    endTitle: '¡Brote contenido!',
    endDelay: 3400,
    learn: ['Autocuidado: entrar protegido a un área clínica.', 'Observación y criterio para priorizar al paciente más grave.', 'Orden y preparación de los insumos de atención.', 'Seguridad del paciente: seguir el protocolo paso a paso.'],
    career: 'Así trabaja un equipo de Enfermería: se protege, observa, prioriza y sigue protocolos para cuidar a las personas.',
    build() {
      G.newScene({ sky: '#0e1820', fog: '#0e1820', fogNear: 16, fogFar: 48, hemi: 0.72, sun: 0.32, ground: 0x6b7c86 });
      const w = G.world;
      const R = { h: 4, floor: 'n_floor', wall: 'n_wall', band: 'n_band', ceil: 'n_ceil', lamp: 'n_lamp' };

      /* --- geometría --- */
      w.room(0, 0, 12, 10, R); // A: vestidor
      w.room(-4, -12, 16, 0, R); // B: triage
      w.room(4, -40, 8, -12, Object.assign({}, R, { floor: 'n_floor2', lamp: null })); // pasillo
      w.room(-4, -21, 4, -13, R); // farmacia
      w.room(8, -21, 16, -13, R); // curaciones
      w.room(-4, -31, 4, -23, R); // laboratorio
      w.room(8, -31, 16, -23, R); // estación
      w.room(-2, -52, 14, -40, Object.assign({}, R, { floor: 'n_floor2' })); // aislamiento
      for (let z = -38; z <= -14; z += 4) w.set(6, 5, z, 'n_alarm');
      [[2, -6], [10, -6], [6, -46], [2, -46], [10, -46]].forEach(([x, z]) => w.set(x, 5, z, 'n_alarm'));
      // vanos de las salas laterales
      w.carve(4, 1, -18, 4, 3, -17);
      w.carve(8, 1, -18, 8, 3, -17);
      w.carve(4, 1, -28, 4, 3, -27);
      w.carve(8, 1, -28, 8, 3, -27);
      // puertas
      const doorA = G.doorCells(5, 1, 0, 7, 3, 0);
      const doorB = G.doorCells(5, 1, -12, 7, 3, -12);
      const doorD = G.doorCells(5, 1, -40, 7, 3, -40);
      doorA.forEach(([x, y, z]) => w.set(x, y, z, 'n_door'));
      doorB.forEach(([x, y, z]) => w.set(x, y, z, 'n_door'));
      doorD.forEach(([x, y, z]) => w.set(x, y, z, 'n_hazard'));
      // mesones y estanterías
      w.fill(1, 1, 2, 1, 1, 8, 'n_counter');
      w.fill(11, 1, 3, 11, 1, 7, 'n_counter');
      w.fill(-3, 1, -20, -3, 2, -14, 'n_shelf');
      w.fill(3, 1, -20, 3, 2, -19, 'n_shelf');
      w.fill(15, 1, -20, 15, 2, -14, 'n_shelf');
      w.fill(-3, 1, -30, -3, 2, -24, 'n_shelf');
      w.fill(15, 1, -30, 15, 1, -24, 'n_counter');
      w.fill(-1, 1, -41, -1, 2, -44, 'n_shelf');
      // cruces decorativas
      w.set(1, 3, 10, 'n_cross');
      w.set(11, 3, 10, 'n_cross');

      /* --- carteles --- */
      const sc = G.scene;
      const s1 = G.sign('ÁREA DE BROTE\nSOLO CON EPP', { w: 3, h: 1, bg: CLR.red });
      s1.position.set(6.5, 4.5, 1.02);
      sc.add(s1);
      const s1b = G.sign('ETAPA 1 · PROTÉGETE', { w: 3.4, h: 0.6, bg: CLR.dark, fg: '#7ff5d9' });
      s1b.position.set(6.5, 3.2, 9.98);
      s1b.rotation.y = Math.PI;
      sc.add(s1b);
      const sB = G.sign('TRIAGE · OBSERVACIÓN', { w: 3.6, h: 0.6, bg: CLR.dark, fg: '#7ff5d9' });
      sB.position.set(6.5, 4.5, -0.02);
      sB.rotation.y = Math.PI;
      sc.add(sB);
      const roomSigns = [
        ['FARMACIA', 5.02, -17, Math.PI / 2],
        ['SALA DE CURACIONES', 7.98, -17, -Math.PI / 2],
        ['LABORATORIO', 5.02, -27, Math.PI / 2],
        ['ESTACIÓN DE ENFERMERÍA', 7.98, -27, -Math.PI / 2],
      ];
      roomSigns.forEach(([t, x, z, ry]) => {
        const s = G.sign(t, { w: 2.2, h: 0.5, bg: CLR.teal });
        s.position.set(x, 4.45, z);
        s.rotation.y = ry;
        sc.add(s);
      });
      const sD = G.sign('AISLAMIENTO\nPROTOCOLO Z', { w: 3, h: 1, bg: '#25282c', fg: '#f2b632' });
      sD.position.set(6.5, 4.5, -38.98);
      sc.add(sD);

      /* =========== ETAPA 1 · EPP =========== */
      const spots = [[1.5, 2.5], [1.5, 4.5], [1.5, 6.5], [1.5, 8.5], [11.5, 3.5], [11.5, 5.5], [11.5, 7.5]];
      let eppCount = 0;
      G.shuffle(EPP).forEach((it, i) => {
        const [x, z] = spots[i];
        const g = new THREE.Group();
        g.position.set(x, 2, z);
        G.box(0.7, 0.05, 0.7, '#ffffff', 0, 0.03, 0, g);
        const e = G.emoji(it.icon, 0.62);
        g.add(e);
        bob(e, 0.45);
        g.add(hitbox(0.8, 0.9, 0.8, 0.45));
        sc.add(g);
        G.interact(g, {
          label: `Tomar: ${it.name}`,
          onUse() {
            G.unInteract(g);
            sc.remove(g);
            G.burst(g.position.clone().add(new V3(0, 0.4, 0)), it.ok ? ['#3ddc84', '#ffffff'] : ['#ff4d4d', '#ffffff'], 14, 2);
            if (it.ok) {
              eppCount++;
              G.sfx.pick();
              G.addItem({ id: it.id, icon: it.icon, name: it.name });
              G.toast(`${it.icon} ${it.name} equipado · EPP ${eppCount}/3`, 'good');
              G.setObjective(`Equípate para entrar al área de brote <b>(${eppCount}/3)</b>`, 'Toma solo lo que te protege. Lo demás se queda fuera.');
              if (eppCount === 3) {
                G.openCells(doorA, CLR.red);
                G.stageDone();
              }
            } else G.mistake(`${it.icon} <b>${it.name}</b>: ${it.why}`);
          },
        });
      });

      /* =========== ETAPA 2 · TRIAGE =========== */
      const bedX = [0.5, 4.5, 8.5, 12.5];
      const order = G.shuffle(PATIENTS);
      let triageTries = 0,
        triageDone = false;
      const levers = [];
      let critIdx = 0;
      order.forEach((p, i) => {
        const x = bedX[i];
        bed(x, -9.9, ['#4d8fd6', '#7d5bd6', '#d6894d', '#4dbfa8'][i]);
        const pr = G.person({ skin: p.skin, shirt: '#cfe0ea', pants: '#cfe0ea', hair: ['#3b2618', '#1c1c1c', '#7a4a1e', '#2a1a10'][i], tired: p.tired, eyes: p.key === 'crit' ? '#3b2030' : undefined });
        pr.rotation.x = -1.25;
        pr.position.set(x, 1.95, -8.85);
        sc.add(pr);
        if (p.key === 'crit') critIdx = i;
        if (p.key === 'deso' || p.key === 'crit') {
          const head = pr.userData.parts.head;
          G.tick((dt, t) => {
            if (!pr.parent) return false;
            head.rotation.y = Math.sin(t * (p.key === 'deso' ? 1.6 : 0.7)) * (p.key === 'deso' ? 0.5 : 0.15);
          });
        }
        const mon = monitor(p.mon, p.col);
        mon.position.set(x, 3.3, -10.95);
        sc.add(mon);
        let ph = 0;
        G.tick((dt) => {
          if (!mon.parent) return false;
          ph += dt * (p.key === 'crit' ? 170 : p.key === 'deso' ? 120 : 80);
          mon.userData.draw(p.mon, p.col, ph);
        });
        const camaS = G.sign(`CAMA ${i + 1}`, { w: 1.1, h: 0.32, bg: CLR.dark, fg: '#ffffff', border: false });
        camaS.position.set(x, 4.15, -10.95);
        sc.add(camaS);
        // ficha a los pies de la cama
        const fic = new THREE.Group();
        fic.position.set(x, 1, -7.62);
        G.box(0.5, 0.65, 0.05, '#f4efe1', 0, 0.95, 0, fic);
        G.box(0.2, 0.08, 0.06, '#9aa7b0', 0, 1.27, 0, fic);
        const fe = G.emoji('📋', 0.45);
        fe.position.set(0, 1.55, 0);
        fic.add(fe);
        bob(fe, 1.55, 0.05);
        fic.add(hitbox(0.7, 0.9, 0.4, 1));
        sc.add(fic);
        G.interact(fic, {
          label: `Revisar ficha · Cama ${i + 1}`,
          onUse() {
            G.modal({
              title: `📋 Cama ${i + 1} · ${p.name}`,
              text: `<div class="ficha"><div class="vit">${p.vit}</div><p>${p.obs}</p></div>`,
              closeLabel: 'Volver (Esc)',
            });
          },
        });
        // palanca de prioridad
        const lv = lever(x + 1.05, -8.3);
        levers.push(lv);
        const ll = G.label('PRIORIDAD', { scale: 1.1, bg: 'rgba(217,52,62,.9)' });
        ll.position.set(x + 1.05, 2.9, -8.3);
        sc.add(ll);
        G.interact(lv, {
          label: `Marcar CAMA ${i + 1} como prioridad`,
          onUse() {
            if (triageDone) return;
            pullLever(lv);
            if (i === critIdx) {
              triageDone = true;
              G.toast(`✅ Correcto: <b>${p.name}</b> tiene dificultad respiratoria y saturación bajo 90%. ¡Se atiende primero!`, 'good', 5200);
              finishTriage();
            } else {
              triageTries++;
              setTimeout(() => (lv.userData.pv.rotation.x = 0.6), 700);
              if (triageTries >= 2) {
                triageDone = true;
                G.mistake('Revisa los síntomas: la prioridad era la cama con dificultad para respirar.');
                G.toast(`La paciente crítica estaba en la <b>CAMA ${critIdx + 1}</b>: SpO₂ 86% y labios azulados.`, 'info', 6000);
                G.burst(new V3(bedX[critIdx], 2.5, -9.5), ['#ff4d4d', '#ffffff'], 30, 3);
                finishTriage(0);
              } else G.mistake('<b>Revisa síntomas.</b> Lee las fichas y los monitores: ¿quién está más grave? (te queda 1 intento)');
            }
          },
        });
      });
      function finishTriage(override) {
        setTimeout(() => G.openCells(doorB, CLR.red), 500);
        G.stageDone(override);
      }

      /* =========== ETAPA 3 · INSUMOS =========== */
      const chestPos = [
        [0.5, -16.5, Math.PI / 2],
        [12.5, -16.5, -Math.PI / 2],
        [0.5, -26.5, Math.PI / 2],
        [12.5, -26.5, -Math.PI / 2],
      ];
      let got = 0;
      CHESTS.forEach((c, i) => {
        const [x, z, ry] = chestPos[i];
        const ch = chest(x, z, ry);
        const lbl = G.label(c.room.toUpperCase(), { scale: 1.9, bg: 'rgba(23,165,139,.92)' });
        lbl.position.set(x, 2.55, z);
        sc.add(lbl);
        const cfg = G.interact(ch, {
          label: `Abrir cofre · ${c.room}`,
          onUse() {
            const opts = G.shuffle([Object.assign({ ok: true }, c.ok), ...c.bad]);
            G.modal({
              title: `🧰 Cofre · ${c.room}`,
              text: 'Elige el insumo que necesitas para preparar la cura.',
              layout: 'cards',
              options: opts.map((o) => ({
                icon: o.icon,
                label: o.name,
                onPick(btn) {
                  if (o.ok) {
                    G.sfx.pick();
                    G.addItem(c.ok);
                    got++;
                    cfg.enabled = false;
                    cfg.disabledLabel = `Cofre vacío · ${c.room}`;
                    ch.userData.lid.rotation.x = -0.9;
                    ch.userData.lid.position.set(0, 0.85, -0.25);
                    G.closeModal();
                    G.toast(`${c.ok.icon} <b>${c.ok.name}</b> reunido · Insumos ${got}/4`, 'good');
                    G.setObjective(`Reúne los insumos para la cura <b>(${got}/4)</b>`, 'Farmacia · Sala de curaciones · Laboratorio · Estación de enfermería');
                    if (got === 4) {
                      G.openCells(doorD, '#f2b632');
                      G.stageDone();
                    }
                  } else {
                    btn.disabled = true;
                    btn.classList.add('wrong');
                    G.mistake(`${o.icon} <b>${o.name}</b>: ${o.why}`);
                  }
                },
              })),
            });
          },
        });
      });
      // infectados en el pasillo
      const inf = [
        { z0: -36, z1: -15, sp: 1.35, x: 6.5, ph: 0 },
        { z0: -38, z1: -22, sp: 1.0, x: 6.2, ph: 0.6 },
      ].map((d) => {
        const p = G.person({ skin: '#8fbf7a', shirt: '#b9cbd3', pants: '#b9cbd3', hair: '#2f3a2a', eyes: '#c23b3b', tired: true });
        p.position.set(d.x, 1, d.z0);
        sc.add(p);
        const tag = G.label('INFECTADO', { scale: 1.1, bg: 'rgba(80,140,60,.9)' });
        tag.position.set(0, 2.25, 0);
        p.add(tag);
        d.p = p;
        d.t = d.ph * (d.z1 - d.z0);
        return d;
      });
      let lastHit = -10;
      G.tick((dt, t) => {
        if (!G.run || G.run.id !== 'enfermeria') return false;
        const P = G.player;
        inf.forEach((d) => {
          if (d.cured) return;
          d.t += dt * d.sp;
          const L = d.z1 - d.z0;
          const k = d.t % (2 * L);
          const dir = k < L ? 1 : -1;
          d.p.position.z = d.z0 + (k < L ? k : 2 * L - k);
          d.p.rotation.y = dir > 0 ? 0 : Math.PI;
          G.walkAnim(d.p, t * 5, 0.45);
          const A = d.p.userData.parts;
          A.armL.rotation.x = -1.35 + Math.sin(t * 5) * 0.12;
          A.armR.rotation.x = -1.35 - Math.sin(t * 5) * 0.12;
          const dx = P.pos.x - d.p.position.x,
            dz = P.pos.z - d.p.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.75 && Math.abs(P.pos.y - 1) < 1 && G.time - lastHit > 1.6) {
            lastHit = G.time;
            const nx = dx / (dist || 1),
              nz = dz / (dist || 1);
            P.push.set(nx * 9, 0, (nz || dir) * 9);
            P.stun = 0.7;
            G.sfx.hit();
            G.flash('rgba(120,255,90,.25)');
            G.toast('🧟 ¡Un infectado te bloqueó el paso! Esquívalo o espera a que se aleje.', 'bad', 2600);
          }
        });
      });

      /* =========== ETAPA 4 · PROTOCOLO =========== */
      bed(6.5, -49.9, '#4dbfa8');
      const pz = G.person({ skin: '#a9c69a', shirt: '#cfe0ea', pants: '#cfe0ea', hair: '#2a1a10', tired: true });
      pz.rotation.x = -1.25;
      pz.position.set(6.5, 1.95, -48.85);
      sc.add(pz);
      const pul = G.box(0.2, 0.08, 0.22, '#ffffff', 0, 0.98, 0.0);
      pz.userData.parts.armR.add(pul);
      pul.position.set(0, -0.62, 0);
      const monD = monitor('CRÍTICO', '#ff4d4d');
      monD.position.set(6.5, 3.3, -50.95);
      sc.add(monD);
      let monState = { txt: 'CRÍTICO', col: '#ff4d4d', sp: 170 },
        monPh = 0;
      G.tick((dt) => {
        if (!monD.parent) return false;
        monPh += dt * monState.sp;
        monD.userData.draw(monState.txt, monState.col, monPh);
      });
      // atril de suero
      const iv = new THREE.Group();
      iv.position.set(7.9, 1, -50.2);
      G.box(0.06, 2.1, 0.06, '#c9d1d6', 0, 1.05, 0, iv);
      G.box(0.6, 0.05, 0.05, '#c9d1d6', 0, 2.1, 0, iv);
      const bag = G.box(0.26, 0.4, 0.1, '#bfe8ff', 0.22, 1.85, 0, iv);
      bag.visible = false;
      sc.add(iv);

      const stepX = [2.5, 4.5, 6.5, 8.5, 10.5];
      let stepNext = 0;
      const stepObjs = [];
      const renderSteps = () =>
        STEPS.map((s, i) => (i < stepNext ? `<span class="ok">${i + 1}. ${s.name} ✔</span>` : i === stepNext ? `<span class="cur">${i + 1}. ¿?</span>` : `<span>${i + 1}. …</span>`)).join(' ');
      G.shuffle(STEPS.map((s, i) => i)).forEach((si, k) => {
        const s = STEPS[si];
        const x = stepX[k],
          z = -45.5;
        const g = new THREE.Group();
        g.position.set(x, 1, z);
        G.box(0.8, 1.0, 0.8, '#2f3d48', 0, 0.5, 0, g);
        const top = G.box(0.82, 0.06, 0.82, '#f2b632', 0, 1.02, 0, g);
        top.material = new THREE.MeshBasicMaterial({ color: '#f2b632' });
        const e = G.emoji(s.icon, 0.6);
        e.position.y = 1.55;
        g.add(e);
        bob(e, 1.55, 0.06);
        const l = G.label(s.name, { scale: 2.0 });
        l.position.y = 2.15;
        g.add(l);
        g.add(hitbox(0.9, 1.6, 0.9, 0.8));
        sc.add(g);
        G.collider(x - 0.4, 1, z - 0.4, x + 0.4, 2, z + 0.4);
        stepObjs.push(g);
        const cfg = G.interact(g, {
          label: `Aplicar paso: ${s.name}`,
          onUse() {
            if (si === stepNext) {
              stepNext++;
              cfg.enabled = false;
              cfg.disabledLabel = `✔ ${s.name}`;
              top.material.color.set('#3ddc84');
              G.sfx.pick();
              G.burst(g.position.clone().add(new V3(0, 1.6, 0)), ['#3ddc84', '#ffffff'], 14, 2);
              if (si === 2) {
                ['antidoto', 'suero', 'jeringa'].forEach((id) => G.removeItem(id));
                bag.visible = true;
                monState = { txt: 'RESPONDIENDO', col: '#ffb23f', sp: 110 };
                G.burst(new V3(6.5, 2.4, -49.5), ['#7ff5d9', '#ffffff', '#3ddc84'], 30, 2.5);
              }
              G.setObjective('Aplica el protocolo de contención en orden', renderSteps());
              if (stepNext === STEPS.length) contain();
            } else G.mistake(`Ese paso no va ahora. <b>Pista:</b> ${STEPS[stepNext].hint}`);
          },
        });
      });
      function contain() {
        monState = { txt: 'ESTABLE', col: '#3ddc84', sp: 70 };
        G.lights.hemi.color.set('#e9fff6');
        alarmOn = false;
        G.BLOCKS.n_alarm.mat.color.set('#3ddc84');
        inf.forEach((d) => {
          d.cured = true;
          d.p.visible = false;
        });
        G.confetti(new V3(6.5, 3, -46));
        G.banner('Protocolo Z', '¡BROTE CONTENIDO!', 3000);
        G.stageDone();
      }

      /* --- alarma --- */
      let alarmOn = true,
        alarmT = 0;
      G.BLOCKS.n_alarm.mat.color.set('#ff3b3b');
      G.tick((dt, t) => {
        if (!G.run || G.run.id !== 'enfermeria') return false;
        if (!alarmOn) return;
        const k = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.4));
        G.BLOCKS.n_alarm.mat.color.setRGB(1, 0.23 * k, 0.23 * k).multiplyScalar(k);
        alarmT += dt;
        if (alarmT > 4) {
          alarmT = 0;
          G.sfx.alarm();
        }
      });

      /* --- marca INACAP: afiches, carteles y fichas --- */
      G.poster('afiche5', 'W', 0, 5.5, 3.62, 1.4);
      G.poster('afiche1', 'E', 12, 5.5, 3.62, 1.4);
      G.wallPlace(G.brandSign('Centro de Simulación · Enfermería', 4.6, 0.75), 'S', 10, 6.5, 4.45);
      G.poster('afiche2', 'W', -4, -5.5, 2.95, 1.8);
      G.poster('afiche1', 'E', 16, -5.5, 2.95, 1.8);
      G.wallPlace(G.brandSign('', 1.6, 0.5), 'W', 4, -22.5, 2.6);
      G.wallPlace(G.brandSign('', 1.6, 0.5), 'E', 8, -22.5, 2.6);
      G.poster('afiche2', 'W', -2, -47, 2.95, 1.8);
      G.poster('afiche5', 'E', 14, -47, 2.95, 1.8);
      G.placeFichas('enfermeria', [[2.5, 1.6, 9], [-1.5, 1.6, -15], [12.5, 1.6, -42]]);

      /* --- etapas --- */
      return {
        spawn: { x: 6.5, y: 1, z: 8.5, yaw: 0 },
        intro: {
          title: '🚨 Protocolo Z',
          text: '<p>Un brote extraño afecta al <b>Centro de Simulación</b>. Algunos pacientes presentan síntomas.</p><p>Eres parte del equipo de apoyo de <b>Enfermería</b> y debes actuar rápido:</p><ol class="steps"><li>Protégete antes de entrar</li><li>Identifica a quién atender primero</li><li>Reúne los insumos para la cura</li><li>Aplica el protocolo final de contención</li></ol>',
        },
        stages: [
          { title: 'Protégete antes de entrar', short: 'EPP', points: 20, objective: 'Equípate para entrar al área de brote <b>(0/3)</b>', sub: 'Toma solo lo que te protege. Lo demás se queda fuera.', skip: () => { G.openCells(doorA); G.stageDone(20); } },
          { title: 'Identifica a los infectados', short: 'Triage', points: 25, objective: 'Revisa las fichas y activa la palanca <b>PRIORIDAD</b> del paciente más grave', sub: 'Observa los monitores y las fichas a los pies de cada cama. Tienes 2 intentos.', skip: () => { triageDone = true; G.openCells(doorB); G.stageDone(25); } },
          { title: 'Reúne los insumos para la cura', short: 'Insumos', points: 30, objective: 'Reúne los insumos para la cura <b>(0/4)</b>', sub: 'Farmacia · Sala de curaciones · Laboratorio · Estación de enfermería', skip: () => { G.openCells(doorD); G.stageDone(30); } },
          { title: 'Protocolo final de contención', short: 'Protocolo', points: 25, objective: 'Aplica el protocolo de contención en orden', sub: renderSteps(), skip: () => { stepNext = 5; contain(); }, onEnter: () => G.setObjective('Aplica el protocolo de contención en orden', renderSteps()) },
        ],
      };
    },
  };
})();
