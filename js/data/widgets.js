/* Widgets of spec §8: their copy (final copy of the spec), where each one lives on the site, and the
   figures and course signs each topic shows (from the deck table of spec §4.6). Edit any text here. */
window.IAHI.data.widgets = {
  // ---------------------------------------------------------------- where widgets appear (session → topic prefix)
  placements: {
    1: { '1.2': ['tres-epocas', 'linea-tiempo'], '1.3': ['juego:tipo-modelo', 'foto-aa'], '1.4': ['playground'], 'Cierre': ['lista:B8'] },
    2: { '2.1': ['temperatura'], '2.2': ['razon-tokens'], '2.5': ['instruccion'], '2.6': ['instruccion-practica'] },
    3: { '3.1': ['escala', 'debate', 'clausula'], '3.2': ['juego:tipo-evidencia'], '3.3': ['auditoria'] },
    4: { '4.1': ['verificar'], 'Taller': ['busqueda-comparada'], '4.3': ['juego:piezas-agente', 'skill'] },
    5: { '5.1': ['juego:chat-asistente-agente'], '5.4': ['juego:reducir-riesgo', 'inyeccion', 'riesgos'], 'Preparación': ['lista:B6'] },
    6: { 'Organización': ['lista:B6'], 'Parte A': ['laboratorio-1'] },
    7: { 'Parte A': ['laboratorio-2'], 'Cierre': ['flujo'] },
    8: { 'Estructura': ['presentaciones'], 'Rúbrica': ['rubrica'], 'Cierre del curso': ['declaracion'] }
  },
  // figures and course-sign diagrams shown in each topic's «Explicación» (spec §4.6 table); a diagram
  // is the last frame of the video scene that draws that course sign ('video:scene')
  topics: {
    1: { '1.1': { scenes: ['v1:niveles', 'v1:caja-negra'] }, '1.2': { scenes: ['v1:linea', 'v1:motores'] }, '1.3': { figs: ['ecosistema.latamgpt', 'aa.indice-def'], scenes: ['v1:categorias'] }, '1.4': { scenes: ['v1:neurona', 'v1:montana', 'v1:sobreajuste'] }, 'Cierre': { scenes: ['v1:caso'] } },
    2: { '2.1': { figs: ['deriva.gpt4-primos'], scenes: ['v2:ciclo'] }, '2.2': { figs: ['tokens.ingles', 'tokens.espanol'], scenes: ['v2:tokens', 'v2:limites'] }, '2.3': { figs: ['embeddings.alphaearth', 'embeddings.garg'], scenes: ['v2:mapa', 'v2:municipios'] }, '2.4': { scenes: ['v2:banco', 'v2:familias'] }, '2.5': { figs: ['prompts.sclar'], scenes: ['v2:seis-partes', 'v2:bucle'] } },
    3: { '3.1': { figs: ['unesco.recomendacion', 'ram.stem', 'ram.internet', 'onu.panel', 'ue.ley-ia', 'conpes.4144', 'colombia.ley', 'sic.002', 'ley1581.art26', 'sic.005', 'nih.2023', 'privacidad.chatgpt', 'privacidad.claude', 'privacidad.gemini'], scenes: ['v3:privacidad'] },
      '3.2': { figs: ['avance.alphafold', 'avance.graphcast', 'avance.aifs', 'avance.masai', 'avance.nigeria', 'avance.pnas-retiro', 'avance.tumaini', 'avance.pobreza-jean', 'avance.pobreza-rwi', 'avance.pobreza-indonesia', 'avance.noy-zhang', 'avance.brynjolfsson', 'avance.frontera', 'avance.hao', 'avance.imo', 'anotacion.gilardi', 'referencias.walters', 'referencias.pubmed', 'referencias.sin-correccion'], scenes: ['v3:avances'] },
      '3.3': { figs: ['tokens.espanol', 'curso.auditoria'], scenes: ['v3:sesgo', 'v3:auditoria'] }, '3.4': { figs: ['abliteracion.arditi', 'censura.nist'], scenes: ['v3:abliterado'] },
      '3.5': { figs: ['geo.inversion', 'geo.computo', 'geo.chips', 'geo.cobre', 'geo.energia-2024', 'geo.energia-2030', 'geo.nube-gpu', 'geo.ilia', 'geo.brasil-gpu', 'geo.china-meta', 'geo.brasil-plan', 'geo.exportacion'], scenes: ['v3:recursos'] } },
    4: { '4.1': { figs: ['busqueda.bases', 'herr.undermind', 'herr.consensus', 'herr.consensus-gratis', 'herr.elicit', 'herr.connected'], scenes: ['v4:ciclo-busqueda'] }, 'Taller': { figs: ['curso.taller-busqueda'] }, '4.2': { scenes: ['v4:proyecto'] }, '4.3': { scenes: ['v4:skill'] } },
    5: { '5.1': { scenes: ['v5:ciclo-agente'] }, '5.2': { scenes: ['v5:entornos', 'v5:estandares'] }, '5.3': { figs: ['avance.pnas-retiro'], scenes: ['v5:demo'] }, '5.4': { figs: ['casos.preprints'], scenes: ['v5:permisos', 'v5:casos'] }, 'Preparación': { figs: ['lab1.opencode', 'lab1.claude', 'lab1.chatgpt', 'lab1.baratos', 'curso.clinica'] } },
    6: { 'Elegir': { figs: ['lab1.opencode', 'lab1.claude', 'lab1.chatgpt', 'lab1.baratos'] }, 'Organización': { figs: ['curso.grupo'], scenes: ['v6:organizacion'] }, 'Materiales': { figs: ['curso.lab-ia'], scenes: ['v6:carpeta'] }, 'Agenda': { figs: ['curso.agenda-lab1'] } },
    7: { 'Herramientas': { figs: ['lab2.notebook', 'lab2.datavoyager', 'lab2.claude-archivos', 'lab2.researchrabbit'], scenes: ['v7:gancho'] }, 'Agenda': { figs: ['curso.agenda-lab2', 'curso.parte-a-lab2'] } },
    8: { 'Antes': { figs: ['curso.entrega'] }, 'Agenda': { figs: ['curso.galeria'] }, 'Estructura': { figs: ['curso.presentacion'], scenes: ['v8:estructura'] }, 'Rúbrica': { figs: ['curso.rubrica', 'curso.evaluacion', 'curso.certificacion'], scenes: ['v8:rubrica'] }, 'Cierre del curso': { scenes: ['v8:ideas'] } }
  },
  // lab guides draw these inside their steps (§8.20, §8.22)
  labScenes: { 'B': 'v6:literatura', 'A2': 'v7:pregunta', 'A2m': 'v7:matriz', 'B2': 'v7:rutas', 'B2c': 'v7:ruta-2' },
  // stamps shown on each session view (spec §3.2)
  stamps: { 1: ['stamp-estimaciones', 'stamp-pesos'], 2: ['stamp-plausible', 'stamp-instruccion'], 3: ['stamp-fuente', 'stamp-autora', 'stamp-censura'], 4: ['stamp-fuente', 'stamp-citar'], 5: ['stamp-responsabilidad', 'stamp-oculto'], 6: ['stamp-responsabilidad', 'stamp-carpeta'], 7: ['stamp-fuente', 'stamp-interpretacion'], 8: ['stamp-metodo'] },

  // ---------------------------------------------------------------- «Modo clase» (spec §4.6 and §7)
  // one slide per agenda block; `topic` names the session part whose explanation gives the points;
  // `scenes` are the course-sign diagrams (video scenes) and `figs` the bank's cards on the slide.
  deck: {
    1: [
      { id: 's1-01', title: 'Apertura', agenda: 'Apertura', scenes: ['v1:gancho'] },
      { id: 's1-02', title: '1.1 Definiciones', topic: '1.1', scenes: ['v1:niveles', 'v1:caja-negra'] },
      { id: 's1-03', title: '1.2 Línea de tiempo', topic: '1.2', scenes: ['v1:linea', 'v1:motores'] },
      { id: 's1-04', title: 'Demo: la misma pregunta, tres épocas', topic: '1.2', practice: true, scenes: ['v1:eliza'] },
      { id: 's1-05', title: 'Pausa', pause: true },
      { id: 's1-06', title: '1.3 Ecosistema de modelos', topic: '1.3', figs: ['ecosistema.latamgpt', 'aa.cerrados', 'aa.abiertos', 'aa.brecha', 'aa.muse-spark', 'aa.indice-def'], scenes: ['v1:categorias'] },
      { id: 's1-07', title: '1.4 Redes neuronales', topic: '1.4', scenes: ['v1:neurona', 'v1:montana', 'v1:sobreajuste'] },
      { id: 's1-08', title: 'Cierre', topic: 'Cierre', scenes: ['v1:caso'] }
    ],
    2: [
      { id: 's2-01', title: 'Apertura', agenda: 'Apertura' },
      { id: 's2-02', title: '2.1 Cómo funciona un LLM', topic: '2.1', figs: ['deriva.gpt4-primos'], scenes: ['v2:ciclo'] },
      { id: 's2-03', title: '2.2 Tokens', topic: '2.2', figs: ['tokens.ingles', 'tokens.espanol'], scenes: ['v2:tokens', 'v2:limites'] },
      { id: 's2-04', title: '2.3 Embeddings', topic: '2.3', figs: ['embeddings.alphaearth', 'embeddings.garg'], scenes: ['v2:mapa', 'v2:municipios'] },
      { id: 's2-05', title: 'Pausa', pause: true },
      { id: 's2-06', title: '2.4 Arquitecturas y atención', topic: '2.4', scenes: ['v2:banco', 'v2:familias'] },
      { id: 's2-07', title: '2.5 Prompts', topic: '2.5', figs: ['prompts.sclar'], scenes: ['v2:seis-partes', 'v2:bucle'] },
      { id: 's2-08', title: '2.6 Práctica en chats', topic: '2.6', scenes: ['v2:seis-partes'] }
    ],
    3: [
      { id: 's3-01', title: 'Apertura', agenda: 'Apertura', figs: ['curso.escala'], scenes: ['v3:gancho'] },
      { id: 's3-02', title: '3.1 Marcos éticos', topic: '3.1', figs: ['unesco.recomendacion', 'ram.stem', 'ram.internet', 'onu.panel', 'ue.ley-ia', 'conpes.4144', 'colombia.ley', 'sic.002', 'privacidad.chatgpt', 'privacidad.claude', 'privacidad.gemini'], scenes: ['v3:privacidad'] },
      { id: 's3-03', title: 'Debate estructurado', topic: '3.1', practice: true, figs: ['curso.debate'] },
      { id: 's3-04', title: '3.2 Grandes avances y sus límites', topic: '3.2', figs: ['avance.alphafold', 'avance.graphcast', 'avance.aifs', 'avance.masai', 'avance.nigeria', 'avance.pnas-retiro', 'avance.tumaini', 'avance.pobreza-jean', 'avance.pobreza-rwi', 'avance.pobreza-indonesia', 'avance.noy-zhang', 'avance.brynjolfsson', 'avance.frontera', 'avance.hao', 'avance.imo', 'anotacion.gilardi', 'referencias.walters', 'referencias.pubmed', 'referencias.sin-correccion'], scenes: ['v3:avances'] },
      { id: 's3-05', title: 'Pausa', pause: true },
      { id: 's3-06', title: '3.3 Sesgo en un LLM', topic: '3.3', figs: ['tokens.espanol', 'curso.auditoria'], scenes: ['v3:sesgo', 'v3:auditoria'] },
      { id: 's3-07', title: '3.4 Modelos abliterados y sin censura', topic: '3.4', figs: ['abliteracion.arditi', 'censura.nist'], scenes: ['v3:abliterado'] },
      { id: 's3-08', title: '3.5 Geopolítica de la IA', topic: '3.5', figs: ['geo.inversion', 'geo.computo', 'geo.chips', 'geo.cobre', 'geo.energia-2024', 'geo.energia-2030', 'geo.nube-gpu', 'geo.ilia', 'geo.brasil-gpu', 'geo.china-meta', 'geo.brasil-plan', 'geo.exportacion'], scenes: ['v3:recursos'] },
      { id: 's3-09', title: 'Cierre', agenda: 'Cierre', figs: ['curso.escala'], scenes: ['v3:gancho'] }
    ],
    4: [
      { id: 's4-01', title: 'Apertura', agenda: 'Apertura' },
      { id: 's4-02', title: '4.1 Agentes de búsqueda académica', topic: '4.1', figs: ['busqueda.bases', 'herr.undermind', 'herr.consensus', 'herr.consensus-gratis', 'herr.elicit', 'herr.connected'], scenes: ['v4:ciclo-busqueda'] },
      { id: 's4-03', title: 'Taller: la misma pregunta en varias herramientas', topic: 'Taller', figs: ['curso.taller-busqueda'] },
      { id: 's4-04', title: 'Pausa', pause: true },
      { id: 's4-05', title: '4.2 Del chat a los proyectos', topic: '4.2', scenes: ['v4:proyecto'] },
      { id: 's4-06', title: '4.3 Skills, subagentes y plugins', topic: '4.3', scenes: ['v4:skill'] },
      { id: 's4-07', title: 'Cierre', topic: 'Productos' }
    ],
    5: [
      { id: 's5-01', title: 'Apertura', agenda: 'Apertura' },
      { id: 's5-02', title: '5.1 Diferencias', topic: '5.1', scenes: ['v5:ciclo-agente'] },
      { id: 's5-03', title: '5.2 Entornos', topic: '5.2', scenes: ['v5:entornos', 'v5:estandares'] },
      { id: 's5-04', title: 'Pausa', pause: true },
      { id: 's5-05', title: '5.3 Usos', topic: '5.3', figs: ['avance.pnas-retiro'], scenes: ['v5:demo'] },
      { id: 's5-06', title: '5.4 Peligros', topic: '5.4', figs: ['casos.preprints'], scenes: ['v5:permisos', 'v5:casos'] },
      { id: 's5-07', title: 'Preparación del Laboratorio 1', topic: 'Preparación', figs: ['lab1.opencode', 'lab1.claude', 'lab1.chatgpt'] }
    ],
    6: [
      { id: 's6-00', title: 'Antes de empezar: salas y semáforo', topic: 'Organización', figs: ['curso.lab-ia'], scenes: ['v6:organizacion'] },
      { id: 's6-01', title: 'A. Arranque', topic: 'Parte A', figs: ['curso.agenda-lab1'], scenes: ['v6:carpeta'] },
      { id: 's6-02', title: 'B. Literatura', topic: 'Parte B', scenes: ['v6:literatura'] },
      { id: 's6-03', title: 'Pausa', pause: true },
      { id: 's6-04', title: 'C. Datos', topic: 'Parte C', scenes: ['v6:carpeta'] },
      { id: 's6-05', title: 'D. Instrucciones reutilizables', topic: 'Parte D', scenes: ['v4:skill'] },
      { id: 's6-06', title: 'E. Cierre', topic: 'Parte E', scenes: ['v6:carpeta'] }
    ],
    7: [
      { id: 's7-01', title: 'Apertura', agenda: 'Apertura', figs: ['curso.agenda-lab2'], scenes: ['v7:rutas'] },
      { id: 's7-02', title: 'A. Estado del arte', topic: 'Parte A', figs: ['curso.parte-a-lab2', 'curso.pdfs-lab2', 'lab2.notebook'], scenes: ['v7:pregunta', 'v7:matriz'] },
      { id: 's7-03', title: 'Pausa', pause: true },
      { id: 's7-04', title: 'B. Análisis de información', topic: 'Parte B', figs: ['lab2.datavoyager', 'lab2.claude-archivos', 'lab2.ram-local', 'lab2.modelos-locales', 'curso.libro-codigos', 'validacion.krippendorff'], scenes: ['v7:rutas', 'v7:ruta-2'] },
      { id: 's7-05', title: 'Cierre', topic: 'Cierre', scenes: ['v7:caso'] }
    ],
    8: [
      { id: 's8-01', title: 'Apertura', agenda: 'Apertura', figs: ['curso.presentacion', 'curso.rubrica'], scenes: ['v8:rubrica'] },
      { id: 's8-02', title: 'Presentaciones, bloque 1', topic: 'Estructura', figs: ['curso.presentacion'], scenes: ['v8:estructura'] },
      { id: 's8-03', title: 'Pausa', pause: true },
      { id: 's8-04', title: 'Presentaciones, bloque 2', topic: 'Estructura', figs: ['curso.presentacion'], scenes: ['v8:estructura'] },
      { id: 's8-05', title: 'Cierre', topic: 'Cierre del curso', scenes: ['v8:ideas'], stamp: 'stamp-metodo' }
    ]
  },
  pauseSlide: { title: 'Pausa: lejos de la pantalla', minutes: 10 },
  seeVideo: 'Ver en video',
  // activity timers of «Modo clase» (spec §7), with the content's times
  claseTimers: {
    1: [{ title: 'Actividad en Artificial Analysis', segments: [['Actividad en Artificial Analysis', 15]] }, { title: 'Taller: TensorFlow Playground', segments: [['Taller: TensorFlow Playground', 10]] }],
    2: [{ title: 'Práctica en chats', segments: [['Trabajo individual', 10], ['Salas de grupos de 3', 10], ['Plenaria', 5]] }],
    3: [{ title: 'Debate estructurado', debate: true }, { title: 'Miniauditoría de sesgo', segments: [['Miniauditoría en salas de pares', 12], ['Resultados', 5]] }, { title: 'Actividad de geopolítica', segments: [['Actividad de geopolítica', 10]] }],
    4: [{ title: 'Taller: la misma pregunta en varias herramientas', segments: [['Taller: la misma pregunta en varias herramientas', 30]] }, { title: 'Diseño de una skill', segments: [['Diseño de una skill', 15], ['Revisión en salas de pares', 5]] }],
    5: [{ title: 'Demo en vivo', segments: [['Demo en vivo', 15]] }, { title: 'Demo de inyección', segments: [['Demo de inyección', 5]] }, { title: 'Mapa de riesgos', segments: [['Mapa de riesgos', 10]] }],
    6: [{ title: 'Laboratorio 1 (partes A a E)', segments: [['Plenaria de arranque', 3], ['A. Arranque', 12], ['B. Literatura', 25], ['Pausa', 10], ['C. Datos', 30], ['Plenaria', 3], ['D. Instrucciones reutilizables', 17], ['E. Cierre', 20]] }],
    7: [{ title: 'Laboratorio 2 (partes A y B)', segments: [['Apertura', 10], ['A. Estado del arte', 50], ['Pausa', 10], ['B. Análisis de información', 40], ['Cierre', 10]] },
        { title: 'Parte A en cinco pasos', segments: [['Pregunta estructurada', 5], ['Buscar', 15], ['Mapear', 5], ['Leer con fuentes', 15], ['Extraer y verificar', 10]], notices: { 30: 'Control en plenaria a los 30 minutos', 50: 'Control en plenaria a los 50 minutos' } }],
    8: [{ title: 'Temporizador de presentaciones', presentations: true }]
  },

  // ---------------------------------------------------------------- 8.2 La misma pregunta, tres épocas
  'tres-epocas': {
    title: 'La misma pregunta, tres épocas',
    panels: ['ELIZA (1966)', 'GPT-2 (2019)', 'Un chat actual'],
    question: 'What are the main causes of informal employment in Latin America?',
    translation: '¿Cuáles son las principales causas del empleo informal en América Latina?',
    guessLabel: '¿Qué cree que responderá?',
    reveal: 'Ver lo que registra el curso',
    elizaAnswer: 'En una prueba respondió: «How would an answer to that help you?» (¿En qué le ayudaría una respuesta a eso?)',
    otherAnswer: 'El curso no registra una respuesta fija: haga la prueba en clase con el cuaderno de Colab o el Transformer Explainer, y con un chat actual en español.',
    after: ['La fluidez no es veracidad. Weizenbaum se alarmó de que la gente atribuyera comprensión a su programa: es el efecto ELIZA.', '¿Qué cambió entre las tres respuestas? Tamaño, datos y ajuste para seguir instrucciones.'],
    links: ['findingeliza', 'masswerk-eliza', 'transformer-explainer']
  },
  // ---------------------------------------------------------------- 8.3 Foto de referencia de Artificial Analysis
  'foto-aa': {
    title: 'Foto de referencia de Artificial Analysis',
    buttons: ['Ambos grupos', 'Solo cerrados', 'Solo pesos abiertos'],
    groups: ['Cerrados (6 mejores)', 'Pesos abiertos (6 mejores)'],
    scale: { from: 0, to: 60, step: 10, unit: 'puntos del índice' },
    tableTitle: 'Mi tabla de modelos (actividad 1.3)',
    notes: ['Foto del 22 de octubre de 2026. El ranking cambia cada semana: en clase, ábralo en vivo.', 'El índice promedia evaluaciones, casi todas en inglés: el desempeño en español no aparece ahí.'],
    csv: 'Descargar CSV'
  },
  // ---------------------------------------------------------------- 8.4 Línea de tiempo
  'linea-tiempo': {
    title: 'Línea de tiempo de la IA',
    why: 'Por qué importa',
    winters: 'Mostrar los inviernos de la IA',
    last: 'El estado de 2026 se ve en vivo en la actividad 1.3.',
    keys: 'Use ← y → para recorrer los hitos.'
  },
  // ---------------------------------------------------------------- 8.5 TensorFlow Playground
  playground: {
    title: 'TensorFlow Playground, paso a paso',
    link: 'tensorflow-playground',
    roles: 'Una persona comparte pantalla y la otra dirige; a mitad del ejercicio cambian de rol.',
    field: 'En una frase: ¿qué aporta cada capa adicional?',
    save: 'Guardar en mi cuaderno'
  },
  // ---------------------------------------------------------------- 8.6 Temperatura
  temperatura: {
    title: 'Temperatura',
    prompt: 'La informalidad laboral en Colombia es',
    candidates: ['alta', 'persistente', 'estructural', 'un'],
    slider: 'Temperatura', low: 'baja', high: 'alta',
    pick: 'Elegir un token', reset: 'Reiniciar',
    note: 'Ejemplo ilustrativo: las proporciones son inventadas para mostrar el efecto de la temperatura; no vienen de un modelo real.',
    badge: 'Esquema',
    link: 'transformer-explainer', linkText: 'Pruébelo con un modelo real en el Transformer Explainer.'
  },
  // ---------------------------------------------------------------- 8.7 Razón de tokens
  'razon-tokens': {
    title: 'Razón de tokens',
    es: 'Tokens del párrafo en español', en: 'Tokens del mismo párrafo en inglés',
    error: 'Escriba un número entero mayor que cero.',
    result: 'Su párrafo en español ocupa {x} veces los tokens de la versión en inglés.',
    note: 'Su resultado depende del tokenizador y del texto: no es una medición general.',
    fig: 'tokens.espanol', links: ['tiktokenizer', 'tokenization-fairness']
  },
  // ---------------------------------------------------------------- 8.8 Constructor de instrucciones
  instruccion: {
    title: 'Constructor de instrucciones',
    fields: ['Contexto', 'Tarea', 'Insumos', 'Criterios', 'Formato', 'Honestidad'],
    save: ['Guardar como versión 1', 'Guardar como versión 2', 'Guardar como versión 3'],
    copy: 'Copiar',
    loopTitle: 'Bucle de mejora',
    reminder: 'Pruebe la instrucción sin datos sensibles.',
    saved: 'Guardada en su cuaderno como versión {n}.'
  },
  // ---------------------------------------------------------------- 8.9 Escala
  escala: {
    title: '¿La IA amplía o estrecha la ciencia?',
    low: 'Estrecha', high: 'Amplía',
    moments: ['Al inicio de la sesión', 'Al final de la sesión'],
    both: 'Sus dos respuestas',
    note: 'Su respuesta queda solo en este navegador; la encuesta del grupo se hace en la videollamada.'
  },
  // ---------------------------------------------------------------- 8.10 Debate
  debate: {
    title: 'Tarjetas del debate',
    motion: 'Las entidades públicas deberían usar aprendizaje automático para focalizar subsidios sociales, por ejemplo en un instrumento como el SISBÉN',
    motionLabel: 'Moción',
    alt: 'Debería ser obligatorio declarar todo uso de IA en tesis y artículos',
    altLabel: 'Moción alternativa',
    roles: [
      { title: 'A favor', text: 'Prepare su apertura en la sala de su bando: 3 minutos de apertura y 2 de réplica en plenaria.' },
      { title: 'En contra', text: 'Prepare su apertura en la sala de su bando: 3 minutos de apertura y 2 de réplica en plenaria.' },
      { title: 'Jurado', text: 'Acuerde con el resto del jurado cómo aplicarán sus dos criterios: los principios de la UNESCO y la prueba de idoneidad, necesidad, razonabilidad y proporcionalidad de la Circular 002. El jurado cierra con 2 minutos de preguntas y vota por encuesta.' }
    ],
    timerTitle: 'Temporizador del debate',
    timer: [['Salas por bando', 5], ['Apertura a favor', 3], ['Apertura en contra', 3], ['Réplica a favor', 2], ['Réplica en contra', 2], ['Preguntas del jurado', 2], ['Veredicto', 3]],
    readingsTitle: 'Lecturas del debate'
  },
  // ---------------------------------------------------------------- 8.12 Miniauditoría de sesgo
  auditoria: {
    title: 'Miniauditoría de sesgo',
    selector: 'Atributo asignado a su pareja de trabajo',
    attributes: [
      { label: 'Género', a: 'Andrés', b: 'Andrea' },
      { label: 'Región de origen', a: 'Quibdó', b: 'Bogotá' },
      { label: 'Edad', a: '28 años', b: '[edad alternativa que defina el docente]' }
    ],
    versionA: 'Versión A', versionB: 'Versión B',
    table: ['Modelo', 'Versión', 'Corrida', 'Respuesta (pesos)'],
    addRow: 'Agregar corrida',
    average: 'Promedio por versión', difference: 'Diferencia entre versiones',
    empty: 'Todavía no hay corridas: el resultado aparece cuando usted registre las suyas.',
    csv: 'Descargar CSV para la hoja compartida', csvHead: ['pareja', 'modelo', 'versión', 'respuesta'],
    pair: 'Nombre de la pareja',
    reminders: ['Corra cada versión al menos tres veces en dos modelos distintos, porque las respuestas varían.', 'Con pocas observaciones, una diferencia puede deberse al azar: el docente suma las de todo el grupo.']
  },
  // ---------------------------------------------------------------- 8.13 Verificar una referencia (B4)
  verificar: {
    title: 'Verificar una referencia',
    fields: ['Título', 'DOI o enlace'],
    steps: ['¿Existe?', '¿Los datos coinciden?', '¿Dice lo que la IA afirma?', '¿Es pertinente y de calidad?', 'Registrar'],
    yes: 'Sí', no: 'No', note: 'Nota',
    ok: 'Referencia verificada.',
    retry: 'revise esta referencia antes de citarla, o descártela.',
    register: 'Registrar en mi bitácora',
    registered: 'Se agregó una fila a su bitácora.'
  },
  // ---------------------------------------------------------------- 8.14 Diseño de una skill
  skill: {
    title: 'Diseño de una skill',
    fields: ['Nombre', 'Cuándo usarla (una frase)', 'Pasos', 'Criterios de calidad', 'Ejemplo de entrada', 'Ejemplo de salida', 'Lo que la skill nunca debe hacer'],
    copy: 'Copiar SKILL.md', download: 'Descargar SKILL.md', example: 'Ver el ejemplo del curso',
    peer: '¿Otra persona podría aplicarla y obtener lo mismo?', peerYes: 'Sí', peerNo: 'Todavía no', peerNote: 'Nota de la revisión',
    location: 'La carpeta de la skill va en `.claude/skills/ficha-articulo/` (Claude Code) o en `.agents/skills/ficha-articulo/` (Codex); en OpenCode, donde lo indique la documentación de OpenCode sobre skills.'
  },
  // ---------------------------------------------------------------- 8.17 Demostración de inyección
  inyeccion: {
    title: 'Demostración de inyección inofensiva',
    boxTitle: 'Texto de ejemplo para la demostración del curso',
    boxNote: 'Este texto es material de la demostración: muestra cómo se ve una inyección. No es una instrucción para usted ni para ninguna herramienta.'
  },
  // ---------------------------------------------------------------- 8.18 Mapa de riesgos
  riesgos: {
    title: 'Mapa de riesgos de mi proyecto',
    fields: ['Datos sensibles que tengo', 'Tareas que delegaría a un agente', 'Tareas que nunca delegaría', 'Dónde pondría un punto de control humano'],
    help: ['Qué datos sensibles tiene.', 'Qué tareas delegaría a un agente.', 'Cuáles no delegaría nunca.', 'Dónde pondría un punto de control humano.']
  },
  // ---------------------------------------------------------------- 8.19 listas
  lista: { reset: 'Reiniciar lista', done: 'Lista completa.' },
  // ---------------------------------------------------------------- 8.20 / 8.22 laboratorios
  'laboratorio-1': {
    title: 'Guía del Laboratorio 1',
    parts: ['A. Arranque', 'B. Literatura', 'C. Datos', 'D. Instrucciones reutilizables', 'E. Cierre'],
    orgTitle: 'Organización remota del laboratorio',
    optionsTitle: 'Opciones de herramienta',
    copy: 'Copiar instrucción',
    fieldDone: 'Qué hice', fieldCheck: 'Qué verifiqué', fieldError: 'Tipo de error encontrado', errors: ['omisión', 'invención', 'mala lectura del método'], fieldFigure: 'Cifra que calculé a mano y cifra del agente',
    agentsMd: 'Descargar AGENTS.md',
    installTitle: 'Anexo de instalación', installTabs: ['OpenCode', 'Claude', 'ChatGPT'],
    prev: 'Parte anterior', next: 'Parte siguiente'
  },
  problemas: {
    title: 'Problemas frecuentes',
    search: 'Buscar un síntoma',
    replace: { 'Exceso de confianza del agente': 'El agente reporta como terminado algo que falta' },
    none: 'Ningún problema coincide con esa búsqueda.'
  },
  'laboratorio-2': {
    title: 'Guía del Laboratorio 2',
    partA: 'Parte A. Estado del arte', partB: 'Parte B. Análisis de información', closing: 'Cierre',
    chooseRoute: 'Elija una ruta',
    routes: ['Ruta 1. Datos cuantitativos', 'Ruta 2. Textos y entrevistas', 'Ruta 3. Datos sensibles con un modelo local'],
    ollama: 'En Ollama, los modelos marcados como «cloud» no corren en su computador: no los use para datos sensibles.',
    matrixTitle: 'Matriz de antecedentes', verified: '¿Verificada?', addRow: 'Agregar referencia',
    closingLink: 'Construir mi flujo de trabajo'
  },
  // ---------------------------------------------------------------- 8.23 Calculadora de acuerdo
  acuerdo: {
    title: 'Calculadora de acuerdo',
    codesTitle: 'Mis códigos', codes: ['ingreso', 'protección social', 'autonomía', 'barreras para formalizarse', 'sin código'],
    human: 'Código humano', ai: 'Código de la IA', fragment: 'Fragmento',
    addRow: 'Agregar fragmento', paste: 'Pegar dos columnas', pasteHelp: 'Pegue dos columnas separadas por tabulador o punto y coma: código humano y código de la IA, un fragmento por línea.',
    example: 'Cargar un ejemplo', exampleBadge: 'Ejemplo ilustrativo',
    results: { pct: 'Acuerdo porcentual', kappa: 'Kappa de Cohen', alpha: 'Alfa de Krippendorff (nominal, dos codificadores)', precision: 'Precisión', recall: 'Exhaustividad' },
    reading: {
      high: 'Confiable según la referencia de Krippendorff',
      mid: 'Conclusiones solo provisionales',
      low: 'Por debajo de la referencia: revise los errores por categoría y por subgrupo. Si el resultado no alcanza el umbral que usted fijó de antemano, ajuste el libro de códigos, no la instrucción para forzar el resultado, y repita con una muestra nueva.'
    },
    exampleHuman: ['A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B'],
    exampleAi: ['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B', 'A'],
    exampleCodes: ['A', 'B'],
    save: 'Copiar resultados a mi cuaderno', saved: 'Resultados guardados en su cuaderno.',
    need: 'Registre al menos dos fragmentos con código humano y código de la IA.'
  },
  // ---------------------------------------------------------------- 8.24 Mi flujo de trabajo
  flujo: {
    title: 'Mi flujo de trabajo',
    fields: { stage: 'Etapa', tool: 'Herramienta', purpose: 'Para qué', check: 'Punto de control humano', which: '¿Cuál?', axes: 'Ejes que atiende' },
    yes: 'Sí', no: 'No',
    add: 'Agregar etapa', remove: 'Quitar etapa', up: 'Subir', down: 'Bajar',
    notDo: 'Lo que decidimos no hacer con IA',
    print: 'Imprimir en una página', png: 'Descargar imagen (PNG)',
    diagram: 'Diagrama de mi flujo',
    empty: 'Agregue la primera etapa de su flujo.'
  },
  // ---------------------------------------------------------------- 8.25 Temporizador de presentaciones
  presentaciones: {
    title: 'Temporizador de presentaciones',
    add: 'Agregar presentación', name: 'Presentación o equipo',
    commenters: ['Comentarista 1: pertinencia, validez y reproducibilidad', 'Comentarista 2: ética, equidad y claridad'],
    segments: [['Proyecto y pregunta', 1], ['Flujo de trabajo', 3], ['Evidencia', 2], ['Implicaciones y decisiones', 1], ['Declaración de uso de IA', 1], ['Preguntas', 2]],
    notices: { 6: 'Aviso: 6 minutos', 8: 'Aviso: 8 minutos, pasen a las preguntas' },
    team: 'Equipo (máximo 10 minutos)',
    gallery: 'Galería virtual', galleryText: '5 minutos por equipo, dos rondas y, al final, cinco equipos de 5 minutos en plenaria.',
    galleryTimer: [['Presentación del equipo', 5]]
  },
  // ---------------------------------------------------------------- 8.26 Rúbrica
  rubrica: {
    title: 'Autoevaluación con la rúbrica',
    level: 'Nivel',
    result: 'Puntaje orientativo: {x} de 4',
    note: 'Es solo una orientación: la calificación la hacen los comentaristas y el docente.'
  },
  // ---------------------------------------------------------------- 8.27 / 8.28 plantillas B5 y B9
  declaracion: { title: 'Declaración de uso de IA', fill: 'Completar con mi bitácora', note: 'Ajustar a la política de la revista o del programa.' },
  clausula: { title: 'Cláusula de consentimiento sobre uso de IA', warning: 'Modelo para ajustar con el comité de ética y la oficina de protección de datos de su institución.', optionA: '[Opción A]', optionB: '[Opción B]', ifApplies: '[Si aplica]' },
  // ---------------------------------------------------------------- generic
  timer: { start: 'Iniciar', pause: 'Pausar', reset: 'Reiniciar', sound: 'Activar sonido', soundOff: 'Desactivar sonido', segmentEnd: 'Terminó: {s}', next: 'Siguiente: {s}' },
  table: { add: 'Agregar fila', remove: 'Quitar fila', csv: 'Descargar CSV' },
  plantilla: { copy: 'Copiar', print: 'Imprimir', save: 'Guardar en mi cuaderno', preview: 'Vista previa', saved: 'Guardado en su cuaderno.', toWorkbook: 'Usar en mi cuaderno' },
  juego: { counter: '{n} de {N}', done: 'Clasificó todas las tarjetas.', restart: 'Volver a empezar', drop: 'Soltar en', pick: 'Tomar la tarjeta', bins: 'Categorías' },
  busqueda: { title: 'Búsqueda comparada (taller)', save: 'Guardar en mi cuaderno' }
};
