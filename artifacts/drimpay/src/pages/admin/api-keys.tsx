import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, Search, RefreshCw, ShieldOff, ShieldCheck,
  ChevronLeft, ChevronRight, X, Copy, Check, Globe,
  Webhook, Wifi, Eye, AlertTriangle, RotateCcw,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Badge({ status }: { status: string }) {
  const cls =
    status === "active"  ? "bg-green-100 text-green-700" :
    status === "revoked" ? "bg-red-100 text-red-600" :
    "bg-gray-100 text-gray-500";
  const label = status === "active" ? "Active" : status === "revoked" ? "Révoquée" : status;
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", cls)}>{label}</span>;
}

function EnvBadge({ env }: { env: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-xs font-semibold",
      env === "live" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
    )}>
      {env === "live" ? "Production" : "Sandbox"}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 text-gray-400 hover:text-gray-700 transition-colors"
      title="Copier"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

type ApiKey = {
  id: number;
  name: string;
  description?: string;
  prefix: string;
  env: string;
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
  userId: number;
  merchant: { id: number; companyName: string; email: string } | null;
};

type Details = {
  key: ApiKey & { rawKey?: string };
  merchant: { id: number; companyName: string; email: string; website?: string; country?: string } | null;
  webhooks: { id: number; url: string; label?: string }[];
  ips: { id: number; ip: string; label?: string }[];
};

