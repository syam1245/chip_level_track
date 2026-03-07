import express from "express";
import multer from "multer";
import * as aiController from "./ai.controller.js";
import VisionController from "./vision.controller.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Summary & Insights
router.post("/summary", aiController.getSummary);
router.post("/insights", aiController.getInsights);

// Vision extraction
router.post("/vision/extract", upload.single("image"), VisionController.extract);

// WhatsApp message generation
router.post("/message/generate", aiController.generateWhatsApp);

export default router;