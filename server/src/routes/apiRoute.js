const apiRouter = require("express").Router();
const authRouter = require("./authRoute");
const aiRouter = require("./aiRoute");
const MasterPortfolioRouter = require("./masterPortfolioRoute");
const profileMasterRouter = require("./profileMasterRoute");
const formatResponse = require("../utils/formatResponse");

apiRouter.use("/auth", authRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/profile", profileMasterRouter);
apiRouter.use("/portfolio", MasterPortfolioRouter);

apiRouter.use((req, res) => {
  res.status(404).json(formatResponse(404, "Ресурс не найден"));
});

module.exports = apiRouter;
