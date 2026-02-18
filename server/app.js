import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import itemsRouter from "./routes/items.js";
import authRouter from "./routes/auth.js";
import { applySecurity } from "./appSecurity.js";
import { attachAuth, requireAuth, requireCsrf } from "./middleware/auth.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

applySecurity(app);
app.use(attachAuth);

app.use("/api/auth", authRouter);
app.use("/api/items", requireAuth, requireCsrf, itemsRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const clientBuildPath = path.join(__dirname, "../client/build");
app.use(express.static(clientBuildPath));
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

export default app;
