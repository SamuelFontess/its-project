"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getStudentProfile, updateConceptState } from "@/lib/firestore";
import { CONCEPTS, CONCEPT_IDS } from "@/lib/domain";
import {
  applyAnswer,
  isMastered,
  shouldBacktrack,
  xpForAnswer,
  xpForMastery,
  levelFromXp,
  evaluateBadges,
} from "@/lib/scoring";
import {
  selectNextConcept,
  isUnlocked,
  getBacktrackTarget,
  isCompleted,
  getSessionGoal,
} from "@/lib/zpd";
import { selectQuestion } from "@/lib/questions";

import type {
  ConceptId,
  StudentProfile,
  ChatMessage,
  EvaluationLLMResponse,
  BadgeId,
} from "@/types/domain";

import { ConceptGraph } from "@/components/tutor/ConceptGraph";
import { ChatInterface } from "@/components/tutor/ChatInterface";
import { ProgressPanel } from "@/components/tutor/ProgressPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// ─── Estado de sessão ─────────────────────────────────────────────────────────

interface SessionRef {
  activeConceptId: ConceptId | null;
  hintLevel: number;
  usedQuestionIds: Partial<Record<ConceptId, Set<string>>>;
  currentQuestionId: string | null;
  currentQuestionText: string | null;
  currentExpectedAnswer: string | null;
  currentQuestionHints: [string, string, string] | null;
  pendingRetry: (() => Promise<void>) | null;
  sessionGoal: string;
  /** Conceitos que causaram retrocesso — para detectar comeback badge */
  backtrackedConceptIds: Set<ConceptId>;
  /** Turnos conversacionais consecutivos sem tentativa de resposta na pergunta atual */
  conversationalTurns: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TutorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sessionGoal, setSessionGoal] = useState("");
  const [completed, setCompleted] = useState(false);
  const [goalPending, setGoalPending] = useState(false);
  const [lastXpGain, setLastXpGain] = useState<number | null>(null);

  // Ref para estado de sessão (não precisa re-render)
  const session = useRef<SessionRef>({
    activeConceptId: null,
    hintLevel: 0,
    usedQuestionIds: {},
    currentQuestionId: null,
    currentQuestionText: null,
    currentExpectedAnswer: null,
    currentQuestionHints: null,
    pendingRetry: null,
    sessionGoal: "",
    backtrackedConceptIds: new Set(),
    conversationalTurns: 0,
  });

  // Auth gate + carregamento do perfil
  useEffect(() => {
    if (!auth) {
      router.replace("/");
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/"); return; }
      const p = await getStudentProfile(u.uid);
      if (!p || !p.diagnosticDone) { router.replace("/"); return; }
      setProfile(p);
      initSession(p);
    });
    return unsub;
  }, [router]);

  function initSession(p: StudentProfile) {
    const goal = getSessionGoal(p.concepts);
    session.current.sessionGoal = goal;
    setSessionGoal(goal);

    if (isCompleted(p.concepts)) {
      setCompleted(true);
      return;
    }

    const nextConcept = selectNextConcept(p.concepts);
    if (!nextConcept) return;

    session.current.activeConceptId = nextConcept;
    session.current.hintLevel = 0;
    setGoalPending(true); // aguarda o aluno aceitar ou trocar a meta
  }

  function handleGoalAccept() {
    setGoalPending(false);
    if (profile && session.current.activeConceptId) {
      presentQuestion(profile, session.current.activeConceptId);
    }
  }

  function handleGoalChoose(conceptId: ConceptId) {
    if (!profile) return;
    session.current.activeConceptId = conceptId;
    session.current.hintLevel = 0;
    const newGoal = `Dominar: ${CONCEPTS[conceptId].name}`;
    session.current.sessionGoal = newGoal;
    setSessionGoal(newGoal);
    setGoalPending(false);
    presentQuestion(profile, conceptId);
  }

  // ─── Apresentar pergunta ────────────────────────────────────────────────────

  const presentQuestion = useCallback(async (p: StudentProfile, conceptId: ConceptId, manualWithLowScore = false) => {
    const usedIds = session.current.usedQuestionIds[conceptId] ?? new Set<string>();
    const question = selectQuestion(conceptId, usedIds);

    // Marca como usada
    if (!session.current.usedQuestionIds[conceptId]) {
      session.current.usedQuestionIds[conceptId] = new Set();
    }
    session.current.usedQuestionIds[conceptId]!.add(question.id);
    session.current.currentQuestionId = question.id;
    session.current.currentQuestionText = question.question;
    session.current.currentExpectedAnswer = question.expectedAnswer;
    session.current.currentQuestionHints = question.hints;
    session.current.conversationalTurns = 0;

    const history = getHistory();
    setIsLoading(true);
    setChatError(null);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "tutor",
          studentName: p.name,
          conceptName: CONCEPTS[conceptId].name,
          conceptScore: p.concepts[conceptId].score,
          attempts: p.concepts[conceptId].attempts,
          studentLevel: p.level,
          sessionGoal: session.current.sessionGoal,
          question: question.question,
          history,
          manualWithLowScore,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "api_error");
      }
      const data = await res.json();
      addMessage("tutor", data.text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de conexão com o tutor.";
      setChatError(msg === "api_error" ? "Erro de conexão com o tutor." : msg);
      session.current.pendingRetry = () => presentQuestion(p, conceptId);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Avaliar resposta ───────────────────────────────────────────────────────

  const handleSend = useCallback(async (text: string) => {
    if (!profile || !session.current.activeConceptId) return;

    // Captura histórico com a mensagem do aluno incluída antes do state atualizar
    const history: ChatMessage[] = [
      ...messages,
      { role: "student" as const, content: text },
    ].slice(-12);

    addMessage("student", text);
    setIsLoading(true);
    setChatError(null);

    const conceptId = session.current.activeConceptId;

    let evalResult: EvaluationLLMResponse;
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluation",
          conceptName: CONCEPTS[conceptId].name,
          question: session.current.currentQuestionText,
          expectedAnswer: session.current.currentExpectedAnswer,
          studentAnswer: text,
          hintLevel: session.current.hintLevel,
          history,
          conversationalTurns: session.current.conversationalTurns,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Erro ao avaliar resposta.");
      }
      evalResult = await res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao avaliar resposta. Tente novamente.";
      setChatError(msg);
      session.current.pendingRetry = () => handleSend(text);
      setIsLoading(false);
      return;
    }

    // Aluno tirou dúvida / pediu explicação — responde sem pontuar
    if (evalResult.type === "conversation") {
      addMessage("tutor", evalResult.response);
      session.current.conversationalTurns += 1;
      setIsLoading(false);
      return;
    }

    // Tentativa de resposta — fluxo normal de avaliação
    const { correct: isCorrect, feedback } = evalResult;

    // Usa hint pré-escrito do banco de perguntas
    const prewrittenHint =
      !isCorrect && session.current.currentQuestionHints
        ? session.current.currentQuestionHints[Math.min(session.current.hintLevel, 2)]
        : null;

    if (!isCorrect) {
      session.current.hintLevel = Math.min(3, session.current.hintLevel + 1);
    }

    session.current.conversationalTurns = 0;

    const tutorMessage =
      !isCorrect && prewrittenHint
        ? `${feedback}\n\nDica: ${prewrittenHint}`
        : feedback;
    addMessage("tutor", tutorMessage);

    // Atualiza estado
    const prevState = profile.concepts[conceptId];
    const newConceptState = applyAnswer(prevState, isCorrect, session.current.hintLevel);
    const answerXp = xpForAnswer(isCorrect);
    const masteryXp = isMastered(newConceptState) ? xpForMastery() : 0;
    const gainedXp = answerXp + masteryXp;
    const newXp = profile.xp + gainedXp;

    if (gainedXp > 0) setLastXpGain(gainedXp);

    let updatedProfile = {
      ...profile,
      xp: newXp,
      concepts: { ...profile.concepts, [conceptId]: newConceptState },
    };

    let justMasteredId: ConceptId | null = null;

    if (isMastered(newConceptState)) {
      justMasteredId = conceptId;
    }

    updatedProfile = {
      ...updatedProfile,
      level: levelFromXp(updatedProfile.xp),
    };

    // Badges
    const cameBack = justMasteredId !== null && session.current.backtrackedConceptIds.has(justMasteredId);
    const newBadges: BadgeId[] = evaluateBadges(profile, updatedProfile.concepts, justMasteredId, cameBack);
    if (newBadges.length > 0) {
      updatedProfile = { ...updatedProfile, badges: [...profile.badges, ...newBadges] };
    }

    setProfile(updatedProfile);

    // Persiste somente se score mudou
    if (prevState.score !== newConceptState.score || justMasteredId) {
      updateConceptState(
        profile.uid,
        conceptId,
        updatedProfile.concepts,
        updatedProfile.xp,
        updatedProfile.level,
        newBadges
      ).catch(console.error);
    }

    setIsLoading(false);

    // Decide próximo estado
    if (isCompleted(updatedProfile.concepts)) {
      setCompleted(true);
      return;
    }

    if (isMastered(newConceptState)) {
      addMessage("system", `${CONCEPTS[conceptId].name} dominado · +${masteryXp + answerXp} XP`);
      session.current.hintLevel = 0;
      const next = selectNextConcept(updatedProfile.concepts);
      if (next) {
        session.current.activeConceptId = next;
        const newGoal = getSessionGoal(updatedProfile.concepts);
        session.current.sessionGoal = newGoal;
        setSessionGoal(newGoal);
        presentQuestion(updatedProfile, next);
      }
      return;
    }

    if (!isCorrect && shouldBacktrack(newConceptState)) {
      const target = getBacktrackTarget(conceptId);
      if (target) {
        await triggerBacktrack(updatedProfile, conceptId, target);
      } else {
        // C1 sem retrocesso — reinicia inner loop com reset para evitar
        // que shouldBacktrack dispare imediatamente na volta
        const resetState = {
          ...updatedProfile.concepts[conceptId],
          attempts: 0,
          consecutiveCorrect: 0,
        };
        const profileReset = {
          ...updatedProfile,
          concepts: { ...updatedProfile.concepts, [conceptId]: resetState },
        };
        setProfile(profileReset);
        updateConceptState(
          profile.uid, conceptId, profileReset.concepts,
          profileReset.xp, profileReset.level, []
        ).catch(console.error);
        session.current.hintLevel = 0;
        session.current.usedQuestionIds[conceptId] = new Set();
        presentQuestion(profileReset, conceptId);
      }
      return;
    }

    // Continua no mesmo conceito com nova pergunta
    if (isCorrect) {
      session.current.hintLevel = 0;
      presentQuestion(updatedProfile, conceptId);
    }
    // Se errou, aguarda nova tentativa na mesma pergunta
  }, [profile, presentQuestion]);

  // ─── Retrocesso ─────────────────────────────────────────────────────────────

  async function triggerBacktrack(
    p: StudentProfile,
    fromId: ConceptId,
    toId: ConceptId
  ) {
    // Reseta attempts e consecutiveCorrect do conceito que causou retrocesso.
    // Sem isso, ao retornar ao conceito o aluno seria imediatamente retrocedido
    // de novo (attempts >= 3 e score < 30 ainda verdadeiros).
    const resetFromState = {
      ...p.concepts[fromId],
      attempts: 0,
      consecutiveCorrect: 0,
    };
    const profileAfterReset: StudentProfile = {
      ...p,
      concepts: { ...p.concepts, [fromId]: resetFromState },
    };
    setProfile(profileAfterReset);
    updateConceptState(
      p.uid,
      fromId,
      profileAfterReset.concepts,
      p.xp,
      p.level,
      []
    ).catch(console.error);

    setIsLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "backtrack",
          studentName: p.name,
          currentConceptName: CONCEPTS[fromId].name,
          prereqConceptName: CONCEPTS[toId].name,
          conceptScore: p.concepts[fromId].score,
        }),
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json();
      addMessage("tutor", data.text);
    } catch {
      // Silencia erro de backtrack — continua
    } finally {
      setIsLoading(false);
    }

    // Marca fromId: se dominado depois, concede comeback badge
    session.current.backtrackedConceptIds.add(fromId);
    session.current.activeConceptId = toId;
    session.current.hintLevel = 0;
    presentQuestion(profileAfterReset, toId);
  }

  // ─── Seleção manual pelo aluno ───────────────────────────────────────────────

  function handleNodeClick(conceptId: ConceptId) {
    if (!profile) return;
    if (!isUnlocked(conceptId, profile.concepts)) return;
    session.current.activeConceptId = conceptId;
    session.current.hintLevel = 0;
    const state = profile.concepts[conceptId];
    const isLowScore = state.score < 40 && state.attempts >= 2;
    presentQuestion(profile, conceptId, isLowScore);
  }

  // ─── Retry ──────────────────────────────────────────────────────────────────

  function handleRetry() {
    if (session.current.pendingRetry) {
      session.current.pendingRetry();
      session.current.pendingRetry = null;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function addMessage(role: ChatMessage["role"], content: string) {
    setMessages((prev) => {
      const next = [...prev, { role, content }];
      return next.slice(-12); // mantém últimas 12 mensagens na UI (6 trocas)
    });
  }

  function getHistory(): ChatMessage[] {
    return messages.slice(-12);
  }

  // ─── Renders ─────────────────────────────────────────────────────────────────

  if (!profile) return <TutorSkeleton />;

  if (completed) return <CompletionScreen profile={profile} />;

  if (goalPending && session.current.activeConceptId) {
    return (
      <GoalScreen
        profile={profile}
        suggestedConceptId={session.current.activeConceptId}
        sessionGoal={sessionGoal}
        onAccept={handleGoalAccept}
        onChoose={handleGoalChoose}
      />
    );
  }

  const activeConceptId = session.current.activeConceptId;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-none h-10 flex items-center justify-between px-4 border-b border-border">
        <span className="text-sm font-medium">Euler</span>
        <span className="text-xs text-muted-foreground">{profile.name}</span>

        {/* Mobile: botão para abrir grafo */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden text-xs">
              Grafo
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-background">
            <div className="h-[70vh]">
              <ConceptGraph
                concepts={profile.concepts}
                activeConceptId={activeConceptId}
                onNodeClick={handleNodeClick}
              />
            </div>
            <ProgressPanel profile={profile} lastXpGain={lastXpGain} onXpGainShown={() => setLastXpGain(null)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Corpo */}
      <div className="flex-1 flex overflow-hidden">
        {/* Coluna esquerda — grafo + dashboard (desktop) */}
        <aside className="hidden lg:flex flex-col w-[38%] border-r border-border overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ConceptGraph
              concepts={profile.concepts}
              activeConceptId={activeConceptId}
              onNodeClick={handleNodeClick}
            />
          </div>
          <ProgressPanel profile={profile} lastXpGain={lastXpGain} onXpGainShown={() => setLastXpGain(null)} />
        </aside>

        {/* Coluna direita — chat */}
        <main className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            activeConceptId={activeConceptId}
            conceptScore={activeConceptId ? profile.concepts[activeConceptId].score : 0}
            isLoading={isLoading}
            error={chatError}
            onSend={handleSend}
            onRetry={handleRetry}
            sessionGoal={sessionGoal}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Tela de conclusão ────────────────────────────────────────────────────────

const COMPLETION_BADGE_LABELS: Record<string, string> = {
  first_mastery:      "Primeiro passo",
  streak_3:           "Em sequência",
  mastered_afim:      "Função afim",
  mastered_quadratic: "Função quadrática",
  mastered_all:       "Completo",
  no_hints:           "Sem dicas",
  comeback:           "Retomada",
};

function CompletionScreen({ profile }: { profile: StudentProfile }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">

        {/* Título */}
        <div className="space-y-2">
          <div className="text-4xl mb-4 select-none">✓</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Parabéns, {profile.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Você dominou todos os 12 conceitos de funções matemáticas.
          </p>
        </div>

        <div className="border-t border-border" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-xl font-semibold">{profile.xp}</p>
            <p className="text-xs text-muted-foreground">XP total</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-semibold">{profile.level}</p>
            <p className="text-xs text-muted-foreground">Nível final</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-semibold">{profile.badges.length}</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </div>
        </div>

        {/* Badges conquistados */}
        {profile.badges.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Conquistas desbloqueadas</p>
            <div className="flex flex-wrap justify-center gap-2">
              {profile.badges.map((id) => (
                <span
                  key={id}
                  className={`inline-block px-2.5 py-1 rounded text-xs border ${
                    id === "mastered_all"
                      ? "border-primary/60 text-primary bg-primary/10 font-medium"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {COMPLETION_BADGE_LABELS[id] ?? id}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border" />

        <button
          onClick={() => router.replace("/")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

// ─── Tela de meta de sessão ───────────────────────────────────────────────────

function GoalScreen({
  profile,
  suggestedConceptId,
  sessionGoal,
  onAccept,
  onChoose,
}: {
  profile: StudentProfile;
  suggestedConceptId: ConceptId;
  sessionGoal: string;
  onAccept: () => void;
  onChoose: (id: ConceptId) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const allUnlocked = CONCEPT_IDS.filter((id) =>
    isUnlocked(id, profile.concepts)
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Olá, {profile.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">Sugestão para hoje:</p>
        </div>

        <div className="border border-border rounded px-4 py-3">
          <p className="text-sm font-medium">{CONCEPTS[suggestedConceptId].name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sessionGoal}</p>
        </div>

        {!showPicker ? (
          <div className="space-y-2">
            <Button onClick={onAccept} className="w-full">
              Começar
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
              onClick={() => setShowPicker(true)}
            >
              Escolher outro conceito
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Conceitos desbloqueados:</p>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {allUnlocked.map((id) => {
                const status = profile.concepts[id].status;
                const isSuggested = id === suggestedConceptId;
                const isMasteredConcept = status === "dominado";
                return (
                  <button
                    key={id}
                    onClick={() => onChoose(id)}
                    className="w-full text-left px-3 py-2 rounded border border-border text-sm hover:bg-secondary transition-colors flex items-center justify-between"
                  >
                    <span>{CONCEPTS[id].name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {isSuggested ? "sugerido" : isMasteredConcept ? "revisar" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground text-xs"
              onClick={() => setShowPicker(false)}
            >
              Voltar à sugestão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton de carregamento ─────────────────────────────────────────────────

function TutorSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="h-10 border-b border-border flex items-center px-4">
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex-1 flex">
        <div className="hidden lg:block w-[38%] border-r border-border p-4 space-y-3">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      </div>
    </div>
  );
}
