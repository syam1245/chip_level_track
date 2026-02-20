import VisionService from "./vision.service.js";
import { ExtractionSchema } from "./vision.validator.js";
import asyncHandler from "../../core/utils/asyncHandler.js";
import AppError from "../../core/errors/AppError.js";

class VisionController {
    extract = asyncHandler(async (req, res) => {
        let imageBuffer;
        let mimeType = "image/jpeg";

        if (req.file) {
            imageBuffer = req.file.buffer;
            mimeType = req.file.mimetype;
        } else if (req.body.image) {
            let base64String = req.body.image;
            if (base64String.includes(",")) {
                const match = base64String.match(/^data:([^;]+);base64,/);
                if (match) mimeType = match[1];
                base64String = base64String.split(",")[1];
            }
            imageBuffer = Buffer.from(base64String, "base64");
        } else {
            throw new AppError("No image provided", 400);
        }

        const parsed = await VisionService.extractDataFromImage(imageBuffer, mimeType);

        const validated = ExtractionSchema.safeParse(parsed);
        if (!validated.success) {
            throw new AppError("AI response failed validation", 500);
        }

        const data = validated.data;
        const combinedBrand = [data.make, data.model].filter(Boolean).join(" ");

        const result = {
            ...data,
            brand: combinedBrand || data.item || "",
            phoneNumber: data.customerMobileNo || "",
        };

        res.json({
            success: true,
            data: result
        });
    });
}

export default new VisionController();
