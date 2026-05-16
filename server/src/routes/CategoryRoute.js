const CategoryRouter = require("express").Router();
const CategoryController = require("../controllers/CategoryController");
const verifyRefreshToken = require("../middleware/verifyRefreshToken");
const verifyAccessToken = require("../middleware/verifyAccessToken");

CategoryRouter.post(
  "/categories",
  verifyAccessToken,
  CategoryController.createCategory,
)
  .get("/categories", CategoryController.getAllCategories)
  .get("/categories/:id", CategoryController.getCategoryById)
  .delete("/categories/:id", CategoryController.deleteCategory);

module.exports = CategoryRouter;
