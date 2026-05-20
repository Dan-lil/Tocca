const SaleRouter = require("express").Router();
const SaleController = require("../controllers/SaleController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

SaleRouter.post("/create", verifyAccessToken, SaleController.create)
  .get("/for-client", verifyAccessToken, SaleController.findForClient)
  .get("/findAll", SaleController.findAll)
  .get("/findByDateRange", SaleController.findByDateRange)
  .get("/findByDiscountRange", SaleController.findByDiscountRange)
  .get("/findByMasterId/:masterId", SaleController.findByMasterId)
  .get("/findByServiziId/:serviziId", SaleController.findByServiziId)
  .get("/findByDate/:date", SaleController.findByDate)
  .get("/find/:id", SaleController.findById)
  .put("/update/:id", verifyAccessToken, SaleController.update)
  .delete("/delete/:id", verifyAccessToken, SaleController.delete)
  .delete(
    "/deleteByMasterId/:masterId",
    verifyAccessToken,
    SaleController.deleteByMasterId,
  )
  .delete(
    "/deleteByServiziId/:serviziId",
    verifyAccessToken,
    SaleController.deleteByServiziId,
  )
  .delete("/deleteByDate", verifyAccessToken, SaleController.deleteByDate);

module.exports = SaleRouter;
