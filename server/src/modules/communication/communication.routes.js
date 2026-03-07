import express from "express";
import { generateWhatsApp } from "./communication.controller.js";

const router = express.Router();

// Route to generate an AI WhatsApp message
router.post("/generate-whatsapp", generateWhatsApp);

export default router;
