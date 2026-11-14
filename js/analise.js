// Análise espectral para extração de parciais.
// Funções PURAS (sem DOM): funcionam no navegador e no Node (testes).

import { potenciaFFT } from './fft.js';
import { cents } from './notas.js';

/** Parâmetros fixos da análise (documentados no app e nas exportações). */
export const PARAMS = {
  quadro: 16384,        // amostras por quadro da FFT (~0,37 s a 44,1 kHz)
  salto: 4096,          // avanço entre quadros (75% de sobreposição)
  nfft: 65536,          // tamanho da FFT com zero-padding (interpolação do espectro)
  janela: 'Blackman-Harris (4 termos)',
  trechoPadrao: 1.0,    // duração do trecho automático (s)
  trechoMinimo: 0.4,    // duração mínima do trecho (s)
  margemAtaque: 0.1,    // tempo após o pico do envelope (s)
  quedaMax: 20,         // o trecho termina se o som cair mais que isso (dB)
  margemRuido: 6,       // parcial precisa estar ao menos isso acima do ruído (dB)
  proeminencia: 10,     // proeminência mínima de um pico no modo "picos livres" (dB)
};

// ---------------------------------------------------------------------------
// Pré-processamento

/** Normaliza o pico (considerando todos os canais) para 1. */
export function normalizarPico(canais) {
  let max = 0;
  for (const c of canais) for (let i = 0; i < c.length; i++) {
    const a = Math.abs(c[i]);
    if (a > max) max = a;
  }
  const g = max > 0 ? 1 / max : 1;
  const out = canais.map((c) => {
    const n = new Float32Array(c.length);
    for (let i = 0; i < c.length; i++) n[i] = c[i] * g;
    return n;
  });
  return { canais: out, ganho: g, picoOriginal: max };
}

/** Mistura simples dos canais (só para ouvir e desenhar a forma de onda). */
export function mixMono(canais) {
  const n = canais[0].length;
  const out = new Float32Array(n);
  for (const c of canais) for (let i = 0; i < n; i++) out[i] += c[i] / canais.length;
  return out;
}

/** Envelope RMS (dB relativo ao máximo) em passos de `passo` segundos. */
export function envelope(canais, sr, passo = 0.01) {
  const h = Math.max(1, Math.round(passo * sr));
  const n = Math.floor(canais[0].length / h);
  const db = new Float64Array(n);
  const t = new Float64Array(n);
  let max = 1e-30;
  const lin = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (const c of canais) for (let i = j * h; i < (j + 1) * h; i++) s += c[i] * c[i];
    lin[j] = s / (h * canais.length);
    if (lin[j] > max) max = lin[j];
    t[j] = (j + 0.5) * h / sr;
  }
  for (let j = 0; j < n; j++) db[j] = 10 * Math.log10(lin[j] / max + 1e-30);
  return { t, db };
}

/**
 * Escolhe automaticamente o trecho estável (sustentação) da nota:
 * começa 0,1 s depois do fim do ataque (primeiro instante a menos de 6 dB do
 * nível máximo) e dura 1 s, terminando antes se o som cair mais de 20 dB.
 */
export function trechoAutomatico(canais, sr) {
  const dur = canais[0].length / sr;
  const env = envelope(canais, sr);
  let ja = 0;
  while (ja < env.db.length - 1 && env.db[ja] < -6) ja++;
  let inicio = env.t[ja] + PARAMS.margemAtaque;
  let fim = Math.min(inicio + PARAMS.trechoPadrao, dur);
  for (let j = ja; j < env.db.length; j++) {
    if (env.t[j] > inicio && env.db[j] < -PARAMS.quedaMax) { fim = Math.min(fim, env.t[j]); break; }
  }
  if (fim - inicio < PARAMS.trechoMinimo) {
    fim = Math.min(dur, inicio + PARAMS.trechoMinimo);
    inicio = Math.max(0, fim - PARAMS.trechoMinimo);
  }
  return { inicio, fim };
}

// ---------------------------------------------------------------------------
// Espectro (Welch, "mono por potência")

let janelaCache = null;
function janelaBH(N) {
  if (janelaCache && janelaCache.length === N) return janelaCache;
  const w = new Float64Array(N);
  const a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
  for (let i = 0; i < N; i++) {
    const x = (2 * Math.PI * i) / (N - 1);
    w[i] = a0 - a1 * Math.cos(x) + a2 * Math.cos(2 * x) - a3 * Math.cos(3 * x);
  }
  janelaCache = w;
  return w;
}

