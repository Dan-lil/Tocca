require("../src/config/loadEnv");

const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { MasterPortfolio, Sale, Servizi, User, sequelize } = require("../src/db/models");

const publicRoot = path.join(__dirname, "../src/public");
const convertibleExtensions = new Set([".jpg", ".jpeg", ".png"]);

function isLocalPublicImage(value) {
  if (!value || typeof value !== "string") return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;

  return convertibleExtensions.has(path.extname(value).toLowerCase());
}

function getPublicFilePath(publicUrl) {
  const cleanUrl = publicUrl.split("?")[0];

  return path.join(publicRoot, cleanUrl.replace(/^\/+/, ""));
}

async function optimizePublicImage(publicUrl) {
  if (!isLocalPublicImage(publicUrl)) {
    return publicUrl;
  }

  const sourcePath = getPublicFilePath(publicUrl);
  const parsedPath = path.parse(sourcePath);
  const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);
  const outputUrl = publicUrl.replace(/\.(jpe?g|png)$/i, ".webp");

  try {
    await fs.access(sourcePath);

    await sharp(sourcePath, { animated: false })
      .rotate()
      .resize({
        fit: "inside",
        height: 1600,
        width: 1600,
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(outputPath);

    return outputUrl;
  } catch (error) {
    console.warn(`Skip ${publicUrl}: ${error.message}`);

    return publicUrl;
  }
}

async function optimizeSingleField(Model, fieldName) {
  const rows = await Model.findAll();
  let updatedCount = 0;

  for (const row of rows) {
    const currentValue = row[fieldName];
    const nextValue = await optimizePublicImage(currentValue);

    if (nextValue !== currentValue) {
      await row.update({ [fieldName]: nextValue });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function optimizePortfolioImages() {
  const rows = await MasterPortfolio.findAll();
  let updatedCount = 0;

  for (const row of rows) {
    const currentValue = row.portfolioImages;

    if (!currentValue) continue;

    const nextImages = await Promise.all(
      currentValue
        .split(",")
        .map((imageUrl) => imageUrl.trim())
        .filter(Boolean)
        .map((imageUrl) => optimizePublicImage(imageUrl)),
    );
    const nextValue = nextImages.join(", ");

    if (nextValue && nextValue !== currentValue) {
      await row.update({ portfolioImages: nextValue });
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function main() {
  const [users, services, sales, portfolios] = await Promise.all([
    optimizeSingleField(User, "avatar"),
    optimizeSingleField(Servizi, "image"),
    optimizeSingleField(Sale, "image"),
    optimizePortfolioImages(),
  ]);

  console.log({
    portfolios,
    sales,
    services,
    users,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
