"use client";
// import "./page.css";
import SignUpForm from "@/features/auth/ui/SignUpForm/SignUpForm";
import SignInForm from "@/features/auth/ui/SignInForm/SignInForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppSelector, useAppDispatch } from "@/shared/hooks/useReduxHooks";
import { setError } from "@/entities/user/slice/userSlice";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const dispatch = useAppDispatch();
  const t = useTranslations();

  const router = useRouter();

  const { user, isInitialized, error } = useAppSelector((state) => state.user);
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
        {error && <p className="auth-error">{error}</p>}
        {isSignUp ? (
          <div className="auth-switch">
            <p>{t("auth.hasAccount")}</p>
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                dispatch(setError(null));
              }}
            >
              {t("auth.login")}
            </button>
          </div>
        ) : (
          <div className="auth-switch">
            <p>{t("auth.noAccount")}</p>
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                dispatch(setError(null));
              }}
            >
              {t("auth.create")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
