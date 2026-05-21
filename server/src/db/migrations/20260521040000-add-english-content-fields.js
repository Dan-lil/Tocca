"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Categories", "titleEn", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Servizis", "titleEn", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Servizis", "descriptionEn", {
      type: Sequelize.STRING(1000),
      allowNull: true,
    });

    await queryInterface.addColumn("ProfileMasters", "titleEn", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("ProfileMasters", "descriptionEn", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("ProfileMasters", "categoryEn", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.bulkUpdate("Categories", { titleEn: "Nails" }, { id: 1 });
    await queryInterface.bulkUpdate("Categories", { titleEn: "Cosmetology" }, { id: 2 });
    await queryInterface.bulkUpdate("Categories", { titleEn: "Hair" }, { id: 3 });
    await queryInterface.bulkUpdate("Categories", { titleEn: "Massage" }, { id: 4 });
    await queryInterface.bulkUpdate("Categories", { titleEn: "Makeup" }, { id: 5 });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("ProfileMasters", "categoryEn");
    await queryInterface.removeColumn("ProfileMasters", "descriptionEn");
    await queryInterface.removeColumn("ProfileMasters", "titleEn");
    await queryInterface.removeColumn("Servizis", "descriptionEn");
    await queryInterface.removeColumn("Servizis", "titleEn");
    await queryInterface.removeColumn("Categories", "titleEn");
  },
};
