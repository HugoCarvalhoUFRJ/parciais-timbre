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
    ajuda: 'Um som tem um começo (o <b>ataque</b>, quando o arco, o sopro ou o martelo põe o instrumento a vibrar), um meio (a <b>sustentação</b>) e um fim (o <b>decaimento</b>). O ataque é rico em ruídos passageiros; o timbre “estável” que queremos medir está no meio. Por isso o app escolhe automaticamente <b>1 segundo logo depois do ataque</b> (faixa destacada).',
    arrastar: 'Você pode mudar o trecho com o mouse (ou o dedo): <b>arraste as bordas</b> para mudar o início e o fim, ou <b>arraste o meio</b> para deslocar a faixa inteira. Experimente, por exemplo, comparar o início e o fim de uma nota de piano — o timbre muda enquanto o som decai.',
    minimo: 'O trecho tem no mínimo 0,4 s, para que a medição seja confiável.',
    automatico: 'Voltar ao trecho automático',
    personalizado: 'trecho escolhido por você',
    auto: 'trecho automático',
  },

  fundamental: {
    titulo: 'Fundamental (a nota que você ouve)',
    ajuda: 'A <b>fundamental</b> (f0) é a frequência da nota tocada — aqui, um Lá. Todas as parciais são numeradas a partir dela: a 2ª fica uma oitava acima, a 3ª uma quinta acima disso, a 4ª duas oitavas acima, e assim por diante.',
    porqueErra: 'O app encontra a fundamental sozinho, mas às vezes pode errar a <b>oitava</b>: em alguns instrumentos (corne inglês, trombone baixo, oboé) a fundamental é mais fraca que outras parciais. Confira de ouvido. Se estiver errada, use os botões abaixo ou <b>clique num pico do espectro</b> (passo 3) para dizer “esta é a fundamental”.',
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
    ajuda: 'O espectro mostra <b>quais frequências</b> existem no som (eixo horizontal, em Hz) e <b>com que força</b> (eixo vertical, em dB). Cada pico é uma parcial: quanto mais alto, mais forte. O pico mais alto do gráfico está em 0 dB; os outros têm valores negativos (mais fracos).',
    marcas: 'Os pontos azuis numerados são as parciais da tabela. A linha azul tracejada marca a fundamental; o losango laranja marca o pico mais forte do som (que nem sempre é a fundamental).',
    clique: 'Dica: clique em um pico para defini-lo como fundamental. Para ampliar, arraste uma área no gráfico; clique duas vezes para voltar.',
    eixo: {
      titulo: 'Eixo de frequência',
      linear: {
        rotulo: 'Linear',
        texto: 'As parciais aparecem <b>igualmente espaçadas</b>: cada uma fica f0 Hz depois da anterior (num Lá de 220 Hz: 220, 440, 660, 880 Hz…). É a melhor forma de enxergar a série harmônica.',
      },
      log: {
        rotulo: 'Logarítmico',
        texto: 'Cada <b>oitava</b> ocupa o mesmo espaço, como no teclado do piano. As parciais vão ficando mais próximas umas das outras à medida que sobem — é assim que o ouvido percebe as alturas.',
      },
    },
  },

  nParciais: {
    titulo: 'Número de parciais',
    texto: 'Quantas parciais entram no gráfico e na tabela, contando a fundamental como a 1ª. Vale para todos os instrumentos e para as outras abas.',
    obs: '<b>Obs.:</b> com um número alto, as últimas parciais podem não aparecer. Há dois motivos. (1) As parciais mais agudas costumam ser muito fracas e se misturam ao <b>ruído de fundo</b> da gravação; aí não dá para medi-las com segurança, e elas aparecem na tabela como “não encontrada”. (2) Uma gravação só registra frequências até um certo limite (cerca de 22 000 Hz nestes arquivos). Em instrumentos agudos, as parciais altas passam desse limite e simplesmente não existem no áudio: na celesta (Lá de 1760 Hz), por exemplo, só cabem umas 10 parciais.',
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
    outrasAbas: '<b>Quer ver vários instrumentos de uma vez?</b> As outras abas generalizam este perfil: em <a href="#" data-ir-aba="comparar">Comparar</a>, os perfis de 2 a 4 instrumentos aparecem lado a lado em um gráfico de barras; em <a href="#" data-ir-aba="tabela">Tabela geral</a>, todos os instrumentos aparecem juntos em uma tabela, que pode ser baixada para o Excel.',
    baixar: 'Baixar as parciais deste instrumento (CSV)',
  },

  descritores: {
    titulo: 'Descritores do timbre',
    extra: '<b>Observação:</b> esta seção é um <b>complemento</b>, que vai além do que você precisa. As parciais (passo 4) já são o resultado da análise; os descritores abaixo são apenas números adicionais que podem ajudar a interpretar e comparar os timbres, se forem úteis no seu trabalho.',
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
    ajuda: 'Todos os instrumentos de uma vez. A cor de cada célula indica a força da parcial (veja a legenda logo acima da tabela). Passe o mouse sobre uma célula para ver os detalhes, ou clique no nome do instrumento para abri-lo na aba “Um instrumento”.',
    mostrar: 'O que mostrar nas células',
    mostrarOpcoes: { amp: 'amplitude (dB, fundamental = 0)', freq: 'frequência (Hz)', razao: 'razão (frequência ÷ fundamental)' },
    analisando: 'Analisando',
    exportar: 'Baixar os dados',
    exportarAjuda: 'O arquivo “completo” traz uma linha por parcial com todas as medidas; o “resumido” é a tabela como está na tela. Use o formato <b>Excel (Brasil)</b> se for abrir no Excel em português (vírgula como separador decimal).',
    csvCompleto: 'Completo — Excel (Brasil)',
    csvResumido: 'Resumido — Excel (Brasil)',
    csvIntl: 'Completo — CSV internacional',
    json: 'Completo — JSON',
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

<h3>Suas escolhas ficam guardadas</h3>
<p>Trechos, fundamentais corrigidas e o número de parciais ficam salvos neste navegador. O botão “Restaurar padrões”, no fim da página, desfaz tudo.</p>
`,
  },

  rodape: {
    restaurar: 'Restaurar padrões',
    restaurarConfirma: 'Desfazer todas as suas escolhas (trechos, fundamentais corrigidas e número de parciais)?',
  },
};
