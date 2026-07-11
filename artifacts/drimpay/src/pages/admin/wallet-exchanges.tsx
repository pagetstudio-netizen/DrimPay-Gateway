import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, RefreshCw, CheckCircle2, Clock, XCircle,
  ChevronLeft, ChevronRight, X, ArrowRight, User, Wallet2,
  AlertTriangle, Filter,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";
import { ADMIN_BASE } from "@/lib/admin-api";

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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3" /> Approuvé
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
      <XCircle className="w-3 h-3" /> Rejeté
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> En attente
    </span>
  );
}

type Exchange = {
  id: number;
  userId: number;
  fromWalletId: number;
  toWalletId: number;
  fromCountryCode: string;
  toCountryCode: string;
  currency: string;
  amount: string;
  fee: string;
  netAmount: string;
  note: string | null;
  reference: string | null;
  status: string;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  mode: string;
  createdAt: string;
  merchant: { id: number; companyName: string; email: string } | null;
};

type Detail = {
  exchange: Exchange;
  merchant: { id: number; companyName: string; email: string; country: string } | null;
  fromWallet: { id: number; balance: string; lockedBalance: string; countryCode: string; currency: string } | null;
  toWallet:   { id: number; balance: string; lockedBalance: string; countryCode: string; currency: string } | null;
};

