import { useState } from "react";
import { Download, Upload, Trash2, UserRound, Cloud, CloudOff, LogOut } from "lucide-react";
import { useStore } from "../state/store.jsx";
import { useAuth } from "../state/auth.jsx";
import { Lbl, Modal } from "../components/bits.jsx";

export default function Settings() {
  const { invs, watchlist, nwHistory, marketLive, importData, wipeData } = useStore();
  const { user, logout } = useAuth();
  const [confirmWipe, setConfirmWipe] = useState(false);

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ invs, watchlist, nwHistory, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wealth-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (Array.isArray(d.invs)) importData(d);
        else alert("That file doesn't look like a Wealth Tracker backup.");
      } catch {
        alert("Could not read that file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Account, data, and housekeeping</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserRound size={14} color="var(--accent)" /> Account
        </h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.email}</div>
            <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>
              Your portfolio is stored in your account and synced across devices.
            </div>
          </div>
          <button className="btn" onClick={logout}><LogOut size={13} />Sign Out</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {marketLive ? <Cloud size={14} color="var(--green)" /> : <CloudOff size={14} color="var(--accent)" />} Market Data
        </h3>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {marketLive ? (
            <>● Live quotes, ratios and the heat map are <b style={{ color: "var(--green)" }}>enabled</b>. The market-data API key is stored securely on the server — it never reaches your browser.</>
          ) : (
            <>○ Live market data is not configured. The site owner needs to set the <code>FINNHUB_KEY</code> secret on the backend (Cloudflare → Worker → Settings → Variables).</>
          )}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="card-title">Backup &amp; Restore</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Export a JSON snapshot of your portfolio, or restore one. Imports replace your current data and sync to your account.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={exportData}><Download size={13} />Export Backup</button>
          <label className="btn" style={{ cursor: "pointer" }}>
            <Upload size={13} />Import Backup
            <input type="file" accept=".json" style={{ display: "none" }} onChange={importFile} />
          </label>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(229,72,77,0.25)" }}>
        <h3 className="card-title" style={{ color: "var(--red)" }}>Danger Zone</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Delete all investments, watchlist and history from your account.
        </p>
        <button className="btn btn-danger" onClick={() => setConfirmWipe(true)}>
          <Trash2 size={13} />Erase All Data
        </button>
      </div>

      {confirmWipe && (
        <Modal title="Erase everything?" onClose={() => setConfirmWipe(false)} maxWidth={380}>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            All investments and history in your account will be permanently deleted. Export a backup first if unsure.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmWipe(false)}>Cancel</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { wipeData(); setConfirmWipe(false); }}>Erase All</button>
          </div>
        </Modal>
      )}

      <div style={{ marginTop: 26 }}>
        <Lbl>About</Lbl>
        <p className="faint" style={{ fontSize: 12, lineHeight: 1.7 }}>
          Wealth Tracker OG · personal net-worth &amp; investment tracker.<br />
          Backend on Cloudflare Workers · data in Cloudflare D1.
        </p>
      </div>
    </div>
  );
}
