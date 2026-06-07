"use client";

type TopicCardProps = {
  topic: string;
  selected: boolean;
  onSelect: (topic: string) => void;
};

export function TopicCard({ topic, selected, onSelect }: TopicCardProps) {
  return (
    <button
      className={`h-16 min-w-44 rounded border px-3 text-left text-sm leading-5 transition ${
        selected
          ? "border-white bg-white text-black"
          : "border-neutral-800 bg-neutral-950 text-neutral-200 hover:border-neutral-500"
      }`}
      type="button"
      onClick={() => onSelect(topic)}
    >
      {topic}
    </button>
  );
}
