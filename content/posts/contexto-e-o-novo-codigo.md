---
title: "Contexto é o novo código"
date: "2026-06-11"
excerpt: "Por que o bottleneck da inteligência artificial não é o modelo — é o contexto. E o que isso significa para quem constrói software hoje."
tags: ["IA", "MCP", "agentes", "contexto", "arquitetura"]
author: "João de Almeida"
---

No começo de 2026, um pessoal do Vale do Silício começou a repetir uma frase que soou estranha no início:

> "O modelo é o componente menos importante do seu sistema de IA."

Parece contraintuitivo, né? A gente passou anos brincando de trocar modelo no ChatGPT, comparando benchmarks, fazendo side-by-side do Claude vs Gemini vs GPT. O modelo sempre foi a estrela. Mas aí você tenta colocar IA de verdade pra rodar dentro de uma empresa e descobre a verdade inconveniente: **o modelo é a parte fácil. O problema é tudo que vem antes dele.**

## O problema que ninguém tá resolvendo

Imagina o seguinte cenário: você é o CTO de uma distribuidora (hipotética, claro 👀) e quer que um agente de IA ajude a auditar fretes, acompanhar entregas e ajustar tabelas. Você pluga o Claude no seu sistema e... nada funciona direito.

Não porque o Claude é burro. Mas porque ele não sabe:

- Que a transportadora X tem um contrato com cláusula de reajuste trimestral
- Que a rota Y tem uma restrição de horário por causa do cliente final
- Que o financeiro já bloqueou pagamento da nota fiscal Z por divergência
- Que aquele campo "observação" no sistema na verdade é onde o motorista relata problema de acesso

Tudo isso tá **em algum lugar**. Num PDF de contrato. Num e-mail do comercial. Numa mensagem no WhatsApp do operacional. Num campo obscuro do TMS que só quem usa todo dia sabe que existe.

O modelo é brilhante. Mas ele tá cego.

## Contexto: o ingrediente que separa demo de produto

É aqui que entra uma palavra que eu não paro de ouvir: **contexto**.

Contexto é tudo que o agente precisa saber pra fazer a coisa certa. Não é prompt. Não é system message. É a **estrutura de conhecimento operacional** da sua empresa — organizada, curada e entregue no momento certo pro agente consumir.

E quando eu digo "entregue no momento certo", não é mandar tudo de uma vez. É como um bom SRE que sabe exatamente qual runbook abrir quando o alarme toca. O agente precisa do contexto **certo**, na **quantidade certa**, no **formato certo**.

Isso é tão importante que tem empresas inteiras sendo construídas em cima dessa tese. A [Strattum](https://strattum.ai), por exemplo, se posiciona como uma "Private Context Platform" — a premissa deles é exatamente essa: **o gargalo da IA corporativa não é capacidade de raciocínio, é qualidade de contexto.**

## A arquitetura invisível

O que a Strattum faz (e o que eu acho um dos modelos de negócio mais subestimados de 2026) é basicamente uma plataforma de 3 camadas:

**1. Data Engineering** — Mais de 50 conectores que puxam dados de onde eles vivem: ERPs, CRMs, planilhas, e-mails, contratos, wikis. O objetivo é conectar tudo sem precisar migrar nada.

**2. AI Engineering** — Aqui é onde a mágica acontece. Os dados brutos viram grafos de conhecimento, documentos processados, ferramentas executáveis. Não é RAG básico — é contexto estruturado que o agente consegue **raciocionar em cima**.

**3. Ops Engineering** — Observabilidade e avaliação de qualidade do contexto. Porque contexto ruim é pior que contexto nenhum. Se o agente recebe informação errada, ele não erra "mais ou menos" — ele errado com **total confiança**.

E o mais interessante: tudo roda no cloud do próprio cliente (BYOC), com governança LGPD-first e compatível com MCP. Sem lock-in de modelo. Sem lock-in de provedor.

## MCP: o protocolo que faz tudo conversar

Falando em MCP — Model Context Protocol — esse é o outro pedaço do quebra-cabeça que eu acho que todo dev deveria entender em 2026.

Antes do MCP, conectar um agente a uma ferramenta era basicamente: escrever uma integração customizada, torcer pra API não mudar, e rezar pra escalar. Cada agente, cada ferramenta, cada conexão era um trabalho do zero.

Com o MCP, você tem um **protocolo padrão** pra dizer pro agente: "aqui estão as ferramentas que você pode usar, aqui está o que cada uma faz, e aqui estão os dados que você pode acessar." É como um USB-C pra integrações de IA.

Eu vi isso na prática quando integrei dois sistemas internos via MCP — um TMS (sistema de gestão de transporte) com um agente de IA que tem acesso a dados curados da empresa. De repente, o agente podia analisar dados de transporte, ajustar tabelas de frete, auditar entregas — tudo via linguagem natural. Sem tela. Sem formulário. Sem treinamento do usuário.

Isso é o que eu chamo de **conversacional interface** — e é o futuro. Mas o ponto que quero chegar é: **o MCP só é tão bom quanto o contexto que você entrega pra ele.** Protocolo sem contexto é como ter uma rodovia sem destino.

## O que isso significa pra quem constrói software

Se você é dev, CTO, ou lidera um time de tecnologia, aqui vai o que eu acho que muda a partir de agora:

**1. Dados são o novo código.** Não no sentido de "dados são o novo óleo" — aquele clichê. No sentido de que a **estrutura, qualidade e acessibilidade dos seus dados** vai definir o teto do que IA pode fazer na sua empresa. Se seus dados vivem em silos, PDFs e cabeças de pessoas, seu agente vai ser tão bom quanto um estagiário no primeiro dia.

**2. Contexto precisa de engenharia.** Não dá pra só jogar tudo num vector DB e chamar de RAG. Contexto de produção precisa de curadoria, versionamento, governança e — acima de tudo — **entender o domínio do negócio**. Quem constrói o contexto precisa entender tanto de IA quanto de logística, saúde, finanças, ou o que for.

**3. O modelo é commodity.** Sério. A diferença entre Claude Opus 4.8, GPT-5.5 e Gemini 2.5 Pro existe, mas é menor do que a diferença entre um agente com contexto bom e um agente sem contexto. Invista seu tempo onde o retorno é maior.

**4. Arquitetura de contexto é arquitetura de produto.** Se você tá desenhando um sistema com IA em 2026 e não tá pensando em como o contexto flui — de onde vem, como é processado, como é entregue, como é atualizado — você tá projetando pela metade.

## O que eu tenho feito sobre isso

Nos últimos meses, eu tenho mergulhado nisso de um jeito bem prático. Liderando a plataforma de inteligência logística que eu construo, eu precisei resolver exatamente esse problema: como entregar o contexto operacional certo pro agente de IA no momento certo.

A resposta envolveu MCP, curadoria de dados, e uma arquitetura que separa claramente o que é **dado bruto**, o que é **contexto processado** e o que é **ferramenta executável**. Não é trivial. Mas quando funciona, é como ver um junior que finalmente teve acesso à documentação — a diferença é absurda.

E é por isso que eu acredito que **contexto é o novo código**. Não no sentido de que código não importa mais — claro que importa. Mas no sentido de que o **diferencial competitivo** de sistemas de IA não está mais no modelo que você escolhe. Está em **quão bem você alimenta esse modelo com a realidade da sua empresa.**

O código que importa em 2026 é o código que conecta, estrutura e entrega contexto.

Tudo o mais é boilerplate.

---

*E você, como tá lidando com contexto nos seus projetos de IA? Já esbarrou nesse problema? Me conta — adoro trocar ideia sobre isso.*
