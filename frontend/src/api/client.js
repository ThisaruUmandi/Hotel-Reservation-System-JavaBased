import { tokenStore } from './tokenStore';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

/** Error from the API. `fieldErrors` maps form field names to messages (from validation failures). */
export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const unauthorizedListeners = new Set();

/** Called when the server rejects our token (expired or invalid), so the UI can log the user out. */
export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function request(method, path, { body, params } = {}) {
  const token = tokenStore.get();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE}${path}${queryString(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection and try again.');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      tokenStore.clear();
      unauthorizedListeners.forEach((listener) => listener());
    }
    throw new ApiError(
      response.status,
      data?.error ?? 'Something went wrong. Please try again.',
      data?.fieldErrors ?? {},
    );
  }
  return data;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
};
