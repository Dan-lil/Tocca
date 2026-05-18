const apiRouter = require("express").Router();
const authRouter = require("./authRoute");
const aiRouter = require("./aiRoute");
const masterRouter = require("./masterRoute");
const MasterPortfolioRouter = require("./masterPortfolioRoute");
const profileMasterRouter = require("./profileMasterRoute");
const ServiziRouter = require("./ServiziRoute");
const MasterSocialRouter = require("./masterSocialRoute");
const formatResponse = require("../utils/formatResponse");
const CategoryRouter = require("./CategoryRoute");
const SaleRouter = require("./SaleRoute");
const BookingRouter = require("./BookingRoute");
const ShaduleRouter = require("./ShaduleRoute");
const EcoRouter = require("./EcoRoute");

apiRouter.use("/auth", authRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/master", masterRouter);
apiRouter.use("/profile", profileMasterRouter);
apiRouter.use("/portfolio", MasterPortfolioRouter);
apiRouter.use("/social", MasterSocialRouter);
apiRouter.use("/category", CategoryRouter);
apiRouter.use("/servizi", ServiziRouter);
apiRouter.use("/booking", BookingRouter);
apiRouter.use("/sale", SaleRouter);
apiRouter.use("/shadule", ShaduleRouter);
apiRouter.use("/eco", EcoRouter);

apiRouter.use((req, res) => {
  res.status(404).json(formatResponse(404, "Ресурс не найден"));
});

module.exports = apiRouter;
