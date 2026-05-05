import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Info } from "lucide-react";
import { DashboardLayout } from "./layout";
import { Link } from "wouter";

const COUNTRY_MAP: Record<string, { name: string; flag: string; currency: string; operators: string[] }> = {
  TG: { name: "Togo", flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Togo", "Flooz"] },
  BJ: { name: "Bénin", flag: "🇧🇯", currency: "XOF", operators: ["MTN Bénin", "Moov Bénin"] },
  CM: { name: "Cameroun", flag: "🇨🇲", currency: "XAF", operators: ["MTN CM", "Orange CM"] },
  BF: { name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", operators: ["Orange BF", "Moov BF"] },
  ML: { name: "Mali", flag: "🇲🇱", currency: "XOF", operators: ["Orange Mali", "Moov Mali"] },
  SN: { name: "Sénégal", flag: "🇸🇳", currency: "XOF", operators: ["Orange Sénégal", "Free Sénégal", "Wave"] },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN CI", "Orange CI", "Moov Africa"] },
};

function fmt(n: string | number, currency: string) {
  return `${parseFloat(String(n)).toLocaleString("fr-FR")} ${currency}`;
}

export default function Wallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/wallets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setWallets(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Wallets par pays</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chaque pays dispose de son propre wallet isolé.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 mb-8">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Système de wallets géolocalisés</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les fonds reçus dans un pays sont crédités uniquement sur le wallet de ce pays.
              Un pay-in au Togo crédite votre wallet Togo (XOF). Pour retirer, vous devez utiliser le wallet du pays correspondant.
              <strong className="text-foreground"> Vous ne pouvez pas transférer entre wallets de différents pays.</strong>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : !wallets.length ? (
          <div className="text-center py-20">
            <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucun wallet actif</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Vos wallets seront créés automatiquement lors de votre premier pay-in dans chaque pays.
            </p>
            <Link href="/dashboard/payin">
              <span className="text-sm text-primary hover:underline cursor-pointer">Effectuer un pay-in →</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((w: any, i: number) => {
              const c = COUNTRY_MAP[w.countryCode] ?? { name: w.countryCode, flag: "🌍", currency: w.currency, operators: [] };
              const balance = parseFloat(String(w.balance));
              const locked = parseFloat(String(w.lockedBalance));
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.flag}</span>
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.currency}</p>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${w.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                      {w.active ? "Actif" : "Inactif"}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
                    <p className="text-2xl font-bold">{fmt(balance, c.currency)}</p>
                    {locked > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {fmt(locked, c.currency)} en attente
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Opérateurs supportés</p>
                    <div className="flex flex-wrap gap-1">
                      {c.operators.map((op) => (
                        <span key={op} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{op}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/dashboard/payin?country=${w.countryCode}`}>
                      <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors cursor-pointer text-xs font-medium">
                        <ArrowDownLeft className="w-3 h-3" />
                        Pay-in
                      </div>
                    </Link>
                    <Link href={`/dashboard/payout?country=${w.countryCode}`}>
                      <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors cursor-pointer text-xs font-medium">
                        <ArrowUpRight className="w-3 h-3" />
                        Pay-out
                      </div>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <h2 className="font-semibold mb-4">Pays disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(COUNTRY_MAP).map(([code, c]) => {
              const hasWallet = wallets.some((w) => w.countryCode === code);
              return (
                <div key={code} className={`flex items-center gap-3 p-3 rounded-lg border ${hasWallet ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                  <span className="text-2xl">{c.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.currency} · {c.operators.join(", ")}</p>
                  </div>
                  {hasWallet && <TrendingUp className="w-4 h-4 text-primary" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
