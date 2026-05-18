const masterRouter = require("express").Router();
const MasterController = require("../controllers/MasterController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

masterRouter.use(verifyAccessToken);

masterRouter.get("/stats", MasterController.stats);
masterRouter.get("/earnings", MasterController.earnings);
masterRouter
  .route("/services")
  .get(MasterController.services)
  .post(MasterController.createService);
masterRouter
  .route("/services/:id")
  .patch(MasterController.updateService)
  .delete(MasterController.deleteService);
masterRouter
  .route("/portfolio")
  .get(MasterController.portfolio)
  .post(MasterController.createPortfolio);
masterRouter.delete("/portfolio/:id", MasterController.deletePortfolio);
masterRouter.get("/bookings/upcoming", MasterController.upcomingBookings);

module.exports = masterRouter;
