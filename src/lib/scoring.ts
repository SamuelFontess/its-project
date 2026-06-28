import type { ConceptState, StudentConcepts, ConceptId, BadgeId, StudentProfile } from "@/types/domain";
import { CONCEPTS } from "./domain";

// ─── Constantes ──────────────────────────────────────────────────────────────

const SCORE_CORRECT_NO_HINT = 20;
const SCORE_CORRECT_HINT_1 = 12;
const SCORE_CORRECT_HINT_2 = 6;
const SCORE_CORRECT_HINT_3 = 2;
const SCORE_WRONG = -10;

const MASTERY_SCORE = 80;
const MASTERY_CONSECUTIVE = 3;

const BACKTRACK_SCORE_THRESHOLD = 30;
const BACKTRACK_MIN_ATTEMPTS = 3;

const XP_CORRECT = 10;
const XP_MASTERY_BONUS = 50;

// ─── Inner Loop — Score ───────────────────────────────────────────────────────

/** Calcula o delta de score para um acerto, baseado no nível de hint atual. */
export function scoreForCorrect(hintLevel: number): number {
  if (hintLevel === 0) return SCORE_CORRECT_NO_HINT;
  if (hintLevel === 1) return SCORE_CORRECT_HINT_1;
  if (hintLevel === 2) return SCORE_CORRECT_HINT_2;
  return SCORE_CORRECT_HINT_3;
}

/** Aplica o resultado de uma resposta ao estado do conceito.
 *  Retorna o novo estado — não muta o original. */
export function applyAnswer(
  state: ConceptState,
  correct: boolean,
  hintLevel: number
): ConceptState {
  const delta = correct ? scoreForCorrect(hintLevel) : SCORE_WRONG;
  const newScore = Math.max(0, Math.min(100, state.score + delta));
  const newConsecutive = correct ? state.consecutiveCorrect + 1 : 0;
  const newAttempts = state.attempts + 1;
  const newStatus =
    isMastered({ ...state, score: newScore, consecutiveCorrect: newConsecutive })
      ? "dominado"
      : newScore > 0
      ? "em_progresso"
      : state.status === "dominado"
      ? "em_progresso"
      : state.status;

  return {
    score: newScore,
    status: newStatus,
    attempts: newAttempts,
    consecutiveCorrect: newConsecutive,
  };
}

/** Verifica se um conceito foi dominado. */
export function isMastered(state: ConceptState): boolean {
  return (
    state.score >= MASTERY_SCORE &&
    state.consecutiveCorrect >= MASTERY_CONSECUTIVE
  );
}

/** Verifica se deve ocorrer retrocesso para o pré-requisito. */
export function shouldBacktrack(state: ConceptState): boolean {
  return (
    state.score < BACKTRACK_SCORE_THRESHOLD &&
    state.attempts >= BACKTRACK_MIN_ATTEMPTS
  );
}

// ─── XP e Nível ──────────────────────────────────────────────────────────────

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400];

export function xpForAnswer(correct: boolean): number {
  return correct ? XP_CORRECT : 0;
}

export function xpForMastery(): number {
  return XP_MASTERY_BONUS;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, 5);
}

// ─── Badges ──────────────────────────────────────────────────────────────────

/** Avalia quais badges foram conquistados após uma atualização de estado.
 *  Retorna apenas os badges novos (não inclui os já existentes).
 *  @param cameBackFromBacktrack - true se o conceito recém-dominado havia causado retrocesso anteriormente */
export function evaluateBadges(
  profile: StudentProfile,
  updatedConcepts: StudentConcepts,
  justMasteredId: ConceptId | null,
  cameBackFromBacktrack = false
): BadgeId[] {
  const newBadges: BadgeId[] = [];
  const existing = new Set(profile.badges);

  const masteredCount = Object.values(updatedConcepts).filter(
    (c) => c.status === "dominado"
  ).length;

  // Primeiro conceito dominado
  if (!existing.has("first_mastery") && masteredCount >= 1) {
    newBadges.push("first_mastery");
  }

  // 3 acertos consecutivos em qualquer conceito
  if (
    !existing.has("streak_3") &&
    Object.values(updatedConcepts).some((c) => c.consecutiveCorrect >= 3)
  ) {
    newBadges.push("streak_3");
  }

  // Dominou função afim
  if (
    !existing.has("mastered_afim") &&
    updatedConcepts["C5"].status === "dominado"
  ) {
    newBadges.push("mastered_afim");
  }

  // Dominou função quadrática
  if (
    !existing.has("mastered_quadratic") &&
    updatedConcepts["C7"].status === "dominado"
  ) {
    newBadges.push("mastered_quadratic");
  }

  // Completou todos os conceitos
  if (!existing.has("mastered_all") && masteredCount === 12) {
    newBadges.push("mastered_all");
  }

  // Dominou sem usar hints — requer que o conceito recém-dominado tenha score=100
  if (
    !existing.has("no_hints") &&
    justMasteredId !== null &&
    updatedConcepts[justMasteredId].score === 100
  ) {
    newBadges.push("no_hints");
  }

  // Comeback — dominou um conceito que havia causado retrocesso
  if (!existing.has("comeback") && justMasteredId !== null && cameBackFromBacktrack) {
    newBadges.push("comeback");
  }

  return newBadges;
}

/** Retorna o estado inicial de um conceito para o diagnóstico (score = acertou ? 40 : 0). */
export function initialConceptStateFromDiagnostic(
  correct: boolean
): ConceptState {
  return {
    score: correct ? 40 : 0,
    status: correct ? "em_progresso" : "nao_visto",
    attempts: 1,
    consecutiveCorrect: correct ? 1 : 0,
  };
}

/** Retorna o estado inicial zerado de um conceito. */
export function emptyConceptState(): ConceptState {
  return {
    score: 0,
    status: "nao_visto",
    attempts: 0,
    consecutiveCorrect: 0,
  };
}

/** Gera o StudentConcepts inicial (todos zerados). */
export function initialStudentConcepts(): StudentConcepts {
  return Object.fromEntries(
    Object.keys(CONCEPTS).map((id) => [id, emptyConceptState()])
  ) as StudentConcepts;
}
