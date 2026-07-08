require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const videoRoutes = require("./routes/videoRoutes");
const { ensureDirectories } = require("./utils/files");
const { runCleanup, startCleanupInterval } = require("./services/fileCleanupService");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMinutes * 60 * 1000,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiadas solicitudes. Intenta nuevamente más tarde." },
  }),
);

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/videos", videoRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Ocurrió un error inesperado." });
});

ensureDirectories(config.uploadDir, config.compressedDir)
  .then(runCleanup)
  .then(() => {
    startCleanupInterval();
    app.listen(config.port, () => {
      console.log(`Video compressor API running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error("Could not start server:", error);
    process.exit(1);
  });

