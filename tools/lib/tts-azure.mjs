// Azure AI Speech adapter (base §4.4 step 4): one speakSsmlAsync call per line, audio kept in memory as
// 24 kHz 16-bit mono WAV, bookmark offsets (100-ns ticks) for the subtitle chunks and word boundaries
// for QA. The key and region come only from the environment or tools/.env and are never written out.
// Contract shared with any other provider (base §4.7): synth(ssml) → { wav, bookmarks: [{ mark, sec }] }.
import fs from 'node:fs';
import path from 'node:path';

export function credentials(toolsDir, cfg) {
  const env = { ...process.env };
  const envFile = path.join(toolsDir, '.env');
  if (fs.existsSync(envFile)) {
    for (const ln of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = /^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/.exec(ln);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  const key = env[cfg.keyEnv || 'AZURE_SPEECH_KEY'], region = env[cfg.regionEnv || 'AZURE_SPEECH_REGION'];
  return key && region ? { key, region } : null;
}

async function sdk() {
  try { return (await import('microsoft-cognitiveservices-speech-sdk')).default || (await import('microsoft-cognitiveservices-speech-sdk')); }
  catch { throw new Error('Falta el SDK de voz: en la carpeta tools/ ejecute «npm install».'); }
}

// the voices the region offers (to verify the cast before spending quota)
export async function voicesList({ key, region }) {
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': key } });
  if (!res.ok) throw new Error(`No se pudo leer la lista de voces (${res.status}). Revise la clave y la región.`);
  return res.json();
}

export async function makeSynth({ key, region }, outputFormat) {
  const S = await sdk();
  return async function synth(ssml) {
    const config = S.SpeechConfig.fromSubscription(key, region);
    config.speechSynthesisOutputFormat = S.SpeechSynthesisOutputFormat[outputFormat || 'Riff24Khz16BitMonoPcm'];
    const synthesizer = new S.SpeechSynthesizer(config, null);
    const bookmarks = [], words = [];
    synthesizer.bookmarkReached = (s, e) => bookmarks.push({ mark: e.text, sec: e.audioOffset / 1e7 });
    synthesizer.wordBoundary = (s, e) => words.push({ text: e.text, sec: e.audioOffset / 1e7 });
    try {
      const result = await new Promise((resolve, reject) => synthesizer.speakSsmlAsync(ssml, resolve, reject));
      if (result.reason !== S.ResultReason.SynthesizingAudioCompleted) {
        const details = S.CancellationDetails.fromResult(result);
        const err = new Error(`Síntesis cancelada: ${details.errorDetails || details.reason}`);
        err.status = /429|throttl/i.test(details.errorDetails || '') ? 429 : 500;
        throw err;
      }
      return { wav: Buffer.from(result.audioData), bookmarks, words };
    } finally { synthesizer.close(); }
  };
}
