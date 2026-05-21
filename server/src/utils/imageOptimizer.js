const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const IMAGE_PRESETS = {
  avatar: {
    fit: "cover",
    height: 480,
    quality: 82,
    width: 480,
  },
  portfolio: {
    fit: "inside",
    height: 1600,
    quality: 82,
    width: 1600,
  },
  service: {
    fit: "inside",
    height: 1200,
    quality: 82,
    width: 1200,
  },
  promotion: {
    fit: "inside",
    height: 1600,
    quality: 82,
    width: 1600,
  },
};

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function parseImageDataUrl(imageFile, label = "image") {
  if (!imageFile?.data || !imageFile?.type) {
    return null;
  }

  const match = imageFile.data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error(`Invalid ${label} file`);
  }

  const mimeType = match[1].toLowerCase();

  if (mimeType !== imageFile.type.toLowerCase() || !allowedImageTypes.has(mimeType)) {
    throw new Error(`Unsupported ${label} file type`);
  }

  return Buffer.from(match[2], "base64");
}

async function optimizeImageFile({
  imageFile,
  outputDir,
  publicDir,
  preset = "portfolio",
  label = "image",
}) {
  const buffer = parseImageDataUrl(imageFile, label);

  if (!buffer) {
    return null;
  }

  const options = IMAGE_PRESETS[preset] ?? IMAGE_PRESETS.portfolio;
  const fileName = `${Date.now()}-${crypto.randomUUID()}.webp`;
  const outputPath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });

  await sharp(buffer, { animated: false })
    .rotate()
    .resize({
      fit: options.fit,
      height: options.height,
      withoutEnlargement: true,
      width: options.width,
    })
    .webp({ quality: options.quality })
    .toFile(outputPath);

  return `${publicDir}/${fileName}`;
}

module.exports = {
  optimizeImageFile,
};
