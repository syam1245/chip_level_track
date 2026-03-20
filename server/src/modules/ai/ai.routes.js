import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import * as aiController from "./ai.controller.js";
import VisionController from "./vision.controller.js";

const router = express.Router();

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many AI requests. Please wait a moment." },
});

router.use(aiLimiter);

const visionLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 3,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many vision requests. Please wait." },
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Summary & Insights
router.post("/summary", aiController.getSummary);
router.post("/insights", aiController.getInsights);

// Vision extraction
router.post("/vision/extract", visionLimiter, upload.single("image"), VisionController.extract);

// WhatsApp message generation
router.post("/message/generate", aiController.generateWhatsApp);

export default router;