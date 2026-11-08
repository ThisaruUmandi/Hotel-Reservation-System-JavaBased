import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <section className="section admin">
      <div className="container">
        <header className="admin__head">
          <h1>Admin</h1>
          <p className="muted">Signed in as {user.username} ({user.role === 'ADMIN' ? 'administrator' : 'staff'})</p>
        </header>
        <nav className="admin__tabs" aria-label="Admin sections">
          <NavLink to="/admin" end>Overview</NavLink>
          <NavLink to="/admin/reservations">Reservations</NavLink>
          <NavLink to="/admin/rooms">Rooms</NavLink>
          {user.role === 'ADMIN' && <NavLink to="/admin/staff">Staff</NavLink>}
        </nav>
        <Outlet />
      </div>
    </section>
  );
}
