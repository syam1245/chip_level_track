

// server/models/item.js
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    jobNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    brand: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
