import AppError from "../../core/errors/AppError.js";

class ItemValidator {
    validateCreate(data) {
        const { jobNumber, customerName, brand, phoneNumber } = data;

        if (!jobNumber || !customerName || !brand || !phoneNumber) {
            throw new AppError("All fields are required", 400);
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new AppError("Phone number must be exactly 10 digits", 400);
        }

        return true;
    }

    validateUpdate(data) {
        const { phoneNumber } = data;

        if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            throw new AppError("Phone number must be exactly 10 digits", 400);
        }

        return true;
    }
}

export default new ItemValidator();
