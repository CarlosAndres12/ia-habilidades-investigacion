/* Site copy (spec §2 and §7, final copy). Edit any visible Spanish text of the page here.
   Placeholders in [corchetes] are completed by the facilitator (README · «Completar los marcadores»). */
window.IAHI.data.ui = {
  siteTitle: 'Curso de IA: habilidades para la investigación',
  siteSubtitle: 'en ciencias sociales y económicas',
  fullTitle: 'Curso de IA: habilidades para la investigación en ciencias sociales y económicas',
  skip: 'Saltar al contenido',
  consulted: 'Datos y enlaces consultados el 22 de octubre de 2026.',
  consultedShort: 'Consultado el 22 de octubre de 2026',
  placeholders: {
    institucion: '[Institución]',
    facilitador: '[Nombre del facilitador o la facilitadora]',
    formulario: '[enlace del formulario del curso]',
    carpeta: '[enlace de la carpeta compartida]',
    edad: '[edad alternativa que defina el docente]',
    herramientasSitio: '[herramientas y versiones, fechas de uso]'
  },
  nav: [
    { label: 'Inicio', href: '#/' },
    { label: 'Programa', href: '#/programa' },
    { label: 'Sesiones', menu: 'sesiones' },
    { label: 'Los seis ejes', href: '#/ejes' },
    { label: 'Mi cuaderno', href: '#/cuaderno' },
    { label: 'Plantillas', href: '#/plantillas' },
    { label: 'Recursos', menu: [
      { label: 'Banco de cifras', href: '#/evidencia' },
      { label: 'Herramientas', href: '#/herramientas' },
      { label: 'Glosario', href: '#/glosario' },
      { label: 'Fuentes', href: '#/fuentes' },
      { label: 'Correcciones', href: '#/correcciones' }
    ] },
    { label: 'Proyecto final', href: '#/proyecto' }
  ],
  navClass: 'Modo clase',
  navMenu: 'Menú',
  footer: {
    credit: 'Ilustraciones procedurales originales inspiradas en el lenguaje visual de Joan Miró.',
    version: 'Curso de IA: habilidades para la investigación en ciencias sociales y económicas · Versión del 22 de octubre de 2026',
    who: '[Institución] · [Nombre del facilitador o la facilitadora]',
    transparency: 'Este sitio se construyó a partir del programa del curso, versión del 22 de octubre de 2026. Las ilustraciones y los videos se generan con código y las voces son sintéticas. Los personajes son inventados. Cada cifra muestra su fuente; los enlaces se consultaron el 22 de octubre de 2026. Precios, planes gratuitos, rankings, configuraciones de privacidad y proyectos de ley cambian rápido: revíselos una semana antes de cada sesión.',
    declaration: 'Declaración de uso de IA de este sitio: el guion de los videos, el código del sitio y las voces se produjeron con herramientas de IA ([herramientas y versiones, fechas de uso]). El contenido proviene del programa del curso y fue revisado por [Nombre del facilitador o la facilitadora], quien responde por él.',
    clear: 'Borrar mis datos de este navegador',
    clearConfirm: '¿Seguro? Se borrarán su cuaderno, sus listas de chequeo y las posiciones de los videos guardadas en este navegador. Exporte su cuaderno antes si quiere conservarlo.',
    clearYes: 'Sí, borrar mis datos',
    clearNo: 'Cancelar',
    cleared: 'Se borraron sus datos de este navegador.',
    about: 'Acerca del sitio',
    playerGuide: 'Guía rápida del reproductor'
  },
  storageWarning: 'No se pudo guardar en este navegador: exporte su cuaderno para no perderlo.',
  home: {
    question: '¿Cómo usar la IA con criterio en su propio proyecto de investigación?',
    lead: 'Ocho sesiones remotas de 2 horas (16 horas sincrónicas) para que investigadores de ciencias sociales y económicas, sin formación en programación, usen la IA con criterio en su propio proyecto. Cada tema se explica y se traduce en implicaciones para la investigación: validez, reproducibilidad, transparencia, ética y protección de datos, integridad y equidad.',
    buttons: ['Empezar por la sesión 1', 'Ver el programa', 'Abrir mi cuaderno'],
    ejesTitle: 'Los seis ejes',
    ejesLink: 'Ver los seis ejes',
    routeTitle: 'La ruta del curso',
    howTitle: 'Cómo funciona el curso',
    finalTitle: 'Producto final',
    finalText: 'Un flujo de trabajo con IA, documentado y presentado, para el proyecto de cada participante.',
    finalLink: 'Ver el proyecto final',
    pending: 'Producto pendiente',
    saved: 'Producto guardado',
    before8: 'Entrega 48 horas antes'
  },
  ejes: {
    title: 'Los seis ejes de implicaciones para la investigación',
    lead: 'En cada tema, el bloque «Implicaciones para la investigación» se organiza con estos seis ejes. Son las preguntas que un evaluador, un comité de ética o una revista harán sobre el uso de IA en un proyecto.',
    question: 'Pregunta guía',
    example: 'Ejemplo de decisión',
    byAxis: 'Implicaciones por eje',
    counter: '{n} implicaciones en este eje', counterOne: '1 implicación en este eje',
    goSession: 'Ir a la sesión {n}',
    sixQuestions: 'Seis preguntas antes de usar IA en su proyecto'
  },
  session: {
    before: 'Antes de la sesión',
    product: 'Producto',
    video: 'Video',
    watch: 'Ver el video',
    clase: 'Modo clase',
    print: 'Imprimir la guía de la sesión',
    agenda: 'Agenda (120 min, en línea)',
    agendaOpen: 'Abrir en Modo clase',
    parts: ['Explicación', 'Implicaciones para la investigación', 'Práctica'],
    errors: 'Errores frecuentes de lectura',
    errorsThink: 'Se suele pensar:',
    errorsReal: 'En realidad:',
    products: 'Productos de la sesión',
    deeper: 'Para profundizar',
    teacher: 'Para el docente',
    sources: 'Fuentes (consultadas el 22 de octubre de 2026)',
    prev: '← Sesión anterior',
    next: 'Sesión siguiente →'
  },
  cuaderno: {
    title: 'Cuaderno del proyecto',
    lead: 'Aquí se arma, sesión por sesión, el flujo de trabajo con IA que presentará en la sesión 8.'
  },
  plantillas: { title: 'Plantillas del curso', lead: 'Copie, complete e imprima las plantillas que el curso usa en cada sesión.' },
  evidencia: {
    title: 'Banco de cifras',
    lead: 'Cada cifra del curso con su alcance, su tipo de evidencia y su fuente. Las marcadas «Revisar antes de clase» cambian rápido: verifíquelas una semana antes de cada sesión.',
    filters: { sesion: 'Sesión', tema: 'Tema', tipo: 'Tipo de evidencia', estado: 'Estado', all: 'Todas', allM: 'Todos' },
    howTitle: '¿Cómo leer una cifra?',
    howText: '¿Ensayo aleatorizado revisado por pares, documento de trabajo o comparación hecha por la empresa?, ¿qué tamaño de efecto?, ¿en qué contexto?',
    howLink: 'Jugar: ¿Qué tipo de evidencia es?',
    count: '{n} cifras'
  },
  herramientas: { title: 'Herramientas del curso', note: 'Los planes gratuitos cambian a menudo: revise los límites una semana antes de cada sesión.' },
  glosario: { title: 'Glosario', lead: 'Términos técnicos del curso, explicados en palabras sencillas (programa del curso, Anexos A).', search: 'Buscar un término' },
  fuentes: {
    title: 'Bibliografía y recursos',
    lead: 'Enlaces consultados el 22 de octubre de 2026. Cada artículo, norma o dato citado en las sesiones tiene su enlace donde se usa; esta lista reúne lo principal.',
    bySession: 'Todas las fuentes por sesión'
  },
  correcciones: { title: 'Correcciones', lead: 'Formulaciones que el curso corrige. En cada par, use la primera.', usa: 'Use', noUses: 'No use' },
  proyecto: {
    title: 'Proyecto final: su flujo de trabajo con IA',
    lead: 'Vale el 50 % de la evaluación. Se presenta en la sesión 8, en 8 minutos, y responde a los seis ejes.',
    links: ['Construir mi flujo', 'Autoevaluarme con la rúbrica', 'Escribir mi declaración de uso de IA']
  },
  clase: {
    choose: 'Elija la sesión',
    start1: 'Antes de compartir pantalla: cierre correos, notificaciones y documentos con datos de participantes; comparta una ventana, no todo el escritorio.',
    start2: 'Se graban las plenarias, no las salas de grupos.',
    startBtn: 'Empezar',
    over: 'Este bloque ya pasó su tiempo previsto.',
    clockStart: 'Iniciar', clockPause: 'Pausar', clockReset: 'Reiniciar',
    timer: 'Temporizador',
    notes: 'Notas',
    pause: 'Pausa: lejos de la pantalla',
    exit: 'Salir del Modo clase',
    keys: 'Teclas: ← y → (o RePág y AvPág) cambian de diapositiva; N muestra las notas; T abre el temporizador; Esc sale.'
  },
  acerca: {
    title: 'Acerca del sitio',
    fiction: 'Personajes inventados: Mariana, Julián, Amparo, la Dra. Rojas y Tomás no son personas reales; se crearon para ilustrar el caso común del curso.'
  },
  notFound: 'No encontramos esta página.',
  backHome: 'Volver al inicio'
};
