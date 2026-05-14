"use client";

import { store } from "./store";
import { ReactNode } from "react";
import { Provider } from "react-redux";

// провайдер (обёртка) для обеспечения доступа к хранилищу из всех компонентов приложения

export default function StoreProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}> {children} </Provider>;
}
