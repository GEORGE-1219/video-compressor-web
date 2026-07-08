const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const { isAllowedExtension } = require("../utils/files");

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, config.uploadDir);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${uuidv4()}${extension}`);
  },
});

const fileFilter = (_request, file, callback) => {
  if (!file || !file.originalname || !file.mimetype) {
    return callback(new Error("El archivo no es válido."));
  }

  const isVideo = file.mimetype.startsWith("video/");
  if (!isVideo || !isAllowedExtension(file.originalname)) {
    return callback(new Error("Formato no permitido."));
  }

  return callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1,
  },
});

module.exports = upload;

