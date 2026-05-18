const express = require("express");
const morgan = require("morgan");
const path = require("path");
const removeXPoweredHeader = require("../middleware/removeHeader");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const corsOrigins = require("./corsOrigins");

const corsOptons = {
  origin: corsOrigins,
  credentials: true,
};

const serverConfig = (app) => {
  app.use(cors(corsOptons));
  app.use(morgan("dev"));
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(removeXPoweredHeader);
  app.use(express.static(path.join(__dirname, "../public")));
};

module.exports = serverConfig;
