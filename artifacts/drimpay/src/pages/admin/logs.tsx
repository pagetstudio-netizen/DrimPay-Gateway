import { useEffect, useState } from "react";
import { Lock, RefreshCw, Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  APPROVE_KYB: "bg-green-100 text-green-700",
  REJECT_KYB: "bg-red-100 text-red-700",
  DELETE_MERCHANT: "bg-red-100 text-red-700",
  SUSPEND_MERCHANT: "bg-orange-100 text-orange-700",
  UPDATE_MERCHANT: "bg-blue-100 text-blue-700",
  CREDIT_WALLET: "bg-emerald-100 text-emerald-700",
  DEBIT_WALLET: "bg-orange-100 text-orange-700",
  REVOKE_API_KEY: "bg-red-100 text-red-700",
  RESET_PASSWORD: "bg-yellow-100 text-yellow-700",
  UPDATE_SETTINGS: "bg-purple-100 text-purple-700",
  CREATE_AGGREGATOR: "bg-blue-100 text-blue-700",
  UPDATE_AGGREGATOR: "bg-blue-100 text-blue-700",
  CREATE_OPERATOR_AGG: "bg-indigo-100 text-indigo-700",
  UPDATE_OPERATOR_AGG: "bg-indigo-100 text-indigo-700",
  DELETE_OPERATOR_AGG: "bg-red-100 text-red-700",
  DELETE_PAYMENT_LINK: "bg-red-100 text-red-700",
  SUSPEND_PAYMENT_LINK: "bg-orange-100 text-orange-700",
};

const ACTION_LABELS: Record<string, string> = {
  APPROVE_KYB: "KYB approuvé",
  REJECT_KYB: "KYB rejeté",
  REVIEW_KYB: "KYB en révision",
  DELETE_MERCHANT: "Marchand supprimé",
  SUSPEND_MERCHANT: "Marchand suspendu",
  ACTIVATE_MERCHANT: "Marchand activé",
  UPDATE_MERCHANT: "Marchand modifié",
  CREDIT_WALLET: "Wallet crédité",
  DEBIT_WALLET: "Wallet débité",
  EDIT_WALLET_BALANCE: "Solde wallet modifié",
  REVOKE_API_KEY: "Clé API révoquée",
  RESET_PASSWORD: "Mot de passe réinitialisé",
  UPDATE_SETTINGS: "Paramètres mis à jour",
  CREATE_AGGREGATOR: "Agrégateur créé",
  UPDATE_AGGREGATOR: "Agrégateur mis à jour",
  CREATE_OPERATOR_AGG: "Routage opérateur ajouté",
  UPDATE_OPERATOR_AGG: "Routage opérateur modifié",
  DELETE_OPERATOR_AGG: "Routage opérateur supprimé",
  CREATE_OPERATOR: "Opérateur créé",
  UPDATE_OPERATOR: "Opérateur modifié",
  DELETE_OPERATOR: "Opérateur supprimé",
  DELETE_PAYMENT_LINK: "Lien de paiement supprimé",
  SUSPEND_PAYMENT_LINK: "Lien de paiement suspendu",
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const LIMIT = 50;

  const load = async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), action: filterAction });
    const r = await fetch(`/api/admin/logs?${params}`, { credentials: "include" });
    const d = await r.json();
    setLogs(d.logs ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterAction]);

  const uniqueActions = [...new Set(Object.keys(ACTION_LABELS))].sort();

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logs & Sécurité</h1>
            <p className="text-sm text-gray-500">Journal d'audit des actions administrateurs</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">{total} actions loguées</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex gap-3 flex-wrap">
            <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="all">Toutes les actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>)}
            </select>
            <button onClick={() => load()} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 ml-auto">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : !logs.length ? (
              <div className="text-center py-16 text-gray-400">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun log enregistré</p>
                <p className="text-xs mt-1 text-gray-300">Les logs apparaîtront après vos premières actions admin</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Admin", "Action", "Cible", "ID cible", "Détails", "IP", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{log.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-900">{log.admin?.email?.split("@")[0] ?? "Admin"}</p>
                        <p className="text-[10px] text-gray-400">{log.admin?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap", ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600")}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-medium">{log.targetType ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{log.targetId ? `#${log.targetId}` : "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{log.details ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.ipAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} · {total} entrées</p>
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
