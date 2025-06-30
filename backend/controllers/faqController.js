import { OpenAI } from "openai";
import supabase from "../config/supabase.js";
import { getCuttentCustomer } from "../services/aiService.js";
const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const generateFAQs = async (productId, CusomterID) => {
  try {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    console.error(productError);
    if (productError) throw new Error("Product not found");

    const { data: similarFAQs } = await supabase
      .from("faqs")
      .select("question, answer")
      .eq("is_approved", true)
      .ilike("product->>category", `%${product.category}%`)
      .limit(5);

    const prompt = `
      Generate 5-7 common customer questions and answers for this product.
      Format as JSON array: [{question: string, answer: string}]
      
      Product Details:
      Title: ${product.title}
      Description: ${product.description}
      Tags: ${product.tags?.join(", ") || "none"}
      Category: ${product.category || "uncategorized"}
      
      Example FAQs from similar products:
      ${
        similarFAQs
          ?.map((f) => `Q: ${f.question}\nA: ${f.answer}`)
          .join("\n") || "none"
      }
      
      Include questions about:
      - Sizing/fit (if applicable)
      - Materials/quality
      - Care instructions
      - Shipping/returns
      - Product comparisons

      Format as JSON array: [{question: string, answer: string}]
      I have to get the FAQs in this format only: JSON.parse(completion.choices[0].message.content)["faqs"].
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful e-commerce assistant that generates accurate product FAQs.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    let generatedFAQs;
    try {
      console.log("Generated FAQs:", completion.choices[0].message.content);
      generatedFAQs = JSON.parse(completion.choices[0].message.content)["faqs"];
      if (!Array.isArray(generatedFAQs)) {
        throw new Error("Invalid FAQ format");
      }
    } catch (parseError) {
      console.error("Failed to parse generated FAQs:", parseError);
      throw new Error("AI response format error");
    }

    const { data: insertedFAQs, error: insertError } = await supabase
      .from("faqs")
      .insert(
        generatedFAQs.map((faq) => ({
          product_id: productId,
          question: faq.question,
          answer: faq.answer,
          source: "AI",
          is_approved: false,
        }))
      )
      .select();

    if (insertError) throw insertError;

    return insertedFAQs;
  } catch (error) {
    console.error("FAQ generation failed:", error);
    throw error;
  }
};

export const updateFAQ = async (faqId, updates) => {
  try {
    const { data: updatedFAQ, error } = await supabase
      .from("faqs")
      .update({
        ...updates,
      })
      .eq("id", faqId)
      .select()
      .single();

    if (error) throw error;

    return updatedFAQ;
  } catch (error) {
    console.error("FAQ update failed:", error);
    throw error;
  }
};

export const generateSEOMarkup = async (productId) => {
  try {
    const { data: faqs, error } = await supabase
      .from("faqs")
      .select("question, answer")
      .eq("product_id", productId)
      .eq("is_approved", true);

    if (error) throw error;

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    const { error: upsertError } = await supabase.from("seo_markup").upsert({
      product_id: productId,
      markup: faqSchema,
    });

    if (upsertError) throw upsertError;

    return faqSchema;
  } catch (error) {
    console.error("SEO markup generation failed:", error);
    throw error;
  }
};

export const bulkApproveFAQs = async (faqID) => {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .update({ is_approved: true })
      .eq("id", faqID)
      .eq("source", "AI")
      .select();

    if (error) throw error;

    await generateSEOMarkup(productId);

    return data;
  } catch (error) {
    console.error("Bulk approve failed:", error);
    throw error;
  }
};

export const getProductFAQs = async (productId) => {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    throw error;
  }
};

export const getSuggestedFAQs = async (productId) => {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to fetch suggested FAQs:", error);
    throw error;
  }
};

export const getAllFAQs = async (shopify_product_id) => {
  try {
    // Step 1: Get internal product ID
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("shopify_product_id", shopify_product_id)
      .single();

    if (productError) throw productError;
    if (!productData) throw new Error("Product not found");

    const productId = productData.id;

    const { data: faqData, error: faqError } = await supabase
      .from("faqs")
      .select("*")
      .eq("product_id", productId);

    if (faqError) throw faqError;

    return faqData;
  } catch (error) {
    console.error("Failed to fetch FAQs by Shopify product ID:", error);
    throw error;
  }
};

export const deleteFAQ = async (faqId) => {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .delete()
      .eq("id", faqId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to delete FAQ:", error);
    throw error;
  }
};

export const getViewsCount = async (productId) => {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("view")
      .eq("product_id", productId);

    if (error) throw error;

    const totalViews =
      data?.reduce((sum, row) => sum + (row.view || 0), 0) || 0;

    return totalViews;
  } catch (error) {
    console.error("Failed to get views count:", error);
    throw error;
  }
};

export const incrementViewCount = async (faqId) => {
  try {
    const { data: faq, error: getError } = await supabase
      .from("faqs")
      .select("view")
      .eq("id", faqId)
      .single();
    if (getError) throw getError;

    const { data: updatedFAQ, error: faqError } = await supabase
      .from("faqs")
      .update({ view: (faq.view || 0) + 1 })
      .eq("id", faqId)
      .select()
      .single();
    if (faqError) throw faqError;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const columnToUpdate = days[today.getDay()];

    const { data: viewRow, error: viewGetError } = await supabase
      .from("views")
      .select("*")
      .eq("faqs_id", faqId)
      .single();

    if (viewGetError && viewGetError.code !== "PGRST116") throw viewGetError;

    if (viewRow) {
      const newValue = (viewRow[columnToUpdate] || 0) + 1;
      const { error: updateError } = await supabase
        .from("views")
        .update({ [columnToUpdate]: newValue })
        .eq("faqs_id", faqId);
      if (updateError) throw updateError;
    } else {
      const insertData = { faqs_id: faqId, [columnToUpdate]: 1 };
      const { error: insertError } = await supabase
        .from("views")
        .insert(insertData);
      if (insertError) throw insertError;
    }

    return updatedFAQ;
  } catch (error) {
    console.error("Failed to increment view count:", error);
    throw error;
  }
};

export const getWeeklyFAQs = async (productId) => {
  try {
    // 1. Get all faqs for the product
    const { data: faqs, error: faqsError } = await supabase
      .from("faqs")
      .select("id")
      .eq("product_id", productId);

    if (faqsError) throw faqsError;
    if (!faqs || faqs.length === 0) {
      return {
        total: 0,
        week: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
      };
    }

    const faqIds = faqs.map((f) => f.id);

    // 2. Get all views rows for these faqs
    const { data: views, error: viewsError } = await supabase
      .from("views")
      .select("*")
      .in("faqs_id", faqIds);

    if (viewsError) throw viewsError;

    // 3. Sum up the weekly columns
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const week = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    let total = 0;

    for (const row of views) {
      for (const day of days) {
        const count = row[day] || 0;
        week[day] += count;
        total += count;
      }
    }

    return { total, week };
  } catch (error) {
    console.error("Failed to get weekly viewed:", error);
    throw error;
  }
};

export const getMostViewedFAQs = async (productId) => {
  try {
    const { data: faqs, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("product_id", productId)
      .order("view", { ascending: false })
      .limit(5);

    if (error) throw error;

    return faqs;
  } catch (error) {
    console.error("Failed to get most viewed FAQs:", error);
    throw error;
  }
};
