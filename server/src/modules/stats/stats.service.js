import StatsRepository from "./stats.repository.js";
import NodeCache from "node-cache";

// Cache revenue results for 5 minutes — the $facet aggregation is expensive
// on large datasets and revenue data doesn't change frequently.
const revenueCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class StatsService {
    async getRevenueReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : this._getStartOfMonth();
        const end   = endDate   ? new Date(endDate)   : new Date();

        // Build a deterministic cache key from normalized UTC date strings.
        //
        // Problem with the original key: omitting endDate gives new Date() (e.g.
        // 14:32:11 today), while passing today's date explicitly gives UTC midnight.
        // Both slice to the same "YYYY-MM-DD" string → same cache key → wrong cached
        // data served when the two code paths produce different query ranges.
        //
        // Fix: always normalize end to end-of-day before slicing the key, matching
        // exactly what the repository does to the end date in its query.
        const endNormalized = new Date(end);
        endNormalized.setUTCHours(23, 59, 59, 999);

        const cacheKey = `revenue:${start.toISOString().slice(0, 10)}:${endNormalized.toISOString().slice(0, 10)}`;

        const cached = revenueCache.get(cacheKey);
        if (cached) return cached;

        const data = await StatsRepository.getRevenueData(start, end);
        revenueCache.set(cacheKey, data);
        return data;
    }

    _getStartOfMonth() {
        // Use UTC methods so toISOString() on the result always reflects the
        // intended date. The local-timezone constructor new Date(year, month, 1)
        // creates local midnight — on non-UTC servers toISOString() can shift
        // this to the previous day, corrupting the cache key.
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }

    invalidateRevenueCache() {
        // flushAll clears all cached date ranges, not just the one affected by
        // the current job change. Targeted invalidation would require knowing
        // which ranges overlap the job's revenueRealizedAt — complex for marginal
        // gain in a single-shop app. Full flush on Ready/Delivered is acceptable.
        revenueCache.flushAll();
    }
}

export default new StatsService();