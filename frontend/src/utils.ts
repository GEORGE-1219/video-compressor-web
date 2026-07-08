export const MAX_FILE_SIZE_MB = 1000;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"];

export const formatBytes = (bytes: number) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

export const validateVideoFile = (file: File) => {
  const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

  if (!file.type.startsWith("video/")) {
    return "Formato no permitido.";
  }

  if (!allowedExtensions.includes(extension)) {
    return "Formato no permitido.";
  }

  if (file.size === 0) {
    return "El archivo está vacío.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "El archivo supera el tamaño máximo permitido.";
  }

  return null;
};

export const estimateSize = (bytes: number, ratio: number) => formatBytes(bytes * ratio);

