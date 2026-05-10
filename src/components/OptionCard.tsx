"use client";

interface OptionCardProps {
  label: string;
  score: number;
  selected: boolean;
  onSelect: () => void;
  index: number;
}

const LETTER = ["ก", "ข", "ค", "ง"];

export default function OptionCard({ label, selected, onSelect, index }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl px-6 py-5 transition-all duration-150 flex items-center gap-5 cursor-pointer
        ${
          selected
            ? "bg-blue-600 border-4 border-blue-800 text-white shadow-lg"
            : "bg-white border-4 border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-blue-50"
        }`}
      style={{ minHeight: "88px" }}
      aria-pressed={selected}
    >
      <span
        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2
          ${selected ? "bg-white text-blue-700 border-blue-700" : "bg-gray-100 text-gray-600 border-gray-300"}`}
      >
        {LETTER[index] ?? index + 1}
      </span>
      <span className="text-xl leading-relaxed font-medium">{label}</span>
      {selected && (
        <span className="ml-auto flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}
