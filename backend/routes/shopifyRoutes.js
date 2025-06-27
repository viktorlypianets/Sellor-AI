// src/routes/shopifyRoutes.js
import express from "express";
import dotenv from "dotenv";
import {
  fetchAndSyncProducts,
  fetchShopifyPolicies,
} from "../services/shopifyService.js";
import supabase from "../config/supabase.js";

dotenv.config();

const router = express.Router();

router.get("/sync-products", async (req, res) => {
  /////fetch products from shopify and sync with supabase and return
  try {
    const shopifyDomain = process.env.SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_TOKEN;

    if (!shopifyDomain || !accessToken) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const products = await fetchAndSyncProducts(shopifyDomain, accessToken);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/sync-policies", async (req, res) => {
  try {
    const shopifyDomain = process.env.SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_TOKEN;
    const storeId = "eac256ba-4c4b-494d-bd21-c60823a815d6";

    const policies = await fetchShopifyPolicies(shopifyDomain, accessToken);

    const policiesToInsert = policies.map((policy) => ({
      store_id: storeId,
      policy_type: policy.handle,
      content: policy.body,
    }));

    const { data: insertedPolicies, error } = await supabase
      .from("policy_documents")
      .upsert(policiesToInsert)
      .select();

    if (error) throw error;

    res.json(insertedPolicies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// router.post("/webhooks/products/update", async (req, res) => {
//   try {
//     const hmac = req.headers["x-shopify-hmac-sha256"];
//     const valid = verifyWebhook(req.body, hmac);

//     if (!valid) return res.status(401).send();

//     const shopifyDomain = req.headers["x-shopify-shop-domain"];
//     const productData = req.body;

//     await handleProductWebhook(shopifyDomain, productData);
//     res.status(200).send();
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// function verifyWebhook(body, hmac) {
//   const calculatedHmac = crypto
//     .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
//     .update(JSON.stringify(body))
//     .digest("base64");
//   return calculatedHmac === hmac;
// }

export default router;
