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

export const uploadVideo = async (file: File): Promise<UploadResponse> => {
  const data = new FormData();
  data.append("video", file);

  const response = await fetch(`${API_URL}/videos/upload`, {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
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
