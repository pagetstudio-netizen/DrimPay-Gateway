import { useEffect, useState } from "react";
import { FileText, Search, RefreshCw, Eye, Download, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function ContractModal({ kyb, onClose }: { kyb: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Contrat — {kyb.user?.companyName ?? `#${kyb.userId}`}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {[
              ["Email du signataire", kyb.contractEmail],
              ["Version du contrat", kyb.contractVersion],
              ["Signé le", kyb.contractSignedAt ? new Date(kyb.contractSignedAt).toLocaleString("fr-FR") : "Non signé"],
              ["Adresse IP", kyb.contractIp],
              ["Accepté", kyb.contractAccepted ? "✓ Oui" : "✗ Non"],
              ["User Agent", kyb.contractUserAgent],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-xs text-gray-500 shrink-0">{k}</span>
                <span className="text-xs text-gray-900 font-medium text-right break-all">{v ?? "—"}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Fermer</button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
              <Download className="w-4 h-4" /> Télécharger PDF
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminKybContracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const LIMIT = 20;

  const load = async (p = page) => {
    setLoading(true);
    const r = await fetch(`/api/admin/kyb?page=${p}&limit=${LIMIT}&status=approved`, { credentials: "include" });
    const d = await r.json();
    const withContract = (d.kyb ?? []).filter((k: any) => k.contractAccepted || k.contractSignedAt);
    setContracts(withContract);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contrats KYB</h1>
            <p className="text-sm text-gray-500">Contrats signés par les marchands approuvés</p>
          </div>
          <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : !contracts.length ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun contrat signé trouvé</p>
                <p className="text-xs mt-1 text-gray-300">Les contrats apparaissent ici après approbation KYB</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Marchand", "Email signataire", "Version", "Signé le", "IP", "Accepté", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(k => (
                    <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{k.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{k.user?.companyName ?? `#${k.userId}`}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{k.contractEmail ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{k.contractVersion ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{k.contractSignedAt ? new Date(k.contractSignedAt).toLocaleString("fr-FR") : "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{k.contractIp ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", k.contractAccepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          {k.contractAccepted ? "Oui" : "Non"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => setSelected(k)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} · {contracts.length} contrats</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page * LIMIT >= total} onClick={() => { setPage(p => p + 1); load(page + 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
      {selected && <ContractModal kyb={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}
