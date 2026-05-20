"use client";

import { telegramLoginThunk } from "@/entities/user/api/UserApiThunk";
import { TelegramAuthData } from "@/entities/user/model";
import { useAppDispatch } from "@/shared/hooks/useReduxHooks";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

function isLocalDevHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

type TelegramLoginWidgetProps = {
  botUsername: string;
};

export default function TelegramLoginWidget({
  botUsername,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLocalhost =
    typeof window !== "undefined" && isLocalDevHost(window.location.hostname);

  useEffect(() => {
    const widgetContainer = containerRef.current;

    if (!botUsername || !widgetContainer || isLocalhost) {
      return;
    }

    window.onTelegramAuth = async (user: TelegramAuthData) => {
      const action = await dispatch(telegramLoginThunk(user));
      if (telegramLoginThunk.fulfilled.match(action)) {
        router.push("/");
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");

    widgetContainer.innerHTML = "";
    widgetContainer.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
      widgetContainer.innerHTML = "";
    };
  }, [botUsername, dispatch, isLocalhost, router]);

  if (!botUsername) {
    return (
      <p className="auth-telegram-hint">
        Укажите NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в .env клиента для входа через
        Telegram.
      </p>
    );
  }

  if (isLocalhost) {
    return (
      <div className="auth-telegram auth-telegram--blocked">
        <p className="auth-telegram-label">или</p>
        <p className="auth-telegram-hint">
          Telegram не работает на <strong>localhost</strong>. Для локального теста:
        </p>
        <ol className="auth-telegram-steps">
          <li>
            <code>ngrok http 5173</code>
          </li>
          <li>
            @BotFather <code>/setdomain</code> → ваш ngrok-хост (например{" "}
            <code>abc.ngrok-free.app</code>)
          </li>
          <li>
            В <code>server/.env</code>:{" "}
            <code>CLIENT_ORIGIN=http://localhost:5173,https://abc.ngrok-free.app</code>{" "}
            и перезапуск API
          </li>
          <li>
            Откройте <code>https://abc.ngrok-free.app/auth</code>
          </li>
        </ol>
        <p className="auth-telegram-hint">
          Подробно: <code>docs/LOCAL_TELEGRAM_TEST.md</code>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-telegram">
      <p className="auth-telegram-label">или</p>
      <div ref={containerRef} className="auth-telegram-widget" />
    </div>
  );
}
