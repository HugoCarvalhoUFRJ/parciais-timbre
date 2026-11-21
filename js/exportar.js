// Exportação dos resultados: CSV (Excel Brasil ou internacional) e JSON.

import { PARAMS } from './analise.js';
import { nota } from './notas.js';
import { NIVEL_FUNDAMENTAL_DB_NPS } from './cor.js';

const ROTULO_REF = { f0: 'fundamental (f0) = 0 dB', pico: 'pico mais forte = 0 dB' };
const ROTULO_MODO = { harmonico: 'harmônicas', picos: 'picos livres' };

function fmtNum(v, casas, br) {
  if (v == null || !Number.isFinite(v)) return '';
  const s = v.toFixed(casas);
  return br ? s.replace('.', ',') : s;
}

function celula(v, sep) {
  const s = String(v ?? '');
  return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function cabecalho(config, br) {
  const d = new Date();
  return [
    `# Parciais do Timbre — exportado em ${d.toLocaleString('pt-BR')}`,
    `# Referência: ${ROTULO_REF[config.referencia]}; modo: ${ROTULO_MODO[config.modo]}; ${config.n} parciais`,
    `# Espectro: Welch, quadro ${PARAMS.quadro} amostras, salto ${PARAMS.salto}, FFT ${PARAMS.nfft}, janela ${PARAMS.janela}; canais somados por potência`,
    `# Amplitudes em dB relativas à referência; "energia_%" soma 100% por instrumento; parciais não encontradas ficam em branco`,
    br ? '# Formato: separador ";" e vírgula decimal (Excel em português)' : '# Format: comma-separated, dot as decimal mark',
  ];
}

/** CSV "longo": uma linha por parcial, com todas as medidas. */
export function csvCompleto(resultados, config, br = true) {
  const sep = br ? ';' : ',';
  const linhas = cabecalho(config, br);
  linhas.push(['instrumento', 'familia', 'arquivo', 'f0_Hz', 'f0_nota', 'f0_origem', 'trecho_inicio_s', 'trecho_fim_s',
    'parcial', 'frequencia_Hz', 'razao_f_f0', 'nota', 'desvio_cents', 'amplitude_dB', 'amplitude_linear', 'energia_%', 'encontrada'].join(sep));
  for (const r of resultados) {
    for (const p of r.parciais) {
      const n = nota(p.freq);
      linhas.push([
        r.nome, r.familia, r.arquivo, fmtNum(r.f0, 2, br), nota(r.f0).nome, r.origemF0,
        fmtNum(r.trecho.inicio, 3, br), fmtNum(r.trecho.fim, 3, br),
        p.k, fmtNum(p.freq, 2, br), fmtNum(p.razao, 4, br), p.encontrada ? n.nome : '', p.encontrada ? n.cents : '',
        fmtNum(p.dbRef, 2, br), fmtNum(p.lin, 5, br), fmtNum(p.encontrada ? p.energia * 100 : null, 3, br),
        p.encontrada ? 'sim' : 'não',
      ].map((c) => celula(c, sep)).join(sep));
    }
  }
  return linhas.join('\r\n');
}

/** CSV "resumido": uma linha por instrumento, colunas P1..Pn com o valor mostrado. */
export function csvResumido(resultados, config, valor, rotuloValor, br = true) {
  const sep = br ? ';' : ',';
  const linhas = cabecalho(config, br);
  linhas.push(`# Valor nas colunas P1..P${config.n}: ${rotuloValor}`);
  const cols = ['instrumento', 'familia', 'f0_Hz', 'f0_nota'];
  for (let k = 1; k <= config.n; k++) cols.push(`P${k}`);
  linhas.push(cols.join(sep));
  for (const r of resultados) {
    const lin = [r.nome, r.familia, fmtNum(r.f0, 2, br), nota(r.f0).nome];
    for (let k = 0; k < config.n; k++) {
      const p = r.parciais[k];
      const v = p ? valor(p) : null;
      lin.push(fmtNum(v, 4, br));
    }
    linhas.push(lin.map((c) => celula(c, sep)).join(sep));
  }
  return linhas.join('\r\n');
}

/** CSV das cores: uma linha por instrumento, com as amplitudes usadas e o resultado. */
export function csvCores(lista, n, escala, mapa, br = true) {
  const sep = br ? ';' : ',';
  const linhas = [
    `# Parciais do Timbre — cores dos timbres, exportado em ${new Date().toLocaleString('pt-BR')}`,
    ...(mapa.metodo === 'mistura' ? [
      `# Método: mistura das luzes. Cada parcial vira uma luz: 20 Hz → ${mapa.lambdaIni} nm, 20 kHz → ${mapa.lambdaFim} nm, ${mapa.escala === 'oit' ? 'linear em oitavas (log2 da frequência)' : 'linear em Hz'}; interpolação na frequência da luz (c / λ)`,
      `# Cor do timbre = soma de a_k · RGB_k (RGB linear), com ${n} parciais, levada ao brilho máximo`,
    ] : [
      `# Método: centro de gravidade. centroide = soma(a_k · r_k) / soma(a_k), com r_k = f_k / f0 e ${n} parciais`,
      `# A faixa de 1 a ${n} (×f0) vai de ${mapa.lambdaIni} nm a ${mapa.lambdaFim} nm, ${mapa.escala === 'oit' ? 'linear em oitavas (log2 da razão)' : 'linear na razão'}; interpolação na frequência da luz (c / λ). A cor do timbre é a luz pura do centroide; lambda_k é a luz de cada parcial na mesma faixa`,
    ]),
    '# Cor de cada λ: aproximação de Dan Bruton (1996) para desenhar o espectro em monitores (degradê por trechos, gama 0,8, escurecendo abaixo de 420 nm e acima de 700 nm)',
    escala === 'db'
      ? `# a_k = nível da k-ésima parcial em dB NPS, supondo a fundamental a ${NIVEL_FUNDAMENTAL_DB_NPS} dB NPS (0 dB NPS = limiar de audição a 1 kHz); abaixo de 0 ou não encontrada = 0`
      : '# a_k = amplitude linear da k-ésima parcial (fundamental = 1); parcial não encontrada = 0',
    br ? '# Formato: separador ";" e vírgula decimal (Excel em português)' : '# Format: comma-separated, dot as decimal mark',
  ];
  const cols = ['instrumento', 'familia', 'f0_Hz', 'f0_nota'];
  for (let k = 1; k <= n; k++) cols.push(`f${k}_Hz`, `r${k}`, `lambda${k}_nm`, escala === 'db' ? `a${k}_dB_NPS` : `a${k}_linear`);
  cols.push('centroide_xf0', 'lambda_cor_nm', 'R', 'G', 'B', 'hex');
  linhas.push(cols.join(sep));
  for (const { r, cor } of lista) {
    const lin = [r.nome, r.familia, fmtNum(r.f0, 2, br), r.f0 ? nota(r.f0).nome : ''];
    for (let k = 0; k < n; k++) {
      const it = cor?.itens[k];
      lin.push(it ? fmtNum(it.freq, 2, br) : '', it ? fmtNum(it.razao, 4, br) : '', it ? fmtNum(it.lambda, 1, br) : '', it ? fmtNum(it.peso, 5, br) : '');
    }
    if (cor) lin.push(fmtNum(cor.indice, 4, br), cor.centroide ? fmtNum(cor.centroide.lambda, 1, br) : '', ...cor.rgb, cor.hex);
    else lin.push('', '', '', '', '', '');
    linhas.push(lin.map((c) => celula(c, sep)).join(sep));
  }
  return linhas.join('\r\n');
}

export function json(resultados, config) {
  return JSON.stringify({
    app: 'Parciais do Timbre',
    exportadoEm: new Date().toISOString(),
    configuracao: { ...config, parametrosEspectro: PARAMS },
    instrumentos: resultados.map((r) => ({
      nome: r.nome, familia: r.familia, arquivo: r.arquivo,
      f0: r.f0, f0Nota: nota(r.f0).nome, f0Origem: r.origemF0, trecho: r.trecho,
      descritores: r.descritores,
      parciais: r.parciais.map((p) => ({
        parcial: p.k, frequencia: p.freq, razao: p.razao, nota: p.encontrada ? nota(p.freq).nome : null,
        desvioCents: p.encontrada ? nota(p.freq).cents : null,
        amplitudeDb: p.dbRef, amplitudeLinear: p.lin, energia: p.encontrada ? p.energia : null, encontrada: p.encontrada,
      })),
    })),
  }, null, 2);
}

/** Dispara o download de um texto como arquivo. */
export function baixar(nomeArquivo, conteudo, tipo = 'text/csv') {
  const bom = tipo === 'text/csv' ? '﻿' : ''; // BOM: o Excel reconhece os acentos
  const blob = new Blob([bom + conteudo], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nomeArquivo;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
