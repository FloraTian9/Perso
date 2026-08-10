import type { PersonaId } from "@/types";

const PERSONA_TTS_SPEED_RATIOS: Partial<Record<PersonaId, number>> = {
  INFP: 1.15,
  ISTJ: 1.2,
};

const DEFAULT_TTS_SPEED_RATIO = 1;

export function getPersonaTtsSpeedRatio(persona: PersonaId): number {
  const value = PERSONA_TTS_SPEED_RATIOS[persona] ?? DEFAULT_TTS_SPEED_RATIO;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TTS_SPEED_RATIO;
}
