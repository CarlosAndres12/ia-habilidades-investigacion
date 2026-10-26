// Billable characters on Azure neural TTS (base §4.2): everything in the SSML except the <speak> and
// <voice> tags — text, spaces, punctuation and markup (prosody, bookmark, break, sub). The monthly
// ledger lives in tools/.cache/usage.json; the Azure portal metric "Synthesized Characters" rules.
import fs from 'node:fs';
import path from 'node:path';

export function billable(ssml) {
  return ssml.replace(/<speak\b[^>]*>|<\/speak>|<voice\b[^>]*>|<\/voice>/g, '').length;
}

export class Ledger {
  constructor(dir) {
    this.file = path.join(dir, 'usage.json');
    this.month = new Date().toISOString().slice(0, 7);
    try { this.data = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch { this.data = {}; }
    this.data[this.month] = this.data[this.month] || { chars: 0, requests: 0 };
  }
  get used() { return this.data[this.month].chars; }
  add(chars) {
    this.data[this.month].chars += chars;
    this.data[this.month].requests += 1;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }
}
