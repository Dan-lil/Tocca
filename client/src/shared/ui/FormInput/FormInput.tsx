import { useId } from 'react';
import './FormInput.css';

type FormInputProps = {
  label?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;
  

const FormInput = ({ label, ...otherProps }: FormInputProps) => {
  const inputLabelClassName =
    otherProps.value &&
    typeof otherProps.value === 'string' &&
    otherProps.value.length
      ? 'shrink form-input-label'
      : 'form-input-label';

  const id = useId();

  return (
    <div className="group">
      <input className="form-input" {...otherProps} autoComplete="off"  id={id}/>
      {label && (
        <label className={inputLabelClassName} htmlFor={id}>
          {label}
        </label>
      )}
    </div>
  );
};

export default FormInput;
