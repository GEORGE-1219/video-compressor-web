const express = require("express");
const multer = require("multer");
const upload = require("../middlewares/uploadMiddleware");
const {
  downloadCompressedVideo,
  startCompression,
  streamProgress,
  uploadVideo,
} = require("../controllers/videoController");

const router = express.Router();

const handleMulterError = (handler) => (request, response, next) => {
  handler(request, response, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return response.status(413).json({ message: "El archivo supera el tamaño máximo permitido." });
    }

    return response.status(400).json({ message: error.message || "No se pudo cargar el archivo." });
  });
};

router.post("/upload", handleMulterError(upload.single("video")), uploadVideo);
router.post("/compress", startCompression);
router.get("/progress/:jobId", streamProgress);
router.get("/download/:jobId", downloadCompressedVideo);

module.exports = router;

