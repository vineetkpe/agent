import crypto from "crypto";

// Ensure the encryption key is a 32-byte hex string (64 characters)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard IV length

export function encrypt(text: string): string {
  if (!text) return "";
  
  // Validate encryption key length
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error("ENCRYPTION_KEY env variable must be a 64-character hex string (32 bytes)");
  }

  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:authTag:encryptedContent
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  // Validate encryption key length
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error("ENCRYPTION_KEY env variable must be a 64-character hex string (32 bytes)");
  }

  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const parts = encryptedText.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format. Expected iv:authTag:content");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedContent = Buffer.from(parts[2], "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedContent).toString("utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
