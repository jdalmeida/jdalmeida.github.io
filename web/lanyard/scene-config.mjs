// The strap hangs 3 units below the anchor and the card center sits 1.5 below
// that, so a credential fills the world box between these two heights.
export const ANCHOR_HEIGHT = 4;
export const CARD_BOTTOM = -1.75;
export const CARD_WIDTH = 1.62;

// O molho pendura tudo de um gancho só, como o rack de crachás numa parede: as
// âncoras ficam agrupadas em torno de x = 0 e o leque nasce do comprimento de
// cordão de cada credencial, não de um espaçamento entre elas.
//
// O crachá tem meia-espessura de 0.01 no colisor, então duas credenciais em
// camadas de z diferentes nunca se tocam: elas se sobrepõem na tela em vez de
// se empurrarem para os lados. É o que dá o empilhamento da foto.
const HERO_DEPTH_STEP = 0.32;

// Quanto cada cordão desloca a âncora no gancho. Um molho real não sai de um
// ponto matemático: as fitas se acomodam alguns centímetros uma ao lado da
// outra. A lista se repete, então um evento novo entra sem tabela nova.
const HERO_HANGER_X = [-0.7, 0.85, -1.25, 0.3, 1.3, 0.05, -0.45];

// Comprimento de cada uma das três juntas de corda, por credencial. A junta
// esférica ainda acrescenta ROPE_TO_CARD até o centro do crachá, então o
// crachá descansa em ANCHOR_HEIGHT - 3 * cordão - ROPE_TO_CARD.
const HERO_HANGER_ROPE = [1.12, 1, 1.34, 1.18, 1.46, 1.06, 1.28];

// Quantas juntas de corda o cordão tem, e o quanto a junta esférica desce do
// último corpo até o centro do crachá. Ambos vêm dos joints em Lanyard.jsx.
export const ROPE_JOINTS = 3;
export const ROPE_TO_CARD = 1.5;

// Folga lateral para o balanço: arrastada, a credencial sai bem além de onde
// descansa, e o enquadramento não pode cortar esse movimento.
const HERO_SWING = 0.7;

// Folga acima do gancho e abaixo do crachá mais baixo.
const HERO_PADDING = 0.35;

// O gancho: o ponto único de onde o molho inteiro pendura. A física continua
// prendendo cada cordão na sua âncora espalhada — é isso que faz o crachá
// descansar aberto em leque e parar quieto lá. O que converge no gancho é a
// fita desenhada, que sai dele na diagonal até o primeiro corpo da corda, do
// jeito que uma fita de verdade cai quando está dobrada sobre um prego.
// O gancho fica fora do centro, como o da parede: um molho pendurado não abre
// um leque simétrico, ele cai para o lado em que tem mais peso.
const HOOK_LIFT = 0.55;
const HOOK_X = -0.35;
export const heroHook = () => [HOOK_X, ANCHOR_HEIGHT + HOOK_LIFT, 0];

// Nenhuma fita encosta no gancho no mesmo lugar: elas se acomodam empilhadas
// alguns centímetros umas sobre as outras. Sem esse deslocamento as pontas se
// juntam num bico perfeito, que é o que denuncia o desenho.
const HOOK_JITTER_X = [0.07, -0.11, 0.14, -0.05, -0.16, 0.1, -0.02];
const HOOK_JITTER_Y = [0, -0.09, -0.04, -0.14, -0.06, -0.11, -0.02];

// A fita converge em profundidade só em parte: ela sai da camada do crachá em
// direção ao gancho sem chegar nele, senão os cordões se cruzariam todos no
// mesmo plano e a sobreposição some.
const HOOK_DEPTH_PULL = 0.3;

// Onde cada fita encosta no gancho. É ponto de desenho, não de física.
export const heroHooks = (count) => {
  const [x, y] = heroHook();
  return heroAnchors(count).map(([, , z], index) => [
    Number((x + HOOK_JITTER_X[index % HOOK_JITTER_X.length]).toFixed(4)),
    Number((y + HOOK_JITTER_Y[index % HOOK_JITTER_Y.length]).toFixed(4)),
    Number((z * HOOK_DEPTH_PULL).toFixed(4)),
  ]);
};

// O quanto a fita barriga entre o gancho e o primeiro corpo da corda. Sem um
// ponto de controle ali a curva vira uma diagonal seca; com ele a fita cai com
// o próprio peso, que é o que o olho reconhece como tecido.
export const DRAPE_AT = 0.55;
export const DRAPE_SAG = 0.22;

// O quanto cada crachá fica girado em torno do próprio eixo vertical, em graus.
// Num molho de verdade as credenciais não olham todas para a frente: cada uma
// se acomodou virada para um lado, e é isso que faz o conjunto ler como molho
// em vez de uma pilha de cartões paralelos.
//
// A gravidade não tem o que dizer sobre esse giro — ela endireita o que pende,
// não o que gira. Quem segura o ângulo é a mola de `setAngvel` em Lanyard.jsx,
// que até aqui puxava todo mundo para zero.
const HERO_YAW = [-15, 10, -22, 17, -9, 13, -18];
export const heroYaws = (count) =>
  Array.from(
    Array(count),
    (_, index) => (HERO_YAW[index % HERO_YAW.length] * Math.PI) / 180,
  );

