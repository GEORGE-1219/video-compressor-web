const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveFromBackend = (value, fallback) => {
  const target = value || fallback;
  return path.isAbsolute(target) ? target : path.resolve(rootDir, target);
};

const config = {
  port: toNumber(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 1000),
  uploadDir: resolveFromBackend(process.env.UPLOAD_DIR, "src/uploads"),
  compressedDir: resolveFromBackend(process.env.COMPRESSED_DIR, "src/compressed"),
  fileTtlMinutes: toNumber(process.env.FILE_TTL_MINUTES, 60),
  rateLimitWindowMinutes: toNumber(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
  rateLimitMax: toNumber(process.env.RATE_LIMIT_MAX, 60),
  ffmpegPath: process.env.FFMPEG_PATH,
  ffprobePath: process.env.FFPROBE_PATH,
};

config.maxFileSizeBytes = config.maxFileSizeMb * 1024 * 1024;
config.fileTtlMs = config.fileTtlMinutes * 60 * 1000;

module.exports = config;