/**
 * Espectro médio do trecho [inicio, fim] (s).
 * Cada canal é analisado separadamente e as POTÊNCIAS são somadas
 * ("mono por potência"), evitando cancelamentos de fase entre L e R.
 * Retorna db (relativo ao bin mais forte = 0 dB), df (Hz por bin) e piso de ruído.
 */
export function espectro(canais, sr, inicio, fim) {
  const { quadro, salto, nfft } = PARAMS;
  const w = janelaBH(quadro);
  let a = Math.max(0, Math.round(inicio * sr));
  let b = Math.min(canais[0].length, Math.round(fim * sr));
  if (b - a < quadro) { // garante pelo menos um quadro
    b = Math.min(canais[0].length, a + quadro);
    a = Math.max(0, b - quadro);
  }
  const nb = nfft / 2 + 1;
  const pot = new Float64Array(nb);
  const buf = new Float64Array(quadro);
  let nq = 0;
  for (const c of canais) {
    for (let s = a; s + quadro <= b; s += salto) {
      for (let i = 0; i < quadro; i++) buf[i] = c[s + i] * w[i];
      const p = potenciaFFT(buf, nfft);
      for (let k = 0; k < nb; k++) pot[k] += p[k];
      nq++;
    }
  }
  let max = 0;
  for (let k = 0; k < nb; k++) { pot[k] /= nq; if (pot[k] > max) max = pot[k]; }
  const db = new Float64Array(nb);
  for (let k = 0; k < nb; k++) db[k] = 10 * Math.log10(pot[k] / max + 1e-20);
  const df = sr / nfft;
  // piso de ruído: mediana do espectro entre 30 Hz e 16 kHz
  const k0 = Math.ceil(30 / df), k1 = Math.min(nb - 1, Math.floor(16000 / df));
  const piso = mediana(db.subarray(k0, k1));
  return { db, df, sr, piso, inicio: a / sr, fim: b / sr, quadros: nq / canais.length };
}

function mediana(arr) {
  const s = Float64Array.from(arr).sort();
  return s[Math.floor(s.length / 2)];
}

// ---------------------------------------------------------------------------
// Picos

/** Refina posição e altura de um máximo local por interpolação parabólica (em dB). */
function refinar(db, k, df) {
  const al = db[k - 1], be = db[k], ga = db[k + 1];
  const den = al - 2 * be + ga;
  const p = den === 0 ? 0 : 0.5 * (al - ga) / den;
  return { freq: (k + p) * df, db: be - 0.25 * (al - ga) * p, bin: k };
}

/** Frequência e nível do bin mais forte do espectro inteiro. */
export function picoMaisForte(esp) {
  const { db, df } = esp;
  let k = 1;
  for (let i = 2; i < db.length - 1; i++) if (db[i] > db[k]) k = i;
  return refinar(db, k, df);
}

/**
 * Picos "proeminentes": máximos locais que se destacam pelo menos
 * `minProem` dB dos vales vizinhos (procurados até `alcanceHz` de cada lado).
 */
