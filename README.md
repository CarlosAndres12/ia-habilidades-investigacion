# Curso de IA: habilidades para la investigación en ciencias sociales y económicas

Sitio de acompañamiento del curso: 8 sesiones remotas, un video narrado por sesión, «Modo clase» para proyectar, plantillas, banco de cifras y el «Cuaderno del proyecto» de cada participante. Funciona **sin conexión**.

> **Antes de cada clase, la persona facilitadora revisa cada guion y cada cifra.** El contenido proviene del programa del curso (versión del 22 de octubre de 2026) y los videos se generan con código; las voces son sintéticas. Precios, planes gratuitos, rankings, configuraciones de privacidad y proyectos de ley cambian rápido: revíselos una semana antes de cada sesión.

## 1. Abrir el sitio

- Haga doble clic en `index.html`. No necesita internet, cuentas ni instalar nada.
- Navegadores recomendados: Chrome, Edge o Firefox recientes. En pantallas pequeñas el menú se abre con «Menú».
- Los enlaces externos (lecturas, herramientas, videos) se abren en una pestaña nueva y llevan la etiqueta «enlace externo».

### Servir la carpeta en local (opcional)

Algunas funciones del navegador no están disponibles cuando la página se abre como archivo (`file://`), sobre todo **grabar un video con su voz**. Para habilitarlas, sirva la carpeta en local:

```
cd ia-habilidades-investigacion
python3 -m http.server 8000
```

y abra `http://localhost:8000/`. (Cualquier servidor estático sirve; no hace falta conexión a internet.)

## 2. Dónde se editan los textos y los datos

Todo lo que el sitio muestra o dice está en `js/data/`. No hace falta tocar el código de dibujo.

| Qué | Archivo |
|---|---|
| Textos de las páginas (menú, pie, títulos, introducciones) | `js/data/ui.js` |
| Sesiones, agendas, glosario, plantillas, bibliografía, tablas | `js/data/sesiones/s1.js` … `s8.js`, `schedule.js`, `glosario.js`, `plantillas.js`, `bibliografia.js`, `herramientas.js`, `riesgos.js`, `rubrica.js`… (se **generan** desde `content/curso-ia-habilidades.md` con `node tools/dev/build-content.mjs`) |
| Videos: escenas, textos en pantalla, voces, pausas, capítulos | `js/data/videos.js` (se **genera** desde `especificacion-curso.md` §11 con `node tools/dev/build-data.mjs`) |
| Banco de cifras y fuentes | `js/data/figures.js`, `js/data/sources.js` (se generan desde la especificación §4.1 y §4.2) |
| Juegos, widgets, «Modo clase» (diapositivas y temporizadores) | `js/data/juegos.js`, `js/data/widgets.js` |
| Cuaderno del proyecto (secciones y etiquetas) | `js/data/workbook.js` |
| Enunciados prohibidos (revisión automática) | `js/data/forbidden.js` |

La fuente de verdad es el programa del curso (`content/curso-ia-habilidades.md`). Si cambia el programa, vuelva a generar los datos (`node tools/dev/build-content.mjs`) y revise el sitio. Si cambia la especificación (`../especificacion-curso.md`), ejecute `node tools/dev/build-data.mjs`.

Después de editar, ejecute las revisiones:

```
node tools/check-figures.mjs     # cifras trazables y enunciados prohibidos
node tools/check-style.mjs       # aislamiento del estilo y paleta (abre Chromium sin ventana)
node tools/check-links.mjs       # enlaces: todo enlace sale del archivo del curso
node tools/dev/frame-checks.mjs  # videos: textos cortados o fuera de su espacio, tarjetas, subtítulos
```

### Actualizar una cifra que cambia (precios, planes gratuitos, rankings, privacidad, proyectos de ley)

1. Edite su fila en `js/data/figures.js` (o en la especificación §4.1 y regenere): `cifra`, `alcance` con la nueva fecha y `estado`.
2. Actualice su fuente en `js/data/sources.js` si cambió el enlace. **Nunca vuelva a escribir el valor en otro lugar**: tarjetas, gráficos y diapositivas leen el banco.
3. Ejecute `node tools/check-figures.mjs` y `node tools/dev/frame-checks.mjs` (un texto más largo puede no caber en su tarjeta o en su línea de los videos).

