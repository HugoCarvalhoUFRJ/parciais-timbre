// Cor do timbre pelo espectro visível.
// Funções PURAS (sem DOM): funcionam no navegador e no Node (testes).
//
// Dois métodos, ambos com uma função linear que leva uma faixa sonora a um trecho
// do espectro visível escolhido pelo usuário (lambdaIni → lambdaFim, em nm):
//
// 'centroide' (padrão) — a faixa é a das parciais em relação à fundamental, de 1×f0
//   a n×f0. Calcula-se o centro de gravidade das parciais (razão f/f0 média, pesada
//   pela amplitude) e ele recebe UMA cor pura do espectro. Como todos os áudios tocam
//   Lá, a frequência absoluta diria só a oitava; a razão f/f0 diz o timbre.
//   É o "índice espectral" de timbre_cor.py, levado ao espectro visível.
// 'mistura' — a faixa é a audível (20 Hz a 20 kHz, em Hz absolutos). Cada parcial
//   vira uma luz e a cor é a mistura das luzes. Fica dominada pela fundamental (a nota).

export const F_MIN = 20;        // Hz
export const F_MAX = 20000;     // Hz
export const LAMBDA_MIN = 380;  // nm (limite do slider)
export const LAMBDA_MAX = 750;  // nm
export const LAMBDA_INI_PADRAO = 700;  // início da faixa (grave) → vermelho
export const LAMBDA_FIM_PADRAO = 400;  // fim da faixa (agudo) → violeta
const C_NM_THZ = 299792.458;    // c em nm·THz: frequência da luz (THz) = C / λ (nm)

/** Posição (0 a 1) de x entre a e b, linear ou em oitavas (log₂); fora da faixa, fica no extremo. */
function posicao(x, a, b, escala) {
  const xl = Math.max(a, Math.min(b, x));
  if (b <= a) return 0;
  const t = escala === 'oit' ? Math.log2(xl / a) / Math.log2(b / a) : (xl - a) / (b - a);
  return Math.max(0, Math.min(1, t));
}

/** Posição (0 a 1) de uma frequência sonora na faixa de 20 Hz a 20 kHz ('lin' = Hz, 'oit' = oitavas). */
export function posicaoNaFaixa(f, escala = 'lin') { return posicao(f, F_MIN, F_MAX, escala); }

/** Posição (0 a 1) de uma razão f/f0 na faixa de 1 a n. */
export function posicaoNaSerie(razao, n, escala = 'oit') { return posicao(razao, 1, n, escala); }

/**
 * Comprimento de onda (nm) da posição t (0 a 1) da faixa sonora.
 * Linear na FREQUÊNCIA da luz (THz): t = 0 → lambdaIni, t = 1 → lambdaFim.
 */
export function lambdaDaPosicao(t, { lambdaIni = LAMBDA_INI_PADRAO, lambdaFim = LAMBDA_FIM_PADRAO } = {}) {
  const nu0 = C_NM_THZ / lambdaIni, nu1 = C_NM_THZ / lambdaFim;
  return C_NM_THZ / (nu0 + t * (nu1 - nu0));
}

/** Comprimento de onda (nm) de uma frequência sonora f (Hz), na faixa de 20 Hz a 20 kHz. */
export function somParaLambda(f, mapa = {}) { return lambdaDaPosicao(posicaoNaFaixa(f, mapa.escala || 'lin'), mapa); }

// Cor de um comprimento de onda na tela: aproximação de Dan Bruton (1996), a forma
// clássica de desenhar o espectro visível em monitores. Não é colorimetria exata: a
// conversão exata (funções de cor CIE 1931 → sRGB) esbarra no limite do monitor, e
// faixas largas viram uma cor só (510–550 nm, o mesmo verde puro; 620–750 nm, o
// mesmo vermelho). Medido nos 24 instrumentos, isso dava 16 cores distintas; com
// Bruton, que faz degradês nessas regiões, são 23. Nas pontas (abaixo de 420 nm e
// acima de 700 nm) a cor escurece, como a sensibilidade do olho.
function brutonRGB(nm) {
  const l = Math.max(380, Math.min(750, nm));
  let r = 0, g = 0, b = 0;
  if (l < 440) { r = (440 - l) / 60; b = 1; }
  else if (l < 490) { g = (l - 440) / 50; b = 1; }
  else if (l < 510) { g = 1; b = (510 - l) / 20; }
  else if (l < 580) { r = (l - 510) / 70; g = 1; }
  else if (l < 645) { r = 1; g = (645 - l) / 65; }
  else r = 1;
  const f = l < 420 ? 0.3 + (0.7 * (l - 380)) / 40 : l > 700 ? 0.3 + (0.7 * (750 - l)) / 50 : 1;
  return [r, g, b].map((v) => Math.round(255 * Math.pow(v * f, 0.8)));
}

const gama = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const linear = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
function linearPara255(rgbLin) { return rgbLin.map((v) => Math.round(255 * Math.max(0, Math.min(1, gama(v))))); }

/** Cor de uma luz de comprimento de onda nm: { rgb, hex, lin } (lin = RGB linear, para misturar). */
export function corDaParcial(nm) {
  const rgb = brutonRGB(nm);
  return { rgb, hex: paraHex(rgb), lin: rgb.map(linear) };
}

