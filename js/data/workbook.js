/* «Cuaderno del proyecto» (spec §4.4): the 14 sections, their final-copy labels and the session each
   one belongs to. Everything the participant writes stays in this browser (js/core/store.js). */
window.IAHI.data.workbook = {
  title: 'Cuaderno del proyecto',
  lead: 'Aquí se arma, sesión por sesión, el flujo de trabajo con IA que presentará en la sesión 8.',
  banner: 'Lo que escribe aquí se guarda únicamente en este navegador. Exporte su cuaderno para guardarlo en la carpeta del curso.',
  buttons: { export: 'Exportar mi cuaderno (JSON)', import: 'Importar un cuaderno', csv: 'Descargar tablas (CSV)', print: 'Imprimir mi cuaderno', clear: 'Borrar mis datos de este navegador' },
  imported: 'Cuaderno importado.', importError: 'No se pudo leer ese archivo: elija un cuaderno exportado desde este sitio (JSON).',
  progress: 'Avance por sesión', pending: 'Producto pendiente', saved: 'Producto guardado',
  example: 'Ejemplo ilustrativo',
  sections: [
    { id: 'ficha', n: 1, title: 'Ficha del proyecto', sessions: [1], kind: 'template', template: 'B1' },
    { id: 'bitacora', n: 2, title: 'Bitácora de uso de IA', sessions: [1, 2, 3, 4, 5, 6, 7, 8], kind: 'table', template: 'B2', add: 'Agregar uso' },
    { id: 'tickets', n: 3, title: 'Ticket de salida', sessions: [1, 4], kind: 'pairs', pairs: [{ key: 's1', label: 'Sesión 1' }, { key: 's4', label: 'Sesión 4' }], fields: ['Una implicación de la sesión para mi proyecto', 'Una duda'] },
    { id: 'instruccion', n: 4, title: 'Mi instrucción en tres versiones', sessions: [2], kind: 'versions', versions: ['Versión 1', 'Versión 2', 'Versión 3'], fields: ['Qué cambié', 'Error que encontré en las respuestas'] },
    { id: 'auditoria', n: 5, title: 'Miniauditoría de sesgo', sessions: [3], kind: 'fields', fields: ['Tres frases de conclusión sobre los resultados del grupo', 'Diseño de una auditoría para mi proyecto (cinco líneas)'] },
    { id: 'busqueda', n: 6, title: 'Búsqueda comparada', sessions: [4], kind: 'table', columns: ['Herramienta', 'Consulta exacta', 'Fecha', 'Resultados útiles de los 10 primeros', 'Aparecen en más de una herramienta', 'En español'], add: 'Agregar herramienta', refs: 3, refsTitle: 'Tres referencias verificadas' },
    { id: 'skill', n: 7, title: 'Diseño de una skill', sessions: [4, 6], kind: 'widget', widget: 'skill' },
    { id: 'riesgos', n: 8, title: 'Mapa de riesgos de mi proyecto', sessions: [5], kind: 'fields', fields: ['Datos sensibles que tengo', 'Tareas que delegaría a un agente', 'Tareas que nunca delegaría', 'Dónde pondría un punto de control humano'] },
    { id: 'lab1', n: 9, title: 'Laboratorio 1', sessions: [6], kind: 'lab', parts: ['A', 'B', 'C', 'D', 'E'], fields: ['Qué hice', 'Qué verifiqué', 'Tipo de error encontrado', 'Cifra que calculé a mano y cifra del agente'], errors: ['omisión', 'invención', 'mala lectura del método'], files: ['Mi AGENTS.md', 'Mi SKILL.md'] },
    { id: 'antecedentes', n: 10, title: 'Matriz de antecedentes', sessions: [7], kind: 'table', columns: ['Referencia (APA 7)', 'País y periodo', 'Datos', 'Método', 'Hallazgo principal', 'Limitaciones', '¿Verificada?'], checkbox: '¿Verificada?', add: 'Agregar referencia' },
    { id: 'ruta', n: 11, title: 'Ruta de análisis y validación', sessions: [7], kind: 'fields', fields: ['Ruta elegida', 'Qué hice', 'Acuerdo con la codificación humana'] },
    { id: 'flujo', n: 12, title: 'Mi flujo de trabajo', sessions: [7, 8], kind: 'widget', widget: 'flujo' },
    { id: 'declaracion', n: 13, title: 'Declaración de uso de IA', sessions: [8], kind: 'widget', widget: 'declaracion' },
    { id: 'rubrica', n: 14, title: 'Autoevaluación con la rúbrica', sessions: [8], kind: 'widget', widget: 'rubrica' }
  ],
  // the product of each session (content Programa · Mapa de sesiones) → the sections that hold it
  products: { 1: ['ficha', 'bitacora'], 2: ['instruccion'], 3: ['auditoria'], 4: ['busqueda'], 5: ['riesgos'], 6: ['lab1'], 7: ['antecedentes', 'ruta'], 8: ['flujo', 'declaracion'] }
};
