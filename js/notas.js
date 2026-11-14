// Conversão entre frequência (Hz) e nome de nota, com desvio em cents.
// Convenção: A4 = 440 Hz (Lá central do diapasão), C4 = Dó central.

export const LA4 = 440;

const NOMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];
const NOMES_PT = ['Dó', 'Dó♯', 'Ré', 'Mi♭', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Si♭', 'Si'];

/** Número MIDI (fracionário) de uma frequência. A4 = 69. */
export function hzParaMidi(hz) {
  return 69 + 12 * Math.log2(hz / LA4);
}

export function midiParaHz(m) {
  return LA4 * Math.pow(2, (m - 69) / 12);
}

/** { nome: 'A4', nomePt: 'Lá4', cents: +3, midi: 69 } */
export function nota(hz) {
  if (!(hz > 0)) return { nome: '—', nomePt: '—', cents: 0, midi: NaN };
  const m = hzParaMidi(hz);
  const mi = Math.round(m);
  const cents = Math.round((m - mi) * 100);
  const pc = ((mi % 12) + 12) % 12;
  const oit = Math.floor(mi / 12) - 1;
  return { nome: NOMES[pc] + oit, nomePt: NOMES_PT[pc] + oit, cents, midi: mi };
}

/** Texto curto: "A4 +3¢" */
export function notaTexto(hz) {
  const n = nota(hz);
  if (n.nome === '—') return '—';
  const c = n.cents === 0 ? '' : ` ${n.cents > 0 ? '+' : '−'}${Math.abs(n.cents)}¢`;
  return n.nome + c;
}

/** Diferença em cents entre duas frequências. */
export function cents(f, ref) {
  return 1200 * Math.log2(f / ref);
}

/** Ordinal em português: 1ª, 2ª ... */
export function ordinal(k) {
  return `${k}ª`;
}
