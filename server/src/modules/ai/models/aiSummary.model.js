import mongoose from "mongoose";

const aiSummarySchema = new mongoose.Schema(
    {
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true,
            index: true,
            unique: true // One summary per job
        },
        jobNumber: { type: String }, // Stored for easy reference/debugging
        customerName: { type: String },
        summaryText: { type: String, required: true },
        fingerprint: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("AiSummary", aiSummarySchema);
