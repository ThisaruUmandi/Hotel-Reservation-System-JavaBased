import { useId, useState } from 'react';

/** A password input with a Show/Hide button. */
export default function PasswordField({ label, error, hint, ...props }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input id={id} className="input" type={shown ? 'text' : 'password'} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...props} />
        <button type="button" className="password-wrap__toggle" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && <span id={`${id}-hint`} className="field__hint">{hint}</span>}
      {error && <span id={`${id}-error`} className="field__error">{error}</span>}
    </div>
  );
}
