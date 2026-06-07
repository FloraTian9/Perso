"use client";

import { useEffect, useRef } from "react";
import type { RoundtableMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";

type MessageFeedProps = {
  messages: RoundtableMessage[];
  isStreaming: boolean;
  scrollToBottom?: boolean;
};

export function MessageFeed({ messages, isStreaming, scrollToBottom = false }: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isStreaming || scrollToBottom) && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, scrollToBottom]);

  return (
    <section className="flex min-h-80 flex-col gap-3">
      {messages.length === 0 ? (
        <div className="flex min-h-52 items-center justify-center rounded border border-dashed border-neutral-800 px-4 text-center text-sm text-neutral-500">
          {isStreaming ? "圆桌正在接入信号..." : "还没有发言。"}
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} persona={message.persona} content={message.content} />
        ))
      )}
      <div ref={bottomRef} />
    </section>
  );
}
