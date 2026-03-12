import AppError from "../../core/errors/AppError.js";

import { ALLOWED_STATUSES } from "../../constants/status.js";

const ALLOWED_UPDATE_FIELDS = new Set([
    "customerName", "brand", "phoneNumber", "repairNotes", "issue",
    "finalCost", "technicianName", "dueDate", "status",
]);

// Field length limits kept as named constants so they're easy to find and update.
// Each limit is enforced identically in both validateCreate and validateUpdate
// so the same field cannot bypass a limit via one path vs the other.
const LIMITS = {
    jobNumber:     50,
    customerName:  100,
    brand:         50,
    issue:         2000,
    repairNotes:   2000,
    technicianName:100,
};

class ItemValidator {
    validateCreate(data) {
        const { jobNumber, customerName, brand, phoneNumber, issue, repairNotes, technicianName } = data;

        // Check each required field individually so the error message is specific.
        if (!jobNumber)     throw new AppError("Job number is required", 400);
        if (!customerName)  throw new AppError("Customer name is required", 400);
        if (!brand)         throw new AppError("Brand is required", 400);
        if (!phoneNumber)   throw new AppError("Phone number is required", 400);

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new AppError("Phone number must be exactly 10 digits", 400);
        }

        if (jobNumber.length     > LIMITS.jobNumber)      throw new AppError(`Job number cannot exceed ${LIMITS.jobNumber} characters`, 400);
        if (customerName.length  > LIMITS.customerName)   throw new AppError(`Customer name cannot exceed ${LIMITS.customerName} characters`, 400);
        if (brand.length         > LIMITS.brand)          throw new AppError(`Brand cannot exceed ${LIMITS.brand} characters`, 400);
        if (issue        && issue.length        > LIMITS.issue)         throw new AppError(`Issue description cannot exceed ${LIMITS.issue} characters`, 400);
        if (repairNotes  && repairNotes.length  > LIMITS.repairNotes)   throw new AppError(`Repair notes cannot exceed ${LIMITS.repairNotes} characters`, 400);
        if (technicianName && technicianName.length > LIMITS.technicianName) throw new AppError(`Technician name cannot exceed ${LIMITS.technicianName} characters`, 400);

        return true;
    }

    validateUpdate(data) {
        // NOTE: This method intentionally mutates `data` (which is req.body) in place.
        // The controller uses the same object after validation, so the stripped keys
        // and coerced finalCost are the actual values that reach the service layer.
        // Do not change this to return a copy without also updating items.controller.js.

        // Strip keys not in the allowed set
        for (const key of Object.keys(data)) {
            if (!ALLOWED_UPDATE_FIELDS.has(key)) {
                delete data[key];
            }
        }

        const { phoneNumber, repairNotes, issue, customerName, brand, technicianName, status, finalCost, dueDate } = data;

        if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            throw new AppError("Phone number must be exactly 10 digits", 400);
        }

        if (customerName  && customerName.length  > LIMITS.customerName)   throw new AppError(`Customer name cannot exceed ${LIMITS.customerName} characters`, 400);
        if (brand         && brand.length         > LIMITS.brand)          throw new AppError(`Brand cannot exceed ${LIMITS.brand} characters`, 400);
        if (issue         && issue.length         > LIMITS.issue)          throw new AppError(`Issue description cannot exceed ${LIMITS.issue} characters`, 400);
        if (repairNotes   && repairNotes.length   > LIMITS.repairNotes)    throw new AppError(`Repair notes cannot exceed ${LIMITS.repairNotes} characters`, 400);
        if (technicianName && technicianName.length > LIMITS.technicianName) throw new AppError(`Technician name cannot exceed ${LIMITS.technicianName} characters`, 400);

        if (status && !ALLOWED_STATUSES.includes(status)) {
            throw new AppError(`Invalid status: "${status}"`, 400);
        }

        if (finalCost !== undefined) {
            const parsedCost = Number(finalCost);
            if (isNaN(parsedCost) || parsedCost < 0 || parsedCost > 10_000_000) {
                throw new AppError("Final cost must be a valid non-negative number", 400);
            }
            data.finalCost = parsedCost;
        }

        // dueDate was in ALLOWED_UPDATE_FIELDS but had no validation.
        // Any string (including "banana") would reach Mongoose, which silently
        // stores invalid dates as null in MongoDB with no error thrown.
        if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
            const parsed = new Date(dueDate);
            if (isNaN(parsed.getTime())) {
                throw new AppError("Due date must be a valid date", 400);
            }
            // Normalize to a proper Date object so Mongoose doesn't have to coerce it.
            data.dueDate = parsed;
        }

        return true;
    }
}

export default new ItemValidator();