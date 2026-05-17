import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Plus, Trash2, Copy, Eye, EyeOff, CheckCircle2, AlertTriangle,
  Shield, Globe, Cpu, Webhook, Network, ChevronRight, X, Loader2,
  AlertCircle, Lock
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
  rawKey?: string | null;
  env: "sandbox" | "live";
  status: "active" | "revoked";
  lastUsedAt?: string | null;
  createdAt: string;
};

type WebhookRow = { id: number; url: string; label?: string | null; createdAt: string };
type IpRow      = { id: number; ip: string; label?: string | null; createdAt: string };

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

// ─── Tab: Clés API ────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [env, setEnv] = useState<"sandbox" | "live">("sandbox");
  const [formErr, setFormErr] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  const fetch_ = () => {
    setLoading(true);
    fetch(`${BASE}/api/dashboard/api-keys`, { credentials: "include" })
      .then(r => r.json()).then(setKeys).catch(() => setKeys([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetch_, []);

  const toggleReveal = (id: number) =>
    setRevealedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

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
    setNewKey(data.rawKey ?? null);
    setName(""); setDescription(""); setEnv("sandbox");
    fetch_();
  };

  const revoke = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/api-keys/${id}`, { method: "DELETE", credentials: "include" });
    setDeleteId(null); fetch_();
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
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
        <button
          onClick={create}
          disabled={creating}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          Générer la clé
        </button>
      </div>

      {/* Keys list */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Mes clés API</h3>
          {keys.length > 0 && (
            <span className="text-xs text-gray-400">{keys.filter(k => k.status === "active").length} active{keys.filter(k => k.status === "active").length > 1 ? "s" : ""}</span>
          )}
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Key className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Aucune clé API</p>
            <p className="text-xs text-gray-400">Créez votre première clé pour commencer.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence>
              {keys.map(key => (
                <motion.div key={key.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-3 px-5 py-4">
                  <div className={cn(
                    "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    key.env === "live" ? "bg-green-50" : "bg-amber-50"
                  )}>
                    <Cpu className={cn("w-4 h-4", key.env === "live" ? "text-green-500" : "text-amber-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <p className="font-semibold text-sm text-gray-900 truncate">{key.name}</p>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold",
                        key.env === "live" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {key.env === "live" ? "LIVE" : "SANDBOX"}
                      </span>
                      {key.status === "revoked" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-600">RÉVOQUÉ</span>
                      )}
                    </div>
                    {key.description && (
                      <p className="text-xs text-gray-400 mb-0.5">{key.description}</p>
                    )}
                    <p className="font-mono text-xs text-gray-500 break-all">
                      {revealedIds.has(key.id) && key.rawKey
                        ? key.rawKey
                        : key.rawKey
                          ? `${key.prefix}••••••••••••••••••••••••`
                          : <span className="text-amber-500 not-italic text-[10px]">Régénérez pour afficher</span>}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Créée le {new Date(key.createdAt).toLocaleDateString("fr-FR")}
                      {key.lastUsedAt && ` · Dernière utilisation ${new Date(key.lastUsedAt).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => key.rawKey && toggleReveal(key.id)}
                      disabled={!key.rawKey}
                      title={revealedIds.has(key.id) ? "Masquer" : "Afficher"}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {revealedIds.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => key.rawKey && copy(key.rawKey, `k-${key.id}`)}
                      disabled={!key.rawKey}
                      title="Copier"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {copied === `k-${key.id}` ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {key.status === "active" && (
                      <button
                        onClick={() => setDeleteId(key.id)}
                        title="Révoquer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* New key dialog */}
      <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Clé créée avec succès
            </DialogTitle>
            <DialogDescription>Copiez cette clé maintenant — elle ne sera plus affichée.</DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-sm break-all select-all text-gray-800">
            {newKey}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => newKey && copy(newKey, "dialog")}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              {copied === "dialog" ? <><CheckCircle2 className="w-4 h-4" />Copié</> : <><Copy className="w-4 h-4" />Copier la clé</>}
            </button>
            <button onClick={() => setNewKey(null)} className="px-4 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Fermer
            </button>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Cette clé ne sera plus visible après fermeture de cette fenêtre.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" /> Révoquer cette clé ?
            </DialogTitle>
            <DialogDescription>Cette action est irréversible. La clé sera immédiatement désactivée.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => deleteId && revoke(deleteId)}
              className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              Révoquer
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
            <DialogDescription>Les notifications ne seront plus envoyées à cette URL.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => deleteId && remove(deleteId)}
              className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              Supprimer
            </button>
            <button onClick={() => setDeleteId(null)}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: IP autorisées ───────────────────────────────────────────────────────

function AllowedIpsTab() {
  const [ips, setIps] = useState<IpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ip, setIp] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetch_ = () => {
    setLoading(true);
    fetch(`${BASE}/api/dashboard/allowed-ips`, { credentials: "include" })
      .then(r => r.json()).then(d => setIps(Array.isArray(d) ? d : []))
      .catch(() => setIps([])).finally(() => setLoading(false));
  };
  useEffect(fetch_, []);

  const add = async () => {
    if (!ip.trim()) { setErr("L'adresse IP est requise."); return; }
    setErr(""); setAdding(true);
    const res = await fetch(`${BASE}/api/dashboard/allowed-ips`, {
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
    await fetch(`${BASE}/api/dashboard/allowed-ips/${id}`, { method: "DELETE", credentials: "include" });
    setDeleteId(null); fetch_();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 leading-relaxed">
        <span className="font-semibold">Note de sécurité : </span>
        Si vous renseignez des adresses IP autorisées, seules les requêtes provenant de ces IPs pourront appeler l'API DrimPay avec vos clés. Laissez vide pour autoriser toutes les IPs.
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Ajouter une adresse IP
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Adresse IP *</label>
            <input
              placeholder="192.168.1.1"
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
          <h3 className="font-bold text-gray-900 text-sm">Adresses autorisées</h3>
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
            <p className="text-xs text-gray-400">Toutes les IPs peuvent utiliser vos clés API.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence>
              {ips.map(row => (
                <motion.div key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                    <Network className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {row.label && <p className="text-xs font-semibold text-gray-700">{row.label}</p>}
                    <p className="text-xs text-gray-500 font-mono">{row.ip}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Ajouté le {new Date(row.createdAt).toLocaleDateString("fr-FR")}</p>
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
            <DialogTitle>Supprimer cette adresse IP ?</DialogTitle>
            <DialogDescription>Cette IP ne sera plus autorisée à utiliser vos clés API.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => deleteId && remove(deleteId)}
              className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
              Supprimer
            </button>
            <button onClick={() => setDeleteId(null)}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "keys",     label: "Clés API",         icon: Key },
  { key: "webhooks", label: "Webhooks",          icon: Webhook },
  { key: "ips",      label: "Adresses IP",       icon: Network },
] as const;

type Tab = typeof TABS[number]["key"];

export default function ApiKeys() {
  const [tab, setTab] = useState<Tab>("keys");

  return (
    <DashboardLayout>
      <ProductionGate>
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-5 flex items-center gap-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#B5F03C22,_transparent_60%)]" />
            <div className="relative w-12 h-12 shrink-0">
              <img src={apiIconImg} alt="API" className="w-full h-full object-contain drop-shadow-xl" />
            </div>
            <div className="relative">
              <h1 className="text-xl font-bold text-white">Paramètres API</h1>
              <p className="text-sm text-gray-400 mt-0.5">Gérez vos clés, webhooks et adresses IP autorisées</p>
            </div>
          </div>

          {/* Security banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
            <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Sécurité</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Ne partagez jamais vos clés live dans le code source — utilisez des variables d'environnement.
                Chaque application devrait avoir sa propre clé pour pouvoir révoquer individuellement en cas de compromission.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    tab === t.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {tab === "keys"     && <ApiKeysTab />}
              {tab === "webhooks" && <WebhooksTab />}
              {tab === "ips"      && <AllowedIpsTab />}
            </motion.div>
          </AnimatePresence>

        </div>
      </ProductionGate>
    </DashboardLayout>
  );
}
