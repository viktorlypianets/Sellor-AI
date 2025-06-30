import supabase from "../config/supabase.js";
import { OpenAI } from "openai";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

let savedUnansweredQuestions = {
  flag: true,
  question: "",
  answer: "",
  sessionId: "",
};

export const getAIResponse = async (sessionId, message, customerId) => {
  let responseMessage = "";
  let context = "";

  try {
    context = await getRelevantContext(message, sessionId, "8417072578653");

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Answer based on this context: ${context}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    responseMessage = response.choices[0].message.content;

    // Save unanswered question if needed
    if (savedUnansweredQuestions.flag === false) {
      savedUnansweredQuestions.flag = true;
      await logUnansweredQuestion(
        savedUnansweredQuestions.question,
        sessionId,
        responseMessage
      );
    }
  } catch (error) {
    if (error.code === "insufficient_quota" || error.status === 429) {
      console.error("⚠️ OpenAI quota exceeded:", error.message);
      responseMessage =
        "Our AI assistant is currently over its usage limit. Please try again in a few minutes.";
    } else {
      console.error("❌ Unexpected error in getAIResponse:", error);
      responseMessage =
        "Oops! Something went wrong while generating the answer. Please try again later.";
    }
  }

  return {
    answer: responseMessage,
    context: context,
  };
};

const getRelevantContext = async (query, sessionId, customerId) => {
  try {
    let context = await getSemanticContext(query, sessionId, {
      productThreshold: 0.9,
      knowledgeThreshold: 0.8,
      policyThreshold: 0.75,
    });

    // if (!context) {
    //   context = await getSemanticContext(query, sessionId, {
    //     productThreshold: 0.65,
    //     knowledgeThreshold: 0.7,
    //     policyThreshold: 0.6,
    //   });
    // }

    if (!context) {
      const { data: product } = await getCurrentProduct(sessionId);
      const { data: customerData } = await getCuttentCustomer(sessionId);
      const { data: orderData } = await getCurrentOrder(customerData.id);

      console.log("orderData:", orderData);

      console.log("product:", customerData);
      if (product) {
        const isRelevant = await checkProductRelevance(query, product);
        const isRelevant1 = await checkCustomerRelevance(query, customerData);
        console.log("customerData:", customerData);

        console.log(isRelevant1);

        // if (isRelevant || isRelevant1) {
        //   context = `Product Details:\nTitle: ${product.title}\nDescription: ${product.description},
        //   Customer Details:\n Email:${customerData.email} \n First_Name : ${customerData.first_name},Lastname :${customerData.last_name}
        //   `;
        // } else {
        //   savedUnansweredQuestions.flag = false;
        //   savedUnansweredQuestions.question = query;
        //   savedUnansweredQuestions.sessionId = sessionId;
        //   return "I don't have specific details about that feature.";
        // }
        // console.log("orderData:", orderData);
        // context += `\n\nOrder Details:\n${orderData}`;
        context = `Product Details:\nTitle: ${product.title}\nDescription: ${
          product.description
        },
          Customer Details:\n Email:${customerData.email} \n First_Name : ${
          customerData.first_name
        },Lastname :${customerData.last_name},
          Order Details:\n ${JSON.stringify(orderData)}
          `;
      }
    }
    console.log(context);
    return context || "No relevant information found";
  } catch (error) {
    console.error("Context retrieval error:", error);
    return "I couldn't retrieve product information at this time";
  }
};

async function getSemanticContext(query, sessionId, thresholds) {
  const embedding = await generateEmbedding(query);

  console.log(embedding.length);

  const { data: product } = await supabase.rpc("match_product_embeddings", {
    query_embedding: embedding,
    match_threshold: thresholds.productThreshold,
    match_count: 3,
  });

  const { data: knowledge } = await supabase.rpc("match_knowledge_embeddings", {
    query_embedding: embedding,
    match_threshold: thresholds.knowledgeThreshold,
    match_count: 2,
  });

  return [...(product || []), ...(knowledge || [])]
    .map((item) => item.content)
    .join("\n\n");
}

