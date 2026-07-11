import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, RefreshCw, CheckCircle2, Clock, XCircle,
  ChevronLeft, ChevronRight, X, ArrowRight, Filter,
  User, Wallet2, AlertTriangle,
} from "lucide-react";
import { SupportLayout, useSupportAuth } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRY_MAP: Record<string, { name: string; flag: string; currency: string }> = {
  TG: { name: "Togo",          flag: "🇹🇬", currency: "XOF" },
  BJ: { name: "Bénin",         flag: "🇧🇯", currency: "XOF" },
  BF: { name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF" },
  ML: { name: "Mali",          flag: "🇲🇱", currency: "XOF" },
  SN: { name: "Sénégal",       flag: "🇸🇳", currency: "XOF" },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  CM: { name: "Cameroun",      flag: "🇨🇲", currency: "XAF" },
  GH: { name: "Ghana",         flag: "🇬🇭", currency: "GHS" },
  NG: { name: "Nigeria",       flag: "🇳🇬", currency: "NGN" },
};

function fmt(n: string | number, currency?: string) {
  const v = parseFloat(String(n));
  if (isNaN(v)) return `0${currency ? " " + currency : ""}`;
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${currency ? " " + currency : ""}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
      <CheckCircle2 className="w-3 h-3" /> Approuvé
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
      <XCircle className="w-3 h-3" /> Rejeté
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
      <Clock className="w-3 h-3" /> En attente
    </span>
  );
}

