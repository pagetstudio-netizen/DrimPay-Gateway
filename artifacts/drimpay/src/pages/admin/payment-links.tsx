import { useEffect, useState } from "react";
import { Link2, Search, RefreshCw, Trash2, Pause, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn, shortId } from "@/lib/utils";

export default function AdminPaymentLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const LIMIT = 20;

  const load = async (p = page, q = search) => {
    setLoading(true);
    const r = await fetch(`/api/admin/payment-links?page=${p}&limit=${LIMIT}&search=${encodeURIComponent(q)}`, { credentials: "include" });
    const d = await r.json();
    setLinks(d.links ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteLnk = async (id: number) => {
    if (!confirm("Supprimer ce lien de paiement ?")) return;
    await fetch(`/api/admin/payment-links/${id}`, { method: "DELETE", credentials: "include" });
    setLinks(ls => ls.filter(l => l.id !== id));
  };

  const suspendLnk = async (id: number) => {
    await fetch(`/api/admin/payment-links/${id}/suspend`, { method: "PUT", credentials: "include" });
    setLinks(ls => ls.map(l => l.id === id ? { ...l, status: "inactive" } : l));
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    expired: "bg-orange-100 text-orange-700",
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Liens de paiement</h1>
            <p className="text-sm text-gray-500">{total} liens au total</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); load(1, e.target.value); }}
                placeholder="Titre, token..." className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400" />
            </div>
            <button onClick={() => load()} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : !links.length ? (
              <div className="text-center py-16 text-gray-400">
                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun lien de paiement</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Marchand", "Titre", "Montant", "Devise", "Opérateur", "Utilisations", "Statut", "Expire le", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {links.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{l.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-900">{l.merchant?.companyName ?? shortId(l.userId)}</p>
                        <p className="text-[10px] text-gray-400">{l.merchant?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-gray-900">{l.title}</p>
                          <a href={`/fr/pay/${l.token}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-600">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">{l.token.slice(0, 12)}...</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-900">
                        {l.fixedAmount && l.amount ? parseFloat(l.amount).toLocaleString("fr-FR") : "Libre"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{l.currency}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{l.operator}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-gray-700">{l.uses}{l.maxUses ? `/${l.maxUses}` : ""}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[l.status] ?? "bg-gray-100 text-gray-600")}>
                          {l.status === "active" ? "Actif" : l.status === "inactive" ? "Inactif" : "Expiré"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {l.status === "active" && (
                            <button onClick={() => suspendLnk(l.id)} title="Suspendre" className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"><Pause className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => deleteLnk(l.id)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
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
