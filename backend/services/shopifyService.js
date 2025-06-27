import supabase from "../config/supabase.js";
import axios from "axios";
import { generateEmbedding } from "./aiService.js";
import { generateFAQs } from "../controllers/faqController.js";

export const fetchAndSyncProducts = async (shopifyDomain, accessToken) => {
  try {
    const store = await verifyStoreSetup(shopifyDomain, accessToken);
    if (!store) throw new Error("Store setup failed");

    const products = await fetchShopifyProducts(shopifyDomain, accessToken);
    if (!products?.length) return [];

    const results = [];
    const BATCH_SIZE = 10;
    const EMBEDDING_CONCURRENCY = 3;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (product) => {
          try {
            const productData = {
              store_id: store.id,
              shopify_product_id: product.id.toString(),
              title: product.title,
              description: product.body_html,
              tags: product.tags ? product.tags.split(", ") : [],
              metafields: product.metafields || null,
            };
            const { data: insertedProduct, error } = await supabase
              .from("products")
              .upsert(productData, {
                onConflict: "store_id,shopify_product_id",
              })
              .select()
              .single();

            if (error) throw error;

            setTimeout(async () => {
              try {
                await generateAndStoreProductEmbeddings(insertedProduct);
                await generateFAQs(insertedProduct.id);
              } catch (embeddingError) {
                console.error(
                  `Failed to generate embeddings for product ${insertedProduct.id}:`,
                  embeddingError
                );
              }
            }, 0);

            return insertedProduct;
          } catch (productError) {
            console.error(
              `Failed to process product ${product.id}:`,
              productError
            );
            return null;
          }
        })
      );

      results.push(...batchResults.filter(Boolean));

      if (i + BATCH_SIZE < products.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second between batches
      }
    }

    return results;
  } catch (error) {
    console.error("Product sync failed:", error);
    throw error;
  }
};

export const fetchShopifyPolicies = async (shopifyDomain, accessToken) => {
  try {
    const url = `https://${shopifyDomain}/admin/api/2024-01/policies.json`;
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });
    return response.data.policies;
  } catch (error) {
    console.error(
      "Error fetching Shopify policies:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const verifyStoreSetup = async (shopifyDomain, accessToken) => {
  try {
    const { data: existingStore, error: fetchError } = await supabase
      .from("stores")
      .select("*")
      .eq("shopify_domain", shopifyDomain)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existingStore) {
      if (existingStore.access_token !== accessToken) {
        const { data: updatedStore, error: updateError } = await supabase
          .from("stores")
          .update({
            access_token: accessToken,
          })
          .eq("id", existingStore.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedStore;
      }
      return existingStore;
    }

    const shopUrl = `https://${shopifyDomain}/admin/api/2024-01/shop.json`;
    const response = await axios.get(shopUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    });

    const shopData = response.data.shop;

    const { data: newStore, error: createError } = await supabase
      .from("stores")
      .insert({
        shopify_domain: shopifyDomain,
        access_token: accessToken,
        shop_name: shopData.name,
        email: shopData.email,
      })
      .select()
      .single();

    if (createError) throw createError;
    return newStore;
  } catch (error) {
    console.error("Store verification failed:", error);
    throw new Error(`Store setup failed: ${error.message}`);
  }
};

export const saveAndGenerateFAQ = async (productId) => {
  try {
    const shopifyDomain = process.env.SHOP_DOMAIN;
    const accessToken = process.env.SHOPIFY_TOKEN;
    const url = `https://${shopifyDomain}/admin/api/2024-01/products/${productId}.json`;
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    const store = await verifyStoreSetup(shopifyDomain, accessToken);
    if (!store) throw new Error("Store setup failed");
    const product = response.data.product;
    if (!product) throw new Error("Product not found on Shopify");

    const productData = {
      store_id: store.id,
      shopify_product_id: product.id.toString(),
      title: product.title,
      description: product.body_html,
      tags: product.tags ? product.tags.split(", ") : [],
      metafields: product.metafields || null,
      image_URL: product.images.src,
    };

    const { data: insertedProduct, error } = await supabase
      .from("products")
      .upsert(productData, {
        onConflict: "store_id,shopify_product_id",
      })
      .select()
      .single();

    if (error) throw error;

    setTimeout(async () => {
      try {
        await generateAndStoreProductEmbeddings(insertedProduct);
        console.log(`Embeddings generated for product ${insertedProduct.id}`);
      } catch (embeddingError) {
        console.error(
          `Failed to generate embeddings for product ${insertedProduct.id}:`,
          embeddingError
        );
      }
    }, 0);

    const faqs = await generateFAQs(insertedProduct.id);

    return { product: insertedProduct, faqs };
  } catch (error) {
    console.error("saveAndGenerateFAQ failed:", error);
    throw error;
  }
};

async function generateAndStoreProductEmbeddings(product) {
  const textContent = [
    `Title: ${product.title}`,
    `Description: ${product.description}`,
    `Tags: ${product.tags?.join(", ") || "none"}`,
    `Metafields: ${JSON.stringify(product.metafields) || "none"}`,
  ].join("\n");

  const chunks = chunkText(textContent);

  const embeddingPromises = chunks.map(async (chunk) => {
    const embedding = await generateEmbedding(chunk);
    const { data: insertedBatch, error: aaaerror } = await supabase
      .from("product_embeddings")
      .upsert({
        product_id: product.id,
        content: chunk,
        embedding,
      });
  });

  await Promise.all(embeddingPromises);
}

function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let index = 0;

  while (index < text.length) {
    chunks.push(text.slice(index, index + chunkSize));
    index += chunkSize - overlap;
  }

  return chunks.filter((chunk) => chunk.trim().length > 50);
}

const fetchShopifyProducts = async (shopifyDomain, accessToken) => {
  try {
    const url = `https://${shopifyDomain}/admin/api/2024-01/products.json`;
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });
    return response.data.products;
  } catch (error) {
    console.error(
      "Error fetching Shopify products:",
      error.response?.data || error.message
    );
    throw error;
  }
};
