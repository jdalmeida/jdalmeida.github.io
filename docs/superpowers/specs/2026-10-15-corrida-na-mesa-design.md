# Corrida na Mesa

Uma folha se solta da suculenta. Echeveria brota de folha caída, então a Joaninha agarra a folha e sai correndo pela escrivaninha para plantá-la longe dali, antes que o Gato a pegue com a pata. É Subway Surfers em cima da mesa que o visitante acabou de ver em 3D.

## Entrada

Um botão invisível sobre o vaso da suculenta abre o jogo, como a lixeira abre o Basquete de papel e a xícara abre o Castelo do Café. Ele só aparece quando a mesa pousa (`[data-landed="false"]` esconde). O jogo abre num `<dialog>` em tela cheia, com o mesmo visual de sala escura e o botão "← Voltar à mesa".

## Câmera e pista

Pixel art num canvas retrato de 120×160, ampliado com `image-rendering: pixelated`. A câmera fica atrás da Joaninha e olha para frente. As tábuas da madeira fogem para o horizonte em perspectiva, e três faixas convergem num ponto de fuga. Cada objeto tem uma distância `z` e é desenhado com escala `1 / z`, de trás para frente. É uma pseudo-3D simples, sem WebGL.

## Controles

| Ação | Toque | Teclado |
|---|---|---|
| Mudar de faixa | deslizar ← → | ← → / A D |
| Pular | deslizar ↑ | ↑ / W / Espaço |
| Abaixar e deslizar | deslizar ↓ | ↓ / S |

No ar, deslizar ↓ cai na hora, como no original.

## Obstáculos (os objetos da mesa)

- **Lápis deitado** atravessando uma faixa: pular.
- **Cordão de credencial** esticado no alto: deslizar por baixo.
- **Clipe** em pé: pular ou desviar.
- **Caderno**: bloco alto, como o trem. De frente, bate. Uma régua encostada serve de rampa e permite correr por cima dele.
- **Post-it** colado de pé: parede, só desviando de faixa.
- **Mancha de café**: não bloqueia, mas escorrega. Por meio segundo a troca de faixa sai atrasada.
- **Xícara**: parede larga que ocupa duas faixas.

Uma batida de frente acaba a corrida. Uma batida de lado (trocar de faixa contra um obstáculo) só tropeça: o Gato aparece atrás e, se a Joaninha tropeçar de novo em 8 s, a pata a pega. Igual à regra do inspetor.

## Coleta e poderes

- **Gotas d'água** são as moedas, enfileiradas pelas faixas e em arcos sobre os obstáculos.
- **Raio de sol (ímã):** por 8 s atrai as gotas das três faixas (fototropismo).
- **Clipe-mola (super pulo):** por 8 s os pulos ficam altos o bastante para passar por cima de tudo.

## Ritmo e pontos

A velocidade começa em 1× e cresce até 2,2× em uns 3 minutos. A pontuação é a distância em centímetros mais 10 por gota. Os trechos são montados de blocos pré-desenhados, sorteados por um `rng` com seed, sempre com pelo menos uma faixa livre por linha. Isso fica num teste.

## Placar e selo

Top 10 com nome, como no Basquete de papel, numa tabela nova `runs` (seed do dispositivo, melhor pontuação, nome), em `lib/runs.ts` e `lib/stamps.sql`. A tabela `scores` continua só do basquete; o formulário de nome já vem preenchido com o nome do basquete, se houver.

O recorde melhora a raridade do selo do caderno, como o basquete: `RUN_TIERS` (2000 e 5000 pontos) dão raro e lendário. Vale o maior entre a sorte do selo, o basquete e a corrida.

## Implementação

- `components/ui/runner.ts`: lógica pura (estado, `step`, geração de trechos, colisão), sem canvas, testável como `platformer.ts`.
- `components/ui/desk-run.tsx`: dialog, desenho no canvas, entrada por toque e teclado, HUD e placar.
- `components/ui/desk-run.module.css`: botão sobre o vaso. A sala reusa `paper-toss.module.css`.
- `components/ui/desk-scene.tsx`: monta `<DeskRun />` ao lado dos outros jogos.
- `lib/track.ts` e `lib/analytics.ts`: jogo `desk-run` ("Corrida na Mesa") e `score` com `{ cm, drops, score }`. O /admin mostra o recorde da corrida no visitante e no selo.
- `lib/stamp-meta.ts` e `lib/stamps.ts`: `RUN_TIERS` e o recorde da corrida (`run`) no selo.
- `tests/desk-run.test.mjs`: trechos sempre passáveis, colisão de frente encerra, tropeço duplo encerra, pulo passa o lápis, deslizar passa o cordão.

A corrida pausa quando a aba fica oculta; `Esc` fecha o jogo, como os outros. Com `prefers-reduced-motion`, a velocidade fica fixa em 1×.
