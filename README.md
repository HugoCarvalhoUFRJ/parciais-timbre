# Parciais do Timbre

Aplicativo web desenvolvido para auxiliar uma pesquisa de mestrado em música sobre o
mapeamento de timbres instrumentais em cores. O app **extrai e organiza as parciais** de cada
timbre e as transforma numa cor do espectro visível.

Os áudios são de 23 instrumentos tocando a nota Lá, cada um na região de melhor projeção e
controle do instrumento, além de um tutti com todos juntos.

## O que o app faz

- Mostra o espectro de cada instrumento e identifica a fundamental e as parciais.
- Lista, para cada parcial, a frequência, a razão em relação à fundamental, a nota mais
  próxima e a amplitude (em dB, com a fundamental em 0 dB).
- Calcula a cor do timbre: o centro de gravidade das parciais (razão f ÷ f0 pesada pela
  amplitude) é levado, por uma função linear, a uma cor do espectro visível; as cores das
  pontas da faixa são ajustáveis. Há também a opção de misturar as luzes das parciais,
  mapeando a faixa audível (20 Hz a 20 kHz).
- Compara instrumentos lado a lado e reúne todos em uma tabela geral.
- Exporta os dados em CSV (formato do Excel em português ou internacional) e em JSON.

A análise é feita inteiramente no navegador; nada é enviado a um servidor.

## Uso

Acesse o endereço publicado pelo GitHub Pages. Para rodar localmente, sirva a pasta com
`python -m http.server` e abra `http://localhost:8000`. Abrir o `index.html` diretamente não
funciona, porque o navegador bloqueia a leitura dos áudios.

Para incluir novos áudios, coloque o arquivo WAV em `audios/` e acrescente uma linha em
`audios/manifest.json` com o nome do arquivo, o nome do instrumento e a família.

## Método

O espectro é estimado pelo método de Welch: janela de Blackman-Harris, quadros de 16 384
amostras e FFT de 65 536 pontos. Os canais estéreo são somados por potência. A fundamental
é estimada pelo algoritmo Two-Way Mismatch (Maher & Beauchamp, 1994). A descrição completa
está no próprio app, em “Conceitos e método”.
