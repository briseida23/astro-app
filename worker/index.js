// Worker in front of the static site: /api/* is handled here, everything else is the Vite build.
// Accounts (Better Auth on D1: email + password, Google when configured) and per-user storage
// of settings and saved charts.
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { captcha } from 'better-auth/plugins/captcha';
import { EmailMessage } from 'cloudflare:email';

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
  // Messages from the "About" form; user_id is null for guests.
  `CREATE TABLE IF NOT EXISTS feedback (
     id TEXT PRIMARY KEY,
     user_id TEXT,
     email TEXT,
     kind TEXT NOT NULL,
     message TEXT NOT NULL,
     lang TEXT,
     created_at INTEGER NOT NULL
   )`,
];

// Limits that keep one account from filling the free database: real birth data is under 1 KB.
const MAX_SETTINGS = 32 * 1024;
const MAX_CHART = 4 * 1024;
const MAX_CHARTS = 500;
const MAX_NAME = 120;
const MAX_MESSAGE = 4000;
const FEEDBACK_KINDS = ['idea', 'bug', 'other'];
// Feedback is also emailed to the owner, so the database copy is kept only this long.
const FEEDBACK_DAYS = 30;

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

/** Cloudflare's answer on a Turnstile token (guests' feedback; sign-in uses Better Auth's plugin). */
async function turnstilePassed(token, env, request) {
  if (!token) return false;
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get('cf-connecting-ip') ?? undefined,
    }),
  });
  const result = await response.json().catch(() => null);
  return Boolean(result?.success);
}

// Sender of feedback notifications: any address on duoastro.app works once Email Routing is on.
const FEEDBACK_FROM = 'feedback@duoastro.app';
const FEEDBACK_SUBJECTS = { idea: 'Idea', bug: 'Bug', other: 'Other' };

const base64 = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};
// Also keeps visitor input out of mail headers unless it is a plain address (no line breaks).
const looksLikeEmail = (text) => /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/.test(text);

/**
 * Emails a new feedback message to the owner: FEEDBACK_EMAIL is the send_email binding, FEEDBACK_TO
 * a secret with the recipient (a verified Email Routing destination). Sites without them skip it.
 */
async function notifyFeedback(env, { kind, message, email, lang, signedIn }) {
  if (!env.FEEDBACK_EMAIL || !env.FEEDBACK_TO) return;
  const subject = `DuoAstro feedback: ${FEEDBACK_SUBJECTS[kind]}`;
  const body = [
    `Type: ${FEEDBACK_SUBJECTS[kind]}`,
    `From: ${email ?? 'no email'}${signedIn ? ' (signed in)' : ''}`,
    `Language: ${lang ?? '-'}`,
    '',
    message,
  ].join('\n');
  const headers = [
    `From: DuoAstro <${FEEDBACK_FROM}>`,
    `To: <${env.FEEDBACK_TO}>`,
    `Subject: =?UTF-8?B?${base64(subject)}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@duoastro.app>`,
    // "Reply" in the mail app then answers the visitor directly.
    ...(email && looksLikeEmail(email) ? [`Reply-To: ${email}`] : []),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ];
  const raw = `${headers.join('\r\n')}\r\n\r\n${base64(body).replace(/.{76}/g, '$&\r\n')}`;
  await env.FEEDBACK_EMAIL.send(new EmailMessage(FEEDBACK_FROM, env.FEEDBACK_TO, raw));
}

/** POST /api/feedback: anyone may write; guests pass Turnstile, signed-in users are linked to the message. */
async function handleFeedback(request, env, url, auth, ctx) {
  if (request.headers.get('origin') !== url.origin) return json({ error: 'forbidden' }, 403);
  const body = await readJson(request, 2 * MAX_MESSAGE);
  const message = String(body?.message ?? '').trim().slice(0, MAX_MESSAGE);
  const kind = FEEDBACK_KINDS.includes(body?.kind) ? body.kind : 'other';
  if (!message) return json({ error: 'bad request' }, 400);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && turnstileEnabled(env) && !(await turnstilePassed(request.headers.get('x-captcha-response'), env, request))) {
    return json({ error: 'captcha', code: 'VERIFICATION_FAILED' }, 403);
  }
  const email = session ? session.user.email : String(body?.email ?? '').trim().slice(0, 200) || null;
  const lang = String(body?.lang ?? '').slice(0, 5) || null;
  await env.DB.prepare('INSERT INTO feedback (id, user_id, email, kind, message, lang, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), session?.user.id ?? null, email, kind, message, lang, Date.now())
    .run();
  // After the response: the message is already saved, so a mail failure must not fail the request.
  ctx.waitUntil(
    notifyFeedback(env, { kind, message, email, lang, signedIn: Boolean(session) }).catch((err) =>
      console.error('feedback email failed', err),
    ),
  );
  return json({ ok: true }, 201);
}

/**
 * Per-IP request limits (Cloudflare rate limiting bindings): sign-in and sign-up hash
 * passwords (~100 ms CPU each), so they get a much lower limit than the rest of the API.
 * Returns a 429 response when over the limit.
 */
async function rateLimited(request, env, url) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  // Password checks and feedback (open to guests) get the strict limit.
  const strict = /^\/api\/auth\/sign-(in|up)\//.test(url.pathname) || url.pathname === '/api/feedback';
  const limiter = strict ? env.AUTH_LIMITER : env.API_LIMITER;
  if (!limiter) return null;
  const { success } = await limiter.limit({ key: ip });
  return success ? null : json({ error: 'too many requests' }, 429);
}

/**
 * Daily cleanup (cron in wrangler.jsonc): sign-in sessions and one-time records past their expiry,
 * which Better Auth leaves behind when a user never comes back, and old feedback.
 * Better Auth stores dates as ISO text, so they compare as strings.
 */
async function cleanUp(env) {
  const now = new Date().toISOString();
  const results = await env.DB.batch([
    env.DB.prepare('DELETE FROM session WHERE expiresAt < ?').bind(now),
    env.DB.prepare('DELETE FROM verification WHERE expiresAt < ?').bind(now),
    env.DB.prepare('DELETE FROM feedback WHERE created_at < ?').bind(Date.now() - FEEDBACK_DAYS * 24 * 60 * 60 * 1000),
  ]);
  const [sessions, verifications, feedback] = results.map((r) => r.meta.changes);
  console.log('cleanup', { sessions, verifications, feedback });
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(cleanUp(env));
  },

  async fetch(request, env, ctx) {
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
    if (url.pathname === '/api/feedback' && request.method === 'POST') return handleFeedback(request, env, url, auth, ctx);

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
