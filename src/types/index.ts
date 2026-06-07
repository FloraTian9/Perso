export type PersonaId =
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP";

export type ChatMode = "fun" | "participant" | "spectator";

export type NormalizedChatMode = "fun" | "participant";

export type Atmosphere = "sharp" | "plain" | "sincere" | "assertive";

export type MessageLabel = "反驳" | "追问" | "打断" | "共识";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type Persona = {
  id: PersonaId;
  tagline: string;
  prompt: string;
};

export type RoundtableMessage = {
  id: string;
  persona: PersonaId | "user";
  content: string;
  turn: number;
  timestamp: number;
  label?: MessageLabel;
};

export type Session = {
  id: string;
  topic: string;
  mode: ChatMode;
  atmosphere?: Atmosphere;
  personas: PersonaId[];
  messages: RoundtableMessage[];
  createdAt: string;
  endedBy: "natural" | "user";
};
