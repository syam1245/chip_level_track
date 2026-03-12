import mongoose from "mongoose";
import ItemService from "./items.service.js";
import ItemValidator from "./items.validator.js";
import asyncHandler from "../../core/utils/asyncHandler.js";
import AppError from "../../core/errors/AppError.js";
import { UAParser } from "ua-parser-js";

const MAX_BULK_SIZE = 100;

// NOTE: This controller intentionally does NOT use sendResponse() for the
// following endpoints: getAllItems, createItem, updateItem, deleteItem,
// bulkDeleteItems, bulkUpdateStatus.
//
// These endpoints send raw service results / custom shapes that the frontend's
// items.api.js reads directly. Wrapping them in { success, message, data }
// would break useItemsData and useItemsActions without a corresponding
// frontend change. Do not change these response shapes without first updating
// items.api.js and the hooks that consume it.

class ItemController {
    getAllItems = asyncHandler(async (req, res) => {
        const page   = Math.max(Number.parseInt(req.query.page,  10) || 1,  1);
        const limit  = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
        const search         = req.query.search        ? String(req.query.search).trim()              : "";
        const statusGroup    = req.query.statusGroup   ? String(req.query.statusGroup).trim()         : "";
        const includeMetadata= req.query.includeMetadata;
        const sortBy         = req.query.sortBy        ? String(req.query.sortBy).trim()              : "";
        const sortOrder      = req.query.sortOrder     ? String(req.query.sortOrder).toLowerCase()    : "desc";
        const technicianName = req.query.technicianName? String(req.query.technicianName).trim()      : "";

        const result = await ItemService.getItems({
            page, limit, search, statusGroup,
            userRole: req.user?.role,
            includeMetadata, sortBy, sortOrder, technicianName,
        });

        res.json(result);
    });

    createItem = asyncHandler(async (req, res) => {
        ItemValidator.validateCreate(req.body);

        const { jobNumber, customerName, brand, phoneNumber, issue, repairNotes } = req.body;

        const parser = new UAParser(req.headers["user-agent"]);
        const deviceResult = parser.getResult();

        const cleanData = {
            jobNumber:    String(jobNumber).trim().substring(0, 50),
            customerName: String(customerName).trim().substring(0, 100),
            brand:        String(brand).trim().substring(0, 50),
            phoneNumber:  String(phoneNumber).trim().substring(0, 15),
            issue:        issue        ? String(issue).trim().substring(0, 2000)       : "",
            // repairNotes was missing from cleanData — it was destructured from req.body
            // but never included here, so it was silently dropped before reaching the
            // service layer. Jobs created with repair notes would have empty repairNotes
            // in the database with no error thrown.
            repairNotes:  repairNotes  ? String(repairNotes).trim().substring(0, 2000) : "",
            metadata: {
                ip:       req.ip || req.socket?.remoteAddress || "unknown",
                browser:  deviceResult.browser.name || "Unknown",
                os:       deviceResult.os.name      || "Unknown",
                device:   deviceResult.device.vendor
                    ? `${deviceResult.device.vendor} ${deviceResult.device.model}`
                    : (deviceResult.device.type || "Desktop"),
                ua:        req.headers["user-agent"]                                  || "Unknown",
                timestamp: new Date().toISOString(),
                userRole:  req.user?.role                                              || "Unknown",
                referer:   req.headers["referer"] || req.headers["referrer"]          || "Direct",
            },
        };

        const item = await ItemService.createItem(cleanData, req.user);
        res.status(201).json(item);
    });

    updateItem = asyncHandler(async (req, res) => {
        // Throw AppError instead of returning res.json directly — the original
        // bypassed asyncHandler's catch and errorMiddleware entirely, producing
        // a response shape inconsistent with every other error in the app.
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new AppError("Invalid item ID", 400);
        }
        ItemValidator.validateUpdate(req.body);
        const item = await ItemService.updateItem(req.params.id, req.body);
        res.json(item);
    });

    deleteItem = asyncHandler(async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new AppError("Invalid item ID", 400);
        }
        await ItemService.deleteItem(req.params.id);
        res.json({ msg: "Item removed" });
    });

    bulkDeleteItems = asyncHandler(async (req, res) => {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "ids (array) is required" });
        }
        if (ids.length > MAX_BULK_SIZE) {
            return res.status(400).json({ error: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
        }
        const result = await ItemService.bulkDeleteItems(ids);
        res.json({ success: true, deletedCount: result.modifiedCount });
    });

    bulkUpdateStatus = asyncHandler(async (req, res) => {
        const { ids, status } = req.body;
        if (!Array.isArray(ids) || ids.length === 0 || !status) {
            return res.status(400).json({ error: "ids (array) and status are required" });
        }
        if (ids.length > MAX_BULK_SIZE) {
            return res.status(400).json({ error: `Maximum ${MAX_BULK_SIZE} items per bulk operation` });
        }
        const result = await ItemService.bulkUpdateStatus(ids, status);
        res.json({ success: true, modifiedCount: result.modifiedCount });
    });

    getBackup = asyncHandler(async (req, res) => {
        const items = await ItemService.getBackup();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup-${timestamp}.json`;

        // Filename quoted per RFC 6266 — required if filename ever contains
        // spaces or special characters. Quoting unconditionally is best practice.
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(items, null, 2));
    });

    trackItem = asyncHandler(async (req, res) => {
        const jobNumber   = req.query.jobNumber   ? String(req.query.jobNumber).trim()   : null;
        const phoneNumber = req.query.phoneNumber ? String(req.query.phoneNumber).trim() : null;

        if (!jobNumber || !phoneNumber) {
            throw new AppError("Job number and phone number are required", 400);
        }

        const item = await ItemService.trackItem(jobNumber, phoneNumber);
        if (!item) {
            throw new AppError("No matching repair job found", 404);
        }

        res.json(item);
    });
}

export default new ItemController();