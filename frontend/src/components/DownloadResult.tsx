import { Download, RotateCcw } from "lucide-react";
import { formatBytes } from "../utils";

type DownloadResultProps = {
  downloadUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  onReset: () => void;
};

export function DownloadResult({
  downloadUrl,
  originalSize,
  compressedSize,
  reductionPercent,
  onReset,
}: DownloadResultProps) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-center text-sm font-bold text-emerald-800">Video comprimido correctamente.</p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div>
          <p className="text-xs text-slate-500">Original</p>
          <p className="font-bold text-slate-950">{formatBytes(originalSize)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Final</p>
          <p className="font-bold text-slate-950">{formatBytes(compressedSize)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Reducción</p>
          <p className="font-bold text-slate-950">{reductionPercent}%</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={downloadUrl}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Descargar
        </a>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Nuevo video
        </button>
      </div>
    </div>
  );
}

