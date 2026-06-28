import type { Concept, ConceptId } from "@/types/domain";

export const CONCEPTS: Record<ConceptId, Concept> = {
  C1: {
    id: "C1",
    name: "Conceito de função",
    level: 1,
    prerequisites: [],
  },
  C2: {
    id: "C2",
    name: "Representações da função",
    level: 1,
    prerequisites: ["C1"],
  },
  C3: {
    id: "C3",
    name: "Plano cartesiano e leitura de gráficos",
    level: 2,
    prerequisites: ["C2"],
  },
  C4: {
    id: "C4",
    name: "Domínio e imagem a partir do gráfico",
    level: 2,
    prerequisites: ["C3"],
  },
  C5: {
    id: "C5",
    name: "Função afim (definição e coeficientes)",
    level: 3,
    prerequisites: ["C4"],
  },
  C6: {
    id: "C6",
    name: "Gráfico da função afim",
    level: 3,
    prerequisites: ["C5"],
  },
  C7: {
    id: "C7",
    name: "Função quadrática (definição)",
    level: 3,
    prerequisites: ["C5"],
  },
  C8: {
    id: "C8",
    name: "Gráfico da parábola",
    level: 4,
    prerequisites: ["C6", "C7"],
  },
  C9: {
    id: "C9",
    name: "Função exponencial",
    level: 4,
    prerequisites: ["C7"],
  },
  C10: {
    id: "C10",
    name: "Função logarítmica",
    level: 5,
    prerequisites: ["C9"],
  },
  C11: {
    id: "C11",
    name: "Composição de funções",
    level: 5,
    prerequisites: ["C9", "C10"],
  },
  C12: {
    id: "C12",
    name: "Função inversa",
    level: 6,
    prerequisites: ["C10"],
  },
};

export const CONCEPT_IDS = Object.keys(CONCEPTS) as ConceptId[];

/** Retorna os conceitos imediatos que dependem de um dado conceito (seus "filhos" no grafo). */
export function getDependents(conceptId: ConceptId): ConceptId[] {
  return CONCEPT_IDS.filter((id) =>
    CONCEPTS[id].prerequisites.includes(conceptId)
  );
}

/** Retorna o pré-requisito imediato para retrocesso.
 *  Quando há múltiplos pré-requisitos (C8, C11), retorna o de menor nível. */
export function getImmediatePrerequisite(
  conceptId: ConceptId
): ConceptId | null {
  const prereqs = CONCEPTS[conceptId].prerequisites;
  if (prereqs.length === 0) return null;
  return prereqs.reduce((lowest, id) =>
    CONCEPTS[id].level < CONCEPTS[lowest].level ? id : lowest
  );
}
