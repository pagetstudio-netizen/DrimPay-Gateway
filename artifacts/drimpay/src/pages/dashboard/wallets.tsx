import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { DashboardLayout } from "./layout";
import { cn } from "@/lib/utils";
import { ProductionGate } from "@/components/ui/production-gate";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRY_MAP: Record<string, { name: string; flag: string; currency: string }> = {
  TG: { name: "Togo",          flag: "🇹🇬", currency: "XOF" },
  BJ: { name: "Bénin",         flag: "🇧🇯", currency: "XOF" },
  CM: { name: "Cameroun",      flag: "🇨🇲", currency: "XAF" },
  BF: { name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF" },
  ML: { name: "Mali",          flag: "🇲🇱", currency: "XOF" },
  SN: { name: "Sénégal",       flag: "🇸🇳", currency: "XOF" },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  GH: { name: "Ghana",         flag: "🇬🇭", currency: "GHS" },
  NG: { name: "Nigeria",       flag: "🇳🇬", currency: "NGN" },
};

function fmt(n: string | number, currency: string) {
  const v = parseFloat(String(n));
  if (isNaN(v)) return `0 ${currency}`;
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── Country section (expandable) ──────────────────────────────────────────────
function CountrySection({ wallets }: { wallets: any[] }) {
  const [open, setOpen] = useState(false);

  const first = wallets[0];
  const countryInfo = COUNTRY_MAP[first.countryCode] ?? {
    name: first.countryCode,
    flag: "🌍",
    currency: first.currency ?? "XOF",
  };
  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance ?? "0"), 0);
  const currency = first.currency ?? countryInfo.currency;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0">
          {countryInfo.flag}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-gray-900">{countryInfo.name}</p>
          <p className="text-xs text-gray-500">{wallets.length} wallet(s) · {currency}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-emerald-600">{fmt(totalBalance, currency)}</p>
          <p className="text-xs text-gray-400">Solde total</p>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {wallets.map((w) => {
                const s = w.stats ?? {};
                const balance  = parseFloat(w.balance ?? "0");
                const payin    = parseFloat(s.payinVolume  ?? "0");
                const payout   = parseFloat(s.payoutVolume ?? "0");

                return (
                  <div key={w.id} className="px-5 py-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          w.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {w.active ? "Actif" : "Inactif"}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">#{w.id}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {w.mode === "live" ? "Live" : "Sandbox"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Solde</p>
                        <p className="text-sm font-bold text-gray-900">{fmtNum(balance)}</p>
                        <p className="text-[10px] text-gray-400">{currency}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Cash-in</p>
                        <p className="text-sm font-bold text-emerald-600">+{fmtNum(payin)}</p>
                        <p className="text-[10px] text-gray-400">{s.payinCount ?? 0} txns</p>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Cash-out</p>
                        <p className="text-sm font-bold text-orange-500">-{fmtNum(payout)}</p>
                        <p className="text-[10px] text-gray-400">{s.payoutCount ?? 0} txns</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />)}
      </div>
      {[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100" />)}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Wallets() {
  const [wallets, setWallets]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/wallets`, { credentials: "include" });
      const d = await r.json();
      setWallets(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Group by country
  const byCountry = wallets.reduce<Record<string, any[]>>((acc, w) => {
    const key = w.countryCode;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  const countryGroups = Object.values(byCountry);
  const totalWallets  = wallets.length;
  const totalCountries = countryGroups.length;
  const totalActive   = wallets.filter(w => w.active).length;

  const stats = [
    { label: "Wallets totaux",  value: totalWallets,   color: "bg-blue-500" },
    { label: "Pays couverts",   value: totalCountries, color: "bg-emerald-500" },
    { label: "Actifs",          value: totalActive,    color: "bg-purple-500" },
  ];

  return (
    <DashboardLayout>
      <ProductionGate>
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wallets par pays</h1>
              <p className="text-sm text-gray-500">
                {totalWallets} wallet{totalWallets !== 1 ? "s" : ""} actif{totalWallets !== 1 ? "s" : ""} · {totalCountries} pays
              </p>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Actualiser
            </button>
          </div>

          {loading ? (
            <Skeleton />
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                {stats.map(({ label, value, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", color)}>
                      <Wallet2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Country list */}
              {countryGroups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                  <Wallet2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Aucun wallet trouvé.</p>
                  <p className="text-gray-300 text-xs mt-1">
                    Vos wallets sont créés automatiquement lors de votre premier pay-in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {countryGroups.map((group, i) => (
                    <motion.div
                      key={group[0].countryCode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18 + i * 0.05 }}
                    >
                      <CountrySection wallets={group} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ProductionGate>
    </DashboardLayout>
  );
}
