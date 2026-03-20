import StatsRepository from "./stats.repository.js";
import NodeCache from "node-cache";

// Cache revenue results for 5 minutes — the $facet aggregation is expensive
// on large datasets and revenue data doesn't change frequently.
const revenueCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class StatsService {
    async getRevenueReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : this._getStartOfMonth();
        const end = endDate ? new Date(endDate) : new Date();

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

        const cacheKey = `revenue|${start.toISOString().slice(0, 10)}|${endNormalized.toISOString().slice(0, 10)}`;

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

    /**
     * Invalidate cached revenue ranges that overlap a specific event date.
     *
     * @param {Date|null} date - The revenueRealizedAt date of the job that changed.
     *   When provided, only cache keys whose date range contains this date are
     *   evicted. Ranges that don't overlap are untouched — e.g. marking a job
     *   "Ready" today will not evict a cached report for last month.
     *   When null/undefined (shouldn't happen in normal flow but kept as a
     *   safe fallback), all ranges are flushed.
     *
     * Cache key format: "revenue|YYYY-MM-DD|YYYY-MM-DD"
     */
    invalidateRevenueCache(date = null) {
        if (!date) {
            // Safe fallback — no date provided, clear everything.
            revenueCache.flushAll();
            return;
        }

        const targetStr = (date instanceof Date ? date : new Date(date))
            .toISOString()
            .slice(0, 10); // "YYYY-MM-DD"

        const keys = revenueCache.keys();
        for (const key of keys) {
            // Parse the two date parts from the key.
            // Split limit of 3 handles keys with extra colons in edge cases.
            const parts = key.split("|");
            if (parts.length !== 3) {
                // Unexpected key format — evict it to be safe rather than
                // leaving potentially stale data that can never be cleaned up.
                revenueCache.del(key);
                continue;
            }

            const [, rangeStart, rangeEnd] = parts;

            // Evict only if the event date falls within [rangeStart, rangeEnd].
            // String comparison works here because both sides are ISO "YYYY-MM-DD"
            // which sorts lexicographically — no Date parsing needed.
            if (targetStr >= rangeStart && targetStr <= rangeEnd) {
                revenueCache.del(key);
            }
        }
    }
}

export default new StatsService();