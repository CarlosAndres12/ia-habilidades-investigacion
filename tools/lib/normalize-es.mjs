// Spanish display text → speakable text (base §4.5 and spec §5.4). Numbers are always spelled in
// words, so no voice reads «344.700» as a decimal. Lexicon entries apply first and protect the digits
// inside them. normalize(text, lexicon) returns { ssml, plain }: an escaped SSML fragment (lexicon
// entries as <sub alias>, ellipses as short breaks) and the same text as plain words.

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
  'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis',
  'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta', 7: 'setenta', 8: 'ochenta', 9: 'noventa' };
const HUNDREDS = { 1: 'ciento', 2: 'doscientos', 3: 'trescientos', 4: 'cuatrocientos', 5: 'quinientos', 6: 'seiscientos', 7: 'setecientos', 8: 'ochocientos', 9: 'novecientos' };
const ORDINALS = { 1: 'primero', 2: 'segundo', 3: 'tercero', 4: 'cuarto', 5: 'quinto', 6: 'sexto', 7: 'séptimo', 8: 'octavo', 9: 'noveno', 10: 'décimo' };
const FRACTIONS = { '1/2': 'un medio', '1/3': 'un tercio', '2/3': 'dos tercios', '1/4': 'un cuarto', '3/4': 'tres cuartos', '1/5': 'un quinto' };

function below1000(n) {
  if (n < 30) return UNITS[n];
  if (n < 100) { const t = Math.floor(n / 10), u = n % 10; return TENS[t] + (u ? ' y ' + UNITS[u] : ''); }
  if (n === 100) return 'cien';
  const h = Math.floor(n / 100), r = n % 100;
  return HUNDREDS[h] + (r ? ' ' + below1000(r) : '');
}
// apocope before «mil», «millón», «millones» and nouns: «veintiún mil», «un millón»
function apocope(words) { return words.replace(/veintiuno$/, 'veintiún').replace(/(^|\s)uno$/, '$1un'); }

export function numberToWords(n, opts = {}) {
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return 'menos ' + numberToWords(-n, opts);
  n = Math.floor(n);
  if (n === 0) return 'cero';
  const parts = [];
  const billions = Math.floor(n / 1e12), millions = Math.floor((n % 1e12) / 1e6), thousands = Math.floor((n % 1e6) / 1e3), rest = n % 1e3;
  if (billions) parts.push(billions === 1 ? 'un billón' : apocope(numberToWords(billions)) + ' billones');
  if (millions) {
    // up to 999.999 millions («mil millones» style)
    parts.push(millions === 1 ? 'un millón' : apocope(numberToWords(millions)) + ' millones');
  }
  if (thousands) parts.push(thousands === 1 ? 'mil' : apocope(below1000(thousands)) + ' mil');
  if (rest) parts.push(opts.apocope ? apocope(below1000(rest)) : below1000(rest));
  return parts.join(' ');
}

// «344.700» → 344700 · «127,5» → 127.5 (es-CO: thousands point, decimal comma)
function parseEs(s) { return parseFloat(String(s).replace(/\./g, '').replace(',', '.')); }

// an es-CO number token in words: integers, thousands points and decimal comma
export function readNumber(tok, opts = {}) {
  const t = String(tok);
  if (/,/.test(t)) {
    const [int, dec] = t.split(',');
    const intWords = numberToWords(parseEs(int || '0'));
    // decimals read as a number, keeping leading zeros: «0,05» → «cero coma cero cinco»
    const zeros = (dec.match(/^0+/) || [''])[0].length;
    const decWords = 'cero '.repeat(zeros) + (dec.replace(/^0+/, '') ? numberToWords(parseInt(dec.replace(/^0+/, ''), 10)) : '');
    return intWords + ' coma ' + decWords.trim();
  }
  return numberToWords(parseEs(t), opts);
}

const NUM = '\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?';
const MONTHS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre';

