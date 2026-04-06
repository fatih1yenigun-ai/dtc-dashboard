"use client";

interface SegmentedButtonProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}

export default function SegmentedButton({ options, value, onChange, size = "md" }: SegmentedButtonProps) {
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div className="inline-flex bg-bg-main rounded-lg p-1 border border-border-subtle">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`${pad} rounded-md font-medium transition-all ${
            value === opt.value
              ? "bg-bg-card shadow-sm text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
