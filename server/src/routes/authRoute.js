const authRouter = require('express').Router();
const AuthController = require('../controllers/AuthController');
const verifyAccessToken = require('../middleware/verifyAccessToken');
const verifyRefreshToken = require('../middleware/verifyRefreshToken');

authRouter
  .post('/register', AuthController.register)
  .post('/login', AuthController.login)
  .post('/telegram', AuthController.telegramLogin)
  .post('/logout', AuthController.logout)
  .put('/profile', verifyAccessToken, AuthController.updateProfile)
  .get('/refresh', verifyRefreshToken, AuthController.refreshTokens);

module.exports = authRouter;
