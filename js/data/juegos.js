/* Sorting games (spec §8.0, §8.1, §8.11, §8.15, §8.16, §8.17). Keys come from the content's tables;
   every card has an explanation and a hint. Games built from a content table name it in `from`
   and are assembled at run time from js/data (so the key always matches the table). */
window.IAHI.data.juegos = {
  'tipo-modelo': {
    title: '¿De qué tipo es este modelo?',
    session: 1, topic: '1.3',
    intro: 'Arrastre cada modelo a su categoría, o use el teclado: Tab para llegar a una tarjeta, Enter para tomarla, flechas para elegir la categoría y Enter para soltarla.',
    bins: ['Código abierto', 'Pesos abiertos', 'Cerrado'],
    explain: {
      'Código abierto': 'Según la OSI, se publican los pesos, el código de entrenamiento e información suficiente sobre los datos para reconstruir el modelo.',
      'Pesos abiertos': 'Se publican solo los pesos entrenados, con su licencia.',
      'Cerrado': 'No se publica nada: el acceso es solo por app o API.'
    },
    hints: {
      'Código abierto': 'Busque si publica también el código de entrenamiento y la información sobre los datos.',
      'Pesos abiertos': 'Se pueden descargar los pesos, pero no todo lo necesario para reconstruir el modelo.',
      'Cerrado': 'Solo se usa por app o API.'
    },
    cards: [
      { text: 'Olmo 3', bin: 'Código abierto' }, { text: 'Apertus', bin: 'Código abierto' }, { text: 'SmolLM3', bin: 'Código abierto' },
      { text: 'DeepSeek', bin: 'Pesos abiertos' }, { text: 'Qwen', bin: 'Pesos abiertos' }, { text: 'Kimi', bin: 'Pesos abiertos' },
      { text: 'GLM', bin: 'Pesos abiertos' }, { text: 'MiMo', bin: 'Pesos abiertos' }, { text: 'Gemma 4', bin: 'Pesos abiertos' },
      { text: 'gpt-oss', bin: 'Pesos abiertos' }, { text: 'Muse Spark Open', bin: 'Pesos abiertos' },
      { text: 'Claude', bin: 'Cerrado' }, { text: 'GPT', bin: 'Cerrado' }, { text: 'Gemini', bin: 'Cerrado' }, { text: 'Muse Wonder', bin: 'Cerrado' }, { text: 'Grok', bin: 'Cerrado' },
      { text: 'Latam-GPT', bin: 'Pesos abiertos',
        explain: 'Es Llama 3.1 70B reentrenado y conserva la licencia de Llama: según la OSI, es de pesos abiertos, aunque se presenta como de código abierto.',
        hint: 'Mire qué publicó y con qué licencia, no cómo se presenta.' }
    ],
    note: 'Ejemplos de octubre de 2026, según el programa del curso.',
    noteBadge: 'Revisar antes de clase'
  },

  'tipo-evidencia': {
    title: '¿Qué tipo de evidencia es?',
    session: 3, topic: '3.2',
    intro: 'Clasifique cada resultado por su tipo de evidencia: la pregunta del curso es si viene de un ensayo, de un documento de trabajo o de una comparación hecha por la empresa.',
    bins: ['Ensayo o experimento', 'Documento de trabajo', 'Preprint', 'Análisis preliminar', 'Proyección', 'Dato del proveedor'],
    hint: 'Mire quién lo publica, si tuvo revisión por pares y si describe algo que ya pasó o algo que se espera.',
    cards: [
      { text: 'Tamizaje de cáncer de mama con apoyo de IA en Suecia (MASAI)', bin: 'Ensayo o experimento', fig: 'avance.masai', explain: 'Ensayo MASAI, Suecia: un país y un sistema; la reducción de cánceres de intervalo no fue significativa.' },
      { text: 'Tutoría con GPT-4 en Nigeria', bin: 'Documento de trabajo', fig: 'avance.nigeria', explain: 'Documento de trabajo del Banco Mundial sin revisión por pares.' },
      { text: 'Acceso a GPT-4 sin guía en estudiantes de secundaria (PNAS, 2025)', bin: 'Ensayo o experimento', fig: 'avance.pnas-retiro', explain: 'Ensayo con estudiantes de secundaria; PNAS, 2025.' },
      { text: 'Menos tiempo en tareas de escritura (Noy y Zhang)', bin: 'Ensayo o experimento', fig: 'avance.noy-zhang', explain: 'Experimento de productividad; Noy y Zhang, 2023.' },
      { text: 'La similitud de GPT con las respuestas de cada país (Atari et al.)', bin: 'Preprint', explain: 'Atari et al., 2023, es un preprint: todavía no tiene revisión por pares.' },
      { text: 'Artículos con referencias inexistentes en PubMed Central', bin: 'Análisis preliminar', fig: 'referencias.pubmed', explain: 'Según un análisis preliminar publicado en The Lancet en 2026.' },
      { text: 'Electricidad de los centros de datos en 2030', bin: 'Proyección', fig: 'geo.energia-2030', explain: 'Los centros de datos llegarían a unos 945 TWh en 2030: es una proyección de la AIE.' },
      { text: 'Las comparaciones de desempeño de Undermind', bin: 'Dato del proveedor', fig: 'herr.undermind', explain: 'Sus comparaciones de desempeño las hizo la propia empresa.' }
    ]
  },

  'piezas-agente': {
    title: '¿Skill, subagente, plugin o conector?',
    session: 4, topic: '4.3',
    intro: 'Ubique cada analogía y cada ejemplo en la pieza que le corresponde.',
    from: 'herramientas.piezas',
    bins: ['Skill', 'Subagente', 'Plugin', 'Conector (MCP)'],
    hint: 'Piense si es un instructivo, un auxiliar, un paquete o un puente.'
  },

  'chat-asistente-agente': {
    title: '¿Chat, asistente o agente?',
    session: 5, topic: '5.1',
    intro: 'Clasifique cada descripción y cada pedido según el tipo de sistema.',
    bins: ['Chat', 'Asistente con herramientas', 'Agente'],
    hint: '¿Recibe una pregunta o un objetivo? ¿Quién ejecuta?',
    explain: {
      'Chat': 'Un chat recibe una pregunta y responde con texto; la persona copia y pega.',
      'Asistente con herramientas': 'Un asistente con herramientas recibe una pregunta y busca en la web, lee archivos o ejecuta código, dentro de la conversación.',
      'Agente': 'Un agente recibe un objetivo, planea pasos, usa herramientas, revisa resultados y corrige hasta terminar, sobre archivos, programas o páginas web.'
    },
    cards: [
      { text: 'Responde con texto', bin: 'Chat' },
      { text: 'La persona copia y pega', bin: 'Chat' },
      { text: '«¿Qué es la informalidad laboral?»', bin: 'Chat' },
      { text: 'Busca en la web, lee archivos o ejecuta código para responder', bin: 'Asistente con herramientas' },
      { text: 'El sistema ejecuta dentro de la conversación', bin: 'Asistente con herramientas' },
      { text: '«Busca cinco estudios recientes sobre informalidad en Colombia»', bin: 'Asistente con herramientas' },
      { text: 'Recibe un objetivo', bin: 'Agente' },
      { text: 'Planea pasos, usa herramientas, revisa resultados y corrige hasta terminar', bin: 'Agente' },
      { text: 'Actúa sobre archivos, programas o páginas web', bin: 'Agente' },
      { text: '«Organiza estos 30 PDF, extrae sus datos a una tabla y escribe una síntesis comparativa»', bin: 'Agente' }
    ]
  },

  'reducir-riesgo': {
    title: '¿Cómo se reduce este riesgo?',
    session: 5, topic: '5.4',
    intro: 'Lleve cada medida al riesgo que reduce.',
    from: 'riesgos.riesgos',
    hint: 'Busque la medida que corta el camino del riesgo.'
  }
};
