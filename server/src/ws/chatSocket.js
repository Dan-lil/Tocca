const { Server } = require('socket.io');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const corsOrigins = require("../config/corsOrigins");


const CHANNELS = [
  { id: 'laugh', emoji: '🤣', label: 'Laugh' },
  { id: 'trouble', emoji: '😢', label: 'Trouble' },
  { id: 'rant', emoji: '😡', label: 'Rant' },
  { id: 'gossip', emoji: '🤭', label: 'Gossip' },
];

const ALLOWED_CHANNEL_IDS = new Set(CHANNELS.map((channel) => channel.id));
const MAX_MESSAGE_LENGTH = 1000;

const messagesByChannel = new Map();

for (const id of ALLOWED_CHANNEL_IDS) {
  messagesByChannel.set(id, []);
}

function roomName(channelId) {
  return `channel:${channelId}`;
}

function pushMessage(channelId, message) {
  const messages = messagesByChannel.get(channelId);
  if (!messages) {
    return;
  }
  messages.push(message);
}

function initChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const auth = socket.handshake.auth || {};
    const token = auth.token;
    const nickname =
      typeof auth.nickname === 'string' ? auth.nickname.trim() : '';
    if (token) {
      try {
        const { user } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (user?.name) {
          socket.data.displayName = String(user.name).slice(0, 50);
          return next();
        }
      } catch (error) {
        console.log(error);
      }
    }
    const name = nickname.slice(0, 50);
    socket.data.displayName = name || 'Гость';
    next();
  });

  io.on('connection', (socket) => {
    socket.emit('chat:init', { channels: CHANNELS });

    socket.on('channel:join', (payload) => {
      const channelId = payload?.channelId;
      if (!ALLOWED_CHANNEL_IDS.has(channelId)) return;
      const prev = socket.data.currentChannelId;
      if (prev && prev !== channelId) {
        socket.leave(roomName(prev));
      }
      socket.join(roomName(channelId));
      socket.data.currentChannelId = channelId;
      const messages = messagesByChannel.get(channelId) ?? [];
      socket.emit('channel:history', { channelId, messages });
    });

    socket.on('message:send', (payload) => {
      const channelId = payload?.channelId;
      const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

      if (!ALLOWED_CHANNEL_IDS.has(channelId)) return;
      if (!socket.rooms.has(roomName(channelId))) return;
      if (!text || text.length > MAX_MESSAGE_LENGTH) return;

      const message = {
        id: crypto.randomUUID(),
        channelId,
        text,
        author: { name: socket.data.displayName },
        createdAt: new Date().toISOString(),
      };

      pushMessage(channelId, message);
      io.to(roomName(channelId)).emit('message:new', message);
    });

    socket.on('disconnect', () => {
      const channelId = socket.data.currentChannelId;
      if (channelId) socket.leave(roomName(channelId));
    });
  });

  return io;
}

module.exports = initChatSocket;
