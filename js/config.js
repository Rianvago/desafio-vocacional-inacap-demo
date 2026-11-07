/* =========================================================================
   TEXTOS EDITABLES DEL DEMO
   Cambia aquí las frases, la fecha o el contenido del código QR
   sin tocar el resto del código.
   ========================================================================= */
window.CONFIG = {
  sede: 'Sede Valparaíso',
  evento: '21 de noviembre de 2026',

  // Modo kiosco: el juego parte directo en la pantalla donde cada estudiante escribe
  // sus datos (nombre y apellido, RUT, celular, email y colegio) y juega.
  // Ponlo en false para volver a la bienvenida con QR + código y PIN.
  modoKiosco: true,

  // ===== BASE DE DATOS (Google Sheets) =====
  // Pega aquí la URL de la "Aplicación web" de Apps Script (termina en /exec).
  // Si queda vacío, el demo funciona sin conexión: todo se guarda solo en este computador.
  apiUrl: '',

  // Página de inscripción que abre el código QR cuando la base de datos está conectada.
  urlInscripcion: 'https://rianvago.github.io/desafio-vocacional-inacap-demo/inscripcion.html',

  // Texto del QR mientras NO hay base de datos conectada (modo demo).
  qrTexto: 'DEMO - Inscripcion Desafio Vocacional INACAP Sede Valparaiso',

  // Frases de las "Fichas INACAP" que se recolectan dentro del juego (3 por desafío).
  fichas: {
    enfermeria: [
      'Cuidar a otros empieza por cuidarte a ti.',
      'Observar con atención es la primera herramienta de Enfermería.',
      'Practicar en simulación te prepara para el mundo real.',
    ],
    diseno: [
      'El diseño es la forma en que una idea se vuelve visible.',
      'Cada videojuego empezó como un boceto.',
      'Crear, probar y mejorar: así trabaja la industria digital.',
    ],
  },
  puntosPorFicha: 2,
};
