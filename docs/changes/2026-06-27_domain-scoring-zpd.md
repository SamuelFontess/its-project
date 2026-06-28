# Lógica de domínio: DAG, scoring e ZPD

**Data:** 2026-06-27
**Autor:** Claude Code
**Escopo:** backend / lógica pedagógica

---

## Contexto

Com os tipos TypeScript definidos, o próximo passo era implementar a lógica determinística do sistema (nunca delegada ao LLM): o grafo de conceitos, as regras de score do inner loop e o algoritmo de seleção ZPD do outer loop.

## Objetivo

Implementar os três pilares da lógica pedagógica do ITS em código puro TypeScript, sem dependências externas, testável isoladamente.

## Mudanças Realizadas

- `src/lib/domain.ts` — DAG dos 12 conceitos com utilitários de grafo
- `src/lib/scoring.ts` — regras completas do inner loop + badges + XP
- `src/lib/zpd.ts` — algoritmo outer loop + retrocesso + estado de conclusão

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/lib/domain.ts` | criado |
| `src/lib/scoring.ts` | criado |
| `src/lib/zpd.ts` | criado |

## Raciocínio Técnico

### `domain.ts`
Define `CONCEPTS` como `Record<ConceptId, Concept>` — acesso O(1) por ID.
`getDependents()` e `getImmediatePrerequisite()` são utilitários de grafo usados pelo ZPD e pelo retrocesso.
Para pré-requisitos múltiplos (C8, C11), `getImmediatePrerequisite()` retorna o de menor nível — critério pedagógico: revisar o conceito mais básico primeiro.

### `scoring.ts`

Regras implementadas conforme CLAUDE.md:
- Acerto sem hint: +20 | hint 1: +12 | hint 2: +6 | hint 3: +2
- Erro: −10 (mínimo 0)
- Domínio: score ≥ 80 e ≥ 3 consecutivos
- Retrocesso: score < 30 após ≥ 3 tentativas

`applyAnswer()` é pura (não muta o estado original) — facilita testes e uso em contextos imutáveis (React state).

`initialConceptStateFromDiagnostic()` converte o resultado do diagnóstico em estado inicial: acerto = score 40, em_progresso; erro = score 0, nao_visto. O score 40 reflete que o aluno demonstrou conhecimento básico no diagnóstico sem tutoria.

Badge `no_hints` detecta indiretamente se o aluno não usou hints: se ao dominar o conceito o score é 100, só é possível com 5 acertos consecutivos sem hint (+20 cada = 100). Aproximação válida sem precisar rastrear uso de hints no Firestore.

### `zpd.ts`

`selectNextConcept()` implementa o outer loop seguindo as regras do CLAUDE.md:
1. Filtra elegíveis (não dominados + pré-requisitos todos dominados)
2. `reduce()` para encontrar o de maior score
3. Desempate por menor nível — garante C1 como ponto de entrada quando todos têm score 0

`isUnlocked()` é separado de `isEligible()` para suportar a autonomia do aluno: o aluno pode clicar em conceitos já dominados para revisão (desbloqueados mas não elegíveis pelo ZPD).

`getBacktrackTarget()` delega para `getImmediatePrerequisite()` do domain — única fonte da verdade para a estrutura do grafo.

## Decisões Tomadas

- **Imutabilidade em `applyAnswer()`**: retorna novo objeto em vez de mutar — padrão React/Firestore.
- **Score diagnóstico = 40**: metade do caminho para domínio. Indica conhecimento inicial sem ser considerado dominado (evita pular C1 sem tutoria real).
- **XP zero para erros**: penalidade de score já existe (−10); penalizar XP também seria dupla punição — prejudicaria motivação do aluno.

## Alternativas Avaliadas

| Alternativa | Por que descartada |
|-------------|-------------------|
| Score diagnóstico = 60 | Muito alto — aluno poderia dominar C1 com 2 acertos adicionais, pulando o inner loop quase inteiro |
| Badge `no_hints` via flag explícita | Exigiria persistir `usedHintInConcept` no Firestore — desnecessário; inferência por score = 100 é suficiente |
| ZPD com `sort()` | `reduce()` é O(n) vs O(n log n) — suficiente para n=12 e mais legível |

## Riscos

- Badge `no_hints` tem falso negativo: se o aluno errar (−10) mas depois recuperar chegando a 100 sem hints, a badge é concedida mesmo tendo errado antes. Comportamento aceitável — a badge mede o estado final, não o percurso.

## Validação

```bash
npx tsc --noEmit  # sem erros
```

Lógica verificada manualmente para os cenários:
- Aluno zerado → ZPD seleciona C1 (score 0, nível 1 — menor nível)
- C1 dominado → C2 elegível
- C5 dominado mas C6 não → C7 elegível (ambos requerem C5, score 0 → C6 vence por nível menor)
- C6+C7 dominados → C8 elegível
- Todos dominados → `selectNextConcept()` retorna null → `isCompleted()` true

## Próximos Passos

1. `src/lib/questions.ts` — banco mockado de perguntas (estrutura real, conteúdo placeholder)
2. `src/app/api/tutor/route.ts` — API Route DeepSeek (4 modos)
3. Firebase setup
4. Páginas `/` e `/tutor`