/** Razão f/f0 de uma parcial (a k-ésima harmônica, se a razão não vier pronta). */
const razaoDe = (p, k) => (Number.isFinite(p.razao) && p.razao > 0 ? p.razao : k);

/**
 * Posição (0 a 1) de cada parcial na faixa do método.
 * centroide: razão f/f0 de 1 a n; mistura: frequência de 20 Hz a 20 kHz.
 */
export function posicaoDaParcial(p, k, n, mapa) {
  return mapa.metodo === 'mistura' ? posicaoNaFaixa(p.freq, mapa.escala) : posicaoNaSerie(razaoDe(p, k), n, mapa.escala);
}

/**
 * Cor do timbre a partir das parciais 1..n.
 * escalaPeso: 'lin' ou 'db' (ver amplitudesHarmonicas).
 * mapa: { metodo: 'centroide'|'mistura', escala: 'lin'|'oit', lambdaIni, lambdaFim }.
 * Retorna { rgb, hex, itens, pesos, indice, ... } ou null se nenhuma parcial tiver peso.
 *   itens: para cada parcial { k, freq, razao, encontrada, posicao, lambda, rgb, hex, peso, parte }
 *   indice: centro de gravidade das razões f/f0 (1 = só a fundamental)
 *   centroide: { posicao, lambda } (só no método 'centroide')
 */
export function corDoTimbre(parciais, n, escalaPeso = 'lin', mapa = {}) {
  const m = { metodo: 'centroide', escala: 'oit', lambdaIni: LAMBDA_INI_PADRAO, lambdaFim: LAMBDA_FIM_PADRAO, ...mapa };
  const pesos = amplitudesHarmonicas(parciais, n, escalaPeso);
  const soma = pesos.reduce((s, a) => s + a, 0);
  const itens = [];
  let somaRazao = 0;
  for (let i = 0; i < n; i++) {
    const p = parciais[i];
    if (!p) { itens.push(null); continue; }
    const pos = posicaoDaParcial(p, i + 1, n, m);
    const lambda = lambdaDaPosicao(pos, m);
    const c = corDaParcial(lambda);
    const razao = razaoDe(p, i + 1);
    somaRazao += pesos[i] * razao;
    itens.push({
      k: i + 1, freq: p.freq, razao, encontrada: !!p.encontrada, posicao: pos, lambda,
      rgb: c.rgb, hex: c.hex, lin: c.lin, peso: pesos[i], parte: soma > 0 ? pesos[i] / soma : 0,
    });
  }
  if (!(soma > 0)) return null;
  const indice = somaRazao / soma;
  const base = { itens, pesos, n, escala: escalaPeso, mapa: m, indice };
  if (m.metodo === 'mistura') {
    // soma em RGB linear (mistura aditiva, como luzes sobrepostas), de volta ao brilho máximo
    const acc = [0, 0, 0];
    for (const it of itens) if (it) for (let j = 0; j < 3; j++) acc[j] += it.peso * it.lin[j];
    const mx = Math.max(...acc);
    const rgb = linearPara255(acc.map((v) => v / mx));
    return { ...base, rgb, hex: paraHex(rgb) };
  }
  // centroide: uma única cor pura, a do centro de gravidade
  const pos = posicaoNaSerie(indice, n, m.escala);
  const lambda = lambdaDaPosicao(pos, m);
  const c = corDaParcial(lambda);
  return { ...base, rgb: c.rgb, hex: c.hex, centroide: { posicao: pos, lambda } };
}

export function paraHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Texto preto ou branco, o que tiver melhor contraste sobre a cor (luminância WCAG). */
export function textoSobre([r, g, b]) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#000000' : '#ffffff';
}

// ---------------------------------------------------------------------------
// Peso de cada parcial na mistura
//
// 'lin' — amplitude linear (fundamental = 1). Uma parcial a −20 dB vale 0,1 e pesa
//   10× menos que a fundamental; a −40 dB vale 0,01. A cor fica perto da das parciais
//   mais fortes.
// 'db' — nível de pressão sonora (dB NPS; 0 dB = limiar de audição a 1 kHz),
//   supondo a fundamental a NIVEL_FUNDAMENTAL_DB_NPS: cada parcial vale
//   60 + (dB em relação à fundamental); abaixo de 0 vale 0. As parciais fracas
//   pesam bem mais. O dB relativo à fundamental "puro" não serve: daria peso zero à
//   fundamental e valores negativos às outras.
// Nas duas escalas, parcial não encontrada entra com 0.

export const NIVEL_FUNDAMENTAL_DB_NPS = 60;

/** Pesos das parciais 1..n na escala escolhida ('lin' ou 'db'). */
export function amplitudesHarmonicas(parciais, n, escala = 'lin') {
  return Array.from({ length: n }, (_, i) => {
    const p = parciais[i];
    if (!p || !p.encontrada) return 0;
    if (escala === 'db') return Number.isFinite(p.dbRef) ? Math.max(0, NIVEL_FUNDAMENTAL_DB_NPS + p.dbRef) : 0;
    return Number.isFinite(p.lin) ? p.lin : 0;
  });
}
