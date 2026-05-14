import { useState } from "react";
// import "./SignInForm.css";
import { UserValidator } from "@/entities/user/model/UserValidator";
import FormInput from "@/shared/ui/FormInput/FormInput";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/shared/hooks/useReduxHooks";
import { loginThunk } from "@/entities/user/api/UserApiThunk";

export default function SignInForm() {
  const initialValue = { email: "", password: "" };
  const router = useRouter();

  const dispatch = useAppDispatch();

  const [signInData, setSignInData] = useState(initialValue);

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSignInData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const signInHandler = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { isValid, error: validationError } =
      UserValidator.validateLoginData(signInData);

    if (!isValid) {
      alert(validationError);
      return;
    }
    const action = await dispatch(loginThunk(signInData));
    if (loginThunk.rejected.match(action)) {
      return;
    }
    router.push("/");
    setSignInData(initialValue);
  };

  return (
    <div>
      <form className="form" onSubmit={signInHandler}>
        <FormInput
          placeholder=" "
          name="email"
          type="email"
          required
          onChange={inputHandler}
          value={signInData.email}
          label="Почта"
        />
        <FormInput
          placeholder=" "
          name="password"
          type="password"
          required
          onChange={inputHandler}
          value={signInData.password}
          label="Пароль"
        />
        <button className="form-action-button">Войти</button>
      </form>
    </div>
  );
}
