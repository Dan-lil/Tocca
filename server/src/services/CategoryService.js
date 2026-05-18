const { Category } = require("../db/models");

class CategoryService {
  static async create(CategoryData) {
    const newCategory = await Category.create(CategoryData);

    const plainCategory = newCategory.get();

    return plainCategory;
  }

  static async findAll() {
    const categories = await Category.findAll();

    return categories.map((category) => category.get());
  }

  static async categorydelite(id) {
    await Category.destroy({ where: { id: id } });
  }

  static async findOne(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      return null;
    }
    return category.get();
  }
}

module.exports = CategoryService;
