import express from "express";
import multer from "multer";
import VisionController from "./vision.controller.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/extract", upload.single("image"), VisionController.extract);

export default router;
