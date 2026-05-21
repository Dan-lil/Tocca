const AiController = require("../controllers/AiController");
const aiRouter = require("express").Router();
const verifyAccessToken = require("../middleware/verifyAccessToken");

aiRouter.post("/generate", AiController.getAiResponse);

aiRouter.get(
  "/recommendations/masters/me",
  verifyAccessToken,
  AiController.getMyMasterRecommendations,
);

aiRouter.post(
  "/recommendations/masters",
  AiController.getMasterRecommendations,
);

aiRouter.post("/geo-sort", AiController.getGeoSortedMasters);

module.exports = aiRouter;
