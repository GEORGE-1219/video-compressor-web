export type UploadResponse = {
  uploadId: string;
  fileName: string;
  mimeType: string;
  size: number;
  readableSize: string;
};

export type CompressionLevel = "high" | "medium" | "low";
export type OutputFormat = "mp4" | "webm";

export type ProgressEventPayload = {
  jobId: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  originalSize: number;
  compressedSize: number | null;
  reductionPercent: number | null;
  message: string | null;
};

const API_URL = import.meta.env.VITE_API_URL || "/api";

const readError = async (response: Response) => {
  const body = await response.json().catch(() => null);
  return body?.message || "Ocurrió un error inesperado.";
};

export const uploadVideo = async (
  file: File,
  onProgress?: (progress: number) => void,
): Promise<UploadResponse> => {
  const data = new FormData();
  data.append("video", file);

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_URL}/videos/upload`);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress?.(Math.max(1, Math.min(progress, 99)));
    };

    request.onload = () => {
      const body = JSON.parse(request.responseText || "{}");
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve(body as UploadResponse);
        return;
      }
      reject(new Error(body?.message || "Ocurrió un error durante la carga."));
    };

    request.onerror = () => {
      reject(new Error("No se pudo subir el video. Revisa tu conexión e intenta nuevamente."));
    };

    request.onabort = () => {
      reject(new Error("La carga del video fue cancelada."));
    };

    request.send(data);
  });
};

export const startCompression = async (
  uploadId: string,
  level: CompressionLevel,
  outputFormat: OutputFormat,
): Promise<{ jobId: string }> => {
  const response = await fetch(`${API_URL}/videos/compress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadId, level, outputFormat }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
};

export const subscribeToProgress = (
  jobId: string,
  onMessage: (payload: ProgressEventPayload) => void,
  onError: () => void,
) => {
  const source = new EventSource(`${API_URL}/videos/progress/${jobId}`);

  source.onmessage = (event) => {
    const payload = JSON.parse(event.data) as ProgressEventPayload;
    onMessage(payload);
    if (payload.status === "completed" || payload.status === "failed") {
      source.close();
    }
  };

  source.onerror = () => {
    source.close();
    onError();
  };

  return () => source.close();
};

export const getDownloadUrl = (jobId: string) => `${API_URL}/videos/download/${jobId}`;
