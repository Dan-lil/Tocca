require("./config/loadEnv");
const express = require("express");
const apiRouter = require("./routes/apiRoute");

const serverConfig = require("./config/serverConfig");
const http = require("http");
const initChatSocket = require("./ws/chatSocket");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "localhost";
const app = express();

serverConfig(app);

app.use("/api", apiRouter);

const server = http.createServer(app);
initChatSocket(server);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Порт ${PORT} уже занят. Остановите другой процесс или укажите другой PORT в .env.`,
    );
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, HOST, () => {
  console.log(`Сервер запущен: http://${HOST}:${PORT}`);
});
