import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, XCircle, ChevronRight,
  RefreshCw
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Badge } from "@/components/ui/badge";
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
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  success: { label: "Succès", color: "text-green-500 bg-green-500/10", icon: CheckCircle2 },
  pending: { label: "En cours", color: "text-yellow-500 bg-yellow-500/10", icon: Clock },
  processing: { label: "Traitement", color: "text-blue-500 bg-blue-500/10", icon: RefreshCw },
  failed: { label: "Échoué", color: "text-red-500 bg-red-500/10", icon: XCircle },
};

function fmt(n: string | number, currency: string) {
  return `${parseFloat(String(n)).toLocaleString("fr-FR")} ${currency}`;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/overview", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPayin = data?.txStats
    ?.filter((s: any) => s.type === "payin" && s.status === "success")
    ?.reduce((acc: number, s: any) => acc + parseFloat(s.total ?? "0"), 0) ?? 0;

  const totalPayout = data?.txStats
    ?.filter((s: any) => s.type === "payout" && s.status === "success")
    ?.reduce((acc: number, s: any) => acc + parseFloat(s.total ?? "0"), 0) ?? 0;

  const totalFees = data?.txStats
    ?.reduce((acc: number, s: any) => acc + parseFloat(s.totalFees ?? "0"), 0) ?? 0;

  const totalTx = data?.txStats?.reduce((acc: number, s: any) => acc + parseInt(s.txCount ?? "0"), 0) ?? 0;

  const kybStatus = data?.kybStatus ?? "pending";

  const kybBanner = kybStatus !== "approved" && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-6"
    >
      <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
          {kybStatus === "submitted" || kybStatus === "under_review"
            ? "Vérification KYB en cours"
            : "Vérification KYB requise"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {kybStatus === "submitted" || kybStatus === "under_review"
            ? "Vos documents sont en cours de révision. Les paiements live seront activés après approbation."
            : "Soumettez vos documents d'entreprise pour activer les paiements live."}
        </p>
      </div>
      {kybStatus === "pending" && (
        <Link href="/dashboard/kyb">
          <Button size="sm" variant="outline" className="border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10 shrink-0">
            Soumettre <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      )}
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user?.companyName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre activité</p>
        </div>

        {kybBanner}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Reçu", value: fmt(totalPayin, "XOF"), icon: ArrowDownLeft, color: "text-green-500", bg: "bg-green-500/10", sub: "Pay-in cumulés" },
            { label: "Total Envoyé", value: fmt(totalPayout, "XOF"), icon: ArrowUpRight, color: "text-blue-500", bg: "bg-blue-500/10", sub: "Pay-out cumulés" },
            { label: "Frais Totaux", value: fmt(totalFees, "XOF"), icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-500/10", sub: "3% par transaction" },
            { label: "Transactions", value: totalTx.toLocaleString(), icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10", sub: "Toutes opérations" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-24 bg-muted rounded animate-pulse mb-1" />
              ) : (
                <p className="text-xl font-bold mb-1">{stat.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Transactions récentes</h2>
              <Link href="/dashboard/payin">
                <span className="text-xs text-primary hover:underline cursor-pointer">Voir tout →</span>
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                </div>
              ) : !data?.recentTransactions?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Wallet className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Aucune transaction</p>
                  <p className="text-xs text-muted-foreground mt-1">Vos transactions apparaîtront ici</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Référence</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Pays</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Montant</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((tx: any) => {
                      const s = statusConfig[tx.status] ?? statusConfig.pending;
                      const country = COUNTRY_MAP[tx.countryCode];
                      return (
                        <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{tx.reference}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.type === "payin" ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"}`}>
                              {tx.type === "payin" ? "Pay-in" : "Pay-out"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs hidden md:table-cell">
                            {country ? `${country.flag} ${country.name}` : tx.countryCode}
                          </td>
                          <td className={`px-5 py-3 text-right font-semibold text-sm ${tx.type === "payin" ? "text-green-600" : "text-foreground"}`}>
                            {tx.type === "payin" ? "+" : "-"}{fmt(tx.amount, tx.currency)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Wallets par pays</h2>
              <Link href="/dashboard/wallets">
                <span className="text-xs text-primary hover:underline cursor-pointer">Voir tout →</span>
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)
              ) : !data?.wallets?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Wallet className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Aucun wallet actif</p>
                </div>
              ) : (
                data.wallets.map((w: any) => {
                  const c = COUNTRY_MAP[w.countryCode];
                  return (
                    <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-2xl">{c?.flag ?? "🌍"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c?.name ?? w.countryCode}</p>
                        <p className="text-xs text-muted-foreground">{w.currency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{fmt(w.balance, w.currency)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
