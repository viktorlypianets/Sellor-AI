import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/widget", async (req, res) => {
  const { storeId, position, tone, color_theme } = req.body;

  const { data, error } = await supabase
    .from("widget_settings")
    .upsert(
      {
        store_id: storeId,
        position,
        color_theme,
        tone,
      },
      { onConflict: "store_id" } // important!
    )
    .select();

  if (error) {
    console.error("Error updating widget settings:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data: data });
});

router.get("/unanswered/:productId", async (req, res) => {
  const { productId } = req.params;

  const { data, error } = await supabase
    .from("unanswered_questions")
    .select("*")
    .eq("product_id", productId);

  if (error) {
    console.error("Error fetching unanswered questions:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data: data }); // return the matched records
});
/*
router.get("/insights/:storeId", async (req, res) => {
  const { storeId } = req.params;

  const { data: faqViews } = await supabase
    .from("faq_views")
    .select("*")
    .eq("store_id", storeId);

  const { data: unanswered } = await supabase
    .from("unanswered_questions")
    .select("*")
    .eq("store_id", storeId);

  res.json({ faqViews, unanswered });
});*/

export default router;
