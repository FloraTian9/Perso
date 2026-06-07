"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { ChatMode, PersonaId, RoundtableMessage } from "@/types";
import { getPersonaColors } from "@/lib/personaColors";

// 4 个槽位（左上 / 右上 / 左下 / 右下）的展示参数。
// 每个槽位独立配，跟具体人格无关 —— 哪个人格落在哪个槽位由选择顺序决定。
type SlotStyle = {
  rotation: number;
  offsetX: number;
  offsetY: number;
  badgeWidth: number;
  badgeHeight: number | "auto"; // "auto" = 按图片原始比例自适应高度
  circleSize?: number; // 圆形背景直径（默认 CIRCLE_SIZE）
  circleOffsetX?: number; // 圆形整体水平偏移（正值往右）
  circleOffsetY?: number; // 圆形整体垂直偏移（正值往下）
  avatarScale?: number;
  avatarOffsetX?: number;
  avatarOffsetY?: number;
  avatarRotation?: number; // 圆形头像（含 sprite）整体旋转角度
};

const SLOT_STYLES: SlotStyle[] = [
  { rotation: -34.5, offsetX: -27, offsetY: 2, badgeWidth: 100, badgeHeight: "auto" , circleSize: 90,circleOffsetX: 0, circleOffsetY: 0, avatarScale: 1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: -34.5}, // 左上
  { rotation: 0, offsetX: -27, offsetY: -14, badgeWidth: 70, badgeHeight: "auto" , circleSize: 64,circleOffsetX: 14, circleOffsetY: 0, avatarScale:  1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0},  // 右上
  { rotation: 0, offsetX: -33, offsetY: -16, badgeWidth: 80, badgeHeight: "auto" , circleSize: 70,circleOffsetX: 8, circleOffsetY: 10, avatarScale:  1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0},    // 左下
  { rotation: -20, offsetX: -32, offsetY: -4, badgeWidth: 94, badgeHeight: "auto" , circleSize: 80,circleOffsetX: 0, circleOffsetY: 0, avatarScale:  1.05, avatarOffsetX: 0, avatarOffsetY: 0, avatarRotation: 0}, // 右下
];

// 3 人时第三个人格用居中样式：无旋转、circle 与 badge 水平居中对齐
const SLOT_STYLE_CENTER: SlotStyle = {
  rotation: 0,
  offsetX: -32,
  offsetY: -10,
  badgeWidth: 80,
  badgeHeight: "auto",
  circleSize: 70,
  circleOffsetX: 10,
  circleOffsetY: -16,
  avatarScale: 1.05,
  avatarOffsetX: 0,
  avatarOffsetY: 0,
  avatarRotation: 0,
};

const FRAME_WIDTH = 360;
const FRAME_HEIGHT = 480;
const CARD_WIDTH = 294;
const CARD_HEIGHT = 393;
const CARD_OFFSET_X = (FRAME_WIDTH - CARD_WIDTH) / 2;
const CARD_OFFSET_Y = 44;
const CIRCLE_SIZE = 80;

type ShareCardProps = {
  topic: string;
  personas: PersonaId[];
  messages: RoundtableMessage[];
  mode: ChatMode;
  onClose: () => void;
};

const LABEL_PRIORITY = ["反驳", "打断", "追问", "共识"] as const;

function pickHighlightMessage(messages: RoundtableMessage[]): RoundtableMessage | null {
  const aiMessages = messages.filter((m) => m.persona !== "user");
  for (const label of LABEL_PRIORITY) {
    const hit = aiMessages.find((m) => m.label === label);
    if (hit) return hit;
  }
  return aiMessages[0] ?? null;
}

// 把"你们喜欢毛姆的《刀锋》吗？"这种问句压成"毛姆的《刀锋》"
function shortenTopic(topic: string): string {
  let s = topic.trim();
  // 去掉前缀人称
  s = s.replace(/^(你们|我们|大家|咱们)/, "");
  // 去掉前缀动词
  s = s.replace(/^(喜不喜欢|觉不觉得|想不想|要不要|是不是|有没有|喜欢|觉得|认为|相信|想|要)/, "");
  // 去掉句尾问句助词与标点
  s = s.replace(/(吗|呢|吧|啊|呀|嘛|么)?[，。？！,.?!\s]*$/g, "");
  s = s.trim();
  return s.length > 0 ? s : topic.trim();
}

function truncateText(content: string, max: number): string {
  const cleaned = content.replace(/\s+/g, "").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max) + "…";
}

function formatDate(d = new Date()): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function getSummaryMax(personaCount: number): number {
  if (personaCount >= 4) return 24;
  if (personaCount === 3) return 34;
  return 42;
}

function getSummaryMarginTop(personaCount: number): number {
  if (personaCount === 2) return 0;
  if (personaCount === 3) return 14;
  return 8;
}

