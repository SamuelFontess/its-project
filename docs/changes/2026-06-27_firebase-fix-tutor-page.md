# Fix Firebase SSR + Página /tutor completa

**Data:** 2026-06-27
**Autor:** Claude Code
**Escopo:** frontend / config

---

## Contexto

Firebase crashava no servidor (SSR) quando as env vars estavam vazias. Corrigido com init lazy client-only. Em seguida, implementada a página `/tutor` — a tela principal do ITS.

## Mudanças Realizadas

- `firebase.ts` — init só no cliente e só se `apiKey` presente; exports `auth`/`db` são nullable
- `firestore.ts` — `requireDb()` lança erro claro se Firestore não inicializado
- `page.tsx` — guarda `if (!auth)` antes do `onAuthStateChanged`; mostra mensagem de config pendente
- `src/components/tutor/ConceptGraph.tsx` — React Flow DAG com 12 nós, cores por status, clique para autonomia, MiniMap
- `src/components/tutor/ChatInterface.tsx` — chat com scroll automático, skeleton de loading, erro + retry, Enter para enviar
- `src/components/tutor/ProgressPanel.tsx` — XP bar, nível, badges com tooltip
- `src/app/tutor/page.tsx` — página completa: auth gate → inner loop → outer loop → backtrack → conclusão

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/lib/firebase.ts` | modificado |
| `src/lib/firestore.ts` | modificado |
| `src/app/page.tsx` | modificado |
| `src/components/tutor/ConceptGraph.tsx` | criado |
| `src/components/tutor/ChatInterface.tsx` | criado |
| `src/components/tutor/ProgressPanel.tsx` | criado |
| `src/app/tutor/page.tsx` | criado |

## Validação

```bash
npx tsc --noEmit   # zero erros
npm run build      # ✓ 7/7 páginas geradas, zero erros
```

Rotas: `/` (2.48kB), `/tutor` (63kB — React Flow), `/api/tutor` (serverless)

## Próximos Passos

1. Preencher `.env.local` com credenciais Firebase + DeepSeek
2. Configurar projeto Firebase (Auth Google + Firestore)
3. Testar fluxo completo: login → diagnóstico → tutor → grafo atualiza
