import { useEffect, useState } from "react";
import { AdminLayout } from "./layout";
import {
  UserPlus, Trash2, KeyRound, Loader2, CheckCircle2, XCircle,
  Eye, EyeOff, ShieldCheck, Copy, Search, UserCheck, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_BASE } from "@/lib/admin-api";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Agent = {
  id: number;
  email: string;
  name: string;
  mustChangePassword: boolean;
  createdAt: string;
};

function relDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminSupportAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createOk, setCreateOk] = useState(false);

  const [resetTarget, setResetTarget] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetOk, setResetOk] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [copied, setCopied] = useState("");

  // ── Merchant agents section ──────────────────────────────────────────────
  type MerchantAgent = { id: number; email: string; companyName: string; country: string; createdAt: string };
  const [merchantAgents, setMerchantAgents] = useState<MerchantAgent[]>([]);
  const [merchantSearch, setMerchantSearch] = useState("");
  const [searchResults, setSearchResults] = useState<MerchantAgent[]>([]);
  const [searching, setSearching] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchMerchantAgents = async () => {
    try {
      const r = await fetch(`${ADMIN_BASE}/merchants/support-agents`, { credentials: "include" });
      const d = await r.json();
      setMerchantAgents(d.agents ?? []);
    } catch {}
  };

  useEffect(() => { fetchMerchantAgents(); }, []);

  const handleMerchantSearch = async (q: string) => {
    setMerchantSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await fetch(`${ADMIN_BASE}/merchants?search=${encodeURIComponent(q)}&limit=10`, { credentials: "include" });
      const d = await r.json();
      setSearchResults((d.merchants ?? []).map((m: any) => ({
        id: m.id, email: m.email, companyName: m.companyName, country: m.country, createdAt: m.createdAt,
      })));
    } finally { setSearching(false); }
  };

  const handleToggleAgent = async (merchantId: number) => {
    setToggling(merchantId);
    try {
      const r = await fetch(`${ADMIN_BASE}/merchants/${merchantId}/toggle-support-agent`, {
        method: "PATCH", credentials: "include",
      });
      if (r.ok) {
        await fetchMerchantAgents();
        setSearchResults(prev => prev.filter(m => m.id !== merchantId));
      }
    } finally { setToggling(null); }
  };

  const handleRevokeAgent = async (merchantId: number) => {
    setToggling(merchantId);
    try {
      const r = await fetch(`${ADMIN_BASE}/merchants/${merchantId}/toggle-support-agent`, {
        method: "PATCH", credentials: "include",
      });
      if (r.ok) await fetchMerchantAgents();
    } finally { setToggling(null); }
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${ADMIN_BASE}/support-agents`, { credentials: "include" });
      const d = await r.json();
      setAgents(d.agents ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    const pw = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(f => ({ ...f, password: pw }));
    setShowPw(true);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError(""); setCreateOk(false);
    try {
      const r = await fetch(`${ADMIN_BASE}/support-agents`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setCreateError(d.error ?? "Erreur"); return; }
      setCreateOk(true);
      setForm({ email: "", name: "", password: "" });
      await fetchAgents();
      setTimeout(() => { setCreateOk(false); setShowCreate(false); }, 2000);
    } catch { setCreateError("Erreur réseau"); }
    finally { setCreating(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true); setResetError(""); setResetOk(false);
    try {
      const r = await fetch(`${ADMIN_BASE}/support-agents/${resetTarget.id}/reset-password`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const d = await r.json();
      if (!r.ok) { setResetError(d.error ?? "Erreur"); return; }
      setResetOk(true);
      await fetchAgents();
      setTimeout(() => { setResetOk(false); setResetTarget(null); setNewPassword(""); }, 2000);
    } catch { setResetError("Erreur réseau"); }
    finally { setResetting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${ADMIN_BASE}/support-agents/${deleteTarget.id}`, {
        method: "DELETE", credentials: "include",
      });
      setDeleteTarget(null);
      await fetchAgents();
    } finally { setDeleting(false); }
  };

  const inputCls = "w-full h-10 rounded-xl bg-gray-50 border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all";

  return (
    <AdminLayout title="Agents Support">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agents Service Client</h1>
            <p className="text-gray-500 text-sm mt-0.5">Gérez les comptes de l'interface support admin.</p>
          </div>
          <button
            onClick={() => { setShowCreate(v => !v); setCreateError(""); setCreateOk(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nouvel agent
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Créer un compte agent</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" /> {createError}
                </div>
              )}
              {createOk && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Compte créé avec succès
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom complet</label>
                  <input
                    className={inputCls} required
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Prénom Nom"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email" className={inputCls} required
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="agent@drimpay.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mot de passe provisoire</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPw ? "text" : "password"} className={cn(inputCls, "pr-20")} required
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Au moins 8 caractères"
                      minLength={8}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button type="button" onClick={() => copyToClipboard(form.password, "create-pw")} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Copier">
                        {copied === "create-pw" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={() => setShowPw(v => !v)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button" onClick={generatePassword}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Générer
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">L'agent devra changer son mot de passe à la première connexion.</p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit" disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-60"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Créer le compte
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors font-medium">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Marchands nommés agents support ───────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Marchands nommés agents support</h2>
            <span className="ml-auto text-xs text-gray-400">{merchantAgents.length} marchand{merchantAgents.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Search to nominate */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Nommer un marchand comme agent support
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-9 pr-4 h-10 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Rechercher par email ou nom de société..."
                value={merchantSearch}
                onChange={e => handleMerchantSearch(e.target.value)}
              />
              {searching && (
                <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm divide-y divide-gray-100">
                {searchResults.map(m => {
                  const isAlready = merchantAgents.some(a => a.id === m.id);
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                        {m.companyName?.[0]?.toUpperCase() ?? "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.companyName}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                      {isAlready ? (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Déjà agent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleAgent(m.id)}
                          disabled={toggling === m.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                        >
                          {toggling === m.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <UserCheck className="w-3 h-3" />}
                          Nommer agent
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current merchant agents */}
          {merchantAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
              <UserCheck className="w-7 h-7 opacity-30" />
              <p className="text-sm">Aucun marchand nommé agent pour l'instant</p>
              <p className="text-xs">Utilisez la recherche ci-dessus pour en nommer un.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {merchantAgents.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                    {m.companyName?.[0]?.toUpperCase() ?? "M"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.companyName}</p>
                    <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    <p className="text-[10px] text-gray-400">Pays : {m.country} · Nommé le {relDate(m.createdAt)}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                    Agent support
                  </span>
                  <button
                    onClick={() => handleRevokeAgent(m.id)}
                    disabled={toggling === m.id}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 hover:text-red-700 transition-colors disabled:opacity-60 shrink-0"
                    title="Révoquer le statut d'agent support"
                  >
                    {toggling === m.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <UserX className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agents list */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">{agents.length} agent{agents.length !== 1 ? "s" : ""}</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <ShieldCheck className="w-8 h-8 opacity-30" />
              <p className="text-sm">Aucun agent configuré</p>
              <p className="text-xs text-gray-400">Créez le premier compte agent ci-dessus.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm shrink-0">
                    {agent.name?.[0]?.toUpperCase() ?? "S"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{agent.name}</p>
                      {agent.mustChangePassword && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-semibold">
                          Doit changer le MDP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{agent.email}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Créé le {relDate(agent.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setResetTarget(agent); setNewPassword(""); setResetError(""); setResetOk(false); setShowNewPw(false); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold transition-colors"
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Réinit. MDP</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(agent)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 hover:text-red-700 transition-colors"
                      title="Supprimer le compte"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset password modal */}
        {resetTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-1">Réinitialiser le mot de passe</h2>
              <p className="text-sm text-gray-500 mb-5">Agent : <strong className="text-gray-900">{resetTarget.name}</strong></p>
              <form onSubmit={handleReset} className="space-y-4">
                {resetError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{resetError}</div>}
                {resetOk && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mot de passe réinitialisé</div>}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nouveau mot de passe</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showNewPw ? "text" : "password"} className={cn(inputCls, "pr-16")} required
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Au moins 8 caractères" minLength={8}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={() => copyToClipboard(newPassword, "reset-pw")} className="p-1 text-gray-400 hover:text-gray-600">
                          {copied === "reset-pw" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button type="button" onClick={() => setShowNewPw(v => !v)} className="p-1 text-gray-400 hover:text-gray-600">
                          {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
                        const pw = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
                        setNewPassword(pw); setShowNewPw(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold whitespace-nowrap"
                    >
                      Générer
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">L'agent devra changer ce mot de passe à la prochaine connexion.</p>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={resetting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl disabled:opacity-60 transition-colors">
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Réinitialiser
                  </button>
                  <button type="button" onClick={() => setResetTarget(null)} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors font-medium">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900 text-center mb-1">Supprimer le compte</h2>
              <p className="text-sm text-gray-500 text-center mb-5">
                Cette action est irréversible. Le compte de <strong className="text-gray-900">{deleteTarget.name}</strong> sera définitivement supprimé.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
