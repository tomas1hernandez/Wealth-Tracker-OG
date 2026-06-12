import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../state/auth.jsx";
import { Lbl, ThMark } from "../components/bits.jsx";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "radial-gradient(1100px 500px at 50% -10%, rgba(201,168,106,0.07), transparent), var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, margin: "0 auto 14px" }}>
            <ThMark size={52} radius={13} />
          </div>
          <h1 className="display" style={{ margin: 0, fontSize: 26 }}>Wealth Tracker</h1>
          <div style={{ fontSize: 10, color: "var(--faint)", textTransform: "uppercase", letterSpacing: 3, marginTop: 4 }}>TH · Private</div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div className="seg" style={{ width: "100%", marginBottom: 22, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
            <button className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setError(""); }}>Create Account</button>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 14 }}>
              <Lbl>Email</Lbl>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
                <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ paddingLeft: 36 }} autoComplete="email" />
              </div>
            </div>
            <div style={{ marginBottom: mode === "register" ? 14 : 20 }}>
              <Lbl>Password</Lbl>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
                <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} style={{ paddingLeft: 36 }} autoComplete={mode === "login" ? "current-password" : "new-password"} />
              </div>
            </div>
            {mode === "register" && (
              <div style={{ marginBottom: 20 }}>
                <Lbl>Confirm Password</Lbl>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--faint)" }} />
                  <input className="input" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" style={{ paddingLeft: 36 }} autoComplete="new-password" />
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "var(--red-soft)", border: "1px solid rgba(229,72,77,0.3)", borderRadius: 8, padding: "9px 13px", fontSize: 12.5, color: "#f08389", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", padding: "12px" }}>
              {busy ? "One moment…" : mode === "login" ? "Sign In" : "Create Account"}
              {!busy && <ArrowRight size={14} />}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--faint)", marginTop: 18, lineHeight: 1.6 }}>
          Your portfolio is stored securely in your account<br />and synced across devices.
        </p>
      </div>
    </div>
  );
}
