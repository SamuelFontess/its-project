// ─── Domínio ────────────────────────────────────────────────────────────────

export type ConceptId =
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5"
  | "C6"
  | "C7"
  | "C8"
  | "C9"
  | "C10"
  | "C11"
  | "C12";

export interface Concept {
  id: ConceptId;
  name: string;
  level: number; // 1–6, orientação de leitura do grafo
  prerequisites: ConceptId[];
}

export interface DiagnosticQuestion {
  conceptId: ConceptId;
  question: string;
  expectedAnswer: string;
}

export interface TutorQuestion {
  id: string;
  conceptId: ConceptId;
  question: string;
  expectedAnswer: string;
  difficulty: 1 | 2 | 3; // 1=fácil, 2=médio, 3=difícil
  hints: [string, string, string]; // hint nível 1, 2, 3
}

// ─── Modelo do Aluno ─────────────────────────────────────────────────────────

export type ConceptStatus = "nao_visto" | "em_progresso" | "dominado";

export interface ConceptState {
  score: number; // 0–100
  status: ConceptStatus;
  attempts: number;
  consecutiveCorrect: number;
}

export type StudentConcepts = Record<ConceptId, ConceptState>;

export interface StudentProfile {
  uid: string;
  name: string;
  email: string;
  diagnosticDone: boolean;
  concepts: StudentConcepts;
  xp: number;
  level: number; // 1–5
  badges: BadgeId[];
}

// ─── Gamificação ─────────────────────────────────────────────────────────────

export type BadgeId =
  | "first_mastery"       // primeiro conceito dominado
  | "streak_3"            // 3 acertos consecutivos
  | "mastered_afim"       // dominou função afim (C5)
  | "mastered_quadratic"  // dominou função quadrática (C7)
  | "mastered_all"        // completou todos os conceitos
  | "no_hints"            // dominou um conceito sem usar hints
  | "comeback"            // recuperou após retrocesso;

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
}

export const LEVEL_LABELS: Record<number, string> = {
  1: "Iniciante",
  2: "Aprendiz",
  3: "Praticante",
  4: "Avançado",
  5: "Especialista",
};

export const XP_PER_LEVEL: number[] = [0, 100, 250, 500, 900, 1400];

// ─── Estado de Sessão (nunca persistido) ─────────────────────────────────────

export interface SessionState {
  activeConceptId: ConceptId | null;
  hintLevel: number; // 0–3
  usedQuestionIds: Partial<Record<ConceptId, Set<string>>>;
  chatHistory: ChatMessage[];
}

export interface ChatMessage {
  role: "tutor" | "student";
  content: string;
}

// ─── API Routes ──────────────────────────────────────────────────────────────

export type LLMMode = "diagnostic" | "tutor" | "evaluation" | "backtrack";

export interface DiagnosticPayload {
  mode: "diagnostic";
  question: string;
  expectedAnswer: string;
  studentAnswer: string;
}

export interface TutorPayload {
  mode: "tutor";
  studentName: string;
  conceptName: string;
  conceptScore: number;
  attempts: number;
  studentLevel: number;
  sessionGoal: string;
  question: string;
  history: ChatMessage[];
  /** true quando o aluno navegou manualmente para este conceito com score baixo (< 40 e ≥ 2 tentativas) */
  manualWithLowScore?: boolean;
}

export interface EvaluationPayload {
  mode: "evaluation";
  conceptName: string;
  question: string;
  expectedAnswer: string;
  studentAnswer: string;
  hintLevel: number;
  history: ChatMessage[];
}

export interface BacktrackPayload {
  mode: "backtrack";
  studentName: string;
  currentConceptName: string;
  prereqConceptName: string;
  conceptScore: number;
}

export type LLMPayload =
  | DiagnosticPayload
  | TutorPayload
  | EvaluationPayload
  | BacktrackPayload;

export interface DiagnosticLLMResponse {
  correct: boolean;
  justification?: string;
}

export interface EvaluationLLMResponse {
  correct: boolean;
  feedback: string;
  hint?: string;
}
