import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';
import PasswordField from '../../components/PasswordField';
import TextField from '../../components/TextField';
import { validateAccount } from '../../lib/booking';

const ROLES = { GUEST: 'Guest', STAFF: 'Staff', ADMIN: 'Administrator' };

export default function AdminStaff() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', users: [], error: '' });
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('team'); // team | guests
  const [form, setForm] = useState({ username: '', password: '', role: 'STAFF' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const users = await adminApi.users();
    setState({ status: 'ready', users, error: '' });
  }, []);

  useEffect(() => { load().catch((e) => setState({ status: 'error', users: [], error: e.message })); }, [load]);

  async function changeRole(target, role) {
    setActionError(''); setNotice('');
    try {
      await adminApi.setRole(target.id, role);
      await load();
      setNotice(`${target.username} is now ${ROLES[role].toLowerCase()}.`);
    } catch (e) {
      setActionError(e.message);
    }
  }

  async function create(event) {
    event.preventDefault();
    const found = validateAccount({ ...form, confirm: form.password });
    delete found.confirm;
    setErrors(found); setActionError(''); setNotice('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await adminApi.createUser({ username: form.username.trim(), password: form.password, role: form.role });
      await load();
      setNotice(`Account created for ${form.username.trim()}. Share the password with them securely.`);
      setForm({ username: '', password: '', role: 'STAFF' });
    } catch (e) {
      if (e.status === 409) setErrors({ username: 'That username is taken.' });
      else if (Object.keys(e.fieldErrors).length) setErrors(e.fieldErrors);
      else setActionError(e.message);
    }
    setBusy(false);
  }

  if (state.status === 'error') return <p className="alert alert--error" role="alert">{state.error}</p>;
  if (state.status === 'loading') return <p className="muted" role="status">Loading…</p>;

  const shown = state.users.filter((u) => (filter === 'team' ? u.role !== 'GUEST' : u.role === 'GUEST'));
  return (
    <div className="admin__page">
      <div aria-live="polite">
        {notice && <p className="alert alert--success" role="status">{notice}</p>}
        {actionError && <p className="alert alert--error" role="alert">{actionError}</p>}
      </div>

      <div className="admin__two admin__two--wide">
        <section aria-labelledby="people-h">
          <h2 id="people-h">People</h2>
          <div className="chips" role="group" aria-label="Show">
            <button type="button" className="chip" aria-pressed={filter === 'team'} onClick={() => setFilter('team')}>Staff and admins</button>
            <button type="button" className="chip" aria-pressed={filter === 'guests'} onClick={() => setFilter('guests')}>Guests</button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Username</th><th>Contact</th><th>Role</th></tr></thead>
              <tbody>
                {shown.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong>{u.id === user.id && <span className="muted small"> (you)</span>}</td>
                    <td className="muted small">{u.guest ? `${u.guest.name} · ${u.guest.email}` : '–'}</td>
                    <td>
                      {u.id === user.id ? ROLES[u.role] : (
                        <select className="input input--compact" aria-label={`Role for ${u.username}`} value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                          {Object.entries(ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan="3" className="muted">Nobody here yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="muted small" style={{ marginTop: 'var(--space-3)' }}>Role changes take effect immediately. You cannot change your own role.</p>
        </section>

        <section aria-labelledby="add-h">
          <h2 id="add-h">Add a team member</h2>
          <form className="admin-form" onSubmit={create} noValidate>
            <TextField label="Username" autoComplete="off" value={form.username} error={errors.username}
              onChange={(e) => { setForm({ ...form, username: e.target.value }); setErrors((x) => ({ ...x, username: undefined })); }} />
            <PasswordField label="Temporary password" autoComplete="new-password" hint="At least 8 characters" value={form.password} error={errors.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((x) => ({ ...x, password: undefined })); }} />
            <TextField label="Role" as="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="STAFF">Staff (reservations and rooms)</option>
              <option value="ADMIN">Administrator (everything, including prices and accounts)</option>
            </TextField>
            <button type="submit" className="btn btn--dark" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
