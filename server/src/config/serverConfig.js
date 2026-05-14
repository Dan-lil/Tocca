const express = require('express');
const morgan = require('morgan');
const path = require('path');
const removeXPoweredHeader = require('../middleware/removeHeader');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const corsOptons = {
  origin: ['http://localhost:5173'],
  credentials: true,
};

const serverConfig = (app) => {
  app.use(cors(corsOptons));
  app.use(morgan('dev')); // логирует запросы
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true })); // парсит данные из формы
  app.use(express.json()); // парсит данные из JSON
  app.use(removeXPoweredHeader); // срезает заголовок X-Powered-By у всех ответов
  app.use(express.static(path.join(__dirname, '../public'))); // раздаёт статические файлы с сервера
};

module.exports = serverConfig;
