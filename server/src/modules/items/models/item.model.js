import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
    {
        jobNumber: { type: String, required: true, unique: true, index: true },
        customerName: { type: String, required: true, uppercase: true },
        brand: { type: String, required: true },
        phoneNumber: { type: String, required: true, index: true },
        status: {
            type: String,
            default: "Received",
            enum: ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Ready", "Delivered", "Pending", "Return"],
            index: true
        },
        repairNotes: { type: String },
        issue: { type: String, uppercase: true },
        cost: { type: Number, default: 0 },
        finalCost: { type: Number, default: 0 },
        statusHistory: [
            {
                status: { type: String },
                note: { type: String, default: "" },
                changedAt: { type: Date, default: Date.now },
            }
        ],
        isDeleted: { type: Boolean, default: false, index: true },
        technicianName: { type: String, default: "Unknown" },
        metadata: {
            type: Object,
            select: false,
        },
    },
    { timestamps: true }
);

itemSchema.index({
    customerName: "text",
    brand: "text",
    jobNumber: "text",
    phoneNumber: "text"
});

itemSchema.index({ isDeleted: 1, createdAt: -1 });
itemSchema.index({ isDeleted: 1, status: 1 });
itemSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });
itemSchema.index({ isDeleted: 1, cost: 1, createdAt: -1 });

export default mongoose.model("Item", itemSchema);
