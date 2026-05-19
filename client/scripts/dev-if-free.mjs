import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";

const port = 5173;
const nextBin = fileURLToPath(import.meta.resolve("next/dist/bin/next"));

function checkExistingServer() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: "localhost",
        port,
        path: "/",
        timeout: 1000,
      },
      (response) => {
        response.resume();
        resolve({
          isRunning: true,
          poweredBy: response.headers["x-powered-by"],
        });
      },
    );

    request.on("error", () => {
      resolve({ isRunning: false });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({ isRunning: true });
    });
  });
}

async function main() {
  const server = await checkExistingServer();

  if (server.isRunning) {
    if (server.poweredBy === "Next.js") {
      console.log(`Client dev server is already running: http://localhost:${port}`);
      process.exit(0);
    }

    console.error(`Port ${port} is already in use by another process.`);
    console.error("Close that process or change the client dev port.");
    process.exit(1);
  }

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main();
