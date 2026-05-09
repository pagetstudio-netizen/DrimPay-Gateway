import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type Mode = "sandbox" | "live";
export type KybStatus = "pending" | "submitted" | "under_review" | "approved" | "rejected";

type ModeState = {
  mode: Mode;
  kybStatus: KybStatus;
  loading: boolean;
  setMode: (m: Mode) => Promise<{ error?: string }>;
};

const ModeContext = createContext<ModeState | null>(null);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("sandbox");
  const [kybStatus, setKybStatus] = useState<KybStatus>("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/mode`, { credentials: "include" })
      .then(r => (r.ok ? r.json() : { mode: "sandbox", kybStatus: "pending" }))
      .then(d => {
        setModeState((d.mode as Mode) ?? "sandbox");
        setKybStatus((d.kybStatus as KybStatus) ?? "pending");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setMode = useCallback(async (m: Mode): Promise<{ error?: string }> => {
    const r = await fetch(`${BASE}/api/dashboard/mode`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    });
    if (r.ok) {
      setModeState(m);
      return {};
    }
    const d = await r.json().catch(() => ({}));
    return { error: (d as any).error ?? "Erreur" };
  }, []);

  return (
    <ModeContext.Provider value={{ mode, kybStatus, loading, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
