// FFT radix-2 iterativa (Cooley–Tukey), sem dependências.
// Uso: potenciaFFT(sinal, N) -> Float64Array com |X[k]|^2 para k = 0..N/2

const cache = new Map();

function tabelas(N) {
  if (cache.has(N)) return cache.get(N);
  const bits = Math.log2(N);
  if (!Number.isInteger(bits)) throw new Error('N deve ser potência de 2');
  const rev = new Uint32Array(N);
  for (let i = 0; i < N; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const cos = new Float64Array(N / 2);
  const sin = new Float64Array(N / 2);
  for (let i = 0; i < N / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / N);
    sin[i] = -Math.sin((2 * Math.PI * i) / N);
  }
  const t = { rev, cos, sin };
  cache.set(N, t);
  return t;
}

/** FFT complexa in-place. re/im: Float64Array de tamanho N (potência de 2). */
export function fft(re, im) {
  const N = re.length;
  const { rev, cos, sin } = tabelas(N);
  for (let i = 0; i < N; i++) {
    const j = rev[i];
    if (j > i) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1;
    const step = N / size;
    for (let start = 0; start < N; start += size) {
      for (let k = 0; k < half; k++) {
        const wr = cos[k * step], wi = sin[k * step];
        const a = start + k, b = a + half;
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr; im[a] += xi;
      }
    }
  }
}

/** Espectro de potência de um sinal real (com zero-padding até N). */
export function potenciaFFT(sinal, N) {
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  re.set(sinal.length > N ? sinal.subarray(0, N) : sinal);
  fft(re, im);
  const out = new Float64Array(N / 2 + 1);
  for (let k = 0; k <= N / 2; k++) out[k] = re[k] * re[k] + im[k] * im[k];
  return out;
}
