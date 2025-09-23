

// server/models/item.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    jobNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    brand: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
