import fs from "node:fs";
import { randomUUID } from "node:crypto";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const apiKey =
  env.VOLCENGINE_TTS_API_KEY || env.DOUBAO_TTS_API_KEY || env.VOLCENGINE_API_KEY || env.DOUBAO_API_KEY;
const appKey = "aGjiRDfUWi";
const resourceId = env.VOLCENGINE_TTS_RESOURCE_ID || env.DOUBAO_TTS_RESOURCE_ID || "seed-tts-2.0";

const voices = process.argv.slice(2);

if (!apiKey) {
  console.error("Missing VOLCENGINE_TTS_API_KEY in .env.local");
  process.exit(1);
}

if (!voices.length) {
  console.error("Usage: node scripts/test-volcengine-voices.mjs <speaker> [speaker...]");
  process.exit(1);
}

function parseJsonObjects(raw) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        try {
          objects.push(JSON.parse(raw.slice(start, i + 1)));
        } catch {}
        start = -1;
      }
    }
  }

  return objects;
}

async function testVoice(voice) {
  const response = await fetch("https://openspeech.bytedance.com/api/v3/tts/unidirectional", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-App-Key": appKey,
      "X-Api-Key": apiKey,
      "X-Api-Resource-Id": resourceId,
      "X-Api-Request-Id": randomUUID(),
    },
    body: JSON.stringify({
      user: {
        uid: "perso-voice-test",
      },
      req_params: {
        text: "你好，这是一句音色测试。",
        speaker: voice,
        audio_params: {
          format: "mp3",
          sample_rate: 24000,
        },
      },
    }),
  });

  const raw = await response.text();
  const chunks = parseJsonObjects(raw);
  const hasAudio = chunks.some((chunk) => typeof chunk.data === "string" && chunk.data.length > 0);
  const message = chunks.map((chunk) => chunk.message).filter(Boolean).pop() || raw.slice(0, 120).replace(/\s+/g, " ");

  return {
    voice,
    ok: response.ok && hasAudio,
    status: response.status,
    message: response.ok && hasAudio ? "ok" : message,
  };
}

for (const voice of voices) {
  try {
    const result = await testVoice(voice);
    const label = result.ok ? "OK  " : "FAIL";
    console.log(`${label} ${result.status} ${result.voice} ${result.message}`);
  } catch (error) {
    console.log(`ERR  ${voice} ${error instanceof Error ? error.message : String(error)}`);
  }
}
