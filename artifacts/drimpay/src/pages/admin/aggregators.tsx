import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, RefreshCw, Plus, Edit2, Trash2, X, Check, Globe2,
  ChevronDown, ChevronRight, AlertTriangle, Shield,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const DEFAULT_AGGREGATORS = [
  { name: "Clapay", code: "clapay", description: "Agrégateur mobile money Afrique de l'Ouest & Centre" },
  { name: "PayDunya", code: "paydunya", description: "Solution de paiement mobile money multidevise" },
];

const COUNTRIES = [
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF" },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
];

function ToggleSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center gap-2 group">
      <div className={cn("relative w-9 h-5 rounded-full transition-colors", value ? "bg-emerald-500" : "bg-gray-200")}>
        <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", value ? "translate-x-4" : "translate-x-0")} />
      </div>
      {label && <span className="text-xs text-gray-600">{label}</span>}
    </button>
  );
}

function OperatorAggRow({ oa, aggregators, onUpdate, onDelete }: { oa: any; aggregators: any[]; onUpdate: (data: any) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(oa);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/admin/operator-aggregators/${oa.id}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    onUpdate(form);
    setEditing(false);
    setSaving(false);
  };

  const toggleField = async (field: string, val: boolean) => {
    const updated = { ...form, [field]: val };
    setForm(updated);
    await fetch(`/api/admin/operator-aggregators/${oa.id}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: val }),
    });
    onUpdate(updated);
  };

  return (
    <tr className={cn("border-b border-gray-50 hover:bg-gray-50 transition-colors", !form.active && "opacity-60")}>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">{form.operatorName}</p>
        <p className="text-xs text-gray-400">{form.operatorType}</p>
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <select value={form.aggregatorCode} onChange={e => setForm({ ...form, aggregatorCode: e.target.value })}
            className="text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {aggregators.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
          </select>
        ) : (
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide",
            form.aggregatorCode === "clapay" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700")}>
            {form.aggregatorCode}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input type="number" value={form.dailyLimit} onChange={e => setForm({ ...form, dailyLimit: e.target.value })}
            className="w-24 text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none" />
        ) : (
          <span className="text-xs text-gray-700 font-medium">{parseFloat(form.dailyLimit).toLocaleString("fr-FR")}</span>
        )}
      </td>
      <td className="px-4 py-3"><ToggleSwitch value={form.active} onChange={v => toggleField("active", v)} /></td>
      <td className="px-4 py-3"><ToggleSwitch value={form.blockDeposits} onChange={v => toggleField("blockDeposits", v)} /></td>
      <td className="px-4 py-3"><ToggleSwitch value={form.blockWithdrawals} onChange={v => toggleField("blockWithdrawals", v)} /></td>
      <td className="px-4 py-3"><ToggleSwitch value={form.blockApi} onChange={v => toggleField("blockApi", v)} /></td>
      <td className="px-4 py-3"><ToggleSwitch value={form.blockPaymentLinks} onChange={v => toggleField("blockPaymentLinks", v)} /></td>
      <td className="px-4 py-3">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", form.maintenanceMode ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700")}>
          {form.maintenanceMode ? "Maintenance" : "Opérationnel"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          {editing ? (
            <>
              <button onClick={save} disabled={saving} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setEditing(false); setForm(oa); }} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AddOperatorAggModal({ aggregators, onClose, onAdd }: { aggregators: any[]; onClose: () => void; onAdd: () => void }) {
  const [form, setForm] = useState({ countryCode: "TG", operatorName: "", operatorType: "mobile-money", aggregatorCode: aggregators[0]?.code ?? "clapay", dailyLimit: "1000000", priority: 1 });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.operatorName) { alert("Nom opérateur requis"); return; }
    setSaving(true);
    await fetch("/api/admin/operator-aggregators", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    onAdd(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Ajouter opérateur → agrégateur</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          {[
            { label: "Pays", key: "countryCode", type: "select", opts: COUNTRIES.map(c => ({ v: c.code, l: `${c.flag} ${c.name}` })) },
            { label: "Nom opérateur", key: "operatorName", type: "text", placeholder: "Ex: Orange Money" },
            { label: "Type", key: "operatorType", type: "select", opts: [{ v: "mobile-money", l: "Mobile Money" }, { v: "bank", l: "Banque" }] },
            { label: "Agrégateur", key: "aggregatorCode", type: "select", opts: aggregators.map(a => ({ v: a.code, l: a.name })) },
            { label: "Limite journalière (XOF)", key: "dailyLimit", type: "number", placeholder: "1000000" },
          ].map(({ label, key, type, opts, placeholder }: any) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
              {type === "select" ? (
                <select value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {opts.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              ) : (
                <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminAggregators() {
  const [data, setData] = useState<any>({ aggregators: [], operatorAggregators: [] });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandCountry, setExpandCountry] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/aggregators", { credentials: "include" });
    let d = await r.json();
    if (!d.aggregators?.length) {
      for (const agg of DEFAULT_AGGREGATORS) {
        await fetch("/api/admin/aggregators", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(agg) }).catch(() => {});
      }
      const r2 = await fetch("/api/admin/aggregators", { credentials: "include" });
      d = await r2.json();
    }
    setData(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAgg = async (agg: any) => {
    await fetch(`/api/admin/aggregators/${agg.id}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !agg.active }),
    });
    load();
  };

  const deleteOpAgg = async (id: number) => {
    if (!confirm("Supprimer cette association ?")) return;
    await fetch(`/api/admin/operator-aggregators/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const grouped = COUNTRIES.map(c => ({
    ...c,
    ops: (data.operatorAggregators as any[]).filter(oa => oa.countryCode === c.code),
  })).filter(c => c.ops.length > 0 || expandCountry === c.code);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agrégateurs</h1>
            <p className="text-sm text-gray-500">Gestion du routage Clapay / PayDunya par opérateur</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm">
            <Plus className="w-4 h-4" /> Ajouter opérateur
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(data.aggregators as any[]).map(agg => (
            <div key={agg.id} className={cn("bg-white rounded-2xl border p-5 shadow-sm", agg.active ? "border-gray-100" : "border-red-100 bg-red-50/30")}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm", agg.code === "clapay" ? "bg-blue-600" : "bg-orange-600")}>
                  {agg.name[0]}
                </div>
                <ToggleSwitch value={agg.active} onChange={() => toggleAgg(agg)} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{agg.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{agg.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", agg.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {agg.active ? "Actif" : "Inactif"}
                </span>
                <span className="text-xs text-gray-400">{(data.operatorAggregators as any[]).filter(oa => oa.aggregatorCode === agg.code).length} opérateurs configurés</span>
              </div>
            </div>
          ))}
          {!data.aggregators?.length && loading && (
            <div className="col-span-2 h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Routage opérateurs → agrégateurs</h2>
            <button onClick={load} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : !(data.operatorAggregators as any[]).length ? (
            <div className="text-center py-12 text-gray-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun routage configuré</p>
              <button onClick={() => setShowAdd(true)} className="mt-4 text-sm text-emerald-600 underline">Ajouter le premier opérateur</button>
            </div>
          ) : (
            <div>
              {COUNTRIES.map(c => {
                const ops = (data.operatorAggregators as any[]).filter(oa => oa.countryCode === c.code);
                if (!ops.length) return null;
                return (
                  <div key={c.code} className="border-b border-gray-100 last:border-0">
                    <button onClick={() => setExpandCountry(expandCountry === c.code ? null : c.code)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-lg">{c.flag}</span>
                      <span className="font-semibold text-gray-900 text-sm flex-1 text-left">{c.name}</span>
                      <span className="text-xs text-gray-400 mr-2">{ops.length} opérateur(s)</span>
                      {expandCountry === c.code ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </button>
                    <AnimatePresence>
                      {expandCountry === c.code && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-y border-gray-100">
                                  {["Opérateur", "Agrégateur", "Limite/jour", "Actif", "Bloq. dépôts", "Bloq. retraits", "Bloq. API", "Bloq. liens", "Statut", ""].map(h => (
                                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {ops.map(oa => (
                                  <OperatorAggRow key={oa.id} oa={oa} aggregators={data.aggregators} onUpdate={() => load()} onDelete={() => deleteOpAgg(oa.id)} />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {showAdd && <AddOperatorAggModal aggregators={data.aggregators} onClose={() => setShowAdd(false)} onAdd={load} />}
    </AdminLayout>
  );
}