function DetailsPanel({ keyId, onClose, onStatusChange }: {
  keyId: number;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const [details, setDetails] = useState<Details | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNewKey(null);
    setFetchError(null);
    setDetails(null);
    fetch(`/api/admin/api-keys/${keyId}/details`, { credentials: "include" })
      .then(async r => {
        const d = await r.json();
        if (!r.ok || !d.key) {
          setFetchError(d.error ?? "Erreur de chargement");
        } else {
          setDetails(d);
        }
      })
      .catch(() => setFetchError("Impossible de joindre le serveur"))
      .finally(() => setLoading(false));
  }, [keyId]);

  async function toggleStatus() {
    if (!details) return;
    const newStatus = details.key.status === "active" ? "revoked" : "active";
    setBlocking(true);
    await fetch(`/api/admin/api-keys/${keyId}/status`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setDetails(prev => prev ? { ...prev, key: { ...prev.key, status: newStatus } } : prev);
    setBlocking(false);
    onStatusChange();
  }

  async function regenerate() {
    if (!confirm("Régénérer cette clé ? L'ancienne sera immédiatement révoquée.")) return;
    setRegenerating(true);
    const r = await fetch(`/api/admin/api-keys/${keyId}/regenerate`, {
      method: "POST", credentials: "include",
    });
    const data = await r.json();
    setNewKey(data.rawKey ?? null);
    setRegenerating(false);
    onStatusChange();
    fetch(`/api/admin/api-keys/${data.id}/details`, { credentials: "include" })
      .then(r2 => r2.json()).then(d => setDetails(d));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" /> Détails de la clé
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement...
            </div>
          ) : !details ? (
            <p className="text-red-500 text-sm">Erreur de chargement</p>
          ) : (
            <>
              {/* Key info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Clé API</span>
                  <div className="flex items-center gap-2">
                    <EnvBadge env={details.key.env} />
                    <Badge status={details.key.status} />
                  </div>
                </div>
                <p className="font-semibold text-gray-800">{details.key.name}</p>
                <div className="flex items-center gap-1 font-mono text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="truncate">{details.key.prefix}••••••••••</span>
                  <CopyBtn text={details.key.prefix} />
                </div>
                <p className="text-xs text-gray-400">
                  Dernière utilisation : {fmt(details.key.lastUsedAt)} · Créée : {fmt(details.key.createdAt)}
                </p>
              </div>

              {/* New key after regeneration */}
              {newKey && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Nouvelle clé — copiez-la maintenant
                  </p>
                  <div className="flex items-center gap-2 font-mono text-xs text-amber-900 bg-white border border-amber-200 rounded-lg px-3 py-2 break-all">
                    <span className="flex-1 break-all">{newKey}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(newKey); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 1500); }}
                      className="shrink-0 text-amber-600 hover:text-amber-800"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Merchant */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Marchand</p>
                {details.merchant ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                    <p className="font-semibold text-gray-800">{details.merchant.companyName}</p>
                    <p className="text-sm text-gray-500">{details.merchant.email}</p>
                    {details.merchant.website && (
                      <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                        <Globe className="w-3.5 h-3.5" />
                        <a href={details.merchant.website} target="_blank" rel="noreferrer" className="underline truncate">
                          {details.merchant.website}
                        </a>
                      </div>
                    )}
                    {details.merchant.country && (
                      <p className="text-xs text-gray-400">Pays : {details.merchant.country}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Marchand introuvable</p>
                )}
              </div>

              {/* Webhooks */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                  <Webhook className="w-3.5 h-3.5" /> URLs de Webhook
                </p>
                {details.webhooks.length === 0 ? (
                  <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl p-3">Aucun webhook configuré</p>
                ) : (
                  <div className="space-y-2">
                    {details.webhooks.map(w => (
                      <div key={w.id} className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {w.label && <p className="text-xs text-gray-500 mb-0.5">{w.label}</p>}
                          <p className="font-mono text-xs text-gray-800 break-all">{w.url}</p>
                        </div>
                        <CopyBtn text={w.url} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* IPs */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" /> IPs autorisées
                </p>
                {details.ips.length === 0 ? (
                  <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl p-3">Aucune IP restreinte (toutes autorisées)</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {details.ips.map(ip => (
                      <div key={ip.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                        <span className="font-mono text-xs text-gray-800">{ip.ip}</span>
                        {ip.label && <span className="text-xs text-gray-400">({ip.label})</span>}
                        <CopyBtn text={ip.ip} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {details && (
          <div className="border-t border-gray-100 p-5 space-y-3">
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className={cn("w-4 h-4", regenerating && "animate-spin")} />
              {regenerating ? "Régénération..." : "Régénérer la clé"}
            </button>
            <button
              onClick={toggleStatus}
              disabled={blocking}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50",
                details.key.status === "active"
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              )}
            >
              {details.key.status === "active"
                ? <><ShieldOff className="w-4 h-4" /> {blocking ? "Blocage..." : "Bloquer la clé"}</>
                : <><ShieldCheck className="w-4 h-4" /> {blocking ? "Activation..." : "Réactiver la clé"}</>
              }
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const limit = 20;

  function load(p = page, q = search) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit), ...(q ? { search: q } : {}) });
    fetch(`/api/admin/api-keys?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setKeys(d.keys ?? []); setTotal(d.total ?? 0); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  function handleSearch(q: string) {
    setSearch(q); setPage(1); load(1, q);
  }

  async function toggleStatus(key: ApiKey) {
    const newStatus = key.status === "active" ? "revoked" : "active";
    setActionLoading(key.id);
    await fetch(`/api/admin/api-keys/${key.id}/status`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setActionLoading(null);
    load();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-emerald-600" /> Clés API Marchands
            </h1>
            <p className="text-sm text-gray-500 mt-1">{total} clé{total !== 1 ? "s" : ""} au total</p>
          </div>
          <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Marchand, email, préfixe..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Marchand</th>
                  <th className="px-5 py-3 text-left">Préfixe clé</th>
                  <th className="px-5 py-3 text-left">Nom</th>
                  <th className="px-5 py-3 text-left">Env.</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-left">Dernière utilisation</th>
                  <th className="px-5 py-3 text-left">Créée</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Chargement...
                    </td>
                  </tr>
                ) : keys.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-gray-400 italic">Aucune clé trouvée</td>
                  </tr>
                ) : keys.map(key => (
                  <tr key={key.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-gray-800 truncate max-w-[140px]">{key.merchant?.companyName ?? "—"}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{key.merchant?.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">{key.prefix}…</span>
                        <CopyBtn text={key.prefix} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-[120px] truncate">{key.name}</td>
                    <td className="px-5 py-3"><EnvBadge env={key.env} /></td>
                    <td className="px-5 py-3"><Badge status={key.status} /></td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{fmt(key.lastUsedAt)}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{fmt(key.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedId(key.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Détails
                        </button>
                        <button
                          onClick={() => toggleStatus(key)}
                          disabled={actionLoading === key.id}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
                            key.status === "active"
                              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                              : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                          )}
                        >
                          {actionLoading === key.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : key.status === "active"
                              ? <><ShieldOff className="w-3.5 h-3.5" /> Bloquer</>
                              : <><ShieldCheck className="w-3.5 h-3.5" /> Activer</>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">Page {page} / {totalPages} · {total} clés</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load(p); }}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setSelectedId(null)}
            />
            <DetailsPanel
              keyId={selectedId}
              onClose={() => setSelectedId(null)}
              onStatusChange={() => load()}
            />
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
