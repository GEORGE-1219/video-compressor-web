const fs = require("fs/promises");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const { jobs, uploads } = require("../services/jobStore");
const { cleanupJob, cleanupUpload } = require("../services/fileCleanupService");
const { compressVideo, compressionProfiles, ffmpegPath, outputFormats } = require("../services/videoCompressionService");
const { formatBytes, isAllowedExtension, removeFileQuietly } = require("../utils/files");

const sendError = (response, status, message) => {
  response.status(status).json({ message });
};

const uploadVideo = async (request, response) => {
  if (!request.file) {
    return sendError(response, 400, "Debes seleccionar un video.");
  }

  const stats = await fs.stat(request.file.path);
  if (stats.size === 0) {
    await removeFileQuietly(request.file.path);
    return sendError(response, 400, "El archivo está vacío.");
  }

  if (!request.file.mimetype.startsWith("video/") || !isAllowedExtension(request.file.originalname)) {
    await removeFileQuietly(request.file.path);
    return sendError(response, 400, "Formato no permitido.");
  }

  const uploadId = uuidv4();
  const upload = {
    id: uploadId,
    originalName: path.basename(request.file.originalname),
    filePath: request.file.path,
    mimeType: request.file.mimetype,
    size: stats.size,
    createdAt: Date.now(),
  };

  uploads.set(uploadId, upload);

  return response.status(201).json({
    uploadId,
    fileName: upload.originalName,
    mimeType: upload.mimeType,
    size: upload.size,
    readableSize: formatBytes(upload.size),
  });
};

const startCompression = async (request, response) => {
  const { uploadId, level, outputFormat } = request.body;

  if (!uploads.has(uploadId)) {
    return sendError(response, 404, "No se encontró el video cargado.");
  }

  if (!compressionProfiles[level]) {
    return sendError(response, 400, "Selecciona un nivel de compresión válido.");
  }

  if (!outputFormats.has(outputFormat)) {
    return sendError(response, 400, "Selecciona un formato de salida válido.");
  }

  const upload = uploads.get(uploadId);
  const exists = await fs.stat(upload.filePath).catch(() => null);
  if (!exists) {
    uploads.delete(uploadId);
    return sendError(response, 410, "El video cargado ya no está disponible.");
  }

  const jobId = uuidv4();
  const baseName = path.parse(upload.originalName).name.replace(/[^\w.-]+/g, "-").slice(0, 80) || "video";
  const outputPath = path.join(config.compressedDir, `${jobId}.${outputFormat}`);
  const downloadName = `${baseName}-comprimido.${outputFormat}`;

  const job = {
    id: jobId,
    uploadId,
    status: "processing",
    progress: 0,
    outputPath,
    outputFormat,
    downloadName,
    level,
    originalSize: upload.size,
    compressedSize: null,
    error: null,
    createdAt: Date.now(),
    completedAt: null,
  };

  jobs.set(jobId, job);

  compressVideo({
    inputPath: upload.filePath,
    outputPath,
    level,
    outputFormat,
    onProgress: (progress) => {
      job.progress = progress;
    },
  })
    .then((result) => {
      job.status = "completed";
      job.progress = 100;
      job.compressedSize = result.size;
      job.completedAt = Date.now();
      cleanupUpload(uploadId);
    })
    .catch(async (error) => {
      job.status = "failed";
      job.error = error.message.includes("optimizado")
        ? error.message
        : "Ocurrió un error durante la compresión.";
      job.debugMessage = error.message;
      console.error("Video compression failed:", {
        jobId,
        level,
        outputFormat,
        ffmpegPath,
        error: error.message,
      });
      await removeFileQuietly(outputPath);
      await cleanupUpload(uploadId);
    });

  return response.status(202).json({ jobId });
};

const streamProgress = (request, response) => {
  const { jobId } = request.params;
  const job = jobs.get(jobId);

  if (!job) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ message: "No se encontró el proceso de compresión." }));
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = () => {
    const current = jobs.get(jobId);
    if (!current) {
      response.write(`event: error\ndata: ${JSON.stringify({ message: "El proceso ya no está disponible." })}\n\n`);
      response.end();
      return;
    }

    response.write(`data: ${JSON.stringify({
      jobId,
      status: current.status,
      progress: current.progress,
      compressedSize: current.compressedSize,
      originalSize: current.originalSize,
      reductionPercent: current.compressedSize
        ? Math.max(0, Math.round((1 - current.compressedSize / current.originalSize) * 100))
        : null,
      message: current.status === "completed" ? "Video comprimido correctamente." : current.error,
    })}\n\n`);

    if (current.status === "completed" || current.status === "failed") {
      response.end();
    }
  };

  send();
  const interval = setInterval(send, 1000);

  request.on("close", () => {
    clearInterval(interval);
  });
};

const downloadCompressedVideo = (request, response) => {
  const { jobId } = request.params;
  const job = jobs.get(jobId);

  if (!job || job.status !== "completed") {
    return sendError(response, 404, "El video comprimido no está disponible.");
  }

  response.download(job.outputPath, job.downloadName, async (error) => {
    if (error) {
      console.error("Download error:", error.message);
      return;
    }
    await cleanupJob(jobId);
  });
};

module.exports = {
  downloadCompressedVideo,
  startCompression,
  streamProgress,
  uploadVideo,
};
