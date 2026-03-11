import AppError from "../../core/errors/AppError.js";

const ALLOWED_STATUSES = ["Received", "Sent to Service", "In Progress", "Waiting for Parts", "Ready", "Delivered", "Return", "Pending"];
const ALLOWED_UPDATE_FIELDS = new Set([
    "customerName", "brand", "phoneNumber", "repairNotes", "issue",
    "finalCost", "technicianName", "dueDate", "status"
]);

class ItemValidator {
    validateCreate(data) {
        const { jobNumber, customerName, brand, phoneNumber, issue } = data;

        if (!jobNumber || !customerName || !brand || !phoneNumber) {
            throw new AppError("All fields are required", 400);
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new AppError("Phone number must be exactly 10 digits", 400);
        }

        if (customerName.length > 100 || brand.length > 50 || jobNumber.length > 50) {
            throw new AppError("Field length exceeded maximum limit", 400);
        }

        if (issue && issue.length > 2000) {
            throw new AppError("Issue description cannot exceed 2000 characters", 400);
        }

        return true;
    }

    validateUpdate(data) {
        // Strip unexpected fields
        for (const key of Object.keys(data)) {
            if (!ALLOWED_UPDATE_FIELDS.has(key)) {
                delete data[key];
            }
        }

        const { phoneNumber, repairNotes, issue, customerName, brand, technicianName, status, finalCost } = data;

        if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            throw new AppError("Phone number must be exactly 10 digits", 400);
        }

        if (repairNotes && repairNotes.length > 2000) {
            throw new AppError("Repair notes cannot exceed 2000 characters", 400);
        }

        if (issue && issue.length > 2000) {
            throw new AppError("Issue description cannot exceed 2000 characters", 400);
        }

        if (customerName && customerName.length > 100) {
            throw new AppError("Customer name cannot exceed 100 characters", 400);
        }

        if (brand && brand.length > 50) {
            throw new AppError("Brand cannot exceed 50 characters", 400);
        }

        if (technicianName && technicianName.length > 100) {
            throw new AppError("Technician name cannot exceed 100 characters", 400);
        }

        if (status && !ALLOWED_STATUSES.includes(status)) {
            throw new AppError(`Invalid status: "${status}"`, 400);
        }

        if (finalCost !== undefined && (typeof finalCost !== "number" || finalCost < 0 || finalCost > 10000000)) {
            throw new AppError("Final cost must be a valid non-negative number", 400);
        }

        return true;
    }
}

export default new ItemValidator();

