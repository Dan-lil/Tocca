const ProfileMasterRouter = require("express").Router();
const ProfileMasterController = require("../controllers/ProfileMasterControllers");
const verifyAccessToken = require("../middleware/verifyAccessToken");

ProfileMasterRouter.put(
  "/update",
  verifyAccessToken,
  ProfileMasterController.updateProfile,
);

module.exports = ProfileMasterRouter;
