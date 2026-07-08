type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <p className="text-center text-sm font-semibold text-slate-700">{Math.round(value)}%</p>
    </div>
  );
}

