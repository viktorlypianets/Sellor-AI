import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  const { storeId, products } = req.body;
  try {
    const { data, error } = await supabase
      .from("products")
      .upsert(
        products.map((p) => ({
          store_id: storeId,
          shopify_product_id: p.id,
          title: p.title,
          description: p.body_html,
          tags: p.tags,
          metafields: p.metafields,
        }))
      )
      .select();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/sync-products", async (req, res) => {
  try {
    const { data, error } = await supabase.from("products").select("*");

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/config", async (req, res) => {
  const shopifyDomain = process.env.SHOP_DOMAIN;
  const access_token = process.env.SHOPIFY_TOKEN;

  try {
    const { data, error } = await supabase
      .from("stores")
      .upsert({ shopify_domain: shopifyDomain, access_token: access_token })
      .select();

    res.json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
