import asyncHandler from "../../core/utils/asyncHandler.js";
import AppError from "../../core/errors/AppError.js";
import { aiService } from "./ai.service.js";
import { aiMessageService } from "./aiMessage.service.js";

/**
 * Controller: Generate AI technical summary for a repair job.
 */
export const getSummary = asyncHandler(async (req, res) => {
    const jobData = req.body;

    // Validate required job data
    if (!jobData || typeof jobData !== "object" || !jobData._id) {
        return res.status(400).json({
            status: "error",
            message: "Missing job data for summary generation."
        });
    }

    const forceRefresh = jobData.forceRefresh === true;

    const summaryText = await aiService.generateJobSummary(jobData, forceRefresh);

    return res.status(200).json({
        status: "success",
        data: {
            summary: summaryText
        }
    });
});


/**
 * Controller: Generate AI business insights from shop statistics.
 */
export const getInsights = asyncHandler(async (req, res) => {
    const statsData = req.body;

    if (!statsData || typeof statsData !== "object") {
        return res.status(400).json({
            status: "error",
            message: "Missing stats data for insights generation."
        });
    }

    const insightsText = await aiService.generateInsights(statsData);

    return res.status(200).json({
        status: "success",
        data: {
            insights: insightsText
        }
    });
});


/**
 * Controller: Generate AI WhatsApp update message for a repair job.
 */
export const generateWhatsApp = asyncHandler(async (req, res) => {
    const {
        customerName,
        jobNumber,
        brand,
        status,
        repairNotes,
        finalCost
    } = req.body || {};

    if (!customerName) {
        throw new AppError("Customer name is required", 400);
    }

    // Map request fields to service format
    const jobData = {
        customerName,
        jobNumber,
        make: brand || req.body?.deviceDetails || "Device",
        model: req.body?.model || "",
        status,
        fault: repairNotes,
        repairCost: finalCost
    };

    const generatedMessage =
        await aiMessageService.generatePersonalizedUpdate(jobData);

    return res.status(200).json({
        ok: true,
        message: generatedMessage
    });
});