export function picos(esp, { minProem = PARAMS.proeminencia, alcanceHz = 40, fMin = 20, fMax = 16000, minDb = -80 } = {}) {
  const { db, df, piso } = esp;
  const lim = Math.max(minDb, piso + PARAMS.margemRuido);
  const k0 = Math.max(1, Math.ceil(fMin / df));
  const k1 = Math.min(db.length - 2, Math.floor(fMax / df));
  const alc = Math.max(2, Math.round(alcanceHz / df));
  const out = [];
  for (let k = k0; k <= k1; k++) {
    if (db[k] < lim || db[k] < db[k - 1] || db[k] < db[k + 1]) continue;
    if (db[k] === db[k - 1]) continue;
    // vale à esquerda
    let minL = db[k], okL = true;
    for (let i = k - 1; i >= Math.max(0, k - alc); i--) {
      if (db[i] > db[k]) { okL = false; break; }
      if (db[i] < minL) minL = db[i];
    }
    let minR = db[k], okR = true;
    for (let i = k + 1; i <= Math.min(db.length - 1, k + alc); i++) {
      if (db[i] > db[k]) { okR = false; break; }
      if (db[i] < minR) minR = db[i];
    }
    if (!okL || !okR) continue;
    const proem = db[k] - Math.max(minL, minR);
    if (proem < minProem) continue;
    out.push({ ...refinar(db, k, df), proeminencia: proem });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fundamental: Two-Way Mismatch (Maher & Beauchamp, 1994)

function erroTWM(f0, pf, pa) {
  const p = 0.5, q = 1.4, r = 0.5, rho = 0.33;
  const nH = Math.min(10, pf.length);
  let epm = 0;
  for (let n = 1; n <= nH; n++) {
    const fh = n * f0;
    let best = Infinity, ib = 0;
    for (let i = 0; i < pf.length; i++) {
      const d = Math.abs(pf[i] - fh);
      if (d < best) { best = d; ib = i; }
    }
    const pd = best * Math.pow(fh, -p);
    epm += pd + pa[ib] * (q * pd - r);
  }
  let emp = 0;
  for (let i = 0; i < pf.length; i++) {
    const n = Math.max(1, Math.round(pf[i] / f0));
    const pd = Math.abs(pf[i] - n * f0) * Math.pow(pf[i], -p);
    emp += pa[i] * (pd + pa[i] * (q * pd - r));
  }
  return epm / nH + (rho * emp) / pf.length;
}

/**
 * Estima a fundamental. Retorna { f0, erro } ou null.
 * Usa os picos mais fortes (até 10, no máximo 30 dB abaixo do mais forte),
 * ordenados por frequência — assim ruídos graves fracos não "puxam" a estimativa.
 */
export function detectarF0(esp, { fMin = 25, fMax = 4200 } = {}) {
  let pk = picos(esp, { minDb: -30, minProem: 6, fMax: 12000 });
  if (pk.length === 0) return null;
  pk.sort((x, y) => y.db - x.db);
  pk = pk.slice(0, 10).sort((x, y) => x.freq - y.freq);
  const pf = pk.map((x) => x.freq);
  const pa = pk.map((x) => Math.pow(10, x.db / 20)); // amplitude linear (máx ≈ 1)
  // busca em grade (1/96 de oitava) e refinamento local
  let best = null;
  for (let f = fMin; f <= fMax; f *= Math.pow(2, 1 / 96)) {
    const e = erroTWM(f, pf, pa);
    if (!best || e < best.e) best = { f, e };
  }
  let fb = best.f, eb = best.e;
  for (let c = -15; c <= 15; c += 0.5) {
    const f = best.f * Math.pow(2, c / 1200);
    const e = erroTWM(f, pf, pa);
    if (e < eb) { eb = e; fb = f; }
  }
  return { f0: refinarF0(esp, fb), erro: eb };
}

/**
 * Refina f0 pela média de f_k / k das primeiras parciais encontradas (k = 1..6),
 * ponderada pela amplitude. É mais robusto que medir só a fundamental, que
 * pode ser fraca. Parciais muito desafinadas (> 50 cents) são ignoradas.
 */
export function refinarF0(esp, f0) {
  let s = 0, w = 0;
  for (let k = 1; k <= 6; k++) {
    const p = buscarParcial(esp, k * f0, f0);
    if (!p || Math.abs(cents(p.freq / k, f0)) > 50) continue;
    const a = Math.pow(10, p.db / 20);
    s += a * p.freq / k; w += a;
  }
  return w > 0 ? s / w : f0;
}

/** Procura o máximo local mais forte em torno de `alvo` (±0,4·f0). */
function buscarParcial(esp, alvo, f0) {
  const { db, df, piso } = esp;
  const larg = 0.4 * f0;
  const k0 = Math.max(1, Math.floor((alvo - larg) / df));
  const k1 = Math.min(db.length - 2, Math.ceil((alvo + larg) / df));
  if (k1 <= k0) return null;
  let kb = -1;
  for (let k = k0; k <= k1; k++) {
    if (db[k] >= db[k - 1] && db[k] >= db[k + 1] && (kb < 0 || db[k] > db[kb])) kb = k;
  }
  if (kb < 0) return null;
  if (db[kb] < piso + PARAMS.margemRuido) return null;
  // exige que seja um pico de verdade (destaque de 3 dB sobre as bordas da janela)
  if (db[kb] - Math.max(db[k0], db[k1]) < 3) return null;
  return refinar(db, kb, df);
}

// ---------------------------------------------------------------------------
// Parciais

/**
 * Modo "harmônico": a k-ésima parcial é procurada perto de k·f0, corrigindo a
 * previsão pela última parcial encontrada (acompanha parciais "esticadas").
 */
export function parciaisHarmonicas(esp, f0, n) {
  const out = [];
  let passo = f0; // estimativa atual de f_k / k
  for (let k = 1; k <= n; k++) {
    const alvo = k * passo;
    if (alvo > esp.sr / 2 - f0) break;
    const p = buscarParcial(esp, alvo, f0);
    if (p) {
      out.push({ k, freq: p.freq, db: p.db, encontrada: true });
      passo = p.freq / k;
    } else {
      out.push({ k, freq: alvo, db: null, encontrada: false });
    }
  }
  return out;
}

/** Modo "picos livres": os n picos mais fortes a partir da fundamental. */
export function parciaisLivres(esp, f0, n) {
  const pk = picos(esp, { fMin: 0.95 * f0, fMax: esp.sr / 2 - 100, alcanceHz: Math.max(20, 0.3 * f0) })
    .sort((a, b) => b.db - a.db)
    .slice(0, n)
    .sort((a, b) => a.freq - b.freq);
  return pk.map((p, i) => ({ k: i + 1, freq: p.freq, db: p.db, encontrada: true }));
}

/**
 * Converte os níveis das parciais segundo a referência escolhida.
 * referencia: 'f0' (fundamental = 0 dB) ou 'pico' (pico mais forte do som = 0 dB).
 * Acrescenta: dbRef, lin (amplitude linear, referência = 1), energia (soma = 1), razao, desvioCents.
 */
export function aplicarReferencia(parciais, f0, referencia, esp) {
  let ref = 0; // em 'pico', o espectro já está normalizado (pico mais forte = 0 dB)
  let aviso = null;
  if (referencia === 'f0') {
    const fund = parciais.find((p) => p.encontrada && Math.abs(cents(p.freq, f0)) < 100);
    if (fund) ref = fund.db;
    else aviso = 'A fundamental não aparece no espectro (está abaixo do ruído). Os valores estão em relação ao pico mais forte.';
  }
  let somaE = 0;
  for (const p of parciais) if (p.encontrada) somaE += Math.pow(10, p.db / 10);
  const lista = parciais.map((p) => {
    const razao = p.freq / f0;
    const hInt = Math.max(1, Math.round(razao));
    if (!p.encontrada) return { ...p, razao, dbRef: null, lin: null, energia: 0, desvioCents: null };
    const dbRef = p.db - ref;
    return {
      ...p,
      razao,
      dbRef,
      lin: Math.pow(10, dbRef / 20),
      energia: Math.pow(10, p.db / 10) / somaE,
      desvioCents: cents(p.freq, hInt * f0),
      harmonicoProximo: hInt,
    };
  });
  return { parciais: lista, aviso, referenciaEfetiva: aviso ? 'pico' : referencia };
}

/** Descritores simples, calculados a partir das parciais da tabela. */
export function descritores(parciais, f0, modo) {
  const ach = parciais.filter((p) => p.encontrada);
  if (ach.length === 0) return null;
  let sa = 0, sfa = 0;
  for (const p of ach) { const a = Math.pow(10, p.db / 20); sa += a; sfa += a * p.freq; }
  const centroide = sfa / sa;
  let impar = 0, par = 0;
  if (modo === 'harmonico') {
    for (const p of ach) {
      if (p.k === 1) continue;
      const e = Math.pow(10, p.db / 10);
      if (p.k % 2) impar += e; else par += e;
    }
  }
  const inarm = ach.filter((p) => p.k > 1).map((p) => Math.abs(cents(p.freq, p.k * f0)));
  return {
    centroide,
    centroideRazao: centroide / f0,
    imparesPares: modo === 'harmonico' && par > 0 && impar > 0 ? 10 * Math.log10(impar / par) : null,
    inarmonicidade: modo === 'harmonico' && inarm.length ? inarm.reduce((a, b) => a + b, 0) / inarm.length : null,
    acima40: ach.filter((p) => p.db > -40).length,
    encontradas: ach.length,
  };
}

/**
 * Análise completa de um áudio já normalizado.
 * opcoes: { inicio, fim, f0 (opcional, força a fundamental), modo, n, referencia }
 */
export function analisar(audio, opcoes = {}, espCache = null) {
  const { canais, sr } = audio;
  const tr = opcoes.inicio != null ? { inicio: opcoes.inicio, fim: opcoes.fim } : trechoAutomatico(canais, sr);
  const esp = espCache || espectro(canais, sr, tr.inicio, tr.fim);
  const det = detectarF0(esp);
  const f0Auto = det ? det.f0 : null;
  const f0 = opcoes.f0 ? refinarF0(esp, opcoes.f0) : f0Auto;
  const modo = opcoes.modo || 'harmonico';
  const n = opcoes.n || 10;
  const brutas = !f0 ? [] : modo === 'harmonico' ? parciaisHarmonicas(esp, f0, n) : parciaisLivres(esp, f0, n);
  const ref = aplicarReferencia(brutas, f0, opcoes.referencia || 'f0', esp);
  return {
    trecho: tr,
    espectro: esp,
    f0Auto,
    f0,
    picoForte: picoMaisForte(esp),
    parciais: ref.parciais,
    aviso: ref.aviso,
    referenciaEfetiva: ref.referenciaEfetiva,
    descritores: f0 ? descritores(ref.parciais, f0, modo) : null,
  };
}
