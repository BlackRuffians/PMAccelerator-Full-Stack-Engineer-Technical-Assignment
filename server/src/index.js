import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./db.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/weather", weatherRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/media", mediaRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Weather API listening on http://localhost:${PORT}`);
});
