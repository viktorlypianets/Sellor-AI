// src/controllers/faqController.js
import supabase from "../config/supabase.js";
import { OpenAI } from "openai";
import { schedule } from "node-cron";
import { generateFAQs } from "../controllers/faqController.js";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const scheduleFAQs = async () => {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("id, created_at")
      .not("id", "in", supabase.from("faqs").select("product_id"))
      .order("created_at", { ascending: false })
      .limit(10); 
      
    if (error) throw error;

    const results = [];
    for (const product of products) {
      try {
        const faqs = await generateFAQs(product.id);
        results.push({
          productId: product.id,
          status: "success",
          faqsGenerated: faqs.length,
        });
      } catch (genError) {
        results.push({
          productId: product.id,
          status: "failed",
          error: genError.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Scheduled FAQ generation failed:", error);
    throw error;
  }
};

export const initScheduledJobs = () => {
  schedule("0 2 * * *", async () => {
    console.log("Running scheduled FAQ generation...");
    try {
      const results = await scheduleFAQs();
      console.log("FAQ generation results:", results);
    } catch (error) {
      console.error("Scheduled job failed:", error);
    }
  });

  schedule("0 * * * *", () => {
    console.log("Cron health check:", new Date().toISOString());
  });
};

export const manualFAQGeneration = async (productIds = []) => {
  if (productIds.length === 0) {
    return scheduleFAQs(); 
  }

  const results = [];
  for (const productId of productIds) {
    try {
      const faqs = await generateFAQs(productId);
      results.push({
        productId,
        status: "success",
        faqsGenerated: faqs.length,
      });
    } catch (error) {
      results.push({
        productId,
        status: "failed",
        error: error.message,
      });
    }
  }

  return results;
};
