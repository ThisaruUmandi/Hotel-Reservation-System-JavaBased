import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import TextField from '../components/TextField';
import { usePageTitle } from '../lib/usePageTitle';

export default function Login() {
  usePageTitle('Log in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(event) {
    event.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(form.username.trim(), form.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Log in"
      intro={from.startsWith('/book') ? 'Log in to finish your booking.' : 'Welcome back.'}
      footer={<>New here? <Link to="/register" state={{ from }} className="text-link">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {error && <p className="alert alert--error" role="alert">{error}</p>}
        <TextField label="Username" autoComplete="username" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <PasswordField label="Password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="btn btn--dark btn--block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthLayout>
  );
}
