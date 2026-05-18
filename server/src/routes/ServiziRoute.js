const ServiziRouter = require("express").Router();
const ServiziController = require("../controllers/ServiziController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

ServiziRouter.post("/create", verifyAccessToken, ServiziController.create)
.get("/findAll", ServiziController.findAll)
.put(
  "/:id",
  verifyAccessToken,
  ServiziController.update,
)
.get("/find/:id", ServiziController.findById)
.get("/findAll/:masterId", ServiziController.findAllByMasterId)

.get("/findByCategory/:categoryId", ServiziController.findAllByCategoryId)
.get("/findByActive/:isActive", ServiziController.findByActive)
.delete("/:id", verifyAccessToken, ServiziController.delete)
.delete("/deleteAll/:masterId", verifyAccessToken, ServiziController.deleteByMasterId)
.delete("/deleteByActive/:isActive", verifyAccessToken, ServiziController.deleteByActive);



module.exports = ServiziRouter;
