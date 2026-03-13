import { z } from "zod";
import AppError from "../../core/errors/AppError.js";
import { jobCreateSchema, jobUpdateSchema } from "chip-level-track-shared";

class ItemValidator {
    validateCreate(data) {
        try {
            jobCreateSchema.parse(data);
            return true;
        } catch (err) {
            if (err instanceof z.ZodError || err.name === "ZodError") {
                const message = err.issues[0].message;
                throw new AppError(message, 400);
            }
            throw err;
        }
    }

    validateUpdate(data) {
        // NOTE: This method intentionally mutates `data` (which is req.body) in place.
        // We preserve this behavior by re-assigning the parsed/transformed result.
        try {
            const validated = jobUpdateSchema.parse(data);
            
            // Clear existing keys and re-assign validated ones to match legacy mutation behavior
            Object.keys(data).forEach(k => delete data[k]);
            Object.assign(data, validated);
            
            return true;
        } catch (err) {
            if (err instanceof z.ZodError || err.name === "ZodError") {
                const issue = err.issues[0];
                const msg = issue.message === "Required" 
                    ? `${issue.path[0]} is required`
                    : issue.message;
                throw new AppError(msg, 400);
            }
            throw err;
        }
    }
}

export default new ItemValidator();