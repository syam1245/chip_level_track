

// server/routes/items.js
import express from "express";
import Item from "../models/item.js";

const router = express.Router();

// @route   GET /api/items/backup
// @desc    Download full database backup
router.get("/backup", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });

    // Create timestamp string like "2026-02-06-1205"
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

    // Validate phone number (must be 10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    const newItem = new Item({ jobNumber, customerName, brand, phoneNumber });
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
    const { customerName, brand, phoneNumber, status } = req.body;

    // Validate phone number if provided
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: "Item not found" });
    }

    item.customerName = customerName || item.customerName;
    item.brand = brand || item.brand;
    item.phoneNumber = phoneNumber || item.phoneNumber;
    item.status = status || item.status;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// @route   GET /api/items
// @desc    Get all items
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search, "i"); // Case-insensitive
      query.$or = [
        { customerName: searchRegex },
        { brand: searchRegex },
        { jobNumber: searchRegex },
        { phoneNumber: searchRegex }
      ];
    }

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// @route   DELETE /api/items/:id
// @desc    Soft delete an item
router.delete("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: "Item not found" });
    }

    item.isDeleted = true;
    await item.save();

    res.json({ msg: "Item removed" });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Item not found" });
    }
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
