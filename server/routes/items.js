

// server/routes/items.js
import express from "express";
import Item from "../models/item.js";

const router = express.Router();

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

// @route   GET /api/items
// @desc    Get all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find({ isDeleted: false }).sort({ createdAt: -1 });
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
