# Comeback badge + autonomia guiada + atualização CLAUDE.md

**Data:** 2026-06-27
**Autor:** Claude Code
**Escopo:** frontend / documentação

---

## Contexto

Badge `comeback` estava declarado em `domain.ts` mas sem lógica de disparo em `evaluateBadges`.
Além disso, CLAUDE.md tinha referências desatualizadas (DeepSeek → Groq) e faltavam seções de
status de implementação, regras anti-spoiler de prompt e spec de autonomia guiada.

## Objetivo

- Implementar a lógica de disparo do badge `comeback`
- Atualizar CLAUDE.md como documento de referência técnica atualizado do projeto
- Atualizar memória persistente do agente

## Mudanças Realizadas

### `src/lib/scoring.ts`
- `evaluateBadges` recebe novo parâmetro opcional `cameBackFromBacktrack = false`
- Se `true` e `justMasteredId !== null` e badge ainda não conquistado: adiciona `"comeback"` à lista

### `src/app/tutor/page.tsx`
- `SessionRef` recebe campo `backtrackedConceptIds: Set<ConceptId>` — inicializado como `new Set()`
- `triggerBacktrack`: ao executar um retrocesso, adiciona `fromId` ao set
- `handleSend`: ao detectar mastery, calcula `cameBack = backtrackedConceptIds.has(conceptId)` e passa para `evaluateBadges`

### `CLAUDE.md`
- Stack: corrigido "DeepSeek" → "Groq" em todo o arquivo
- Adicionada seção "Status de Implementação" com tabela de componentes concluídos e pendentes
- Seção "Autonomia Guiada" adicionada com spec da feature a implementar
- Seção "Modo Tutor" ampliada com regras absolutas anti-spoiler
- Seção "Falha de API" e "Limite de histórico" atualizadas para Groq

### `memory/MEMORY.md`
- Stack corrigido para Groq
- Adicionado padrão React Flow (custom nodeTypes obrigatório)
- Documentado comeback badge e como ele é disparado
- Seção "Pendente" atualizada

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/lib/scoring.ts` | modificado |
| `src/app/tutor/page.tsx` | modificado |
| `CLAUDE.md` | modificado |
| `memory/MEMORY.md` | modificado |

## Raciocínio Técnico

O badge `comeback` requer cruzar dois eventos que acontecem em momentos distintos:
(1) o retrocesso — quando o código detecta `shouldBacktrack` e chama `triggerBacktrack`
(2) o domínio posterior — quando `isMastered` retorna true em `handleSend`

A solução é um `Set<ConceptId>` no `SessionRef` que persiste durante toda a sessão.
`triggerBacktrack` registra qual conceito causou o retrocesso (`fromId`, não `toId`),
e `handleSend` consulta o set no momento do domínio.

Essa abordagem é correta semanticamente: o badge premia superar o conceito que falhou, não o que foi revisitado.
Estado de sessão, não persistido no Firestore — o badge em si é persistido quando `newBadges.length > 0`.

## Decisões Tomadas

- Parâmetro `cameBackFromBacktrack` como opcional com default `false` → retrocompatível com chamadas existentes
- Registrar `fromId` (conceito que travou), não `toId` (pré-requisito) → o badge é por superar o bloqueio original
- Set como estrutura: suporta múltiplos retroceeds em cascata e é O(1) para lookup

## Alternativas Avaliadas

| Alternativa | Por que descartada |
|-------------|-------------------|
| Persistir backtracks no Firestore | Desnecessário — badge já é persistido quando conquistado; histórico de retroceeds é irrelevante entre sessões |
| Passar flag via prop ao `evaluateBadges` sem mudar assinatura | Impossível sem alterar assinatura — a informação vem de contexto de sessão, não do estado do conceito |
| Badge ao fazer o retrocesso (não ao dominar) | Não faz sentido semântico — o "comeback" é sobre superar a dificuldade, não sobre retroceeder |

## Riscos

- Se o aluno dominar o mesmo conceito em que retrocedeu em sessões diferentes, o badge só é concedido na sessão em que o set foi preenchido — comportamento correto, pois o set é de sessão.
- Se o build falhar por alguma razão inesperada, verificar que `src/types/domain.ts` já declara `"comeback"` em `BadgeId`.

## Validação

Mudanças são puramente aditivas. Para testar manualmente:
1. Responder errado repetidamente em C2 até o sistema retroceder para C1
2. Dominar C1 (score ≥ 80, 3 acertos consecutivos)
3. Voltar para C2 e dominá-lo
4. Badge `comeback` deve aparecer no ProgressPanel

## Autonomia Guiada (também nesta sessão)

### Arquivos alterados
- `src/types/domain.ts` — `TutorPayload` recebe `manualWithLowScore?: boolean`
- `src/app/tutor/page.tsx` — `presentQuestion(p, conceptId, manualWithLowScore = false)`;
  `handleNodeClick` detecta `score < 40 && attempts >= 2` e passa a flag
- `src/app/api/tutor/route.ts` — quando `manualWithLowScore === true`, insere parágrafo no prompt
  pedindo ao Euler que reconheça a escolha do aluno antes de perguntar

### Comportamento resultante
- Navegação normal (ZPD ou score ok): fluxo idêntico ao anterior
- Aluno clica em nó com `score < 40` e `attempts >= 2`: Euler abre com algo como
  "você escolheu explorar [Conceito] — vamos ver o que você já sabe" antes da pergunta
- Retrocesso automático ainda se aplica normalmente se o aluno travar

## Próximos Passos

1. Revisão de perguntas com Júlio
2. Deploy Vercel
3. Mobile testing
