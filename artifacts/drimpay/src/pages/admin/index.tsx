import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, ArrowDownLeft, ArrowUpRight, Wallet2, KeyRound, Link2,
  TrendingUp, Percent, RefreshCw, AlertTriangle, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

function fmt(n: number, currency = "XOF") {
  return `${Math.round(n).toLocaleString("fr-FR")} ${currency}`;
}

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string;
  color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
        fetch("/api/admin/chart-data", { credentials: "include" }).then(r => r.json()),
      ]);
      setStats(s);
      setChartData(c);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const statCards = stats ? [
    { icon: Users, label: "Total Marchands", value: stats.totalMerchants, sub: `${stats.kybApproved} KYB approuvés`, color: "bg-blue-500", delay: 0 },
    { icon: ArrowDownLeft, label: "Pay-in Aujourd'hui", value: fmt(stats.payinToday.volume), sub: `${stats.payinToday.count} transactions`, color: "bg-emerald-500", delay: 0.05 },
    { icon: ArrowUpRight, label: "Pay-out Aujourd'hui", value: fmt(stats.payoutToday.volume), sub: `${stats.payoutToday.count} transactions`, color: "bg-orange-500", delay: 0.1 },
    { icon: TrendingUp, label: "Volume Pay-in Total", value: fmt(stats.totalPayinVolume), sub: "Toutes périodes", color: "bg-purple-500", delay: 0.15 },
    { icon: Wallet2, label: "Wallets Actifs", value: stats.activeWallets, sub: "Tous pays confondus", color: "bg-teal-500", delay: 0.2 },
    { icon: KeyRound, label: "APIs Actives", value: stats.activeApiKeys, sub: "Clés sandbox + live", color: "bg-indigo-500", delay: 0.25 },
    { icon: Percent, label: "Taux Succès", value: `${stats.successRate}%`, sub: "Toutes transactions", color: stats.successRate > 80 ? "bg-green-500" : "bg-red-500", delay: 0.3 },
    { icon: Link2, label: "Revenus Frais (3%)", value: fmt(stats.totalFees), sub: "Commissions totales", color: "bg-amber-500", delay: 0.35 },
  ] : [];

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord administrateur</h1>
            <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble de la plateforme DrimPay</p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => <StatCard key={card.label} {...card} />)}
          </div>
        )}

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
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-semibold">Alertes — Transactions élevées (&gt;60 000 XOF)</p>
              <p className="text-xs text-red-600 mt-0.5">{stats.bigTxAlerts.length} transaction(s) à surveiller.</p>
            </div>
          </motion.div>
        )}

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
                      {isPayin ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{tx.merchant?.companyName ?? `User #${tx.userId}`}</p>
                      <p className="text-[11px] text-gray-400 truncate">{tx.operator} · {tx.countryCode}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${isPayin ? "text-emerald-600" : "text-orange-600"}`}>
                        {isPayin ? "+" : "-"}{fmt(parseFloat(tx.amount), tx.currency)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {isSuccess ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : tx.status === "pending" ? <Clock className="w-3 h-3 text-yellow-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
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
      </div>
    </AdminLayout>
  );
}