function RejectModal({ onConfirm, onClose, loading }: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4"
      >
        <h3 className="font-bold text-gray-900">Motif du rejet</h3>
        <textarea
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400"
          rows={3}
          placeholder="Expliquez la raison du rejet..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Confirmer le rejet"}
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
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    setFeedback(null);
    fetch(`${ADMIN_BASE}/wallet-exchanges/${exchangeId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setDetail(d))
      .finally(() => setLoading(false));
  }, [exchangeId]);

  async function handleApprove() {
    setActionLoading("approve");
    const r = await fetch(`${ADMIN_BASE}/wallet-exchanges/${exchangeId}/approve`, {
      method: "POST", credentials: "include",
    });
    const d = await r.json();
    if (r.ok) {
      setFeedback({ ok: true, msg: "Échange approuvé avec succès. Le marchand a été notifié par email." });
      setDetail(prev => prev ? { ...prev, exchange: { ...prev.exchange, status: "approved" } } : prev);
      onAction();
    } else {
      setFeedback({ ok: false, msg: d.error ?? "Erreur lors de l'approbation." });
    }
    setActionLoading(null);
  }

  async function handleReject(reason: string) {
    setActionLoading("reject");
    const r = await fetch(`${ADMIN_BASE}/wallet-exchanges/${exchangeId}/reject`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const d = await r.json();
    setShowReject(false);
    if (r.ok) {
      setFeedback({ ok: false, msg: "Échange rejeté. Les fonds ont été recrédités sur le wallet source." });
      setDetail(prev => prev ? {
        ...prev,
        exchange: { ...prev.exchange, status: "rejected", rejectionReason: reason },
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
          className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> Détails de l'échange
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
              </div>
            ) : !detail ? (
              <p className="text-red-500 text-sm">Erreur de chargement des détails.</p>
            ) : (
              <>
                {/* Feedback */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={cn(
                        "flex items-start gap-2 px-4 py-3 rounded-xl text-sm",
                        feedback.ok
                          ? "bg-green-50 border border-green-100 text-green-700"
                          : "bg-amber-50 border border-amber-100 text-amber-700"
                      )}
                    >
                      {feedback.ok
                        ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                      <span>{feedback.msg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Exchange summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Échange</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        ex!.mode === "live" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {ex!.mode === "live" ? "Live" : "Sandbox"}
                      </span>
                      <StatusBadge status={ex!.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <p className="text-2xl">{COUNTRY_MAP[ex!.fromCountryCode]?.flag ?? "🌍"}</p>
                      <p className="text-xs font-semibold text-gray-700">{COUNTRY_MAP[ex!.fromCountryCode]?.name ?? ex!.fromCountryCode}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div className="flex-1 text-center">
                      <p className="text-2xl">{COUNTRY_MAP[ex!.toCountryCode]?.flag ?? "🌍"}</p>
                      <p className="text-xs font-semibold text-gray-700">{COUNTRY_MAP[ex!.toCountryCode]?.name ?? ex!.toCountryCode}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Montant</p>
                      <p className="text-sm font-bold text-gray-900">{fmt(ex!.amount)}</p>
                      <p className="text-[10px] text-gray-400">{ex!.currency}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Frais (3%)</p>
                      <p className="text-sm font-bold text-orange-500">−{fmt(ex!.fee)}</p>
                      <p className="text-[10px] text-gray-400">{ex!.currency}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Net crédité</p>
                      <p className="text-sm font-bold text-emerald-600">{fmt(ex!.netAmount)}</p>
                      <p className="text-[10px] text-gray-400">{ex!.currency}</p>
                    </div>
                  </div>

                  {ex!.reference && (
                    <p className="text-xs font-mono text-gray-400 text-center">Réf: {ex!.reference}</p>
                  )}
                  {ex!.note && (
                    <p className="text-xs text-gray-500 italic bg-white border border-gray-100 rounded-lg px-3 py-2">
                      Note : {ex!.note}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 text-center">Soumis le {fmtDate(ex!.createdAt)}</p>
                  {ex!.reviewedBy && (
                    <p className="text-xs text-gray-400 text-center">
                      Traité par {ex!.reviewedBy} le {fmtDate(ex!.reviewedAt)}
                    </p>
                  )}
                  {ex!.status === "rejected" && ex!.rejectionReason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600 font-semibold">Motif du rejet :</p>
                      <p className="text-xs text-red-500">{ex!.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Merchant */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Marchand
                  </p>
                  {detail.merchant ? (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                      <p className="font-semibold text-gray-900">{detail.merchant.companyName}</p>
                      <p className="text-sm text-gray-500">{detail.merchant.email}</p>
                      <p className="text-xs text-gray-400">Pays : {detail.merchant.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Marchand introuvable</p>
                  )}
                </div>

                {/* Wallets */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    <Wallet2 className="w-3.5 h-3.5" /> Soldes des wallets
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Source wallet */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{COUNTRY_MAP[ex!.fromCountryCode]?.flag ?? "🌍"}</span>
                        <p className="text-xs font-semibold text-gray-700">{COUNTRY_MAP[ex!.fromCountryCode]?.name ?? ex!.fromCountryCode}</p>
                      </div>
                      {detail.fromWallet ? (
                        <>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">Solde actuel</p>
                            <p className="text-sm font-bold text-gray-900">{fmt(detail.fromWallet.balance, detail.fromWallet.currency)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">Bloqué</p>
                            <p className="text-sm font-semibold text-orange-500">{fmt(detail.fromWallet.lockedBalance, detail.fromWallet.currency)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">Disponible</p>
                            <p className="text-sm font-bold text-emerald-600">
                              {fmt(
                                Math.max(0, parseFloat(detail.fromWallet.balance) - parseFloat(detail.fromWallet.lockedBalance)),
                                detail.fromWallet.currency
                              )}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Wallet introuvable</p>
                      )}
                    </div>

                    {/* Destination wallet */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{COUNTRY_MAP[ex!.toCountryCode]?.flag ?? "🌍"}</span>
                        <p className="text-xs font-semibold text-gray-700">{COUNTRY_MAP[ex!.toCountryCode]?.name ?? ex!.toCountryCode}</p>
                      </div>
                      {detail.toWallet ? (
                        <>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">Solde actuel</p>
                            <p className="text-sm font-bold text-gray-900">{fmt(detail.toWallet.balance, detail.toWallet.currency)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-gray-400">Bloqué</p>
                            <p className="text-sm font-semibold text-orange-500">{fmt(detail.toWallet.lockedBalance, detail.toWallet.currency)}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Wallet non encore créé</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {detail?.exchange.status === "pending" && (
            <div className="border-t border-gray-100 p-5 space-y-3">
              <button
                onClick={handleApprove}
                disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === "approve"
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <CheckCircle2 className="w-4 h-4" />}
                Approuver l'échange
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
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

export default function AdminWalletExchanges() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const limit = 20;

  function load(p = page, st = statusFilter, mo = modeFilter) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(limit) });
    if (st) params.set("status", st);
    if (mo) params.set("mode", mo);
    fetch(`${ADMIN_BASE}/wallet-exchanges?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setExchanges(d.exchanges ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function applyFilter(st: string, mo: string) {
    setStatusFilter(st);
    setModeFilter(mo);
    setPage(1);
    load(1, st, mo);
  }

  const totalPages = Math.ceil(total / limit);

  // Count pending
  const pendingCount = exchanges.filter(e => e.status === "pending").length;

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-emerald-600" />
              Échanges de Wallets
              {pendingCount > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{total} échange{total !== 1 ? "s" : ""} au total</p>
          </div>
          <button
            onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filtres :</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Tous", st: "", mo: "" },
              { label: "⏳ En attente", st: "pending", mo: "" },
              { label: "✅ Approuvés", st: "approved", mo: "" },
              { label: "❌ Rejetés", st: "rejected", mo: "" },
            ].map(f => (
              <button
                key={f.st}
                onClick={() => applyFilter(f.st, modeFilter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  statusFilter === f.st
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { label: "Tous modes", mo: "" },
              { label: "🟢 Live", mo: "live" },
              { label: "🔵 Sandbox", mo: "sandbox" },
            ].map(f => (
              <button
                key={f.mo}
                onClick={() => applyFilter(statusFilter, f.mo)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  modeFilter === f.mo
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Marchand</th>
                  <th className="px-5 py-3 text-left">Échange</th>
                  <th className="px-5 py-3 text-left">Montant</th>
                  <th className="px-5 py-3 text-left">Frais / Net</th>
                  <th className="px-5 py-3 text-left">Mode</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin inline mr-2" /> Chargement...
                    </td>
                  </tr>
                ) : exchanges.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-gray-400 italic">
                      Aucun échange trouvé
                    </td>
                  </tr>
                ) : exchanges.map(ex => {
                  const fromInfo = COUNTRY_MAP[ex.fromCountryCode];
                  const toInfo   = COUNTRY_MAP[ex.toCountryCode];
                  return (
                    <tr
                      key={ex.id}
                      className={cn(
                        "border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer",
                        ex.status === "pending" && "bg-amber-50/30"
                      )}
                      onClick={() => setSelectedId(ex.id)}
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800 truncate max-w-[130px]">
                          {ex.merchant?.companyName ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[130px]">{ex.merchant?.email ?? ""}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{fromInfo?.flag ?? "🌍"}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <span className="text-base">{toInfo?.flag ?? "🌍"}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            {fromInfo?.name ?? ex.fromCountryCode} → {toInfo?.name ?? ex.toCountryCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{ex.reference ?? `#${ex.id}`}</p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {fmt(ex.amount, ex.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs text-orange-500">−{fmt(ex.fee)} frais</p>
                        <p className="text-xs font-semibold text-emerald-600">{fmt(ex.netAmount)} net</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          ex.mode === "live" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {ex.mode === "live" ? "Live" : "Sandbox"}
                        </span>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={ex.status} /></td>
                      <td className="px-5 py-3 text-xs text-gray-400">{fmtDate(ex.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedId(ex.id); }}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">Page {page} / {totalPages} · {total} échanges</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load(p); }}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
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
    </AdminLayout>
  );
}