// the course's reading rules (spec §5.4) and the base rules (base §4.5), on text without lexicon terms
export function readNumbers(text) {
  let s = text;
  if (/[+−→]/.test(s)) throw new Error('Una línea de voz no puede contener «+», «−» ni «→»: escríbalos en palabras. → ' + text);
  s = s.replace(/EE\. ?UU\./g, 'Estados Unidos');
  // currency
  s = s.replace(new RegExp(`US\\$\\s?(${NUM})\\/mes`, 'g'), (m, n) => readNumber(n, { apocope: true }) + ' dólares al mes');
  s = s.replace(new RegExp(`US\\$\\s?(${NUM})\\s+millones`, 'g'), (m, n) => readNumber(n, { apocope: true }) + ' millones de dólares');
  s = s.replace(new RegExp(`US\\$\\s?(${NUM})`, 'g'), (m, n) => readNumber(n, { apocope: true }) + ' dólares');
  s = s.replace(new RegExp(`COP\\s?(${NUM})\\s+millones`, 'g'), (m, n) => readNumber(n, { apocope: true }) + ' millones de pesos');
  s = s.replace(new RegExp(`R\\$\\s?(${NUM})\\s+millones`, 'g'), (m, n) => readNumber(n, { apocope: true }) + ' millones de reales');
  // ordinals «4.º», «1.ª»
  s = s.replace(/\b(\d{1,2})\.[ºo]/g, (m, n) => ORDINALS[n] || numberToWords(+n));
  s = s.replace(/\b(\d{1,2})\.ª/g, (m, n) => (ORDINALS[n] || numberToWords(+n)).replace(/o$/, 'a'));
  // fractions
  s = s.replace(/\b([1-5])\/([2-5])\b/g, (m) => FRACTIONS[m] || m);
  // dates: «1 de agosto» → «primero de agosto»
  s = s.replace(new RegExp(`\\b1 de (${MONTHS})`, 'g'), 'primero de $1');
  // ranges with an en dash: «14–15 %», «2026–2028», «12–18 meses»
  s = s.replace(new RegExp(`(${NUM})\\s?–\\s?(${NUM})(\\s?%)?`, 'g'), (m, a, b, pct) => readNumber(a) + ' a ' + readNumber(b) + (pct ? ' por ciento' : ''));
  // symbols before numbers
  s = s.replace(/~\s?(?=\d)/g, 'cerca de ').replace(/≈\s?(?=\d)/g, 'aproximadamente ').replace(/<\s?(?=\d)/g, 'menos de ').replace(/>\s?(?=\d)/g, 'más de ');
  // number + unit
  s = s.replace(new RegExp(`(${NUM})\\s?%`, 'g'), (m, n) => readNumber(n) + ' por ciento');
  s = s.replace(new RegExp(`(${NUM})\\s?×`, 'g'), (m, n) => readNumber(n) + ' veces');
  s = s.replace(new RegExp(`(${NUM})\\s?GB\\b`, 'g'), (m, n) => readNumber(n) + ' gigabytes');
  s = s.replace(new RegExp(`(${NUM})\\s?MB\\b`, 'g'), (m, n) => readNumber(n) + ' megabytes');
  s = s.replace(new RegExp(`(${NUM})\\s?TWh\\b`, 'g'), (m, n) => readNumber(n) + ' teravatios hora');
  // «1 en 277», «N millones», «N mil millones», plain numbers
  s = s.replace(new RegExp(`(${NUM})(?=\\s+(millones|millón|mil millones)\\b)`, 'g'), (m, n) => readNumber(n, { apocope: true }));
  // «21 países» → «veintiún países»; «1 en 277» keeps «uno» before a preposition
  const STOP = /^(en|de|a|y|o|e|u|por|para|con|sin|sobre|entre|hasta|desde|cada|que|del|al|coma|veces|mil|millones|millón)$/;
  s = s.replace(new RegExp(`(?<![\\w-])(${NUM})(?![\\w-])(?=(\\s+([a-záéíóúñü]+))?)`, 'g'), (m, n, sp, next) => readNumber(n, { apocope: !!next && !/,/.test(n) && !STOP.test(next) }));
  return s;
}

function escapeXml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }

// lexicon: [{ term, alias }]; longest terms first; whole-word matches only
export function normalize(text, lexicon = []) {
  const entries = lexicon.slice().sort((a, b) => b.term.length - a.term.length);
  const slots = [];
  let s = String(text);
  for (const e of entries) {
    const re = new RegExp(`(?<![\\wÁÉÍÓÚÜÑáéíóúüñ])${e.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\wÁÉÍÓÚÜÑáéíóúüñ])`, 'g');
    s = s.replace(re, (m) => { slots.push({ term: m, alias: e.alias }); return '\u0001' + String.fromCharCode(0xE000 + slots.length - 1) + '\u0002'; });
  }
  s = readNumbers(s);
  // quotes and guillemets are not spoken; «…» becomes a short pause
  s = s.replace(/[«»“”"]/g, '').replace(/\s+/g, ' ').trim();
  const slot = (ch) => slots[ch.charCodeAt(0) - 0xE000];
  const plain = s.replace(/\u0001([\uE000-\uF8FF])\u0002/g, (m, k) => slot(k).alias).replace(/…/g, ',');
  let ssml = escapeXml(s).replace(/…/g, '<break time="300ms"/>');
  ssml = ssml.replace(/\u0001([\uE000-\uF8FF])\u0002/g, (m, k) => `<sub alias="${escapeXml(slot(k).alias)}">${escapeXml(slot(k).term)}</sub>`);
  if (/\d/.test(plain)) throw new Error('Quedaron cifras sin leer en palabras: «' + plain + '» (agregue una regla, una entrada al léxico o un «say»).');
  return { ssml, plain };
}