// A mola compara o componente y do quaternion, não o ângulo. Para um giro de
// `yaw` em torno de Y esse componente vale sen(yaw / 2): é esse o alvo.
export const yawTarget = (yaw) => Number(Math.sin(yaw / 2).toFixed(6));

// Largura da fita de cada credencial. Cordão de evento não tem medida padrão, e
// repetir a mesma largura cinco vezes é o que faz o molho parecer desenhado.
const HERO_STRAP_WIDTH = [0.95, 0.82, 1, 0.88, 0.92, 0.86, 0.98];
export const heroStrapWidths = (count) =>
  Array.from(
    Array(count),
    (_, index) => HERO_STRAP_WIDTH[index % HERO_STRAP_WIDTH.length],
  );

// Os cordões sem credencial. São volume visual ao fundo do molho — não clicam e
// não representam evento nenhum. Ficam atrás da camada de z mais funda que as
// credenciais alcançam, com quatro juntas em vez de três para cair mais solto.
export const LOOSE_STRAP_JOINTS = 4;
export const LOOSE_STRAPS = [
  { x: -0.62, rope: 1.52, depth: 1 },
  { x: 0.55, rope: 1.74, depth: 2 },
  { x: -0.08, rope: 1.36, depth: 3 },
];

// Half the height of the card, measured on its collider.
export const CARD_HALF_HEIGHT = 1.125;

// Slack between the credential and the edge of the dialog box.
const DIALOG_SLACK = 0.3;

// bodyPositions spawns the card beside its anchor. The last offset it uses is
// how far to the right the drop starts.
const DIALOG_SPAWN = 2;

// How far below the anchor the dialog hangs the card at the start. Falling from
// anchor height would need a box three cards tall — the whole modal — and the
// credential would read tiny; from here it swings in at full size.
export const DIALOG_SPAWN_DROP = 2;

// Room on the other side of the anchor: the card crosses it on the way back up
// from the first swing, and it also decides how far from the edge of the modal
// the credential comes to rest.
const DIALOG_BACKSWING = 0.6;

// The box the drop lives in, edge by edge.
const DIALOG_LEFT = -(CARD_WIDTH / 2 + DIALOG_BACKSWING);
const DIALOG_RIGHT = DIALOG_SPAWN + CARD_WIDTH / 2 + DIALOG_SLACK;
const DIALOG_TOP =
  ANCHOR_HEIGHT - DIALOG_SPAWN_DROP + CARD_HALF_HEIGHT + DIALOG_SLACK;
const DIALOG_BOTTOM = CARD_BOTTOM - DIALOG_SLACK;

// World box the camera must keep visible for a single credential. The dialog
// canvas covers the whole modal, so the box holds the entire drop — the card
// where it spawns, the card where it rests, and the swing between them — and
// none of the animation is cropped.
export const DIALOG_FRAME = {
  width: Number((DIALOG_RIGHT - DIALOG_LEFT).toFixed(4)),
  height: Number((DIALOG_TOP - DIALOG_BOTTOM).toFixed(4)),
  center: Number(((DIALOG_TOP + DIALOG_BOTTOM) / 2).toFixed(4)),
  offset: Number(((DIALOG_RIGHT + DIALOG_LEFT) / 2).toFixed(4)),
  // The credential hangs from the top left of the modal, so the room the canvas
  // has to spare falls where the swing needs it: to the right of the strap and
  // below the card.
  align: { x: -1, y: 1 },
};

const heroHanger = (index) => ({
  x: HERO_HANGER_X[index % HERO_HANGER_X.length],
  rope: HERO_HANGER_ROPE[index % HERO_HANGER_ROPE.length],
});

// O comprimento de cordão de cada credencial, na ordem em que ela aparece.
export const heroRopes = (count) =>
  Array.from(Array(count), (_, index) => heroHanger(index).rope);

// Onde o crachá descansa, medido do centro. Serve tanto para enquadrar quanto
// para saber qual credencial fica mais baixa no molho.
export const heroCardCenter = (rope) =>
  Number((ANCHOR_HEIGHT - ROPE_JOINTS * rope - ROPE_TO_CARD).toFixed(4));

// Todas as âncoras na mesma altura: é um gancho só. O que varia é o cordão.
// A profundidade segue a ordem dos eventos, do mais recente para o mais antigo:
// o primeiro da lista fica na frente do molho, que é onde se lê inteiro.
export const heroAnchors = (count) => {
  const middle = (count - 1) / 2;
  return Array.from(Array(count), (_, index) => [
    heroHanger(index).x,
    ANCHOR_HEIGHT,
    Number(((middle - index) * HERO_DEPTH_STEP).toFixed(4)),
  ]);
};

// Os cordões soltos ficam atrás da credencial mais funda, em camadas próprias.
export const looseStrapAnchors = (count) => {
  const back = -((count - 1) / 2) * HERO_DEPTH_STEP;
  return LOOSE_STRAPS.map(({ x, depth }) => [
    x,
    ANCHOR_HEIGHT,
    Number((back - depth * HERO_DEPTH_STEP).toFixed(4)),
  ]);
};

