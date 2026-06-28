# CompletionScreen melhorada + Regras Firestore

**Data:** 2026-06-27
**Autor:** Claude Code
**Escopo:** frontend / infra

---

## Contexto

`CompletionScreen` era minimalista — não mostrava os badges conquistados. O badge `mastered_all`
já era disparado corretamente por `evaluateBadges`, mas não havia destaque visual na tela final.

Além disso, as regras do Firestore precisam ser revisadas para produção (Vercel).

---

## Objetivo

- Melhorar `CompletionScreen` para mostrar stats, badges conquistados e destacar `mastered_all`
- Documentar as regras corretas do Firestore para deploy seguro

---

## Mudanças Realizadas

### `src/app/tutor/page.tsx`

- `COMPLETION_BADGE_LABELS` — mapa local de ids → labels (não precisa importar de outro módulo)
- `CompletionScreen` reescrita com:
  - Grid 3 colunas: XP total / Nível final / Nº conquistas
  - Lista de badges conquistados com destaque para `mastered_all` (borda e background primary)
  - Botão "Voltar ao início" → `router.replace("/")`
  - Ícone ✓ simples no topo (texto, sem emoji de festa)

---

## Regras do Firestore — Como configurar corretamente

### Regras atuais (precisam ser atualizadas)

As regras atualmente no console do Firebase devem ser:
```
allow read, write: if request.auth.uid == userId;
```

### Problema

Falta verificar `request.auth != null` antes. Se `request.auth` for null (usuário não autenticado
tentando acessar a coleção), acessar `.uid` causa um erro no servidor do Firestore — não simplesmente
nega o acesso, pode gerar logs de erro desnecessários.

### Regras corretas para produção

No Firebase Console → Firestore → Rules, usar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### O que essas regras fazem

- `request.auth != null` — garante que só usuários autenticados acessam
- `request.auth.uid == userId` — garante que cada aluno só lê/escreve o próprio documento
- Qualquer outro caminho no Firestore é negado por padrão (não há `match` para ele)

### O que NÃO precisa para este projeto

- Validação de campos com `request.resource.data` — overkill para projeto acadêmico
- Cloud Functions para validação server-side — a API Route do Next.js já protege o Groq
- Regras de listagem — o app nunca lista todos os alunos

### Segurança no deploy Vercel

| Item | Status | Ação |
|------|--------|------|
| `GROQ_API_KEY` | Só no servidor | Adicionar nas env vars da Vercel como "Server" (não "Browser") |
| `NEXT_PUBLIC_FIREBASE_*` | Público por design | Podem estar nas env vars da Vercel como "Browser" — já estão no HTML mesmo |
| `.env.local` no `.gitignore` | Verificar | O create-next-app já coloca `.env.local` no .gitignore por padrão |
| Firestore Rules | Corrigir antes do deploy | Ver regras acima |

---

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/app/tutor/page.tsx` | modificado |

---

## Fix: hint nunca exibido ao aluno (também nesta sessão)

**Arquivo:** `src/app/tutor/page.tsx`

O LLM retorna `{ correct, feedback, hint }` no modo avaliação. O código mostrava apenas
`feedback` no chat e usava `hint` somente para incrementar o hintLevel internamente —
o texto da dica nunca chegava ao aluno.

Fix: quando `evalResult.correct === false` e `evalResult.hint` existe, concatena hint ao
feedback antes de `addMessage`:

```js
const tutorMessage =
  !evalResult.correct && evalResult.hint
    ? `${evalResult.feedback}\n\n${evalResult.hint}`
    : evalResult.feedback;
```

---

## Próximos Passos

1. Atualizar regras no Firebase Console com o snippet acima
2. Deploy Vercel com env vars corretas
3. Testar fluxo completo em produção
