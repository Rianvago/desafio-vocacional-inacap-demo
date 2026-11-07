/* =========================================================================
   CONEXIÓN CON LA BASE DE DATOS (Google Sheets + Apps Script)
   - Si CONFIG.apiUrl está vacío, el juego funciona sin conexión (como antes).
   - Los puntajes se guardan en una cola local y se reintentan si no hay internet.
   ========================================================================= */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const C = window.CONFIG || {};
  const api = (G.api = { url: String(C.apiUrl || '').trim() });
  api.on = () => !!api.url;

  // Petición simple (sin cabeceras extra) para que Google la acepte desde cualquier página
  async function req(method, params, body) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const u = method === 'GET' ? api.url + (api.url.includes('?') ? '&' : '?') + new URLSearchParams(params) : api.url;
      const r = await fetch(u, { method, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal, redirect: 'follow' });
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  }
  api.inscribir = (datos) => req('POST', null, { accion: 'inscribir', datos });
  api.ingresar = (codigo, pin) => req('POST', null, { accion: 'ingresar', codigo, pin });
  api.ranking = (desafio, n = 8) => req('GET', { accion: 'ranking', desafio, n });
  api.estado = () => req('GET', { accion: 'estado' });

  /* ---------- cola de puntajes (no se pierde nada si se corta internet) ---------- */
  const QK = 'demoVocacional_cola';
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(QK) || '[]');
    } catch (e) {
      return [];
    }
  };
  const save = (l) => {
    try {
      localStorage.setItem(QK, JSON.stringify(l));
    } catch (e) {}
  };
  let flushing = null;
  async function flush(wantId) {
    if (!api.on()) return null;
    if (flushing) await flushing;
    let res = null;
    flushing = (async () => {
      for (const p of load()) {
        let r;
        try {
          r = await req('POST', null, Object.assign({ accion: 'puntaje' }, p));
        } catch (e) {
          break; // sin conexión: se reintenta más tarde
        }
        // Se saca de la cola si se guardó, o si la planilla lo rechazó (no tiene sentido reintentar)
        if (r && (r.ok || r.error)) save(load().filter((x) => x.id !== p.id));
        if (p.id === wantId) res = r;
      }
    })();
    await flushing;
    flushing = null;
    return res;
  }
  api.flush = flush;
  api.pendientes = () => load().length;
  api.enviarPuntaje = (p) => {
    save(load().concat([p]));
    return flush(p.id);
  };
  if (api.on()) {
    setInterval(flush, 30000);
    window.addEventListener('online', () => flush());
    setTimeout(flush, 3000);
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  /* ---------- al terminar una partida ---------- */
  G.afterResults = async function (r, el) {
    if (!api.on() || r.presenter) return;
    const box = el.querySelector('.r-rank');
    const st = document.createElement('div');
    st.className = 'r-net';
    box.prepend(st);
    const p = G.participant;
    if (r.code && p && p.token) {
      st.innerHTML = '⏳ Enviando tu puntaje a la planilla oficial…';
      const count = (k) => r.bonus.filter((b) => b.kind === k).length;
      const res = await api.enviarPuntaje({ id: uid(), codigo: r.code, token: p.token, desafio: r.id, puntaje: r.result.total, tiempo: Math.round(r.result.time), errores: r.errors, fichas: r.fichas.length, secretos: count('secreto'), preguntas: count('pregunta') });
      st.innerHTML =
        res && res.ok
          ? `✅ Puntaje guardado en el ranking oficial${res.puesto ? ` · <b>Puesto #${res.puesto} de ${res.total}</b>` : ''}`
          : res && res.error
          ? `⚠️ La planilla no aceptó el puntaje: ${G.escapeHtml(res.error)}`
          : '📶 Sin conexión: tu puntaje quedó guardado y se enviará solo cuando vuelva internet.';
    } else st.innerHTML = 'ℹ️ Partida sin inscripción: este puntaje no entra al ranking oficial.';
    try {
      const rk = await api.ranking(r.id, 8);
      if (!rk || !rk.ok) return;
      const div = document.createElement('div');
      div.className = 'r-online';
      div.innerHTML =
        `<h4>🏆 Ranking oficial · en línea</h4><ol>` +
        rk.ranking.map((x) => `<li class="${p && x.nombre === `${p.nombre} ${String(p.apellido).charAt(0)}.` ? 'me' : ''}"><span>${G.escapeHtml(x.nombre)} <small class="dim">${G.escapeHtml(x.establecimiento || '')}</small></span><b>${x.puntaje}</b><i>${G.fmtTime(x.tiempo)}</i></li>`).join('') +
        `</ol>${rk.ranking.length ? '' : '<p class="dim">Aún no hay puntajes.</p>'}`;
      st.after(div);
      const local = box.querySelector('h4:not(.r-online h4)');
      if (local) local.textContent = 'Ranking · este computador';
    } catch (e) {}
  };
})();
