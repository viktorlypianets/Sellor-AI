const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const SHOPIFY_API_KEY = 0x12d38365aef5190ec24046b50e44cfb0;
const SHOPIFY_API_SECRET = 0x78571cdd27412a856a7706a39bf6977a;
const FRONTEND_URLL = "https://sellor-ai-1.onrender.com/";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend/build")));

// OpenAI Chat endpoint with D-ID Clips API
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    console.log("Received message:", message);
    //data base
    const productDatabase = `
                Tu es un assistant utile qui répond toujours en français. Réponses amicales, précises, et concises (moins de 100 mots).

                Voici les éléments disponibles sur notre site :

                1. **QR code de table** (Produit, €10.00)  
                Description : QR code imprimé à placer sur la table, permet aux clients d'accéder à des menus ou infos via leur smartphone.  
                Lien : https://gmpdeveloppement.fr/products/qr-code-de-table  
                FAQ : Peut être lavé ? Oui, standard d’impression résistante.

                2. **Votre chevalet google® NFC** (Produit, €49.00)  
                Description : Plaque en plexiglass 12 × 14 cm programmée pour recueillir des avis Google en 3 secondes, sans application.  
                Lien : https://gmpdeveloppement.fr/products/votre-chevalet-google  
                FAQ : Requis support ? Non, autonome, compatible Android & iPhone.

                3. **L'Importance des QR Codes...** (Article)  
                Description : Article de blog sur les bénéfices des QR codes pour les petits commerces : expérience client, visibilité, paiement rapide.  
                Lien : https://gmpdeveloppement.fr/blogs/news/limportance-des-qr-codes...  
                FAQ : QR codes augmentent-ils les ventes ? Oui, en fluidifiant le parcours.

                4. **Qui sommes-nous ?** (Info)  
                Description : Présentation de GMP Développement : fondée en 2021, mission d’accompagner la création de contenu visuel et storytelling digital.  
                Lien : https://gmpdeveloppement.fr/pages/qui-sommes-nous  
                FAQ : Où êtes-vous présents ? Rhône-Alpes, Île‑de‑France, Grand‑Ouest...
                `;
    // First, get OpenAI response
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: productDatabase,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = openaiResponse.data.choices[0].message.content;
    console.log("OpenAI Response:", aiResponse);

    // Try D-ID integration using Clips API
    let finalVideoUrl = null;

    if (process.env.DID_API_KEY && process.env.DID_API_KEY.trim() !== "") {
      try {
        console.log("Attempting D-ID Clips API integration...");

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
            timeout: 15000,
          }
        );

        const clipId = didResponse.data.id;
        console.log("D-ID Clip ID:", clipId);

        // Poll for video completion
        let videoReady = false;
        let attempts = 0;

        while (!videoReady && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 3000));

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
    }

    res.json({
      text: aiResponse,
      videoUrl: finalVideoUrl,
      success: true,
    });
  } catch (error) {
    console.error("Main Error Details:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);

    res.status(500).json({
      error: "Failed to process request",
      details: error.response?.data || error.message,
      success: false,
    });
  }
});

// Test D-ID connection
app.get("/api/test-did", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.d-id.com/clips",
      {
        presenter_id: "lily-ldwi8a_LdG",
        script: {
          type: "text",
          subtitles: "false",
          provider: { type: "microsoft", voice_id: "Sara" },
          input: "Testing D-ID connection",
          ssml: "false",
        },
        config: { result_format: "mp4" },
        presenter_config: { crop: { type: "wide" } },
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Basic ${process.env.DID_API_KEY}`,
        },
      }
    );

    res.json({
      success: true,
      clipId: response.data.id,
      message: "D-ID connection successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasDID: !!process.env.DID_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", port: PORT });
});

app.get("/auth", (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }
  const redirectUrl = generateAuthUrl(shop);
  res.redirect(redirectUrl);
});

app.get("/auth/callback", async (req, res) => {
  const { shop, code, hmac, state } = req.query;
  if (!verifyHmac(req.query)) {
    return res.status(400).send("HMAC validation failed");
  }
  try {
    const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
    const accessTokenPayload = {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    };
    const response = await axios.post(
      accessTokenRequestUrl,
      accessTokenPayload
    );
    const { access_token } = response.data;
    console.log("Access Token:", access_token);
    // token = access_token;
    const FRONTEND_URL = FRONTEND_URLL || "http://localhost:3000";
    res.redirect(`${FRONTEND_URL}`);
  } catch (error) {
    if (error.response) {
      console.error("Shopify Error:", error.response.data);
      return res.status(500).json({ error: error.response.data });
    } else {
      console.error("Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment check:");
  console.log(
    "- OpenAI API Key:",
    process.env.OPENAI_API_KEY ? "Present" : "Missing"
  );
  console.log(
    "- D-ID API Key:",
    process.env.DID_API_KEY ? "Present" : "Missing"
  );
  console.log("\nTest endpoints:");
  console.log("- http://localhost:5000/api/test");
  console.log("- http://localhost:5000/api/test-did");
});

// Shopify OAuth integration
