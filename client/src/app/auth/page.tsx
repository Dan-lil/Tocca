"use client";
// import "./page.css";
import SignUpForm from "@/features/auth/ui/SignUpForm/SignUpForm";
import SignInForm from "@/features/auth/ui/SignInForm/SignInForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/shared/hooks/useReduxHooks";
import { setError } from "@/entities/user/slice/userSlice";
import TelegramLoginWidget from "@/features/auth/ui/TelegramLoginWidget/TelegramLoginWidget";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const dispatch = useAppDispatch();

  const router = useRouter();

  const { user, isInitialized, error } = useAppSelector((state) => state.user);
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";
  // строкой путь на домашнюю
  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/");
    }
  }, [isInitialized, router, user]);

  if (isInitialized && user) {
    return null;
  }

  return (
    <div className="app-container auth-page">
      <div className="form-container">
        {isSignUp ? <SignUpForm /> : <SignInForm />}
        {!isSignUp && <TelegramLoginWidget botUsername={telegramBotUsername} />}
        {error && <p className="auth-error">{error}</p>}
        {isSignUp ? (
          <div className="auth-switch">
            <p>Уже есть учетная запись?</p>
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                dispatch(setError(null));
              }}
            >
              Войти
            </button>
          </div>
        ) : (
          <div className="auth-switch">
            <p>Еще нет учетной записи?</p>
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                dispatch(setError(null));
              }}
            >
              Создать
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
