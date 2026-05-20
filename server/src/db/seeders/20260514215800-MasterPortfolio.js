"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("MasterPortfolios", [
      {
        userId: 2,
        portfolioImages:
          "/portfolio/userId2/nails13.jpg, /portfolio/userId2/nails3.jpg, /portfolio/userId2/nails4.jpg, /portfolio/userId2/nails5.jpg",
        text: "Маникюр с чистой формой, плотным покрытием и деликатным дизайном",
      },
      {
        userId: 6,
        portfolioImages:
          "/portfolio/userId6/nails1.jpg, /portfolio/userId6/nails10.jpg, /portfolio/userId6/nails2.jpg, /portfolio/userId6/nails6.jpg",
        text: "Маникюр на каждый день",
      },
      {
        userId: 7,
        portfolioImages:
          "/portfolio/userId7/nails11.jpg, /portfolio/userId7/nails12.jpg",
        text: "Педикюрс акцентом на комфорт",
      },
      {
        userId: 8,
        portfolioImages:
          "/portfolio/userId8/cosmetology1.jpg, /portfolio/userId8/cosmetology10.jpg, /portfolio/userId8/cosmetology2.jpg, /portfolio/userId8/cosmetology7.jpg",
        text: "Эстетические процедуры и уход",
      },
      {
        userId: 9,
        portfolioImages:
          "/portfolio/userId9/epilation1.jpg, /portfolio/userId9/epilation2.jpg, /portfolio/userId9/epilation3.jpg",
        text: "Эпиляция с деликатным подходом",
      },
      {
        userId: 10,
        portfolioImages:
          "/portfolio/userId10/makeup2.jpg, /portfolio/userId10/makeup3.jpg, /portfolio/userId10/makeup5.jpg, /portfolio/userId10/makeup7.jpg",
        text: "Макияж",
      },
      {
        userId: 11,
        portfolioImages:
          "/portfolio/userId11/hairstyle10.jpg, /portfolio/userId11/hairstyle11.jpg, /portfolio/userId11/hairstyle12.jpg, /portfolio/userId11/hairstyle9.jpg",
        text: "Образ для важных событий",
      },
      {
        userId: 12,
        portfolioImages:
          "/portfolio/userId12/hairstyle3.jpg, /portfolio/userId12/hairstyle4.jpg, /portfolio/userId12/hairstyle5.jpg, /portfolio/userId12/hairstyle7.jpg",
        text: "Образ для важных событий",
      },
      {
        userId: 13,
        portfolioImages:
          "/portfolio/userId13/cat-massage.jpg, /portfolio/userId13/massage1.jpg, /portfolio/userId13/massage3.jpg, /portfolio/userId13/massage4.jpg",
        text: "Массаж",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("MasterPortfolios", null, {});
  },
};
