const EcoRouter = require("express").Router();
const EcoController = require("../controllers/EcoController");
const verifyRefreshToken = require("../middleware/verifyRefreshToken");
const verifyAccessToken = require("../middleware/verifyAccessToken");

EcoRouter.post("/reviews", verifyAccessToken, EcoController.createReview)

  .delete("/reviews/:id", verifyAccessToken, EcoController.deleteReview)
  .delete(
    "/reviews/booking/:bookingId",
    verifyAccessToken,
    EcoController.deleteReviewsByBookingId,
  )
  .delete(
    "/reviews/master/:masterId",
    verifyAccessToken,
    EcoController.deleteReviewsByMasterId,
  )
  .delete(
    "/reviews/client/:clientId",
    verifyAccessToken,
    EcoController.deleteReviewsByClientId,
  )
  .get(
    "/reviews/booking/:bookingId",
    verifyAccessToken,
    EcoController.getReviewsByBookingId,
  )
  .get(
    "/reviews/master/:masterId",
    verifyAccessToken,
    EcoController.getReviewsByMasterId,
  )
  .get(
    "/reviews/client/:clientId",
    verifyAccessToken,
    EcoController.getReviewsByClientId,
  );

module.exports = EcoRouter;
