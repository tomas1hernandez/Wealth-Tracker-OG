import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Grid3X3, Sigma, Clock, Settings as SettingsIcon, TrendingUp, LogOut, Cloud, CloudOff } from "lucide-react";
import { AuthProvider, useAuth } from "./state/auth.jsx";
import { StoreProvider, useStore } from "./state/store.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Heatmap from "./pages/Heatmap.jsx";
import Ratios from "./pages/Ratios.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { section: "Markets" },
  { to: "/heatmap", label: "Heat Map", icon: Grid3X3 },
  { to: "/ratios", label: "Key Ratios", icon: Sigma },
  { section: "Records" },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function SaveBadge() {
  const { saveState } = useStore();
  if (saveState === "idle") return null;
  const map = {
    saving: ["Syncing…", "var(--muted)", Cloud],
    saved: ["Synced", "var(--green)", Cloud],
    error: ["Sync failed — retrying on next change", "var(--red)", CloudOff],
  };
  const [label, color, Icon] = map[saveState];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", fontSize: 11, color }}>
      <Icon size={13} />{label}
    </div>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  return (
    <StoreProvider>
      <HashRouter>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark"><TrendingUp size={18} /></div>
              <div>
                <div className="brand-name">Wealth Tracker</div>
                <div className="brand-sub">OG · Private</div>
              </div>
            </div>
            {NAV.map((n, i) =>
              n.section ? (
                <div key={i} className="nav-section">{n.section}</div>
              ) : (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
                  <n.icon size={16} />
                  {n.label}
                </NavLink>
              )
            )}
            <div style={{ flex: 1 }} />
            <SaveBadge />
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
              <div style={{ padding: "0 12px 8px", fontSize: 11, color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={user.email}>
                {user.email}
              </div>
              <button className="nav-item" style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }} onClick={logout}>
                <LogOut size={15} />Sign Out
              </button>
            </div>
          </aside>
          <main className="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/heatmap" element={<Heatmap />} />
              <Route path="/ratios" element={<Ratios />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </StoreProvider>
  );
}

function Gate() {
  const { user, checking } = useAuth();
  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", fontSize: 13 }}>
        Loading…
      </div>
    );
  }
  return user ? <Shell /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
