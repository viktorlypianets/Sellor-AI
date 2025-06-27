import express from "express";
import supabase from "../config/supabase.js";
import { getAIResponse } from "../services/aiService.js";

const router = express.Router();

// Start chat session
router.post("/session", async (req, res) => {
  const { productId, customerId, session_data } = req.body;
  try {
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("shopify_product_id", productId)
      .single();

    if (productError) throw productError;
    if (!productData) throw new Error("Product not found");

    const product_Id = productData.id;
    // Check if a session with this product_id exists
    const { data: existing, error: findError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("product_id", product_Id)
      .single();

    let result, error;
    if (existing) {
      // Update session_data if exists
      const { data: updated, error: updateError } = await supabase
        .from("chat_sessions")
        .update({ session_data })
        .eq("product_id", product_Id)
        .select();
      result = updated;
      error = updateError;
    } else {
      // Insert new session if not exists
      if (!customerId) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("shopify_customer_id", customerId)
          .single();

        const { data: inserted, error: insertError } = await supabase
          .from("chat_sessions")
          .insert({
            product_id: product_Id,
            customer_id: customerData,
            session_data,
            msged: false,
          })
          .select();

        result = inserted;
        error = insertError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("chat_sessions")
          .insert({
            product_id: product_Id,
            session_data,
            msged: false,
          })
          .select();

        result = inserted;
        error = insertError;
      }
    }

    if (error) {
      console.error("Error creating/updating chat session:", error);
      return res.status(200).json({ success: false, data: error.message });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, data: error.message });
  }
});

//chat_open
router.get("/open", async (req, res) => {
  try {
    const { count: total, error: totalError } = await supabase
      .from("chat_sessions")
      .select("id", { count: "exact", head: true });

    if (totalError) return res.status(500).json({ error: totalError.message });

    const { count: trueCount, error: trueError } = await supabase
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("msged", true);

    if (trueError) return res.status(500).json({ error: trueError.message });

    const rate = total === 0 ? 0 : trueCount / total;

    res.json({ success: true, data: { total, trueCount, rate } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/message", async (req, res) => {
  const { sessionId, message } = req.body;

  await supabase
    .from("chat_sessions")
    .update({ msged: true })
    .eq("id", sessionId);

  const response = await getAIResponse(sessionId, message);

  res.json({ success: true, data: response });
});

export default router;
