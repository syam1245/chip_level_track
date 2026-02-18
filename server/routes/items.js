import express from "express";
import Item from "../models/item.js";
import { requirePermission } from "../middleware/auth.js";

const router = express.Router();

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

router.get("/backup", requirePermission("items:backup"), async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/json");

    res.send(JSON.stringify(items, null, 2));
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.post("/", requirePermission("items:create"), async (req, res) => {
  try {
    const { jobNumber, customerName, brand, phoneNumber } = req.body;

    if (!jobNumber || !customerName || !brand || !phoneNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    const cleanData = {
      jobNumber: String(jobNumber).trim(),
      customerName: String(customerName).trim(),
      brand: String(brand).trim(),
      phoneNumber: String(phoneNumber).trim(),
    };

    const savedItem = await new Item(cleanData).save();
    return res.status(201).json(savedItem);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Job number already exists" });
    }

    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.put("/:id", requirePermission("items:update"), async (req, res) => {
  try {
    const { customerName, brand, phoneNumber, status, repairNotes } = req.body;

    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });

    if (customerName) item.customerName = String(customerName).trim();
    if (brand) item.brand = String(brand).trim();
    if (phoneNumber) item.phoneNumber = String(phoneNumber).trim();
    if (repairNotes !== undefined) item.repairNotes = String(repairNotes).trim();

    // Track status changes in history for future public service-history link
    if (status && status !== item.status) {
      item.status = status;
      item.statusHistory.push({
        status,
        note: repairNotes ? String(repairNotes).trim() : "",
        changedAt: new Date(),
      });
    }

    const updatedItem = await item.save();
    return res.json(updatedItem);
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get("/", requirePermission("items:read"), async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : "";
    const statusFilter = req.query.statusGroup ? String(req.query.statusGroup).trim() : "";

    const query = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { customerName: searchRegex },
        { brand: searchRegex },
        { jobNumber: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    // Filter by status group when a dashboard card is active
    if (statusFilter === "inProgress") {
      query.status = { $in: ["Received", "In Progress", "Waiting for Parts", "Sent to Service"] };
    } else if (statusFilter === "ready") {
      query.status = { $in: ["Ready", "Delivered"] };
    } else if (statusFilter === "pending") {
      query.status = "Pending";
    }
    // "all" or empty = no status filter

    const [items, total, statsAggregation] = await Promise.all([
      Item.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Item.countDocuments(query),
      Item.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: 0,
      inProgress: 0,
      ready: 0,
      pending: 0,
    };

    const IN_PROGRESS_STATUSES = new Set(["Received", "In Progress", "Waiting for Parts", "Sent to Service"]);
    const READY_STATUSES = new Set(["Ready", "Delivered"]);

    statsAggregation.forEach((entry) => {
      stats.total += entry.count;
      if (IN_PROGRESS_STATUSES.has(entry._id)) stats.inProgress += entry.count;
      if (READY_STATUSES.has(entry._id)) stats.ready += entry.count;
      if (entry._id === "Pending") stats.pending += entry.count;
    });

    return res.json({
      items,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      stats,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.delete("/:id", requirePermission("items:delete"), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });

    item.isDeleted = true;
    await item.save();

    return res.json({ msg: "Item removed" });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
