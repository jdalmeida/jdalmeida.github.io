# Castelo do Café: A última xícara

O Conde D'arábica parou o relógio do castelo e apagou a Brasa da Aurora. O caçador entra pela caneca sobre a mesa, atravessa o castelo, recupera uma semente viva e reacende a brasa. Ao vencer o Conde, prepara a última xícara e devolve o amanhecer.

## Campanha

1. Portão do castelo: entrada e servos esqueletos. Fase atual.
2. Adega: pistas da brasa levada para o alto. Fase atual.
3. Torre do relógio: o relógio parado revela uma passagem. Fase atual.
4. Estufa suspensa: obter a última semente viva. Fase nova.
5. Fornalha de torra: reacender a Brasa da Aurora. Fase nova.
6. Salão da última xícara: vencer o Conde e preparar o café. Fase nova.

Cada fase mostra um resumo da história no menu e uma mensagem curta na transição. Grãos seguem opcionais. O salão exige derrotar o Conde antes que a porta de saída funcione. O progresso já salvo conserva os três primeiros índices e desbloqueia a quarta fase para quem concluiu a torre.

## Implementação

Adicionar mapas e lógica do Conde em `components/ui/platformer.ts`. Adicionar paletas, desenho do Conde e textos de história em `components/ui/coffee-run.tsx`; ajustar o menu em `components/ui/coffee-run.module.css`. Testar estrutura e progressão em `tests/platformer.test.mjs`. Não mudar o formato persistido em `lib/castle.ts`.
