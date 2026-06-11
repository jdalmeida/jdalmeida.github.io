---
title: "Transformando um app interno num Jarvis com MCP"
date: "2026-06-11"
excerpt: "Como conectei meu TMS a um agente de IA via MCP e descobri que estávamos escolhendo transportadoras erradas por puro conforto — não por inteligência."
tags: ["MCP", "IA", "agentes", "logística", "arquitetura"]
author: "João de Almeida"
---

Tem uma cena clássica do Tony Stark no Homem de Ferro onde ele tá de boa na mansão e fala pro Jarvis:

> "Jarvis, me mostra os dados do reator."

E o Jarvis responde. Sem tela. Sem formulário. Sem abrir 4 abas no navegador. Só... conversa.

Pois é. Eu queria isso. Mas ao invés de um reator arc, eu queria entender por que tava pagando mais caro pra transportadora errada.

## O problema: inteligência escondida em silos

Eu lidero o **ezlog**, nosso TMS — sistema de gestão de transporte. É aqui que vivem os dados de frete, rotas, entregas, SLAs, contratos com transportadoras. Dados pesados, operacionais, que quem tá no dia a dia da operação conhece de cor.

Mas "conhecer de cor" é exatamente o problema.

Quando eu sentava pra analisar performance de transportadora, o processo era mais ou menos assim:

1. Abrir o ezlog
2. Filtrar por período, rota, transportadora
3. Exportar pra planilha
4. Cruzar com os contratos
5. Comparar SLA vs. entrega real
6. Achar o padrão

Isso levava **horas**. E no fim, a análise era tão boa quanto a minha paciência naquele dia. Semana corrida? A análise virava "vamos manter como tá".

O pior: a gente achava que estava tomando decisões inteligentes. Mas na verdade estava tomando decisões **confortáveis**.

## A faísca: South Summit e a interface conversacional

Eu já vinha brincando com agentes de IA no desenvolvimento (se você leu meu artigo sobre o Cursor, sabe que eu sou fã). Mas a virada de chave aconteceu no **South Summit Brazil**, numa palestra sobre o futuro das interfaces.

A ideia era simples e provocativa: **e se a interface do futuro não for tela? E se for conversa?**

Não no sentido de "chatbot que responde FAQ". No sentido de: você tem um agente que conhece seus dados, entende seu domínio, e você interage com ele como interagiria com um colega de trabalho.

Saí de lá com uma pergunta na cabeça: *"Eu tenho o ezlog com dados de transporte e tenho o Prisma, nosso agente de IA. Por que eu não consigo perguntar pro Prisma por que a transportadora X tá performando mal na rota Y?"*

A resposta era: porque os dois não conversam.

A solução foi: **MCP**.

## MCP: o protocolo que faz dois apps virarem um

Se você não conhece, **MCP (Model Context Protocol)** é um padrão aberto pra conectar agentes de IA a ferramentas e dados. Pense nele como um USB-C pra integrações de IA: um protocolo universal que diz pro agente "aqui estão as ferramentas que você pode usar, o que cada uma faz, e como acessar."

Antes do MCP, conectar o Prisma ao ezlog seria: escrever uma API customizada, mapear cada endpoint, tratar autenticação, manter tudo sincronizado. Trabalho de semanas. E quando precisasse conectar o **ezbuy** (nosso sistema de supply chain) ou o **elo** (intranet), seria tudo do zero de novo.

Com o MCP, a história é diferente. Eu crio um **MCP server** que expõe as ferramentas do ezlog pro Prisma:

- `get_freight_tables` — puxa tabelas de frete por transportadora, rota, período
- `get_sla_performance` — compara SLA contratado vs. entrega real
- `audit_carrier` — auditoria completa de uma transportadora
- `compare_routes` — compara performance entre rotas

E o Prisma, do outro lado, usa essas ferramentas como usaria qualquer outra. Sem saber que tá falando com um TMS. Sem saber que os dados vêm de um banco PostgreSQL na Vercel. Ele só sabe que tem ferramentas disponíveis e sabe quando usá-las.

## A arquitetura: edge, RBAC e zero confiança

