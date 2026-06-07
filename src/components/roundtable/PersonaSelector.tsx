"use client";

import type { PersonaId } from "@/types";
import type { PersonaPrompt } from "@/lib/prompts/personas";

type PersonaSelectorProps = {
  options: PersonaPrompt[];
  selected: PersonaId[];
  onChange: (personas: PersonaId[]) => void;
  onOverflow: () => void;
};

export function PersonaSelector({ options, selected, onChange, onOverflow }: PersonaSelectorProps) {
  function toggle(id: PersonaId) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }

    if (selected.length >= 4) {
      onOverflow();
      return;
    }

    onChange([...selected, id]);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {options.map((persona) => {
        const isSelected = selected.includes(persona.id);
        return (
          <button
            className={`flex min-h-28 flex-col justify-between rounded border p-3 text-left transition ${
              isSelected
                ? "border-white bg-white text-black"
                : "border-neutral-800 bg-neutral-950 text-neutral-100 hover:border-neutral-500"
            }`}
            key={persona.id}
            type="button"
            onClick={() => toggle(persona.id)}
          >
            <span className="font-mono text-lg font-semibold">{persona.id}</span>
            <span className={`mt-3 line-clamp-3 text-xs leading-5 ${isSelected ? "text-neutral-700" : "text-neutral-400"}`}>
              {persona.tagline}
            </span>
          </button>
        );
      })}
    </div>
  );
}
