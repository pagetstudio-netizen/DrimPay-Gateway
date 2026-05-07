import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, RefreshCw, Edit2, Trash2, KeyRound,
  ShieldCheck, UserX, ChevronLeft, ChevronRight, X, Check,
  Download, Wallet, ShieldOff, AlertTriangle,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const KYB_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-600",
};
const KYB_LABELS: Record<string, string> = {
  approved: "Vérifié", submitted: "Soumis", under_review: "En révision", rejected: "Rejeté", pending: "En attente",
};

function fmt(n: number) { return Math.round(n).toLocaleString("fr-FR"); }

function EditModal({ merchant, onClose, onSave }: { merchant: any; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ companyName: merchant.companyName, email: merchant.email, country: merchant.country, role: merchant.role });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/admin/merchants/${merchant.id}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    onSave(form);
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Modifier le marchand</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          {[["Nom de l'entreprise", "companyName"], ["Email", "email"], ["Pays", "country"]].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Rôle</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function WalletModal({ merchant, onClose }: { merchant: any; onClose: () => void }) {
  const [wallets, setWallets] = useState(merchant.wallets ?? []);
  const [editing, setEditing] = useState<number | null>(null);
  const [newBal, setNewBal] = useState("");

  const saveBalance = async (walletId: number) => {
    await fetch(`/api/admin/merchants/${merchant.id}/wallets/${walletId}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: newBal }),
    });
    setWallets(wallets.map((w: any) => w.id === walletId ? { ...w, balance: newBal } : w));
    setEditing(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Wallets — {merchant.companyName}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {wallets.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Aucun wallet</p>}
          {wallets.map((w: any) => (
            <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{w.countryCode} · {w.currency}</p>
                {editing === w.id ? (
                  <input value={newBal} onChange={e => setNewBal(e.target.value)} placeholder="Nouveau solde"
                    className="mt-1 w-full text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                ) : (
                  <p className="text-lg font-bold text-emerald-600">{parseFloat(w.balance).toLocaleString("fr-FR")} {w.currency}</p>
                )}
              </div>
              {editing === w.id ? (
                <div className="flex gap-2">
                  <button onClick={() => saveBalance(w.id)} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => { setEditing(w.id); setNewBal(w.balance); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"><Edit2 className="w-4 h-4 text-gray-500" /></button>
              )}
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Fermer</button>
      </motion.div>
    </div>
  );
}

function PromoteModal({ merchant, onClose, onDone }: { merchant: any; onClose: () => void; onDone: () => void }) {
  const isAdmin = merchant.role === "admin";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const confirm = async () => {
    setLoading(true);
    await fetch(`/api/admin/merchants/${merchant.id}/role`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: isAdmin ? "user" : "admin" }),
    });
    setDone(true);
    setLoading(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isAdmin ? "Rétrograder en marchand" : "Promouvoir en administrateur"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">
              {isAdmin ? "Rétrogradé en marchand avec succès" : "Promu administrateur avec succès"}
            </p>
            <button onClick={onClose} className="mt-4 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700">Fermer</button>
          </div>
        ) : (
          <>
            <div className={cn("rounded-xl p-4 mb-5 flex gap-3", isAdmin ? "bg-orange-50 border border-orange-200" : "bg-blue-50 border border-blue-200")}>
              <AlertTriangle className={cn("w-5 h-5 shrink-0 mt-0.5", isAdmin ? "text-orange-500" : "text-blue-500")} />
              <div>
                <p className={cn("text-sm font-semibold", isAdmin ? "text-orange-800" : "text-blue-800")}>
                  {isAdmin
                    ? `Retirer les droits admin de ${merchant.companyName} ?`
                    : `Donner les droits admin à ${merchant.companyName} ?`}
                </p>
                <p className={cn("text-xs mt-1", isAdmin ? "text-orange-600" : "text-blue-600")}>
                  {isAdmin
                    ? "Ce compte n'aura plus accès au panneau d'administration."
                    : "Ce compte aura un accès complet au panneau d'administration, y compris la gestion des marchands, KYB, wallets et paramètres."}
                </p>
                <p className="text-xs text-gray-500 mt-2">Email : <strong>{merchant.email}</strong></p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
              <button
                onClick={confirm}
                disabled={loading}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50",
                  isAdmin ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {loading ? "En cours..." : isAdmin ? "Rétrograder" : "Promouvoir"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ResetPasswordModal({ merchant, onClose }: { merchant: any; onClose: () => void }) {
  const [newPwd, setNewPwd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/merchants/${merchant.id}/reset-password`, { method: "POST", credentials: "include" });
    const d = await r.json();
    setNewPwd(d.newPassword);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Réinitialiser mot de passe</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        {newPwd ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-800 font-medium mb-2">Nouveau mot de passe généré :</p>
            <p className="font-mono text-lg font-bold text-green-900 bg-white border border-green-200 rounded-lg px-3 py-2">{newPwd}</p>
            <p className="text-xs text-green-600 mt-2">Communiquez ce mot de passe au marchand de façon sécurisée.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-5">Un nouveau mot de passe aléatoire sera généré pour <strong>{merchant.email}</strong>.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={reset} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {loading ? "Génération..." : "Réinitialiser"}
              </button>
            </div>
          </div>
        )}
        {newPwd && <button onClick={onClose} className="mt-4 w-full px-4 py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200">Fermer</button>}
      </motion.div>
    </div>
  );
}

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMerchant, setEditMerchant] = useState<any>(null);
  const [walletMerchant, setWalletMerchant] = useState<any>(null);
  const [resetMerchant, setResetMerchant] = useState<any>(null);
  const [promoteMerchant, setPromoteMerchant] = useState<any>(null);
  const LIMIT = 20;

  const fetch_ = async (p = page, q = search) => {
    setLoading(true);
    const r = await fetch(`/api/admin/merchants?page=${p}&limit=${LIMIT}&search=${encodeURIComponent(q)}`, { credentials: "include" });
    const d = await r.json();
    setMerchants(d.merchants ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); fetch_(1, v); };

  const exportCSV = () => {
    const rows = merchants.map(m => [m.id, m.companyName, m.email, m.country, m.kybStatus, m.totalVolume, m.createdAt].join(","));
    const csv = ["ID,Entreprise,Email,Pays,KYB,Volume,Inscription", ...rows].join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "marchands.csv"; a.click();
  };

  const suspend = async (m: any) => {
    await fetch(`/api/admin/merchants/${m.id}/suspend`, { method: "POST", credentials: "include" });
    alert(`Marchand ${m.companyName} suspendu (action loguée)`);
  };

  const deleteMerchant = async (m: any) => {
    if (!confirm(`Supprimer ${m.companyName} ? Cette action est irréversible.`)) return;
    await fetch(`/api/admin/merchants/${m.id}`, { method: "DELETE", credentials: "include" });
    setMerchants(merchants.filter(x => x.id !== m.id));
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marchands</h1>
            <p className="text-sm text-gray-500">{total} marchands enregistrés</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Rechercher par nom, email..." className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder:text-gray-400" />
            </div>
            <button onClick={() => fetch_()} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Entreprise", "Email", "Pays", "Wallets", "KYB", "Volume", "Inscription", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{m.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{m.companyName}</p>
                        <p className="text-xs text-gray-400">{m.role === "admin" ? "🛡 Admin" : "Marchand"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{m.email}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">{m.country}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{m.wallets?.length ?? 0} wallet(s)</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", KYB_COLORS[m.kybStatus] ?? "bg-gray-100 text-gray-600")}>
                          {KYB_LABELS[m.kybStatus] ?? m.kybStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-900">{fmt(m.totalVolume)} XOF</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setEditMerchant(m)} title="Modifier" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setWalletMerchant(m)} title="Wallets" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors"><Wallet className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setResetMerchant(m)} title="Reset mdp" className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-500 transition-colors"><KeyRound className="w-3.5 h-3.5" /></button>
                          <button
                            onClick={() => setPromoteMerchant(m)}
                            title={m.role === "admin" ? "Rétrograder" : "Promouvoir admin"}
                            className={cn("p-1.5 rounded-lg transition-colors", m.role === "admin" ? "hover:bg-orange-50 text-orange-400" : "hover:bg-indigo-50 text-indigo-400")}
                          >
                            {m.role === "admin" ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => suspend(m)} title="Suspendre" className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"><UserX className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteMerchant(m)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} · {total} marchands total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); fetch_(page - 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page * LIMIT >= total} onClick={() => { setPage(p => p + 1); fetch_(page + 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {editMerchant && <EditModal merchant={editMerchant} onClose={() => setEditMerchant(null)} onSave={() => fetch_()} />}
      {walletMerchant && <WalletModal merchant={walletMerchant} onClose={() => setWalletMerchant(null)} />}
      {resetMerchant && <ResetPasswordModal merchant={resetMerchant} onClose={() => setResetMerchant(null)} />}
      {promoteMerchant && <PromoteModal merchant={promoteMerchant} onClose={() => setPromoteMerchant(null)} onDone={() => fetch_()} />}
    </AdminLayout>
  );
}
