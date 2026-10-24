// Client for the Worker API: Better Auth endpoints under /api/auth and our own data endpoints.
// On a deployment without the Worker API every call fails and the app stays local-only.

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const type = response.headers.get('content-type') ?? '';
  // Without the Worker the single-page fallback answers with index.html.
  const data = type.includes('application/json') ? await response.json() : null;
  if (!response.ok || data === null) {
    const error = new Error(data?.message ?? data?.error ?? `HTTP ${response.status}`);
    error.code = data?.code ?? null;
    error.status = response.status;
    throw error;
  }
  return data;
}

/** Sign-in methods offered by the server, or null when accounts are not available. */
export const getConfig = () => request('/api/config').catch(() => null);

/** The signed-in user, or null. */
export const getSession = () =>
  request('/api/auth/get-session')
    .then((data) => data?.user ?? null)
    .catch(() => null);

export const signIn = (email, password) =>
  request('/api/auth/sign-in/email', { method: 'POST', body: { email, password } });

export const signUp = (name, email, password) =>
  request('/api/auth/sign-up/email', { method: 'POST', body: { name, email, password } });

/** Starts Google sign-in: the browser leaves for Google and comes back to the app. */
export async function signInWithGoogle() {
  const { url } = await request('/api/auth/sign-in/social', {
    method: 'POST',
    body: { provider: 'google', callbackURL: window.location.pathname },
  });
  window.location.href = url;
}

export const signOut = () => request('/api/auth/sign-out', { method: 'POST', body: {} });

export const deleteAccount = () => request('/api/account', { method: 'DELETE' });

export const loadSettings = () => request('/api/settings').then((r) => r.data);
export const saveSettings = (data) => request('/api/settings', { method: 'PUT', body: { data } });

export const listCharts = () => request('/api/charts').then((r) => r.charts);
export const createChart = (name, data) => request('/api/charts', { method: 'POST', body: { name, data } }).then((r) => r.chart);
export const deleteChart = (id) => request(`/api/charts/${encodeURIComponent(id)}`, { method: 'DELETE' });
