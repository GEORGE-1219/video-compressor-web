const fs = require("fs/promises");
const path = require("path");
const config = require("../config");
const { jobs, uploads } = require("./jobStore");
const { removeFileQuietly } = require("../utils/files");

const isExpired = (createdAt) => Date.now() - createdAt > config.fileTtlMs;

const cleanupUpload = async (uploadId) => {
  const upload = uploads.get(uploadId);
  if (!upload) return;
  await removeFileQuietly(upload.filePath);
  uploads.delete(uploadId);
};

const cleanupJob = async (jobId) => {
  const job = jobs.get(jobId);
  if (!job) return;
  await removeFileQuietly(job.outputPath);
  jobs.delete(jobId);
  if (job.uploadId) {
    await cleanupUpload(job.uploadId);
  }
};

const cleanupDirectory = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
      .map(async (entry) => {
        const filePath = path.join(directory, entry.name);
        const stats = await fs.stat(filePath).catch(() => null);
        if (stats && isExpired(stats.mtimeMs)) {
          await removeFileQuietly(filePath);
        }
      }),
  );
};

const runCleanup = async () => {
  const expiredUploads = [...uploads.values()].filter((upload) => isExpired(upload.createdAt));
  const expiredJobs = [...jobs.values()].filter((job) => isExpired(job.createdAt));

  await Promise.all(expiredJobs.map((job) => cleanupJob(job.id)));
  await Promise.all(expiredUploads.map((upload) => cleanupUpload(upload.id)));
  await Promise.all([cleanupDirectory(config.uploadDir), cleanupDirectory(config.compressedDir)]);
};

const startCleanupInterval = () => {
  const intervalMs = Math.min(config.fileTtlMs, 15 * 60 * 1000);
  setInterval(runCleanup, intervalMs).unref();
};

module.exports = {
  cleanupJob,
  cleanupUpload,
  runCleanup,
  startCleanupInterval,
};

