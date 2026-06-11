import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const value = {
    user,
    checking,
    login: async (email, password) => {
      const d = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setUser(d.user);
    },
    register: async (email, password) => {
      const d = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      setUser(d.user);
    },
    logout: async () => {
      await api("/api/auth/logout", { method: "POST" }).catch(() => {});
      setUser(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
