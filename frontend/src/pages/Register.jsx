import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import TextField from '../components/TextField';
import { validateAccount } from '../lib/booking';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;
  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined })); // clear this field's error while editing
  };

  async function submit(event) {
    event.preventDefault();
    const found = validateAccount(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await register(form.username.trim(), form.password);
      navigate(from, { replace: true });
    } catch (e) {
      if (e.status === 409) setErrors({ username: 'That username is taken. Try another.' });
      else if (Object.keys(e.fieldErrors).length) setErrors(e.fieldErrors);
      else setFormError(e.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      intro={from.startsWith('/book') ? 'You need an account to book. It takes a minute.' : 'Keep your bookings in one place.'}
      footer={<>Already have an account? <Link to="/login" state={{ from }} className="text-link">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {formError && <p className="alert alert--error" role="alert">{formError}</p>}
        <TextField label="Username" autoComplete="username" autoFocus hint="3 to 30 characters" value={form.username} onChange={set('username')} error={errors.username} />
        <PasswordField label="Password" autoComplete="new-password" hint="At least 8 characters" value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordField label="Confirm password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <button type="submit" className="btn btn--dark btn--block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  );
}
