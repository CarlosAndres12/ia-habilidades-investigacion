// Builds one lean, escaped SSML document per voice line (base §4.4 step 3): the role's voice and
// locale, its prosody, a bookmark before every subtitle chunk (c1, c2…), lexicon entries as <sub alias>
// and ellipses as short breaks. No decorative markup (every character of markup is billed on F0).
import { normalize } from './normalize-es.mjs';

export function lineSSML({ chunks, say, voice, locale, rate, pitch, lexicon }) {
  const prosodyOpen = (rate && rate !== '0%') || (pitch && pitch !== '0%')
    ? `<prosody${rate && rate !== '0%' ? ` rate="${rate}"` : ''}${pitch && pitch !== '0%' ? ` pitch="${pitch}"` : ''}>` : '';
  const prosodyClose = prosodyOpen ? '</prosody>' : '';
  let body;
  if (say) {
    // an explicit `say` replaces the speakable text; the chunk times are then proportional
    body = normalize(say, lexicon).ssml;
  } else {
    body = chunks.map((c, i) => `<bookmark mark="c${i + 1}"/>` + normalize(c, lexicon).ssml).join(' ');
  }
  const speakOpen = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${locale}">`;
  const voiceOpen = `<voice name="${voice}">`;
  return { ssml: speakOpen + voiceOpen + prosodyOpen + body + prosodyClose + '</voice></speak>', speakOpen, voiceOpen };
}
