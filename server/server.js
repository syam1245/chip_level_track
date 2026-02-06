// import express from 'express';
// import dotenv from 'dotenv';
// import connectDB from './config/db.js';
// import cors from 'cors';
// import itemsRouter from './routes/items.js';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Test route
// app.get('/', (req, res) => {
//   res.send('✅ Chip Level Track API is running successfully.');
// });

// // API routes
// app.use('/api/items', itemsRouter);

// // Serve static React build (AFTER routes)
// app.use(express.static(path.join(__dirname, '../client/build')));
// app.use((req, res) => {
//   res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
// });

// // Connect DB then start server 
// connectDB().then(() => {
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// });



import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import itemsRouter from "./routes/items.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =======================
   Middleware
======================= */
app.use(cors());
app.use(express.json());

/* =======================
   API Routes
======================= */
app.use("/api/items", itemsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

/* =======================
   Serve React (Production)
======================= */
const clientBuildPath = path.join(__dirname, "../client/build");

// Serve static assets
app.use(express.static(clientBuildPath));

// SPA fallback — Express 5 SAFE
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

/* =======================
   Start Server
======================= */
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  });
