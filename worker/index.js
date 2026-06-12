// ── Wealth Tracker OG backend ────────────────────────────────────
// Cloudflare Worker: email/password auth (PBKDF2 + session cookies in D1),
// per-user data storage, and a Finnhub proxy so the API key stays server-side.

const SESSION_COOKIE = "wt_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100_000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await route(request, env, ctx, url);
      } catch (e) {
        console.error("api error", url.pathname, e);
        return json({ error: "Internal error" }, 500);
      }
    }
    // everything else: static assets (the SPA)
    return env.ASSETS.fetch(request);
  },
};

async function route(request, env, ctx, url) {
  const p = url.pathname;
  const m = request.method;

  const secure = url.protocol === "https:";
  if (p === "/api/auth/register" && m === "POST") return register(request, env, secure);
  if (p === "/api/auth/login" && m === "POST") return login(request, env, secure);
  if (p === "/api/auth/logout" && m === "POST") return logout(request, env, secure);
  if (p === "/api/auth/me" && m === "GET") return me(request, env);

  // everything below requires a valid session
  const user = await sessionUser(request, env);
  if (!user) return json({ error: "Not authenticated" }, 401);

  if (p === "/api/data" && m === "GET") return getData(user, env);
  if (p === "/api/data" && m === "PUT") return putData(request, user, env);

  if (p === "/api/market/status" && m === "GET")
    return json({ live: Boolean(env.FINNHUB_KEY) });
  if (p === "/api/market/quote" && m === "GET")
    return marketProxy(url, env, ctx, "quote", 60);
  if (p === "/api/market/quotes" && m === "GET")
    return marketQuotes(url, env, ctx);
  if (p === "/api/market/metrics" && m === "GET")
    return marketProxy(url, env, ctx, "metrics", 12 * 3600);

  return json({ error: "Not found" }, 404);
}

// ── auth ─────────────────────────────────────────────────────────

async function register(request, env, secure) {
  const body = await readJson(request);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email" }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

  // optional allow-list: set ALLOWED_EMAILS="a@x.com,b@y.com" to lock registration
  if (env.ALLOWED_EMAILS) {
    const allowed = env.ALLOWED_EMAILS.split(",").map((s) => s.trim().toLowerCase());
    if (!allowed.includes(email)) return json({ error: "Registration is by invitation only" }, 403);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return json({ error: "An account with this email already exists" }, 409);

  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)")
    .bind(id, email, hash, salt).run();

  return sessionResponse(env, id, { email }, secure);
}

async function login(request, env, secure) {
  const body = await readJson(request);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const user = await env.DB.prepare("SELECT id, email, password_hash, salt FROM users WHERE email = ?")
    .bind(email).first();
  // constant-shape failure regardless of which part is wrong
  if (!user) return json({ error: "Invalid email or password" }, 401);
  const hash = await hashPassword(password, user.salt);
  if (!timingSafeEqual(hash, user.password_hash)) return json({ error: "Invalid email or password" }, 401);
  return sessionResponse(env, user.id, { email: user.email }, secure);
}

async function logout(request, env, secure) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return json({ ok: true }, 200, clearCookie(secure));
}

async function me(request, env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ user: null });
  return json({ user: { email: user.email } });
}

async function sessionUser(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
  ).bind(token).first();
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }
  return row;
}

async function sessionResponse(env, userId, payload, secure) {
  const token = randomHex(32);
  const expires = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, userId, expires).run();
  const cookie = `${SESSION_COOKIE}=${token}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 24 * 3600}`;
  return json({ user: payload }, 200, { "Set-Cookie": cookie });
}

const clearCookie = (secure) => ({
  "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=0`,
});

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

// ── user data ────────────────────────────────────────────────────

async function getData(user, env) {
  const row = await env.DB.prepare("SELECT data, updated_at FROM user_data WHERE user_id = ?")
    .bind(user.id).first();
  return json({ data: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at || null });
}

