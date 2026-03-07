import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../../core/config/index.js";
import AppError from "../../core/errors/AppError.js";
import AiSummary from "./models/aiSummary.model.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

class AiService {
    /**
     * Generates a unique fingerprint for the job data to detect changes.
     */
    generateFingerprint(data) {
        // We use fields that would change the technical meaning of a summary
        return `${data.brand}|${data.status}|${data.issue}|${data.repairNotes}|${data.technicianName}`;
    }

    /**
     * Sanitizes job data for summary generation.
     */
    sanitizeJobData(jobData) {
        if (!jobData) return {};
        return {
            jobNumber: jobData.jobNumber || "N/A",
            customer: jobData.customerName || "Customer",
            deviceBrand: jobData.brand || "Not Specified",
            initialReportedIssue: jobData.issue || "Not Specified",
            currentStatus: jobData.status || "Received",
            latestTechnicianNotes: jobData.repairNotes || "",
            assignedTechnician: jobData.technicianName || "Unknown",
            jobCreatedOn: jobData.formattedDate || "",
            // Provide a simplified, readable status history for the AI to understand the repair journey
            technicalHistory: (jobData.statusHistory || []).map(entry => ({
                statusWas: entry.status,
                techComment: entry.note || "No note",
                timeOfEntry: entry.changedAt ? new Date(entry.changedAt).toLocaleDateString('en-IN') : ""
            }))
        };
    }

    /**
     * Generates a "TL;DR" summary for a repair job.
     */
    async generateJobSummary(jobData, forceRefresh = false) {
        try {
            if (!jobData || !jobData._id) {
                throw new Error("Job ID is required to generate or fetch a summary.");
            }

            const currentFingerprint = this.generateFingerprint(jobData);

            // 1. Check if we already have a valid summary in the DB
            if (!forceRefresh) {
                const existingSummary = await AiSummary.findOne({ itemId: jobData._id });
                if (existingSummary && existingSummary.fingerprint === currentFingerprint) {
                    return existingSummary.summaryText;
                }
            }

            const cleanData = this.sanitizeJobData(jobData);

            const model = genAI.getGenerativeModel({
                model: config.geminiModel,
                systemInstruction: "You are an expert technician assistant. Your task is to provide a complete, technical, and detailed summary of a repair job. Use professional technical language and structure the response clearly."
            });

            const payload = JSON.stringify(cleanData);

            const prompt = `
Analyze this repair job carefully. Use the "technicalHistory" to build a timeline of what was done.
Repair Job Data: ${payload}

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
2. If "technicalHistory" has multiple entries, summarize the progression (e.g. "Initially diagnosed as X, then moved to Y").
3. Use professional tone. No greetings or signatures.
4. Output Markdown format.
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const summaryText = response.text().trim();

            // 2. Save the summary to the separate AiSummary collection (upsert)
            await AiSummary.findOneAndUpdate(
                { itemId: jobData._id },
                {
                    itemId: jobData._id,
                    jobNumber: jobData.jobNumber,
                    customerName: jobData.customerName,
                    summaryText: summaryText,
                    fingerprint: currentFingerprint
                },
                { upsert: true, new: true } // Create if doesn't exist, update if it does
            ).catch(err => console.error("Failed to upsert AI summary to DB:", err));

            return summaryText;

        } catch (error) {
            console.error("Gemini API Error (Summary):", error);
            // Re-throw with a specific error so the frontend knows it's an AI failure
            if (error.status === 429) {
                throw new AppError("AI API quota exceeded. Please try again later.", 429);
            }
            throw new AppError("AI Co-Pilot is currently unavailable.", 503);
        }
    }

    /**
     * Generates a short business consultant-style summary highlighting profitable trends and bottlenecks.
     */
    async generateInsights(statsData) {
        if (!statsData || (statsData.totalJobs === 0 && statsData.total === 0)) {
            return "Not enough data available for analysis.";
        }

        try {
            const model = genAI.getGenerativeModel({
                model: config.geminiModel,
                systemInstruction: "You are an expert business analyst and consultant for a repair shop in India. Your task is to analyze revenue and job statistics and provide a highly concise, actionable insight report. ALWAYS use Indian Rupees (INR) and the ₹ symbol for all currency mentions."
            });

            // Match properties from StatsRepository: total, totalJobs, pendingJobs, topTechnician, breakdown
            const payload = JSON.stringify({
                totalJobsInPeriod: statsData.totalJobs || 0,
                revenueInPeriod: statsData.total || 0,
                currentPendingJobsAcrossShop: statsData.pendingJobs || 0,
                topPerformingTechnician: statsData.topTechnician || "N/A",
                technicianBreakdown: (statsData.breakdown || []).map(t => ({
                    name: t._id,
                    revenue: t.totalRevenue,
                    jobs: t.deviceCount
                }))
            });

            const prompt = `
Act as a business planner. Analyze the following shop performance statistics from a given period: ${payload}

REQUIREMENTS:
1. Output NO MORE than 3 short paragraphs or bullet points.
2. Point out at least one positive trend (e.g. profitable areas).
3. Point out at least one bottleneck or area for improvement based on the data.
4. Keep the tone encouraging, professional, and straight to the point.
5. ALWAYS use the Indian Rupee symbol (₹) and ensure all currency values are referred to as rupees.
6. Do NOT include greetings.
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();

        } catch (error) {
            console.error("Gemini API Error (Insights):", error);
            if (error.status === 429) {
                throw new AppError("AI API quota exceeded. Please try again later.", 429);
            }
            throw new AppError("AI Co-Pilot is currently unavailable for insights.", 503);
        }
    }

}

export const aiService = new AiService();
