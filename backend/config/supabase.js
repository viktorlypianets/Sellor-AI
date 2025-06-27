// src/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Secret Key must be provided in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: false,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
      "X-Client-Info": "smartask-ai/1.0",
    },
  },
});

// Custom RPC functions for vector search
supabase.rpc("match_product_embeddings", async (params) => {
  const { query_embedding, match_threshold, match_count, product_id } = params;

  return supabase
    .from("product_embeddings")
    .select("content")
    .eq("product_id", product_id)
    .order("embedding <=> ${query_embedding}")
    .limit(match_count)
    .filter("embedding <=> ${query_embedding}", "lt", match_threshold);
});

supabase.rpc("match_knowledge_embeddings", async (params) => {
  const { query_embedding, match_threshold, match_count } = params;

  return supabase
    .from("knowledge_base")
    .select("content")
    .order("embedding <=> ${query_embedding}")
    .limit(match_count)
    .filter("embedding <=> ${query_embedding}", "lt", match_threshold);
});

supabase.rpc("match_policy_embeddings", async (params) => {
  const { query_embedding, match_threshold, match_count } = params;

  return supabase
    .from("policy_documents")
    .select("content")
    .order("embedding <=> ${query_embedding}")
    .limit(match_count)
    .filter("embedding <=> ${query_embedding}", "lt", match_threshold);
});

// Helper functions for embedding operations
supabase.generateEmbeddings = async (text) => {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-ada-002",
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
};

// Batch insert embeddings
supabase.batchInsertEmbeddings = async (table, records) => {
  const chunks = [];
  const chunkSize = 100; // Supabase batch limit

  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize));
  }

  const results = [];
  for (const chunk of chunks) {
    const { data, error } = await supabase.from(table).insert(chunk).select();

    if (error) throw error;
    results.push(...data);
  }

  return results;
};

// Custom error class for Supabase operations
class SupabaseError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "SupabaseError";
    this.details = details;
  }
}

// Wrapper for Supabase operations with error handling
supabase.safe = {
  async insert(table, record) {
    const { data, error } = await supabase.from(table).insert(record).select();

    if (error) throw new SupabaseError("Insert failed", error);
    return data;
  },

  async update(table, updates, match) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .match(match)
      .select();

    if (error) throw new SupabaseError("Update failed", error);
    return data;
  },

  async delete(table, match) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .match(match)
      .select();

    if (error) throw new SupabaseError("Delete failed", error);
    return data;
  },

  async query(table, select = "*", filter = {}) {
    let query = supabase.from(table).select(select);

    for (const [key, value] of Object.entries(filter)) {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;
    if (error) throw new SupabaseError("Query failed", error);
    return data;
  },
};

export default supabase;
