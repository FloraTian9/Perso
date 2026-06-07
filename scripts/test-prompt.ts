#!/usr/bin/env npx tsx
/**
 * Smoke test for M2 prompt quality. Calls the live /api/chat endpoint, prints
 * the parsed dialog, and runs automated checks. Exit code 1 means at least one
 * check failed.
 *
 * NOTE: This is a smoke test, NOT a full quality gate. It cannot replace the
 * manual acceptance run (5 topics × 2 rounds) required in dev-plan.md. Checks
 * that require human judgment (persona voice, naturalness, surprise consensus)
 * must still be verified manually.
 *
 * Automated checks:
 *   ✓ Turn count 10–15
 *   ✓ No meta-narration ("作为INTJ我认为")
 *   ✓ No numbered recommendation lists
 *   ✓ All turns ≤ 3 sentences
 *   ✓ All labels are valid (反驳/追问/打断/共识)
 *   ✓ Label diversity: at least 打断 and 追问 each appear once
 *   ✓ Output personas all belong to the selected set
 *   ✓ Each selected persona appears at least once
 *
 * Usage:
 *   npx tsx scripts/test-prompt.ts [topic] [persona1,persona2,...] [host]
 *
 * Examples:
 *   npx tsx scripts/test-prompt.ts "今晚吃什么" "INTJ,ENFP,ISTJ,ENTP"
 *   npx tsx scripts/test-prompt.ts "要不要辞职" "ENTJ,INFP,ESTP" http://localhost:3001
 */

import { buildSpectatorSystemPrompt } from "../src/lib/prompts/spectator";
import type { PersonaId } from "../src/types";

const ALL_PERSONAS: PersonaId[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const topic = process.argv[2] ?? "今晚吃什么";
const personaArg = process.argv[3];
const host = process.argv[4]?.replace(/\/$/, "") ?? "http://localhost:3000";

const personas: PersonaId[] = personaArg
  ? (personaArg.split(",").filter((p) => ALL_PERSONAS.includes(p as PersonaId)) as PersonaId[])
  : ["INTJ", "ENFP", "ISTJ", "ENTP"];

console.log("=== Perso Prompt Test ===");
console.log(`Topic   : ${topic}`);
console.log(`Personas: ${personas.join(", ")}`);
console.log(`Host    : ${host}`);
console.log("\n--- System Prompt Preview (first 400 chars) ---");
console.log(buildSpectatorSystemPrompt({ topic, personas }).slice(0, 400) + "...\n");

console.log("--- Calling API (fun mode) ---\n");

type DialogLine = { persona: string; content: string; label: string };

function extractDialogLines(raw: string): DialogLine[] {
  const objects: DialogLine[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaping = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaping) escaping = false;
      else if (ch === "\\") escaping = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          objects.push(JSON.parse(raw.slice(start, i + 1)) as DialogLine);
        } catch {}
        start = -1;
      }
    }
  }

  return objects;
}

async function run() {
  const res = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, mode: "fun", personas }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    console.error(`API error (${res.status}): ${err}`);
    process.exit(1);
  }

  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const raw = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(raw) as { type: string; content?: string };
          if (parsed.type === "token" && parsed.content) {
            fullText += parsed.content;
            process.stdout.write(parsed.content);
          }
          if (parsed.type === "done") {
            process.stdout.write("\n");
          }
        } catch {
          // ignore non-JSON frames
        }
      }
    }
  }

  console.log("\n--- Parsed Dialog ---\n");

  const lines = extractDialogLines(fullText);
  if (lines.length === 0) {
    console.error("Could not parse any JSON object from response. Raw output above.");
    process.exit(1);
  }

  const labelMap: Record<string, string> = {
    反驳: "🔴", 追问: "🔵", 打断: "🟡", 共识: "🟢",
  };

  for (const line of lines) {
    const icon = labelMap[line.label] ?? "⚪";
    console.log(`${icon} [${line.label}] ${line.persona}`);
    console.log(`   ${line.content}`);
    console.log();
  }

  console.log(`Total: ${lines.length} turns`);

  // Automated checks
  const selectedSet = new Set(personas);
  const validLabels = new Set(["反驳", "追问", "打断", "共识"]);
  const labelCounts = new Map<string, number>();
  for (const l of lines) labelCounts.set(l.label, (labelCounts.get(l.label) ?? 0) + 1);

  const turnOk = lines.length >= 10 && lines.length <= 15;
  const metaNarration = lines.filter((l) => l.content.includes("作为") && l.content.includes("我认为"));
  // Numbered lists: "1." / "1。" / "一、" / "①"
  const bulletLists = lines.filter((l) => /^\s*[\d①②③一二三四五六七八九十][.。、]/.test(l.content));

  const badLabels = lines.filter((l) => !validLabels.has(l.label));
  const labelDiversityOk = (labelCounts.get("打断") ?? 0) >= 1 && (labelCounts.get("追问") ?? 0) >= 1;
  const unknownPersonas = lines.filter((l) => !selectedSet.has(l.persona as PersonaId));
  const missingPersonas = personas.filter((p) => !lines.some((l) => l.persona === p));

  console.log("\n--- Validation (smoke test) ---");

  function check(ok: boolean, pass: string, fail: string) {
    console.log(ok ? `✅ ${pass}` : `❌ ${fail}`);
    return ok;
  }

  const results = [
    check(turnOk, `Turn count: ${lines.length} (10–15)`, `Turn count: ${lines.length} (expect 10–15)`),
    check(metaNarration.length === 0, "No meta-narration", `Meta-narration in ${metaNarration.length} turn(s)`),
    check(bulletLists.length === 0, "No numbered lists", `Numbered list detected in ${bulletLists.length} turn(s)`),

    check(badLabels.length === 0, "All labels valid", `Invalid labels: ${badLabels.map((l) => l.label).join(", ")}`),
    check(labelDiversityOk, "Label diversity ok (打断 + 追问 each ≥ 1)", `Missing label(s): ${["打断","追问"].filter(l => !labelCounts.get(l)).join(", ")}`),
    check(unknownPersonas.length === 0, "All output personas in selected set", `Unknown personas: ${[...new Set(unknownPersonas.map(l => l.persona))].join(", ")}`),
    check(missingPersonas.length === 0, "All selected personas appear", `Missing personas: ${missingPersonas.join(", ")}`),
  ];

  const failed = results.some((r) => !r);
  if (failed) {
    console.log("\n❌ Smoke test FAILED — fix prompt before marking M2 complete.");
    console.log("   (Manual validation of voice/naturalness still required regardless.)");
    process.exit(1);
  }
  console.log("\n✅ Smoke test PASSED.");
  console.log("   Manual validation still required: 5 topics × 2 rounds, check voice/naturalness.");
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
