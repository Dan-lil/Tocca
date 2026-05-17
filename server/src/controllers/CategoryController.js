const CategoryService = require("../services/CategoryService");
const formatResponse = require("../utils/formatResponse");

class CategoryController {
  static async createCategory(req, res) {
    const { user } = res.locals;
    if (user.role === "client" || user.role === "master") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }
    const data = req.body;
    try {
      const newCategory = await CategoryService.create(data);
      return res
        .status(201)
        .json(formatResponse(201, "Категория успешно создана", newCategory));
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Сервис не может передать нужные данные для создания новой категории",
          ),
        );
    }
  }

  static async getAllCategories(req, res) {
    try {
      const categories = await CategoryService.findAll();
      return res
        .status(200)
        .json(formatResponse(200, "Категории успешно получены", categories));
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Сервис не может передать нужные данные для получения списка категорий",
          ),
        );
    }
  }

  static async getCategoryById(req, res) {
    const { id } = req.params;
    try {
      const category = await CategoryService.findOne(id);
      if (!category) {
        return res
          .status(404)
          .json(formatResponse(404, "Категория не найдена"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Категория успешно получена", category));
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Сервис не может передать нужные данные для получения категории",
          ),
        );
    }
  }

  static async deleteCategory(req, res) {
    const { id } = req.params;
    try {
      await CategoryService.categorydelite(id);
      return res
        .status(200)
        .json(formatResponse(200, "Категория успешно удалена"));
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Сервис не может передать нужные данные для удаления категории",
          ),
        );
    }
  }
}

module.exports = CategoryController;
