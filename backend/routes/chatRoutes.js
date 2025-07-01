import express from "express";
import axios from "axios";
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

  const aiResponse = await getAIResponse(sessionId, message);

  let finalVideoUrl = null;

  if (process.env.DID_API_KEY && process.env.DID_API_KEY.trim() !== "") {
    try {
      console.log("Attempting D-ID Clips API integration...");
      console.log(
        "D-ID API Key configured:",
        process.env.DID_API_KEY ? "Yes" : "No"
      );

      const didResponse = await axios.post(
        "https://api.d-id.com/clips",
        {
          presenter_id: "lily-ldwi8a_LdG",
          script: {
            type: "text",
            subtitles: "false",
            provider: {
              type: "microsoft",
              voice_id: "fr-FR-DeniseNeural",
            },
            input: aiResponse.substring(0, 500), // Limit text length
            ssml: "false",
          },
          config: {
            result_format: "mp4",
          },
          presenter_config: {
            crop: {
              type: "wide",
            },
          },
        },
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            authorization: `Basic ${process.env.DID_API_KEY}`,
          },
          timeout: 3000,
        }
      );

      const clipId = didResponse.data.id;
      console.log("D-ID Clip ID:", clipId);

      // Poll for video completion
      let videoReady = false;
      let attempts = 0;

      while (!videoReady && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds between checks

        const statusResponse = await axios.get(
          `https://api.d-id.com/clips/${clipId}`,
          {
            headers: {
              accept: "application/json",
              authorization: `Basic ${process.env.DID_API_KEY}`,
            },
            timeout: 5000,
          }
        );

        console.log(
          `Attempt ${attempts + 1}: Status -`,
          statusResponse.data.status
        );

        if (statusResponse.data.status === "done") {
          videoReady = true;
          finalVideoUrl = statusResponse.data.result_url;
          console.log("Video ready:", finalVideoUrl);
        } else if (statusResponse.data.status === "error") {
          console.error("D-ID processing failed:", statusResponse.data);
          break;
        }

        attempts++;
      }

      if (!videoReady) {
        console.log("Video generation timed out after 30 attempts");
      }
    } catch (didError) {
      console.error("D-ID Error Details:");
      console.error("Status:", didError.response?.status);
      console.error("Data:", didError.response?.data);
      console.error("Message:", didError.message);
      // Continue without video - just return text response
    }
  } else {
    console.log("No D-ID API key provided, skipping avatar generation");
    console.log(
      "To enable D-ID avatar generation, set DID_API_KEY environment variable"
    );
  }

  res.json({
    success: true,
    data: {
      answer: aiResponse,
      videoUrl: finalVideoUrl,
    },
  });
});

export default router;
