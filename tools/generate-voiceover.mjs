// Synthesizes the narration of the videos with Azure AI Speech on the free tier F0 (base §4), or with
// the free Edge TTS voices (no key) when voice.config.json says "engine": "edge" or with --engine edge.
//   node tools/generate-voiceover.mjs --dry-run          lengths vs target and billable characters, no Azure
//   node tools/generate-voiceover.mjs --voice-test       audition the voices and calibrate wordsPerSecond
//   node tools/generate-voiceover.mjs [--only v4] [--force] [--allow-over-budget]
// Steps: chunks from the site's own captions.js → speakable text (lib/normalize-es.mjs) → one SSML per
// line (lib/ssml.mjs) → cached synthesis under an F0 rate limiter → ffprobe → the site's own timeline →
// one mixed, loudness-normalized MP3 per video → assets/audio/<id>.mp3, manifest.js, captions/<id>.vtt.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT, loadData } from './lib/load-data.mjs';
import { lineSSML } from './lib/ssml.mjs';
import { billable, Ledger } from './lib/budget.mjs';
import { credentials, voicesList, makeSynth } from './lib/tts-azure.mjs';
import { makeSynth as makeEdgeSynth } from './lib/tts-edge.mjs';

const TOOLS = path.join(ROOT, 'tools');
const CACHE = path.join(TOOLS, '.cache');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const cfg = JSON.parse(fs.readFileSync(path.join(TOOLS, 'voice.config.json'), 'utf8'));
if (val('--engine')) cfg.engine = val('--engine');
const EDGE = cfg.engine === 'edge';
const lexicon = JSON.parse(fs.readFileSync(path.join(TOOLS, 'lexicon.es.json'), 'utf8')).entries;
const NS = loadData();
const D = NS.data, CAP = NS.engine.captions, TL = NS.engine.timeline;
const clock = (s) => Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
const nameOf = Object.fromEntries((D.cast || []).map((c) => [c.id, c.name]));

function plan(video) {
  const out = [];
  video.scenes.forEach((sc) => (sc.lines || []).forEach((ln, i) => {
    const v = cfg.voices[ln.voice];
    if (!v) throw new Error(`La voz del papel «${ln.voice}» no está en voice.config.json`);
    const chunks = CAP.chunk(ln.text);
    const rate = v.rate;
    const { ssml } = lineSSML({ chunks, say: ln.say, voice: v.voice, locale: v.locale, rate, pitch: v.pitch, lexicon });
    const hash = crypto.createHash('sha256').update([EDGE ? 'edge' : '', v.voice, rate, v.pitch, ssml, cfg.outputFormat].join('|')).digest('hex').slice(0, 24);
    out.push({ scene: sc.id, index: i, voice: ln.voice, text: ln.text, say: ln.say, chunks, ssml, hash, chars: billable(ssml), words: ln.text.split(/\s+/).length });
  }));
  return out;
}

// F0: 20 transactions per 60 s; the limiter keeps a margin (default 18) and runs one at a time
function limiter({ requests, perSeconds }) {
  const stamps = [];
  return async function wait() {
    for (;;) {
      const now = Date.now();
      while (stamps.length && now - stamps[0] > perSeconds * 1000) stamps.shift();
      if (stamps.length < requests) { stamps.push(now); return; }
      await new Promise((r) => setTimeout(r, perSeconds * 1000 - (now - stamps[0]) + 50));
    }
  };
}

function ffprobe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).toString().trim();
  return parseFloat(out);
}

