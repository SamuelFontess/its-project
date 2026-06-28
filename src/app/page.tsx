"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged, type User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import {
  getStudentProfile,
  createStudentProfile,
  saveDiagnosticResult,
} from "@/lib/firestore";
import { DIAGNOSTIC_QUESTIONS } from "@/lib/questions";
import { CONCEPT_IDS } from "@/lib/domain";
import {
  initialStudentConcepts,
  initialConceptStateFromDiagnostic,
} from "@/lib/scoring";
import type { ConceptId, DiagnosticLLMResponse, StudentConcepts } from "@/types/domain";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState =
  | { phase: "loading" }
  | { phase: "auth" }
  | { phase: "quiz"; questionIndex: number; evaluating: boolean; error: string | null }
  | { phase: "saving" }
  | { phase: "error"; message: string };

// ─── Componente ───────────────────────────────────────────────────────────────

export default function DiagnosticPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>({ phase: "loading" });
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<Record<ConceptId, boolean>>(
    {} as Record<ConceptId, boolean>
  );

  // Auth listener
  useEffect(() => {
    if (!auth) {
      setAppState({ phase: "error", message: "Firebase não configurado. Preencha o .env.local com as credenciais do projeto." });
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAppState({ phase: "auth" });
        return;
      }
      setUser(u);
      const profile = await getStudentProfile(u.uid);
      if (!profile) {
        await createStudentProfile(
          u.uid,
          u.displayName ?? "Aluno",
          u.email ?? ""
        );
        setAppState({ phase: "quiz", questionIndex: 0, evaluating: false, error: null });
      } else if (profile.diagnosticDone) {
        router.replace("/tutor");
      } else {
        setAppState({ phase: "quiz", questionIndex: 0, evaluating: false, error: null });
      }
    });
    return unsub;
  }, [router]);

  async function handleSignIn() {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setAppState({
        phase: "error",
        message: "Não foi possível fazer login. Tente novamente.",
      });
    }
  }

  async function handleAnswer(skip = false) {
    if (appState.phase !== "quiz") return;
    const { questionIndex } = appState;
    const conceptId = CONCEPT_IDS[questionIndex];
    const question = DIAGNOSTIC_QUESTIONS[conceptId];

    if (!skip && answer.trim() === "") return;

    setAppState({ ...appState, evaluating: true, error: null });

    let correct = false;

    if (!skip) {
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "diagnostic",
            question: question.question,
            expectedAnswer: question.expectedAnswer,
            studentAnswer: answer.trim(),
          }),
        });
        if (!res.ok) throw new Error("api_error");
        const data: DiagnosticLLMResponse = await res.json();
        correct = data.correct;
      } catch {
        setAppState({ ...appState, evaluating: false, error: "Erro de conexão. Tente novamente." });
        return;
      }
    }

    const newResults = { ...results, [conceptId]: correct };
    setResults(newResults);
    setAnswer("");

    const nextIndex = questionIndex + 1;
    if (nextIndex >= CONCEPT_IDS.length) {
      await finishDiagnostic(newResults);
    } else {
      setAppState({ phase: "quiz", questionIndex: nextIndex, evaluating: false, error: null });
    }
  }

  async function finishDiagnostic(finalResults: Record<ConceptId, boolean>) {
    if (!user) return;
    setAppState({ phase: "saving" });

    const concepts: StudentConcepts = initialStudentConcepts();
    for (const id of CONCEPT_IDS) {
      concepts[id] = initialConceptStateFromDiagnostic(finalResults[id] ?? false);
    }

    try {
      await saveDiagnosticResult(user.uid, concepts);
      router.replace("/tutor");
    } catch {
      setAppState({ phase: "error", message: "Erro ao salvar resultados. Tente novamente." });
    }
  }

  // ─── Renders ────────────────────────────────────────────────────────────────

  if (appState.phase === "loading" || appState.phase === "saving") {
    return (
      <LoadingScreen
        label={appState.phase === "saving" ? "Salvando resultados…" : undefined}
      />
    );
  }

  if (appState.phase === "error") {
    return (
      <CenteredLayout>
        <p className="text-muted-foreground text-sm">{appState.message}</p>
        <Button
          variant="outline"
          onClick={() => setAppState({ phase: "auth" })}
          className="mt-4"
        >
          Voltar
        </Button>
      </CenteredLayout>
    );
  }

  if (appState.phase === "auth") {
    return (
      <CenteredLayout>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Euler</h1>
          <p className="text-muted-foreground text-sm">
            Tutor de Funções Matemáticas
          </p>
        </div>
        <div className="w-full border-t border-border" />
        <div className="space-y-3 w-full">
          <p className="text-sm text-muted-foreground text-center">
            Faça login para começar
          </p>
          <Button onClick={handleSignIn} className="w-full" variant="outline">
            <GoogleIcon />
            Entrar com Google
          </Button>
        </div>
      </CenteredLayout>
    );
  }

  // Quiz
  const { questionIndex, evaluating, error } = appState;
  const conceptId = CONCEPT_IDS[questionIndex];
  const question = DIAGNOSTIC_QUESTIONS[conceptId];
  const total = CONCEPT_IDS.length;
  const progress = (questionIndex / total) * 100;

  return (
    <CenteredLayout>
      {/* Progress */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Diagnóstico Inicial</span>
          <span>{questionIndex + 1} / {total}</span>
        </div>
        <Progress value={progress} className="h-px" />
      </div>

      {/* Question */}
      <div className="w-full space-y-4">
        <p className="text-sm leading-relaxed">{question.question}</p>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Sua resposta…"
          rows={4}
          disabled={evaluating}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) handleAnswer();
          }}
        />
        {error && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-destructive flex-1">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={() => handleAnswer()}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAnswer(true)}
          disabled={evaluating}
          className="text-muted-foreground text-xs"
        >
          Pular
        </Button>
        <Button
          onClick={() => handleAnswer()}
          disabled={evaluating || answer.trim() === ""}
          className="flex-1 text-sm"
        >
          {evaluating ? "Avaliando…" : "Responder"}
        </Button>
      </div>
    </CenteredLayout>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">{children}</div>
    </div>
  );
}

function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-4 px-4">
        {label ? (
          <p className="text-sm text-muted-foreground text-center">{label}</p>
        ) : (
          <>
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
