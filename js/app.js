// Parciais do Timbre — interface
import * as A from './analise.js';
import { nota, notaTexto } from './notas.js';
import { T } from './textos.js';
import * as X from './exportar.js';
import {
  corDoTimbre, corDaParcial, lambdaDaPosicao, posicaoNaFaixa, posicaoNaSerie, textoSobre, NIVEL_FUNDAMENTAL_DB_NPS,
  LAMBDA_MIN, LAMBDA_MAX, LAMBDA_INI_PADRAO, LAMBDA_FIM_PADRAO,
} from './cor.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const fmt = (v, casas = 1) => (v == null || !Number.isFinite(v)) ? '—'
  : v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const fmtSinal = (v, casas = 1) => (v == null || !Number.isFinite(v)) ? '—' : (v > 0.0001 ? '+' : v < -0.0001 ? '−' : '') + fmt(Math.abs(v), casas);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------------------
// Textos (todos vêm de textos.js)
function texto(caminho) { return caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), T); }
for (const el of $$('[data-t]')) {
  const v = texto(el.dataset.t);
  if (v != null) el.innerHTML = Array.isArray(v) ? v[0] : v;
}

// ---------------------------------------------------------------------------
// Estado (guardado no navegador)
const CHAVE = 'parciais-timbre-v1';
const PADRAO = {
  config: { n: 10, modo: 'harmonico', referencia: 'f0', unidade: 'db' },
  porArquivo: {},           // { arquivo: { inicio, fim, f0 } } — escolhas do usuário
  atual: null,
  aba: 'um',
  eixoLog: false,
  comparar: ['la-flauta.wav', 'la-oboe.wav', 'la-clarinete-em-bb.wav', null],
  mostrar: 'amp',
  yLinear: false,           // eixo vertical do espectro: dB (padrão) ou linear
  escalaCor: 'lin',         // peso das parciais na cor: 'lin' ou 'db'
  metodoCor: 'centroide',   // 'centroide' (centro de gravidade f/f0 → uma cor) ou 'mistura' (luzes em Hz absolutos)
  lambdaIni: LAMBDA_INI_PADRAO, // nm do início da faixa (f0, ou 20 Hz na mistura)
  lambdaFim: LAMBDA_FIM_PADRAO, // nm do fim da faixa (n×f0, ou 20 kHz na mistura)
  mapaCor: 'oit',           // escala da faixa: 'lin' ou 'oit' (oitavas)
};
let estado = carregarEstado();
function carregarEstado() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (s) delete s.passoCor; // da fórmula antiga (círculo cromático)
    if (s && 'lambda20' in s) { delete s.lambda20; delete s.lambda20k; delete s.mapaCor; } // da 1ª versão do espectro visível
    // só o número de parciais é escolhido pelo usuário; referência (f0), modo (harmônico) e unidade (dB) são fixos
    if (s) return { ...structuredClone(PADRAO), ...s, config: { ...PADRAO.config, n: s.config?.n ?? PADRAO.config.n } };
  } catch (e) { /* sem armazenamento: segue com o padrão */ }
  return structuredClone(PADRAO);
}
function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ } }

let manifest = [];
let porArquivo = {};

