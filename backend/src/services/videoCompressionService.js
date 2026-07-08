const fs = require("fs/promises");
const fsSync = require("fs");
const { execFile } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const config = require("../config");

const resolveBundledBinary = (packageName) => {
  try {
    const bundled = require(packageName);
    return typeof bundled === "string" ? bundled : bundled?.path;
  } catch {
    return null;
  }
};

const ffmpegPath = config.ffmpegPath || resolveBundledBinary("ffmpeg-static");
const ffprobePath = config.ffprobePath || resolveBundledBinary("ffprobe-static");

const ensureExecutable = (binaryPath) => {
  if (!binaryPath || process.platform === "win32") return;
  try {
    fsSync.chmodSync(binaryPath, 0o755);
  } catch (error) {
    console.warn(`Could not set executable permission for ${binaryPath}:`, error.message);
  }
};

ensureExecutable(ffmpegPath);
ensureExecutable(ffprobePath);

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

const compressionProfiles = {
  high: {
    crf: 32,
    preset: "medium",
    audioBitrate: "96k",
    scaleTo720p: true,
  },
  medium: {
    crf: 28,
    preset: "medium",
    audioBitrate: "128k",
    scaleTo720p: false,
  },
  low: {
    crf: 23,
    preset: "slow",
    audioBitrate: "192k",
    scaleTo720p: false,
  },
};

const outputFormats = new Set(["mp4", "webm"]);

const checkFfmpeg = () =>
  new Promise((resolve) => {
    if (!ffmpegPath) {
      resolve({
        ok: false,
        message: "FFmpeg binary was not found.",
      });
      return;
    }

    execFile(ffmpegPath, ["-version"], { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          ok: false,
          message: error.message,
          stderr: stderr?.slice(0, 500) || null,
        });
        return;
      }

      resolve({
        ok: true,
        version: stdout.split("\n")[0],
      });
    });
  });

const compressVideo = ({ inputPath, outputPath, level, outputFormat, onProgress }) => {
  const profile = compressionProfiles[level];
  if (!profile) {
    throw new Error("Nivel de compresión no válido.");
  }

  if (!outputFormats.has(outputFormat)) {
    throw new Error("Formato de salida no válido.");
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath).output(outputPath);

    if (outputFormat === "mp4") {
      command
        .videoCodec("libx264")
        .audioCodec("aac")
        .audioBitrate(profile.audioBitrate)
        .outputOptions(["-crf", String(profile.crf), "-preset", profile.preset, "-movflags", "+faststart"])
        .format("mp4");
    }

    if (outputFormat === "webm") {
      command
        .videoCodec("libvpx-vp9")
        .audioCodec("libopus")
        .audioBitrate(profile.audioBitrate)
        .outputOptions(["-crf", String(profile.crf), "-b:v", "0"])
        .format("webm");
    }

    if (profile.scaleTo720p) {
      command.videoFilters("scale='min(1280,iw)':-2");
    }

    command
      .on("start", () => onProgress?.(1))
      .on("progress", (progress) => {
        if (typeof progress.percent === "number") {
          onProgress?.(Math.max(1, Math.min(99, Math.round(progress.percent))));
        }
      })
      .on("end", async () => {
        const stats = await fs.stat(outputPath);
        onProgress?.(100);
        resolve({
          outputPath,
          size: stats.size,
        });
      })
      .on("error", (error) => {
        reject(new Error(error.message || "Ocurrió un error durante la compresión."));
      })
      .run();
  });
};

module.exports = {
  checkFfmpeg,
  compressionProfiles,
  compressVideo,
  ffmpegPath,
  ffprobePath,
  outputFormats,
};