function RejectModal({ onConfirm, onClose, loading }: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4"
      >
        <h3 className="font-bold text-white">Motif du rejet</h3>
        <textarea
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#C5FF4A]/50"
          rows={3}
          placeholder="Expliquez la raison du rejet..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Confirmer"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailPanel({ exchangeId, onClose, onAction }: {
  exchangeId: number;
  onClose: () => void;
  onAction: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    setLoading(true); setDetail(null); setFeedback(null);
    fetch(`${BASE}/api/support-admin/wallet-exchanges/${exchangeId}`, { credentials: "include" })
      .then(r => r.json()).then(setDetail).finally(() => setLoading(false));
  }, [exchangeId]);

  async function handleApprove() {
    setActionLoading("approve");
    const r = await fetch(`${BASE}/api/support-admin/wallet-exchanges/${exchangeId}/approve`, {
      method: "POST", credentials: "include",
    });
    const d = await r.json();
    if (r.ok) {
      setFeedback({ ok: true, msg: "Échange approuvé avec succès." });
      setDetail((prev: any) => prev ? { ...prev, exchange: { ...prev.exchange, status: "approved" } } : prev);
      onAction();
    } else {
      setFeedback({ ok: false, msg: d.error ?? "Erreur lors de l'approbation." });
    }
    setActionLoading(null);
  }

  async function handleReject(reason: string) {
    setActionLoading("reject");
    const r = await fetch(`${BASE}/api/support-admin/wallet-exchanges/${exchangeId}/reject`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const d = await r.json();
    setShowReject(false);
    if (r.ok) {
      setFeedback({ ok: false, msg: "Échange rejeté. Fonds recrédités." });
      setDetail((prev: any) => prev ? {
        ...prev, exchange: { ...prev.exchange, status: "rejected", rejectionReason: reason },
      } : prev);
      onAction();
    } else {
      setFeedback({ ok: false, msg: d.error ?? "Erreur lors du rejet." });
    }
    setActionLoading(null);
  }

  const ex = detail?.exchange;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
        <motion.div
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 flex flex-col h-full shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#C5FF4A]" /> Détails de l'échange
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-800 rounded-xl" />)}
              </div>
            ) : !detail ? (
              <p className="text-red-400 text-sm">Erreur de chargement.</p>
            ) : (
              <>
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={cn(
                        "flex items-start gap-2 px-4 py-3 rounded-xl text-sm border",
                        feedback.ok
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      )}
                    >
                      {feedback.ok
                        ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                      {feedback.msg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Exchange summary */}
                <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Échange</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                        ex.mode === "live" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {ex.mode === "live" ? "Live" : "Sandbox"}
                      </span>
                      <StatusBadge status={ex.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <p className="text-2xl">{COUNTRY_MAP[ex.fromCountryCode]?.flag ?? "🌍"}</p>
                      <p className="text-xs font-semibold text-gray-300">{COUNTRY_MAP[ex.fromCountryCode]?.name ?? ex.fromCountryCode}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#C5FF4A] shrink-0" />
                    <div className="flex-1 text-center">
                      <p className="text-2xl">{COUNTRY_MAP[ex.toCountryCode]?.flag ?? "🌍"}</p>
                      <p className="text-xs font-semibold text-gray-300">{COUNTRY_MAP[ex.toCountryCode]?.name ?? ex.toCountryCode}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Montant", value: fmt(ex.amount), color: "text-white" },
                      { label: "Frais (3%)", value: `−${fmt(ex.fee)}`, color: "text-orange-400" },
                      { label: "Net crédité", value: fmt(ex.netAmount), color: "text-[#C5FF4A]" },
                    ].map(c => (
                      <div key={c.label} className="bg-gray-900 rounded-lg p-2.5 text-center border border-gray-700">
                        <p className="text-[10px] text-gray-500 mb-0.5">{c.label}</p>
                        <p className={cn("text-sm font-bold", c.color)}>{c.value}</p>
                        <p className="text-[10px] text-gray-500">{ex.currency}</p>
                      </div>
                    ))}
                  </div>

                  {ex.reference && (
                    <p className="text-xs font-mono text-gray-500 text-center">Réf: {ex.reference}</p>
                  )}
                  {ex.note && (
                    <p className="text-xs text-gray-400 italic bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
                      Note : {ex.note}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 text-center">Soumis le {fmtDate(ex.createdAt)}</p>
                  {ex.status === "rejected" && ex.rejectionReason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-400 font-semibold">Motif du rejet :</p>
                      <p className="text-xs text-red-300">{ex.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Merchant */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Marchand
                  </p>
                  {detail.merchant ? (
                    <div className="bg-gray-800 rounded-xl p-4 space-y-1 border border-gray-700">
                      <p className="font-semibold text-white">{detail.merchant.companyName}</p>
                      <p className="text-sm text-gray-400">{detail.merchant.email}</p>
                      <p className="text-xs text-gray-500">Pays : {detail.merchant.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Marchand introuvable</p>
                  )}
                </div>

                {/* Wallets */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    <Wallet2 className="w-3.5 h-3.5" /> Soldes des wallets
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { country: ex.fromCountryCode, wallet: detail.fromWallet, label: "Source" },
                      { country: ex.toCountryCode,   wallet: detail.toWallet,   label: "Destination" },
                    ].map(({ country, wallet, label }) => (
                      <div key={label} className="bg-gray-800 rounded-xl p-3 space-y-1.5 border border-gray-700">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{COUNTRY_MAP[country]?.flag ?? "🌍"}</span>
                          <p className="text-xs font-semibold text-gray-300">{COUNTRY_MAP[country]?.name ?? country}</p>
                        </div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase">{label}</p>
                        {wallet ? (
                          <>
                            <div>
                              <p className="text-[10px] text-gray-500">Solde</p>
                              <p className="text-sm font-bold text-white">{fmt(wallet.balance, wallet.currency)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500">Bloqué</p>
                              <p className="text-sm font-semibold text-orange-400">{fmt(wallet.lockedBalance, wallet.currency)}</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            {label === "Destination" ? "Sera créé à l'approbation" : "Introuvable"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {detail?.exchange.status === "pending" && (
            <div className="border-t border-gray-800 p-5 space-y-3">
              <button
                onClick={handleApprove}
                disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C5FF4A] text-gray-900 font-bold text-sm hover:bg-[#d4ff6b] transition-colors disabled:opacity-50"
              >
                {actionLoading === "approve"
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <CheckCircle2 className="w-4 h-4" />}
                Approuver l'échange
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Rejeter l'échange
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showReject && (
          <RejectModal
            onConfirm={handleReject}
            onClose={() => setShowReject(false)}
            loading={actionLoading === "reject"}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function SupportAdminWalletExchanges() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { user } = useSupportAuth();
  const limit = 20;

  function load(p = page, st = statusFilter, mo = modeFilter) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (st) params.set("status", st);
    if (mo) params.set("mode", mo);
    fetch(`${BASE}/api/support-admin/wallet-exchanges?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setExchanges(d.exchanges ?? []); setTotal(d.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function applyFilter(st: string, mo: string) {
    setStatusFilter(st); setModeFilter(mo); setPage(1); load(1, st, mo);
  }

  const totalPages = Math.ceil(total / limit);
  const pendingCount = exchanges.filter(e => e.status === "pending").length;

  return (
    <SupportLayout>
      <div className="space-y-5 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <ArrowLeftRight className="w-5 h-5 text-[#C5FF4A] shrink-0" />
              Échanges de Wallets
              {pendingCount > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} échange{total !== 1 ? "s" : ""} au total</p>
          </div>
          <button
            onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          {[
            { label: "Tous", st: "", mo: "" },
            { label: "⏳ En attente", st: "pending" },
            { label: "✅ Approuvés", st: "approved" },
            { label: "❌ Rejetés", st: "rejected" },
          ].map(f => (
            <button key={f.st ?? "all"}
              onClick={() => applyFilter(f.st ?? "", modeFilter)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                statusFilter === (f.st ?? "")
                  ? "bg-[#C5FF4A] text-gray-900 border-[#C5FF4A]"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
              )}
            >{f.label}</button>
          ))}
          <div className="h-4 w-px bg-gray-700 mx-1" />
          {[
            { label: "Tous modes", mo: "" },
            { label: "🟢 Live", mo: "live" },
            { label: "🔵 Sandbox", mo: "sandbox" },
          ].map(f => (
            <button key={f.mo}
              onClick={() => applyFilter(statusFilter, f.mo)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                modeFilter === f.mo
                  ? "bg-gray-300 text-gray-900 border-gray-300"
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
              )}
            >{f.label}</button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Marchand</th>
                  <th className="px-4 py-3 text-left">Échange</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Net</th>
                  <th className="px-4 py-3 text-left">Mode</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Chargement...
                  </td></tr>
                ) : exchanges.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500 italic">
                    Aucun échange trouvé
                  </td></tr>
                ) : exchanges.map(ex => {
                  const fi = COUNTRY_MAP[ex.fromCountryCode];
                  const ti = COUNTRY_MAP[ex.toCountryCode];
                  return (
                    <tr key={ex.id}
                      onClick={() => setSelectedId(ex.id)}
                      className={cn(
                        "border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors cursor-pointer",
                        ex.status === "pending" && "bg-amber-500/5"
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-300 truncate max-w-[120px]">{ex.merchant?.companyName ?? "—"}</p>
                        <p className="text-xs text-gray-600 truncate max-w-[120px]">{ex.merchant?.email ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span>{fi?.flag ?? "🌍"}</span>
                          <ArrowRight className="w-3 h-3 text-gray-600" />
                          <span>{ti?.flag ?? "🌍"}</span>
                          <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                            {fi?.name ?? ex.fromCountryCode} → {ti?.name ?? ex.toCountryCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono">{ex.reference ?? `#${ex.id}`}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-300">{fmt(ex.amount, ex.currency)}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-orange-400">−{fmt(ex.fee)} frais</p>
                        <p className="text-xs font-semibold text-[#C5FF4A]">{fmt(ex.netAmount)} net</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border",
                          ex.mode === "live"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        )}>
                          {ex.mode === "live" ? "Live" : "Sandbox"}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={ex.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(ex.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(ex.id); }}
                          className="text-xs text-[#C5FF4A] hover:text-white font-medium px-3 py-1.5 rounded-lg border border-[#C5FF4A]/30 hover:bg-[#C5FF4A]/10 transition-colors"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <p className="text-xs text-gray-500">Page {page} / {totalPages} · {total} échanges</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load(p); }}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedId(null)}
            />
            <DetailPanel
              exchangeId={selectedId}
              onClose={() => setSelectedId(null)}
              onAction={() => load()}
            />
          </>
        )}
      </AnimatePresence>
    </SupportLayout>
  );
}
