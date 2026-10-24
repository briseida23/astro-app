// Worker in front of the static site: /api/* is handled here, everything else is the Vite build.
// Test stage: email + password sign-in with Better Auth on D1, to check that password hashing
// fits the Workers CPU limits before user data is built on top of it.
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';

function createAuth(env, origin) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: origin,
    emailAndPassword: { enabled: true },
  });
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    if (url.pathname === '/api/health') return json({ ok: true });

    const auth = createAuth(env, url.origin);

    // Creates or updates the auth tables. Needs the MIGRATE_TOKEN secret; test stage only.
    if (url.pathname === '/api/migrate' && request.method === 'POST') {
      if (!env.MIGRATE_TOKEN || request.headers.get('authorization') !== `Bearer ${env.MIGRATE_TOKEN}`) {
        return json({ error: 'forbidden' }, 403);
      }
      const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
      await runMigrations();
      return json({ created: toBeCreated.map((t) => t.table), added: toBeAdded.map((t) => t.table) });
    }

    if (url.pathname.startsWith('/api/auth/')) return auth.handler(request);

    return json({ error: 'not found' }, 404);
  },
};
