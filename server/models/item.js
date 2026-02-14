

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
      enum: ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Ready", "Delivered"],
      index: true
    },
    repairNotes: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
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

export default mongoose.model("Item", itemSchema);
