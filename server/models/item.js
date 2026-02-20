

// server/models/item.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    jobNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    brand: { type: String, required: true },
    phoneNumber: { type: String, required: true, index: true },
    status: {
      type: String,
      default: "Received",
      enum: ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Ready", "Delivered", "Pending", "Return"],
      index: true
    },
    repairNotes: { type: String },
    issue: { type: String },
    cost: { type: Number, default: 0 },
    // Future: public service-history timeline per job
    statusHistory: [
      {
        status: { type: String },
        note: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
      }
    ],
    isDeleted: { type: Boolean, default: false, index: true },
    technicianName: { type: String, required: true },
    metadata: {
      type: Object,
      select: false, // Hidden from normal queries
    },
  },
  { timestamps: true }
);

// Create compound text index for efficient search across multiple fields
itemSchema.index({
  customerName: "text",
  brand: "text",
  jobNumber: "text",
  phoneNumber: "text"
});

// Optimize find() and aggregate() queries used in items.js
itemSchema.index({ isDeleted: 1, createdAt: -1 });
itemSchema.index({ isDeleted: 1, status: 1 });

export default mongoose.model("Item", itemSchema);
