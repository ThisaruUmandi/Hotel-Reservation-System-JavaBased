import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { site } from '../config/site';
import Logo from './Logo';

export default function Layout() {
  const { user, isStaff, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]); // close the mobile menu after navigating

  return (
    <>
      <a href="#content" className="skip-link">Skip to content</a>
      <header className={`site-header${pathname === '/' ? ' site-header--overlay' : ''}`}>
        <div className="container site-header__bar">
          <Link to="/" className="brand" aria-label={`${site.name}, home`}><Logo /></Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M4 4l14 14M18 4L4 18" /> : <path d="M3 6h16M3 11h16M3 16h16" />}
            </svg>
          </button>

          <nav id="site-nav" className={`nav${open ? ' is-open' : ''}`} aria-label="Main">
            <ul className="nav__links">
              <li><NavLink className="nav__link" to="/rooms">Rooms</NavLink></li>
              {user && <li><NavLink className="nav__link" to="/bookings">My bookings</NavLink></li>}
              {isStaff && <li><NavLink className="nav__link" to="/admin">Admin</NavLink></li>}
            </ul>
            <div className="nav__actions">
              {user ? (
                <>
                  <span className="nav__user">{user.username}</span>
                  <button type="button" className="btn btn--ghost btn--small" onClick={logout}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav__link">Log in</Link>
                  <Link to="/rooms" className="btn btn--primary btn--small">Book a stay</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="content"><Outlet /></main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__grid">
            <div>
              <Link to="/" className="brand"><Logo /></Link>
              <p className="site-footer__blurb">{site.tagline}.</p>
            </div>
            <div>
              <h4>Stay</h4>
              <ul>
                <li><Link to="/rooms">Rooms and suites</Link></li>
                <li><Link to="/bookings">Manage a booking</Link></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li>{site.contact.address}</li>
                <li><a href={`tel:${site.contact.phone.replace(/\s/g, '')}`}>{site.contact.phone}</a></li>
                <li><a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></li>
              </ul>
            </div>
          </div>
          <p className="site-footer__legal">© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
