import StatsService from "./stats.service.js";
import asyncHandler from "../../core/utils/asyncHandler.js";
import sendResponse from "../../core/response/responseHandler.js";
import AppError from "../../core/errors/AppError.js";

class StatsController {
    getRevenueReport = asyncHandler(async (req, res) => {
        const { startDate, endDate } = req.query;

        // Dates are optional — the service defaults to the current month when
        // omitted (useful for the admin dashboard opening without a date selection).
        // Only validate format when a value is actually provided.
        if (startDate && isNaN(new Date(startDate).getTime())) {
            throw new AppError("startDate must be a valid date", 400);
        }

        if (endDate && isNaN(new Date(endDate).getTime())) {
            throw new AppError("endDate must be a valid date", 400);
        }

        const data = await StatsService.getRevenueReport(startDate, endDate);
        sendResponse(res, 200, data, "Revenue report fetched");
    });
}

export default new StatsController();