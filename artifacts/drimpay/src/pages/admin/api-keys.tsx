import { useEffect, useState } from "react";
import { KeyRound, Search, RefreshCw, Trash2, ChevronLeft, ChevronRight, Shield, ShieldOff } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn, shortId } from "@/lib/utils";

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const LIMIT = 20;

  const load = async (p = page, q = search) => {
    setLoading(true);
    const r = await fetch(`/api/admin/api-keys?page=${p}&limit=${LIMIT}&search=${encodeURIComponent(q)}`, { credentials: "include" });
    const d = await r.json();
    setKeys(d.keys ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const revoke = async (id: number) => {
    if (!confirm("Révoquer cette clé API ?")) return;
    await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE", credentials: "include" });
    setKeys(keys.map(k => k.id === id ? { ...k, status: "revoked" } : k));
  };

  const activeCount = keys.filter(k => k.status === "active").length;
  const revokedCount = keys.filter(k => k.status === "revoked").length;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">APIs & Clés</h1>
            <p className="text-sm text-gray-500">{total} clés API au total</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total clés", value: total, color: "bg-blue-500" },
            { label: "Clés actives", value: activeCount, color: "bg-green-500" },
            { label: "Révoquées", value: revokedCount, color: "bg-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); load(1, e.target.value); }}
                placeholder="Préfixe, nom, email marchand..." className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400" />
            </div>
            <button onClick={() => load()} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : !keys.length ? (
              <div className="text-center py-16 text-gray-400">
                <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune clé API</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Marchand", "Nom clé", "Préfixe", "Env.", "Statut", "Dernière utilisation", "Créée le", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keys.map(k => (
                    <tr key={k.id} className={cn("border-b border-gray-50 hover:bg-gray-50 transition-colors", k.status === "revoked" && "opacity-60")}>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{k.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-900">{k.merchant?.companyName ?? shortId(k.userId)}</p>
                        <p className="text-[10px] text-gray-400">{k.merchant?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 font-medium">{k.name}</td>
                      <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{k.prefix}...</code></td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", k.env === "live" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                          {k.env === "live" ? "Live" : "Sandbox"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", k.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          {k.status === "active" ? "Active" : "Révoquée"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("fr-FR") : "Jamais"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(k.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3">
                        {k.status === "active" && (
                          <button onClick={() => revoke(k.id)} title="Révoquer" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} · {total} total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page * LIMIT >= total} onClick={() => { setPage(p => p + 1); load(page + 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
