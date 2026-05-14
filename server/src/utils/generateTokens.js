const path = require('path');
process.loadEnvFile(path.join(__dirname, '../../.env'));
const jwt = require('jsonwebtoken');
const JWTconfig = require('../config/JWTconfig');

function generateTokens(payload) {
  return {
    accessToken: jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      JWTconfig.accessToken,
    ),
    refreshToken: jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET,
      JWTconfig.refreshToken,
    ),
  };
}

module.exports = generateTokens;
