import StatsService from "./stats.service.js";

class StatsController {
    async getRevenueReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const data = await StatsService.getRevenueReport(startDate, endDate);
            res.json(data);
        } catch (error) {
            next(error);
        }
    }
}

export default new StatsController();
