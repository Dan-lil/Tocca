const crypto = require("crypto");

function getImageExtension(mimeType, fallback = "jpg") {
  const extensionByType = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return extensionByType[mimeType] ?? fallback;
}

function createSafeImageFileName(mimeType) {
  const extension = getImageExtension(mimeType);

  return `${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

module.exports = {
  createSafeImageFileName,
  getImageExtension,
};
