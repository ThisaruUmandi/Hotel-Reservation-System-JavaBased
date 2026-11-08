import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { onUnauthorized } from '../api/client';
import { tokenStore } from '../api/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // Restore the session from a saved token when the app loads.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // The API rejected our token (e.g. it expired): drop the session.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  const finishLogin = useCallback(({ token, user: loggedIn }) => {
    tokenStore.set(token);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isStaff: user?.role === 'STAFF' || user?.role === 'ADMIN',
      login: async (username, password) => finishLogin(await authApi.login(username, password)),
      register: async (username, password) => finishLogin(await authApi.register(username, password)),
      refresh: async () => setUser(await authApi.me()), // e.g. after the first booking saves a guest profile
      logout: () => {
        tokenStore.clear();
        setUser(null);
      },
    }),
    [user, loading, finishLogin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
