import { CheckCircle2 } from "lucide-react";
import type { CompressionLevel } from "../services/api";

type CompressionOptionProps = {
  value: CompressionLevel;
  selected: boolean;
  title: string;
  description: string;
  estimate: string;
  details: string;
  onSelect: (level: CompressionLevel) => void;
};

export function CompressionOption({
  value,
  selected,
  title,
  description,
  estimate,
  details,
  onSelect,
}: CompressionOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`relative min-h-[172px] rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-violet-200 ${
        selected
          ? "border-violet-600 bg-violet-50 shadow-soft"
          : "border-slate-200 bg-white hover:border-violet-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-violet-700" aria-hidden="true" />}
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-950">Tamaño final estimado: ~{estimate}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{details}</p>
    </button>
  );
}

