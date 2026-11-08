const KEY = 'hotel_token';
let memory = null; // fallback when localStorage is unavailable (private mode, blocked storage)

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(KEY) ?? memory;
    } catch {
      return memory;
    }
  },
  set(token) {
    memory = token;
    try {
      localStorage.setItem(KEY, token);
    } catch {
      /* keep the in-memory copy */
    }
  },
  clear() {
    memory = null;
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};
