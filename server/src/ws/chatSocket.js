const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const corsOrigins = require("../config/corsOrigins");
const ChatService = require("../services/ChatService");

const MAX_MESSAGE_LENGTH = 1000;

function roomName(chatId) {
  return `chat:${chatId}`;
}

function initChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const { user } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (!user?.id) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = user;
      return next();
    } catch (error) {
      console.log("======== chatSocket.auth =========");
      console.log(error);
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat:join", async (payload) => {
      const chatId = Number(payload?.chatId);

      if (!Number.isInteger(chatId)) {
        return;
      }

      const chat = await ChatService.ensureParticipant(chatId, socket.data.user.id);

      if (!chat) {
        socket.emit("chat:error", { message: "Чат не найден" });
        return;
      }

      const previousChatId = socket.data.currentChatId;

      if (previousChatId && previousChatId !== chatId) {
        socket.leave(roomName(previousChatId));
      }

      socket.join(roomName(chatId));
      socket.data.currentChatId = chatId;

      const messages = await ChatService.findMessages(chatId);
      socket.emit("chat:history", { chatId, messages });
    });

    socket.on("message:send", async (payload) => {
      const chatId = Number(payload?.chatId);
      const text = typeof payload?.text === "string" ? payload.text.trim() : "";

      if (!Number.isInteger(chatId) || !text || text.length > MAX_MESSAGE_LENGTH) {
        return;
      }

      if (!socket.rooms.has(roomName(chatId))) {
        return;
      }

      const chat = await ChatService.ensureParticipant(chatId, socket.data.user.id);

      if (!chat) {
        socket.emit("chat:error", { message: "Чат не найден" });
        return;
      }

      const message = await ChatService.createMessage(
        chatId,
        socket.data.user.id,
        text,
      );

      io.to(roomName(chatId)).emit("message:new", { chatId, message });
    });

    socket.on("disconnect", () => {
      const chatId = socket.data.currentChatId;

      if (chatId) {
        socket.leave(roomName(chatId));
      }
    });
  });

  return io;
}

module.exports = initChatSocket;
