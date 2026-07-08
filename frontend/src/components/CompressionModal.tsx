import { FileVideo2, X } from "lucide-react";
import { useState } from "react";
import {
  getDownloadUrl,
  startCompression,
  subscribeToProgress,
  type CompressionLevel,
  type OutputFormat,
  type ProgressEventPayload,
  type UploadResponse,
} from "../services/api";
import { estimateSize, formatBytes } from "../utils";
import { CompressionOption } from "./CompressionOption";
import { DownloadResult } from "./DownloadResult";
import { ProgressBar } from "./ProgressBar";

type CompressionModalProps = {
  upload: UploadResponse;
  onClose: () => void;
  onReset: () => void;
};

const options = [
  {
    value: "high",
    title: "Alto",
    description: "Menor tamaño, calidad estándar",
    ratio: 0.1,
    details: "Mayor reducción, CRF 32, máximo sugerido 720p. Ideal para WhatsApp, correo o redes sociales.",
  },
  {
    value: "medium",
    title: "Medio",
    description: "Tamaño medio, mejor calidad",
    ratio: 0.22,
    details: "Balance entre tamaño y calidad, CRF 28 y resolución original cuando es viable. Ideal para uso general.",
  },
  {
    value: "low",
    title: "Bajo",
    description: "Mayor tamaño, máxima calidad",
    ratio: 0.35,
    details: "Menor compresión, CRF 23 y preset lento. Ideal para conservar buena calidad visual.",
  },
] satisfies Array<{
  value: CompressionLevel;
  title: string;
  description: string;
  ratio: number;
  details: string;
}>;

export function CompressionModal({ upload, onClose, onReset }: CompressionModalProps) {
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp4");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<ProgressEventPayload | null>(null);

  const compress = async () => {
    setStatus("processing");
    setMessage(null);
    setProgress(1);

    try {
      const { jobId: createdJobId } = await startCompression(upload.uploadId, level, outputFormat);
      setJobId(createdJobId);
      subscribeToProgress(
        createdJobId,
        (payload) => {
          setProgress(payload.progress);
          setMessage(payload.message);
          if (payload.status === "completed") {
            setStatus("completed");
            setResult(payload);
          }
          if (payload.status === "failed") {
            setStatus("failed");
            setResult(payload);
          }
        },
        () => {
          setStatus((current) => (current === "completed" ? current : "failed"));
          setMessage("Ocurrió un error durante la compresión.");
        },
      );
    } catch (caught) {
      setStatus("failed");
      setMessage((caught as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-soft">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-xl font-black text-slate-950">Comprimir video</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Cerrar"
            disabled={status === "processing"}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <FileVideo2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-950">{upload.fileName}</p>
              <p className="mt-1 text-sm text-slate-600">Tamaño original: {formatBytes(upload.size)}</p>
            </div>
            <div className="h-px bg-slate-200 sm:h-12 sm:w-px" />
            <div className="flex rounded-lg bg-white p-1 shadow-sm">
              {(["mp4", "webm"] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setOutputFormat(format)}
                  disabled={status === "processing"}
                  className={`h-10 min-w-20 rounded-md px-4 text-sm font-bold uppercase transition ${
                    outputFormat === format ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold text-slate-950">Selecciona el nivel de compresión:</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {options.map((option) => (
                <CompressionOption
                  key={option.value}
                  value={option.value}
                  title={option.title}
                  description={option.description}
                  details={option.details}
                  estimate={estimateSize(upload.size, option.ratio)}
                  selected={level === option.value}
                  onSelect={setLevel}
                />
              ))}
            </div>
          </div>

          {status === "processing" && (
            <div className="mt-6">
              <ProgressBar value={progress} />
            </div>
          )}

          {status === "failed" && message && (
            <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-700">
              {message}
            </p>
          )}

          {status === "completed" && jobId && result?.compressedSize && (
            <div className="mt-6">
              <DownloadResult
                downloadUrl={getDownloadUrl(jobId)}
                originalSize={upload.size}
                compressedSize={result.compressedSize}
                reductionPercent={result.reductionPercent ?? 0}
                onReset={onReset}
              />
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={compress}
              disabled={status === "processing" || status === "completed"}
              className="inline-flex min-h-12 min-w-44 items-center justify-center rounded-lg bg-violet-700 px-6 py-3 text-sm font-black text-white shadow-soft transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {status === "processing" ? "Comprimiendo..." : "Comprimir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
