"use strict";

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const ENCRYPTED_PREFIX = "enc:v1";
const IV_LENGTH = 12;

function getEncryptionSecret() {
  const secret = process.env.CHAT_ENCRYPTION_KEY;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CHAT_ENCRYPTION_KEY is required in production");
  }

  return "tocca-local-chat-encryption-key-change-me";
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(getEncryptionSecret()).digest();
}

function isEncryptedText(value) {
  return typeof value === "string" && value.startsWith(`${ENCRYPTED_PREFIX}:`);
}

function encryptChatText(text) {
  const plainText = String(text ?? "");

  if (!plainText) {
    return plainText;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTED_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

function decryptChatText(text) {
  if (!isEncryptedText(text)) {
    return text;
  }

  const [, version, ivValue, authTagValue, encryptedValue] = text.split(":");

  if (version !== "v1" || !ivValue || !authTagValue || !encryptedValue) {
    return text;
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );

    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    console.log("======== decryptChatText =========");
    console.log(error);
    return "[Сообщение не удалось расшифровать]";
  }
}

module.exports = {
  decryptChatText,
  encryptChatText,
  isEncryptedText,
};
