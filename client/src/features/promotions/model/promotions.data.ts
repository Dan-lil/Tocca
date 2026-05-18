export type PromotionItem = {
  title: string;
  subtitle: string;
  image: string;
};

// заглушки для акций
export const promotions: PromotionItem[] = [
  {
    title: "Массаж",
    subtitle: "Антицеллюлитный массаж со скидкой 25%",
    image: "/акции/anticellulite-massage-25.png",
  },
  {
    title: "Приведи подругу",
    subtitle: "Получите скидку 10% на следующую запись",
    image: "/акции/bring-friend-10-v2.png",
  },
  {
    title: "Брови и ресницы",
    subtitle: "Минус 15% на оформление взгляда",
    image: "/акции/brows-lashes-15.png",
  },
  {
    title: "Прически",
    subtitle: "Стрижка и укладка в подарок",
    image: "/акции/haircut-styling-gift.png",
  },
  {
    title: "Маникюр",
    subtitle: "Скидка 20% на первое посещение",
    image: "/акции/manicure-discount-20 (1).png",
  },
];
