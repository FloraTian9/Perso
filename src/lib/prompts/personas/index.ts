import { INTJ } from "./INTJ";
import { ENTJ } from "./ENTJ";
import { ENTP } from "./ENTP";
import { INFJ } from "./INFJ";
import { INFP } from "./INFP";
import { ENFJ } from "./ENFJ";
import { ENFP } from "./ENFP";
import { ISTJ } from "./ISTJ";
import { ISFJ } from "./ISFJ";
import { ESTJ } from "./ESTJ";
import { ESFJ } from "./ESFJ";
import { ESTP } from "./ESTP";
import { ISFP } from "./ISFP";
import { ISTP } from "./ISTP";
import { ESFP } from "./ESFP";
import { INTP } from "./INTP";

import type { PersonaId } from "@/types";

export type PersonaPrompt = {
  id: PersonaId;
  tagline: string;
  prompt: string;
};

export const personas: Record<PersonaId, PersonaPrompt> = {
  INTJ,
  ENTJ,
  ENTP,
  INFJ,
  INFP,
  ENFJ,
  ENFP,
  ISTJ,
  ISFJ,
  ESTJ,
  ESFJ,
  ESTP,
  ISFP,
  ISTP,
  ESFP,
  INTP,
};

export function getPersonaPrompt(id: PersonaId): PersonaPrompt {
  return personas[id];
}
