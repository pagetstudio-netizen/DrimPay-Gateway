import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, RefreshCw, Plus, Edit2, Trash2, X, Search, ChevronDown } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRIES = [
  // 7 DrimPay active markets (pinned first)
  { code: "TG", name: "Togo",          flag: "🇹🇬", active: true, note: "Mobile Money principal" },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", active: true, note: "Forte adoption mobile" },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", active: true, note: "Pays siège DrimPay" },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫", active: true, note: "Paiement mobile dominant" },
  { code: "ML", name: "Mali",          flag: "🇲🇱", active: true, note: "Zone UEMOA" },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳", active: true, note: "Forte utilisation fintech" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", active: true, note: "Marché très actif" },
  // Other countries (expansion)
  { code: "CD", name: "RD Congo",       flag: "🇨🇩", active: false, note: "" },
  { code: "CG", name: "Congo",          flag: "🇨🇬", active: false, note: "" },
  { code: "GA", name: "Gabon",          flag: "🇬🇦", active: false, note: "" },
  { code: "GH", name: "Ghana",          flag: "🇬🇭", active: false, note: "" },
  { code: "GN", name: "Guinée",         flag: "🇬🇳", active: false, note: "" },
  { code: "KE", name: "Kenya",          flag: "🇰🇪", active: false, note: "" },
  { code: "NG", name: "Nigeria",        flag: "🇳🇬", active: false, note: "" },
  { code: "RW", name: "Rwanda",         flag: "🇷🇼", active: false, note: "" },
  { code: "SL", name: "Sierra Leone",   flag: "🇸🇱", active: false, note: "" },
  { code: "TZ", name: "Tanzanie",       flag: "🇹🇿", active: false, note: "" },
  { code: "UG", name: "Ouganda",        flag: "🇺🇬", active: false, note: "" },
];

const AGG_COLORS: Record<string, string> = {
  clapay: "bg-purple-100 text-purple-700",
  paydunya: "bg-blue-100 text-blue-700",
  mbiyo: "bg-amber-100 text-amber-700",
  mbiyo_pay: "bg-amber-100 text-amber-700",
  mbiyopay: "bg-amber-100 text-amber-700",
  omnipay: "bg-green-100 text-green-700",
  omni: "bg-green-100 text-green-700",
  paxity: "bg-indigo-100 text-indigo-700",
  soleaspay: "bg-rose-100 text-rose-700",
  soleas: "bg-rose-100 text-rose-700",
  maishapay: "bg-teal-100 text-teal-700",
  maisha: "bg-teal-100 text-teal-700",
};

function aggColor(code: string) {
  const key = code.toLowerCase().replace(/[^a-z]/g, "");
  for (const k of Object.keys(AGG_COLORS)) {
    if (key.includes(k)) return AGG_COLORS[k];
  }
  return "bg-gray-100 text-gray-700";
}

interface Operator { id: number; countryCode: string; name: string; type: string; active: boolean; }
interface OpAgg { id: number; countryCode: string; operatorName: string; operatorType: string; aggregatorCode: string; dailyLimit: string; active: boolean; priority: number; blockDeposits: boolean; blockWithdrawals: boolean; blockApi: boolean; blockPaymentLinks: boolean; maintenanceMode: boolean; }
interface Aggregator { id: number; name: string; code: string; description?: string; active: boolean; }

