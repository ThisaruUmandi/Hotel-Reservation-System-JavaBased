import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">Hotel Reservation</Link>
        <nav>
          {user ? (
            <>
              <span>{user.username}</span>
              <button type="button" onClick={logout}>Log out</button>
            </>
          ) : null}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
