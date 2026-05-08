import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldOff, Search, Trash2, Plus, X, RefreshCw, AlertTriangle,
  Phone, ChevronLeft, ChevronRight, User, Calendar, Info,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type BlacklistEntry = {
  id: number;
  phone: string;
  reason: string | null;
  blockedBy: number | null;
  createdAt: string;
  adminEmail: string | null;
};

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const normalized = phone.replace(/\s+/g, "").trim();
    if (normalized.length < 6) { setError("Numéro trop court (minimum 6 chiffres)."); return; }
    setLoading(true); setError("");
    const r = await fetch(`${BASE}/api/admin/blacklist`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalized, reason: reason.trim() || undefined }),
    });
    const data = await r.json();
    setLoading(false);
    if (!r.ok) { setError(data.error ?? "Erreur serveur"); return; }
    onAdded(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <ShieldOff className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Ajouter à la liste noire</h2>
              <p className="text-xs text-gray-500">Ce numéro sera immédiatement bloqué</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Ce numéro ne pourra plus effectuer aucun paiement via l'API ni via les liens de paiement.</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+22890000000 ou 90000000"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                onKeyDown={e => e.key === "Enter" && submit()}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Saisissez le numéro exact tel que le client l'utilise pour payer.</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Raison du blocage <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Ex: Fraude confirmée, tentatives répétées de paiements frauduleux..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button onClick={submit} disabled={loading || !phone.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <ShieldOff className="w-4 h-4" />}
              Bloquer ce numéro
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ConfirmDeleteModal({ entry, onClose, onDeleted }: { entry: BlacklistEntry; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    await fetch(`${BASE}/api/admin/blacklist/${entry.id}`, { method: "DELETE", credentials: "include" });
    onDeleted(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Retirer de la liste noire ?</h3>
            <p className="text-sm text-gray-500 mt-1">Le numéro <span className="font-mono font-semibold text-gray-800">{entry.phone}</span> pourra à nouveau effectuer des paiements.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button onClick={confirm} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Trash2 className="w-4 h-4" />}
              Débloquer
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminBlacklist() {
  const [items, setItems] = useState<BlacklistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [toDelete, setToDelete] = useState<BlacklistEntry | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 50;

  const load = useCallback(async (opts?: { p?: number; s?: string }) => {
    setLoading(true);
    const p = opts?.p ?? page;
    const s = opts?.s ?? search;
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), search: s });
    try {
      const r = await fetch(`${BASE}/api/admin/blacklist?${params}`, { credentials: "include" });
      const d = await r.json();
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, []);

  const handleSearch = (v: string) => {
    setSearch(v); setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load({ p: 1, s: v }), 350);
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <ShieldOff className="w-5 h-5 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Liste Noire</h1>
            </div>
            <p className="text-sm text-gray-500 ml-12">
              {total} numéro{total !== 1 ? "s" : ""} bloqué{total !== 1 ? "s" : ""} — aucun paiement n'est possible depuis ces numéros
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Bloquer un numéro
          </button>
        </div>

        {/* Alerte info */}
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            Les numéros dans cette liste sont bloqués en temps réel sur <strong>toutes les voies de paiement</strong> : API v2, liens de paiement, et paiements directs (dashboard marchand). Le blocage est effectif immédiatement dès l'ajout.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Barre de recherche */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Rechercher par numéro ou raison..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white placeholder-gray-400 font-mono"
              />
              {search && (
                <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button onClick={() => load()} title="Actualiser"
              className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
              <RefreshCw className={cn("w-4 h-4 text-gray-500", loading && "animate-spin")} />
            </button>
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : !items.length ? (
            <div className="text-center py-20 text-gray-400">
              <ShieldOff className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {search ? "Aucun numéro trouvé pour cette recherche" : "La liste noire est vide"}
              </p>
              {!search && (
                <p className="text-xs mt-1">Bloquez un numéro pour l'empêcher d'effectuer des paiements</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">

                    {/* Icône */}
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-red-500" />
                    </div>

                    {/* Numéro + raison */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-gray-900 text-sm">{item.phone}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold uppercase tracking-wide">Bloqué</span>
                      </div>
                      {item.reason && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.reason}</p>
                      )}
                    </div>

                    {/* Métadonnées */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-right">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      {item.adminEmail && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <User className="w-3 h-3" />
                          {item.adminEmail}
                        </div>
                      )}
                    </div>

                    {/* Bouton supprimer */}
                    <button onClick={() => setToDelete(item)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
                      title="Retirer de la liste noire">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} sur {total}
              </p>
              <div className="flex gap-2">
                <button disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); load({ p }); }}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="flex items-center px-3 text-xs text-gray-500 font-medium">
                  {page} / {Math.ceil(total / LIMIT)}
                </span>
                <button disabled={page * LIMIT >= total}
                  onClick={() => { const p = page + 1; setPage(p); load({ p }); }}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={() => load({ p: 1 })} />}
        {toDelete && <ConfirmDeleteModal entry={toDelete} onClose={() => setToDelete(null)} onDeleted={() => load()} />}
      </AnimatePresence>
    </AdminLayout>
  );
}
