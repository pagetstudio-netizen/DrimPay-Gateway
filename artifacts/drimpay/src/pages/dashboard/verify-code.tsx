import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, ArrowLeft, Copy, CheckCircle2, AlertTriangle, Loader2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function RegenerateKeyPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const env = (params.get("env") ?? "sandbox") as "sandbox" | "live";
  const isLive = env === "live";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);

  const regenerate = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/api-keys/regenerate`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erreur lors de la régénération");
      setNewKey(d.rawKey);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/dashboard/profile")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </button>

        <AnimatePresence mode="wait">
          {newKey ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold mb-1">
                  Clé {isLive ? "Live" : "Sandbox"} générée
                </h1>
                <p className="text-sm text-muted-foreground">
                  Copiez cette clé maintenant. Elle ne sera plus affichée en clair.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-muted/40 rounded-2xl p-4 border border-border">
                  <p className="font-mono text-xs text-foreground break-all select-all leading-relaxed">{newKey}</p>
                </div>
                <button
                  onClick={copyKey}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm transition-all",
                    copied
                      ? "bg-green-500/10 text-green-600 border border-green-500/20"
                      : "bg-foreground text-background hover:opacity-90"
                  )}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copié !" : "Copier la clé"}
                </button>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Cette clé ne sera plus affichée après avoir quitté cette page.
                  Stockez-la dans un gestionnaire de secrets sécurisé.
                </p>
              </div>

              <button
                onClick={() => navigate("/dashboard/profile")}
                className="w-full py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Retour au profil
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6"
            >
              <div className="flex justify-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  isLive ? "bg-green-500/10" : "bg-yellow-500/10"
                )}>
                  <Key className={cn("w-10 h-10", isLive ? "text-green-500" : "text-yellow-500")} />
                </div>
              </div>

              <div className="text-center">
                <div className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3",
                  isLive ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-green-500" : "bg-yellow-400")} />
                  {isLive ? "CLÉ LIVE" : "CLÉ SANDBOX"}
                </div>
                <h1 className="text-xl font-bold mb-2">
                  Régénérer la clé {isLive ? "Live" : "Sandbox"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isLive
                    ? "L'ancienne clé live sera révoquée immédiatement. Toutes vos intégrations en production cesseront de fonctionner."
                    : "L'ancienne clé sandbox sera révoquée. Mettez à jour vos environnements de test."}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Cette action est irréversible. L'ancienne clé sera définitivement désactivée.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={regenerate}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-foreground text-background font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <RefreshCw className="w-5 h-5" />}
                  {loading ? "Génération en cours…" : "Confirmer et générer la clé"}
                </button>

                <button
                  onClick={() => navigate("/dashboard/profile")}
                  disabled={loading}
                  className="w-full py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