// ---------------------------------------------------------------------------
// Cores (lidas do CSS para acompanhar o tema claro/escuro)
function cores() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    superficie: v('--superficie'), superficie2: v('--superficie-2'), texto1: v('--texto-1'), texto2: v('--texto-2'),
    mudo: v('--mudo'), grade: v('--grade'), eixo: v('--eixo'), borda: v('--borda'),
    serie: [v('--serie-1'), v('--serie-2'), v('--serie-3'), v('--serie-4')],
    lavado: v('--acento-lavado'),
    calor: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => v(`--calor-${i}`)),
  };
}
function temaEscuro() {
  const t = document.documentElement.dataset.theme;
  if (t) return t === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

// ---------------------------------------------------------------------------
// Carregamento e cache dos áudios e espectros
const audios = new Map();
function carregarAudio(arq) {
  if (!audios.has(arq)) {
    const p = (async () => {
      const resp = await fetch('audios/' + encodeURIComponent(arq));
      if (!resp.ok) throw new Error(`Não foi possível carregar o arquivo ${arq} (erro ${resp.status}).`);
      const buf = await resp.arrayBuffer();
      const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ctx = new Ctx(2, 1, 44100);
      const ab = await ctx.decodeAudioData(buf);
      const canais = [];
      for (let c = 0; c < ab.numberOfChannels; c++) canais.push(ab.getChannelData(c).slice());
      const nz = A.normalizarPico(canais);
      return {
        canais: nz.canais, sr: ab.sampleRate, dur: ab.duration,
        mono: A.mixMono(nz.canais), auto: A.trechoAutomatico(nz.canais, ab.sampleRate),
      };
    })();
    p.catch(() => audios.delete(arq));
    audios.set(arq, p);
  }
  return audios.get(arq);
}

const espectros = new Map();
function espectroCache(arq, aud, tr) {
  const chave = `${arq}|${tr.inicio.toFixed(3)}|${tr.fim.toFixed(3)}`;
  if (!espectros.has(chave)) {
    if (espectros.size > 80) espectros.delete(espectros.keys().next().value);
    espectros.set(chave, A.espectro(aud.canais, aud.sr, tr.inicio, tr.fim));
  }
  return espectros.get(chave);
}

/** Analisa um arquivo com as escolhas atuais (trecho, f0, configuração). */
async function analisarArquivo(arq) {
  const item = porArquivo[arq];
  const aud = await carregarAudio(arq);
  const ov = estado.porArquivo[arq] || {};
  const personalizado = ov.inicio != null && ov.fim != null;
  const tr = personalizado ? { inicio: ov.inicio, fim: ov.fim } : aud.auto;
  const esp = espectroCache(arq, aud, tr);
  let f0Forcada = null, origemF0 = 'auto';
  if (ov.f0) { f0Forcada = ov.f0; origemF0 = 'usuario'; }
  else if (item.f0Referencia) { f0Forcada = item.f0Referencia; origemF0 = 'manifest'; }
  const c = estado.config;
  const r = A.analisar(aud, { inicio: tr.inicio, fim: tr.fim, f0: f0Forcada, modo: c.modo, n: c.n, referencia: c.referencia }, esp);
  return { ...r, trecho: tr, nome: item.nome, familia: item.familia, arquivo: arq, origemF0, trechoPersonalizado: personalizado, audio: aud };
}

function definirEscolha(arq, campos) {
  const atual = { ...(estado.porArquivo[arq] || {}), ...campos };
  for (const k of Object.keys(atual)) if (atual[k] == null) delete atual[k];
  if (Object.keys(atual).length) estado.porArquivo[arq] = atual; else delete estado.porArquivo[arq];
  salvar();
}

// ---------------------------------------------------------------------------
// Valores conforme a unidade escolhida
const ROTULO_UNIDADE = { db: 'dB', lin: 'amplitude linear', energia: '% da energia' };
function valorAmp(p, unidade = estado.config.unidade) {
  if (!p || !p.encontrada) return null;
  if (unidade === 'db') return p.dbRef;
  if (unidade === 'lin') return p.lin;
  return p.energia * 100;
}
function fmtAmp(v, unidade = estado.config.unidade) {
  if (v == null) return '—';
  if (unidade === 'db') return fmtSinal(v, 1) + ' dB';
  if (unidade === 'lin') return fmt(v, 3);
  return fmt(v, 1) + '%';
}
function rotuloParcial(p) { return estado.config.modo === 'picos' ? `pico ${p.k}` : `${p.k}ª`; }

// ---------------------------------------------------------------------------
// Avisos rápidos
let toastTimer;
function avisar(msg) {
  const el = $('#aviso-flutuante');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}
function erroGlobal(msg) {
  const el = $('#erro-global');
  el.innerHTML = msg; el.hidden = !msg;
}

// ---------------------------------------------------------------------------
// Plotly: aparência comum
function layoutBase(extra = {}) {
  const c = cores();
  return {
    paper_bgcolor: c.superficie, plot_bgcolor: c.superficie,
    font: { family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', color: c.texto2, size: 12 },
    margin: { l: 58, r: 16, t: 28, b: 48 },
    separators: ',.',
    hoverlabel: { bgcolor: c.superficie, bordercolor: c.eixo, font: { color: c.texto1, size: 13 } },
    xaxis: { gridcolor: c.grade, linecolor: c.eixo, zeroline: false, tickfont: { color: c.mudo }, title: { font: { color: c.texto2 } } },
    yaxis: { gridcolor: c.grade, linecolor: c.eixo, zeroline: false, tickfont: { color: c.mudo }, title: { font: { color: c.texto2 } } },
    legend: { orientation: 'h', x: 0, y: 1.02, yanchor: 'bottom', font: { color: c.texto2 } },
    ...extra,
  };
}
const configPlotly = (nome) => ({
  displaylogo: false, responsive: true,
  modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines', 'hoverCompareCartesian', 'hoverClosestCartesian'],
  toImageButtonOptions: { format: 'png', scale: 2, filename: nome },
});
function plotlyPronto() { return typeof window.Plotly !== 'undefined'; }

/** bargap que limita a largura de cada barra (ou grupo de barras) a ~`maxPx` pixels. */
function bargapPara(div, nCategorias, barrasPorGrupo = 1, maxPx = 24) {
  const largura = Math.max(200, div.clientWidth - 80);
  const slot = largura / Math.max(1, nCategorias);
  const ocupado = Math.min(slot * 0.7, maxPx * barrasPorGrupo + (barrasPorGrupo - 1) * 3);
  return Math.max(0.15, 1 - ocupado / slot);
}

// ---------------------------------------------------------------------------
// Abas
function mostrarAba(aba) {
  estado.aba = aba; salvar();
  for (const b of $$('.abas button')) b.setAttribute('aria-selected', String(b.dataset.aba === aba));
  for (const s of $$('.aba')) s.hidden = s.id !== `aba-${aba}`;
  renderAba();
}
function renderAba() {
  if (estado.aba === 'um') renderUm();
  else if (estado.aba === 'comparar') renderComparar();
  else renderGeral();
}

// ---------------------------------------------------------------------------
// Número de parciais (controle ao lado do espectro e, compacto, nas outras abas)
function definirN(n) {
  estado.config.n = Math.max(1, Math.min(20, Math.round(+n || PADRAO.config.n)));
  salvar();
  sincronizarControles();
  renderAba();
}
function sincronizarControles() {
  const n = estado.config.n;
  $('#n-parciais').value = n;
  $('#n-valor').textContent = n;
  for (const el of $$('input[data-cfg="n"]')) el.value = n;
  for (const el of $$('input[name="eixo"]')) el.checked = el.value === (estado.eixoLog ? 'log' : 'linear');
  for (const el of $$('input[name="eixoY"]')) el.checked = el.value === (estado.yLinear ? 'lin' : 'db');
  for (const el of $$('input[name="escala-cor"]')) el.checked = el.value === estado.escalaCor;
  for (const el of $$('input[name="mapa-cor"]')) el.checked = el.value === estado.mapaCor;
  for (const el of $$('input[name="metodo-cor"]')) el.checked = el.value === estado.metodoCor;
  const [pa, pb] = pontas();
  $('#rot-lambda-ini').textContent = `${pa} →`;
  $('#rot-lambda-fim').textContent = `${pb} →`;
  for (const [id, chave] of [['#lambda-ini', 'lambdaIni'], ['#lambda-fim', 'lambdaFim']]) {
    const el = $(id), nm = estado[chave], hex = corDaParcial(nm).hex;
    Object.assign(el, { min: LAMBDA_MIN, max: LAMBDA_MAX, value: nm });
    el.style.accentColor = hex;
    $(`${id}-valor`).innerHTML = `<span class="cor-chip" style="background:${hex}"></span>${nm} nm`;
  }
  $('#btn-lambda-padrao').disabled = estado.lambdaIni === LAMBDA_INI_PADRAO && estado.lambdaFim === LAMBDA_FIM_PADRAO;
}
function montarConfigCompacta() {
  const html = `
    <label>${T.nParciais.titulo} <input type="number" data-cfg="n" min="1" max="20" step="1"></label>
    <span class="pequeno">${T.nParciais.texto}</span>`;
  for (const box of $$('[data-config-compacta]')) box.innerHTML = html;
  for (const el of $$('input[data-cfg="n"]')) el.addEventListener('change', () => definirN(el.value));
}

// ---------------------------------------------------------------------------
// ABA 1 — um instrumento
let ultimo = null;      // último resultado mostrado
let tokenUm = 0;

async function renderUm() {
  const arq = estado.atual;
  $('#sel-instrumento').value = arq;
  const tk = ++tokenUm;
  $('#aba-um').classList.add('carregando');
  let r;
  try {
    r = await analisarArquivo(arq);
  } catch (e) {
    erroGlobal(`<b>Erro ao analisar.</b> ${esc(e.message)}<br>Se você abriu o arquivo index.html direto do computador, o navegador bloqueia a leitura dos áudios: use o endereço publicado (GitHub Pages) ou um servidor local (veja o README).`);
    $('#aba-um').classList.remove('carregando');
    return;
  }
  if (tk !== tokenUm) return;
  erroGlobal('');
  ultimo = r;
  $('#aba-um').classList.remove('carregando');
  $('#titulo-instrumento').textContent = `— ${r.nome}`;
  arrasto = null;
  desenharOnda();
  renderTrechoInfo();
  renderFundamental(r);
  renderEspectro(r);
  renderTabelaParciais(r);
  renderPerfil(r);
  renderCor(r);
  renderDescritores(r);
}

// ---------- forma de onda e trecho ----------
const onda = $('#onda');
let arrasto = null;   // { modo: 'ini'|'fim'|'mover', x0, ini0, fim0, ini, fim }
let tocando = null;   // { fonte, t0, ini, fim }

function trechoAtual() {
  if (!ultimo) return null;
  if (arrasto) return { inicio: arrasto.ini, fim: arrasto.fim };
  return ultimo.trecho;
}

function desenharOnda() {
  if (!ultimo) return;
  const aud = ultimo.audio;
  const dpr = window.devicePixelRatio || 1;
  const w = onda.clientWidth, h = onda.clientHeight;
  if (onda.width !== Math.round(w * dpr) || onda.height !== Math.round(h * dpr)) {
    onda.width = Math.round(w * dpr); onda.height = Math.round(h * dpr);
  }
  const g = onda.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const c = cores();
  g.clearRect(0, 0, w, h);
  const eixoH = 20, ah = h - eixoH, meio = ah / 2;
  const x = (t) => (t / aud.dur) * w;
  // trecho
  const tr = trechoAtual();
  g.fillStyle = c.lavado;
  g.fillRect(x(tr.inicio), 0, x(tr.fim) - x(tr.inicio), ah);
  // forma de onda (mín/máx por pixel)
  const n = aud.mono.length, porPx = n / w;
  g.fillStyle = c.texto2;
  for (let px = 0; px < w; px++) {
    let mn = 1, mx = -1;
    const a = Math.floor(px * porPx), b = Math.min(n, Math.floor((px + 1) * porPx));
    for (let i = a; i < b; i++) { const v = aud.mono[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    if (mx < mn) continue;
    const y1 = meio - mx * (meio - 4), y2 = meio - mn * (meio - 4);
    g.fillRect(px, y1, 1, Math.max(1, y2 - y1));
  }
  // bordas do trecho, com "alças"
  g.fillStyle = c.serie[0];
  for (const t of [tr.inicio, tr.fim]) {
    const xx = x(t);
    g.fillRect(xx - 1, 0, 2, ah);
    g.beginPath(); g.roundRect ? g.roundRect(xx - 5, meio - 14, 10, 28, 4) : g.rect(xx - 5, meio - 14, 10, 28); g.fill();
  }
  // eixo de tempo
  g.fillStyle = c.mudo; g.font = '11px system-ui, sans-serif'; g.textAlign = 'center';
  g.fillRect(0, ah, w, 1);
  const passo = w < 420 ? 1 : 0.5;
  for (let t = 0; t <= aud.dur + 1e-9; t += passo) {
    const xx = Math.min(w - 12, Math.max(12, x(t)));
    g.fillRect(x(t), ah, 1, 4);
    g.fillText(`${fmt(t, passo < 1 ? 1 : 0)} s`, xx, ah + 15);
  }
  // cursor de reprodução
  if (tocando && tocando.pos != null) {
    g.fillStyle = c.serie[1];
    g.fillRect(x(tocando.pos) - 1, 0, 2, ah);
  }
}

function renderTrechoInfo() {
  const tr = trechoAtual();
  if (!tr) return;
  $('#trecho-ini').value = tr.inicio.toFixed(2);
  $('#trecho-fim').value = tr.fim.toFixed(2);
  $('#trecho-ini').max = $('#trecho-fim').max = ultimo.audio.dur.toFixed(2);
  const pers = arrasto ? true : ultimo.trechoPersonalizado;
  $('#trecho-info').textContent = `${fmt(tr.fim - tr.inicio, 2)} s · ${pers ? T.trecho.personalizado : T.trecho.auto}`;
  $('#btn-trecho-auto').disabled = !ultimo.trechoPersonalizado && !arrasto;
}

function limitarTrecho(ini, fim, dur) {
  const min = A.PARAMS.trechoMinimo;
  ini = Math.max(0, Math.min(ini, dur - min));
  fim = Math.max(ini + min, Math.min(fim, dur));
  return { ini, fim };
}

function tempoDoEvento(ev) {
  const r = onda.getBoundingClientRect();
  return ((ev.clientX - r.left) / r.width) * ultimo.audio.dur;
}
function zonaDoEvento(ev) {
  const r = onda.getBoundingClientRect();
  const tr = ultimo.trecho, dur = ultimo.audio.dur;
  const px = ev.clientX - r.left;
  const xi = (tr.inicio / dur) * r.width, xf = (tr.fim / dur) * r.width;
  const tol = ev.pointerType === 'touch' ? 18 : 9;
  if (Math.abs(px - xi) <= tol) return 'ini';
  if (Math.abs(px - xf) <= tol) return 'fim';
  if (px > xi && px < xf) return 'mover';
  return 'fora';
}
onda.addEventListener('pointermove', (ev) => {
  if (!ultimo) return;
  if (!arrasto) {
    const z = zonaDoEvento(ev);
    onda.style.cursor = z === 'ini' || z === 'fim' ? 'ew-resize' : z === 'mover' ? 'grab' : 'pointer';
    return;
  }
  const t = tempoDoEvento(ev), dur = ultimo.audio.dur, min = A.PARAMS.trechoMinimo;
  let { ini0, fim0 } = arrasto, ini = ini0, fim = fim0;
  if (arrasto.modo === 'ini') ini = Math.max(0, Math.min(t, fim0 - min));
  else if (arrasto.modo === 'fim') fim = Math.min(dur, Math.max(t, ini0 + min));
  else {
    const d = t - arrasto.t0, len = fim0 - ini0;
    ini = Math.max(0, Math.min(ini0 + d, dur - len)); fim = ini + len;
  }
  arrasto.ini = ini; arrasto.fim = fim;
  desenharOnda(); renderTrechoInfo();
});
onda.addEventListener('pointerdown', (ev) => {
  if (!ultimo) return;
  const z = zonaDoEvento(ev);
  const tr = ultimo.trecho, t = tempoDoEvento(ev);
  if (z === 'fora') {
    // clique fora: leva o trecho (mesma duração) para perto do ponto clicado
    const len = tr.fim - tr.inicio;
    const lim = limitarTrecho(t - len / 2, t + len / 2, ultimo.audio.dur);
    arrasto = { modo: 'mover', t0: t, ini0: lim.ini, fim0: lim.ini + len, ini: lim.ini, fim: lim.ini + len };
  } else {
    arrasto = { modo: z, t0: t, ini0: tr.inicio, fim0: tr.fim, ini: tr.inicio, fim: tr.fim };
  }
  onda.setPointerCapture(ev.pointerId);
  onda.style.cursor = z === 'mover' || z === 'fora' ? 'grabbing' : 'ew-resize';
  desenharOnda(); renderTrechoInfo();
});
function soltar() {
  if (!arrasto) return;
  const { ini, fim } = arrasto;
  arrasto = null;
  definirEscolha(estado.atual, { inicio: +ini.toFixed(3), fim: +fim.toFixed(3) });
  renderUm();
}
onda.addEventListener('pointerup', soltar);
onda.addEventListener('pointercancel', soltar);

function trechoPorCampos() {
  if (!ultimo) return;
  const lim = limitarTrecho(+$('#trecho-ini').value, +$('#trecho-fim').value, ultimo.audio.dur);
  definirEscolha(estado.atual, { inicio: +lim.ini.toFixed(3), fim: +lim.fim.toFixed(3) });
  renderUm();
}
$('#trecho-ini').addEventListener('change', trechoPorCampos);
$('#trecho-fim').addEventListener('change', trechoPorCampos);
$('#btn-trecho-auto').addEventListener('click', () => {
  definirEscolha(estado.atual, { inicio: null, fim: null });
  renderUm();
  avisar('Trecho automático restaurado.');
});
window.addEventListener('resize', () => { if (estado.aba === 'um') desenharOnda(); });

// ---------- reprodução ----------
let ctxAudio = null;
const BOTOES_OUVIR = ['#btn-tocar-trecho', '#btn-tocar-tudo'];
function atualizarBotoesOuvir() {
  for (const s of BOTOES_OUVIR) {
    const b = $(s);
    b.textContent = tocando && tocando.botao === s ? T.ouvir.parar : texto(b.dataset.rotulo);
  }
}
function parar() {
  if (tocando) { try { tocando.fonte.stop(); } catch (e) { /* já parou */ } }
  tocando = null;
  atualizarBotoesOuvir();
  desenharOnda();
}
function tocar(ini, fim, botao) {
  if (!ultimo) return;
  parar();
  const aud = ultimo.audio;
  ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
  if (ctxAudio.state === 'suspended') ctxAudio.resume();
  const buf = ctxAudio.createBuffer(aud.canais.length, aud.canais[0].length, aud.sr);
  aud.canais.forEach((c, i) => {
    const d = buf.getChannelData(i);
    for (let k = 0; k < c.length; k++) d[k] = c[k] * 0.8;
  });
  const fonte = ctxAudio.createBufferSource();
  fonte.buffer = buf;
  fonte.connect(ctxAudio.destination);
  fonte.start(0, ini, fim - ini);
  const est = { fonte, t0: ctxAudio.currentTime, ini, fim, pos: ini, botao };
  tocando = est;
  atualizarBotoesOuvir();
  fonte.onended = () => { if (tocando === est) { tocando = null; atualizarBotoesOuvir(); desenharOnda(); } };
  const animar = () => {
    if (tocando !== est) return;
    est.pos = ini + (ctxAudio.currentTime - est.t0);
    desenharOnda();
    if (est.pos < fim) requestAnimationFrame(animar);
  };
  requestAnimationFrame(animar);
}
// cada botão alterna entre "Ouvir" e "Parar"
$('#btn-tocar-tudo').addEventListener('click', () => {
  if (tocando && tocando.botao === '#btn-tocar-tudo') return parar();
  if (ultimo) tocar(0, ultimo.audio.dur, '#btn-tocar-tudo');
});
$('#btn-tocar-trecho').addEventListener('click', () => {
  if (tocando && tocando.botao === '#btn-tocar-trecho') return parar();
  const tr = trechoAtual();
  if (tr) tocar(tr.inicio, tr.fim, '#btn-tocar-trecho');
});
atualizarBotoesOuvir();

// ---------- fundamental ----------
function renderFundamental(r) {
  const el = $('#f0-leitura');
  if (!r.f0) { el.innerHTML = '<div class="f0-nota">—</div><div class="f0-origem">Não foi possível detectar a fundamental.</div>'; return; }
  const n = nota(r.f0);
  const centsTxt = n.cents === 0 ? 'afinada' : `${n.cents > 0 ? '+' : '−'}${Math.abs(n.cents)} cents`;
  let origem = T.fundamental.origem[r.origemF0];
  if (r.origemF0 !== 'auto' && r.f0Auto) origem += ` · a detecção automática daria ${notaTexto(r.f0Auto)} (${fmt(r.f0Auto, 1)} Hz)`;
  el.innerHTML = `
    <div class="f0-nota">${n.nome}<small>${n.nomePt}</small></div>
    <div class="f0-hz">${fmt(r.f0, 1)} Hz · ${centsTxt}</div>
    <div class="f0-origem">${esc(origem)}</div>`;
  $('#btn-f0-auto').hidden = r.origemF0 !== 'usuario';
}
function mudarF0(f) {
  if (!f || f < 20 || f > 8000) return;
  definirEscolha(estado.atual, { f0: +f.toFixed(3) });
  renderUm();
}
$('#btn-oitava-abaixo').addEventListener('click', () => ultimo && mudarF0(ultimo.f0 / 2));
$('#btn-oitava-acima').addEventListener('click', () => ultimo && mudarF0(ultimo.f0 * 2));
$('#btn-f0-auto').addEventListener('click', () => {
  definirEscolha(estado.atual, { f0: null });
  renderUm();
  avisar('Voltando à fundamental automática.');
});

// ---------- espectro ----------
function dadosEspectro(esp, fMax) {
  // reduz o número de pontos preservando os picos (máximo de cada grupo)
  const { db, df } = esp;
  const kMax = Math.min(db.length - 1, Math.ceil(fMax / df));
  const passo = Math.max(1, Math.floor(kMax / 6000));
  const x = [], y = [];
  for (let k = 1; k <= kMax; k += passo) {
    let kb = k;
    for (let j = k; j < Math.min(k + passo, kMax + 1); j++) if (db[j] > db[kb]) kb = j;
    x.push(kb * df); y.push(db[kb]);
  }
  return { x, y };
}

function renderEspectro(r) {
  if (!plotlyPronto()) return;
  const c = cores();
  const esp = r.espectro;
  const encontradas = r.parciais.filter((p) => p.encontrada);
  const fUlt = encontradas.length ? encontradas[encontradas.length - 1].freq : (r.f0 || 1000) * estado.config.n;
  const fMax = Math.min(esp.sr / 2, Math.max(fUlt + (r.f0 || 200) * 1.5, r.picoForte.freq * 1.2));
  const d = dadosEspectro(esp, Math.min(esp.sr / 2, Math.max(fMax * 2, 8000)));
  const log = estado.eixoLog;
  // eixo vertical: dB (pico mais forte = 0 dB) ou amplitude linear (pico mais forte = 1)
  const yLin = estado.yLinear;
  const Y = (db) => (yLin ? Math.pow(10, db / 20) : db);
  const yMin = yLin ? 0 : Math.max(-110, Math.floor((esp.piso - 12) / 10) * 10);
  const yTopo = yLin ? 1.12 : 8;

  const tracos = [
    {
      x: d.x, y: d.y.map(Y), type: 'scatter', mode: 'lines', name: 'Espectro',
      line: { color: c.texto2, width: 1.5 },
      hovertemplate: yLin ? '%{x:,.1f} Hz<br>amplitude %{y:,.4f}<extra></extra>' : '%{x:,.1f} Hz<br>%{y:,.1f} dB<extra></extra>',
    },
    {
      x: encontradas.map((p) => p.freq), y: encontradas.map((p) => Y(p.db)),
      type: 'scatter', mode: 'markers+text', name: 'Parciais da tabela',
      text: encontradas.map((p) => rotuloParcial(p)), textposition: 'top center',
      textfont: { color: c.texto1, size: 11 },
      marker: { color: c.serie[0], size: 10, line: { color: c.superficie, width: 2 } },
      customdata: encontradas.map((p) => [rotuloParcial(p), notaTexto(p.freq), fmtAmp(valorAmp(p))]),
      hovertemplate: '<b>%{customdata[0]} parcial</b><br>%{x:,.1f} Hz · %{customdata[1]}<br>Na tabela: %{customdata[2]}<extra></extra>',
      cliponaxis: false,
    },
    {
      x: [r.picoForte.freq], y: [Y(r.picoForte.db)], type: 'scatter', mode: 'markers', name: 'Pico mais forte',
      marker: { color: c.serie[1], size: 15, symbol: 'diamond-open', line: { width: 2.5, color: c.serie[1] } },
      hovertemplate: '<b>Pico mais forte</b><br>%{x:,.1f} Hz · ' + notaTexto(r.picoForte.freq) + '<extra></extra>',
    },
  ];
  if (r.f0) {
    tracos.unshift({
      x: [r.f0, r.f0], y: [yMin, yTopo], type: 'scatter', mode: 'lines', name: 'Fundamental (f0)',
      line: { color: c.serie[0], width: 1.5, dash: 'dash' }, hoverinfo: 'skip',
    });
  }
  const shapes = [];
  const annotations = r.f0 ? [{
    x: log ? Math.log10(r.f0) : r.f0, y: 1, xref: 'x', yref: 'paper', yanchor: 'bottom', showarrow: false,
    text: `f0 = ${fmt(r.f0, 1)} Hz`, font: { color: c.texto1, size: 11 }, bgcolor: c.superficie,
  }] : [];
  const fMin = log ? Math.max(20, (r.f0 || 100) / 2.5) : 0;
  const estreito = $('#grafico-espectro').clientWidth < 560;
  const lay = layoutBase({
    shapes, annotations,
    margin: { l: estreito ? 48 : 58, r: 12, t: 30, b: estreito ? 120 : 96 },
    hovermode: 'closest',
    xaxis: {
      ...layoutBase().xaxis, title: { text: estreito ? '' : 'Frequência (Hz)', font: { color: c.texto2 } },
      ticksuffix: estreito ? ' Hz' : '',
      type: log ? 'log' : 'linear',
      range: log ? [Math.log10(fMin), Math.log10(fMax)] : [0, fMax],
    },
    yaxis: {
      ...layoutBase().yaxis,
      title: {
        text: yLin ? (estreito ? 'Amplitude' : 'Amplitude (pico mais forte = 1)') : (estreito ? 'Nível (dB)' : 'Nível (dB, pico mais forte = 0)'),
        font: { color: c.texto2 },
      },
      range: [yMin, yTopo],
    },
    legend: { orientation: 'h', x: 0, y: estreito ? -0.14 : -0.16, yanchor: 'top', font: { color: c.texto2 } },
  });
  const div = $('#grafico-espectro');
  Plotly.react(div, tracos, lay, configPlotly(`espectro-${r.arquivo.replace('.wav', '')}`));
  if (!div._cliqueLigado) {
    div._cliqueLigado = true;
    div.on('plotly_click', (ev) => {
      if (!ultimo || !ev.points || !ev.points.length) return;
      const f = escolherPicoPerto(ultimo.espectro, ev.points[0].x);
      if (!f) return;
      mudarF0(f);
      avisar(`Fundamental definida por você: ${notaTexto(f)} (${fmt(f, 1)} Hz).`);
    });
  }
}

/** Ao clicar no espectro, procura o pico mais forte perto do ponto clicado (±3%). */
function escolherPicoPerto(esp, fClique) {
  const { db, df } = esp;
  const larg = Math.max(4 * df, fClique * 0.03);
  const k0 = Math.max(1, Math.floor((fClique - larg) / df)), k1 = Math.min(db.length - 2, Math.ceil((fClique + larg) / df));
  let kb = -1;
  for (let k = k0; k <= k1; k++) if (db[k] >= db[k - 1] && db[k] >= db[k + 1] && (kb < 0 || db[k] > db[kb])) kb = k;
  if (kb < 0) return null;
  const al = db[kb - 1], be = db[kb], ga = db[kb + 1], den = al - 2 * be + ga;
  const p = den === 0 ? 0 : 0.5 * (al - ga) / den;
  return (kb + p) * df;
}

for (const el of $$('input[name="eixo"]')) {
  el.addEventListener('change', () => {
    if (!el.checked) return;
    estado.eixoLog = el.value === 'log'; salvar();
    if (ultimo) renderEspectro(ultimo);
  });
}
for (const el of $$('input[name="eixoY"]')) {
  el.addEventListener('change', () => {
    if (!el.checked) return;
    estado.yLinear = el.value === 'lin'; salvar();
    if (ultimo) renderEspectro(ultimo);
  });
}

// ---------- tabela de parciais ----------
function renderTabelaParciais(r) {
  const u = estado.config.unidade, picos = estado.config.modo === 'picos';
  const col = T.tabela.colunas;
  const refTxt = r.referenciaEfetiva === 'f0' ? 'fundamental = 0 dB' : 'pico mais forte = 0 dB';
  const ampSub = u === 'db' ? refTxt : u === 'lin' ? (r.referenciaEfetiva === 'f0' ? 'fundamental = 1' : 'pico mais forte = 1') : 'soma = 100%';
  const aviso = $('#aviso-parciais');
  aviso.hidden = !r.aviso;
  aviso.textContent = r.aviso || '';
  let html = `<thead><tr>
    <th>${picos ? 'Pico' : col.k[0]}<small>${picos ? 'por ordem de frequência' : col.k[1]}</small></th>
    <th>${col.freq[0]}<small>${col.freq[1]}</small></th>
    <th>${col.razao[0]}<small>${col.razao[1]}</small></th>
    <th>${col.nota[0]}<small>${col.nota[1]}</small></th>
    <th>Amplitude<small>${esc(ROTULO_UNIDADE[u])} · ${esc(ampSub)}</small></th>
  </tr></thead><tbody>`;
  for (const p of r.parciais) {
    const ehRef = p.encontrada && u !== 'energia' && Math.abs(p.dbRef) < 0.05;
    if (!p.encontrada) {
      html += `<tr class="nao-encontrada" title="${esc(T.tabela.naoEncontradaDica)}"><td>${rotuloParcial(p)}</td><td>≈ ${fmt(p.freq, 1)}</td><td>${fmt(p.razao, 3)}</td><td>${notaTexto(p.freq)}</td><td>${T.tabela.naoEncontrada}</td></tr>`;
      continue;
    }
    html += `<tr class="${ehRef ? 'referencia' : ''}">
      <td>${rotuloParcial(p)}${ehRef ? '<span class="marca-ref">referência</span>' : ''}</td>
      <td>${fmt(p.freq, 1)}</td>
      <td>${fmt(p.razao, 3)}</td>
      <td>${notaTexto(p.freq)}</td>
      <td>${fmtAmp(valorAmp(p))}</td></tr>`;
  }
  html += '</tbody>';
  $('#tabela-parciais').innerHTML = html;
  $('#tabela-parciais').classList.toggle('modo-picos', picos);
}

// ---------- perfil (barras) ----------
function barrasAmplitude(parciais, unidade) {
  // em dB as barras sobem a partir de um "chão", para que parciais fortes fiquem altas
  const vals = parciais.map((p) => valorAmp(p, unidade));
  if (unidade !== 'db') return { y: vals.map((v) => v ?? 0), base: 0, vals };
  const validos = vals.filter((v) => v != null);
  const chao = Math.min(-60, Math.floor((Math.min(...validos, 0) - 5) / 10) * 10);
  return { y: vals.map((v) => (v == null ? 0 : v - chao)), base: chao, vals };
}
function eixoYAmp(unidade, base, ref) {
  const estreito = window.innerWidth < 600;
  const titulo = unidade === 'db' ? (estreito ? 'Amplitude (dB)' : `Amplitude (dB, ${ref === 'f0' ? 'fundamental' : 'pico mais forte'} = 0)`) : unidade === 'lin' ? 'Amplitude linear' : '% da energia';
  return { title: { text: titulo }, ...(unidade === 'db' ? { range: [base, null] } : { rangemode: 'tozero' }) };
}
function renderPerfil(r) {
  if (!plotlyPronto()) return;
  const c = cores(), u = estado.config.unidade;
  const b = barrasAmplitude(r.parciais, u);
  const yMax = u === 'db' ? Math.max(5, ...b.vals.filter((v) => v != null)) + 3 : null;
  const lay = layoutBase({
    bargap: bargapPara($('#grafico-perfil'), r.parciais.length), showlegend: false, margin: { l: 58, r: 16, t: 12, b: 44 },
    xaxis: { ...layoutBase().xaxis, title: { text: estado.config.modo === 'picos' ? 'Pico' : 'Parcial' }, type: 'category' },
    yaxis: { ...layoutBase().yaxis, ...eixoYAmp(u, b.base, r.referenciaEfetiva) },
  });
  if (u === 'db') lay.yaxis.range = [b.base, yMax];
  Plotly.react($('#grafico-perfil'), [{
    type: 'bar', x: r.parciais.map(rotuloParcial), y: b.y, base: b.base,
    marker: { color: c.serie[0], cornerradius: 4 },
    customdata: b.vals.map((v) => fmtAmp(v, u)),
    hovertemplate: '<b>%{x}</b><br>%{customdata}<extra></extra>',
  }], lay, configPlotly(`perfil-${r.arquivo.replace('.wav', '')}`));
}

// ---------- cor do timbre ----------
/** Mapeamento atual: método, escala e as cores das pontas da faixa. */
function mapaAtual() {
  return { metodo: estado.metodoCor, escala: estado.mapaCor, lambdaIni: estado.lambdaIni, lambdaFim: estado.lambdaFim };
}
const ehMistura = () => estado.metodoCor === 'mistura';

/** Cor do timbre a partir das parciais da tabela (as n escolhidas no passo 3). */
function corDoResultado(r) {
  if (!r || !r.f0) return null;
  return corDoTimbre(r.parciais, estado.config.n, estado.escalaCor, mapaAtual());
}
const fmtRgb = (rgb) => rgb.join(', ');
const ROTULO_PESO = { lin: 'pesos lineares (fundamental = 1)', db: `pesos em dB NPS (fundamental = ${NIVEL_FUNDAMENTAL_DB_NPS} dB)` };
const ROTULO_ESCALA = { lin: 'linear', oit: 'em oitavas' };
/** Rótulos das pontas da faixa: f0 e n×f0 (centroide) ou 20 Hz e 20 kHz (mistura). */
const pontas = () => (ehMistura() ? ['20 Hz', '20 kHz'] : ['f0', `${estado.config.n}×f0`]);
const descricaoMapa = () => {
  const [a, b] = pontas();
  return `${ehMistura() ? 'mistura das luzes das parciais' : 'centro de gravidade das parciais (f ÷ f0)'}; ${a} → ${estado.lambdaIni} nm, ${b} → ${estado.lambdaFim} nm, ${ROTULO_ESCALA[estado.mapaCor]}`;
};

const fmtHz = (f) => (f >= 1000 ? `${fmt(f / 1000, f % 1000 ? 1 : 0)} kHz` : `${fmt(f, 0)} Hz`);
function eixoFaixa() {
  const m = mapaAtual(), n = estado.config.n;
  if (m.metodo === 'mistura') {
    return {
      pos: (f) => posicaoNaFaixa(f, m.escala), rotulo: fmtHz,
      marcas: m.escala === 'oit' ? [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000] : [20, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000],
    };
  }
  return {
    pos: (x) => posicaoNaSerie(x, n, m.escala),
    rotulo: (x) => (x === 1 ? 'f0' : `${x}×f0`),
    marcas: Array.from({ length: n }, (_, i) => i + 1),
  };
}

/** Faixa pintada com o mapeamento, uma marca por parcial (altura = peso) e, no centroide, o ponteiro. */
const faixa = $('#faixa-cor');
function desenharFaixa(c) {
  const dpr = window.devicePixelRatio || 1;
  const w = faixa.clientWidth, h = faixa.clientHeight;
  if (!w) return;
  if (faixa.width !== Math.round(w * dpr) || faixa.height !== Math.round(h * dpr)) {
    faixa.width = Math.round(w * dpr); faixa.height = Math.round(h * dpr);
  }
  const g = faixa.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const cs = cores(), mapa = mapaAtual(), eixo = eixoFaixa();
  const mx = 14, larg = w - 2 * mx;
  const yBanda = 62, altBanda = 24, yEixo = yBanda + altBanda;
  // banda colorida
  for (let px = 0; px < larg; px++) {
    g.fillStyle = corDaParcial(lambdaDaPosicao(px / larg, mapa)).hex;
    g.fillRect(mx + px, yBanda, 1.5, altBanda);
  }
  // eixo
  g.fillStyle = cs.mudo; g.font = '11px system-ui, sans-serif'; g.textAlign = 'center';
  let ultimoX = -Infinity;
  eixo.marcas.forEach((v, i) => {
    const x = mx + eixo.pos(v) * larg;
    g.fillRect(x - 0.5, yEixo, 1, 4);
    if (x - ultimoX < 40) return;
    g.fillText(eixo.rotulo(v), Math.min(w - 22, Math.max(22, x)), yEixo + 16);
    ultimoX = x;
  });
  if (!c) return;
  // parciais
  const itens = c.itens.filter((it) => it && it.peso > 0);
  const maxParte = Math.max(...itens.map((it) => it.parte));
  const altMax = ehMistura() ? 42 : 30;
  let ultimoRot = -Infinity;
  g.textAlign = 'center'; g.font = '600 11px system-ui, sans-serif';
  for (const it of itens) {
    const x = mx + it.posicao * larg, hh = Math.max(4, altMax * (it.parte / maxParte));
    g.fillStyle = cs.texto1;
    g.fillRect(x - 2.5, yBanda - hh - 1, 5, hh + 1 + altBanda);
    g.fillStyle = it.hex;
    g.fillRect(x - 1.5, yBanda - hh, 3, hh + altBanda - 1);
    if (x - ultimoRot >= 16) {
      g.fillStyle = cs.texto1;
      g.fillText(`${it.k}`, x, yBanda - hh - 5);
      ultimoRot = x;
    }
  }
  // centro de gravidade: um triângulo com a cor do timbre, abaixo da banda
  if (c.centroide) {
    const x = mx + c.centroide.posicao * larg;
    g.beginPath();
    g.moveTo(x, yBanda + altBanda - 2); g.lineTo(x - 9, yBanda + altBanda + 13); g.lineTo(x + 9, yBanda + altBanda + 13); g.closePath();
    g.fillStyle = c.hex; g.fill();
    g.lineWidth = 2; g.strokeStyle = cs.texto1; g.stroke();
  }
}

function renderCor(r) {
  const c = corDoResultado(r);
  $('#titulo-cor').textContent = `— ${r.nome}`;
  desenharFaixa(c);
  const amostra = $('#cor-amostra');
  for (const b of ['#btn-copiar-hex', '#btn-copiar-rgb', '#btn-baixar-cor']) $(b).disabled = !c;
  if (!c) {
    amostra.style.background = 'var(--superficie-2)'; amostra.style.color = 'var(--texto-2)';
    $('#cor-amostra-hex').textContent = '—';
    $('#cor-valores').innerHTML = `<p class="ajuda">${T.cor.semCor}</p>`;
    $('#tabela-cor').innerHTML = '';
    return;
  }
  const R = T.cor.rotulos;
  amostra.style.background = c.hex;
  amostra.style.color = textoSobre(c.rgb);
  amostra.setAttribute('aria-label', `Cor do timbre: ${c.hex}`);
  $('#cor-amostra-hex').textContent = c.hex;
  let terceiro;
  if (c.centroide) {
    terceiro = `<div><dt>${R.centro}</dt><dd>${fmt(c.indice, 2)} × f0 <small>· ${fmt(c.centroide.lambda, 0)} nm</small></dd></div>`;
  } else {
    const usadas = c.itens.filter((it) => it && it.peso > 0);
    const nmMin = Math.min(...usadas.map((it) => it.lambda)), nmMax = Math.max(...usadas.map((it) => it.lambda));
    terceiro = `<div><dt>${R.faixa}</dt><dd>${fmt(nmMax, 0)}${usadas.length > 1 ? `–${fmt(nmMin, 0)}` : ''} nm <small>· ${usadas.length} ${usadas.length === 1 ? 'parcial' : 'parciais'}</small></dd></div>`;
  }
  $('#cor-valores').innerHTML = `
    <div><dt>${R.hex}</dt><dd>${c.hex}</dd></div>
    <div><dt>${R.rgb}</dt><dd>${fmtRgb(c.rgb)}</dd></div>${terceiro}`;

  let html = `<thead><tr>
    <th>Parcial</th><th>Frequência<small>em Hz</small></th><th>Razão<small>f ÷ f0</small></th>
    <th>Luz<small>comprimento de onda</small></th>
    <th>Peso<small>${c.escala === 'db' ? `dB NPS · fundamental = ${NIVEL_FUNDAMENTAL_DB_NPS} dB` : 'amplitude linear · fundamental = 1'}</small></th>
    <th>Parte<small>% do total</small></th></tr></thead><tbody>`;
  for (let i = 0; i < c.n; i++) {
    const it = c.itens[i];
    if (!it) { html += `<tr class="nao-encontrada"><td>${i + 1}ª</td><td>—</td><td>—</td><td>—</td><td>acima do limite da gravação</td><td>0%</td></tr>`; continue; }
    const luz = `<span class="cor-chip" style="background:${it.hex}"></span>${fmt(it.lambda, 0)} nm`;
    if (!it.encontrada) {
      html += `<tr class="nao-encontrada"><td>${it.k}ª</td><td>≈ ${fmt(it.freq, 1)}</td><td>${fmt(it.razao, 3)}</td><td>${luz}</td><td>${T.tabela.naoEncontrada}</td><td>0%</td></tr>`;
      continue;
    }
    html += `<tr><td>${it.k}ª</td><td>${fmt(it.freq, 1)}</td><td>${fmt(it.razao, 3)}</td><td>${luz}</td><td>${fmt(it.peso, c.escala === 'db' ? 1 : 4)}</td><td>${fmt(100 * it.parte, 1)}%</td></tr>`;
  }
  if (c.centroide) {
    html += `<tr class="centro"><td>${R.centroCurto}</td><td></td><td>${fmt(c.indice, 3)}</td><td><span class="cor-chip" style="background:${c.hex}"></span>${fmt(c.centroide.lambda, 0)} nm</td><td></td><td>100%</td></tr>`;
  }
  $('#tabela-cor').innerHTML = html + '</tbody>';
}

function aoMudarCor(salvarAgora = true) {
  if (salvarAgora) salvar();
  sincronizarControles();
  if (ultimo) renderCor(ultimo);
}
for (const [nome, chave] of [['escala-cor', 'escalaCor'], ['mapa-cor', 'mapaCor'], ['metodo-cor', 'metodoCor']]) {
  for (const el of $$(`input[name="${nome}"]`)) {
    el.addEventListener('change', () => { if (el.checked) { estado[chave] = el.value; aoMudarCor(); } });
  }
}
for (const [id, chave] of [['#lambda-ini', 'lambdaIni'], ['#lambda-fim', 'lambdaFim']]) {
  const el = $(id);
  const ler = () => { estado[chave] = Math.max(LAMBDA_MIN, Math.min(LAMBDA_MAX, Math.round(+el.value))); };
  el.addEventListener('input', () => { ler(); aoMudarCor(false); });
  el.addEventListener('change', () => { ler(); aoMudarCor(true); });
}
$('#btn-lambda-padrao').addEventListener('click', () => {
  estado.lambdaIni = LAMBDA_INI_PADRAO; estado.lambdaFim = LAMBDA_FIM_PADRAO;
  aoMudarCor();
});
window.addEventListener('resize', () => { if (estado.aba === 'um' && ultimo) desenharFaixa(corDoResultado(ultimo)); });

function copiar(textoCopiar) {
  const ok = () => avisar(`Copiado: ${textoCopiar}`);
  const falha = () => avisar(`Não foi possível copiar. O valor é ${textoCopiar}`);
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(textoCopiar).then(ok, falha);
  else falha();
}
$('#btn-copiar-hex').addEventListener('click', () => { const c = corDoResultado(ultimo); if (c) copiar(c.hex); });
$('#btn-copiar-rgb').addEventListener('click', () => { const c = corDoResultado(ultimo); if (c) copiar(fmtRgb(c.rgb)); });
$('#btn-baixar-cor').addEventListener('click', () => {
  const c = corDoResultado(ultimo);
  if (!c) return;
  const mapa = mapaAtual();
  const bx = 40, bl = 400, by = 300, bh = 20;
  let stops = '';
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    stops += `<stop offset="${(100 * t).toFixed(2)}%" stop-color="${corDaParcial(lambdaDaPosicao(t, mapa)).hex}"/>`;
  }
  const itens = c.itens.filter((it) => it && it.peso > 0);
  const maxParte = Math.max(...itens.map((it) => it.parte));
  const marcas = itens.map((it) => {
    const x = bx + it.posicao * bl, hh = Math.max(4, 40 * (it.parte / maxParte));
    return `<rect x="${(x - 2).toFixed(1)}" y="${(by - hh).toFixed(1)}" width="4" height="${(hh + bh).toFixed(1)}" fill="${it.hex}" stroke="#000000" stroke-width="0.8"/>`;
  }).join('');
  const ponteiro = c.centroide
    ? (() => { const x = bx + c.centroide.posicao * bl; return `<polygon points="${x},${by + bh - 2} ${x - 8},${by + bh + 12} ${x + 8},${by + bh + 12}" fill="${c.hex}" stroke="#000000" stroke-width="1.5"/>`; })()
    : '';
  const [pa, pb] = pontas();
  const rotEixo = [pa, pb].map((txt, i) => `<text x="${i ? bx + bl : bx}" y="${by + bh + 26}" text-anchor="${i ? 'end' : 'start'}" font-family="sans-serif" font-size="11" fill="#555555">${esc(txt)}</text>`).join('');
  const linhaValor = c.centroide ? ` · centro de gravidade ${fmt(c.indice, 2)} × f0 (${fmt(c.centroide.lambda, 0)} nm)` : '';
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="410" viewBox="0 0 480 410">
  <defs><linearGradient id="faixa" x1="0" x2="1" y1="0" y2="0">${stops}</linearGradient></defs>
  <rect width="480" height="410" fill="#ffffff"/>
  <text x="240" y="36" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#000000">${esc(ultimo.nome)}</text>
  <text x="240" y="62" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#000000">Cor RGB: [${fmtRgb(c.rgb)}] · ${c.hex}</text>
  <rect x="90" y="78" width="300" height="150" fill="${c.hex}"/>
  <rect x="${bx}" y="${by}" width="${bl}" height="${bh}" fill="url(#faixa)"/>
  ${marcas}${ponteiro}${rotEixo}
  <text x="240" y="370" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#555555">${c.n} parciais · f0 = ${fmt(ultimo.f0, 1)} Hz · ${esc(ROTULO_PESO[c.escala])}${linhaValor}</text>
  <text x="240" y="390" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#555555">${esc(descricaoMapa())}</text>
</svg>`;
  X.baixar(`cor-do-timbre-${ultimo.arquivo.replace('.wav', '')}.svg`, svg, 'image/svg+xml');
});

// ---------- descritores ----------
function renderDescritores(r) {
  const d = r.descritores, D = T.descritores;
  if (!d) { $('#descritores').innerHTML = '<p class="ajuda">Sem parciais para calcular.</p>'; return; }
  const item = (t, valor) => `<div class="descritor"><div class="rotulo">${t[0]}</div><div class="valor">${valor}</div><p class="ajuda">${t[1]}</p></div>`;
  $('#descritores').innerHTML =
    item(D.centroide, `${fmt(d.centroide, 0)} Hz <small>· ${fmt(d.centroideRazao, 2)} × f0</small>`) +
    item(D.imparPar, d.imparesPares == null ? '—' : `${fmtSinal(d.imparesPares, 1)} dB`) +
    item(D.inarm, d.inarmonicidade == null ? '—' : `${fmt(d.inarmonicidade, 1)} <small>cents</small>`) +
    item(D.acima40, `${d.acima40} <small>de ${r.parciais.length}</small>`);
}

$('#btn-baixar-um').addEventListener('click', () => {
  if (!ultimo) return;
  X.baixar(`parciais-${ultimo.arquivo.replace('.wav', '')}.csv`, X.csvCompleto([ultimo], estado.config, true));
});

// ---------------------------------------------------------------------------
// ABA 2 — comparar
let tokenComp = 0;
function montarSelectsComparar() {
  const box = $('#comparar-selects');
  box.innerHTML = '';
  estado.comparar.forEach((arq, i) => {
    const lab = document.createElement('label');
    lab.innerHTML = `<span class="amostra" style="background:var(--serie-${i + 1})"></span>`;
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', `Instrumento ${i + 1}`);
    sel.innerHTML = (i >= 2 ? `<option value="">${T.comparar.nenhum}</option>` : '') + opcoesInstrumentos();
    sel.value = arq || '';
    sel.addEventListener('change', () => { estado.comparar[i] = sel.value || null; salvar(); renderComparar(); });
    lab.appendChild(sel);
    box.appendChild(lab);
  });
}
async function renderComparar() {
  if (!plotlyPronto()) return;
  const tk = ++tokenComp;
  const escolhidos = estado.comparar.map((a, i) => ({ arq: a, i })).filter((x) => x.arq);
  $('#aba-comparar').classList.add('carregando');
  let res;
  try { res = await Promise.all(escolhidos.map(async (x) => ({ ...x, r: await analisarArquivo(x.arq) }))); }
  catch (e) { erroGlobal(`<b>Erro ao analisar.</b> ${esc(e.message)}`); return; }
  if (tk !== tokenComp) return;
  $('#aba-comparar').classList.remove('carregando');
  erroGlobal('');
  const c = cores(), u = estado.config.unidade, n = estado.config.n;
  const rotulos = Array.from({ length: n }, (_, k) => (estado.config.modo === 'picos' ? `pico ${k + 1}` : `${k + 1}ª`));
  let chao = 0;
  if (u === 'db') {
    const todos = res.flatMap((x) => x.r.parciais.map((p) => valorAmp(p)).filter((v) => v != null));
    chao = Math.min(-60, Math.floor((Math.min(...todos, 0) - 5) / 10) * 10);
  }
  const tracos = res.map((x) => {
    const vals = rotulos.map((_, k) => valorAmp(x.r.parciais[k]));
    return {
      type: 'bar', name: x.r.nome, x: rotulos,
      y: vals.map((v) => (v == null ? 0 : u === 'db' ? v - chao : v)), base: u === 'db' ? chao : 0,
      marker: { color: c.serie[x.i], cornerradius: 3 },
      customdata: vals.map((v) => fmtAmp(v)),
      hovertemplate: `<b>${esc(x.r.nome)}</b> · %{x}<br>%{customdata}<extra></extra>`,
    };
  });
  const yMax = u === 'db' ? Math.max(5, ...res.flatMap((x) => x.r.parciais.map((p) => valorAmp(p)).filter((v) => v != null))) + 3 : null;
  const lay = layoutBase({
    barmode: 'group', bargap: bargapPara($('#grafico-comparar'), n, res.length, 18), bargroupgap: 0.1,
    margin: { l: 58, r: 16, t: 40, b: 48 },
    xaxis: { ...layoutBase().xaxis, title: { text: estado.config.modo === 'picos' ? 'Pico' : 'Parcial' }, type: 'category' },
    yaxis: { ...layoutBase().yaxis, ...eixoYAmp(u, chao, estado.config.referencia) },
  });
  if (u === 'db') lay.yaxis.range = [chao, yMax];
  Plotly.react($('#grafico-comparar'), tracos, lay, configPlotly('comparacao-parciais'));

  // tabela com os mesmos valores
  let html = `<thead><tr><th>Parcial</th>${res.map((x) => `<th><span class="amostra" style="background:var(--serie-${x.i + 1})"></span>${esc(x.r.nome)}<small>f0 = ${notaTexto(x.r.f0)} · ${fmt(x.r.f0, 1)} Hz</small></th>`).join('')}</tr></thead><tbody>`;
  rotulos.forEach((rot, k) => {
    html += `<tr><td>${rot}</td>${res.map((x) => `<td>${fmtAmp(valorAmp(x.r.parciais[k]))}</td>`).join('')}</tr>`;
  });
  $('#tabela-comparar').innerHTML = html + '</tbody>';
}

// ---------------------------------------------------------------------------
// ABA 3 — tabela geral
let tokenGeral = 0;
let resultadosGeral = [];
const MOSTRAR = {
  amp: { rotulo: T.geral.mostrarOpcoes.amp, valor: (p) => valorAmp(p), fmt: (v) => fmtAmp(v) },
  freq: { rotulo: T.geral.mostrarOpcoes.freq, valor: (p) => (p.encontrada ? p.freq : null), fmt: (v) => fmt(v, 1) },
  razao: { rotulo: T.geral.mostrarOpcoes.razao, valor: (p) => (p.encontrada ? p.razao : null), fmt: (v) => fmt(v, 3) },
};
function corCalor(db) {
  // cor pela força da parcial em relação ao pico mais forte do som (−60 a 0 dB)
  const c = cores();
  if (db == null) return { fundo: 'transparent', texto: '' };
  const t = Math.max(0, Math.min(1, (db + 60) / 60));
  const i = Math.min(7, Math.round(t * 7));
  const escuro = temaEscuro();
  const textoClaro = escuro ? i <= 5 : i >= 4;
  return { fundo: c.calor[i], texto: textoClaro ? '#ffffff' : '#0b0b0b' };
}
async function renderGeral() {
  const tk = ++tokenGeral;
  const prog = $('#progresso');
  const total = manifest.length;
  const res = [];
  let mostrouProgresso = false;
  for (let i = 0; i < total; i++) {
    const arq = manifest[i].arquivo;
    if (!mostrouProgresso && !audiosProntos.has(arq)) {
      prog.hidden = false; mostrouProgresso = true;
    }
    if (mostrouProgresso) {
      $('.progresso-barra', prog).style.width = `${(100 * i) / total}%`;
      $('.progresso-texto', prog).textContent = `${T.geral.analisando} ${manifest[i].nome}… (${i + 1} de ${total})`;
    }
    try { res.push(await analisarArquivo(arq)); audiosProntos.add(arq); }
    catch (e) { erroGlobal(`<b>Erro ao analisar ${esc(manifest[i].nome)}.</b> ${esc(e.message)}`); }
    if (tk !== tokenGeral) return;
  }
  prog.hidden = true;
  resultadosGeral = res;
  desenharTabelaGeral();
}
const audiosProntos = new Set();

function desenharTabelaGeral() {
  const res = resultadosGeral, n = estado.config.n, m = MOSTRAR[estado.mostrar] || MOSTRAR.amp;
  const c = cores();
  $('#legenda-calor').innerHTML = `<span>Cor da célula = força da parcial: mais fraca</span><span class="rampa">${c.calor.map((x) => `<span style="background:${x}"></span>`).join('')}</span><span>mais forte</span>`;
  const rot = (k) => (estado.config.modo === 'picos' ? `pico ${k}` : `${k}ª`);
  let html = `<thead><tr><th class="inst">Instrumento</th><th>Fundamental</th><th title="${esc(`Cor do timbre (${n} parciais, ${ROTULO_PESO[estado.escalaCor]}; ${descricaoMapa()})`)}">Cor<br><span class="pequeno">${ehMistura() ? 'mistura' : 'centroide'} · ${estado.lambdaIni}→${estado.lambdaFim} nm</span></th>${Array.from({ length: n }, (_, k) => `<th>${rot(k + 1)}</th>`).join('')}</tr></thead><tbody>`;
  let familia = null;
  for (const r of res) {
    if (r.familia !== familia) {
      familia = r.familia;
      html += `<tr class="familia"><th colspan="${n + 3}">${esc(familia)}</th></tr>`;
    }
    const cr = corDoResultado(r);
    const celCor = cr
      ? `<td class="cor-cel" title="${esc(`${r.nome}\nRGB ${fmtRgb(cr.rgb)} · ${cr.hex}`)}"><span class="cor-chip" style="background:${cr.hex}"></span>${cr.hex}</td>`
      : '<td class="cor-cel vazio">—</td>';
    html += `<tr><th class="inst"><button type="button" data-abrir="${esc(r.arquivo)}">${esc(r.nome)}</button></th>
      <td class="f0">${notaTexto(r.f0)}<br>${fmt(r.f0, 1)} Hz</td>${celCor}`;
    for (let k = 0; k < n; k++) {
      const p = r.parciais[k];
      if (!p || !p.encontrada) { html += `<td class="cel vazio" title="${esc(T.tabela.naoEncontradaDica)}">—</td>`; continue; }
      const cor = corCalor(p.db);
      const dica = `${r.nome} · ${rot(p.k)} parcial\n${fmt(p.freq, 1)} Hz · ${notaTexto(p.freq)}\nrazão ${fmt(p.razao, 3)}\n${fmtAmp(valorAmp(p))}`;
      html += `<td class="cel" style="background:${cor.fundo};color:${cor.texto}" title="${esc(dica)}">${m.fmt(m.valor(p))}</td>`;
    }
    html += '</tr>';
  }
  $('#tabela-geral').innerHTML = html + '</tbody>';
}
$('#tabela-geral').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-abrir]');
  if (!b) return;
  estado.atual = b.dataset.abrir; salvar();
  mostrarAba('um');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function rotuloMostrar() {
  const u = estado.config.unidade;
  if (estado.mostrar === 'amp') return `amplitude em ${ROTULO_UNIDADE[u]} (${estado.config.referencia === 'f0' ? 'referência: fundamental' : 'referência: pico mais forte'})`;
  return MOSTRAR[estado.mostrar].rotulo;
}
$('#btn-csv-completo').addEventListener('click', () => resultadosGeral.length && X.baixar('parciais-todos-instrumentos.csv', X.csvCompleto(resultadosGeral, estado.config, true)));
$('#btn-csv-intl').addEventListener('click', () => resultadosGeral.length && X.baixar('parciais-todos-instrumentos-intl.csv', X.csvCompleto(resultadosGeral, estado.config, false)));
$('#btn-csv-resumido').addEventListener('click', () => {
  if (!resultadosGeral.length) return;
  const m = MOSTRAR[estado.mostrar] || MOSTRAR.amp;
  X.baixar('parciais-tabela-resumida.csv', X.csvResumido(resultadosGeral, estado.config, m.valor, rotuloMostrar(), true));
});
$('#btn-json').addEventListener('click', () => resultadosGeral.length && X.baixar('parciais-todos-instrumentos.json', X.json(resultadosGeral, estado.config), 'application/json'));
$('#btn-csv-cores').addEventListener('click', () => {
  if (!resultadosGeral.length) return;
  const lista = resultadosGeral.map((r) => ({ r, cor: corDoResultado(r) }));
  X.baixar(`cores-dos-timbres-${estado.metodoCor}-${estado.mapaCor === 'oit' ? 'oitavas' : 'linear'}-${estado.lambdaIni}-${estado.lambdaFim}nm-pesos-${estado.escalaCor === 'db' ? 'db' : 'linear'}.csv`,
    X.csvCores(lista, estado.config.n, estado.escalaCor, mapaAtual(), true));
});

// ---------------------------------------------------------------------------
// Seletor de instrumento
function opcoesInstrumentos() {
  const fams = [];
  for (const m of manifest) if (!fams.includes(m.familia)) fams.push(m.familia);
  return fams.map((f) => `<optgroup label="${esc(f)}">${manifest.filter((m) => m.familia === f).map((m) => `<option value="${esc(m.arquivo)}">${esc(m.nome)}</option>`).join('')}</optgroup>`).join('');
}
// ---------------------------------------------------------------------------
// Inicialização
async function iniciar() {
  try {
    const resp = await fetch('audios/manifest.json');
    if (!resp.ok) throw new Error(`erro ${resp.status}`);
    manifest = await resp.json();
  } catch (e) {
    erroGlobal('<b>Não foi possível carregar a lista de áudios (audios/manifest.json).</b> Se você abriu o arquivo index.html direto do computador, o navegador bloqueia essa leitura: use o endereço publicado (GitHub Pages) ou um servidor local, como explicado no README.');
    return;
  }
  porArquivo = Object.fromEntries(manifest.map((m) => [m.arquivo, m]));
  if (!porArquivo[estado.atual]) estado.atual = manifest[0].arquivo;
  estado.comparar = estado.comparar.map((a, i) => (a && porArquivo[a] ? a : i < 2 ? manifest[i].arquivo : null));

  $('#sel-instrumento').innerHTML = opcoesInstrumentos();
  $('#sel-instrumento').addEventListener('change', (ev) => { estado.atual = ev.target.value; salvar(); parar(); renderUm(); });

  const nIn = $('#n-parciais');
  nIn.addEventListener('input', () => { $('#n-valor').textContent = nIn.value; });
  nIn.addEventListener('change', () => definirN(nIn.value));

  const selM = $('#sel-mostrar');
  selM.innerHTML = Object.entries(MOSTRAR).map(([k, v]) => `<option value="${k}">${esc(v.rotulo)}</option>`).join('');
  selM.value = estado.mostrar;
  selM.addEventListener('change', () => { estado.mostrar = selM.value; salvar(); desenharTabelaGeral(); });

  montarConfigCompacta();
  montarSelectsComparar();
  sincronizarControles();

  for (const b of $$('.abas button')) b.addEventListener('click', () => mostrarAba(b.dataset.aba));
  // links no texto que levam a outra aba
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-ir-aba]');
    if (!a) return;
    ev.preventDefault();
    mostrarAba(a.dataset.irAba);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // a Plotly é carregada com "defer"; espera por ela se ainda não chegou
  if (!plotlyPronto()) {
    await new Promise((ok) => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        if (plotlyPronto() || Date.now() - t0 > 15000) { clearInterval(iv); ok(); }
      }, 50);
    });
    if (!plotlyPronto()) erroGlobal('<b>A biblioteca de gráficos não carregou.</b> Verifique a conexão com a internet e recarregue a página.');
  }
  mostrarAba(estado.aba || 'um');
}

// balões ⓘ: abrem junto do botão que os chamou (a API Popover cuida de abrir e fechar)
for (const pop of $$('.balao[popover]')) {
  pop.addEventListener('toggle', (ev) => {
    if (ev.newState !== 'open') return;
    const btn = $(`[popovertarget="${pop.id}"]`);
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth;
    const left = Math.max(16, Math.min(r.left + r.width / 2 - 28, vw - w - 16));
    let top = r.bottom + 8;
    if (top + h > window.innerHeight - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
    pop.style.left = `${left + window.scrollX}px`;
    pop.style.top = `${top + window.scrollY}px`;
  });
}

// ajuda, tema, restaurar
const dlg = $('#dlg-ajuda');
$('#btn-ajuda').addEventListener('click', () => dlg.showModal());
$('#btn-fechar-ajuda').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });

$('#btn-tema').addEventListener('click', () => {
  const novo = temaEscuro() ? 'light' : 'dark';
  document.documentElement.dataset.theme = novo;
  try { localStorage.setItem('parciais-timbre-tema', novo); } catch (e) { /* ignora */ }
  renderAba();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!document.documentElement.dataset.theme) renderAba(); });

$('#btn-restaurar').addEventListener('click', () => {
  if (!confirm(T.rodape.restaurarConfirma)) return;
  const aba = estado.aba;
  estado = structuredClone(PADRAO);
  estado.atual = manifest[0]?.arquivo; estado.aba = aba;
  estado.comparar = estado.comparar.map((a, i) => (a && porArquivo[a] ? a : i < 2 ? manifest[i].arquivo : null));
  salvar();
  sincronizarControles();
  montarSelectsComparar();
  $('#sel-mostrar').value = estado.mostrar;
  renderAba();
  avisar('Tudo voltou ao padrão.');
});

iniciar();
