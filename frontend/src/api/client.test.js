import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, onUnauthorized } from './client';
import { tokenStore } from './tokenStore';

function respond(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  });
}

describe('api client', () => {
  beforeEach(() => {
    tokenStore.clear();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends the bearer token and JSON body', async () => {
    tokenStore.set('abc');
    fetch.mockReturnValue(respond(201, { id: 1 }));
    const result = await api.post('/reservations', { roomId: 2 });
    expect(result).toEqual({ id: 1 });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/reservations');
    expect(options.headers.Authorization).toBe('Bearer abc');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.body).toBe('{"roomId":2}');
  });

  it('builds a query string and skips empty values', async () => {
    fetch.mockReturnValue(respond(200, []));
    await api.get('/rooms/available', { checkIn: '2030-01-01', guests: 2, type: '', extra: undefined });
    expect(fetch.mock.calls[0][0]).toBe('/api/rooms/available?checkIn=2030-01-01&guests=2');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('turns validation failures into ApiError with field messages', async () => {
    fetch.mockReturnValue(respond(400, { status: 400, error: 'Validation failed', fieldErrors: { email: 'Enter a valid email' } }));
    const error = await api.post('/reservations', {}).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.fieldErrors.email).toBe('Enter a valid email');
  });

  it('clears the token and notifies listeners on 401', async () => {
    tokenStore.set('expired');
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    fetch.mockReturnValue(respond(401, { error: 'Please log in to continue' }));
    await expect(api.get('/reservations/mine')).rejects.toMatchObject({ status: 401 });
    expect(tokenStore.get()).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    off();
  });

  it('does not treat a failed login (no token) as an expired session', async () => {
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    fetch.mockReturnValue(respond(401, { error: 'Invalid username or password' }));
    await expect(api.post('/auth/login', {})).rejects.toThrow('Invalid username or password');
    expect(listener).not.toHaveBeenCalled();
    off();
  });

  it('reports an unreachable server clearly', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.get('/rooms')).rejects.toMatchObject({ status: 0 });
  });

  it('handles empty responses', async () => {
    fetch.mockReturnValue(respond(204));
    expect(await api.delete('/x')).toBeNull();
  });

  it('sends PATCH requests with a JSON body', async () => {
    fetch.mockReturnValue(respond(200, { status: 'MAINTENANCE' }));
    await api.patch('/admin/rooms/2', { status: 'MAINTENANCE' });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/admin/rooms/2');
    expect(options.method).toBe('PATCH');
    expect(options.body).toBe('{"status":"MAINTENANCE"}');
  });
});
