/**
 * Utilitário de Criptografia para Tokens Sensíveis
 * Usa AES-256-GCM para criptografar/descriptografar tokens OAuth2 no banco de dados.
 */
const crypto = require("crypto");
const config = require("../config/env");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Deriva uma chave de 32 bytes a partir da SECRET_KEY usando SHA-256
 */
function getEncryptionKey() {
  return crypto.createHash("sha256").update(config.secretKey).digest();
}

/**
 * Criptografa um texto puro usando AES-256-GCM
 * @param {string} plainText - Texto a criptografar
 * @returns {string} - String no formato "iv:authTag:ciphertext" (hex)
 */
function encrypt(plainText) {
  if (!plainText) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Descriptografa um texto criptografado com AES-256-GCM
 * @param {string} encryptedText - String no formato "iv:authTag:ciphertext" (hex)
 * @returns {string} - Texto puro descriptografado
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText;
    const [ivHex, authTagHex, ciphertext] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[CRYPTO] Falha ao descriptografar token:", error.message);
    return "";
  }
}

module.exports = { encrypt, decrypt };
