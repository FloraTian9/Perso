import type { PersonaId } from "@/types";

export const PERSONA_IDS: readonly PersonaId[] = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

export const DEFAULT_PERSONAS: PersonaId[] = ["INTJ", "ENFP", "ISTJ", "ESTP"];

export function isPersonaId(value: unknown): value is PersonaId {
  return typeof value === "string" && PERSONA_IDS.includes(value as PersonaId);
}
