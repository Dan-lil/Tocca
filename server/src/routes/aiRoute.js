const AiController = require("../controllers/AiController");
const aiRouter = require("express").Router();

aiRouter.post("/generate", AiController.getAiResponse);

aiRouter.post(
  "/recommendations/masters",
  AiController.getMasterRecommendations,
);

module.exports = aiRouter;