Las voces no dicen estos valores, así que no hay que regenerar el audio. **La única excepción** es V1 · escena `ranking`, que dice la foto fechada del 22 de octubre de 2026: si reemplaza esa foto, edite la fecha y los valores de esa línea en la especificación (§11, V1), regenere los datos y vuelva a generar la voz de V1 (`node tools/generate-voiceover.mjs --only v1`).

### Revisar antes de cada sesión

En «Banco de cifras», filtre por «Estado: Revisar antes de clase». Son las cifras que el programa pide verificar una semana antes de cada sesión: rankings de Artificial Analysis (`aa.*`), privacidad de ChatGPT, Claude y Gemini (`privacidad.*`), la Ley de IA europea (`ue.ley-ia`), el proyecto de ley colombiano (`colombia.ley`), precios y planes de herramientas (`herr.*`, `lab1.*`, `lab2.*`). Cada tarjeta muestra «Consultado el 22 de octubre de 2026».

### Cambiar el caso común

El programa permite reemplazar «informalidad laboral en Colombia» por un caso más cercano al grupo. Cambian:

- el contenido (`content/curso-ia-habilidades.md`) y, con él, `js/data/sesiones/*.js`, `plantillas.js` (por ejemplo, AGENTS.md y la skill de ejemplo), `sesgo.js` y `riesgos.js` (regenerar con `build-content.mjs`);
- en los videos, las escenas del hilo del caso: el capítulo final «En el caso de la informalidad laboral» de cada video (escenas `caso`), y las escenas que citan el caso: V1 `gancho`; V2 `similar`; V4 `revision`; V5 `diferencias`; V6 `carpeta`, `literatura`, `datos`; V7 `pregunta`, `ruta-2`. Edite sus textos en la especificación §11 y regenere `videos.js`;
- los personajes (Mariana, Julián, Amparo, la Dra. Rojas y Tomás) son inventados y **nunca deben decir resultados inventados**: dicen qué van a medir, verificar o registrar.

### Completar los marcadores

En `js/data/ui.js` (bloque `placeholders` y pie de página) y en los textos que los usan:

- «[Institución]» y «[Nombre del facilitador o la facilitadora]»: pie de página y «Acerca del sitio».
- «[enlace del formulario del curso]» y «[enlace de la carpeta compartida]»: los que entregue a su grupo.
- «[edad alternativa que defina el docente]»: miniauditoría de sesgo (`js/data/widgets.js`, `auditoria.attributes`).
- «[herramientas y versiones, fechas de uso]»: la declaración de uso de IA del sitio, en el pie.

### Grupos grandes (sesión 8, variante de galería)

En «Modo clase» de la sesión 8, abra el temporizador (tecla T) y marque «Galería virtual»: 5 minutos por equipo, dos rondas y, al final, cinco equipos de 5 minutos en plenaria (cifra `curso.galeria`).

### El cuaderno de los participantes

- Se guarda **solo en el navegador** de cada participante (almacenamiento local). Nadie más lo ve.
- «Exportar mi cuaderno (JSON)» descarga un archivo para guardarlo en la carpeta del curso; «Importar un cuaderno» lo recupera en otro equipo.
- **Borrar los datos del navegador borra el cuaderno.** El botón «Borrar mis datos de este navegador», al pie de cada página, también lo borra (pide confirmación en la página).
- Si el navegador bloquea el almacenamiento, el sitio sigue funcionando y avisa: «No se pudo guardar en este navegador: exporte su cuaderno para no perderlo.»

### Enlaces

Todo enlace del sitio sale de `js/data/sources.js` y debe existir en el archivo del curso. Revise con `node tools/check-links.mjs` (también comprueba que cada enlace externo se abra en otra pestaña con `rel="noopener noreferrer"`).

## 3. Retemporizar escenas

La duración de cada escena es la que necesitan sus voces: máx(`min` de la escena, 0,6 s + líneas + 0,5 s entre líneas + pausas + 1,2 s). Para estimar las duraciones sin gastar cuota:

```
node tools/generate-voiceover.mjs --dry-run
```

Muestra cada video frente a su objetivo (`target`), las escenas más largas y los caracteres facturables. Para alargar una escena sin voz, suba su `min` en la especificación §11 (o en `js/data/videos.js`); para acortarla, acorte sus líneas.

## 4. Regenerar las voces

Las voces publicadas se generaron con **Edge TTS**, las voces de lectura en voz alta de Microsoft Edge: son gratuitas y no piden clave. La herramienta también puede usar **Azure AI Speech** (plan gratuito F0, con clave). Sin audio generado, el sitio usa la voz del navegador (aparece la nota «Voz del navegador»); todo funciona igual.

