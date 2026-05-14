const express = require('express');
const apiRouter = require('./routes/apiRoute');
const viewRouter = require('./routes/viewRoute');
const serverConfig = require('./config/serverConfig');
const http = require('http');
const initChatSocket = require('./ws/chatSocket');

const PORT = process.env.PORT ?? 3000;
const app = express();

serverConfig(app);

app.use('/api', apiRouter);
app.use('/', viewRouter);

const server = http.createServer(app);
initChatSocket(server);

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту: ${PORT}`);
});
