import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
// import "./SignUpForm.css";
import { UserValidator } from "@/entities/user/model/UserValidator";
import FormInput from "@/shared/ui/FormInput/FormInput";
import { useAppDispatch } from "@/shared/hooks/useReduxHooks";
import { registerThunk } from "@/entities/user/api/UserApiThunk";

export default function SignUpForm() {
  const initialValue = {
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "",
  };
  const router = useRouter();
  const t = useTranslations();

  const dispatch = useAppDispatch();

  const [signUpData, setSignUpData] = useState(initialValue);

  const inputHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSignUpData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const signUpHandler = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { isValid, error: validationError } =
      UserValidator.validateRegistrationData(signUpData);

    if (!isValid) {
      alert(validationError);
      return;
    }

    const action = await dispatch(registerThunk(signUpData));
    if (registerThunk.rejected.match(action)) {
      return;
    }
    router.push("/");
    setSignUpData(initialValue);
  };

  return (
    <div>
      <form className="form" onSubmit={signUpHandler}>
        <FormInput
          placeholder=" "
          name="name"
          type="text"
          required
          onChange={inputHandler}
          value={signUpData.name}
          label={t("auth.name")}
        />
        <FormInput
          placeholder=" "
          name="email"
          type="email"
          required
          onChange={inputHandler}
          value={signUpData.email}
          label={t("auth.email")}
        />
        <FormInput
          placeholder=" "
          name="password"
          type="password"
          required
          onChange={inputHandler}
          value={signUpData.password}
          label={t("auth.password")}
        />
        <FormInput
          placeholder=" "
          name="confirm"
          type="password"
          required
          onChange={inputHandler}
          value={signUpData.confirm}
          label={t("auth.confirmPassword")}
        />
        <select
          className="auth-select"
          name="role"
          value={signUpData.role}
          onChange={inputHandler}
          required
        >
          <option value="">{t("auth.chooseRole")}</option>
          <option value="client">{t("auth.client")}</option>
          <option value="master">{t("auth.master")}</option>
        </select>

        <button
          className="form-action-button"
          disabled={signUpData.password !== signUpData.confirm}
        >
          {t("auth.register")}
        </button>
      </form>
    </div>
  );
}
