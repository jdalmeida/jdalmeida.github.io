---
title: "Contexto é o novo código"
date: "2026-06-11"
excerpt: "Como criei um ETL com camada de dados, dei Skills ao agente e construí um sistema de contexto com RLM e memória. O código que importa em 2026 não é lógica — é contexto."
tags: ["IA", "agentes", "contexto", "ETL", "skills", "RLM", "arquitetura"]
author: "João de Almeida"
---

No começo de 2026, uma frase começou a circular no Vale do Silício:

> "O modelo é o componente menos importante do seu sistema de IA."

Parece contraintuitivo, né? A gente passou anos comparando benchmarks, fazendo side-by-side do Claude vs Gemini vs GPT. O modelo sempre foi a estrela. Mas aí você tenta colocar IA de verdade pra rodar dentro de uma empresa e descobre a verdade inconveniente: **o modelo é a parte fácil. O problema é tudo que vem antes dele.**

## O problema: dados em silos, agentes no escuro

Imagina que você tem um agente de IA brilhante — raciocínio de ponta, capacidade de análise, tudo. E você pergunta:

> "Por que o faturamento de março caiu 15% em relação a fevereiro?"

O agente não sabe responder. Não porque é burro. Porque ele não sabe:

- Que o cliente X, responsável por 20% da receita, renovou com desconto de 35% porque o comercial fez uma exceção verbal
- Que 60 notas fiscais ficaram retidas no financeiro por divergência de cadastro
- Que o vendedor Y bateu a meta de vendas mas 80% veio de um único contrato com margem negativa
- Que aquele campo "observação" no CRM é onde o suporte relata insatisfação de clientes que ninguém mais lê

Tudo isso tá **em algum lugar**. Num PDF de contrato. Num e-mail do comercial. Numa mensagem no Slack. Num campo obscuro que só quem opera todo dia conhece.

O modelo é brilhante. Mas ele tá cego.

## A solução não é melhor modelo — é melhor contexto

Eu passei os últimos meses construindo uma resposta pra esse problema. Não é um prompt melhor. Não é um modelo mais forte. É uma **arquitetura de contexto** com 3 pilares:

### 1. ETL com camada de dados

O primeiro passo foi criar um **ETL** que conecta todas as fontes de dados da empresa e organiza tudo em uma **camada de dados estruturada**.

Não é RAG básico jogando tudo num vector DB. É um pipeline que:

- **Extrai** dados de ERPs, CRMs, planilhas, PDFs, e-mails, bancos de dados
- **Transforma** em formato que o agente consegue raciocionar — não só buscar, mas **entender**
- **Carrega** numa camada unificada onde cada entidade (cliente, contrato, nota fiscal, oportunidade) tem seu próprio contexto enriquecido

A diferença entre isso e um RAG tradicional? RAG busca documentos. **Camada de dados entrega conhecimento estruturado.** O agente não precisa "achar" a informação — ela já tá organizada, limpa e pronta pra uso.

### 2. Skills: ensinando o agente a dominar o domínio

Dados estruturados não bastam. O agente precisa saber **como usar** esses dados. É aqui que entram as **Skills**.

Skills são, na prática, instruções estruturadas que ensinam o agente a operar no domínio da empresa. Não é um prompt genérico — é um documento que explica:

- **O que cada entidade significa** (o que é um pipeline de vendas, como funciona o ciclo de faturamento, o que é margem por contrato)
- **Como cruzar dados** (se o usuário perguntar sobre faturamento, olha notas fiscais, contratos ativos e projeção de vendas)
- **Quais são as regras de negócio** (desconto acima de 20% precisa de aprovação, cliente com pagamento atrasado entra em bloqueio, meta é mensal por vendedor)
- **Como formatar a resposta** (o comercial quer pipeline, o financeiro quer impacto em R$, o diretor quer resumo executivo)

É como dar um onboarding pro agente. Em vez de ele chegar cru e tentar adivinhar, ele já entra sabendo como a empresa funciona.

### 3. Três camadas de contexto: RLM + Memória + Skill

Aqui é onde a coisa fica realmente interessante. O agente não usa um contexto só — ele usa **três camadas** que se complementam:

**RLM (Retrieval of Local Memory)** — O contexto da empresa. Tudo que o agente precisa saber sobre o domínio, os dados, as regras. É buscado no momento certo, pro problema certo. Não é tudo de uma vez — é cirúrgico.

**Memória do usuário** — O agente constrói, ao longo das conversas, um perfil de quem tá interagindo. O João sempre pergunta sobre faturamento do trimestre. A Maria quer resumo executivo, não dados brutos. O Carlos quer saber o impacto em vendas primeiro. O agente **aprende** com o usuário e personaliza a resposta.

**Skill estruturada** — O "como fazer". Dado o contexto da empresa (RLM) e o contexto do usuário (memória), a Skill define como o agente deve agir, que dados consultar, como formatar a resposta.

As três juntas significam que o agente não responde igual pra todo mundo. Ele responde **pra você**, com **os seus dados**, do **jeito que você precisa**.

## O que mudou na prática

Com essa arquitetura rodando, as perguntas que antes levariam horas agora levam segundos:

> "Por que o faturamento caiu em março?"

→ O agente consulta a camada de dados, cruza contratos, notas fiscais e projeções, e entrega: "O cliente X renovou com 35% de desconto e 60 NFs ficaram retidas. Juntos, isso representa R$ 48K do delta."

> "Qual vendedor teve melhor margem no trimestre?"

→ Ele não só soma vendas — cruza com custo, descontos concedidos e tipo de contrato. Descobre que quem bateu a meta na verdade teve a pior margem.

> "Como o pipeline de vendas pro fechamento do mês?"

→ Puxa oportunidades abertas, probabilidade histórica por estágio, e compara com o mesmo período do ano anterior. Tudo via linguagem natural.

## O que eu aprendi

**1. ETL é a fundação.** Sem dados organizados e acessíveis, o agente é um gênio sem memória. Invista na camada de dados antes de qualquer coisa.

**2. Skills são o diferencial.** Qualquer um pode conectar um agente a um banco. Poucos ensinam o agente a **pensar como a empresa pensa**. Skills fazem isso.

**3. Contexto não é uma coisa só.** É a interseção de domínio (RLM), usuário (memória) e ação (Skill). Falta uma peça e o agente erra com confiança.

**4. O modelo é commodity.** Sério. A diferença entre modelos existe, mas é menor do que a diferença entre um agente com contexto bom e um sem. Invista onde o retorno é maior.

**5. Contexto é o novo código.** O código que importa em 2026 não é lógica de negócio — é o código que conecta, estrutura e entrega contexto pro agente. Tudo o mais é boilerplate.

---

*E você, como tá lidando com contexto nos seus projetos de IA? Já construiu Skills ou uma camada de dados pra agentes? Me conta — adoro trocar ideia sobre isso.*