const getCurrentProduct = async (sessionId) => {
  if (!sessionId) {
    console.error("No session ID provided");
    return null;
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("product_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session?.product_id) {
      console.error("Session lookup failed:", {
        sessionId,
        error: sessionError?.message || "No product associated",
      });
      return null;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("title, description, metafields, tags")
      .eq("id", session.product_id)
      .maybeSingle();

    if (productError || !product) {
      console.error("Product lookup failed:", {
        productId: session.product_id,
        error: productError?.message || "Product not found",
      });
      return null;
    }

    return {
      id: session.product_id,
      data: {
        ...product,
      },
    };
  } catch (error) {
    console.error("Unexpected error in getCurrentProduct:", {
      sessionId,
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
};

export const getCuttentCustomer = async (sessionId) => {
  if (!sessionId) {
    console.error("No session ID provided");
    return null;
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("customer_id")
      .eq("id", sessionId)
      .maybeSingle();

    console.log("session:", session);

    if (sessionError || !session?.customer_id) {
      console.error("Session lookup failed Customer:", {
        sessionId,
        error: sessionError?.message || "No Customer associated",
      });
      return null;
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, email, first_name, last_name, created_at")
      .eq("id", session.customer_id)
      .maybeSingle();

    if (customerError || !customer) {
      console.error("Customer lookup failed:", {
        customerID: session.customer_id,
        error: customerError?.message || "Customer not found",
      });
      return null;
    }

    return {
      id: session.customer_id,
      data: {
        ...customer,
      },
    };
  } catch (error) {
    console.error("Unexpected error in getCurrentCustomer:", {
      sessionId,
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
};

const getCurrentOrder = async (customerId) => {
  if (!customerId) {
    console.error("No customer ID provided");
    return null;
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, fulfillment_status, financial_status, total_price, currency"
      )
      .eq("customer_id", customerId);

    if (orderError || !order) {
      console.error("Order lookup failed:", {
        customerId,
        error: orderError?.message || "Order not found",
      });
      return null;
    }

    return {
      id: order.id,
      data: {
        ...order,
      },
    };
  } catch (error) {
    console.error("Unexpected error in getCurrentOrder:", {
      customerId,
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
};

export const generateEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
};

async function logUnansweredQuestion(question, sessionId, answer) {
  try {
    let productId = null;
    if (sessionId) {
      console.log("sessionId:", sessionId);
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("product_id")
        .eq("id", sessionId)
        .maybeSingle();
      console.log("data:", session);
      productId = session?.product_id;
    }

    const { error } = await supabase.from("unanswered_questions").insert({
      question,
      product_id: productId,
      created_at: new Date().toISOString(),
      answer: answer,
    });

    if (error) throw error;
  } catch (loggingError) {
    console.error("Failed to log unanswered question:", loggingError);
  }
}

const checkProductRelevance = async (query, product) => {
  const prompt = `
    Determine if this product information is relevant to the customer query.
    Respond ONLY with "true" or "false".
    

    QUERY: "${query}"
    
    PRODUCT TITLE: ${product.title}
    PRODUCT DESCRIPTION: ${product.description}
    PRODUCT TAGS: ${product.tags?.join(", ") || "none"}

    Don't Respond with any other text.
    Only respond with "true" or "false" and remember.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a product relevance classifier. Analyze if the product matches the query.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1,
    });

    const answer = response.choices[0].message.content.toLowerCase().trim();
    return answer === "true";
  } catch (error) {
    console.error("OpenAI relevance check failed:", error);
    return true;
  }
};

const checkCustomerRelevance = async (query, customer) => {
  const prompt = `
    Determine if this customer information is relevant to the customer query.
    Respond ONLY with "true" or "false".
    

    QUERY: "${query}"
    
    Customer's profile info:

    customer's email ${customer.email}
    customer's full name: "${customer.last_name} ${customer.first_name} "

    Don't Respond with any other text.
    Only respond with "true" or "false" and remember.
  `;

  console.log(prompt);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a classifier that checks if the information provided answers the customer query. Respond only with true or false.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1,
    });

    const answer = response.choices[0].message.content.toLowerCase().trim();
    return answer === "true";
  } catch (error) {
    console.error("OpenAI relevance check failed:", error);
    return true;
  }
};
