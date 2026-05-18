const ShaduleRouter = require("express").Router();
const ShaduleController = require("../controllers/ShaduleController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

ShaduleRouter.post("/create", verifyAccessToken, ShaduleController.create)
  .get("/findAll", ShaduleController.findAll)
  .get("/find/:id", ShaduleController.findById)
  .get("/findByMasterId/:masterId", ShaduleController.findByAllMasterId)
  .put("/update/:id", verifyAccessToken, ShaduleController.update)
  .delete("/delete/:id", verifyAccessToken, ShaduleController.delete)
  .delete(
    "/deleteByDayOfWeek/:dayOfWeek",
    verifyAccessToken,
    ShaduleController.deleteByDayOfWeek,
  )
  .delete(
    "/deleteByMasterId/:masterId",
    verifyAccessToken,
    ShaduleController.deleteByMasterId,
  );

module.exports = ShaduleRouter;
