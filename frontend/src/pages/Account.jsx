import { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import PasswordField from '../components/PasswordField';
import { usePageTitle } from '../lib/usePageTitle';

const ROLES = { GUEST: 'Guest', STAFF: 'Staff', ADMIN: 'Administrator' };

export default function Account() {
  usePageTitle('Account');
  const { user } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((x) => ({ ...x, [field]: undefined }));
    setDone(false);
  };

  async function submit(event) {
    event.preventDefault();
    const found = {};
    if (!form.current) found.current = 'Enter your current password';
    if (form.next.length < 8) found.next = 'Use at least 8 characters';
    else if (form.next.length > 72) found.next = 'Use 72 characters or fewer';
    else if (form.next === form.current) found.next = 'Choose a password you have not used just now';
    if (form.confirm !== form.next) found.confirm = 'The passwords do not match';
    setErrors(found);
    setFormError('');
    setDone(false);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await authApi.changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setDone(true);
    } catch (e) {
      if (e.fieldErrors?.newPassword) setErrors({ next: e.fieldErrors.newPassword });
      else if (e.status === 400) setErrors({ current: e.message });
      else setFormError(e.message);
    }
    setBusy(false);
  }

  const guest = user.guest;
  return (
    <section className="section">
      <div className="container account">
        <h1>Account</h1>

        <section aria-labelledby="profile-title">
          <h2 id="profile-title">Your details</h2>
          <dl className="facts account__list">
            <div><dt>Username</dt><dd>{user.username}</dd></div>
            <div><dt>Account type</dt><dd>{ROLES[user.role] ?? user.role}</dd></div>
            <div><dt>Name</dt><dd>{guest ? guest.name : 'Saved when you make your first booking'}</dd></div>
            <div><dt>Email</dt><dd>{guest ? guest.email : '–'}</dd></div>
            <div><dt>Phone</dt><dd>{guest?.phone || '–'}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="password-title">
          <h2 id="password-title">Change password</h2>
          <form className="account__form" onSubmit={submit} noValidate>
            {formError && <p className="alert alert--error" role="alert">{formError}</p>}
            {done && <p className="alert alert--success" role="status">Your password has been changed.</p>}
            <PasswordField label="Current password" autoComplete="current-password" value={form.current} onChange={set('current')} error={errors.current} />
            <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters" value={form.next} onChange={set('next')} error={errors.next} />
            <PasswordField label="Confirm new password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
            <button type="submit" className="btn btn--dark" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
          </form>
        </section>
      </div>
    </section>
  );
}
