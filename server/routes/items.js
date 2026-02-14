

// server/routes/items.js
import express from "express";
import Item from "../models/item.js";

const router = express.Router();

// Helper: Escape Special Chars for Regex
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// @route   GET /api/items/backup
// @desc    Download full database backup
router.get("/backup", async (req, res) => {
  try {
    // Only admins should access this in a real app
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

// @route   POST /api/items
// @desc    Create new item
router.post("/", async (req, res) => {
  try {
    const { jobNumber, customerName, brand, phoneNumber } = req.body;

    // Strict Input Validation
    if (!jobNumber || !customerName || !brand || !phoneNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    // Sanitize inputs (basic)
    const cleanData = {
      jobNumber: String(jobNumber).trim(),
      customerName: String(customerName).trim(),
      brand: String(brand).trim(),
      phoneNumber: String(phoneNumber).trim(),
    };

    const newItem = new Item(cleanData);
    const savedItem = await newItem.save();

    res.status(201).json(savedItem);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Job number already exists" });
    }
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// @route   PUT /api/items/:id
// @desc    Update an item
router.put("/:id", async (req, res) => {
  try {
    const { customerName, brand, phoneNumber, status, repairNotes } = req.body;

    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });

    // Update only allowed fields
    if (customerName) item.customerName = String(customerName).trim();
    if (brand) item.brand = String(brand).trim();
    if (phoneNumber) item.phoneNumber = String(phoneNumber).trim();
    if (status) item.status = status;
    if (repairNotes !== undefined) item.repairNotes = String(repairNotes).trim();

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// @route   GET /api/items
// @desc    Get all items with Pagination & Search
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search).trim() : "";

    let query = { isDeleted: false };

    if (search) {
      // Use Mongo Text Search if possible, else Regex
      // Since existing data might not be indexed perfectly or user wants partial match:
      const searchRegex = new RegExp(escapeRegex(search), "i");

      query.$or = [
        { customerName: searchRegex },
        { brand: searchRegex },
        { jobNumber: searchRegex },
        { phoneNumber: searchRegex }
      ];
    }

    // Execute Query with Pagination
    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Item.countDocuments(query);

    // Calculate Stats (Global, not just for search result to keep dashboard consistent, 
    // or arguably for search result. Usually dashboard stats are global).
    // Let's do Global Stats for the top cards.
    const statsCheck = await Item.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = {
      total: await Item.countDocuments({ isDeleted: false }),
      inProgress: 0,
      waiting: 0,
      ready: 0,
      delivered: 0
    };

    statsCheck.forEach(s => {
      if (s._id === "In Progress") stats.inProgress = s.count;
      if (s._id === "Waiting for Parts") stats.waiting = s.count;
      if (s._id === "Ready") stats.ready = s.count;
      if (s._id === "Delivered") stats.delivered = s.count;
    });

    res.json({
      items,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      stats // Send aggregated stats
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// @route   DELETE /api/items/:id
// @desc    Soft delete an item
router.delete("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });

    item.isDeleted = true;
    await item.save();

    res.json({ msg: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