// A caixa do molho é estreita e alta, e cresce para baixo com o cordão mais
// comprido em uso — uma credencial a mais não corta as que já estão lá.
export const heroFrame = (count) => {
  const ropes = heroRopes(count);
  const lowest = Math.min(...ropes.map(heroCardCenter)) - CARD_HALF_HEIGHT;
  const edges = heroAnchors(count).flatMap(([x]) => [
    x - CARD_WIDTH / 2,
    x + CARD_WIDTH / 2,
  ]);
  const left = Math.min(HOOK_X, ...edges) - HERO_SWING;
  const right = Math.max(HOOK_X, ...edges) + HERO_SWING;
  const floor = lowest - HERO_PADDING;
  const ceiling = ANCHOR_HEIGHT + HOOK_LIFT + HERO_PADDING;
  return {
    width: Number((right - left).toFixed(4)),
    height: Number((ceiling - floor).toFixed(4)),
    center: Number(((ceiling + floor) / 2).toFixed(4)),
    offset: Number(((right + left) / 2).toFixed(4)),
  };
};

// Contain fit: the camera backs off far enough for the shorter axis of the
// canvas, so no credential leaves the frame on a narrow desktop window.
export const fitDistance = (frame, fov, aspect) => {
  const half = Math.tan((fov * Math.PI) / 360);
  return Math.max(frame.height / (2 * half), frame.width / (2 * half * aspect));
};

// A contain fit always leaves slack on the longer axis of the canvas. `align`
// says where the box sits inside it: 0 splits the slack evenly, -1 pins the box
// to the left or bottom edge, 1 to the right or top. The camera never rotates,
// so aiming it is a plain translation.
export const framePosition = (frame, fov, aspect, distance) => {
  const halfHeight = distance * Math.tan((fov * Math.PI) / 360);
  const align = frame.align || { x: 0, y: 0 };
  return [
    (frame.offset || 0) - align.x * (halfHeight * aspect - frame.width / 2),
    frame.center - align.y * (halfHeight - frame.height / 2),
  ];
};

export const isShortClick = (delta) => delta <= 5;
export const lerpFactor = (delta, speed) => Math.min(1, delta * speed);
export const pointerDelta = (start, end) =>
  Math.hypot(end.x - start.x, end.y - start.y);

// Os corpos da corda nascem na linha entre a âncora e o crachá. `drop` pendura
// essa linha — e com ela o crachá que a cena balança até o lugar — abaixo da
// âncora em vez de ao lado. `reach` é o comprimento de cada junta: um cordão
// mais comprido espalha os corpos na mesma medida, senão ele nasce esticado e
// a cena abre com um tranco.
export const bodyPositions = ([x, y, z], drop = 0, reach = 1) =>
  [0, 0.5, 1, 1.5, 2].map((offset) => [
    Number((x + offset * reach).toFixed(4)),
    Number((y - (drop * offset) / 2).toFixed(4)),
    z,
  ]);

// Um cordão solto não tem crachá: a corda é mais longa e termina num peso
// pequeno. Os corpos nascem na mesma linha lateral que os da credencial.
export const looseBodyPositions = ([x, y, z], reach = 1) =>
  Array.from(Array(LOOSE_STRAP_JOINTS + 1), (_, index) => [
    Number((x + index * 0.5 * reach).toFixed(4)),
    y,
    z,
  ]);

// A brisa do molho. Parado de todo, o molho lê como render; um crachá de
// verdade pendurado num gancho nunca para — o ar do ambiente o balança de leve.
// É uma aceleração lateral, não um impulso fixo: o crachá e o peso do cordão
// solto têm massas diferentes e devem responder ao mesmo vento. Contra a
// gravidade da cena (40), 1.4 inclina o cordão pouco menos de 2 graus.
export const BREEZE_STRENGTH = 1.4;

// Quanto a brisa torce o crachá em torno do eixo vertical, em radianos, somado
// ao giro de descanso. É o que faz a luz correr pelo cartão.
export const BREEZE_YAW = 0.07;

// Quanto a fase muda de um cordão para o seguinte. O vento é o mesmo para o
// molho inteiro, mas chega a cada cordão um pouco depois — sem esse atraso
// todos balançam em bloco, como se fossem uma peça só.
export const BREEZE_PHASE_STEP = 0.55;

// A brisa num instante: rajadas lentas que modulam um balanço mais curto. As
// frequências não são múltiplas umas das outras, então o padrão não se repete
// a ponto de o olho notar o ciclo.
export const breeze = (time, phase = 0) => {
  const t = time + phase;
  const gust = 0.55 + 0.45 * Math.sin(t * 0.31);
  const sway = 0.7 * Math.sin(t * 0.83) + 0.3 * Math.sin(t * 2.17 + 1.7);
  return {
    x: BREEZE_STRENGTH * gust * sway,
    z: BREEZE_STRENGTH * 0.35 * gust * Math.sin(t * 0.57 + 0.8),
    yaw: BREEZE_YAW * gust * Math.sin(t * 0.71 + 0.4),
  };
};
