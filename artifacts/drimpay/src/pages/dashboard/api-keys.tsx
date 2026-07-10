import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Plus, Trash2, Copy, Eye, EyeOff, CheckCircle2, AlertTriangle,
  Shield, Globe, Cpu, Webhook, Network, ChevronRight, X, Loader2,
  AlertCircle, Lock, RefreshCw, ChevronDown, KeyRound,
} from "lucide-react";
import apiIconImg from "@assets/6213702_1778508885407.png";
import { DashboardLayout } from "./layout";
import { ProductionGate } from "@/components/ui/production-gate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiKey = {
  id: number;
  name: string;
  description?: string | null;
  prefix: string;
  env: "sandbox" | "live";
  status: "active" | "revoked";
  lastUsedAt?: string | null;
  createdAt: string;
};

type WebhookRow = { id: number; url: string; label?: string | null; createdAt: string };
type IpRow      = { id: number; ip: string; label?: string | null; createdAt: string };

// pending action needing password
type PendingAction =
  | { mode: "reveal";      keyId: number; keyName: string }
  | { mode: "regenerate";  env: "sandbox" | "live" };

// ─── Small helpers ────────────────────────────────────────────────────────────

const inputCls = (err?: boolean) => cn(
  "h-10 w-full rounded-xl border bg-gray-50 px-3 text-sm text-gray-900 placeholder:text-gray-400",
  "outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all",
  err ? "border-red-300 bg-red-50/30" : "border-gray-200"
);

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = Object.assign(document.createElement("textarea"), {
          value: text, style: { cssText: "position:fixed;left:-9999px;opacity:0" },
        });
        document.body.appendChild(el); el.focus(); el.select();
        document.execCommand("copy"); document.body.removeChild(el);
      }
    } catch { /* fallback already tried */ }
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };
  return { copied, copy };
}

// ─── Password confirmation modal ──────────────────────────────────────────────

function PasswordModal({
  pending,
  onConfirm,
  onClose,
}: {
  pending: PendingAction;
  onConfirm: (password: string) => Promise<string | null>; // returns error or null
  onClose: () => void;
}) {
  const [pw, setPw]         = useState("");
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw) { setErr("Mot de passe requis."); return; }
    setLoading(true); setErr("");
    const error = await onConfirm(pw);
    setLoading(false);
    if (error) setErr(error);
  };

  const isRegenerate = pending.mode === "regenerate";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-700" />
            {isRegenerate ? "Confirmer la régénération" : "Confirmer votre identité"}
          </DialogTitle>
          <DialogDescription>
            {isRegenerate
              ? `Entrez votre mot de passe pour régénérer la clé ${pending.env === "live" ? "Live" : "Sandbox"}. L'ancienne clé sera révoquée.`
              : `Entrez votre mot de passe pour révéler la clé "${(pending as Extract<PendingAction, {mode:"reveal"}>).keyName}".`
            }
          </DialogDescription>
        </DialogHeader>

        {isRegenerate && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>L'ancienne clé sera immédiatement révoquée et toutes les intégrations utilisant cette clé cesseront de fonctionner.</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Mot de passe</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Votre mot de passe"
              autoFocus
              className={cn(inputCls(!!err), "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {err}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-colors disabled:opacity-60",
              isRegenerate
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-gray-900 hover:bg-gray-800 text-white"
            )}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isRegenerate ? <><RefreshCw className="w-4 h-4" />Régénérer</> : <><Eye className="w-4 h-4" />Afficher la clé</>
            }
          </button>
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Clés API ────────────────────────────────────────────────────────────

type KybStatus = "pending" | "submitted" | "under_review" | "approved" | "rejected";

