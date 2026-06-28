import type { ConceptId, StudentConcepts } from "@/types/domain";
import { CONCEPTS, CONCEPT_IDS, getImmediatePrerequisite } from "./domain";

/**
 * Outer Loop — Seleção do próximo conceito (ZPD).
 *
 * Regras (determinísticas, nunca o LLM):
 * 1. Elegível = não dominado + todos os pré-requisitos dominados
 * 2. Entre os elegíveis, prioriza o de maior score (fronteira do conhecimento)
 * 3. Empate de score → prioriza o de menor nível no grafo (garante C1 como entrada)
 *
 * Retorna null quando todos os 12 conceitos estão dominados.
 */
export function selectNextConcept(
  concepts: StudentConcepts
): ConceptId | null {
  const eligible = CONCEPT_IDS.filter((id) => isEligible(id, concepts));

  if (eligible.length === 0) return null;

  return eligible.reduce((best, id) => {
    const bestState = concepts[best];
    const currentState = concepts[id];

    if (currentState.score > bestState.score) return id;
    if (currentState.score < bestState.score) return best;
    // Empate: menor nível ganha
    return CONCEPTS[id].level < CONCEPTS[best].level ? id : best;
  });
}

/** Verifica se um conceito está elegível para ser o próximo. */
function isEligible(id: ConceptId, concepts: StudentConcepts): boolean {
  if (concepts[id].status === "dominado") return false;
  return CONCEPTS[id].prerequisites.every(
    (prereqId) => concepts[prereqId].status === "dominado"
  );
}

/**
 * Verifica se um conceito pode ser selecionado manualmente pelo aluno
 * (pré-requisitos dominados, independente de estar ou não dominado).
 */
export function isUnlocked(id: ConceptId, concepts: StudentConcepts): boolean {
  return CONCEPTS[id].prerequisites.every(
    (prereqId) => concepts[prereqId].status === "dominado"
  );
}

/**
 * Retrocesso: dado o conceito atual que travou, retorna o pré-requisito
 * imediato para o qual o aluno deve regredir.
 *
 * Regras:
 * - Retorna null se o conceito for C1 (sem pré-requisito — mantém C1 ativo)
 * - Usa o pré-requisito de menor nível quando há múltiplos (C8, C11)
 */
export function getBacktrackTarget(
  currentId: ConceptId
): ConceptId | null {
  return getImmediatePrerequisite(currentId);
}

/**
 * Verifica se todos os conceitos foram dominados (estado de conclusão).
 */
export function isCompleted(concepts: StudentConcepts): boolean {
  return CONCEPT_IDS.every((id) => concepts[id].status === "dominado");
}

/**
 * Gera a meta de sessão padrão com base no próximo conceito elegível.
 * Usada para exibição no chat e passada ao LLM como contexto.
 */
export function getSessionGoal(concepts: StudentConcepts): string {
  const next = selectNextConcept(concepts);
  if (!next) return "Parabéns! Você dominou todas as funções matemáticas.";
  return `Dominar: ${CONCEPTS[next].name}`;
}
