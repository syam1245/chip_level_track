import ItemService from "./items.service.js";
import ItemValidator from "./items.validator.js";
import asyncHandler from "../../core/utils/asyncHandler.js";
import { UAParser } from "ua-parser-js";

class ItemController {
    getAllItems = asyncHandler(async (req, res) => {
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Number.parseInt(req.query.limit, 10) || 10;
        const search = req.query.search ? String(req.query.search).trim() : "";
        const statusGroup = req.query.statusGroup ? String(req.query.statusGroup).trim() : "";
        const includeMetadata = req.query.includeMetadata;
        const sortBy = req.query.sortBy ? String(req.query.sortBy).trim() : "";
        const sortOrder = req.query.sortOrder ? String(req.query.sortOrder).toLowerCase() : "desc";
        const technicianName = req.query.technicianName ? String(req.query.technicianName).trim() : "";

        const result = await ItemService.getItems({
            page,
            limit,
            search,
            statusGroup,
            userRole: req.user?.role,
            includeMetadata,
            sortBy,
            sortOrder,
            technicianName
        });

        res.json(result);
    });

    createItem = asyncHandler(async (req, res) => {
        ItemValidator.validateCreate(req.body);
        const { jobNumber, customerName, brand, phoneNumber, issue, cost } = req.body;

        const parser = new UAParser(req.headers["user-agent"]);
        const deviceResult = parser.getResult();

        const cleanData = {
            jobNumber: String(jobNumber).trim(),
            customerName: String(customerName).trim(),
            brand: String(brand).trim(),
            phoneNumber: String(phoneNumber).trim(),
            issue: issue ? String(issue).trim() : "",
            cost: cost ? Number(cost) : 0,
            metadata: {
                ip: req.ip || req.connection.remoteAddress,
                browser: deviceResult.browser.name || "Unknown",
                os: deviceResult.os.name || "Unknown",
                device: deviceResult.device.vendor ? `${deviceResult.device.vendor} ${deviceResult.device.model}` : (deviceResult.device.type || "Desktop"),
                ua: req.headers["user-agent"] || "Unknown",
                timestamp: new Date().toISOString(),
                userRole: req.user?.role || "Unknown",
                referer: req.headers["referer"] || req.headers["referrer"] || "Direct"
            }
        };

        const item = await ItemService.createItem(cleanData, req.user);
        res.status(201).json(item);
    });

    updateItem = asyncHandler(async (req, res) => {
        ItemValidator.validateUpdate(req.body);
        const item = await ItemService.updateItem(req.params.id, req.body);
        res.json(item);
    });

    deleteItem = asyncHandler(async (req, res) => {
        await ItemService.deleteItem(req.params.id);
        res.json({ msg: "Item removed" });
    });

    getBackup = asyncHandler(async (req, res) => {
        const items = await ItemService.getBackup();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `backup-${timestamp}.json`;

        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.setHeader("Content-Type", "application/json");

        res.send(JSON.stringify(items, null, 2));
    });
}

export default new ItemController();
