/* VoltIQ — JavaScript nativo (sin jQuery)
   1. Gráfico de telemetría en <canvas> a 60 FPS
   2. Validación del formulario con clases de Bootstrap
   3. Cierre automático del menú colapsable en móvil */
'use strict';

/* ---------- 1. Telemetría en canvas ---------- */
(() => {
  const canvas = document.getElementById('graficoTelemetria');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MAX_PUNTOS = 240;          // ~4 s de historia a 60 FPS
  const LIMITE_KW = 420;            // demanda contratada
  const Y_MAX = 500;
  const fases = [
    { nombre: 'L1', color: '#5b93ff', base: 300, datos: [] },
    { nombre: 'L2', color: '#ff8a3d', base: 292, datos: [] },
    { nombre: 'L3', color: '#34d399', base: 284, datos: [] },
  ];
  let t = 0, pausado = reduceMotion, picoRestante = 0, picoTurno = 0, ultimoAnuncio = 0;

  // Nitidez en pantallas HiDPI: escalar el búfer según devicePixelRatio
  function ajustarResolucion() {
    const dpr = window.devicePixelRatio || 1;
    const ancho = canvas.clientWidth;
    const alto = ancho * (360 / 900);
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function muestrear() {
    t += 1;
    const extra = picoRestante > 0 ? 160 * Math.sin((picoRestante / 90) * Math.PI) : 0;
    if (picoRestante > 0) picoRestante -= 1;
    fases.forEach((f, i) => {
      const valor = f.base
        + 35 * Math.sin(t / 45 + i * 2.1)
        + 12 * Math.sin(t / 9 + i)
        + (Math.random() - 0.5) * 14
        + extra * (1 - i * 0.25);
      f.datos.push(Math.max(0, valor));
      if (f.datos.length > MAX_PUNTOS) f.datos.shift();
    });
  }

  function dibujar() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const pad = { l: 46, r: 12, t: 14, b: 26 };
    const y = (v) => pad.t + (1 - v / Y_MAX) * (h - pad.t - pad.b);
    const x = (i) => pad.l + (i / (MAX_PUNTOS - 1)) * (w - pad.l - pad.r);

    ctx.clearRect(0, 0, w, h);

    // Rejilla y etiquetas del eje Y
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = 'rgba(148,163,184,.18)';
    ctx.lineWidth = 1;
    for (let v = 0; v <= Y_MAX; v += 100) {
      ctx.beginPath(); ctx.moveTo(pad.l, y(v)); ctx.lineTo(w - pad.r, y(v)); ctx.stroke();
      ctx.fillText(String(v), 6, y(v) + 4);
    }
    ctx.fillText('kW', 6, h - 6);

    // Línea de límite contratado
    ctx.save();
    ctx.setLineDash([6, 6]); ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.l, y(LIMITE_KW)); ctx.lineTo(w - pad.r, y(LIMITE_KW)); ctx.stroke();
    ctx.restore();

    // Series
    fases.forEach((f) => {
      const n = f.datos.length;
      if (n < 2) return;
      const offset = MAX_PUNTOS - n;
      ctx.beginPath();
      f.datos.forEach((v, i) => (i ? ctx.lineTo(x(i + offset), y(v)) : ctx.moveTo(x(i + offset), y(v))));
      ctx.strokeStyle = f.color; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.stroke();
      // Etiqueta del último valor
      const ultimo = f.datos[n - 1];
      ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(x(MAX_PUNTOS - 1), y(ultimo), 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  function actualizarKPIs(ahora) {
    const ultimos = fases.map((f) => f.datos[f.datos.length - 1] || 0);
    const total = ultimos.reduce((a, b) => a + b, 0);
    const prom = total / 3;
    const desb = (Math.max(...ultimos.map((v) => Math.abs(v - prom))) / prom) * 100;
    picoTurno = Math.max(picoTurno, total);
    const fmt = (n) => n.toLocaleString('es-VE', { maximumFractionDigits: 0 });

    document.getElementById('kpiTotal').textContent = fmt(total);
    document.getElementById('kpiPico').textContent = fmt(picoTurno);
    document.getElementById('kpiDesb').textContent = desb.toFixed(1).replace('.', ',');

    const enAlerta = ultimos.some((v) => v > LIMITE_KW);
    const alerta = document.getElementById('alerta');
    alerta.textContent = enAlerta ? '⚠ Demanda sobre el límite contratado' : 'Operación normal';
    alerta.className = 'badge-status ' + (enAlerta ? 'badge-status--alert' : 'badge-status--ok');

    // Anuncio para lectores de pantalla como máximo cada 5 s
    if (ahora - ultimoAnuncio > 5000) {
      ultimoAnuncio = ahora;
      document.getElementById('lecturaAccesible').textContent =
        `Demanda total ${fmt(total)} kilovatios. ${enAlerta ? 'Alerta: sobre el límite.' : 'Operación normal.'}`;
    }
  }

  let ultimoKpi = 0;
  function bucle(ahora) {
    if (!pausado) {
      muestrear();
      dibujar();
      if (ahora - ultimoKpi > 250) { actualizarKPIs(ahora); ultimoKpi = ahora; } // DOM a 4 Hz
    }
    requestAnimationFrame(bucle);   // sincronizado con el refresco (≈60 FPS)
  }

  // Precarga de historia para que el primer fotograma ya muestre datos
  for (let i = 0; i < MAX_PUNTOS; i++) muestrear();
  ajustarResolucion();
  dibujar();
  actualizarKPIs(performance.now());
  requestAnimationFrame(bucle);

  window.addEventListener('resize', () => { ajustarResolucion(); dibujar(); });

  const btnPausa = document.getElementById('btnPausa');
  const sincronizarBoton = () => {
    btnPausa.textContent = pausado ? 'Reanudar' : 'Pausar';
    btnPausa.setAttribute('aria-pressed', String(pausado));
  };
  sincronizarBoton();
  btnPausa.addEventListener('click', () => { pausado = !pausado; sincronizarBoton(); });
  document.getElementById('btnPico').addEventListener('click', () => {
    picoRestante = 90;
    if (pausado) { pausado = false; sincronizarBoton(); }
  });
})();

/* ---------- 2. Validación del formulario ---------- */
(() => {
  const form = document.getElementById('formCotizacion');
  if (!form) return;
  const resultado = document.getElementById('formResultado');
  const mensaje = document.getElementById('mensaje');
  const contador = document.getElementById('mensaje-contador');

  // Feedback por campo: .is-valid / .is-invalid + aria-invalid
  const marcar = (campo) => {
    if (campo.type === 'checkbox' && !campo.required) return;
    const ok = campo.checkValidity();
    campo.classList.toggle('is-valid', ok);
    campo.classList.toggle('is-invalid', !ok);
    campo.setAttribute('aria-invalid', String(!ok));
  };

  form.querySelectorAll('input, textarea').forEach((campo) => {
    campo.addEventListener('blur', () => marcar(campo));
    campo.addEventListener('input', () => { if (campo.classList.contains('is-invalid') || campo.classList.contains('is-valid')) marcar(campo); });
  });

  mensaje.addEventListener('input', () => { contador.textContent = `${mensaje.value.length} / 500 caracteres`; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('was-validated');
    form.querySelectorAll('input, textarea').forEach(marcar);

    if (!form.checkValidity()) {
      const primero = form.querySelector(':invalid');
      if (primero) primero.focus();       // lleva el foco al primer error (WCAG 3.3.1)
      return;
    }
    const datos = Object.fromEntries(new FormData(form));
    resultado.textContent = `¡Gracias, ${datos.nombre}! Recibimos su solicitud para ${datos.medidores} medidor(es). Le escribiremos a ${datos.email}.`;
    resultado.classList.remove('d-none');
    resultado.focus();
    form.reset();
    form.classList.remove('was-validated');
    form.querySelectorAll('.is-valid, .is-invalid').forEach((el) => el.classList.remove('is-valid', 'is-invalid'));
    contador.textContent = '0 / 500 caracteres';
  });

  form.addEventListener('reset', () => {
    form.classList.remove('was-validated');
    form.querySelectorAll('.is-valid, .is-invalid').forEach((el) => el.classList.remove('is-valid', 'is-invalid'));
    resultado.classList.add('d-none');
  });
})();

/* ---------- 3. Cerrar menú hamburguesa al elegir un enlace (móvil) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('menuPrincipal');
  if (!menu || !window.bootstrap) return;
  const collapse = bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false });
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => { if (menu.classList.contains('show')) collapse.hide(); })
  );
});
