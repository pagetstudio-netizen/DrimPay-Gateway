import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, RefreshCw, Edit2, Trash2, KeyRound,
  ShieldCheck, UserX, ChevronLeft, ChevronRight, X, Check,
  Download, Wallet, ShieldOff, AlertTriangle, Save, UserCheck,
  Building2, Mail, Globe2, BadgeCheck, Copy,
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
  approved: "Vérifié", submitted: "Soumis", under_review: "En révision",
  rejected: "Rejeté", pending: "En attente",
};

function fmt(n: number) { return Math.round(n).toLocaleString("fr-FR"); }

const PANEL_TABS = [
  { key: "infos",    label: "Informations", icon: Building2 },
  { key: "wallets",  label: "Wallets",      icon: Wallet },
  { key: "securite", label: "Sécurité",     icon: KeyRound },
  { key: "danger",   label: "Zone danger",  icon: AlertTriangle },
];

function MerchantPanel({
  merchant, onClose, onRefresh,
}: { merchant: any; onClose: () => void; onRefresh: () => void }) {
  const [tab, setTab] = useState("infos");

  const [form, setForm] = useState({
    companyName: merchant.companyName,
    email: merchant.email,
    country: merchant.country,
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savedInfo, setSavedInfo] = useState(false);

  const [wallets, setWallets] = useState<any[]>(merchant.wallets ?? []);
  const [editingWallet, setEditingWallet] = useState<number | null>(null);
  const [newBal, setNewBal] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);

  const [newPwd, setNewPwd] = useState<string | null>(null);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [copied, setCopied] = useState(false);

  const [promoting, setPromoting] = useState(false);
  const [promotedRole, setPromotedRole] = useState<string>(merchant.role);

  const [suspending, setSuspending] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveInfo = async () => {
    setSavingInfo(true);
    await fetch(`/api/admin/merchants/${merchant.id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSavedInfo(true);
    setTimeout(() => setSavedInfo(false), 3000);
    setSavingInfo(false);
    onRefresh();
  };

  const saveWalletBalance = async (walletId: number) => {
    setSavingWallet(true);
    await fetch(`/api/admin/merchants/${merchant.id}/wallets/${walletId}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: newBal }),
    });
    setWallets(wallets.map((w: any) => w.id === walletId ? { ...w, balance: newBal } : w));
    setEditingWallet(null);
    setSavingWallet(false);
  };

  const resetPassword = async () => {
    setResettingPwd(true);
    const r = await fetch(`/api/admin/merchants/${merchant.id}/reset-password`, { method: "POST", credentials: "include" });
    const d = await r.json();
    setNewPwd(d.newPassword);
    setResettingPwd(false);
  };

  const copyPwd = () => {
    if (newPwd) { navigator.clipboard.writeText(newPwd); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const toggleRole = async () => {
    setPromoting(true);
    const newRole = promotedRole === "admin" ? "user" : "admin";
    await fetch(`/api/admin/merchants/${merchant.id}/role`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setPromotedRole(newRole);
    setPromoting(false);
    onRefresh();
  };

  const suspendMerchant = async () => {
    setSuspending(true);
    await fetch(`/api/admin/merchants/${merchant.id}/suspend`, { method: "POST", credentials: "include" });
    setSuspended(true);
    setSuspending(false);
  };

  const deleteMerchant = async () => {
    setDeleting(true);
    await fetch(`/api/admin/merchants/${merchant.id}`, { method: "DELETE", credentials: "include" });
    onRefresh();
    onClose();
  };

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{merchant.companyName}</p>
            <p className="text-xs text-gray-400 truncate">{merchant.email}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 shrink-0 ml-2">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex border-b border-gray-100 shrink-0 px-3 pt-2">
        {PANEL_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
                tab === t.key
                  ? t.key === "danger" ? "border-red-500 text-red-600" : "border-emerald-500 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {tab === "infos" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 text-xs">
              {[
                ["ID", `#${merchant.id}`],
                ["Rôle", promotedRole === "admin" ? "🛡 Administrateur" : "Marchand"],
                ["KYB", KYB_LABELS[merchant.kybStatus] ?? merchant.kybStatus],
                ["Volume", `${fmt(merchant.totalVolume)} XOF`],
                ["Transactions", `${merchant.txCount ?? 0}`],
                ["Inscrit le", new Date(merchant.createdAt).toLocaleDateString("fr-FR")],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-400 font-medium">{k}</p>
                  <p className="text-gray-900 font-semibold mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  <Building2 className="w-3 h-3 inline mr-1" />Nom de l'entreprise
                </label>
                <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  <Mail className="w-3 h-3 inline mr-1" />Email
                </label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  <Globe2 className="w-3 h-3 inline mr-1" />Pays (code ISO)
                </label>
                <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            {savedInfo && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                <Check className="w-4 h-4" /> Modifications enregistrées !
              </div>
            )}
            <button onClick={saveInfo} disabled={savingInfo}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {savingInfo ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        )}

        {tab === "wallets" && (
          <div className="space-y-3">
            {wallets.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun wallet pour ce marchand</p>
              </div>
            )}
            {wallets.map((w: any) => (
              <div key={w.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{w.countryCode} · {w.currency}</p>
                    <p className="text-xs text-gray-400">ID wallet #{w.id}</p>
                  </div>
                  {editingWallet !== w.id && (
                    <button onClick={() => { setEditingWallet(w.id); setNewBal(w.balance); }}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100">
                      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  )}
                </div>
                {editingWallet === w.id ? (
                  <div className="space-y-2">
                    <input value={newBal} onChange={e => setNewBal(e.target.value)}
                      placeholder="Nouveau solde"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <div className="flex gap-2">
                      <button onClick={() => saveWalletBalance(w.id)} disabled={savingWallet}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">
                        {savingWallet ? "..." : "Enregistrer"}
                      </button>
                      <button onClick={() => setEditingWallet(null)}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-emerald-600">{parseFloat(w.balance).toLocaleString("fr-FR")} {w.currency}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "securite" && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                {promotedRole === "admin"
                  ? <ShieldOff className="w-4 h-4 text-orange-500" />
                  : <ShieldCheck className="w-4 h-4 text-indigo-500" />}
                <p className="text-sm font-bold text-gray-900">
                  {promotedRole === "admin" ? "Rétrograder en marchand" : "Promouvoir en administrateur"}
                </p>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {promotedRole === "admin"
                  ? "Ce compte perdra l'accès complet au panneau d'administration."
                  : "Ce compte obtiendra un accès complet au panneau d'administration : marchands, KYB, wallets, paramètres."}
              </p>
              <button onClick={toggleRole} disabled={promoting}
                className={cn(
                  "w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors",
                  promotedRole === "admin" ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-600 hover:bg-indigo-700"
                )}>
                {promoting ? "En cours..." : promotedRole === "admin" ? "Rétrograder ce compte" : "Promouvoir en administrateur"}
              </button>
              {promotedRole !== merchant.role && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5" /> Rôle mis à jour avec succès
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-yellow-500" />
                <p className="text-sm font-bold text-gray-900">Réinitialiser le mot de passe</p>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Un nouveau mot de passe aléatoire sera généré pour <strong>{merchant.email}</strong>.
              </p>
              {newPwd ? (
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900">{newPwd}</span>
                    <button onClick={copyPwd} className="p-1 rounded hover:bg-gray-100">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                  </div>
                  <p className="text-xs text-yellow-600">⚠️ Transmettez ce mot de passe de façon sécurisée au marchand.</p>
                  <button onClick={() => setNewPwd(null)} className="w-full py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    Effacer
                  </button>
                </div>
              ) : (
                <button onClick={resetPassword} disabled={resettingPwd}
                  className="w-full py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50">
                  {resettingPwd ? "Génération..." : "Générer un nouveau mot de passe"}
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "danger" && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-bold text-orange-900">Suspendre le compte</p>
              </div>
              <p className="text-xs text-orange-700 mb-4">Le compte sera marqué suspendu et l'action sera loguée dans l'audit.</p>
              {suspended ? (
                <div className="flex items-center gap-2 text-xs text-orange-800 font-semibold bg-orange-100 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5" /> Compte suspendu — action loguée
                </div>
              ) : (
                <button onClick={suspendMerchant} disabled={suspending}
                  className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                  {suspending ? "En cours..." : "Suspendre ce compte"}
                </button>
              )}
            </div>

            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4 text-red-500" />
                <p className="text-sm font-bold text-red-900">Supprimer définitivement</p>
              </div>
              <p className="text-xs text-red-700 mb-4">
                Cette action est <strong>irréversible</strong>. Toutes les données du marchand (wallets, clés API, transactions) seront supprimées.
              </p>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl border-2 border-red-300 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
                  Supprimer ce marchand
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-800 font-semibold text-center">Confirmer la suppression de <em>{merchant.companyName}</em> ?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      Annuler
                    </button>
                    <button onClick={deleteMerchant} disabled={deleting}
                      className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50">
                      {deleting ? "..." : "Confirmer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const LIMIT = 20;

  const load = async (p = page, q = search) => {
    setLoading(true);
    const r = await fetch(`/api/admin/merchants?page=${p}&limit=${LIMIT}&search=${encodeURIComponent(q)}`, { credentials: "include" });
    const d = await r.json();
    setMerchants(d.merchants ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); load(1, v); };

  const exportCSV = () => {
    const rows = merchants.map(m => [m.id, m.companyName, m.email, m.country, m.kybStatus, m.totalVolume, m.createdAt].join(","));
    const csv = ["ID,Entreprise,Email,Pays,KYB,Volume,Inscription", ...rows].join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "marchands.csv"; a.click();
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

        <div className={cn("flex gap-5 items-start transition-all", selected ? "flex-row" : "")}>
          <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all", selected ? "w-[55%] shrink-0" : "w-full")}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input value={search} onChange={e => handleSearch(e.target.value)}
                  placeholder="Rechercher par nom, email..."
                  className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder:text-gray-400" />
              </div>
              <button onClick={() => load()} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
              ) : merchants.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Aucun marchand trouvé</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {(selected
                        ? ["Entreprise", "Pays", "KYB", "Volume"]
                        : ["ID", "Entreprise", "Email", "Pays", "Wallets", "KYB", "Volume", "Inscription"]
                      ).map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelected(selected?.id === m.id ? null : m)}
                        className={cn(
                          "border-b border-gray-50 cursor-pointer transition-colors",
                          selected?.id === m.id ? "bg-emerald-50 border-l-2 border-l-emerald-500" : "hover:bg-gray-50"
                        )}
                      >
                        {selected ? (
                          <>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900 text-xs">{m.companyName}</p>
                              <p className="text-[10px] text-gray-400">{m.role === "admin" ? "🛡 Admin" : "Marchand"}</p>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-700">{m.country}</td>
                            <td className="px-4 py-3">
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", KYB_COLORS[m.kybStatus] ?? "bg-gray-100 text-gray-600")}>
                                {KYB_LABELS[m.kybStatus] ?? m.kybStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold text-gray-900">{fmt(m.totalVolume)} XOF</td>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Page {page} · {total} marchands total</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={page * LIMIT >= total} onClick={() => { setPage(p => p + 1); load(page + 1); }}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selected && (
              <div className="flex-1 min-w-0" style={{ minHeight: 500 }}>
                <MerchantPanel
                  key={selected.id}
                  merchant={selected}
                  onClose={() => setSelected(null)}
                  onRefresh={() => load()}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {!selected && (
          <p className="text-xs text-center text-gray-400">Cliquez sur un marchand pour voir et modifier ses informations</p>
        )}
      </div>
    </AdminLayout>
  );
}
