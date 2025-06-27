import express from "express";
import { OpenAI } from "openai";
import libretranslate from "libretranslate";
import {
  generateFAQs,
  updateFAQ,
  getAllFAQs,
  deleteFAQ,
  getViewsCount,
  incrementViewCount,
  getWeeklyFAQs,
  getMostViewedFAQs,
} from "../controllers/faqController.js";

const router = express.Router();
const openai = new OpenAI(process.env.OPENAI_API_KEY);

//Get all FAQs

router.get("/all", async (req, res) => {
  const { product_id, lang } = req.query;
  try {
    const faqs = await getAllFAQs(product_id);

    // If lang is "en" or not provided, return as is
    if (!lang || lang.toLowerCase() === "en") {
      return res.json({ success: true, data: faqs });
    }

    // Otherwise, translate each question and answer using OpenAI
    const translatedFaqs = [];
    for (const faq of faqs) {
      try {
        const prompt = `Translate the following text from English to ${lang}:\n\nQ: ${faq.question}\nA: ${faq.answer}\n\nReturn as JSON: {"question": "...", "answer": "..."}`;
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful translator." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const translated = JSON.parse(completion.choices[0].message.content);
        translatedFaqs.push({
          ...faq,
          question: translated.question,
          answer: translated.answer,
        });
      } catch (translateError) {
        // If translation fails, fallback to original
        translatedFaqs.push(faq);
      }
    }

    res.json({ success: true, data: translatedFaqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

router.get("/weekly/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const faq = await getWeeklyFAQs(id);
    res.json({ success: true, data: faq });
  } catch (error) {
    console.error("Error get weekly FAQ view count:", error);
    res.status(500).json({ error: "Failed to increment view count" });
  }
});

router.get("/most/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const faq = await getMostViewedFAQs(id);
    res.json({ success: true, data: faq });
  } catch (error) {
    console.error("Error get most FAQ view count:", error);
    res.status(500).json({ error: "Failed to increment view count" });
  }
});

router.get("/viewed/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const faq = await incrementViewCount(id);
    res.json({ success: true, data: faq });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ error: "Failed to increment view count" });
  }
});

// Update FAQ
router.post("/:id", async (req, res) => {
  const updatedFAQ = await updateFAQ(req.params.id, req.body);
  res.json({ success: true, data: updatedFAQ });
});

//delete FAQ
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedFAQ = await deleteFAQ(id);
    return res.status(200).json({
      success: true,
      data: id,
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({ error: "Failed to delete FAQ" });
  }
});

router.get("/seo/:productId", async (req, res) => {
  const { productId } = req.params;
  const markup = await generateSEOMarkup(productId);
  res.json(markup);
});

router.get("/insights/:productId", async (req, res) => {
  const { productId } = req.params;
  const count = await getViewsCount(productId);
  res.json({ success: true, data: count });
});

export default router;
