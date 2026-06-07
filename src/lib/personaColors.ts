import type { PersonaId } from "@/types";

type Group = "NT" | "NF" | "SJ" | "SP";

const PERSONA_GROUP: Record<PersonaId, Group> = {
  INTJ: "NT", INTP: "NT", ENTJ: "NT", ENTP: "NT",
  INFJ: "NF", INFP: "NF", ENFJ: "NF", ENFP: "NF",
  ISTJ: "SJ", ISFJ: "SJ", ESTJ: "SJ", ESFJ: "SJ",
  ISTP: "SP", ISFP: "SP", ESTP: "SP", ESFP: "SP",
};

type GroupColors = {
  avatarBg: string;
  bubbleBg: string;
  bubbleText: string;
};

const GROUP_COLORS: Record<Group, GroupColors> = {
  NT: { avatarBg: "#FFC700", bubbleBg: "#8046F5", bubbleText: "#FFC700" },
  NF: { avatarBg: "#5B5CF3", bubbleBg: "#B1FD00", bubbleText: "#5B5CF3" },
  SJ: { avatarBg: "#B1FD00", bubbleBg: "#A3F8FF", bubbleText: "#5B5CF3" },
  SP: { avatarBg: "#A3F8FF", bubbleBg: "#FFDD00", bubbleText: "#8046F5" },
};

export function getPersonaColors(personaId: PersonaId): GroupColors {
  const group = PERSONA_GROUP[personaId];
  return GROUP_COLORS[group];
}
