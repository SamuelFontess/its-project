# Banco de perguntas, API Route, Firebase e página de diagnóstico

**Data:** 2026-06-27
**Autor:** Claude Code
**Escopo:** backend / frontend / config

---

## Contexto

Com a lógica pedagógica pronta, era necessário implementar o conteúdo (banco de perguntas), a camada de comunicação com o LLM (API Route), a persistência (Firebase) e a primeira tela do usuário (diagnóstico inicial).

## Objetivo

Completar a cadeia end-to-end: perguntas → API → Firebase → UI de diagnóstico.

## Mudanças Realizadas

- `src/lib/questions.ts` — 12 perguntas diagnósticas + 36 perguntas de tutoria (3 por conceito, dificuldade 1/2/3) com hints em 3 níveis. Funções `selectQuestion()` com lógica de esgotamento de banco.
- `src/app/api/tutor/route.ts` — API Route POST para DeepSeek. Suporta 4 modos: diagnostic, tutor, evaluation, backtrack. Prompts builder separado por modo. Retorna texto livre (tutor/backtrack) ou JSON parseado (diagnostic/evaluation).
- `.env.local` — variáveis de ambiente (DeepSeek + Firebase), sem valores.
- `src/lib/firebase.ts` — init Firebase (singleton com `getApps()`), exports: `auth`, `db`, `googleProvider`.
- `src/lib/firestore.ts` — operações Firestore: `getStudentProfile`, `createStudentProfile`, `saveDiagnosticResult`, `updateConceptState`. Escreve no Firestore apenas quando score muda ou conceito é dominado.
- `src/app/page.tsx` — página `/` completa: auth gate → diagnóstico 12 perguntas → salva → redirect `/tutor`.

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/lib/questions.ts` | criado |
| `src/app/api/tutor/route.ts` | criado |
| `.env.local` | criado |
| `src/lib/firebase.ts` | criado |
| `src/lib/firestore.ts` | criado |
| `src/app/page.tsx` | modificado (reescrito) |

## Design da Página `/`

- Layout: coluna centralizada, max-w-md, minimalista
- Auth: título "Euler" + botão Google (ícone SVG real)
- Quiz: progress bar `h-px` (ultra-fina), pergunta em texto, Textarea, botão Pular + Responder
- Loading: Skeletons durante init, texto simples "Salvando resultados…" no final
- Erro: mensagem inline + botão "Tentar novamente" (sem modal desnecessário)

## Próximos Passos

1. Página `/tutor` — chat + grafo React Flow + dashboard
