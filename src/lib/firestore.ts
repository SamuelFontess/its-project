import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import type { StudentProfile, StudentConcepts, ConceptId, BadgeId } from "@/types/domain";
import { initialStudentConcepts } from "./scoring";

const COLLECTION = "students";

function requireDb() {
  if (!db) throw new Error("Firestore não inicializado — configure o .env.local");
  return db;
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const snap = await getDoc(doc(requireDb(), COLLECTION, uid));
  if (!snap.exists()) return null;
  return snap.data() as StudentProfile;
}

// ─── Criação ──────────────────────────────────────────────────────────────────

export async function createStudentProfile(
  uid: string,
  name: string,
  email: string
): Promise<StudentProfile> {
  const profile: StudentProfile = {
    uid,
    name,
    email,
    diagnosticDone: false,
    concepts: initialStudentConcepts(),
    xp: 0,
    level: 1,
    badges: [],
  };
  await setDoc(doc(requireDb(), COLLECTION, uid), profile);
  return profile;
}

// ─── Diagnóstico ─────────────────────────────────────────────────────────────

export async function saveDiagnosticResult(
  uid: string,
  concepts: StudentConcepts
): Promise<void> {
  await updateDoc(doc(requireDb(), COLLECTION, uid), { concepts, diagnosticDone: true });
}

// ─── Score de Conceito ────────────────────────────────────────────────────────

/** Persiste apenas quando o score de um conceito muda ou ele é dominado. */
export async function updateConceptState(
  uid: string,
  conceptId: ConceptId,
  concepts: StudentConcepts,
  xp: number,
  level: number,
  newBadges: BadgeId[]
): Promise<void> {
  const updates: Record<string, unknown> = {
    [`concepts.${conceptId}`]: concepts[conceptId],
    xp,
    level,
  };
  if (newBadges.length > 0) {
    updates["badges"] = arrayUnion(...newBadges);
  }
  await updateDoc(doc(requireDb(), COLLECTION, uid), updates);
}
