import AppError from "../../core/errors/AppError.js";
import AiSummary from "./models/aiSummary.model.js";
import { generateTextWithFallback } from "./llmProvider.js";

class AiService {
    /**
     * Generates a deterministic fingerprint for job data to detect changes.
     */
    generateFingerprint(data = {}) {
        const fields = [
            data.brand,
            data.status,
            data.issue,
            data.repairNotes,
            data.technicianName,
        ];

        return fields.map((v) => (v ? String(v).trim() : "")).join("|");
    }

    /**
     * Sanitizes job data for summary generation.
     */
    sanitizeJobData(jobData = {}) {
        const history = Array.isArray(jobData.statusHistory)
            ? jobData.statusHistory.slice(-5) // limit to last 5 entries
            : [];

        return {
            jobNumber: jobData.jobNumber || "N/A",
            customer: jobData.customerName || "Customer",
            deviceBrand: jobData.brand || "Not Specified",
            initialReportedIssue: jobData.issue || "Not Specified",
            currentStatus: jobData.status || "Received",
            latestTechnicianNotes: jobData.repairNotes || "",
            assignedTechnician: jobData.technicianName || "Unknown",
            jobCreatedOn: jobData.formattedDate || "",
            technicalHistory: history.map((entry) => ({
                statusWas: entry?.status || "",
                techComment: entry?.note || "No note",
                timeOfEntry: entry?.changedAt
                    ? new Date(entry.changedAt).toLocaleDateString("en-IN")
                    : "",
            })),
        };
    }

    /**
     * Generates a "TL;DR" technical summary for a repair job.
     */
    async generateJobSummary(jobData, forceRefresh = false) {
        try {
            if (!jobData || !jobData._id) {
                throw new AppError(
                    "Job ID is required to generate or fetch a summary.",
                    400
                );
            }

            const currentFingerprint = this.generateFingerprint(jobData);

            if (!forceRefresh) {
                const existingSummary = await AiSummary.findOne({
                    itemId: jobData._id,
                }).lean();

                if (
                    existingSummary &&
                    existingSummary.fingerprint === currentFingerprint
                ) {
                    return existingSummary.summaryText;
                }
            }

            const cleanData = this.sanitizeJobData(jobData);

            const systemInstruction =
                "You are an expert technician assistant. Your task is to provide a complete, technical, and detailed summary of a repair job. Use professional technical language and structure the response clearly. If any data is missing, state 'Not available' instead of guessing.";

            const payload = JSON.stringify(cleanData);

            const prompt = `
Analyze this repair job carefully. Use the "technicalHistory" to build a timeline of what was done.

Repair Job Data:
${payload}

STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

**Job Number:** [Job Number]  
**Customer:** [Customer Name]  
**Device:** [Device Brand]  
**Initial Fault:** [Initial Reported Issue]

**Technical Repair Summary:**  
[A detailed, professional technical narrative.
- Use the technicalHistory entries to describe the repair journey.
- Mention specific technician notes and findings.
- Describe what was attempted and what was found.]

**Current Status & Blocker:**  
[Concise summary of current state and exactly what is stopping progress or what was the final result.]

RULES:
1. Be technical and precise.
2. If "technicalHistory" has multiple entries, summarize the progression.
3. Use professional tone. No greetings or signatures.
4. Output Markdown format.
`;

            const summaryText = await generateTextWithFallback(
                prompt,
                systemInstruction
            );

            try {
                await AiSummary.findOneAndUpdate(
                    { itemId: jobData._id },
                    {
                        itemId: jobData._id,
                        jobNumber: jobData.jobNumber,
                        customerName: jobData.customerName,
                        summaryText,
                        fingerprint: currentFingerprint,
                    },
                    { upsert: true, new: true }
                );
            } catch (dbError) {
                console.error(
                    "Failed to upsert AI summary to DB:",
                    dbError?.message || dbError
                );
            }

            return summaryText;
        } catch (error) {
            console.error("AI Generation Error (Summary):", error);

            if (error?.statusCode) {
                throw error;
            }

            throw new AppError(
                "Failed to generate AI technical summary. Try again later.",
                500
            );
        }
    }

    /**
     * Generates concise business insights from shop statistics.
     */
    async generateInsights(statsData) {
        if (!statsData || (statsData.totalJobs === 0 && statsData.total === 0)) {
            return "Not enough data available for analysis.";
        }

        try {
            const systemInstruction =
                "You are an expert business analyst and consultant for a repair shop in India. Provide concise, actionable insights using Indian Rupees (₹). If data is insufficient, say so clearly.";

            const payload = JSON.stringify({
                totalJobsInPeriod: statsData.totalJobs || 0,
                revenueInPeriod: statsData.total || 0,
                currentPendingJobsAcrossShop: statsData.pendingJobs || 0,
                topPerformingTechnician: statsData.topTechnician || "N/A",
                technicianBreakdown: (statsData.breakdown || []).map((t) => ({
                    name: t?._id,
                    revenue: t?.totalRevenue || 0,
                    jobs: t?.deviceCount || 0,
                })),
            });

            const prompt = `
Act as a business planner. Analyze the following shop performance statistics:

${payload}

REQUIREMENTS:
1. Output NO MORE than 3 short paragraphs or bullet points.
2. Highlight at least one positive trend.
3. Identify at least one bottleneck or improvement area.
4. Keep tone professional and concise.
5. ALWAYS use the ₹ symbol for currency.
6. No greetings.
`;

            return await generateTextWithFallback(prompt, systemInstruction);
        } catch (error) {
            console.error("AI Generation Error (Insights):", error);

            if (error?.statusCode) {
                throw error;
            }

            throw new AppError(
                "AI Co-Pilot is currently unavailable for insights.",
                503
            );
        }
    }
}

export const aiService = new AiService();