function stripSummaryFiller(content: string): string {
  return content
    .replace(/^(等一下|等等|先别急|你先别急|先停一下|我先打断一下|打断一下)[，,。！？；;]*/, "")
    .replace(/^(我觉得|我认为|其实|说真的|老实说|坦白讲|最近|这件事|这个问题)[，,。！？；;]*/, "")
    .replace(/^不是[，,。！？；;]+/, "")
    .replace(/^(你|他|她|我们|他们|这种|那个)/, "")
    .trim();
}

function isWeakSummaryCandidate(content: string): boolean {
  return (
    content.length < 8 ||
    /^(等一下|等等|先别急|你先别急|先停一下|不是|嗯|啊|呃)$/.test(content)
  );
}

function scoreSummaryCandidate(content: string): number {
  let score = Math.min(content.length, 28);
  if (/(核心|关键|重点|真正|本质|问题|因为|所以|需要|在意|自由|代价|逃避|选择)/.test(content)) score += 20;
  if (/(不是|而是|与其|不如)/.test(content)) score += 12;
  return score;
}

function summarizeContent(content: string, max: number): string {
  const cleaned = content
    .replace(/\s+/g, "")
    .replace(/[“”"「」]/g, "")
    .replace(/^(我觉得|我认为|其实|说真的|老实说|坦白讲|最近|这件事|这个问题)/, "")
    .trim();

  const contrast = cleaned.match(/不是([^，。！？；;]{2,18})[，,]?而是([^。！？；;]{2,24})/);
  if (contrast) return truncateText(`重点不是${contrast[1]}，而是${contrast[2]}`, max);

  const preference = cleaned.match(/与其([^，。！？；;]{2,18})[，,]?不如([^。！？；;]{2,24})/);
  if (preference) return truncateText(`比起${preference[1]}，更在意${preference[2]}`, max);

  const focus = cleaned.match(/(?:核心|关键|重点|真正的问题)(?:是|在于)?([^。！？；;]{3,24})/);
  if (focus) return truncateText(`核心是${focus[1]}`, max);

  const candidates = cleaned
    .split(/[。！？；;]/)
    .map(stripSummaryFiller)
    .filter((candidate) => !isWeakSummaryCandidate(candidate));

  const best = candidates.sort((a, b) => scoreSummaryCandidate(b) - scoreSummaryCandidate(a))[0];
  return truncateText(best ?? stripSummaryFiller(cleaned), max);
}

function PersonaTile({
  personaId,
  slot,
}: {
  personaId: PersonaId;
  slot: SlotStyle;
}) {
  const colors = getPersonaColors(personaId);
  const src = `/sprites/${personaId}/${personaId.toLowerCase()}.png`;
  const circleSize = slot.circleSize ?? CIRCLE_SIZE;
  const circleOffsetX = slot.circleOffsetX ?? 0;
  const circleOffsetY = slot.circleOffsetY ?? 0;
  const avatarScale = slot.avatarScale ?? 1.05;
  const avatarOffsetX = slot.avatarOffsetX ?? 0;
  const avatarOffsetY = slot.avatarOffsetY ?? 0;
  const avatarRotation = slot.avatarRotation ?? 0;

  return (
    <div
      style={{
        position: "relative",
        width: circleSize + 30,
        height: circleSize + 18,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 8 + circleOffsetX,
          top: circleOffsetY,
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          background: colors.avatarBg,
          overflow: "hidden",
          transform: avatarRotation ? `rotate(${avatarRotation}deg)` : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={personaId}
          style={{
            imageRendering: "pixelated",
            width: circleSize * avatarScale,
            height: circleSize * avatarScale,
            position: "absolute",
            top: avatarOffsetY,
            left: `calc(50% + ${avatarOffsetX}px)`,
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: slot.offsetX + circleSize / 2 + circleOffsetX,
          top: circleSize - 10 + slot.offsetY + circleOffsetY,
          width: slot.badgeWidth,
          height: slot.badgeHeight,
          transform: `rotate(${slot.rotation}deg)`,
          transformOrigin: "left top",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/sprites/${personaId}/badge.png`}
          alt={personaId}
          style={{
            imageRendering: "pixelated",
            width: slot.badgeWidth,
            height: slot.badgeHeight,
            objectFit: "fill",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

export function ShareCard({ topic, personas, messages, mode, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const title =
    mode === "participant" ? "我和MBTI像素小人开大会了！！！" : "我导演了一桌MBTI像素小人！！！";

  const highlight = pickHighlightMessage(messages);
  const slots = personas.slice(0, 4);
  const summary = highlight
    ? `聊了"${shortenTopic(topic)}"，${highlight.persona}的观点：${summarizeContent(highlight.content, getSummaryMax(slots.length))}。`
    : `聊了"${shortenTopic(topic)}"。`;

  const date = formatDate();

  async function handleSave() {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      // iOS Safari 的 <a download> 不可靠（会在新标签页打开图片），必须走 Web Share；
      // Android / 桌面则直接走下载链接，不打扰用户。
      const ua = navigator.userAgent;
      const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPad iPadOS 13+

      if (isIOS && navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "perso-roundtable.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          setSaving(false);
          try {
            await navigator.share({ files: [file], title: `Perso · ${topic}` });
          } catch (err) {
            if ((err as Error).name !== "AbortError") console.error(err);
          }
          return;
        }
      }

      // Android / 桌面：直接下载到本地
      const link = document.createElement("a");
      link.download = "perso-roundtable.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSaving(false);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex h-dvh max-h-dvh flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/bg/table-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#111",
      }}
    >
      <div className="pointer-events-none absolute inset-0 " style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75), rgba(0,0,0,0.95))",
      }} />

      {/* Top bar */}
      <div
        className="relative z-10 flex h-14 shrink-0 items-center px-5"
        style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}
      >
        <button type="button" onClick={onClose} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/close-button.png"
            alt="关闭"
            style={{ width: 30, height: 30, imageRendering: "pixelated", display: "block" }}
          />
        </button>
        <p
          className="font-pixel absolute left-1/2 -translate-x-1/2 text-white"
          style={{ fontSize: 18 }}
        >
          分享卡片
        </p>
      </div>

      {/* Card area */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4">
        <div
          ref={cardRef}
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            background: "#020202",
            position: "relative",
          }}
        >
          {/* Date — sits in the outer black band, above the inner card */}
          <p
            className="font-pixel"
            style={{
              position: "absolute",
              right: CARD_OFFSET_X,
              top: CARD_OFFSET_Y / 2,
              transform: "translateY(-50%)",
              color: "#5b5cf3",
              fontSize: 26,
              letterSpacing: "0.04em",
              padding: "0.4rem 0 0 0",
            }}
          >
            {date}
          </p>

          {/* Inner gray card */}
          <div
            style={{
              position: "absolute",
              left: CARD_OFFSET_X,
              top: CARD_OFFSET_Y,
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              background: "#2a2a2a",
              borderRadius: 20,
              padding: "20px 22px 22px 22px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Title */}
            <p
              className="font-pixel"
              style={{
                color: "#5b5cf3",
                fontSize: 25,          
                letterSpacing: '0',
                lineHeight: 1.3,
                maxWidth: 220,
              }}
            >
              {title}
            </p>

            {/* Avatar layout — 按人数分支：2/3/4 各自布局 */}
            {slots.length === 2 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center",
                  marginTop: 4,
                  marginBottom: 12,
                }}
              >
                {slots.map((personaId, i) => (
                  <PersonaTile
                    key={`${personaId}-${i}`}
                    personaId={personaId}
                    slot={SLOT_STYLES[i]}
                  />
                ))}
              </div>
            ) : slots.length === 3 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 16,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                  }}
                >
                  <PersonaTile personaId={slots[0]} slot={SLOT_STYLES[0]} />
                  <PersonaTile personaId={slots[1]} slot={SLOT_STYLES[1]} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <PersonaTile personaId={slots[2]} slot={SLOT_STYLE_CENTER} />
                </div>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gridTemplateRows: "1fr 1fr",
                  gap: 4,
                  placeItems: "center",
                  marginTop: 4,
                  marginBottom: 8,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => {
                  const personaId = slots[i];
                  if (!personaId) return <div key={i} />;
                  return (
                    <PersonaTile
                      key={`${personaId}-${i}`}
                      personaId={personaId}
                      slot={SLOT_STYLES[i]}
                    />
                  );
                })}
              </div>
            )}

            {/* Summary */}
            <p
              className="font-pixel"
              style={{
                marginTop: getSummaryMarginTop(slots.length),
                color: "#5b5cf3",
                fontSize: 12,
                lineHeight: 1.45,
                letterSpacing: "0.04em",
                maxHeight: slots.length >= 4 ? 35 : 86,
                overflow: "hidden",
                overflowWrap: "break-word",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: slots.length >= 4 ? 2 : 5,
              }}
            >
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div
        className="relative z-10 flex shrink-0 justify-center"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="relative shrink-0 disabled:opacity-50"
          style={{ width: 96, height: 42 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/button.png"
            alt=""
            style={{
              width: 96,
              height: 42,
              imageRendering: "pixelated",
              display: "block",
            }}
          />
          <span
            className="font-pixel absolute inset-0 flex items-center justify-center"
            style={{ fontSize: 16, letterSpacing: "0.08em", color: "#FEFEFE" }}
          >
            {saving ? "..." : "保存"}
          </span>
        </button>
      </div>
    </div>
  );
}
