"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./page.css";

const services = [
  {
    title: "Ногти",
    image: "/услуги на главной/ногти9.jpg",
    description: "Уход, покрытие и дизайн",
  },
  {
    title: "Макияж",
    image: "/услуги на главной/макияж1.jpg",
    description: "Дневные и вечерние образы с естественным сиянием",
  },
  {
    title: "Массаж",
    image: "/услуги на главной/массаж8.jpg",
    description: "Расслабляющие ритуалы для тела и восстановления",
  },
  {
    title: "Косметология",
    image: "/услуги на главной/косметология11.jpg",
    description: "Процедуры для свежей кожи, ровного тона и твоей красоты",
  },
  {
    title: "Волосы",
    image: "/услуги на главной/прическа2.jpg",
    description:
      "Уход за волосами, укладки и прически под событие или настроение",
  },
];

const promotions = [
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

const masters = [
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

const quickPrompts = [
  "Хочу маникюр завтра после 18:00...",
  "Маникюр завтра вечером",
  "Стрижка в эти выходные",
];

export default function HomePage() {
  return (
    <div>page</div>
  )
}
