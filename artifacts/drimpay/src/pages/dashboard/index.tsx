import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Wallet, AlertCircle, Clock, XCircle, ChevronRight, CheckCircle2,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  BarChart3, Activity,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { DashboardLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const COUNTRY_MAP: Record<string, { name: string; flag: string; currency: string }> = {
  TG: { name: "Togo", flag: "🇹🇬", currency: "XOF" },
  BJ: { name: "Bénin", flag: "🇧🇯", currency: "XOF" },
  CM: { name: "Cameroun", flag: "🇨🇲", currency: "XAF" },
  BF: { name: "Burkina Faso", flag: "🇧🇫", currency: "XOF" },
  ML: { name: "Mali", flag: "🇲🇱", currency: "XOF" },
  SN: { name: "Sénégal", flag: "🇸🇳", currency: "XOF" },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  GN: { name: "Guinée", flag: "🇬🇳", currency: "GNF" },
  NE: { name: "Niger", flag: "🇳🇪", currency: "XOF" },
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  success: { label: "Succès", color: "text-emerald-600 bg-emerald-50", dot: "bg-emerald-500" },
  pending: { label: "En cours", color: "text-amber-600 bg-amber-50", dot: "bg-amber-400" },
  processing: { label: "Traitement", color: "text-blue-600 bg-blue-50", dot: "bg-blue-400" },
  failed: { label: "Échoué", color: "text-red-600 bg-red-50", dot: "bg-red-500" },
};

function fmt(n: string | number, currency = "XOF") {
  const v = parseFloat(String(n));
  if (isNaN(v)) return `0 ${currency}`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${currency}`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ${currency}`;
  return `${v.toLocaleString("fr-FR")} ${currency}`;
}

function fmtFull(n: string | number, currency = "XOF") {
  return `${parseFloat(String(n || 0)).toLocaleString("fr-FR")} ${currency}`;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function StatCard({
  label, value, sub, icon: Icon, imgSrc, color, trend, trendLabel, loading, delay = 0,
}: {
  label: string; value: string; sub: string; icon?: any; imgSrc?: string;
  color: string; trend?: "up" | "down" | "neutral"; trendLabel?: string;
  loading?: boolean; delay?: number;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Activity;
  const trendColor = trend === "up" ? "text-emerald-600 bg-emerald-50" : trend === "down" ? "text-red-500 bg-red-50" : "text-gray-500 bg-gray-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="relative bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-md transition-shadow duration-300"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${color}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            {imgSrc ? (
              <img src={`${BASE}${imgSrc}`} alt={label} className="w-10 h-10 object-cover rounded-xl" />
            ) : Icon ? (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
                style={{ background: "rgba(0,0,0,0.06)" }}>
                <Icon className="w-4.5 h-4.5 opacity-80" style={{ width: 18, height: 18 }} />
              </div>
            ) : null}
          </div>
          {trendLabel && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              {trendLabel}
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <div className="h-7 w-28 bg-muted rounded-lg animate-pulse mb-1.5" />
        ) : (
          <p className="text-2xl font-bold tracking-tight mb-1">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-foreground">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"area" | "bar">("bar");

  const load = () => {
    setLoading(true);
    fetch("/api/dashboard/overview", { credentials: "include" })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalPayin = data?.txStats
    ?.filter((s: any) => s.type === "payin" && s.status === "success")
    ?.reduce((acc: number, s: any) => acc + parseFloat(s.total ?? "0"), 0) ?? 0;

  const totalPayout = data?.txStats
    ?.filter((s: any) => s.type === "payout" && s.status === "success")
    ?.reduce((acc: number, s: any) => acc + parseFloat(s.total ?? "0"), 0) ?? 0;

  const totalFees = data?.txStats
    ?.reduce((acc: number, s: any) => acc + parseFloat(s.totalFees ?? "0"), 0) ?? 0;

  const totalTx = data?.txStats
    ?.reduce((acc: number, s: any) => acc + parseInt(s.txCount ?? "0"), 0) ?? 0;

  const successTx = data?.txStats
    ?.filter((s: any) => s.status === "success")
    ?.reduce((acc: number, s: any) => acc + parseInt(s.txCount ?? "0"), 0) ?? 0;

  const successRate = totalTx > 0 ? Math.round((successTx / totalTx) * 100) : 0;

  const volumeChart: any[] = data?.volumeChart ?? [];
  const totalVol30 = volumeChart.reduce((s: number, d: any) => s + d.payin + d.payout, 0);

  const kybStatus = data?.kybStatus ?? "pending";
  const isReview = kybStatus === "submitted" || kybStatus === "under_review";

  const stats = [
    {
      label: "Total Reçu",
      value: fmt(totalPayin),
      sub: fmtFull(totalPayin) + " XOF",
      imgSrc: "/stat-payin.png",
      color: "bg-emerald-500",
      trend: "up" as const,
      trendLabel: "Pay-in",
    },
    {
      label: "Total Envoyé",
      value: fmt(totalPayout),
      sub: fmtFull(totalPayout) + " XOF",
      imgSrc: "/stat-payout.png",
      color: "bg-blue-500",
      trend: "neutral" as const,
      trendLabel: "Pay-out",
    },
    {
      label: "Frais Totaux",
      value: fmt(totalFees),
      sub: "Commission plateforme",
      imgSrc: "/stat-fees.png",
      color: "bg-violet-500",
      trend: "neutral" as const,
      trendLabel: (user as any)?.accountType === "personal" ? "5%/tx" : "3%/tx",
    },
    {
      label: "Transactions",
      value: totalTx.toLocaleString("fr-FR"),
      sub: `${successRate}% taux de succès`,
      imgSrc: "/stat-transactions.png",
      color: "bg-amber-500",
      trend: successRate >= 90 ? "up" as const : successRate < 70 ? "down" as const : "neutral" as const,
      trendLabel: `${successRate}%`,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Bonjour, {user?.companyName}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Vue d'ensemble de votre activité</p>
          </div>
        </div>

        {kybStatus !== "approved" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4
              ${isReview ? "bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20" : "bg-card border-border"}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isReview ? "bg-amber-500/15" : "bg-primary/10"}`}>
              {isReview ? <Clock className="w-5 h-5 text-amber-500" /> : <AlertCircle className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isReview ? "text-amber-700 dark:text-amber-400" : "text-foreground"}`}>
                {isReview ? "Vérification en cours — votre dossier est entre nos mains" : "Activez votre compte Live"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {isReview
                  ? "Nos équipes analysent vos documents. Vous recevrez un e-mail de confirmation dans 1 à 2 jours ouvrables."
                  : "Complétez la vérification KYB pour débloquer les wallets, les transferts et vos clés API live."}
              </p>
            </div>
            {!isReview && (
              <Link href="/dashboard/kyb">
                <Button size="sm" className="shrink-0 gap-1.5 h-9">
                  Démarrer <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} loading={loading} delay={i * 0.07} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-sm">Volume des transactions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                30 derniers jours · {fmt(totalVol30)} total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mr-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 opacity-80" /> Pay-in
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-80" /> Pay-out
                </span>
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["bar", "area"] as const).map(t => (
                  <button key={t} onClick={() => setChartType(t)}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${chartType === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                    {t === "bar" ? "Barres" : "Aire"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 h-56">
            {loading ? (
              <div className="h-full flex items-end gap-1 px-2">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="flex-1 bg-muted rounded-t animate-pulse" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={volumeChart} barGap={1} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false} axisLine={false}
                      interval={Math.floor(volumeChart.length / 7)} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={42} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)", radius: 4 }} />
                    <Bar dataKey="payin" name="Pay-in" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={16} />
                    <Bar dataKey="payout" name="Pay-out" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={16} />
                  </BarChart>
                ) : (
                  <AreaChart data={volumeChart}>
                    <defs>
                      <linearGradient id="payinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false} axisLine={false}
                      interval={Math.floor(volumeChart.length / 7)} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false} axisLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={42} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="payin" name="Pay-in" stroke="#10b981" strokeWidth={2} fill="url(#payinGrad)" dot={false} />
                    <Area type="monotone" dataKey="payout" name="Pay-out" stroke="#3b82f6" strokeWidth={2} fill="url(#payoutGrad)" dot={false} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {!loading && volumeChart.length > 0 && (
            <div className="px-5 pb-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
              {[
                {
                  label: "Volume Pay-in (30j)",
                  value: fmt(volumeChart.reduce((s: number, d: any) => s + d.payin, 0)),
                  color: "text-emerald-600",
                },
                {
                  label: "Volume Pay-out (30j)",
                  value: fmt(volumeChart.reduce((s: number, d: any) => s + d.payout, 0)),
                  color: "text-blue-600",
                },
                {
                  label: "Jours actifs",
                  value: `${volumeChart.filter((d: any) => d.payin > 0 || d.payout > 0).length} / 30`,
                  color: "text-foreground",
                },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-sm">Transactions récentes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{data?.recentTransactions?.length ?? 0} dernières opérations</p>
              </div>
              <Link href="/dashboard/payments">
                <span className="text-xs text-primary font-medium hover:underline cursor-pointer flex items-center gap-1">
                  Voir tout <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-11 bg-muted rounded-xl animate-pulse" />)}
                </div>
              ) : !data?.recentTransactions?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Aucune transaction</p>
                  <p className="text-xs text-muted-foreground mt-1">Vos transactions apparaîtront ici</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Référence</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Pays</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Montant</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((tx: any, idx: number) => {
                      const s = statusConfig[tx.status] ?? statusConfig.pending;
                      const country = COUNTRY_MAP[tx.countryCode];
                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.42 + idx * 0.03 }}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${tx.type === "payin" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                              {tx.type === "payin" ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {tx.type === "payin" ? "Pay-in" : "Pay-out"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs hidden md:table-cell">
                            {country ? `${country.flag} ${country.name}` : tx.countryCode}
                          </td>
                          <td className={`px-5 py-3 text-right font-bold text-sm ${tx.type === "payin" ? "text-emerald-600" : "text-foreground"}`}>
                            {tx.type === "payin" ? "+" : "−"}{fmtFull(tx.amount, tx.currency)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-sm">Wallets par pays</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{data?.wallets?.length ?? 0} wallet(s) actif(s)</p>
              </div>
              <Link href="/dashboard/wallets">
                <span className="text-xs text-primary font-medium hover:underline cursor-pointer flex items-center gap-1">
                  Gérer <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="p-4 space-y-2.5">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)
              ) : !data?.wallets?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Aucun wallet actif</p>
                </div>
              ) : (
                data.wallets.map((w: any, idx: number) => {
                  const c = COUNTRY_MAP[w.countryCode];
                  const bal = parseFloat(w.balance ?? "0");
                  return (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.48 + idx * 0.05 }}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-xl shrink-0 shadow-sm">
                        {c?.flag ?? "🌍"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c?.name ?? w.countryCode}</p>
                        <p className="text-xs text-muted-foreground">{w.currency}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${bal > 0 ? "text-emerald-600" : "text-foreground"}`}>
                          {fmtFull(bal, w.currency)}
                        </p>
                        {bal > 0 && (
                          <p className="text-xs text-emerald-500 font-medium">Disponible</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
