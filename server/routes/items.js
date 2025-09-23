

// server/routes/items.js
import express from "express";
import Item from "../models/item.js";

const router = express.Router();

// @route   POST /api/items
// @desc    Create new item
router.post("/", async (req, res) => {
  try {
    const { jobNumber, customerName, brand } = req.body;

    const newItem = new Item({ jobNumber, customerName, brand });
    const savedItem = await newItem.save();

    res.status(201).json(savedItem);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// @route   GET /api/items
// @desc    Get all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


// GET /api/items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }); // newest first
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
