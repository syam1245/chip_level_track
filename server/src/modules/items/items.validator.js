import AppError from "../../core/errors/AppError.js";

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
        const { phoneNumber, repairNotes, issue } = data;

        if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            throw new AppError("Phone number must be exactly 10 digits", 400);
        }

        if (repairNotes && repairNotes.length > 2000) {
            throw new AppError("Repair notes cannot exceed 2000 characters", 400);
        }

        if (issue && issue.length > 2000) {
            throw new AppError("Issue description cannot exceed 2000 characters", 400);
        }

        return true;
    }
}

export default new ItemValidator();
