import type { PersonaId } from "@/types";

type ConflictPair = readonly [PersonaId, PersonaId];

// High-tension pairs based on cognitive-function opposition (Te/Fi, Se/Ni, etc.)
export const HIGH_TENSION_PAIRS: readonly ConflictPair[] = [
  ["ENTJ", "INFP"],  // Te主导 vs Fi主导
  ["ESTJ", "ENFP"],
  ["ENTP", "ISTJ"],  // 公路组（高赞）
  ["INTJ", "ESFP"],
  ["ENTJ", "ENTP"],  // 龙骨组（高赞）
  ["ISFJ", "ENTP"],
  ["INFJ", "ESTP"],
  ["ENFJ", "ISTP"],
] as const;

// Keys must be the two IDs in alphabetical sort order (to match the .sort() in getConflictPreview)
const CONFLICT_DESCRIPTIONS: Record<string, string> = {
  "ENTJ-INFP": "ENTJ推进结果，INFP守护感受——一个像压路机，一个像消音器",
  "ENFP-ESTJ": "ESTJ要执行，ENFP要发散——ESTJ嫌ENFP飘，ENFP嫌ESTJ扼杀创意",
  "ENTP-ISTJ": "ENTP颠覆先例，ISTJ引用先例——同一个「规则」在他们那完全相反",
  "ESFP-INTJ": "INTJ觉得ESFP肤浅，ESFP觉得INTJ无聊——根本不在同一频道",
  "ENTJ-ENTP": "ENTJ要收敛，ENTP要发散——龙骨组：能量互相点燃，也互相消耗",
  "ENTP-ISFJ": "ENTP把ISFJ当保守派，ISFJ把ENTP当搅局者——都觉得对方在拖后腿",
  "ESTP-INFJ": "INFJ读深意，ESTP看表面——INFJ以为对方在回避，ESTP以为对方想太多",
  "ENFJ-ISTP": "ENFJ要带人往前走，ISTP不需要被带——ENFJ觉得ISTP冷漠，ISTP觉得ENFJ在推销",
};

/**
 * Given the selected personas, return a text description of all high-tension
 * pairs present in the group.
 */
export function getConflictPreview(personas: PersonaId[]): string {
  const found: string[] = [];

  for (const [a, b] of HIGH_TENSION_PAIRS) {
    if (personas.includes(a) && personas.includes(b)) {
      const key = [a, b].sort().join("-");
      const desc = CONFLICT_DESCRIPTIONS[key] ?? `${a} vs ${b}`;
      found.push(desc);
    }
  }

  if (found.length === 0) return "";
  return found.join("；");
}

/**
 * Return the default high-conflict 4-persona group. Covers 3 high-tension
 * pairs: ENTJ/INFP, ENTJ/ENTP (龙骨), ENTP/ISTJ (公路).
 */
export function suggestConflictGroup(): PersonaId[] {
  return ["ENTJ", "INFP", "ENTP", "ISTJ"];
}
