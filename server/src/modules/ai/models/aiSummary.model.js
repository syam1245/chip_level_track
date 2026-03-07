import mongoose from "mongoose";

const aiSummarySchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true
    },
    jobNumber: String,
    customerName: String,
    summaryText: {
      type: String,
      required: true,
      maxlength: 5000
    },
    fingerprint: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

aiSummarySchema.index({ itemId: 1 }, { unique: true });

export default mongoose.model("AiSummary", aiSummarySchema);