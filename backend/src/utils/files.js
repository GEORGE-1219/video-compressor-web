const fs = require("fs/promises");
const path = require("path");

const allowedExtensions = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"]);

const ensureDirectories = async (...directories) => {
  await Promise.all(directories.map((directory) => fs.mkdir(directory, { recursive: true })));
};

const removeFileQuietly = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not remove file ${filePath}:`, error.message);
    }
  }
};

const isAllowedExtension = (fileName) => allowedExtensions.has(path.extname(fileName).toLowerCase());

const formatBytes = (bytes) => {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

module.exports = {
  allowedExtensions,
  ensureDirectories,
  formatBytes,
  isAllowedExtension,
  removeFileQuietly,
};