async function main() {
  const videos = (D.videos || []).filter((v) => !val('--only') || v.id === val('--only'));
  const plans = videos.map((v) => ({ video: v, lines: plan(v) }));
  const totalChars = plans.reduce((s, p) => s + p.lines.reduce((a, l) => a + l.chars, 0), 0);
  const ledger = new Ledger(CACHE);

  // ------------------------------------------------------------------ dry run: estimates only
  if (flag('--dry-run')) {
    console.log('Estimación sin llamar a Azure (wordsPerSecond de cada voz):\n');
    for (const p of plans) {
      const castW = Object.fromEntries((D.cast || []).map((c) => [c.id, { wordsPerSecond: (cfg.voices[c.id] || {}).wordsPerSecond || c.wordsPerSecond || 2.4 }]));
      const tl = TL.build(p.video, { cast: castW });
      const [lo, hi] = p.video.target || [0, 1e9];
      const flag2 = tl.duration < lo || tl.duration > hi ? '  ← fuera del objetivo' : '';
      const chars = p.lines.reduce((a, l) => a + l.chars, 0);
      console.log(`${p.video.id}  ${clock(tl.duration).padStart(6)}  (objetivo ${clock(lo)}–${clock(hi)})  ${String(p.lines.length).padStart(3)} líneas  ${String(chars).padStart(6)} caracteres facturables${flag2}`);
      const longest = tl.scenes.slice().sort((a, b) => b.dur - a.dur).slice(0, 2).map((s) => `${s.id} ${s.dur.toFixed(1)} s`).join(', ');
      console.log(`      escenas más largas: ${longest}`);
    }
    const share = totalChars / cfg.monthlyBudgetChars;
    console.log(`\nTotal: ${totalChars} caracteres facturables (${(share * 100).toFixed(1)} % de ${cfg.monthlyBudgetChars} del mes en F0).`);
    console.log(`Libro de uso de este mes (${ledger.month}): ${ledger.used} caracteres.`);
    const reqs = plans.reduce((s, p) => s + p.lines.length, 0);
    console.log(`≈ ${Math.ceil(reqs / cfg.rateLimit.requests)} min a ${cfg.rateLimit.requests} líneas por minuto (${reqs} solicitudes), más la mezcla.`);
    return;
  }

  const cred = EDGE ? null : credentials(TOOLS, cfg);
  if (!EDGE && !cred) {
    console.error('Faltan AZURE_SPEECH_KEY y AZURE_SPEECH_REGION (variables de entorno o tools/.env). Vea tools/.env.example y el README. Use --dry-run para estimar sin Azure.');
    process.exit(2);
  }
  // verify the configured voices once (Azure; Edge offers the same neural voices)
  const list = EDGE ? [] : await voicesList(cred);
  const names = new Set(list.map((v) => v.ShortName));
  for (const [role, v] of Object.entries(EDGE ? {} : cfg.voices)) {
    if (!names.has(v.voice)) {
      const alt = (v.alternatives || []).find((a) => names.has(a));
      if (!alt) { console.error(`La voz ${v.voice} (${role}) no está disponible en ${cred.region} y no tiene alternativa disponible.`); process.exit(2); }
      console.warn(`Aviso: ${v.voice} no está disponible; se usa ${alt} para ${role}.`);
      v.voice = alt;
    }
  }
  const synth = EDGE ? await makeEdgeSynth() : await makeSynth(cred, cfg.outputFormat);
  const wait = limiter(EDGE ? cfg.edge.rateLimit : cfg.rateLimit);
  fs.mkdirSync(CACHE, { recursive: true });

  async function synthCached(item, force) {
    const wav = path.join(CACHE, item.hash + '.wav'), meta = path.join(CACHE, item.hash + '.json');
    if (!force && fs.existsSync(wav) && fs.existsSync(meta)) return JSON.parse(fs.readFileSync(meta, 'utf8'));
    if (!EDGE && ledger.used + item.chars > cfg.monthlyBudgetChars && !flag('--allow-over-budget')) {
      throw new Error(`Se superaría el presupuesto mensual de ${cfg.monthlyBudgetChars} caracteres (usados: ${ledger.used}). En F0 la síntesis se detiene; espere al mes siguiente o use S0 con --allow-over-budget.`);
    }
    let tries = 0;
    for (;;) {
      await wait();
      try {
        const r = await synth(item.ssml);
        if (!EDGE) ledger.add(item.chars);
        fs.writeFileSync(wav, r.wav);
        const m = { duration: ffprobe(wav), bookmarks: r.bookmarks, words: r.words };
        fs.writeFileSync(meta, JSON.stringify(m));
        return m;
      } catch (e) {
        if (++tries > 5) throw e;
        const backoff = Math.min(60000, 2000 * 2 ** tries) * (0.75 + Math.random() * 0.5);
        console.warn(`  reintento ${tries} en ${Math.round(backoff / 1000)} s: ${e.message}`);
        await new Promise((res) => setTimeout(res, backoff));
      }
    }
  }

  // ------------------------------------------------------------------ voice test
  if (flag('--voice-test')) {
    const paragraph = 'La investigación social usa la inteligencia artificial con cuidado. Cada resultado se verifica en la fuente original, se registra en la bitácora y se declara en el artículo. Así, otra persona puede repetir el trabajo, revisar las decisiones del análisis y confiar en las conclusiones, porque el método queda escrito y disponible para todos.';
    const words = paragraph.split(/\s+/).length;
    const outDir = path.join(CACHE, 'prueba-de-voces');
    fs.mkdirSync(outDir, { recursive: true });
    for (const [role, v] of Object.entries(cfg.voices)) {
      for (const voice of [v.voice].concat(v.alternatives || [])) {
        const locale = voice.slice(0, 5);
        const { ssml } = lineSSML({ chunks: [paragraph], voice, locale, rate: v.rate, pitch: v.pitch, lexicon });
        const m = await synthCached({ ssml, chars: billable(ssml), hash: crypto.createHash('sha256').update(voice + ssml).digest('hex').slice(0, 24) });
        const wps = words / m.duration;
        console.log(`${role.padEnd(9)} ${voice.padEnd(24)} ${m.duration.toFixed(1)} s · ${wps.toFixed(2)} palabras/s`);
        if (voice === v.voice) v.wordsPerSecond = Math.round(wps * 100) / 100;
      }
    }
    fs.writeFileSync(path.join(TOOLS, 'voice.config.json'), JSON.stringify(cfg, null, 2) + '\n');
    // the page reads wordsPerSecond from js/data/cast.js
    const castFile = path.join(ROOT, 'js', 'data', 'cast.js');
    let castSrc = fs.readFileSync(castFile, 'utf8');
    for (const [role, v] of Object.entries(cfg.voices)) {
      castSrc = castSrc.replace(new RegExp(`("id": "${role}",[\\s\\S]*?"wordsPerSecond": )[0-9.]+`), `$1${v.wordsPerSecond}`);
    }
    fs.writeFileSync(castFile, castSrc);
    console.log(`\nwordsPerSecond actualizado en tools/voice.config.json y js/data/cast.js. Escuche los clips en ${path.relative(ROOT, CACHE)}/.`);
    return;
  }

  // ------------------------------------------------------------------ full synthesis
  if (EDGE) console.log('Voces de Edge TTS (gratuitas, sin clave).');
  else console.log(`${totalChars} caracteres facturables en total (sin contar la caché) · usados este mes: ${ledger.used} de ${cfg.monthlyBudgetChars}.`);
  if (!EDGE && ledger.used > cfg.monthlyBudgetChars * cfg.warnAtShare) console.warn(`Aviso: ya se usó más del ${cfg.warnAtShare * 100} % del presupuesto mensual.`);
  const manifest = {};
  const manFile = path.join(ROOT, 'assets', 'audio', 'manifest.js');
  try { const prev = fs.readFileSync(manFile, 'utf8').match(/audioManifest = (\{[\s\S]*\});/); if (prev) Object.assign(manifest, JSON.parse(prev[1])); } catch { /* new manifest */ }
  for (const p of plans) {
    const v = p.video;
    console.log(`\n${v.id} · ${v.title}`);
    let billed = 0;
    const lines = [];
    for (const item of p.lines) {
      const before = ledger.used;
      const m = await synthCached(item, flag('--force'));
      billed += ledger.used - before;
      // chunk starts from the bookmarks (or proportional when a `say` replaced the text)
      const starts = item.say ? null : item.chunks.map((c, k) => { const b = m.bookmarks.find((x) => x.mark === 'c' + (k + 1)); return b ? b.sec : null; });
      if (starts && starts.some((s) => s == null)) console.warn(`  falta un marcador en ${item.scene} línea ${item.index + 1}: tiempos estimados`);
      const total = item.chunks.reduce((a, c) => a + c.length, 0) || 1;
      let acc = 0;
      const chunks = item.chunks.map((c, k) => {
        const est = { start: m.duration * acc / total, end: m.duration * (acc + c.length) / total };
        acc += c.length;
        if (!starts || starts[k] == null) return { text: c, start: est.start, end: est.end };
        const next = starts[k + 1] != null ? starts[k + 1] : m.duration;
        return { text: c, start: starts[k], end: next };
      });
      chunks.forEach((c) => { const cps = c.text.length / Math.max(0.1, c.end - c.start); if (cps > 17) console.warn(`  rápido: ${item.scene} «${c.text.slice(0, 40)}…» ${cps.toFixed(1)} caracteres/s`); });
      lines.push({ scene: item.scene, index: item.index, voice: item.voice, dur: m.duration, chunks, wav: path.join(CACHE, item.hash + '.wav') });
    }
    // the site's own timeline with the measured durations
    const castW = Object.fromEntries((D.cast || []).map((c) => [c.id, { wordsPerSecond: c.wordsPerSecond || 2.4 }]));
    const tl = TL.build(v, { cast: castW, manifest: { lines } });
    // mix: concatenation of silences and clips, then two-pass loudness normalization to MP3
    const work = path.join(CACHE, 'mix-' + v.id);
    fs.mkdirSync(work, { recursive: true });
    const list = [];
    let cursor = 0, k = 0;
    const silence = (sec) => {
      const f = path.join(work, `sil-${k++}.wav`);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', sec.toFixed(3), '-c:a', 'pcm_s16le', f]);
      list.push(f);
    };
    tl.scenes.forEach((sc) => sc.lines.forEach((L) => {
      const clip = lines.find((x) => x.scene === sc.id && x.index === L.index);
      if (L.start - cursor > 0.01) silence(L.start - cursor);
      list.push(clip.wav);
      cursor = L.start + clip.dur;
    }));
    if (tl.duration - cursor > 0.01) silence(tl.duration - cursor);
    const listFile = path.join(work, 'list.txt');
    fs.writeFileSync(listFile, list.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    const raw = path.join(work, 'raw.wav');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'pcm_s16le', raw]);
    const L = cfg.loudness;
    // two-pass loudness normalization: measure first (ffmpeg prints the JSON on stderr)
    const pass1 = spawnSync('ffmpeg', ['-hide_banner', '-i', raw, '-af', `loudnorm=I=${L.integratedLufs}:TP=${L.truePeakDb}:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
    const jsons = String(pass1.stderr || '').match(/\{[^{}]*"input_i"[^{}]*\}/g);
    const ln = jsons ? JSON.parse(jsons[jsons.length - 1]) : null;
    const filter = ln ? `loudnorm=I=${L.integratedLufs}:TP=${L.truePeakDb}:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true` : `loudnorm=I=${L.integratedLufs}:TP=${L.truePeakDb}`;
    const mp3 = path.join(ROOT, 'assets', 'audio', v.id + '.mp3');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', filter, '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', mp3]);
    // manifest and captions
    manifest[v.id] = {
      file: v.id + '.mp3', duration: tl.duration,
      chapters: tl.chapters.map((c) => ({ title: c.title, start: c.start })),
      scenes: tl.scenes.map((s) => ({ id: s.id, start: s.start, end: s.end })),
      lines: lines.map((x) => ({ scene: x.scene, index: x.index, voice: x.voice, start: 0, dur: x.dur, chunks: x.chunks })),
      checkpoints: [], pauses: tl.segments.filter((g) => g.type === 'pause').map((g) => ({ after: g.after, start: g.start, end: g.end }))
    };
    const vtt = ['WEBVTT', ''];
    const ts = (s) => new Date(s * 1000).toISOString().slice(11, 23);
    tl.scenes.forEach((sc) => sc.lines.forEach((Lx) => Lx.chunks.forEach((c) => {
      const who = Lx.voice !== 'narrador' ? `<v ${nameOf[Lx.voice]}>` : '';
      vtt.push(`${ts(c.start)} --> ${ts(c.end)}`, who + c.text, '');
    })));
    fs.mkdirSync(path.join(ROOT, 'assets', 'captions'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'assets', 'captions', v.id + '.vtt'), vtt.join('\n'));
    const [lo, hi] = v.target || [0, 1e9];
    console.log(`  duración ${clock(tl.duration)} (objetivo ${clock(lo)}–${clock(hi)})${tl.duration < lo || tl.duration > hi ? ' ← fuera del objetivo: reajuste escenas' : ''}${EDGE ? '' : ` · facturados en esta corrida: ${billed} · mes: ${ledger.used}/${cfg.monthlyBudgetChars}`}`);
  }
  fs.writeFileSync(manFile, '/* GENERATED by tools/generate-voiceover.mjs. Never edit by hand. */\nwindow.IAHI = window.IAHI || {};\nwindow.IAHI.audioManifest = ' + JSON.stringify(manifest) + ';\n');
  console.log('\nListo: assets/audio/*.mp3, assets/audio/manifest.js y assets/captions/*.vtt. Escuche cada video completo antes de clase.');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
