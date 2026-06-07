"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PersonaId, RoundtableMessage } from "@/types";
import { getPersonaColors } from "@/lib/personaColors";

type ShareVideoProps = {
  topic: string;
  personas: PersonaId[];
  messages: RoundtableMessage[];
  onClose: () => void;
};

const CANVAS_W = 360;
const CANVAS_H = 640;
const INTRO_MS = 1200;
const OUTRO_MS = 1200;
const MAX_VIDEO_MS = 58000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getMessageDuration(message: RoundtableMessage) {
  return clamp(1300 + message.content.length * 48, 2400, 4300);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  let current = "";
  for (const ch of text.split("")) {
    const next = current + ch;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = ch;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines && text.length > lines.join("").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(0, lines[maxLines - 1].length - 1))}...`;
  }
  return lines;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getBubbleColors(persona: PersonaId | "user") {
  if (persona === "user") return { bubbleBg: "#E5E5E5", bubbleText: "#111111" };
  return getPersonaColors(persona);
}

function getMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function prepareMessages(messages: RoundtableMessage[]) {
  const visible = messages.filter((message) => message.content.trim().length > 0);
  let total = INTRO_MS + OUTRO_MS;
  const kept: RoundtableMessage[] = [];
  for (const message of visible) {
    const duration = getMessageDuration(message);
    if (kept.length > 0 && total + duration > MAX_VIDEO_MS) break;
    kept.push(message);
    total += duration;
  }
  return kept.length > 0 ? kept : visible.slice(0, 1);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function ShareVideo({ topic, personas, messages, onClose }: ShareVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement | null>>({});
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const startedAtRef = useRef(0);
  const recordingRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  const videoMessages = useMemo(() => prepareMessages(messages), [messages]);
  const durationMs = useMemo(
    () => INTRO_MS + OUTRO_MS + videoMessages.reduce((sum, message) => sum + getMessageDuration(message), 0),
    [videoMessages],
  );

  const drawAvatar = useCallback((
    ctx: CanvasRenderingContext2D,
    persona: PersonaId | "user",
    x: number,
    y: number,
    size: number,
  ) => {
    const avatarBg = persona === "user" ? "#E5E5E5" : getPersonaColors(persona).avatarBg;
    const image = imagesRef.current[persona === "user" ? "user" : `${persona}-sprite`];
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = avatarBg;
    ctx.fill();
    ctx.clip();
    if (image) ctx.drawImage(image, x - size * 0.025, y, size * 1.05, size * 1.05);
    ctx.restore();
  }, []);

  const drawScene = useCallback((elapsedMs: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const bg = imagesRef.current.bg;
    if (bg) ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);
    else {
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    gradient.addColorStop(0, "rgba(0,0,0,0.45)");
    gradient.addColorStop(0.45, "rgba(0,0,0,0.75)");
    gradient.addColorStop(1, "rgba(0,0,0,0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = "center";
    ctx.fillStyle = "#B1FD00";
    ctx.font = "13px VonwaonBitmap, monospace";
    ctx.fillText("Perso 人格圆桌", CANVAS_W / 2, 48);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "17px VonwaonBitmap, monospace";
    wrapText(ctx, topic, CANVAS_W - 56, 2).forEach((line, index) => {
      ctx.fillText(line, CANVAS_W / 2, 82 + index * 24);
    });

    if (elapsedMs < INTRO_MS) {
      const progress = elapsedMs / INTRO_MS;
      const y = 218;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "22px VonwaonBitmap, monospace";
      ctx.fillText("这场圆桌开始了", CANVAS_W / 2, y);
      ctx.fillStyle = "#D3D1D1";
      ctx.font = "13px VonwaonBitmap, monospace";
      ctx.fillText("不同人格正在接话", CANVAS_W / 2, y + 34);
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.fillRect(45, y + 58, CANVAS_W - 90, 16);
      ctx.strokeRect(45, y + 58, CANVAS_W - 90, 16);
      ctx.fillStyle = "#B1FD00";
      ctx.fillRect(50, y + 63, (CANVAS_W - 100) * clamp(progress, 0, 1), 6);
      return;
    }

    if (elapsedMs >= durationMs - OUTRO_MS) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "24px VonwaonBitmap, monospace";
      ctx.fillText("你会让谁入座？", CANVAS_W / 2, 284);
      ctx.fillStyle = "#B1FD00";
      ctx.font = "15px VonwaonBitmap, monospace";
      ctx.fillText("Perso", CANVAS_W / 2, 326);
      return;
    }

    let cursor = INTRO_MS;
    let current = videoMessages[0];
    let messageIndex = 0;
    for (let i = 0; i < videoMessages.length; i++) {
      const messageDuration = getMessageDuration(videoMessages[i]);
      if (elapsedMs < cursor + messageDuration || i === videoMessages.length - 1) {
        current = videoMessages[i];
        messageIndex = i;
        break;
      }
      cursor += messageDuration;
    }

    const speaker = current.persona;
    const label = speaker === "user" ? "你" : speaker;
    const avatarSize = 132;
    const avatarX = (CANVAS_W - avatarSize) / 2;
    const avatarY = 148;
    drawAvatar(ctx, speaker, avatarX, avatarY, avatarSize);

    roundedRect(ctx, CANVAS_W / 2 - 52, avatarY + avatarSize - 18, 104, 32, 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px VonwaonBitmap, monospace";
    ctx.fillText(label, CANVAS_W / 2, avatarY + avatarSize + 5);

    const colors = getBubbleColors(speaker);
    const bubbleX = 26;
    const bubbleY = avatarY + avatarSize + 32;
    const bubbleW = CANVAS_W - 52;
    ctx.font = speaker === "user" ? "15px sans-serif" : "15px VonwaonBitmap, monospace";
    const lines = wrapText(ctx, current.content, bubbleW - 40, 5);
    const bubbleH = Math.max(76, lines.length * 24 + 28);
    roundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 16);
    ctx.fillStyle = colors.bubbleBg;
    ctx.fill();
    ctx.fillStyle = colors.bubbleText;
    ctx.textAlign = "left";
    lines.forEach((line, index) => {
      ctx.fillText(line, bubbleX + 20, bubbleY + 34 + index * 24);
    });

    const audience = personas.filter((persona) => speaker === "user" || persona !== speaker).slice(0, 4);
    const size = audience.length >= 4 ? 50 : 56;
    const gap = 12;
    const totalW = audience.length * size + Math.max(0, audience.length - 1) * gap;
    let x = (CANVAS_W - totalW) / 2;
    const y = Math.min(bubbleY + bubbleH + 14, CANVAS_H - 150);
    for (const persona of audience) {
      drawAvatar(ctx, persona, x, y, size);
      x += size + gap;
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#D3D1D1";
    ctx.font = "12px VonwaonBitmap, monospace";
    ctx.fillText(`${messageIndex + 1} / ${videoMessages.length}`, CANVAS_W / 2, CANVAS_H - 58);
    const progress = clamp(elapsedMs / Math.max(1, durationMs), 0, 1);
    ctx.fillStyle = "#000000";
    ctx.fillRect(45, CANVAS_H - 38, CANVAS_W - 90, 14);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(50, CANVAS_H - 33, (CANVAS_W - 100) * progress, 4);
  }, [drawAvatar, durationMs, personas, topic, videoMessages]);

  useEffect(() => {
    let cancelled = false;
    async function loadAssets() {
      const entries: [string, string][] = [["bg", "/bg/table-bg.png"], ["user", "/sprites/user/user.png"]];
      for (const persona of personas) entries.push([`${persona}-sprite`, `/sprites/${persona}/${persona.toLowerCase()}.png`]);
      const loaded = await Promise.all(entries.map(async ([key, src]) => [key, await loadImage(src)] as const));
      if (cancelled) return;
      imagesRef.current = Object.fromEntries(loaded);
      setReady(true);
    }
    loadAssets();
    return () => { cancelled = true; };
  }, [personas]);

  useEffect(() => {
    if (!ready) return;
    function tick() {
      const elapsed = recordingRef.current
        ? performance.now() - startedAtRef.current
        : (performance.now() % durationMs);
      drawScene(Math.min(elapsed, durationMs));
      rafRef.current = window.requestAnimationFrame(tick);
    }
    tick();
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [drawScene, durationMs, ready]);

  async function shareOrDownload(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], "perso-roundtable.webm", { type: blob.type || "video/webm" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `Perso · ${topic}` });
      return;
    }
    const link = document.createElement("a");
    link.download = "perso-roundtable.webm";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function startRecording() {
    const canvas = canvasRef.current;
    const mimeType = getMimeType();
    if (!canvas || !canvas.captureStream || !mimeType) {
      setError("当前浏览器不支持生成视频，请改用分享卡片。");
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl("");
    setError("");
    const chunks: BlobPart[] = [];
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;
    recordingRef.current = true;
    startedAtRef.current = performance.now();
    setRecording(true);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      recordingRef.current = false;
      setRecording(false);
      const blob = new Blob(chunks, { type: mimeType });
      setVideoUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, durationMs);
  }

  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  return (
    <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col bg-[#0A0A0A]">
      <div className="flex h-14 shrink-0 items-center px-5" style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}>
        <button type="button" onClick={onClose} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/close-button.png" alt="关闭" style={{ width: 30, height: 30, imageRendering: "pixelated" }} />
        </button>
        <p className="font-pixel absolute left-1/2 -translate-x-1/2 text-white" style={{ fontSize: 18 }}>
          分享视频
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="max-h-full max-w-full border border-[#333333]"
          style={{ imageRendering: "pixelated", aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        />
      </div>

      {error && (
        <p className="font-pixel px-5 pb-2 text-center text-[#FFC700]" style={{ fontSize: 12, lineHeight: "18px" }}>
          {error}
        </p>
      )}

      <div className="flex shrink-0 justify-center gap-3 px-5" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <button
          type="button"
          disabled={!ready || recording}
          onClick={startRecording}
          className="font-pixel h-10 rounded-sm border border-[#89B93B] bg-[#B1FD00] px-5 text-black disabled:opacity-50"
          style={{ fontSize: 13 }}
        >
          {recording ? "生成中..." : videoUrl ? "重新生成" : "生成视频"}
        </button>
        <button
          type="button"
          disabled={!videoUrl || recording}
          onClick={() => { if (videoUrl) void shareOrDownload(videoUrl); }}
          className="font-pixel h-10 rounded-sm border border-[#454545] bg-[#111111] px-5 text-white disabled:opacity-50"
          style={{ fontSize: 13 }}
        >
          分享/下载
        </button>
      </div>
    </div>
  );
}
