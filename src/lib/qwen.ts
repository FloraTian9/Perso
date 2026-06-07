import type { ChatMessage } from "@/types";

const DEFAULT_QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_QWEN_MODEL = "qwen3.5-plus-2026-02-15";

type StreamQwenChatOptions = {
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  enableThinking?: boolean;
  signal?: AbortSignal;
  trace?: {
    id: string;
    label: string;
    startedAt: number;
  };
};

type QwenStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning_content?: string;
    };
  }>;
};

function getApiKey(): string {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error("Missing QWEN_API_KEY. Add it to .env.local before testing the stream.");
  }

  return apiKey;
}

function getQwenBaseUrl(): string {
  return process.env.QWEN_BASE_URL?.replace(/\/$/, "") || DEFAULT_QWEN_BASE_URL;
}

function getQwenModel(): string {
  return process.env.QWEN_MODEL || DEFAULT_QWEN_MODEL;
}

function getPromptSize(messages: ChatMessage[]): number {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}

function logTtft(
  trace: StreamQwenChatOptions["trace"] | undefined,
  event: string,
  fields: Record<string, string | number | boolean | undefined> = {},
) {
  if (!trace) return;

  const elapsedMs = Date.now() - trace.startedAt;
  console.info("[chat-ttft]", {
    id: trace.id,
    label: trace.label,
    event,
    elapsedMs,
    ...fields,
  });
}

function toSse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function extractDelta(raw: string): { content: string | null; reasoningContent: string | null } | null {
  if (raw === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as QwenStreamChunk;
    const delta = parsed.choices?.[0]?.delta;
    return {
      content: delta?.content ?? null,
      reasoningContent: delta?.reasoning_content ?? null,
    };
  } catch {
    return null;
  }
}

export async function streamQwenChat({
  messages,
  maxTokens,
  temperature = 0.8,
  enableThinking = false,
  signal,
  trace,
}: StreamQwenChatOptions): Promise<ReadableStream<Uint8Array>> {
  const model = getQwenModel();
  const upstreamStartedAt = Date.now();

  logTtft(trace, "qwen_fetch_start", {
    model,
    messageCount: messages.length,
    promptChars: getPromptSize(messages),
    maxTokens,
    temperature,
    enableThinking,
  });

  let response: Response;
  try {
    response = await fetch(`${getQwenBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: maxTokens,
        temperature,
        enable_thinking: enableThinking,
      }),
      signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Qwen fetch error";
    logTtft(trace, "qwen_fetch_error", { message });
    throw error;
  }

  logTtft(trace, "qwen_headers", {
    status: response.status,
    upstreamHeaderMs: Date.now() - upstreamStartedAt,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    logTtft(trace, "qwen_response_error", {
      status: response.status,
      detail: detail.slice(0, 500),
    });
    throw new Error(`Qwen API request failed (${response.status}): ${detail}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let firstChunkLogged = false;
  let firstTokenLogged = false;
  let firstReasoningLogged = false;
  let tokenChars = 0;
  let reasoningChars = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.trim()) {
              controller.enqueue(encoder.encode(toSse({ type: "raw", content: buffer })));
            }
            controller.enqueue(encoder.encode(toSse({ type: "done" })));
            logTtft(trace, "qwen_stream_done", { tokenChars, reasoningChars });
            controller.close();
            return;
          }

          if (!firstChunkLogged) {
            firstChunkLogged = true;
            logTtft(trace, "qwen_first_chunk", {
              upstreamFirstChunkMs: Date.now() - upstreamStartedAt,
            });
          }

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          let hadContent = false;
          for (const frame of frames) {
            const lines = frame.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) {
                continue;
              }

              const raw = trimmed.slice(5).trim();
              if (raw === "[DONE]") {
                controller.enqueue(encoder.encode(toSse({ type: "done" })));
                logTtft(trace, "qwen_stream_done", { tokenChars, reasoningChars });
                controller.close();
                return;
              }

              const delta = extractDelta(raw);
              if (delta?.reasoningContent) {
                reasoningChars += delta.reasoningContent.length;
                if (!firstReasoningLogged) {
                  firstReasoningLogged = true;
                  logTtft(trace, "qwen_first_reasoning", {
                    upstreamFirstReasoningMs: Date.now() - upstreamStartedAt,
                  });
                }
              }
              if (delta?.content) {
                tokenChars += delta.content.length;
                if (!firstTokenLogged) {
                  firstTokenLogged = true;
                  logTtft(trace, "qwen_first_token", {
                    upstreamFirstTokenMs: Date.now() - upstreamStartedAt,
                    reasoningCharsBeforeAnswer: reasoningChars,
                  });
                }
                controller.enqueue(encoder.encode(toSse({ type: "token", content: delta.content })));
                hadContent = true;
              }
            }
          }

          if (hadContent) {
            return;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown streaming error";
        logTtft(trace, "qwen_stream_error", { message });
        controller.enqueue(encoder.encode(`event: error\n${toSse({ message })}`));
        controller.close();
      }
    },
    async cancel() {
      logTtft(trace, "client_stream_cancel", { tokenChars, reasoningChars });
      await reader.cancel();
    },
  });
}
