import asyncHandler from "../../core/utils/asyncHandler.js";
import AppError from "../../core/errors/AppError.js";
import { aiService } from "./ai.service.js";
import { aiMessageService } from "./aiMessage.service.js";

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

/**
 * Controller for handling AI WhatsApp message generation.
 */
export const generateWhatsApp = asyncHandler(async (req, res) => {
    const { customerName, jobNumber, brand, status, repairNotes, finalCost } = req.body;

    if (!customerName) {
        throw new AppError("Customer name is required", 400);
    }

    // Mapping fields to what the service expects (as per recent user updates)
    const jobData = {
        customerName,
        jobNumber,
        make: brand || req.body.deviceDetails || "Device", // Handle both old and new field names
        model: req.body.model || "",
        status,
        fault: repairNotes,
        repairCost: finalCost
    };

    // Call the service to generate the message
    const generatedMessage = await aiMessageService.generatePersonalizedUpdate(jobData);

    res.status(200).json({
        ok: true,
        message: generatedMessage
    });
});
