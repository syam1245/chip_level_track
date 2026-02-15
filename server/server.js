/* =========================================================
   server.js
   Refined Production Express 5 Server
========================================================= */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import itemsRouter from "./routes/items.js";
import { applySecurity } from "./appSecurity.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================================
   ESM Path Resolution
========================================================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   Security & Global Middleware
========================================================= */
applySecurity(app);

/* =========================================================
   API Routes
========================================================= */
app.use("/api/items", itemsRouter);

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

/* =========================================================
   Static Assets & SPA Fallback
========================================================= */
// Note: If using Vite, your folder is likely 'dist', not 'build'
const clientBuildPath = path.join(__dirname, "../client/dist"); 

app.use(express.static(clientBuildPath));

// FIX: Using a direct Regex object to bypass path-to-regexp string parsing errors
// This matches any route that does NOT start with /api
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

/* =========================================================
   Lifecycle Management (Startup & Shutdown)
========================================================= */
let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Production Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Critical DB Error:", err);
    process.exit(1);
  });

process.on("SIGTERM", () => {
  console.info("SIGTERM received. Closing HTTP server...");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  }
});