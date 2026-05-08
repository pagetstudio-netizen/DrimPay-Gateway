import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, Search, RefreshCw, Eye,
  Download, ChevronLeft, ChevronRight, X, AlertTriangle,
  Code2, FlaskConical, Wifi,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn, shortId } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  success:    "bg-green-100 text-green-700",
  pending:    "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  failed:     "bg-red-100 text-red-700",
  expired:    "bg-orange-100 text-orange-700",
  cancelled:  "bg-gray-100 text-gray-600",
  reversed:   "bg-purple-100 text-purple-700",
  queued:     "bg-gray-100 text-gray-600",
};
const STATUS_LABELS: Record<string, string> = {
  success: "Succès", pending: "En attente", processing: "En cours",
  failed: "Échoué", expired: "Expiré", cancelled: "Annulé", reversed: "Reversé", queued: "En file",
};

function fmt(n: string | number, cur = "XOF") {
  return `${parseFloat(String(n)).toLocaleString("fr-FR")} ${cur}`;
}

// ── Transaction detail modal ──────────────────────────────────────────────────

function TxDetailModal({ tx, onClose }: { tx: any; onClose: () => void }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [tab, setTab]             = useState<"info" | "payload">("info");

  const resendWebhook = async () => {
    setResending(true);
    await fetch(`/api/dashboard/transactions/${tx.id}/resend-webhook`, { method: "POST", credentials: "include" });
    setResent(true);
    setResending(false);
  };

  let parsedPayload: object | null = null;
  try { parsedPayload = tx.requestPayload ? JSON.parse(tx.requestPayload) : null; } catch { /* ignore */ }

  const isSandbox = tx.mode === "sandbox";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Transaction #{tx.id}</h2>
            {isSandbox && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                <FlaskConical className="w-3 h-3" /> Sandbox
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-6">
          {[
            { key: "info",    label: "Informations" },
            { key: "payload", label: "Requête initiale", icon: Code2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">

          {/* ── Tab: Info ── */}
          {tab === "info" && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-sm px-3 py-1 rounded-full font-medium", STATUS_COLORS[tx.status] ?? "bg-gray-100 text-gray-600")}>
                  {STATUS_LABELS[tx.status] ?? tx.status}
                </span>
                <span className={cn("text-sm px-3 py-1 rounded-full font-medium", tx.type === "payin" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")}>
                  {tx.type === "payin" ? "Pay-in" : "Pay-out"}
                </span>
                <span className={cn(
                  "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium",
                  isSandbox ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  {isSandbox ? <><FlaskConical className="w-3 h-3" /> Sandbox</> : <><Wifi className="w-3 h-3" /> Live</>}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Montant</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(tx.amount, tx.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Frais</p>
                  <p className="text-lg font-bold text-gray-700">{fmt(tx.fee, tx.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Net</p>
                  <p className="text-lg font-bold text-emerald-600">{fmt(tx.netAmount, tx.currency)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Référence",       tx.reference],
                  ["Order ID",        tx.orderId ?? "—"],
                  ["Marchand",        tx.merchant?.companyName ?? shortId(tx.userId)],
                  ["Email marchand",  tx.merchant?.email ?? "—"],
                  ["Pays",            tx.countryCode],
                  ["Opérateur",       tx.operator],
                  ["Téléphone",       tx.phone],
                  ["Mode",            tx.mode],
                  ["Date",            new Date(tx.createdAt).toLocaleString("fr-FR")],
                  ...(tx.externalRef      ? [["Réf externe",  tx.externalRef]]     : []),
                  ...(tx.gatewayReference ? [["Réf gateway",  tx.gatewayReference]] : []),
                  ...(tx.mnoReference     ? [["Réf MNO",      tx.mnoReference]]     : []),
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                    <p className="text-sm font-semibold text-gray-800 break-all">{v ?? "—"}</p>
                  </div>
                ))}
              </div>

              {tx.failureReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-red-500 font-semibold mb-1">Raison d'échec</p>
                  <p className="text-sm text-red-700">{tx.failureReason}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resendWebhook}
                  disabled={resending || resent}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {resent ? "✓ Webhook renvoyé" : resending ? "Envoi…" : "Renvoyer webhook"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </>
          )}

          {/* ── Tab: Request Payload ── */}
          {tab === "payload" && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-gray-500" />
                    <p className="text-sm font-semibold text-gray-700">Paramètres de la requête</p>
                  </div>
                  {parsedPayload && (
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(parsedPayload, null, 2))}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                    >
                      Copier
                    </button>
                  )}
                </div>
                {parsedPayload ? (
                  <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">
                    {JSON.stringify(parsedPayload, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Code2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun payload disponible pour cette transaction.</p>
                    <p className="text-xs mt-1 text-gray-400">Les transactions créées avant cette mise à jour n'ont pas de payload enregistré.</p>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const COUNTRIES = ["all", "TG", "BJ", "CM", "BF", "ML", "SN", "CI"];

export default function AdminTransactions() {
  const [txs, setTxs]               = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterMode, setFilterMode] = useState<"all" | "live" | "sandbox">("all");
  const [selected, setSelected]     = useState<any>(null);
  const LIMIT = 20;

  const load = async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p), limit: String(LIMIT),
      type: filterType, status: filterStatus,
      countryCode: filterCountry, search,
      mode: filterMode,
    });
    const r = await fetch(`/api/admin/transactions?${params}`, { credentials: "include" });
    const d = await r.json();
    setTxs(d.transactions ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterType, filterStatus, filterCountry, filterMode]);

  const exportCSV = () => {
    const rows = txs.map(t =>
      [t.id, t.reference, t.orderId, t.type, t.status, t.mode, t.amount, t.fee, t.currency, t.countryCode, t.operator, t.phone, t.createdAt].join(",")
    );
    const csv = ["ID,Référence,OrderID,Type,Statut,Mode,Montant,Frais,Devise,Pays,Opérateur,Téléphone,Date", ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `transactions_${filterMode}.csv`;
    a.click();
  };

  const bigAlerts = txs.filter(t => parseFloat(t.amount) > 60000 && t.mode === "live");

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Title + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-500">{total.toLocaleString("fr-FR")} transactions · mode actuel : <strong>{filterMode === "all" ? "Tous" : filterMode === "live" ? "Live" : "Sandbox"}</strong></p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {bigAlerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                <AlertTriangle className="w-4 h-4" /> {bigAlerts.length} tx &gt;60k XOF (live)
              </div>
            )}
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
              <Download className="w-4 h-4" /> Exporter
            </button>
          </div>
        </div>

        {/* Mode toggle — prominently placed */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Afficher :</span>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
            {([
              { key: "all",     label: "Tous",    icon: null },
              { key: "live",    label: "Live",    icon: Wifi },
              { key: "sandbox", label: "Sandbox", icon: FlaskConical },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setFilterMode(key); setPage(1); }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-r border-gray-200 last:border-0",
                  filterMode === key
                    ? key === "sandbox"
                      ? "bg-amber-500 text-white"
                      : key === "live"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}
          </div>
          {filterMode === "sandbox" && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
              <FlaskConical className="w-3.5 h-3.5" />
              Ces transactions sont simulées et n'affectent pas les soldes réels
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); load(1); }}
                placeholder="Référence, order_id, téléphone…"
                className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400"
              />
            </div>
            {[
              { value: filterType,    set: setFilterType,    options: [["all","Tous types"],["payin","Pay-in"],["payout","Pay-out"]] },
              { value: filterStatus,  set: setFilterStatus,  options: [["all","Tous statuts"],["success","Succès"],["pending","En attente"],["failed","Échoué"],["expired","Expiré"]] },
              { value: filterCountry, set: setFilterCountry, options: COUNTRIES.map(c => [c, c === "all" ? "Tous pays" : c]) },
            ].map(({ value, set, options }, i) => (
              <select
                key={i}
                value={value}
                onChange={e => { set(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
            <button onClick={() => load()} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : !txs.length ? (
              <div className="text-center py-16 text-gray-400">
                <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune transaction trouvée</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Marchand", "Type", "Mode", "Montant", "Frais", "Pays", "Opérateur", "Statut", "Date", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map(tx => {
                    const isSandbox = tx.mode === "sandbox";
                    return (
                      <tr
                        key={tx.id}
                        className={cn(
                          "border-b border-gray-50 hover:bg-gray-50 transition-colors",
                          parseFloat(tx.amount) > 60000 && !isSandbox && "bg-red-50/50 hover:bg-red-50",
                          isSandbox && "opacity-80"
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">#{tx.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 text-xs">{tx.merchant?.companyName ?? shortId(tx.userId)}</p>
                          <p className="text-[10px] text-gray-400">{tx.merchant?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", tx.type === "payin" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")}>
                            {tx.type === "payin" ? <><ArrowDownLeft className="w-3 h-3 inline" /> Pay-in</> : <><ArrowUpRight className="w-3 h-3 inline" /> Pay-out</>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit",
                            isSandbox ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {isSandbox ? <><FlaskConical className="w-3 h-3" />Sandbox</> : <><Wifi className="w-3 h-3" />Live</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 text-xs">{parseFloat(tx.amount).toLocaleString("fr-FR")} {tx.currency}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{parseFloat(tx.fee).toLocaleString("fr-FR")} {tx.currency}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">{tx.countryCode}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{tx.operator}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_COLORS[tx.status] ?? "bg-gray-100 text-gray-600")}>
                            {STATUS_LABELS[tx.status] ?? tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(tx)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} · {total.toLocaleString("fr-FR")} total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page * LIMIT >= total} onClick={() => { setPage(p => p + 1); load(page + 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected && <TxDetailModal tx={selected} onClose={() => setSelected(null)} />}
    </AdminLayout>
  );
}

function ArrowLeftRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}
