/* =========================================================
   appSecurity.js
   Express 5 Security Optimization Stack
========================================================= */

import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";

function deepSanitize(obj) {
  if (!obj || typeof obj !== "object" || obj === null) return;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".") || key === "__proto__") {
      delete obj[key];
      continue;
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      deepSanitize(obj[key]);
    }
  }
}

export const applySecurity = (app) => {
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 200,               
    standardHeaders: 'draft-7', 
    legacyHeaders: false,
    message: { success: false, message: "Too many requests." },
  });
  
  app.use("/api/", limiter);

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(compression({ level: 6, threshold: 1024 }));

  const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS Policy Violation"));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: "10kb", strict: true }));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));

  app.use((req, res, next) => {
    if (req.body) deepSanitize(req.body);
    if (req.params) deepSanitize(req.params);
    if (req.query) deepSanitize(req.query);
    next();
  });

  app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    if (statusCode === 500) console.error("🔥 Server Error:", err);
    res.status(statusCode).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Internal error" : err.message,
    });
  });
};