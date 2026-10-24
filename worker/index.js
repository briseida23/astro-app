// Worker in front of the static site: /api/* is handled here, everything else is the Vite build.
// Accounts (Better Auth on D1: email + password, Google when configured) and per-user storage
// of settings and saved charts.
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { captcha } from 'better-auth/plugins/captcha';

// Tables of our own, next to Better Auth's user/session/account/verification.
const APP_TABLES = [
  `CREATE TABLE IF NOT EXISTS user_settings (
     user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
     data TEXT NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS chart (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     data TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL
   )`,
  'CREATE INDEX IF NOT EXISTS chart_user ON chart(user_id, updated_at)',
];

// Limits that keep one account from filling the free database: real birth data is under 1 KB.
const MAX_SETTINGS = 32 * 1024;
const MAX_CHART = 4 * 1024;
const MAX_CHARTS = 500;
const MAX_NAME = 120;

const googleEnabled = (env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
// Cloudflare Turnstile on sign-in and sign-up, so bots cannot mass-register or guess passwords.
const turnstileEnabled = (env) => Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);

function createAuth(env, origin) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: origin,
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    socialProviders: googleEnabled(env)
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {},
    plugins: turnstileEnabled(env)
      ? [
          captcha({
            provider: 'cloudflare-turnstile',
            secretKey: env.TURNSTILE_SECRET_KEY,
            endpoints: ['/sign-up/email', '/sign-in/email'],
          }),
        ]
      : [],
  });
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

/** Request body as parsed JSON, or null when larger than `max` bytes or not JSON. */
async function readJson(request, max) {
  const declared = Number(request.headers.get('content-length'));
  if (declared > max) return null;
  const text = await request.text();
  if (text.length > max) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Saved chart row → API shape. */
const chartOut = (row) => ({
  id: row.id,
  name: row.name,
  data: JSON.parse(row.data),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const cleanName = (name) => String(name ?? '').trim().slice(0, MAX_NAME);

/** /api/settings and /api/charts for the signed-in user. */
async function handleData(request, env, url, userId) {
  const db = env.DB;
  const now = Date.now();

  if (url.pathname === '/api/settings') {
    if (request.method === 'GET') {
      const row = await db.prepare('SELECT data, updated_at FROM user_settings WHERE user_id = ?').bind(userId).first();
      return json(row ? { data: JSON.parse(row.data), updatedAt: row.updated_at } : { data: null });
    }
    if (request.method === 'PUT') {
      const body = await readJson(request, MAX_SETTINGS);
      if (!body || typeof body.data !== 'object' || body.data === null) return json({ error: 'bad request' }, 400);
      await db
        .prepare(
          `INSERT INTO user_settings (user_id, data, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
        )
        .bind(userId, JSON.stringify(body.data), now)
        .run();
      return json({ ok: true, updatedAt: now });
    }
  }

  if (url.pathname === '/api/charts') {
    if (request.method === 'GET') {
      const { results } = await db
        .prepare('SELECT * FROM chart WHERE user_id = ? ORDER BY updated_at DESC')
        .bind(userId)
        .all();
      return json({ charts: results.map(chartOut) });
    }
    if (request.method === 'POST') {
      const body = await readJson(request, MAX_CHART);
      const name = cleanName(body?.name);
      if (!name || typeof body.data !== 'object' || body.data === null) return json({ error: 'bad request' }, 400);
      const { count } = await db.prepare('SELECT COUNT(*) AS count FROM chart WHERE user_id = ?').bind(userId).first();
      if (count >= MAX_CHARTS) return json({ error: 'too many charts' }, 409);
      const id = crypto.randomUUID();
      await db
        .prepare('INSERT INTO chart (id, user_id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, userId, name, JSON.stringify(body.data), now, now)
        .run();
      return json({ chart: { id, name, data: body.data, createdAt: now, updatedAt: now } }, 201);
    }
  }

  const match = url.pathname.match(/^\/api\/charts\/([\w-]+)$/);
  if (match) {
    const id = match[1];
    if (request.method === 'PUT') {
      const body = await readJson(request, MAX_CHART);
      const name = cleanName(body?.name);
      if (!name || typeof body.data !== 'object' || body.data === null) return json({ error: 'bad request' }, 400);
      const { meta } = await db
        .prepare('UPDATE chart SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?')
        .bind(name, JSON.stringify(body.data), now, id, userId)
        .run();
      return meta.changes ? json({ ok: true, updatedAt: now }) : json({ error: 'not found' }, 404);
    }
    if (request.method === 'DELETE') {
      const { meta } = await db.prepare('DELETE FROM chart WHERE id = ? AND user_id = ?').bind(id, userId).run();
      return meta.changes ? json({ ok: true }) : json({ error: 'not found' }, 404);
    }
  }

  if (url.pathname === '/api/account' && request.method === 'DELETE') {
    // Everything of the user, in one batch: own data, then Better Auth's rows.
    await db.batch([
      db.prepare('DELETE FROM chart WHERE user_id = ?').bind(userId),
      db.prepare('DELETE FROM user_settings WHERE user_id = ?').bind(userId),
      db.prepare('DELETE FROM session WHERE userId = ?').bind(userId),
      db.prepare('DELETE FROM account WHERE userId = ?').bind(userId),
      db.prepare('DELETE FROM user WHERE id = ?').bind(userId),
    ]);
    return json({ ok: true });
  }

  return json({ error: 'not found' }, 404);
}

/**
 * Per-IP request limits (Cloudflare rate limiting bindings): sign-in and sign-up hash
 * passwords (~100 ms CPU each), so they get a much lower limit than the rest of the API.
 * Returns a 429 response when over the limit.
 */
async function rateLimited(request, env, url) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const isPasswordCheck = /^\/api\/auth\/sign-(in|up)\//.test(url.pathname);
  const limiter = isPasswordCheck ? env.AUTH_LIMITER : env.API_LIMITER;
  if (!limiter) return null;
  const { success } = await limiter.limit({ key: ip });
  return success ? null : json({ error: 'too many requests' }, 429);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const limited = await rateLimited(request, env, url);
    if (limited) return limited;

    if (url.pathname === '/api/health') return json({ ok: true });
    // Which sign-in methods the client may offer.
    if (url.pathname === '/api/config') {
      return json({ google: googleEnabled(env), turnstile: turnstileEnabled(env) ? env.TURNSTILE_SITE_KEY : null });
    }

    const auth = createAuth(env, url.origin);

    // Creates or updates all tables. Needs the MIGRATE_TOKEN secret.
    if (url.pathname === '/api/migrate' && request.method === 'POST') {
      if (!env.MIGRATE_TOKEN || request.headers.get('authorization') !== `Bearer ${env.MIGRATE_TOKEN}`) {
        return json({ error: 'forbidden' }, 403);
      }
      const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
      await runMigrations();
      await env.DB.batch(APP_TABLES.map((sql) => env.DB.prepare(sql)));
      return json({ created: toBeCreated.map((t) => t.table), added: toBeAdded.map((t) => t.table) });
    }

    if (url.pathname.startsWith('/api/auth/')) return auth.handler(request);

    // Our own endpoints: signed-in users only. Changes must come from this site (the session
    // cookie would otherwise be sent along with requests forged by other sites).
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return json({ error: 'unauthorized' }, 401);
    if (request.method !== 'GET' && request.headers.get('origin') !== url.origin) {
      return json({ error: 'forbidden' }, 403);
    }
    return handleData(request, env, url, session.user.id);
  },
};
