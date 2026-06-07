"use client";

import { useEffect, useRef } from "react";

const LINE_HEIGHT = 20;
const MAX_ROWS = 4;
const MAX_TEXTAREA_HEIGHT = LINE_HEIGHT * MAX_ROWS;
// UserInput 段（72pt: pt-2 + pill 44 + pb-5）+ footer 行（52pt: py-3 + 28pt 按钮）+ safe-area 余量 ≈ 160pt
export const USER_INPUT_AREA_HEIGHT = 160;
const INPUT_HEIGHT = 44;
const INPUT_SECTION_CLASS = "relative shrink-0 px-6 pb-5 pt-2";

type UserInputProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function UserInput({ value, disabled, onChange, onSubmit }: UserInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !disabled && value.trim()) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <section className={INPUT_SECTION_CLASS}>
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col">
        <div
          className="flex items-center gap-2 rounded-3xl px-4 py-2"
          style={{
            background: "linear-gradient(to right, #515050, #202020)",
            minHeight: INPUT_HEIGHT,
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            className="min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-neutral-100 outline-none placeholder-neutral-500 disabled:opacity-50"
            disabled={disabled}
            maxLength={1000}
            placeholder="说点什么…"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            style={{ fontSize: 16, lineHeight: `${LINE_HEIGHT}px`, maxHeight: MAX_TEXTAREA_HEIGHT }}
          />
          <button
            type="button"
            disabled={disabled || !value.trim()}
            onClick={onSubmit}
            className="ml-3 flex shrink-0 items-center justify-center disabled:opacity-40"
            style={{ width: 30, height: 30 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/send-icon.png"
              alt="发送"
              style={{ width: 24, height: 24, display: "block" }}
            />
          </button>
        </div>
      </div>
    </section>
  );
}

export function UserInputPlaceholder() {
  return (
    <section className={INPUT_SECTION_CLASS} style={{ visibility: "hidden" }}>
      <div className="mx-auto max-w-4xl" style={{ height: INPUT_HEIGHT }} />
    </section>
  );
}
