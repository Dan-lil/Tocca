const ProfileMasterRouter = require("express").Router();
const ProfileMasterController = require("../controllers/ProfileMasterControllers");
const verifyAccessToken = require("../middleware/verifyAccessToken");

ProfileMasterRouter.get(
  "/me",
  verifyAccessToken,
  ProfileMasterController.getMyProfile,
);

ProfileMasterRouter.put(
  "/update",
  verifyAccessToken,
  ProfileMasterController.updateProfile,
);

module.exports = ProfileMasterRouter;
