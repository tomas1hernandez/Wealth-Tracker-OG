import { HashRouter, Routes, Route, NavLink } from "react-router-dom";
import { LayoutDashboard, Briefcase, Grid3X3, Sigma, Clock, Settings as SettingsIcon, TrendingUp } from "lucide-react";
import { StoreProvider } from "./state/store.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Heatmap from "./pages/Heatmap.jsx";
import Ratios from "./pages/Ratios.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";

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

export default function App() {
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
            <div style={{ padding: "0 12px", fontSize: 10.5, color: "var(--faint)", lineHeight: 1.6 }}>
              Data stays in your browser.<br />Back it up in Settings.
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
