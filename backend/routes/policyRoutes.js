import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/sync", async (req, res) => {
  const { storeId, policies } = req.body;

  const { data, error } = await supabase
    .from("policy_documents")
    .upsert(
      policies.map((p) => ({
        store_id: storeId,
        policy_type: p.type,
        content: p.body,
      }))
    )
    .select();

  res.json(data);
});

router.post("/translate", async (req, res) => {
  const { faqId, targetLang } = req.body;

  const { data: faq } = await supabase
    .from("faqs")
    .select("*")
    .eq("id", faqId)
    .single();

  const translation = await translateText(faq.answer, targetLang);

  res.json({
    ...faq,
    translated_answer: translation,
  });
});

async function translateText(text, targetLang) {
  // Implementation using OpenAI or other translation service
}

export default router;
