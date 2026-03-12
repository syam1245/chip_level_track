import mongoose from "mongoose";
import { ALLOWED_STATUSES } from "../../../constants/status.js";

const itemSchema = new mongoose.Schema(
    {
        jobNumber:    { type: String, required: true, unique: true, index: true },
        customerName: { type: String, required: true, uppercase: true },
        brand:        { type: String, required: true },
        phoneNumber:  { type: String, required: true },
        status: {
            type:    String,
            default: "Received",
            enum:    ALLOWED_STATUSES,
        },
        repairNotes: { type: String },
        issue:       { type: String, uppercase: true },
        finalCost:   { type: Number, default: 0 },
        statusHistory: [
            {
                status:    { type: String },
                note:      { type: String, default: "" },
                changedAt: { type: Date, default: Date.now },
            },
        ],
        isDeleted:        { type: Boolean, default: false },
        technicianName:   { type: String, default: "Unknown" },
        dueDate:          { type: Date, default: null },
        deliveredAt:      { type: Date, default: null },
        revenueRealizedAt:{ type: Date, default: null },
        formattedDate:    { type: String, default: "" },
        metadata: {
            type:   Object,
            select: false,
        },
    },
    { timestamps: true }
);

// ── Pre-save: set formattedDate (DD/MM/YY) once at creation ──────────────────
// Guard with this.isNew so every subsequent item.save() call in updateItem
// doesn't recompute a value that can never change (createdAt is immutable).
itemSchema.pre("save", function (next) {
    if (this.isNew && this.createdAt) {
        const d     = new Date(this.createdAt);
        const day   = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year  = String(d.getFullYear()).slice(-2);
        this.formattedDate = `${day}/${month}/${year}`;
    }
    next();
});

// ── Text index — full-text search across key customer-facing fields ──────────
itemSchema.index({
    customerName: "text",
    brand:        "text",
    jobNumber:    "text",
    phoneNumber:  "text",
});

// ── Compound indexes — covering the actual query patterns in the codebase ────
//
// Single-field indexes on isDeleted, dueDate, and revenueRealizedAt were
// removed. Every query in items.repository.js filters by isDeleted first,
// so the compound indexes below are always the best plan. The standalone
// single-field indexes on those three fields added write overhead and disk
// usage with no query that would prefer them.
//
// Kept: jobNumber unique index (fast single-document lookup by job number).
// phoneNumber has no standalone index — findByTrackingDetails queries by
// both jobNumber AND phoneNumber, so MongoDB uses the jobNumber unique index
// and filters phoneNumber on the single result. A separate phoneNumber index
// would never be chosen and would only add write overhead.

itemSchema.index({ isDeleted: 1, createdAt: -1 });          // default list, newest first
itemSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });// status filter + sort
itemSchema.index({ isDeleted: 1, technicianName: 1, createdAt: -1 }); // technician filter
itemSchema.index({ isDeleted: 1, dueDate: 1, status: 1 });  // overdue queries
itemSchema.index({ isDeleted: 1, revenueRealizedAt: 1 });   // revenue date range

export default mongoose.model("Item", itemSchema);