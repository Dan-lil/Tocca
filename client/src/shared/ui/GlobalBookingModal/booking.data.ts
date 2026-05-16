export type MasterItem = {
  id: string;
  initials: string;
  name: string;
  meta: string;
  service: string;
  price: string;
  slot: string;
};

// Базовые варианты записи для UI-заглушки
export const masters: MasterItem[] = [
  {
    id: "ap",
    initials: "АП",
    name: "Анна Петрова",
    meta: "Маникюр-педикюр 7 лет опыта",
    service: "Маникюр с покрытием",
    price: "2 500 ₽ • 90 мин",
    slot: "Завтра, 19:00",
  },
  {
    id: "ek",
    initials: "ЕК",
    name: "Елена Козлова",
    meta: "Уход за кожей, маникюр 9 лет опыта",
    service: "Маникюр с покрытием",
    price: "3 000 ₽ • 90 мин",
    slot: "Завтра, 18:00",
  },
  {
    id: "pl",
    initials: "ПЛ",
    name: "Полина Лебедева",
    meta: "Стилист по волосам 5 лет опыта",
    service: "Стрижка",
    price: "2 200 ₽ • 60 мин",
    slot: "Суббота, 12:00",
  },
];

// Подсказки для быстрого старта диалога
export const quickPrompts = [
  "Хочу маникюр завтра после 18:00",
  "Маникюр завтра вечером",
  "Стрижка в эти выходные",
];

// фейковый посик AI по тексту клиента заглушка
export function getMockOptionsByPrompt(prompt: string): MasterItem[] {
  const text = prompt.trim().toLowerCase();

  if (!text) return masters.slice(0, 2);

  const isManicure = /маникюр|ногт/.test(text);
  const isHaircut = /стриж|волос/.test(text);
  const isTomorrow = /завтр/.test(text);
  const isWeekend = /выходн|суббот|воскрес/.test(text);
  const isEvening = /вечер|после\s*18|19:00|18:00/.test(text);

  let filtered = [...masters];

  if (isManicure) {
    filtered = filtered.filter((item) => /маникюр|ногт/i.test(item.service + item.meta));
  }

  if (isHaircut) {
    filtered = filtered.filter((item) => /стриж|волос/i.test(item.service + item.meta));
  }

  if (isTomorrow) {
    filtered = filtered.filter((item) => /завтра/i.test(item.slot));
  }

  if (isWeekend) {
    filtered = filtered.filter((item) => /суббота|воскресенье/i.test(item.slot));
  }

  if (isEvening) {
    filtered = filtered.filter((item) => /18:00|19:00/.test(item.slot));
  }

  // Если точных совпадений нет, показываем базовые варианты
  if (filtered.length === 0) {
    return masters.slice(0, 2);
  }

  return filtered;
}
