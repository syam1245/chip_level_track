import StatsRepository from "./stats.repository.js";

class StatsService {
    async getRevenueReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : this._getStartOfMonth();
        const end = endDate ? new Date(endDate) : new Date();

        return await StatsRepository.getRevenueData(start, end);
    }

    async getSummary(startDate, endDate) {
        const start = startDate ? new Date(startDate) : this._getStartOfMonth();
        const end = endDate ? new Date(endDate) : new Date();

        return await StatsRepository.getKeyStatistics(start, end);
    }

    _getStartOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
}

export default new StatsService();