### 4.0 Con Edge TTS (sin clave; es la opción configurada)

Necesita el paquete de Python `edge-tts` (`pip install edge-tts`, o `uv tool install edge-tts`; con `uv` instalado la herramienta lo obtiene sola) y conexión a internet. No hace falta `npm install`.

```
cd tools
node generate-voiceover.mjs                   # sintetiza todo (o --only v4 para un video)
```

- `tools/voice.config.json` dice `"engine": "edge"`; las voces del reparto son las mismas que en Azure. `--engine azure` (o `"engine": "azure"`) vuelve a Azure.
- Edge solo recibe texto: los alias del léxico se leen igual, los «…» se vuelven una pausa corta (coma) y el tono (`pitch`) se convierte de porcentaje a hercios. Los tiempos de los subtítulos salen de los límites de palabra que devuelve Edge.
- Es un servicio en línea sin garantía de servicio: si falla, la herramienta reintenta; vuelva a ejecutar y solo se sintetizan las líneas que faltan (caché en `tools/.cache/`).
- `--voice-test` también funciona con Edge.

### 4.1 Con Azure: crear el recurso (una sola vez)

1. En el portal de Azure, cree un recurso **Azure Speech** (hoy se ofrece dentro de Microsoft Foundry como «Azure Speech in Foundry Tools») con el plan de precios **Free F0**.
2. Copie su **clave** y su **región** (por ejemplo, `eastus`).
3. En `tools/`, copie `.env.example` como `.env` y péguelas:

```
AZURE_SPEECH_KEY=…
AZURE_SPEECH_REGION=…
```

`tools/.env` está excluido del repositorio. La clave nunca se escribe en el sitio, en el manifiesto, en los subtítulos ni en los registros; solo las herramientas hablan con Azure.

### 4.2 Instalar y probar

```
cd tools
npm install                                   # instala el SDK de voz
node generate-voiceover.mjs --voice-test      # escucha cada voz y calibra las palabras por segundo
node generate-voiceover.mjs --dry-run         # duraciones frente al objetivo y caracteres que se facturarán
node generate-voiceover.mjs                   # sintetiza todo (o --only v4 para un video)
```

- `--voice-test` sintetiza un párrafo fijo con cada voz y sus alternativas, mide su velocidad y escribe `wordsPerSecond` en `tools/voice.config.json` y en `js/data/cast.js`. Los clips quedan en `tools/.cache/prueba-de-voces/`… escúchelos.
- La síntesis completa respeta el límite de F0 (20 solicitudes por minuto; la herramienta usa 18 y una a la vez), muestra un tiempo estimado («≈ N min a 18 líneas por minuto») y escribe `assets/audio/<video>.mp3`, `assets/audio/manifest.js` y `assets/captions/<video>.vtt`.
- **Caché**: cada línea se guarda en `tools/.cache/` según su voz, velocidad, tono y texto; una línea que no cambió nunca se vuelve a sintetizar (use `--force` para rehacer todo).
- **Presupuesto**: F0 incluye 0,5 millones de caracteres al mes (cuenta todo el SSML, también las marcas). Una síntesis completa de este curso son unos 80.000 caracteres (16 %). La herramienta lleva un libro de uso mensual en `tools/.cache/usage.json`, avisa al 80 % y se detiene antes de pasarse. La métrica «Synthesized Characters» del portal de Azure es la que manda.
- **Si se agota la cuota del mes**, F0 no cobra: simplemente deja de sintetizar hasta el mes siguiente (o hasta pasar el recurso al plan S0 de pago, con `--allow-over-budget`).
- Al final, **escuche cada video completo una vez**. Si una palabra suena mal, agréguela a `tools/lexicon.es.json` (alias fonético), o use `say` en la línea de la especificación, y vuelva a ejecutar: solo se resintetizan las líneas que cambiaron.

### 4.3 Cambiar una voz

En `tools/voice.config.json`, cambie `voice` (y si quiere `rate` y `pitch`) del papel; las alternativas de audición están en `alternatives`. Mantenga las seis voces distintas entre sí. Vuelva a ejecutar `--voice-test` y luego la síntesis.

## 5. Grabar o exportar los videos

