import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ArrowDownLeft, ArrowUpRight, Wallet2, KeyRound, Link2,
  TrendingUp, Percent, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, XCircle, ShieldCheck, Globe2, BadgePercent, Banknote,
  Activity, Calendar, RotateCcw, TriangleAlert,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { shortId } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function fmt(n: number, currency = "XOF") {
  return `${Math.round(n).toLocaleString("fr-FR")} ${currency}`;
}
function fmtNum(n: number) {
  return n.toLocaleString("fr-FR");
}

function StatCard({
  icon: Icon, label, value, sub, color, delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string;
  color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 28 }}
      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

function ConfirmResetModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <TriangleAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Réinitialiser les statistiques ?</p>
            <p className="text-xs text-gray-500">Cette action est réversible</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          Les compteurs de volumes, transactions, commissions et taux de succès seront remis à <strong>0</strong>.
          <br /><br />
          <span className="text-emerald-700 font-medium">Les données réelles ne sont pas supprimées.</span> Seul l'affichage des statistiques est réinitialisé à partir de maintenant.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? "En cours..." : "Réinitialiser"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }).then(r => r.ok ? r.json() : null),
        fetch("/api/admin/chart-data", { credentials: "include" }).then(r => r.ok ? r.json() : []),
      ]);
      if (s) setStats(s);
      if (Array.isArray(c)) setChartData(c);
      setLastRefresh(new Date());
    } catch {}
    setLoading(false);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const r = await fetch("/api/admin/stats/reset", {
        method: "POST",
        credentials: "include",
      });
      if (r.ok) {
        setShowResetModal(false);
        await fetchAll();
      }
    } catch {}
    setResetting(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const statCards = stats ? [
    {
      icon: Banknote, label: "Solde Plateforme",
      value: fmt(stats.soldePlateforme ?? 0),
      sub: `${fmtNum(stats.totalWallets ?? 0)} wallets · ${fmtNum(stats.activeWallets ?? 0)} actifs`,
      color: "bg-emerald-500", delay: 0,
    },
    {
      icon: Users, label: "Marchands",
      value: fmtNum(stats.totalMerchants ?? 0),
      sub: `${fmtNum(stats.kybApproved ?? 0)} KYB vérifiés`,
      color: "bg-blue-500", delay: 0.03,
    },
    {
      icon: Activity, label: "Total Transactions",
      value: fmt(stats.totalTxVolume ?? 0),
      sub: `${fmtNum(stats.totalTxCount ?? 0)} transactions · ${stats.successRate ?? 0}% succès`,
      color: "bg-violet-500", delay: 0.06,
    },
    {
      icon: ArrowDownLeft, label: "Total Dépôts",
      value: fmt(stats.totalPayinVolume ?? 0),
      sub: `Montant total pay-in`,
      color: "bg-teal-500", delay: 0.09,
    },
    {
      icon: ArrowUpRight, label: "Total Retraits",
      value: fmt(stats.totalPayoutVolume ?? 0),
      sub: `Montant total pay-out`,
      color: "bg-orange-500", delay: 0.12,
    },
    {
      icon: TrendingUp, label: "Pay-in Aujourd'hui",
      value: fmt(stats.payinToday?.volume ?? 0),
      sub: `${fmtNum(stats.payinToday?.count ?? 0)} transactions`,
      color: "bg-emerald-400", delay: 0.15,
    },
    {
      icon: ArrowUpRight, label: "Pay-out Aujourd'hui",
      value: fmt(stats.payoutToday?.volume ?? 0),
      sub: `${fmtNum(stats.payoutToday?.count ?? 0)} transactions`,
      color: "bg-amber-500", delay: 0.18,
    },
    {
      icon: Calendar, label: "Commissions du jour",
      value: fmt(stats.commissionsAujourdhui ?? 0),
      sub: `Aujourd'hui`,
      color: "bg-pink-500", delay: 0.21,
    },
    {
      icon: BadgePercent, label: "Commissions Totales",
      value: fmt(stats.totalFees ?? 0),
      sub: `Toutes périodes confondues`,
      color: "bg-purple-500", delay: 0.24,
    },
    {
      icon: Globe2, label: "Paiements Live",
      value: fmt((stats.livePayinVolume ?? 0) + (stats.livePayoutVolume ?? 0)),
      sub: `${fmtNum(stats.liveCount ?? 0)} complétés · ${fmtNum(stats.sandboxCount ?? 0)} sandbox`,
      color: "bg-indigo-500", delay: 0.27,
    },
    {
      icon: KeyRound, label: "Clés API",
      value: fmtNum(stats.totalApiKeys ?? 0),
      sub: `${fmtNum(stats.activeApiKeys ?? 0)} actives`,
      color: "bg-slate-500", delay: 0.30,
    },
    {
      icon: Link2, label: "Liens de paiement",
      value: fmtNum(stats.totalPaymentLinks ?? 0),
      sub: `${fmtNum(stats.activePaymentLinks ?? 0)} actifs`,
      color: "bg-cyan-500", delay: 0.33,
    },
    {
      icon: ShieldCheck, label: "KYC en attente",
      value: fmtNum((stats.kybPending ?? 0) + (stats.kybUnderReview ?? 0)),
      sub: `${fmtNum(stats.kybPending ?? 0)} soumis · ${fmtNum(stats.kybUnderReview ?? 0)} en révision`,
      color: (stats.kybPending ?? 0) + (stats.kybUnderReview ?? 0) > 0 ? "bg-amber-500" : "bg-green-500",
      delay: 0.36,
    },
    {
      icon: Percent, label: "Taux de succès",
      value: `${stats.successRate ?? 0}%`,
      sub: `${fmtNum(stats.totalSuccessCount ?? 0)} / ${fmtNum(stats.totalTxCount ?? 0)} transactions`,
      color: (stats.successRate ?? 0) >= 80 ? "bg-green-500" : (stats.successRate ?? 0) >= 60 ? "bg-yellow-500" : "bg-red-500",
      delay: 0.39,
    },
  ] : [];

  return (
    <AdminLayout>
      <AnimatePresence>
        {showResetModal && (
          <ConfirmResetModal
            onConfirm={handleReset}
            onCancel={() => setShowResetModal(false)}
            loading={resetting}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord administrateur</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Vue d'ensemble de la plateforme DrimPay
              {lastRefresh && (
                <span className="ml-2 text-gray-400">· Actualisé à {lastRefresh.toLocaleTimeString("fr-FR")}</span>
              )}
            </p>
            {stats?.statsResetAt && (
              <p className="text-xs text-amber-600 mt-0.5">
                Stats réinitialisées le {new Date(stats.statsResetAt).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Réinitialiser les statistiques
            </button>
            <button onClick={fetchAll} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Alertes */}
        {stats?.kybPending > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              <strong>{stats.kybPending}</strong> dossier(s) KYB en attente de révision.
              <a href="/admin/kyb" className="ml-2 text-amber-600 underline hover:text-amber-800">Voir les dossiers →</a>
            </p>
          </motion.div>
        )}
        {stats?.bigTxAlerts?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              <strong>{stats.bigTxAlerts.length}</strong> transaction(s) élevées (&gt;60 000 XOF) à surveiller.
              <a href="/admin/transactions" className="ml-2 text-red-600 underline hover:text-red-800">Voir →</a>
            </p>
          </motion.div>
        )}

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(14)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card) => <StatCard key={card.label} {...card} />)}
          </div>
        )}

        {/* Charts + recent */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Volume transactions (30 derniers jours)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPayin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPayout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => fmt(Number(v))} labelFormatter={(l) => `Date: ${l}`} />
                <Area type="monotone" dataKey="payin" stroke="#10b981" fill="url(#gPayin)" name="Pay-in" strokeWidth={2} />
                <Area type="monotone" dataKey="payout" stroke="#f97316" fill="url(#gPayout)" name="Pay-out" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Transactions récentes</h2>
            <div className="space-y-3">
              {(stats?.recentTransactions ?? []).slice(0, 6).map((tx: any) => {
                const isPayin = tx.type === "payin";
                const isSuccess = tx.status === "success";
                return (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPayin ? "bg-emerald-50" : "bg-orange-50"}`}>
                      {isPayin
                        ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        : <ArrowUpRight className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{tx.merchant?.companyName ?? shortId(tx.userId)}</p>
                      <p className="text-[11px] text-gray-400 truncate">{tx.operator} · {tx.countryCode}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${isPayin ? "text-emerald-600" : "text-orange-600"}`}>
                        {isPayin ? "+" : "-"}{fmt(parseFloat(tx.amount), tx.currency)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {isSuccess
                          ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                          : tx.status === "pending"
                            ? <Clock className="w-3 h-3 text-yellow-500" />
                            : <XCircle className="w-3 h-3 text-red-500" />}
                        <span className="text-[10px] text-gray-400 capitalize">{tx.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!stats?.recentTransactions?.length && (
                <p className="text-sm text-gray-400 text-center py-6">Aucune transaction</p>
              )}
            </div>
          </div>
        </div>

        {/* Sites utilisant l'API */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Sites utilisant l'API</h2>
            <span className="text-xs text-gray-400 ml-1">
              Domaines détectés faisant des requêtes vers l'API DrimPay
              {stats?.domainesCount > 0 && ` (${stats.domainesCount} domaine${stats.domainesCount > 1 ? "s" : ""} identifié${stats.domainesCount > 1 ? "s" : ""})`}
            </span>
          </div>
          {stats?.domainesAPI?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.domainesAPI.map((d: string) => (
                <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                  <Globe2 className="w-3 h-3" /> {d}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Aucun site intégré détecté pour l'instant. Les domaines seront affichés lorsque des requêtes API seront effectuées.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
