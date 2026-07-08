require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const videoRoutes = require("./routes/videoRoutes");
const { ensureDirectories } = require("./utils/files");
const { runCleanup, startCleanupInterval } = require("./services/fileCleanupService");

const app = express();
const frontendDistCandidates = [
  config.frontendDistDir,
  path.resolve(__dirname, "../../frontend/dist"),
  path.resolve(process.cwd(), "frontend/dist"),
];
const frontendDistPath =
  frontendDistCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) ||
  config.frontendDistDir;
const frontendIndexPath = path.join(frontendDistPath, "index.html");

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

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api/")) {
      return next();
    }
    return response.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", (_request, response) => {
    response
      .status(503)
      .send(`Frontend build not found. Checked: ${frontendDistCandidates.join(", ")}.`);
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Ocurrió un error inesperado." });
});

ensureDirectories(config.uploadDir, config.compressedDir)
  .then(runCleanup)
  .then(() => {
    startCleanupInterval();
    app.listen(config.port, config.host, () => {
      console.log(`Video compressor app running on http://${config.host}:${config.port}`);
      console.log(`Frontend dist path: ${frontendDistPath}`);
    });
  })
  .catch((error) => {
    console.error("Could not start server:", error);
    process.exit(1);
  });