function EditOperatorModal({
  op, opAgg, aggregators, onClose, onSave,
}: {
  op: Operator; opAgg: OpAgg | null; aggregators: Aggregator[]; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: op.name,
    type: op.type,
    active: op.active,
    aggregatorCode: opAgg?.aggregatorCode ?? "",
    dailyLimit: opAgg?.dailyLimit ?? "1000000",
    blockDeposits: opAgg?.blockDeposits ?? false,
    blockWithdrawals: opAgg?.blockWithdrawals ?? false,
    blockApi: opAgg?.blockApi ?? false,
    blockPaymentLinks: opAgg?.blockPaymentLinks ?? false,
    maintenanceMode: opAgg?.maintenanceMode ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`${BASE}/api/admin/operators/${op.id}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSave();
    onClose();
  };

  const Toggle = ({ label, field }: { label: string; field: keyof typeof form }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={() => setForm(f => ({ ...f, [field]: !f[field as keyof typeof f] }))}
        className={cn("relative w-11 h-6 rounded-full transition-colors", form[field] ? "bg-emerald-500" : "bg-gray-200")}
      >
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", form[field] ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Modifier l'opérateur</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nom</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="mobile-money">Mobile Money</option>
                <option value="bank">Banque</option>
                <option value="card">Carte</option>
                <option value="ussd">USSD</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Pays</label>
              <div className="px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-600">
                {COUNTRIES.find(c => c.code === op.countryCode)?.flag} {op.countryCode}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Limite journalière</label>
            <input type="number" value={form.dailyLimit} onChange={e => setForm(f => ({ ...f, dailyLimit: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Passerelle de paiement</label>
            <select value={form.aggregatorCode} onChange={e => setForm(f => ({ ...f, aggregatorCode: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Aucune —</option>
              {aggregators.map(a => (
                <option key={a.code} value={a.code}>{a.name}</option>
              ))}
            </select>
            {aggregators.length > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                {aggregators.map(a => `${a.name}: ${a.description ?? a.code}`).join(" | ")}
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Actif</p>
            <Toggle label="Actif" field="active" />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Maintenance (bloquer des pages)</p>
            <div className="grid grid-cols-2 gap-x-4 divide-y divide-gray-50">
              <Toggle label="Toutes les pages" field="maintenanceMode" />
              <Toggle label="Dépôts" field="blockDeposits" />
              <Toggle label="Retraits" field="blockWithdrawals" />
              <Toggle label="Liens de paiement" field="blockPaymentLinks" />
              <Toggle label="API paiement" field="blockApi" />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100">
          <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? "Enregistrement..." : "Mettre à jour"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AddOperatorModal({ aggregators, onClose, onAdd }: { aggregators: Aggregator[]; onClose: () => void; onAdd: () => void }) {
  const [form, setForm] = useState({ countryCode: "TG", name: "", type: "mobile-money", aggregatorCode: "", dailyLimit: "1000000" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) { alert("Nom requis"); return; }
    setSaving(true);
    await fetch(`${BASE}/api/admin/operators`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    onAdd(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Ajouter un opérateur</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nom opérateur</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Orange Money" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="mobile-money">Mobile Money</option>
                <option value="bank">Banque</option>
                <option value="card">Carte</option>
                <option value="ussd">USSD</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Pays</label>
              <select value={form.countryCode} onChange={e => setForm({ ...form, countryCode: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Passerelle de paiement</label>
            <select value={form.aggregatorCode} onChange={e => setForm({ ...form, aggregatorCode: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Aucune —</option>
              {aggregators.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Limite journalière</label>
            <input type="number" value={form.dailyLimit} onChange={e => setForm({ ...form, dailyLimit: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminOperators() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [opAggs, setOpAggs] = useState<OpAgg[]>([]);
  const [aggregators, setAggregators] = useState<Aggregator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editOp, setEditOp] = useState<Operator | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${BASE}/api/admin/operators`, { credentials: "include" });
    const d = await r.json();
    setOperators(d?.operators ?? []);
    setOpAggs(d?.operatorAggregators ?? []);
    setAggregators(d?.aggregators ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteOp = async (id: number) => {
    if (!confirm("Supprimer cet opérateur ?")) return;
    await fetch(`${BASE}/api/admin/operators/${id}`, { method: "DELETE", credentials: "include" });
    setOperators(ops => ops.filter(o => o.id !== id));
  };

  const countryToggle = async (countryCode: string, active: boolean) => {
    setToggling(countryCode);
    await fetch(`${BASE}/api/admin/operators/country-toggle`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode, active }),
    });
    await load();
    setToggling(null);
  };

  const getOpAgg = (op: Operator) =>
    opAggs.find(oa => oa.countryCode === op.countryCode && oa.operatorName === op.name) ?? null;

  const filtered = operators.filter(op => {
    const q = search.toLowerCase();
    const matchSearch = !q || op.name.toLowerCase().includes(q) || op.type.toLowerCase().includes(q);
    const matchCountry = filterCountry === "all" || op.countryCode === filterCountry;
    return matchSearch && matchCountry;
  });

  const byCountry = COUNTRIES.map(c => ({
    ...c,
    ops: filtered.filter(op => op.countryCode === c.code),
  })).filter(c => c.ops.length > 0);

  const editOpAgg = editOp ? getOpAgg(editOp) : null;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Opérateurs par Pays</h1>
            <p className="text-sm text-gray-500">Configurez les opérateurs mobiles disponibles par pays</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm">
              <Plus className="w-4 h-4" /> Ajouter un opérateur
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un opérateur..." className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400" />
          </div>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none shadow-sm">
            <option value="all">Tous les pays</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <button onClick={load} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 shadow-sm">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : byCountry.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Globe2 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Aucun opérateur trouvé</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 text-sm text-emerald-600 font-semibold hover:underline">+ Ajouter un opérateur</button>
          </div>
        ) : (
          <div className="space-y-4">
            {byCountry.map(country => {
              const allActive = country.ops.every(op => op.active);
              const allInactive = country.ops.every(op => !op.active);
              const isBusy = toggling === country.code;
              return (
                <motion.div key={country.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{country.flag}</span>
                      <span className="font-bold text-gray-900">{country.name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{country.ops.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={isBusy || allActive}
                        onClick={() => countryToggle(country.code, true)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        {isBusy ? "..." : "Tout activer"}
                      </button>
                      <button
                        disabled={isBusy || allInactive}
                        onClick={() => countryToggle(country.code, false)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        {isBusy ? "..." : "Tout désactiver"}
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {country.ops.map(op => {
                      const oa = getOpAgg(op);
                      return (
                        <div key={op.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={cn("font-semibold text-sm", !op.active && "text-gray-400")}>{op.name}</span>
                            {oa ? (
                              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", aggColor(oa.aggregatorCode))}>
                                {aggregators.find(a => a.code === oa.aggregatorCode)?.name ?? oa.aggregatorCode}
                              </span>
                            ) : (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">Sans passerelle</span>
                            )}
                            {!op.active && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Inactif</span>
                            )}
                            {oa?.maintenanceMode && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">Maintenance</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEditOp(op)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteOp(op.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddOperatorModal aggregators={aggregators} onClose={() => setShowAdd(false)} onAdd={load} />}
        {editOp && (
          <EditOperatorModal
            op={editOp}
            opAgg={editOpAgg}
            aggregators={aggregators}
            onClose={() => setEditOp(null)}
            onSave={load}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
