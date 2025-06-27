import express from "express";
import { scheduleFAQs, manualFAQGeneration } from "../services/cronService.js";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/cron/faq", async (req, res) => {
  try {
    const results = await manualFAQGeneration(req.body.productIds || []);
    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/log", async (req, res) => {
  const { level, message, metadata } = req.body;

  try {
    await supabase.from("logs").insert({
      level,
      message,
      metadata: metadata || null,
    });

    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
