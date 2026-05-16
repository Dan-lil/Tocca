const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(__dirname, "../../.env"),
  path.join(__dirname, "../../../.env"),
];

for (const envPath of candidates) {
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}