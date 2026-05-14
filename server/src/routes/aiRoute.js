const AiController = require('../controllers/AiController');
const aiRouter = require('express').Router();

aiRouter.post('/generate', AiController.getAiResponse);

module.exports = aiRouter;