import type { PersonaId } from "@/types";

type MessageBubbleProps = {
  persona: PersonaId | "user";
  content: string;
};

export function MessageBubble({ persona, content }: MessageBubbleProps) {
  return (
    <article className="rounded bg-[#1a1a1a] px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-white">{persona}</span>
      </div>
      <p className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-neutral-100">{content}</p>
    </article>
  );
}
