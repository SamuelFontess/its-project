# Setup base do projeto: Next.js 14 + Tailwind v3 + Shadcn/ui + Tipos TypeScript

**Data:** 2026-06-27
**Autor:** Claude Code
**Escopo:** config / frontend / deps / types

---

## Contexto

Início do projeto ITS Funções Matemáticas. O diretório existia apenas com o CLAUDE.md.
Era necessário criar a base do projeto com o stack definido: Next.js 14, Tailwind CSS v3, Shadcn/ui, React Flow e Firebase.
Após o scaffold inicial, o estilo visual foi refinado para **Minimalism & Swiss Style (dark)** — sem decorações, zinc palette, fonte Geist.

## Objetivo

Scaffoldar o projeto Next.js 14 com App Router, configurar Tailwind v3, inicializar Shadcn/ui compatível com Tailwind v3, definir o design system minimalista e criar os tipos TypeScript do domínio.

## Mudanças Realizadas

- Scaffold do projeto com `create-next-app@14` (TypeScript, Tailwind, ESLint, App Router, src dir, alias `@/*`)
- Instaladas dependências: `reactflow`, `firebase`, primitivos Radix UI, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tailwindcss-animate`, `autoprefixer`, `geist`
- Configurado Shadcn/ui v3-style com `components.json` (style: default, baseColor: slate)
- Adicionados componentes Shadcn: `button`, `card`, `textarea`, `progress`, `badge`, `scroll-area`, `tooltip`, `sheet`, `separator`, `skeleton`
- `globals.css` reescrito com CSS variables HSL (Tailwind v3 compatível), zinc-950 dark minimalista
- `tailwind.config.ts` com todos os mapeamentos de cores Shadcn + nó grafo com paleta minimalista (zinc + único acento green)
- `layout.tsx`: Geist Sans + Geist Mono, lang `pt-BR`, classe `dark`, `TooltipProvider`
- `src/types/domain.ts` criado com todos os tipos TypeScript do projeto
- `postcss.config.mjs` com `autoprefixer`

## Design System Final

**Estilo:** Minimalism & Swiss Style (dark)
**Fonte:** Geist Sans + Geist Mono (instalada localmente, zero latência)
**Paleta:**
- Background: `#09090B` zinc-950
- Card: `#18181B` zinc-900
- Text: `#FAFAFA` zinc-50
- Muted: `#71717A` zinc-500
- Border: `#27272A` zinc-800
- Primary: branco puro
- Accent único: `#22C55E` green (acertos/progresso)
- Nós grafo: zinc-700 (bloqueado), zinc-800 (não visto), zinc-300 (em progresso), green-500 (dominado), branco (ativo)

## Arquivos Afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `package.json` | modificado (dependências) |
| `postcss.config.mjs` | modificado |
| `tailwind.config.ts` | criado (design system completo) |
| `components.json` | criado |
| `src/app/globals.css` | modificado (zinc dark minimalista) |
| `src/app/layout.tsx` | modificado (Geist, metadata, TooltipProvider) |
| `src/lib/utils.ts` | criado |
| `src/components/ui/*` | criados (10 componentes Shadcn) |
| `src/types/domain.ts` | criado (todos os tipos do projeto) |

## Tipos TypeScript criados (`src/types/domain.ts`)

- `ConceptId` — union type C1–C12
- `Concept` — nó do grafo (id, nome, nível, pré-requisitos)
- `DiagnosticQuestion` / `TutorQuestion` — perguntas dos dois modos
- `ConceptState` / `StudentConcepts` / `StudentProfile` — modelo do aluno
- `SessionState` / `ChatMessage` — estado de sessão (nunca persistido)
- `LLMPayload` (union) — payloads para os 4 modos de chamada ao DeepSeek
- `DiagnosticLLMResponse` / `EvaluationLLMResponse` — respostas esperadas do LLM
- `BadgeId` / `Badge` — gamificação
- `LEVEL_LABELS` / `XP_PER_LEVEL` — constantes de progressão

## Raciocínio Técnico

**shadcn@latest vs Tailwind v3:** `shadcn@latest` gera CSS Tailwind v4 incompatível com o v3 do scaffold. Solução: `components.json` manual com `style: default` e globals.css com variáveis HSL padrão v3.

**Geist em vez de Google Fonts:** Geist é instalada como pacote npm, sem dependência de rede em build. Zero latência, ideal para ambiente de desenvolvimento local.

**Zinc em vez de Slate:** Zinc é mais neutro (sem tom azul), resultado final mais limpo no dark mode.

## Alternativas Avaliadas

| Alternativa | Por que descartada |
|-------------|-------------------|
| Shadcn@latest (v4) | CSS incompatível com Tailwind v3 |
| Dark OLED blue-tinted | Usuário preferiu minimalismo zinc neutro |
| Google Fonts (Crimson Pro + Atkinson) | Substituídas por Geist (local, sem latência) |
| Migrar Tailwind v4 | Fora do escopo; CLAUDE.md define Next.js 14 |

## Validação

```bash
npx tsc --noEmit  # sem erros
npm run build     # ✓ Generating static pages (5/5)
```

## Próximos Passos

1. `src/lib/domain.ts` — DAG dos 12 conceitos
2. `src/lib/scoring.ts` — regras inner loop
3. `src/lib/zpd.ts` — algoritmo outer loop
4. `src/lib/questions.ts` — banco mockado de perguntas
5. `src/app/api/tutor/route.ts` — API Route DeepSeek
6. Firebase setup
7. Páginas `/` e `/tutor`
