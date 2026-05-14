const MasterPortfolioRouter = require("express").Router();
const MasterPortfolioController = require("../controllers/MasterPortfolioControllers");
const verifyAccessToken = require("../middleware/verifyAccessToken");

MasterPortfolioRouter.post(
  "/",
  verifyAccessToken,
  MasterPortfolioController.createPortfolio,
).delete("/:id", verifyAccessToken, MasterPortfolioController.cartDelite);

module.exports = MasterPortfolioRouter;
