import VisionService from "./vision.service.js";
import { ExtractionSchema } from "./vision.validator.js";
import asyncHandler from "../../core/utils/asyncHandler.js";
import AppError from "../../core/errors/AppError.js";

class VisionController {
    static ALLOWED_MIME_TYPES = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ]);

    static MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    extract = asyncHandler(async (req, res) => {

        let imageBuffer;
        let mimeType = "image/jpeg";

        // --- Handle multipart upload ---
        if (req.file) {
            mimeType = req.file.mimetype;

            if (!VisionController.ALLOWED_MIME_TYPES.has(mimeType)) {
                throw new AppError(
                    "Unsupported image format. Allowed: JPEG, PNG, WebP, GIF.",
                    415
                );
            }

            if (!req.file.buffer || req.file.buffer.length === 0) {
                throw new AppError("Uploaded image is empty.", 400);
            }

            if (req.file.buffer.length > VisionController.MAX_IMAGE_SIZE) {
                throw new AppError("Image exceeds maximum allowed size.", 413);
            }

            imageBuffer = req.file.buffer;
        }

        // --- Handle base64 image ---
        else if (req.body && req.body.image) {
            let base64String = String(req.body.image).trim();

            if (base64String.includes(",")) {
                const match = base64String.match(/^data:([^;]+);base64,/i);
                if (match && match[1]) {
                    mimeType = match[1].toLowerCase();
                }
                base64String = base64String.split(",")[1];
            }

            if (!VisionController.ALLOWED_MIME_TYPES.has(mimeType)) {
                throw new AppError(
                    "Unsupported image format. Allowed: JPEG, PNG, WebP, GIF.",
                    415
                );
            }

            try {
                imageBuffer = Buffer.from(base64String, "base64");
            } catch {
                throw new AppError("Invalid base64 image data.", 400);
            }

            if (!imageBuffer || imageBuffer.length === 0) {
                throw new AppError("Decoded image is empty.", 400);
            }

            if (imageBuffer.length > VisionController.MAX_IMAGE_SIZE) {
                throw new AppError("Image exceeds maximum allowed size.", 413);
            }
        }

        // --- No image provided ---
        else {
            throw new AppError("No image provided.", 400);
        }

        const parsed = await VisionService.extractDataFromImage(
            imageBuffer,
            mimeType
        );

        const validated = ExtractionSchema.safeParse(parsed);

        if (!validated.success) {
            throw new AppError("AI response failed validation.", 500);
        }

        const data = validated.data;

        const combinedBrand = [data.make, data.model]
            .filter((v) => typeof v === "string" && v.trim().length > 0)
            .join(" ")
            .trim();

        const result = {
            ...data,
            brand: combinedBrand || data.item || "",
            phoneNumber: data.customerMobileNo || "",
            issue: data.remarks || data.handwrittenNotes || ""
        };

        res.json({
            success: true,
            data: result
        });
    });
}

export default new VisionController();