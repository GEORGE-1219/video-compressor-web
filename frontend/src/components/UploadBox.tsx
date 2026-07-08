import { useRef, useState } from "react";
import { Bolt, LockKeyhole, MousePointerClick, Plus, UploadCloud } from "lucide-react";
import { MAX_FILE_SIZE_MB, validateVideoFile } from "../utils";

type UploadBoxProps = {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  onFileSelected: (file: File) => void;
  onValidationError: (message: string) => void;
};

export function UploadBox({ isUploading, uploadProgress, error, onFileSelected, onValidationError }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;
    const validationError = validateVideoFile(file);
    if (validationError) {
      onValidationError(validationError);
      return;
    }
    onFileSelected(file);
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
          Comprime videos en línea
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Reduce el tamaño del archivo de video sin perder calidad. Descarga como MP4 o WebM.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isUploading) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (!isUploading && (event.key === "Enter" || event.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (isUploading) return;
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          if (isUploading) return;
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        className={`mt-10 flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center shadow-soft transition sm:p-10 ${
          isDragging ? "border-fuchsia-200 bg-violet-700" : "border-violet-200 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.m4v,.mkv,.avi,.mov,.mp4,.webm"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-violet-700 shadow-lg">
          {isUploading ? <UploadCloud className="h-9 w-9 animate-pulse" /> : <Plus className="h-10 w-10" />}
        </div>
        <p className="mt-6 text-2xl font-black text-white">
          {isUploading ? "Subiendo video..." : "Carga o arrastra y suelta tu archivo"}
        </p>
        <p className="mt-3 text-sm font-medium text-violet-50">
          {isUploading ? "Mantén esta ventana abierta" : `El archivo puede pesar hasta ${MAX_FILE_SIZE_MB} MB`}
        </p>
        {isUploading && (
          <div className="mt-6 w-full max-w-md rounded-lg bg-white/20 p-3">
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>Cargando archivo</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(uploadProgress, 100))}%` }}
              />
            </div>
          </div>
        )}
        {error && <p className="mt-5 rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-rose-700">{error}</p>}
      </div>

      <div className="mt-8 grid gap-4 text-center sm:grid-cols-3">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
          <LockKeyhole className="h-5 w-5 text-violet-700" aria-hidden="true" />
          Centrada en la privacidad
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
          <MousePointerClick className="h-5 w-5 text-sky-600" aria-hidden="true" />
          Fácil de usar
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
          <Bolt className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Rápida como un rayo
        </div>
      </div>
    </section>
  );
}
