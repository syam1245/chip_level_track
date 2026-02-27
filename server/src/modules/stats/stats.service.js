import StatsRepository from "./stats.repository.js";
import NodeCache from "node-cache";

// Cache revenue results for 5 minutes — revenue data doesn't change frequently
// and the $facet aggregation can be expensive on large datasets.
const revenueCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class StatsService {
    async getRevenueReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : this._getStartOfMonth();
        const end = endDate ? new Date(endDate) : new Date();

        // Use ISO date strings as a deterministic cache key
        const cacheKey = `revenue:${start.toISOString().slice(0, 10)}:${end.toISOString().slice(0, 10)}`;
        const cached = revenueCache.get(cacheKey);
        if (cached) return cached;

        const data = await StatsRepository.getRevenueData(start, end);
        revenueCache.set(cacheKey, data);
        return data;
    }

    _getStartOfMonth() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
}

export default new StatsService();
