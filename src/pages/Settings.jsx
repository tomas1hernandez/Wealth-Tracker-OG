import { useState } from "react";
import { KeyRound, Download, Upload, Trash2, ExternalLink } from "lucide-react";
import { useStore } from "../state/store.jsx";
import { Lbl, Modal } from "../components/bits.jsx";

export default function Settings() {
  const { settings, setSettings, invs } = useStore();
  const [key, setKey] = useState(settings.finnhubKey || "");
  const [saved, setSaved] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const saveKey = () => {
    setSettings((s) => ({ ...s, finnhubKey: key.trim() }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ invs, settings: { ...settings, finnhubKey: "" }, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wealth-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (Array.isArray(d.invs)) {
          localStorage.setItem("wtog.invs", JSON.stringify(d.invs));
          window.location.reload();
        } else alert("That file doesn't look like a Wealth Tracker backup.");
      } catch {
        alert("Could not read that file.");
      }
    };
    reader.readAsText(file);
  };

  const wipe = () => {
    ["wtog.invs", "wtog.nwHistory", "wtog.heatmapCache", "wtog.ratiosCache"].forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Market data, backups, and housekeeping</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <KeyRound size={14} color="var(--accent)" /> Market Data — Finnhub API Key
        </h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Powers live stock prices, the key-ratios table, and the live heat map. The free tier is plenty.
          Create an account at{" "}
          <a href="https://finnhub.io/register" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
            finnhub.io <ExternalLink size={10} style={{ display: "inline" }} />
          </a>{" "}
          and copy your API key here. It's stored only in this browser.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste your Finnhub API key…"
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={saveKey}>{saved ? "Saved ✓" : "Save Key"}</button>
        </div>
        <div style={{ fontSize: 12, color: settings.finnhubKey ? "var(--green)" : "var(--faint)", marginTop: 10 }}>
          {settings.finnhubKey ? "● Key configured — live data enabled" : "○ No key — running in manual/demo mode"}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="card-title">Backup &amp; Restore</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Your data lives in this browser's local storage. Export a JSON backup regularly, or move data between devices.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={exportData}><Download size={13} />Export Backup</button>
          <label className="btn" style={{ cursor: "pointer" }}>
            <Upload size={13} />Import Backup
            <input type="file" accept=".json" style={{ display: "none" }} onChange={importData} />
          </label>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(229,72,77,0.25)" }}>
        <h3 className="card-title" style={{ color: "var(--red)" }}>Danger Zone</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Delete all investments, history and caches from this browser. Your API key is kept.
        </p>
        <button className="btn btn-danger" onClick={() => setConfirmWipe(true)}>
          <Trash2 size={13} />Erase All Data
        </button>
      </div>

      {confirmWipe && (
        <Modal title="Erase everything?" onClose={() => setConfirmWipe(false)} maxWidth={380}>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            All investments and history in this browser will be permanently deleted. Export a backup first if unsure.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmWipe(false)}>Cancel</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={wipe}>Erase All</button>
          </div>
        </Modal>
      )}

      <div style={{ marginTop: 26 }}>
        <Lbl>About</Lbl>
        <p className="faint" style={{ fontSize: 12, lineHeight: 1.7 }}>
          Wealth Tracker OG · personal net-worth &amp; investment tracker.<br />
          All data stays on your device — no server, no account.
        </p>
      </div>
    </div>
  );
}
