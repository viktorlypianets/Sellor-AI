import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export function generateAuthUrl(shop) {
  const state = crypto.randomBytes(16).toString("hex"); // nonce
  const redirectUri = encodeURIComponent(process.env.SHOPIFY_REDIRECT_URI);
  const scopes = process.env.SCOPES;

  return `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
}

export function verifyHmac(query) {
  const { hmac, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("&");

  const generatedHash = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return generatedHash === hmac;
}
