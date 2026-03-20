import { z } from "zod";
import { ALLOWED_STATUSES } from "../status.js";

// Note: Ensure STATUS constants are migrated to shared if not already. 
// For now, we will import ALLOWED_STATUSES via relative path, but ideally
// status.js should be moved entirely into shared/.

const LIMITS = {
    jobNumber:     50,
    customerName:  100,
    brand:         50,
    issue:         2000,
    repairNotes:   2000,
    technicianName:100,
};

export const jobCreateSchema = z.object({
    jobNumber:     z.string().min(1, "Job number is required").max(LIMITS.jobNumber),
    customerName:  z.string().min(1, "Customer name is required").max(LIMITS.customerName),
    brand:         z.string().min(1, "Brand is required").max(LIMITS.brand),
    phoneNumber:   z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    issue:         z.string().max(LIMITS.issue).optional().default(""),
    repairNotes:   z.string().max(LIMITS.repairNotes).optional().default(""),
    technicianName:z.string().max(LIMITS.technicianName).optional(),
});

export const jobUpdateSchema = z.object({
    customerName:  z.string().max(LIMITS.customerName).optional(),
    brand:         z.string().max(LIMITS.brand).optional(),
    phoneNumber:   z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
    repairNotes:   z.string().max(LIMITS.repairNotes).optional(),
    issue:         z.string().max(LIMITS.issue).optional(),
    finalCost:     z.union([z.number(), z.string(), z.null()]).optional()
        .transform((val) => {
            if (val === undefined) return undefined;
            if (val === "" || val === null) return 0;
            const parsed = Number(String(val).trim());
            return isNaN(parsed) ? val : parsed;
        })
        .pipe(z.number({ invalid_type_error: "Final cost must be a valid number" }).min(0).max(10_000_000).optional()),
    technicianName:z.string().max(LIMITS.technicianName).optional(),
    dueDate:       z.union([z.string(), z.date(), z.null()]).optional()
        .transform((val) => {
            if (!val) return undefined;
            const parsed = new Date(val);
            return isNaN(parsed.getTime()) ? val : parsed;
        })
        .pipe(z.date({ invalid_type_error: "Due date must be a valid date" }).optional()),
    status:        z.enum(ALLOWED_STATUSES, { 
        errorMap: () => ({ message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` })
    }).optional(),
}); // Silently strips unknown fields during .parse()
