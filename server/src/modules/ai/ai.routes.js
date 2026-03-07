import express from "express";
import * as aiController from "./ai.controller.js";

const router = express.Router();

router.post("/summary", aiController.getSummary);

export default router;
