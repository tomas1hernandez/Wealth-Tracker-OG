var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.js
var SESSION_COOKIE = "wt_session";
var SESSION_DAYS = 30;
var PBKDF2_ITERATIONS = 1e5;
var worker_default = {
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
    return env.ASSETS.fetch(request);
  }
};
async function route(request, env, ctx, url) {
  const p = url.pathname;
  const m = request.method;
  const secure = url.protocol === "https:";
  if (p === "/api/auth/register" && m === "POST") return register(request, env, secure);
  if (p === "/api/auth/login" && m === "POST") return login(request, env, secure);
  if (p === "/api/auth/logout" && m === "POST") return logout(request, env, secure);
  if (p === "/api/auth/me" && m === "GET") return me(request, env);
  const user = await sessionUser(request, env);
  if (!user) return json({ error: "Not authenticated" }, 401);
  if (p === "/api/data" && m === "GET") return getData(user, env);
  if (p === "/api/data" && m === "PUT") return putData(request, user, env);
  if (p === "/api/market/status" && m === "GET")
    return json({ live: Boolean(env.FINNHUB_KEY) });
  if (p === "/api/market/quote" && m === "GET")
    return marketProxy(url, env, ctx, "quote", 60);
  if (p === "/api/market/metrics" && m === "GET")
    return marketProxy(url, env, ctx, "metrics", 12 * 3600);
  return json({ error: "Not found" }, 404);
}
__name(route, "route");
async function register(request, env, secure) {
  const body = await readJson(request);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email" }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
  if (env.ALLOWED_EMAILS) {
    const allowed = env.ALLOWED_EMAILS.split(",").map((s) => s.trim().toLowerCase());
    if (!allowed.includes(email)) return json({ error: "Registration is by invitation only" }, 403);
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) return json({ error: "An account with this email already exists" }, 409);
  const salt = randomHex(16);
  const hash = await hashPassword(password, salt);
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)").bind(id, email, hash, salt).run();
  return sessionResponse(env, id, { email }, secure);
}
__name(register, "register");
async function login(request, env, secure) {
  const body = await readJson(request);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const user = await env.DB.prepare("SELECT id, email, password_hash, salt FROM users WHERE email = ?").bind(email).first();
  if (!user) return json({ error: "Invalid email or password" }, 401);
  const hash = await hashPassword(password, user.salt);
  if (!timingSafeEqual(hash, user.password_hash)) return json({ error: "Invalid email or password" }, 401);
  return sessionResponse(env, user.id, { email: user.email }, secure);
}
__name(login, "login");
async function logout(request, env, secure) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return json({ ok: true }, 200, clearCookie(secure));
}
__name(logout, "logout");
async function me(request, env) {
  const user = await sessionUser(request, env);
  if (!user) return json({ user: null });
  return json({ user: { email: user.email } });
}
__name(me, "me");
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
__name(sessionUser, "sessionUser");
async function sessionResponse(env, userId, payload, secure) {
  const token = randomHex(32);
  const expires = Date.now() + SESSION_DAYS * 24 * 3600 * 1e3;
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, userId, expires).run();
  const cookie = `${SESSION_COOKIE}=${token}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 24 * 3600}`;
  return json({ user: payload }, 200, { "Set-Cookie": cookie });
}
__name(sessionResponse, "sessionResponse");
var clearCookie = /* @__PURE__ */ __name((secure) => ({
  "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax; Path=/; Max-Age=0`
}), "clearCookie");
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
__name(hashPassword, "hashPassword");
async function getData(user, env) {
  const row = await env.DB.prepare("SELECT data, updated_at FROM user_data WHERE user_id = ?").bind(user.id).first();
  return json({ data: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at || null });
}
__name(getData, "getData");
async function putData(request, user, env) {
  const body = await readJson(request);
  if (!body || typeof body !== "object") return json({ error: "Invalid payload" }, 400);
  const data = JSON.stringify(body);
  if (data.length > 2e6) return json({ error: "Payload too large" }, 413);
  await env.DB.prepare(
    `INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).bind(user.id, data).run();
  return json({ ok: true });
}
__name(putData, "putData");
function finnhubSymbol(raw) {
  const t = (raw || "").toUpperCase();
  if (/-USD$/.test(t)) return `BINANCE:${t.replace("-USD", "")}USDT`;
  return t;
}
__name(finnhubSymbol, "finnhubSymbol");
async function marketProxy(url, env, ctx, kind, ttlSeconds) {
  if (!env.FINNHUB_KEY) return json({ error: "Market data not configured" }, 503);
  const symbol = url.searchParams.get("symbol");
  if (!symbol || !/^[A-Za-z0-9.:^-]{1,20}$/.test(symbol)) return json({ error: "Bad symbol" }, 400);
  const upstream = kind === "quote" ? `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol(symbol))}` : `https://finnhub.io/api/v1/stock/metric?metric=all&symbol=${encodeURIComponent(symbol.toUpperCase())}`;
  const cacheKey = new Request(`https://cache.local/${kind}/${symbol.toUpperCase()}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return withCors(hit);
  const res = await fetch(`${upstream}&token=${env.FINNHUB_KEY}`);
  if (!res.ok) return json({ error: `Upstream ${res.status}` }, res.status === 429 ? 429 : 502);
  const body = await res.text();
  const out = new Response(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${ttlSeconds}` }
  });
  ctx.waitUntil(cache.put(cacheKey, out.clone()));
  return out;
}
__name(marketProxy, "marketProxy");
var withCors = /* @__PURE__ */ __name((res) => res, "withCors");
var json = /* @__PURE__ */ __name((obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers }
}), "json");
async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
__name(readJson, "readJson");
function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}
__name(cookieValue, "cookieValue");
var randomHex = /* @__PURE__ */ __name((bytes) => bytesToHex(crypto.getRandomValues(new Uint8Array(bytes))), "randomHex");
var bytesToHex = /* @__PURE__ */ __name((arr) => [...arr].map((b) => b.toString(16).padStart(2, "0")).join(""), "bytesToHex");
var hexToBytes = /* @__PURE__ */ __name((hex) => new Uint8Array(hex.match(/.{2}/g).map((h) => parseInt(h, 16))), "hexToBytes");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-30AiBv/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-30AiBv/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
