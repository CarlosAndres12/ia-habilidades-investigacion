// Edge TTS adapter (free, no key): the read-aloud voices of Microsoft Edge, through the Python package
// edge-tts (lib/tts-edge.py). Same contract as lib/tts-azure.mjs (base §4.7):
// synth(ssml) → { wav, bookmarks: [{ mark, sec }], words }. Edge takes plain text only, so the adapter
// reads the line's SSML back into text (lexicon <sub> → alias, <break> → comma) and places each
// bookmark at the first spoken word after it (a bookmark before any word at 0 s, as Azure does).
// Python: $EDGE_TTS_PYTHON, else python3 when it has edge_tts, else «uv run --with edge-tts».
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const HELPER = path.join(path.dirname(new URL(import.meta.url).pathname), 'tts-edge.py');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function python() {
  if (process.env.EDGE_TTS_PYTHON) return [process.env.EDGE_TTS_PYTHON];
  if (spawnSync('python3', ['-c', 'import edge_tts']).status === 0) return ['python3'];
  if (spawnSync('uv', ['--version']).status === 0) return ['uv', 'run', '--quiet', '--no-project', '--with', 'edge-tts>=7', 'python'];
  throw new Error('Falta edge-tts: instálelo con «pip install edge-tts» (o instale uv) o indique EDGE_TTS_PYTHON.');
}

// SSML of lib/ssml.mjs → voice, prosody and plain-text segments (one per bookmark)
function parse(ssml) {
  const voice = (/<voice name="([^"]+)"/.exec(ssml) || [])[1];
  const prosody = /<prosody([^>]*)>/.exec(ssml);
  const attr = (n) => (prosody && (new RegExp(`${n}="([^"]+)"`).exec(prosody[1]) || [])[1]) || '0%';
  const body = ssml.replace(/^[\s\S]*?<voice[^>]*>/, '').replace(/<\/voice>[\s\S]*$/, '').replace(/<\/?prosody[^>]*>/g, '');
  const parts = body.split(/<bookmark mark="([^"]+)"\/>/);
  const segments = [{ mark: null, text: parts[0] }];
  for (let i = 1; i < parts.length; i += 2) segments.push({ mark: parts[i], text: parts[i + 1] });
  segments.forEach((s) => {
    s.text = unescape(s.text.replace(/<sub alias="([^"]*)">[\s\S]*?<\/sub>/g, '$1').replace(/<break[^>]*\/>/g, ',').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  });
  return { voice, rate: attr('rate'), pitch: attr('pitch'), segments: segments.filter((s) => s.text || s.mark) };
}

// Edge wants a signed rate («+0%») and the pitch in hertz; the config's pitch is a percentage
const signed = (v) => (/^[+-]/.test(v) ? v : '+' + v);
const hertz = (p) => { const n = Math.round(parseFloat(p) * 1.6); return (n < 0 ? '' : '+') + n + 'Hz'; };

export async function makeSynth() {
  const py = python();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iahi-edge-'));
  process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
  let n = 0;
  return async function synth(ssml) {
    const { voice, rate, pitch, segments } = parse(ssml);
    let text = '';
    const starts = segments.map((s) => { const at = text.length; text += (text ? ' ' : '') + s.text; return at; });
    const mp3 = path.join(tmp, `l${n++}.mp3`);
    const r = spawnSync(py[0], py.slice(1).concat([HELPER]), { input: JSON.stringify({ text, voice, rate: signed(rate), pitch: hertz(pitch), out: mp3 }), encoding: 'utf8', maxBuffer: 1 << 24 });
    if (r.status !== 0 || !fs.existsSync(mp3) || !fs.statSync(mp3).size) throw new Error('edge-tts falló: ' + String(r.stderr || r.error || '').trim().split('\n').pop());
    const words = JSON.parse(r.stdout);
    // each word's position in the text, searched forward (accents and case ignored)
    const hay = fold(text);
    let cursor = 0;
    words.forEach((w) => { const at = hay.indexOf(fold(w.text), cursor); if (at >= 0) { w.at = at; cursor = at + w.text.length; } });
    const bookmarks = [];
    segments.forEach((s, i) => {
      if (!s.mark) return;
      const end = i + 1 < segments.length ? starts[i + 1] : Infinity;
      const w = words.find((x) => x.at != null && x.at >= starts[i] && x.at < end);
      if (w) bookmarks.push({ mark: s.mark, sec: starts[i] === 0 ? 0 : w.sec });
    });
    const wavFile = mp3.replace(/\.mp3$/, '.wav');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', wavFile]);
    const wav = fs.readFileSync(wavFile);
    fs.rmSync(mp3); fs.rmSync(wavFile);
    return { wav, bookmarks, words: words.map((w) => ({ text: w.text, sec: w.sec })) };
  };
}
