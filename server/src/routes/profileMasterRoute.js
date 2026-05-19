const ProfileMasterRouter = require("express").Router();
const ProfileMasterController = require("../controllers/ProfileMasterControllers");
const verifyAccessToken = require("../middleware/verifyAccessToken");

ProfileMasterRouter.get(
  "/me",
  verifyAccessToken,
  ProfileMasterController.getMyProfile,
);

ProfileMasterRouter.get("/:masterId", ProfileMasterController.getPublicProfile);

ProfileMasterRouter.put(
  "/update",
  verifyAccessToken,
  ProfileMasterController.updateProfile,
);

module.exports = ProfileMasterRouter;
