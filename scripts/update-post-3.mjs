import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL not set");
}

const sql = neon(databaseUrl);

const CONTENT = `No começo de 2026, uma frase começou a circular no Vale do Silício:

> "O modelo é o componente menos importante do seu sistema de IA."

Parece contraintuitivo, né? A gente passou anos comparando benchmarks, fazendo side-by-side do Claude vs Gemini vs GPT. O modelo sempre foi a estrela. Mas aí você tenta colocar IA de verdade pra rodar dentro de uma empresa e descobre a verdade inconveniente: **o modelo é a parte fácil. O problema é tudo que vem antes dele.**

## O problema: dados em silos, agentes no escuro

Imagina que você tem um agente de IA brilhante — raciocínio de ponta, capacidade de análise, tudo. E você pergunta:

> "Por que a gente tá pagando mais caro pra transportadora errada?"

O agente não sabe responder. Não porque é burro. Porque ele não sabe:

- Que a transportadora X tem cláusula de reajuste trimestral no contrato
- Que a rota Y tem restrição de horário por causa do cliente final
- Que o financeiro bloqueou pagamento da nota fiscal Z por divergência
- Que aquele campo "observação" no sistema é onde o motorista relata problema de acesso

Tudo isso tá **em algum lugar**. Num PDF. Num e-mail. Numa mensagem de WhatsApp. Num campo obscuro que só quem opera todo dia conhece.

O modelo é brilhante. Mas ele tá cego.

## A solução não é melhor modelo — é melhor contexto

Eu passei os últimos meses construindo uma resposta pra esse problema. Não é um prompt melhor. Não é um modelo mais forte. É uma **arquitetura de contexto** com 3 pilares:

### 1. ETL com camada de dados

O primeiro passo foi criar um **ETL** que conecta todas as fontes de dados da empresa e organiza tudo em uma **camada de dados estruturada**.

Não é RAG básico jogando tudo num vector DB. É um pipeline que:

- **Extrai** dados de ERPs, CRMs, planilhas, PDFs, e-mails, bancos de dados
- **Transforma** em formato que o agente consegue raciocionar — não só buscar, mas **entender**
- **Carrega** numa camada unificada onde cada entidade (transportadora, rota, contrato, SLA) tem seu próprio contexto enriquecido

A diferença entre isso e um RAG tradicional? RAG busca documentos. **Camada de dados entrega conhecimento estruturado.** O agente não precisa "achar" a informação — ela já tá organizada, limpa e pronta pra uso.

### 2. Skills: ensinando o agente a dominar o domínio

Dados estruturados não bastam. O agente precisa saber **como usar** esses dados. É aqui que entram as **Skills**.

Skills são, na prática, instruções estruturadas que ensinam o agente a operar no domínio da empresa. Não é um prompt genérico — é um documento que explica:

- **O que cada entidade significa** (o que é uma tabela de frete, como funciona um SLA, o que é reajuste contratual)
- **Como cruzar dados** (se o usuário perguntar sobre performance, olha X, Y e Z)
- **Quais são as regras de negócio** (transportadora com SLA abaixo de 85% entra em alerta, reajuste é trimestral, etc.)
- **Como formatar a resposta** (o operacional quer números, o financeiro quer impacto em R$)

É como dar um onboarding pro agente. Em vez de ele chegar cru e tentar adivinhar, ele já entra sabendo como a empresa funciona.

### 3. Três camadas de contexto: RLM + Memória + Skill

Aqui é onde a coisa fica realmente interessante. O agente não usa um contexto só — ele usa **três camadas** que se complementam:

**RLM (Retrieval of Local Memory)** — O contexto da empresa. Tudo que o agente precisa saber sobre o domínio, os dados, as regras. É buscado no momento certo, pro problema certo. Não é tudo de uma vez — é cirúrgico.

**Memória do usuário** — O agente constrói, ao longo das conversas, um perfil de quem tá interagindo. O João sempre pergunta sobre fretes da região sul. A Maria quer resumo executivo, não dados brutos. O Carlos quer saber o impacto financeiro primeiro. O agente **aprende** com o usuário e personaliza a resposta.

**Skill estruturada** — O "como fazer". Dado o contexto da empresa (RLM) e o contexto do usuário (memória), a Skill define como o agente deve agir, que dados consultar, como formatar a resposta.

As três juntas significam que o agente não responde igual pra todo mundo. Ele responde **pra você**, com **os seus dados**, do **jeito que você precisa**.

## O que mudou na prática

Com essa arquitetura rodando, as perguntas que antes levariam horas agora levam segundos:

> "Quais transportadoras estão performando abaixo do SLA?"

→ O agente consulta a camada de dados, cruza com as regras da Skill, e entrega o resultado formatado pro perfil do usuário.

> "Por que a gente usa a transportadora X se a Z é mais barata?"

→ Ele não só compara preços — ele entende o contexto contratual, o histórico de performance, e explica o trade-off.

> "Como as tabelas de frete se comportaram nos últimos 6 meses?"

→ Identifica padrões, reajustes não aplicados, rotas com cobrança errada. Tudo via linguagem natural.

## O que eu aprendi

**1. ETL é a fundação.** Sem dados organizados e acessíveis, o agente é um gênio sem memória. Invista na camada de dados antes de qualquer coisa.

**2. Skills são o diferencial.** Qualquer um pode conectar um agente a um banco. Poucos ensinam o agente a **pensar como a empresa pensa**. Skills fazem isso.

**3. Contexto não é uma coisa só.** É a interseção de domínio (RLM), usuário (memória) e ação (Skill). Falta uma peça e o agente erra com confiança.

**4. O modelo é commodity.** Sério. A diferença entre modelos existe, mas é menor do que a diferença entre um agente com contexto bom e um sem. Invista onde o retorno é maior.

**5. Contexto é o novo código.** O código que importa em 2026 não é lógica de negócio — é o código que conecta, estrutura e entrega contexto pro agente. Tudo o mais é boilerplate.

---

*E você, como tá lidando com contexto nos seus projetos de IA? Já construiu Skills ou uma camada de dados pra agentes? Me conta — adoro trocar ideia sobre isso.*`;

async function main() {
	console.log("Atualizando artigo no banco...");
	await sql`
    UPDATE posts SET
      title = 'Contexto é o novo código',
      excerpt = 'Como criei um ETL com camada de dados, dei Skills ao agente e construí um sistema de contexto com RLM e memória. O código que importa em 2026 não é lógica — é contexto.',
      content = ${CONTENT},
      tags = ${JSON.stringify(["IA", "agentes", "contexto", "ETL", "skills", "RLM", "arquitetura"])},
      published = false,
      updated_at = ${new Date().toISOString()}
    WHERE slug = 'contexto-e-o-novo-codigo'
  `;
	console.log("✅ Artigo atualizado no banco (published=false)");
}

main().catch(console.error);