function ApiKeysTab() {
  const [keys, setKeys]               = useState<ApiKey[]>([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [env, setEnv]                 = useState<"sandbox" | "live">("sandbox");
  const [formErr, setFormErr]         = useState("");
  const [kybStatus, setKybStatus]     = useState<KybStatus | null>(null);
  const [showRevoked, setShowRevoked] = useState(false);

  // newly created key shown inline (not modal)
  const [newKeyBanner, setNewKeyBanner] = useState<{ rawKey: string; name: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // revealed key per id (password-gated)
  const [revealedKeys, setRevealedKeys] = useState<Map<number, string>>(new Map());

  // password modal
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // revoke confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { copied, copy } = useCopy();

  const fetch_ = () => {
    setLoading(true);
    fetch(`${BASE}/api/dashboard/api-keys`, { credentials: "include" })
      .then(r => r.json()).then(setKeys).catch(() => setKeys([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch_();
    fetch(`${BASE}/api/dashboard/status`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setKybStatus(d.kybStatus ?? "pending"))
      .catch(() => setKybStatus("pending"));
  }, []);

  const create = async () => {
    if (!name.trim()) { setFormErr("Le nom de l'application est requis."); return; }
    setFormErr(""); setCreating(true);
    const res = await fetch(`${BASE}/api/dashboard/api-keys`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, env }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setFormErr(data.error ?? "Erreur lors de la création."); return; }
    // Show inline banner (not modal)
    setBannerDismissed(false);
    setNewKeyBanner({ rawKey: data.rawKey, name: data.name ?? name.trim() });
    setName(""); setDescription(""); setEnv("sandbox");
    fetch_();
  };

  const revoke = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/api-keys/${id}`, { method: "DELETE", credentials: "include" });
    setDeleteId(null);
    // Remove from revealed cache
    setRevealedKeys(prev => { const m = new Map(prev); m.delete(id); return m; });
    fetch_();
  };

  // Called by PasswordModal — returns error string or null on success
  const handlePasswordConfirm = async (password: string): Promise<string | null> => {
    if (!pendingAction) return "Action inconnue";

    if (pendingAction.mode === "reveal") {
      const res = await fetch(`${BASE}/api/dashboard/api-keys/${pendingAction.keyId}/reveal`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? "Erreur";
      setRevealedKeys(prev => new Map(prev).set(pendingAction.keyId, data.rawKey));
      setPendingAction(null);
      return null;
    }

    if (pendingAction.mode === "regenerate") {
      const res = await fetch(`${BASE}/api/dashboard/api-keys/regenerate`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: pendingAction.env, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? "Erreur";
      // Show banner with new key
      setBannerDismissed(false);
      setNewKeyBanner({ rawKey: data.rawKey, name: data.name ?? `Clé ${pendingAction.env}` });
      setPendingAction(null);
      // Clear revealed cache (old keys are revoked)
      setRevealedKeys(new Map());
      fetch_();
      return null;
    }

    return "Action inconnue";
  };

  const activeKeys  = keys.filter(k => k.status === "active");
  const revokedKeys = keys.filter(k => k.status === "revoked");

  const KeyCard = ({ k }: { k: ApiKey }) => {
    const isRevealed = revealedKeys.has(k.id);
    const rawKey = revealedKeys.get(k.id);

    return (
      <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-start gap-3 px-5 py-4">
        <div className={cn(
          "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          k.env === "live" ? "bg-green-50" : "bg-amber-50",
          k.status === "revoked" && "opacity-50"
        )}>
          <Cpu className={cn("w-4 h-4", k.env === "live" ? "text-green-500" : "text-amber-500")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <p className={cn("font-semibold text-sm truncate", k.status === "revoked" ? "text-gray-400" : "text-gray-900")}>
              {k.name}
            </p>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-bold",
              k.env === "live" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            )}>
              {k.env === "live" ? "LIVE" : "SANDBOX"}
            </span>
            {k.status === "revoked" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-600">RÉVOQUÉ</span>
            )}
          </div>
          {k.description && (
            <p className="text-xs text-gray-400 mb-0.5">{k.description}</p>
          )}
          <p className="font-mono text-xs text-gray-500 break-all">
            {isRevealed && rawKey
              ? rawKey
              : `${k.prefix}••••••••••••••••••••••••`}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Créée le {new Date(k.createdAt).toLocaleDateString("fr-FR")}
            {k.lastUsedAt && ` · Utilisée le ${new Date(k.lastUsedAt).toLocaleDateString("fr-FR")}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Reveal / hide */}
          <button
            onClick={() => {
              if (isRevealed) {
                setRevealedKeys(prev => { const m = new Map(prev); m.delete(k.id); return m; });
              } else {
                setPendingAction({ mode: "reveal", keyId: k.id, keyName: k.name });
              }
            }}
            title={isRevealed ? "Masquer" : "Voir la clé"}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
          >
            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {/* Copy — only when revealed */}
          <button
            onClick={() => rawKey && copy(rawKey, `k-${k.id}`)}
            disabled={!isRevealed}
            title="Copier"
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {copied === `k-${k.id}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          {k.status === "active" && (
            <>
              {/* Regenerate */}
              <button
                onClick={() => setPendingAction({ mode: "regenerate", env: k.env })}
                title="Régénérer"
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {/* Revoke */}
              <button
                onClick={() => setDeleteId(k.id)}
                title="Révoquer"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Nouvelle clé — bannière inline (remplace le modal) ── */}
      <AnimatePresence>
        {newKeyBanner && !bannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="bg-white border-2 border-primary/40 rounded-2xl p-5 shadow-sm relative"
          >
            <button
              onClick={() => setBannerDismissed(true)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Clé "{newKeyBanner.name}" créée</p>
                <p className="text-xs text-gray-500">Copiez-la maintenant — vous ne pourrez la voir qu'en entrant votre mot de passe.</p>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 font-mono text-sm break-all text-primary select-all mb-3">
              {newKeyBanner.rawKey}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => copy(newKeyBanner.rawKey, "banner")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                {copied === "banner"
                  ? <><CheckCircle2 className="w-4 h-4 text-green-400" />Copié</>
                  : <><Copy className="w-4 h-4" />Copier la clé</>
                }
              </button>
              <div className="flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Cette clé ne s'affiche qu'une seule fois ici. Ensuite, votre mot de passe sera requis.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Formulaire de création ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Nouvelle clé API
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nom de l'application *</label>
            <input
              placeholder="Ex: Backend Production, Mobile App..."
              value={name}
              onChange={e => { setName(e.target.value); setFormErr(""); }}
              className={inputCls(!!formErr && !name.trim())}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
            <input
              placeholder="Ex: Clé pour l'API de paiement du site web"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={inputCls()}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Environnement</label>
          <div className="flex gap-3">
            {(["sandbox", "live"] as const).map(e => (
              <button
                key={e}
                onClick={() => setEnv(e)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                  env === e
                    ? e === "live"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", e === "live" ? "bg-green-400" : "bg-amber-400")} />
                {e === "live" ? "Live (production)" : "Sandbox (test)"}
              </button>
            ))}
          </div>
        </div>
        {formErr && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {formErr}
          </p>
        )}
        {kybStatus !== null && kybStatus !== "approved" ? (
          <div className="mt-4 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {kybStatus === "submitted" || kybStatus === "under_review"
                  ? "Vérification en cours"
                  : "Compte non validé"}
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                {kybStatus === "submitted" || kybStatus === "under_review"
                  ? "Votre dossier KYB est en cours d'examen. Vous pourrez générer des clés API dès validation."
                  : "Veuillez compléter votre vérification KYB pour générer des clés API."}
              </p>
              {kybStatus !== "submitted" && kybStatus !== "under_review" && (
                <a
                  href="/dashboard/kyb"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                >
                  <Shield className="w-3 h-3" /> Démarrer la vérification KYB →
                </a>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={create}
            disabled={creating || kybStatus === null}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Générer la clé
          </button>
        )}
      </div>

      {/* ── Liste des clés actives ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Mes clés API</h3>
          {activeKeys.length > 0 && (
            <span className="text-xs text-gray-400">{activeKeys.length} active{activeKeys.length > 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Info: voir clé = mot de passe requis */}
        {activeKeys.length > 0 && (
          <div className="mx-5 mt-4 mb-1 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            <Lock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            Cliquez sur <Eye className="w-3.5 h-3.5 inline mx-1" /> pour voir une clé — votre mot de passe sera demandé.
            Cliquez sur <RefreshCw className="w-3.5 h-3.5 inline mx-1" /> pour régénérer.
          </div>
        )}

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : activeKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Key className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Aucune clé API active</p>
            <p className="text-xs text-gray-400">Créez votre première clé pour commencer.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence>
              {activeKeys.map(k => <KeyCard key={k.id} k={k} />)}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Clés révoquées (repliées) ── */}
      {revokedKeys.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowRevoked(v => !v)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">
              Clés révoquées
              <span className="ml-2 text-[11px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">{revokedKeys.length}</span>
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", showRevoked && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {showRevoked && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-gray-50 border-t border-gray-100">
                  {revokedKeys.map(k => <KeyCard key={k.id} k={k} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Password modal ── */}
      {pendingAction && (
        <PasswordModal
          pending={pendingAction}
          onConfirm={handlePasswordConfirm}
          onClose={() => setPendingAction(null)}
        />
      )}

      {/* ── Revoke confirm ── */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" /> Révoquer cette clé ?
            </DialogTitle>
            <DialogDescription>Cette action est irréversible. La clé sera immédiatement désactivée.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => deleteId && revoke(deleteId)}
              className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
            >
              Révoquer
            </button>
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Webhooks ────────────────────────────────────────────────────────────

function WebhooksTab() {
  const [hooks, setHooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetch_ = () => {
    setLoading(true);
    fetch(`${BASE}/api/dashboard/webhooks`, { credentials: "include" })
      .then(r => r.json()).then(d => setHooks(Array.isArray(d) ? d : []))
      .catch(() => setHooks([])).finally(() => setLoading(false));
  };
  useEffect(fetch_, []);

  const add = async () => {
    if (!url.trim()) { setErr("L'URL est requise."); return; }
    setErr(""); setAdding(true);
    const res = await fetch(`${BASE}/api/dashboard/webhooks`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), label: label.trim() || undefined }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setErr(data.error ?? "Erreur"); return; }
    setUrl(""); setLabel(""); fetch_();
  };

  const remove = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/webhooks/${id}`, { method: "DELETE", credentials: "include" });
    setDeleteId(null); fetch_();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-xs text-gray-600 leading-relaxed">
        <span className="text-primary font-semibold">Comment ça marche : </span>
        DrimPay envoie une requête <code className="text-primary font-mono">POST</code> à chaque URL configurée à chaque changement d'état de transaction. Votre endpoint doit répondre avec un code <code className="text-primary font-mono">200</code>. Chaque requête est signée avec le header <code className="text-primary font-mono">X-DrimPay-Signature</code>.
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Ajouter un webhook
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">URL *</label>
            <input
              type="url"
              placeholder="https://votreapp.com/webhooks/drimpay"
              value={url}
              onChange={e => { setUrl(e.target.value); setErr(""); }}
              className={inputCls(!!err && !url.trim())}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Label (optionnel)</label>
            <input
              placeholder="Ex: Production, Staging, App Mobile..."
              value={label}
              onChange={e => setLabel(e.target.value)}
              className={inputCls()}
            />
          </div>
        </div>
        {err && <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {err}</p>}
        <button
          onClick={add}
          disabled={adding}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
          Ajouter
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">URLs configurées</h3>
          {hooks.length > 0 && <span className="text-xs text-gray-400">{hooks.length} / 10</span>}
        </div>
        {loading ? (
          <div className="p-5 space-y-2">{[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : hooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Webhook className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Aucun webhook configuré</p>
            <p className="text-xs text-gray-400">Ajoutez une URL pour recevoir les notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence>
              {hooks.map(h => (
                <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {h.label && <p className="text-xs font-semibold text-gray-700">{h.label}</p>}
                    <p className="text-xs text-gray-500 font-mono truncate">{h.url}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Ajouté le {new Date(h.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button
                    onClick={() => setDeleteId(h.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce webhook ?</DialogTitle>
            <DialogDescription>Cette URL ne recevra plus les notifications DrimPay.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => deleteId && remove(deleteId)}
              className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              Supprimer
            </button>
            <button onClick={() => setDeleteId(null)}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: IP Whitelist ────────────────────────────────────────────────────────

function IpTab() {
  const [ips, setIps]         = useState<IpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ip, setIp]           = useState("");
  const [label, setLabel]     = useState("");
  const [adding, setAdding]   = useState(false);
  const [err, setErr]         = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetch_ = () => {
    setLoading(true);
    fetch(`${BASE}/api/dashboard/ip-whitelist`, { credentials: "include" })
      .then(r => r.json()).then(d => setIps(Array.isArray(d) ? d : []))
      .catch(() => setIps([])).finally(() => setLoading(false));
  };
  useEffect(fetch_, []);

  const add = async () => {
    if (!ip.trim()) { setErr("L'adresse IP est requise."); return; }
    setErr(""); setAdding(true);
    const res = await fetch(`${BASE}/api/dashboard/ip-whitelist`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: ip.trim(), label: label.trim() || undefined }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setErr(data.error ?? "Erreur"); return; }
    setIp(""); setLabel(""); fetch_();
  };

  const remove = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/ip-whitelist/${id}`, { method: "DELETE", credentials: "include" });
    setDeleteId(null); fetch_();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-xs text-gray-600 leading-relaxed">
        <span className="text-primary font-semibold">Restriction IP : </span>
        Limitez l'accès à votre clé API à des adresses IP spécifiques. Toute requête provenant d'une IP non autorisée sera refusée. Laissez vide pour autoriser toutes les IPs.
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Ajouter une IP
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Adresse IP *</label>
            <input
              placeholder="Ex: 192.168.1.1 ou 10.0.0.0/24"
              value={ip}
              onChange={e => { setIp(e.target.value); setErr(""); }}
              className={inputCls(!!err && !ip.trim())}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Label (optionnel)</label>
            <input
              placeholder="Ex: Serveur Production, Bureau..."
              value={label}
              onChange={e => setLabel(e.target.value)}
              className={inputCls()}
            />
          </div>
        </div>
        {err && <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {err}</p>}
        <button
          onClick={add}
          disabled={adding}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
          Ajouter
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">IPs autorisées</h3>
          {ips.length > 0 && <span className="text-xs text-gray-400">{ips.length} / 20</span>}
        </div>
        {loading ? (
          <div className="p-5 space-y-2">{[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : ips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Network className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Aucune restriction IP</p>
            <p className="text-xs text-gray-400">Toutes les IPs sont autorisées.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence>
              {ips.map(row => (
                <motion.div key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Network className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {row.label && <p className="text-xs font-semibold text-gray-700">{row.label}</p>}
                    <p className="text-xs text-gray-500 font-mono">{row.ip}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Ajoutée le {new Date(row.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button
                    onClick={() => setDeleteId(row.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cette IP ?</DialogTitle>
            <DialogDescription>Cette adresse IP ne sera plus autorisée à accéder à votre API.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => deleteId && remove(deleteId)}
              className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              Supprimer
            </button>
            <button onClick={() => setDeleteId(null)}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "keys",     label: "Clés API",       icon: KeyRound },
  { id: "webhooks", label: "Webhooks",        icon: Webhook  },
  { id: "ip",       label: "IP Whitelist",    icon: Network  },
] as const;
type TabId = typeof TABS[number]["id"];

export default function ApiKeysPage() {
  const [tab, setTab] = useState<TabId>("keys");

  return (
    <DashboardLayout>
      <ProductionGate feature="api-keys">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0">
              <img src={apiIconImg} alt="" className="w-5 h-5 object-contain" style={{ filter: "brightness(0) invert(1) opacity(0.85)" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Clés API & Sécurité</h1>
              <p className="text-sm text-gray-500">Gérez vos clés, webhooks et restrictions d'accès.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                    tab === t.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {tab === "keys"     && <ApiKeysTab />}
          {tab === "webhooks" && <WebhooksTab />}
          {tab === "ip"       && <IpTab />}
        </div>
      </ProductionGate>
    </DashboardLayout>
  );
}
