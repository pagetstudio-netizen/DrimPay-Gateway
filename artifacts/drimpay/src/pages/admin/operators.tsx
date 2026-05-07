import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, RefreshCw, Plus, Edit2, Trash2, X, Check, Search } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
];

function AddOperatorModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [form, setForm] = useState({ countryCode: "TG", name: "", type: "mobile-money" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) { alert("Nom requis"); return; }
    setSaving(true);
    await fetch("/api/admin/operators", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    onAdd(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Ajouter un opérateur</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Pays</label>
            <select value={form.countryCode} onChange={e => setForm({ ...form, countryCode: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nom opérateur</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Orange Money" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
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

function OperatorRow({ op, onUpdate, onDelete }: { op: any; onUpdate: () => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: op.name, type: op.type, active: op.active });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/admin/operators/${op.id}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    onUpdate(); setEditing(false); setSaving(false);
  };

  const toggleActive = async () => {
    const newActive = !form.active;
    setForm(f => ({ ...f, active: newActive }));
    await fetch(`/api/admin/operators/${op.id}`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: newActive }),
    });
    onUpdate();
  };

  return (
    <tr className={cn("border-b border-gray-50 hover:bg-gray-50 transition-colors", !form.active && "opacity-60")}>
      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{op.id}</td>
      <td className="px-4 py-3">
        {editing ? (
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none w-40" />
        ) : (
          <span className="text-sm font-semibold text-gray-900">{form.name}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            className="text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none">
            <option value="mobile-money">Mobile Money</option>
            <option value="bank">Banque</option>
            <option value="card">Carte</option>
            <option value="ussd">USSD</option>
          </select>
        ) : (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">{form.type}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button onClick={toggleActive} className={cn("text-xs px-2.5 py-1 rounded-full font-medium transition-colors", form.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200")}>
          {form.active ? "Actif" : "Inactif"}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          {editing ? (
            <>
              <button onClick={save} disabled={saving} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"><X className="w-3.5 h-3.5" /></button>
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

export default function AdminOperators() {
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/operators", { credentials: "include" });
    const d = await r.json();
    setOperators(d ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteOp = async (id: number) => {
    if (!confirm("Supprimer cet opérateur ?")) return;
    await fetch(`/api/admin/operators/${id}`, { method: "DELETE", credentials: "include" });
    setOperators(ops => ops.filter(o => o.id !== id));
  };

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

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Opérateurs & Pays</h1>
            <p className="text-sm text-gray-500">{operators.length} opérateurs enregistrés</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm">
            <Plus className="w-4 h-4" /> Ajouter opérateur
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px] flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400" />
            </div>
            <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none">
              <option value="all">Tous les pays</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
            <button onClick={load} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : byCountry.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun opérateur trouvé</p>
            </div>
          ) : (
            byCountry.map(c => (
              <div key={c.code} className="border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50">
                  <span className="text-base">{c.flag}</span>
                  <span className="font-semibold text-gray-800 text-sm">{c.name}</span>
                  <span className="text-xs text-gray-400">{c.ops.length} opérateur(s)</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["ID", "Nom", "Type", "Statut", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.ops.map(op => (
                      <OperatorRow key={op.id} op={op} onUpdate={load} onDelete={() => deleteOp(op.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
      {showAdd && <AddOperatorModal onClose={() => setShowAdd(false)} onAdd={load} />}
    </AdminLayout>
  );
}
