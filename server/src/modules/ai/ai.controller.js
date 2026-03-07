import asyncHandler from "../../core/utils/asyncHandler.js";
import { aiService } from "./ai.service.js";

export const getSummary = asyncHandler(async (req, res) => {
    const jobData = req.body;

    // Simple validation
    if (!jobData || !jobData._id) {
        return res.status(400).json({
            status: "error",
            message: "Missing job data for summary generation."
        });
    }

    const summaryText = await aiService.generateJobSummary(jobData);

    res.status(200).json({
        status: "success",
        data: {
            summary: summaryText
        }
    });
});
