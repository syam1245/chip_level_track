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

    const { forceRefresh } = req.body;

    const summaryText = await aiService.generateJobSummary(jobData, forceRefresh === true);

    res.status(200).json({
        status: "success",
        data: {
            summary: summaryText
        }
    });
});

export const getInsights = asyncHandler(async (req, res) => {
    const statsData = req.body;

    if (!statsData) {
        return res.status(400).json({
            status: "error",
            message: "Missing stats data for insights generation."
        });
    }

    const insightsText = await aiService.generateInsights(statsData);

    res.status(200).json({
        status: "success",
        data: {
            insights: insightsText
        }
    });
});


