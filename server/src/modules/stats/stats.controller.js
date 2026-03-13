import StatsService from "./stats.service.js";
import asyncHandler from "../../core/utils/asyncHandler.js";
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

        // NOTE: intentionally using res.json(data) directly — NOT sendResponse().
        // The frontend's stats.api.js reads fields like data.total, data.breakdown
        // directly from the response root. Wrapping in sendResponse({ data })
        // would nest them under response.data and break the admin revenue charts.
        // Do not change this to sendResponse without updating stats.api.js first.
        res.json(data);
    });
}

export default new StatsController();