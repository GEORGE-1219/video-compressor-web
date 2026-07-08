const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const source = path.join(projectRoot, "frontend", "dist");
const target = path.join(projectRoot, "backend", "public");

if (!fs.existsSync(path.join(source, "index.html"))) {
  throw new Error(`Frontend build not found at ${source}`);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });

console.log(`Copied frontend build to ${target}`);