Aqui é onde fica interessante — e onde a maioria dos tutoriais de MCP não chega.

O **Prisma roda 100% na Vercel, em edge**. Isso significa que ele é rápido, distribuído, e escala sem eu pensar nisso. Mas também significa que ele não tem acesso direto ao banco do ezlog. E **não deveria ter**.

A gente usa a **camada de RBAC (Role-Based Access Control)** que já existia nos apps internos. O MCP server não é um bypass pra segurança — ele é um consumidor como qualquer outro. Quando o Prisma pede dados via MCP, a requisição passa pela mesma validação de permissão que passaria se um humano tivesse clicando no ezlog.

Isso é importante porque:

1. **Segurança não é opcional** — dados de frete, contratos e SLAs são sensíveis
2. **RBAC já existia** — não precisei reinventar a roda, só conectei
3. **Audit trail** — toda requisição via MCP fica logada, como qualquer outra ação no sistema

A arquitetura ficou assim:

\`\`\`
Prisma (agente, edge) → MCP Server → ezlog API (com RBAC) → Dados
\`\`\`

Simples. Seguro. E absurdamente poderoso.

## O que descobrimos (e nos surpreendeu)

Com o Prisma conectado ao ezlog via MCP, comecei a fazer perguntas que antes levariam horas pra responder:

**"Prisma, quais transportadoras estão performando abaixo do SLA na região sul?"**

→ Em segundos, ele cruzou dados de entrega, contratos e SLAs. Descobrimos que 3 transportadoras estavam consistentemente atrasando, mas a gente nunca tinha percebido porque os dados estavam espalhados em relatórios diferentes.

**"Por que a gente usa a transportadora X na rota Y se a Z é 15% mais barata e tem SLA melhor?"**

→ Silêncio. Ninguém tinha uma boa resposta. Era **conforto**. O operacional já conhecia o contato da X, já sabia como funcionava, e nunca parou pra questionar. O dado tava lá, mas ninguém tava olhando.

**"Como as tabelas de frete se comportaram nos últimos 6 meses?"**

→ Ele não só trouxe os dados — identificou padrões. Ajustes de reajuste que não foram aplicados, rotas onde o frete subiu sem justificativa contratual, e uma transportadora que cobrava a tarifa antiga em 2 das 12 rotas.

Isso último sozinho pagou o investimento.

## O que vem próximo: ezbuy e elo

O ezlog foi o primeiro, mas o plano é conectar tudo:

- **ezbuy** (supply chain) — o Prisma vai poder cruzar dados de compra, estoque e logística. Perguntas tipo "por que estamos comprando mais do que precisamos do fornecedor X?" ou "qual o impacto no frete se mudarmos o centro de distribuição?"
- **elo** (intranet) — o agente vai ter acesso a documentos, políticas internas, e informações dispersas que hoje vivem em PDFs e wikis

A beleza do MCP é que cada novo conector é incremental. Não preciso reescrever o que já funciona. Só adicionar novas ferramentas ao servidor e o Prisma aprende a usá-las.

## O que eu aprendi até aqui

**1. O gargalo nunca foi o modelo.** O Claude e o GPT são ótimos. O que faltava era **conexão com a realidade da empresa**. MCP resolve isso.

**2. Dados sem acesso são dados inúteis.** A gente tinha informação pra tomar decisões melhores, mas ela estava presa em telas que ninguém abria. Conversacional muda isso.

**3. Segurança primeiro.** Usar a camada de RBAC existente foi a decisão certa. Não dá pra conectar agente a dados corporativos sem pensar em quem pode ver o quê.

**4. Comece pequeno, pense grande.** Comecei com o ezlog. Depois vem o ezbuy. Depois o elo. Cada conector é um passo, não uma reescrita.

**5. O Jarvis não substitui o Tony Stark.** Ele faz o Tony Stark tomar decisões melhores. O agente não decide qual transportadora contratar — mas mostra os dados que você precisava ver pra decidir com confiança.

---

Se você tá pensando em conectar agentes de IA a sistemas internos, MCP é o caminho. Não é mágica — é engenharia. Mas é a engenharia certa pra 2026.

E você, já tá usando MCP em produção? Me conta como foi.*
