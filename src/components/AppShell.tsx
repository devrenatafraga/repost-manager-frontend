import { Link } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";

export function AppShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="app wide">
      <header className="topbar">
        <div className="brand-block">
          <Link to="/" className="brand-link">
            Repost Manager
          </Link>
          <h1>{title}</h1>
        </div>
        <div className="topbar-actions">
          {actions}
          <button type="button" className="ghost" onClick={onLogout} disabled={loggingOut}>
            {loggingOut ? "Saindo…" : "Sair"}
          </button>
        </div>
      </header>
      {children}
    </main>
  );
}
