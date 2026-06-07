"use client";

const MAX_LENGTH = 120;

type TopicInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TopicInput({ value, onChange }: TopicInputProps) {
  const remaining = MAX_LENGTH - value.length;
  const nearLimit = remaining <= 20;

  return (
    <label className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-300">自由输入</span>
        {nearLimit && (
          <span className={`font-mono text-xs ${remaining <= 5 ? "text-red-400" : "text-neutral-500"}`}>
            {remaining}
          </span>
        )}
      </div>
      <textarea
        className="min-h-24 resize-none rounded border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm leading-6 text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-500"
        maxLength={MAX_LENGTH}
        placeholder="输入任何话题……"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
