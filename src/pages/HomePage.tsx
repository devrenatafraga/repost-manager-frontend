import { useEffect, useState } from "react";
import { getAdminSurface } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function HomePage() {
  const { accessToken, logout, clearSession } = useAuth();
  const [surface, setSurface] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await getAdminSurface(accessToken);
        if (!cancelled) {
          setSurface(data);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          return;
        }
        setError("Não foi possível carregar a superfície admin.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession]);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>Repost Manager</h1>
        <button type="button" onClick={onLogout} disabled={loggingOut}>
          {loggingOut ? "Saindo…" : "Sair"}
        </button>
      </header>
      <p className="lede">Painel admin autenticado.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {surface ? (
        <p className="muted">
          Superfície <code>{surface.surface}</code> · versão <code>{surface.version}</code>
        </p>
      ) : (
        <p className="muted">Carregando…</p>
      )}
    </main>
  );
}
