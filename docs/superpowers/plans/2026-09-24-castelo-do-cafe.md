# Castelo do Café Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir o jogo para seis fases e concluir a história do Conde D'arábica.

**Architecture:** Manter a sequência e a física em `platformer.ts`, o canvas e menu em `coffee-run.tsx` e o progresso existente por índice. Acrescentar o Conde como inimigo na fase final.

**Tech Stack:** TypeScript, React, Canvas 2D, CSS Modules, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-24-castelo-do-cafe-design.md`

## Global Constraints

- Preservar a ordem das três fases atuais e os dados de progresso salvos.
- Grãos continuam opcionais.
- O Conde precisa ser vencido antes da saída final.

---

### Task 1: Mapas e progresso

**Files:** `components/ui/platformer.ts`, `tests/platformer.test.mjs`

- [x] Escrever teste que exige seis fases retangulares, com início, saída e grãos, e valida progresso de seis fases.
- [x] Rodar `node --experimental-strip-types --test tests/platformer.test.mjs` e confirmar a falha esperada.
- [x] Adicionar as três fases após a torre; conservar os três índices anteriores.
- [x] Rodar o mesmo teste e confirmar que passa.

### Task 2: Conde e saída final

**Files:** `components/ui/platformer.ts`, `components/ui/coffee-run.tsx`, `tests/platformer.test.mjs`

- [x] Escrever teste que tenta sair antes e depois de derrotar o Conde.
- [x] Confirmar a falha esperada.
- [x] Adicionar o inimigo ao mapa, à física e ao desenho; bloquear a saída enquanto ele estiver vivo.
- [x] Rodar os testes e confirmar que passam.

### Task 3: História e cenários

**Files:** `components/ui/platformer.ts`, `components/ui/coffee-run.tsx`, `components/ui/coffee-run.module.css`

- [x] Mostrar um resumo de cada fase no menu e texto curto na conclusão.
- [x] Adicionar paletas e fundos próprios para as três novas fases.
- [x] Rodar testes, lint e build.