async function putData(request, user, env) {
  const body = await readJson(request);
  if (!body || typeof body !== "object") return json({ error: "Invalid payload" }, 400);
  const data = JSON.stringify(body);
  if (data.length > 2_000_000) return json({ error: "Payload too large" }, 413);
  await env.DB.prepare(
    `INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).bind(user.id, data).run();
  return json({ ok: true });
}

// ── market data proxy (key never leaves the server) ──────────────

const isCryptoSymbol = (s) => /-USD$/i.test(s || "");

// Finnhub's free /quote only covers US stocks (crypto symbols come back as
// c:0), so coins are quoted via Coinbase's public market data instead —
// no key needed, and it natively uses the BTC-USD symbol format.
async function cryptoQuote(symbol) {
  const res = await fetch(
    `https://api.exchange.coinbase.com/products/${encodeURIComponent(symbol.toUpperCase())}/stats`,
    { headers: { "User-Agent": "wealth-tracker-og" } }
  );
  if (!res.ok) return null;
  const d = await res.json();
  const last = parseFloat(d.last);
  const open = parseFloat(d.open); // 24 h open ≈ previous close
  if (!Number.isFinite(last) || last <= 0) return null;
  const change = Number.isFinite(open) && open > 0 ? last - open : 0;
  return {
    c: last,
    d: change,
    dp: Number.isFinite(open) && open > 0 ? (change / open) * 100 : 0,
    h: parseFloat(d.high) || null,
    l: parseFloat(d.low) || null,
    o: open || null,
    pc: open || null,
    t: Math.floor(Date.now() / 1000),
  };
}

async function fetchOneQuote(symbol, key) {
  if (isCryptoSymbol(symbol)) return cryptoQuote(symbol);
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${key}`);
  if (!res.ok) return null;
  return res.json();
}

async function marketProxy(url, env, ctx, kind, ttlSeconds) {
  const key = (env.FINNHUB_KEY || "").trim(); // tolerate stray whitespace/newlines in the secret
  if (!key) return json({ error: "Market data not configured" }, 503);
  const symbol = url.searchParams.get("symbol");
  if (!symbol || !/^[A-Za-z0-9.:^-]{1,20}$/.test(symbol)) return json({ error: "Bad symbol" }, 400);

  // cache per symbol so repeated heat-map loads don't burn the rate limit
  const cacheKey = new Request(`https://cache.local/${kind}/${symbol.toUpperCase()}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return withCors(hit);

  let body;
  if (kind === "quote") {
    const q = await fetchOneQuote(symbol, key);
    if (!q) return json({ error: "Upstream error" }, 502);
    body = JSON.stringify(q);
  } else {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/metric?metric=all&symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${key}`
    );
    if (!res.ok) return json({ error: `Upstream ${res.status}` }, res.status === 429 ? 429 : 502);
    body = await res.text();
  }
  const out = new Response(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${ttlSeconds}` },
  });
  ctx.waitUntil(cache.put(cacheKey, out.clone()));
  return out;
}

// Bulk quotes: ?symbols=AAPL,MSFT,… — one client request instead of one per
// symbol. Finnhub has no batch endpoint, so the worker fans out server-side
// (25 parallel at a time, under Finnhub's 30 req/s burst limit) and shares
// the same per-symbol 60 s edge cache as /quote. Symbols that fail (e.g.
// past the 60 req/min free quota) come back null so the client can retry.
async function marketQuotes(url, env, ctx) {
  const key = (env.FINNHUB_KEY || "").trim();
  if (!key) return json({ error: "Market data not configured" }, 503);
  const symbols = [...new Set(
    (url.searchParams.get("symbols") || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z0-9.:^-]{1,20}$/.test(s))
  )].slice(0, 150);
  if (!symbols.length) return json({ error: "No symbols" }, 400);

  const cache = caches.default;
  const quotes = {};
  for (let i = 0; i < symbols.length; i += 25) {
    await Promise.all(symbols.slice(i, i + 25).map(async (sym) => {
      const cacheKey = new Request(`https://cache.local/quote/${sym}`);
      const hit = await cache.match(cacheKey);
      if (hit) { quotes[sym] = await hit.json(); return; }
      try {
        const q = await fetchOneQuote(sym, key);
        if (q && q.c) {
          quotes[sym] = q;
          const res = new Response(JSON.stringify(q), {
            headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
          });
          ctx.waitUntil(cache.put(cacheKey, res));
        } else {
          quotes[sym] = null;
        }
      } catch {
        quotes[sym] = null;
      }
    }));
  }
  return json({ quotes });
}

const withCors = (res) => res; // same-origin app; placeholder if CORS ever needed

// ── small utils ──────────────────────────────────────────────────

const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

const randomHex = (bytes) => bytesToHex(crypto.getRandomValues(new Uint8Array(bytes)));
const bytesToHex = (arr) => [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
const hexToBytes = (hex) => new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16)));

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
