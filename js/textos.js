// Todos os textos explicativos do app ficam aqui, para facilitar revisões.
// Pode editar à vontade: o HTML permitido é simples (<b>, <i>, <br>, <ul>, <li>, <p>).

export const T = {
  subtitulo: 'Extração das parciais de timbres instrumentais tocando a nota Lá',

  instrumento: {
    titulo: 'Instrumento',
    ajuda: 'Escolha o áudio que você quer analisar.',
  },

  abas: {
    um: 'Um instrumento',
    comparar: 'Comparar',
    tabela: 'Tabela geral',
  },

  ouvir: {
    ajuda: 'Ouça para conferir de ouvido o que os gráficos mostram. O volume de todos os áudios foi igualado (normalizado: o ponto mais forte de cada arquivo vale 1). Isso não muda as parciais, porque elas são sempre medidas <i>em relação</i> umas às outras.',
    inteira: '▶ Ouvir a nota inteira',
    trecho: '▶ Ouvir o trecho analisado',
    parar: '■ Parar',
  },

  trecho: {
    titulo: 'Trecho analisado',
    curto: 'A faixa destacada é o trecho medido. Arraste as bordas para mudar o início e o fim, ou o meio para deslocá-la.',
    info: '<p>Um som tem um começo (o <b>ataque</b>, quando o arco, o sopro ou o martelo põe o instrumento a vibrar), um meio (a <b>sustentação</b>) e um fim (o <b>decaimento</b>). O ataque é rico em ruídos passageiros; o timbre “estável” que queremos medir está no meio. Por isso o app escolhe automaticamente <b>1 segundo logo depois do ataque</b>.</p><p>Você pode mudar o trecho com o mouse (ou o dedo). Experimente, por exemplo, comparar o início e o fim de uma nota de piano: o timbre muda enquanto o som decai.</p><p>O trecho tem no mínimo 0,4 s, para que a medição seja confiável.</p>',
    automatico: 'Voltar ao trecho automático',
    personalizado: 'trecho escolhido por você',
    auto: 'trecho automático',
  },

  fundamental: {
    titulo: 'Fundamental (a nota que você ouve)',
    curto: 'Confira de ouvido. Se a oitava estiver errada, corrija com os botões ou clique num pico do espectro (passo 3).',
    info: '<p>A <b>fundamental</b> (f0) é a frequência da nota tocada — aqui, um Lá. Todas as parciais são numeradas a partir dela: a 2ª fica uma oitava acima, a 3ª uma quinta acima disso, a 4ª duas oitavas acima, e assim por diante.</p><p>O app encontra a fundamental sozinho, mas às vezes pode errar a <b>oitava</b>: em alguns instrumentos (corne inglês, trombone baixo, oboé) a fundamental é mais fraca que outras parciais. Se estiver errada, use os botões ou <b>clique num pico do espectro</b> para dizer “esta é a fundamental”.</p>',
    oitavaAbaixo: '↓ Uma oitava abaixo',
    oitavaAcima: '↑ Uma oitava acima',
    voltarAuto: 'Usar a detecção automática',
    origem: {
      auto: 'detectada automaticamente',
      manifest: 'definida na configuração do app (arquivo manifest.json)',
      usuario: 'definida por você',
    },
  },

  espectro: {
    titulo: 'Espectro',
    info: '<p>O espectro mostra <b>quais frequências</b> existem no som (eixo horizontal, em Hz) e <b>com que força</b> (eixo vertical). Cada pico é uma parcial: quanto mais alto, mais forte. Em dB, o pico mais alto do gráfico está em 0 dB e os outros têm valores negativos (mais fracos).</p><p>Os <b>pontos azuis numerados</b> são as parciais da tabela. A <b>linha tracejada</b> marca a fundamental; o <b>losango laranja</b> marca o pico mais forte do som (que nem sempre é a fundamental).</p><p>Para ampliar, arraste uma área no gráfico; clique duas vezes para voltar.</p>',
    clique: 'Clique num pico para defini-lo como fundamental.',
    eixoY: {
      titulo: 'Eixo vertical',
      db: { rotulo: 'dB' },
      lin: { rotulo: 'Linear' },
      info: '<p><b>dB (decibéis):</b> mostra ao mesmo tempo as parciais fortes e as fracas. É a escala mais próxima de como o ouvido percebe a intensidade. O pico mais forte fica em 0 dB.</p><p><b>Linear:</b> mostra a amplitude física, com o pico mais forte valendo 1. As parciais fracas quase somem: a −20 dB, uma parcial fica com 1/10 da altura; a −40 dB, com 1/100.</p>',
    },
    eixo: {
      titulo: 'Frequência',
      linear: { rotulo: 'Linear' },
      log: { rotulo: 'Log' },
      info: '<p><b>Linear:</b> as parciais aparecem <b>igualmente espaçadas</b>, cada uma f0 Hz depois da anterior (num Lá de 220 Hz: 220, 440, 660, 880 Hz…). É a melhor forma de enxergar a série harmônica.</p><p><b>Logarítmico:</b> cada <b>oitava</b> ocupa o mesmo espaço, como no teclado do piano. As parciais vão ficando mais próximas à medida que sobem, que é como o ouvido percebe as alturas.</p>',
    },
  },

  nParciais: {
    titulo: 'Parciais',
    texto: 'Quantas parciais entram no gráfico, na tabela e na cor (a fundamental é a 1ª). Vale para todos os instrumentos e abas.',
    info: '<p>Quantas parciais entram no gráfico, na tabela e na cor do timbre, contando a fundamental como a 1ª. Vale para todos os instrumentos e para as outras abas.</p><p>Com um número alto, as últimas parciais podem não aparecer. Há dois motivos. (1) As parciais mais agudas costumam ser muito fracas e se misturam ao <b>ruído de fundo</b> da gravação; aí não dá para medi-las com segurança, e elas aparecem como “não encontrada”. (2) Uma gravação só registra frequências até um certo limite (cerca de 22 000 Hz nestes arquivos): na celesta (Lá de 1760 Hz), por exemplo, só cabem umas 10 parciais.</p>',
  },

  tabela: {
    titulo: 'Parciais',
    colunas: {
      k: ['Parcial', 'número de ordem'],
      freq: ['Frequência', 'em Hz'],
      razao: ['Razão', 'frequência ÷ fundamental'],
      nota: ['Nota mais próxima', 'e desvio em cents (100 cents = 1 semitom)'],
      amp: ['Amplitude', ''],
    },
    naoEncontrada: 'não encontrada',
    naoEncontradaDica: 'Não há pico nesta posição, ou ele está no nível do ruído de fundo.',
    perfil: 'Perfil das parciais',
    perfilAjuda: 'O mesmo conteúdo da tabela, em forma de barras: a “impressão digital” do timbre.',
    outrasAbas: 'Vários instrumentos de uma vez: <a href="#" data-ir-aba="comparar">Comparar</a> (2 a 4 perfis lado a lado) ou <a href="#" data-ir-aba="tabela">Tabela geral</a> (todos, com download para o Excel).',
    baixar: 'Baixar as parciais deste instrumento (CSV)',
  },

  cor: {
    titulo: 'Cor do timbre',
    ajuda: 'O timbre vira uma cor do espectro visível (do vermelho ao violeta): quanto mais força nas parciais agudas, mais para o violeta.',
    info: '<p>A luz que enxergamos vai do <b>vermelho</b> (cerca de 700 nm) ao <b>violeta</b> (cerca de 400 nm). O app leva uma faixa sonora a esse espectro por uma <b>função linear</b>; nos controles abaixo da faixa colorida, você escolhe a cor de cada ponta.</p><p><b>Centro de gravidade</b> (padrão): a faixa vai da fundamental (f0) até a última parcial da tabela (n × f0; o n é o do passo 3). Cada parcial fica na posição da sua razão f ÷ f0 (2ª = 2 × f0, 3ª = 3 × f0…). Calcula-se o <b>centro de gravidade</b> das parciais, a razão média com cada parcial pesando conforme a sua amplitude, e ele recebe <b>uma única cor pura</b> (o triângulo abaixo da faixa). Um som só com a fundamental fica na ponta de f0 (vermelho, no padrão); quanto mais força nas parciais agudas, mais a cor anda para o violeta. Usar f ÷ f0, e não Hz, tira a <b>altura</b> da conta: como todos os áudios tocam Lá, a frequência absoluta diria só a oitava, e não o timbre. É o mesmo “índice espectral” do script <i>timbre_cor.py</i>, levado ao espectro visível.</p><p><b>Mistura das luzes</b> (opção): a faixa é a audível inteira, de 20 Hz a 20 kHz, em Hz absolutos. Cada parcial vira uma luz e a cor é a mistura delas. Como a fundamental costuma ser a parcial mais forte e todos tocam Lá, as cores ficam muito parecidas.</p><p>A conta é feita na <b>frequência da luz</b> (som mais agudo = luz de frequência mais alta), e o resultado é mostrado em nanômetros (nm), o comprimento de onda.</p>',
    metodo: {
      titulo: 'Método',
      centroide: 'Centro de gravidade',
      mistura: 'Mistura das luzes',
      info: '<p><b>Centro de gravidade</b> (padrão): uma única cor pura, a do ponto médio das parciais (razão f ÷ f0 pesada pela amplitude), numa faixa que vai de f0 a n × f0. Mostra o timbre sem a altura da nota, e as cores dos instrumentos ficam bem distintas.</p><p><b>Mistura das luzes</b>: cada parcial recebe a cor da sua frequência em Hz, numa faixa de 20 Hz a 20 kHz, e a cor do timbre é a mistura dessas luzes. A cor fica dominada pela fundamental, isto é, pela nota tocada, e os instrumentos ficam com cores parecidas.</p>',
    },
    mapa: {
      padrao: 'Padrão',
      info: '<p>Escolha a cor (o comprimento de onda da luz, em nanômetros) de cada ponta da faixa: no centro de gravidade, a fundamental (<b>f0</b>) e a última parcial (<b>n × f0</b>); na mistura, <b>20 Hz</b> e <b>20 kHz</b>. Os dois podem ir de 380 nm (violeta) a 750 nm (vermelho), em qualquer ordem: inverter as pontas inverte as cores.</p><p>O padrão é 700 nm (vermelho) no grave e 400 nm (violeta) no agudo: som grave = luz de frequência baixa.</p><p>Uma faixa mais estreita (por exemplo, 600 → 500 nm) usa menos cores e deixa os timbres mais parecidos; a faixa toda espalha mais as cores.</p>',
    },
    escalaFreq: {
      titulo: 'Escala',
      lin: 'Linear',
      oit: 'Em oitavas',
      info: '<p><b>Em oitavas</b> (padrão): cada <b>oitava</b> vale o mesmo trecho de cor, como no teclado do piano. No centro de gravidade, de f0 a 2 × f0 ocupa tanto quanto de 5 × f0 a 10 × f0. É mais próxima de como o ouvido percebe as alturas.</p><p><b>Linear</b>: cada Hz (ou cada parcial) vale o mesmo trecho de cor. As parciais ficam igualmente espaçadas na faixa. Na mistura, como as notas musicais ficam quase todas abaixo de 5 000 Hz, as parciais se concentram na ponta grave.</p>',
    },
    escala: {
      titulo: 'Pesos',
      lin: 'Linear',
      db: 'dB NPS',
      info: '<p><b>Linear</b> (padrão): cada parcial pesa a sua amplitude física, com a fundamental valendo 1. Uma parcial a −20 dB vale 0,1 e pesa <b>10 vezes menos</b> que a fundamental; a −40 dB vale 0,01. Por isso as parciais fracas quase não influenciam a cor.</p><p><b>dB NPS:</b> mais próxima de como o ouvido percebe a intensidade, as parciais fracas pesam bem mais. Usamos o <b>nível de pressão sonora</b> (NPS), em que 0 dB é o limiar da audição humana a 1000 Hz. Como as gravações não guardam o volume real, supomos a <b>fundamental a 60 dB</b> (volume de uma conversa): cada parcial vale 60 + o seu valor em dB na tabela; abaixo de 0 dB (inaudível), vale 0.</p><p><b>Atenção:</b> em dB NPS os pesos ficam parecidos entre si, e no centro de gravidade a maioria dos instrumentos se aglomera na ponta aguda (cores parecidas). A cor também depende do volume suposto.</p>',
    },
    copiarHex: 'Copiar o código',
    copiarRgb: 'Copiar o RGB',
    baixarSvg: 'Baixar a imagem (SVG)',
    usadas: 'Parciais usadas na cor',
    usadasAjuda: '<p>Para cada parcial: a frequência, a razão f ÷ f0, a luz da sua posição na faixa (comprimento de onda em nm e a cor), o peso (na escala escolhida) e a parte de cada uma no total. No centro de gravidade, a última linha é o próprio centro: a razão média e a cor do timbre.</p><p>Uma parcial “não encontrada” (no ruído ou acima do limite da gravação) entra com 0.</p>',
    rotulos: {
      hex: 'Código hexadecimal',
      rgb: 'RGB (0 a 255)',
      faixa: 'Luz das parciais',
      centro: 'Centro de gravidade',
      centroCurto: 'Centro',
    },
    semCor: 'Não há parciais medidas para calcular a cor.',
  },

  descritores: {
    titulo: 'Descritores do timbre',
    extra: '<b>Observação:</b> esta seção é um <b>complemento</b>, que vai além do que você precisa. As parciais (passo 4) e a cor (passo 5) já são o resultado da análise; os descritores abaixo são apenas números adicionais que podem ajudar a interpretar e comparar os timbres, se forem úteis no seu trabalho.',
    ajuda: 'Números que resumem o espectro. Calculados a partir das parciais da tabela acima.',
    centroide: ['Centroide espectral', 'O “centro de gravidade” das parciais. Quanto mais alto, mais <b>brilhante</b> o som. Mostrado em Hz e em múltiplos da fundamental (1,0 = toda a energia na fundamental).'],
    imparPar: ['Ímpares ÷ pares', 'Compara a energia das parciais ímpares (3ª, 5ª, 7ª…) com a das pares (2ª, 4ª, 6ª…), sem contar a fundamental. Valores bem positivos indicam o som “oco” típico do clarinete, em que as pares são fracas.'],
    inarm: ['Inarmonicidade média', 'Quanto, em média, as parciais se afastam dos múltiplos exatos da fundamental, em cents. Perto de 0 = som harmônico (sopros, cordas friccionadas); valores maiores = parciais “esticadas” (piano) ou vibrato.'],
    acima40: ['Parciais acima de −40 dB', 'Quantas parciais têm força significativa (até 40 dB abaixo do pico mais forte). Uma medida simples da “riqueza” do som.'],
  },

  comparar: {
    titulo: 'Comparar instrumentos',
    ajuda: 'Escolha de 2 a 4 instrumentos para ver os perfis de parciais lado a lado (amplitudes em dB, com a fundamental de cada um em 0 dB). Cada instrumento usa o seu próprio trecho e a sua própria fundamental, inclusive as correções que você fez na aba “Um instrumento”.',
    nenhum: '— nenhum —',
  },

  geral: {
    titulo: 'Tabela geral',
    ajuda: 'Todos os instrumentos de uma vez. A coluna <b>Cor</b> traz a cor do timbre de cada instrumento (passo 5 da aba “Um instrumento”). Nas colunas das parciais, a cor da célula indica a força da parcial (veja a legenda logo acima da tabela). Passe o mouse sobre uma célula para ver os detalhes, ou clique no nome do instrumento para abri-lo na aba “Um instrumento”.',
    mostrar: 'O que mostrar nas células',
    mostrarOpcoes: { amp: 'amplitude (dB, fundamental = 0)', freq: 'frequência (Hz)', razao: 'razão (frequência ÷ fundamental)' },
    analisando: 'Analisando',
    exportar: 'Baixar os dados',
    exportarAjuda: 'O arquivo “completo” traz uma linha por parcial com todas as medidas; o “resumido” é a tabela como está na tela; o de “cores” traz, para cada instrumento, a frequência, o comprimento de onda e o peso de cada parcial, o RGB e o código hexadecimal da cor. Use o formato <b>Excel (Brasil)</b> se for abrir no Excel em português (vírgula como separador decimal).',
    csvCompleto: 'Completo — Excel (Brasil)',
    csvResumido: 'Resumido — Excel (Brasil)',
    csvIntl: 'Completo — CSV internacional',
    json: 'Completo — JSON',
    csvCores: 'Cores — Excel (Brasil)',
  },

  ajuda: {
    botao: 'Conceitos e método',
    titulo: 'Conceitos e método',
    html: `
<h3>Parciais, em poucas palavras</h3>
<p>Uma nota tocada por um instrumento não é uma frequência única: é uma soma de vibrações simultâneas, as <b>parciais</b>. A mais grave costuma ser a <b>fundamental</b> (f0), que dá o nome da nota. As outras ficam acima dela. Quando estão em múltiplos inteiros da fundamental (2×, 3×, 4×…), chamam-se <b>harmônicos</b> — é a série harmônica. A <b>força relativa</b> de cada parcial é uma das principais responsáveis pelo timbre: é por isso que um Lá de oboé soa diferente de um Lá de flauta.</p>

<h3>Glossário</h3>
<ul>
<li><b>Hz (hertz)</b>: vibrações por segundo. O Lá do diapasão (A4) tem 440 Hz; cada oitava acima dobra a frequência.</li>
<li><b>Notação das notas</b>: usamos a notação internacional (C = Dó, D = Ré, E = Mi, F = Fá, G = Sol, A = Lá, B = Si), com o número da oitava. A4 = Lá 440 Hz; C4 = Dó central.</li>
<li><b>Cents</b>: centésimos de semitom. +10 cents = um pouco mais agudo que a nota temperada.</li>
<li><b>dB (decibel)</b>: escala logarítmica de intensidade. −6 dB ≈ metade da amplitude; −20 dB = um décimo; −40 dB = um centésimo.</li>
<li><b>Espectro</b>: o gráfico de “quanto de cada frequência” existe no som.</li>
<li><b>Ruído de fundo</b>: o nível mínimo do espectro, onde não há parciais. Picos que não se destacam dele não são considerados.</li>
</ul>

<h3>Por que a parcial mais forte nem sempre é a fundamental?</h3>
<p>O corpo do instrumento reforça algumas regiões de frequência (os <i>formantes</i>). No corne inglês, por exemplo, a 3ª parcial é bem mais forte que a fundamental. O ouvido continua percebendo a nota da fundamental, mas um programa ingênuo, que pega o pico mais alto, erraria a nota. Por isso o app procura o padrão de picos que melhor se encaixa numa série harmônica.</p>

<h3>Descrição técnica do método</h3>
<p class="pequeno"><i>Esta parte usa vocabulário de processamento de sinais. Não é preciso entendê-la para usar o app: ela registra exatamente como os números foram calculados.</i></p>
<p>Os áudios (WAV, 44,1 kHz) são normalizados pelo pico. O trecho de análise começa 0,1 s após o fim do ataque (primeiro instante em que o envelope RMS, em janelas de 10 ms, chega a menos de 6 dB do máximo) e dura 1 s, terminando antes se o nível cair mais de 20 dB. O espectro é estimado pelo método de Welch: quadros de 16 384 amostras (≈ 0,37 s) com janela de Blackman-Harris de 4 termos, salto de 4 096 amostras (75% de sobreposição) e FFT de 65 536 pontos (com preenchimento por zeros). Os espectros de potência de cada canal são calculados separadamente e somados, o que evita cancelamentos de fase entre os canais estéreo. Frequência e amplitude de cada pico são refinadas por interpolação parabólica sobre o espectro em dB. A fundamental é estimada pelo algoritmo <i>Two-Way Mismatch</i> (Maher &amp; Beauchamp, 1994), usando até 10 picos situados a menos de 30 dB do mais forte, e refinada pela média ponderada de f<sub>k</sub>/k das seis primeiras parciais. A k-ésima parcial é o maior máximo local numa janela de ±0,4·f0 em torno da posição prevista a partir da última parcial encontrada, exigindo-se que ela esteja pelo menos 6 dB acima do ruído de fundo (mediana do espectro entre 30 Hz e 16 kHz). As amplitudes são expressas em dB em relação à fundamental (0 dB); os arquivos exportados trazem também a amplitude linear e a porcentagem da energia de cada parcial.</p>
<p class="pequeno">Maher, R. C.; Beauchamp, J. W. Fundamental frequency estimation of musical signals using a two-way mismatch procedure. <i>Journal of the Acoustical Society of America</i>, v. 95, n. 4, p. 2254–2263, 1994.</p>

<h3>A cor do timbre</h3>
<p>Peso de cada parcial k: na escala linear, a<sub>k</sub> = amplitude linear da parcial (fundamental = 1); em dB NPS, a<sub>k</sub> = máx(0; 60 + L<sub>k</sub>), em que L<sub>k</sub> é o nível em dB em relação à fundamental (supondo a fundamental a 60 dB NPS; 0 dB NPS = 20 µPa). Parcial não encontrada: a<sub>k</sub> = 0. Usam-se as n parciais da tabela.</p>
<p><b>Centro de gravidade</b> (padrão). Com r<sub>k</sub> = f<sub>k</sub> ÷ f0, o centro é C = Σ a<sub>k</sub>·r<sub>k</sub> ÷ Σ a<sub>k</sub> (o “índice espectral” de <i>timbre_cor.py</i>, que usa k no lugar de r<sub>k</sub>). A posição de C na faixa de 1 a n é t = log<sub>2</sub>C ÷ log<sub>2</sub>n (em oitavas) ou t = (C − 1) ÷ (n − 1) (linear).</p>
<p><b>Mistura das luzes</b> (opção). A posição de cada parcial na faixa audível é t<sub>k</sub> = log<sub>2</sub>(f<sub>k</sub> ÷ 20) ÷ log<sub>2</sub>(1000) (em oitavas) ou t<sub>k</sub> = (f<sub>k</sub> − 20) ÷ (20 000 − 20) (linear); fora de 20 Hz–20 kHz, fica no extremo. A cor do timbre é a mistura aditiva Σ a<sub>k</sub>·RGB<sub>k</sub> (em RGB linear, antes da correção de gama), levada de novo ao brilho máximo.</p>
<p><b>Da posição à cor</b> (nos dois métodos). A frequência da luz é ν = ν<sub>ini</sub> + t·(ν<sub>fim</sub> − ν<sub>ini</sub>), em que ν<sub>ini</sub> e ν<sub>fim</sub> são as frequências (c ÷ λ) das cores escolhidas para as pontas; o comprimento de onda é λ = c ÷ ν. A cor de cada λ na tela segue a aproximação de Dan Bruton (1996), a forma clássica de desenhar o espectro visível num monitor: degradês por trechos (violeta → azul → ciano → verde → amarelo → vermelho), com gama 0,8 e escurecendo abaixo de 420 nm e acima de 700 nm. Ela não é colorimetria exata: as cores espectrais puras ficam fora do que um monitor mostra, e a conversão exata (CIE 1931 → sRGB) transforma faixas largas numa cor só (510–550 nm no mesmo verde, 620–750 nm no mesmo vermelho), o que deixava instrumentos diferentes com cores idênticas.</p>

<h3>Suas escolhas ficam guardadas</h3>
<p>Trechos, fundamentais corrigidas, o número de parciais, as escalas e o mapeamento das cores ficam salvos neste navegador. O botão “Restaurar padrões”, no fim da página, desfaz tudo.</p>
`,
  },

  rodape: {
    restaurar: 'Restaurar padrões',
    restaurarConfirma: 'Desfazer todas as suas escolhas (trechos, fundamentais corrigidas, número de parciais, escalas e mapeamento das cores)?',
  },
};
