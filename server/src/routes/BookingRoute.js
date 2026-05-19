const BookingRouter = require("express").Router();
const BookingController = require("../controllers/BookingController");

const verifyAccessToken = require("../middleware/verifyAccessToken");

BookingRouter.post("/bookings", verifyAccessToken, BookingController.create)
  .put("/bookings/:id", verifyAccessToken, BookingController.update)
  .delete("/bookings/:id", verifyAccessToken, BookingController.delete)
  .delete(
    "/bookings/master/:masterId",
    verifyAccessToken,
    BookingController.deleteByMasterId,
  )
  .delete(
    "/bookings/client/:clientId",
    verifyAccessToken,
    BookingController.deleteByClientId,
  )
  .get("/bookings/:id", verifyAccessToken, BookingController.findById)
  .get(
    "/bookings/master/:masterId",
    verifyAccessToken,
    BookingController.findAllByMasterId,
  )
  .get(
    "/bookings/client/:clientId",
    verifyAccessToken,
    BookingController.findAllByClientId,
  );

module.exports = BookingRouter;