- **«Descargar video»** (en cada reproductor) graba una pasada completa en tiempo real con el navegador: diga cuánto tarda y mantenga la pestaña visible. También ofrece «Descargar este capítulo». Con la página abierta como archivo (`file://`) o con la voz del navegador, **se graba sin voz** (el sitio lo avisa): sirva la carpeta en local (sección 1) y genere las voces (sección 4) para grabar con voz.
- **Exportar MP4** (opcional, para quien edita): `node tools/render-videos.mjs --only v1` dibuja cada cuadro en Chromium sin ventana y lo mezcla con la narración en `assets/video/<slug>.mp4` (H.264 + AAC). Desde ese momento el reproductor ofrece «Descargar MP4». Es lento: cada cuadro se dibuja y se codifica por separado (en la prueba, unos 0,15 s por cuadro, es decir, unos 20 minutos por cada 5 minutos de video a 24 cuadros por segundo). Si se interrumpe, al ejecutarlo de nuevo retoma desde el último capítulo terminado; `--force` lo rehace todo y `--fps 6` sirve para una prueba rápida.

## 6. Cambiar el estilo gráfico

Todo lo que es «aspecto» (colores, línea, textura, letras de título, fondos) vive en `js/style/`, `css/tokens.css` y `css/style.css`, y se construye desde el archivo de estilo `content/estilo-miro.md`. Para cambiar de estilo:

1. Reemplace `content/estilo-*.md` por el nuevo archivo de estilo (siempre hay exactamente uno).
2. Reconstruya `js/style/`, `css/tokens.css` y `css/style.css` a partir de él.
3. Ejecute `node tools/check-style.mjs` y `node tools/snapshots.mjs --estilo` (hoja de estilo en `review/estilo/`), y luego `node tools/snapshots.mjs` para revisar los cuadros de todos los videos contra la lista del nuevo estilo y `node tools/dev/frame-checks.mjs` para encontrar textos que ya no caben.

Los datos, los dibujos del curso (`js/course/`) y los videos (`js/videos/`) no cambian.

## 7. Herramientas de desarrollo

| Herramienta | Para qué |
|---|---|
| `tools/snapshots.mjs` | cuadros de revisión de cada video (`review/<video>/`), hoja de estilo (`--estilo`), diapositivas (`--slides 3`) |
| `tools/check-figures.mjs` | trazabilidad de cifras y enunciados prohibidos (debe dar 0 errores) |
| `tools/check-style.mjs` | aislamiento del estilo, paleta, contraste y leyenda (debe dar 0 errores) |
| `tools/check-links.mjs` | enlaces (debe dar 0 errores) |
| `tools/generate-voiceover.mjs` | voces (Edge TTS sin clave, o Azure AI Speech F0) |
| `tools/render-videos.mjs` | exportación opcional a MP4 |
| `tools/dev/build-content.mjs`, `tools/dev/build-data.mjs` | generan `js/data/` desde el programa del curso y la especificación |
| `tools/dev/build-index.mjs` | reescribe `index.html` cuando se agregan o quitan archivos de `js/` |
| `tools/dev/smoke.mjs` | abre todas las vistas y reporta errores de consola (`--shots` guarda capturas) |
| `tools/dev/course-checks.mjs` | comprobaciones del curso que se pueden calcular: calculadora de acuerdo, razón de tokens, temporizadores, tarjetas «Revisar antes de clase» y «Con matiz» |
| `tools/dev/frame-checks.mjs` | en cada video: textos cortados o fuera de su espacio, tarjetas que se desbordan y subtítulos (debe dar 0 fallas); avisa lo que queda bajo la viñeta del personaje y bajo la banda, para revisarlo a ojo (`--sheets` guarda hojas en `review/frame-checks/`) |

Requieren Node 22 o más reciente, y Chromium (o Chrome) para las capturas; `ffmpeg` para la mezcla de audio y la exportación. Ninguna se necesita para ver el sitio.

## 8. Créditos y transparencia

- Ilustraciones procedurales originales inspiradas en el lenguaje visual de Joan Miró.
- Fuentes tipográficas con licencia abierta (SIL OFL): Atkinson Hyperlegible y Fraunces (`assets/fonts/`).
- Personajes inventados: Mariana, Julián, Amparo, la Dra. Rojas y Tomás no son personas reales.
- El sitio declara su propio uso de IA en el pie de página: complete «[herramientas y versiones, fechas de uso]» y el nombre de quien revisó el contenido.
