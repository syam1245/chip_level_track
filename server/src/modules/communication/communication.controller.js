import asyncHandler from "../../core/utils/asyncHandler.js";
import AppError from "../../core/errors/AppError.js";
import { aiMessageService } from "./aiMessage.service.js";

/**
 * Controller for handling communication-related endpoints.
 */
export const generateWhatsApp = asyncHandler(async (req, res) => {
    const { customerName, jobNumber, brand, status, repairNotes, finalCost } = req.body;

    if (!customerName || (!brand && !req.body.deviceDetails)) {
        throw new AppError("Customer name and device details are required", 400);
    }

    // Mapping fields to what the service expects (as per recent user updates)
    const jobData = {
        customerName,
        jobNumber,
        make: brand || req.body.deviceDetails, // Handle both old and new field names
        model: req.body.model || "Device",
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
