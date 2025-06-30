import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import productRoutes from "./routes/productRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
// import policyRoutes from "./routes/PolicyRoutes.js";
import utilityRoutes from "./routes/utilityRoutes.js";
import shopifyRoutes from "./routes/shopifyRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
// import customer
import { initScheduledJobs } from "./services/cronService.js";
import crypto from "crypto";
import { saveAndGenerateFAQ } from "./services/shopifyService.js";
import {
  generateAuthUrl,
  verifyHmac,
} from "./controllers/shopifyController.js";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(morgan("dev"));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // Save raw buffer for signature validation
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static(path.join(__dirname, "../frontend/build")));
app.use("/widget", express.static(path.join(__dirname, "../widget")));

initScheduledJobs();

app.use("/api/products", productRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/utility", utilityRoutes);
app.use("/api/shopify", shopifyRoutes);

app.post("/webhooks/products-create", async (req, res) => {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  const rawBody = req.rawBody;
  const secret = process.env.SHOIPFY_SHARED_SECRET;

  try {
    const hash = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    if (hash === hmacHeader) {
      console.log("✅ Verified webhook from Shopify");
      console.log("📦 Order created:", req.body.id);

      await saveAndGenerateFAQ(req.body.id);

      console.log("Product ID:", req.body.id);
      res.sendStatus(200);
    } else {
      console.warn("⚠️ HMAC validation failed");
      res.sendStatus(403);
    }
  } catch (error) {
    console.error("🔥 Error validating webhook", error);
    res.sendStatus(500);
  }
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
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    };

    const response = await axios.post(
      accessTokenRequestUrl,
      accessTokenPayload
    );
    const { access_token } = response.data;
    console.log("Access Token:", access_token);
    // token = access_token;

    const FRONTEND_URL = process.env.FRONTEND_URLL || "http://localhost:3000";
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

const PORT = process.env.PORT || 5000;

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Cron jobs initialized");
});
