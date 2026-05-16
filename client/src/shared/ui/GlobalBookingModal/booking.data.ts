export type MasterItem = {
  id: string;
  initials: string;
  name: string;
  meta: string;
  service: string;
  price: string;
  slot: string;
};

//заглушка с данными для модального окна

export const masters: MasterItem[] = [
  {
    id: "ap",
    initials: "АП",
    name: "Анна Петрова",
    meta: "Маникюр-педикюр 7 лет опыта",
    service: "Маникюр с покрытием",
    price: "2 500 ₽ • 90 мин",
    slot: "19:00",
  },
  {
    id: "ek",
    initials: "ЕК",
    name: "Елена Козлова",
    meta: "Уход за кожей, маникюр 9 лет опыта",
    service: "Маникюр с покрытием",
    price: "3 000 ₽ • 90 мин",
    slot: "18:00",
  },
];

// подсказки для поля ввода AI
export const quickPrompts = [
  "Хочу маникюр завтра после 18:00...",
  "Маникюр завтра вечером",
  "Стрижка в эти выходные",
];
