"use client";
// import "./page.css";
import SignUpForm from "@/features/auth/ui/SignUpForm/SignUpForm";
import SignInForm from "@/features/auth/ui/SignInForm/SignInForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/shared/hooks/useReduxHooks";
import { setError } from "@/entities/user/slice/userSlice";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const dispatch = useAppDispatch();

  const router = useRouter();

  const { user, isInitialized, error } = useAppSelector((state) => state.user);
//строкой путь на домашнюю 
  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/');
    }
  }, [isInitialized, user]);

  if (isInitialized && user) {
    return null;
  }

  return (
    <div className="app-container">
      <div className="form-container">
        {isSignUp ? <SignUpForm /> : <SignInForm />}
        {error && <p>{error}</p>}
        {isSignUp ? (
          <>
            <p>Уже есть учетная запись?</p>
            <span
              className="auth-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                dispatch(setError(null));
              }}
            >
              Войти
            </span>
          </>
        ) : (
          <>
            <p>Еще нет учетной записи?</p>
            <span
              className="auth-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                dispatch(setError(null));
              }}
            >
              Создать
            </span>
          </>
        )}
      </div>
    </div>
  );
}
