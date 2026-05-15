const MasterSocialRouter = require("express").Router();
const MasterSocialController = require("../controllers/MasterSocialControllers");
const verifyAccessToken = require("../middleware/verifyAccessToken");

MasterSocialRouter.put(
  "/update",
  verifyAccessToken,
  MasterSocialController.updateSocial,
)
  .post("/create", verifyAccessToken, MasterSocialController.createSocial)
  .get("/find", verifyAccessToken, MasterSocialController.findSocial)
  .delete(
    "/delete/:id",
    verifyAccessToken,
    MasterSocialController.deleteSocial,
  );

module.exports = MasterSocialRouter;
