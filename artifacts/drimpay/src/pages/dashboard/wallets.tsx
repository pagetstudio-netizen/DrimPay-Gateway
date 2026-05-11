import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Info,
  X, CheckCircle2, Loader2, Phone, Banknote,
  ArrowLeftRight, Clock
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Link, useLocation } from "wouter";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductionGate } from "@/components/ui/production-gate";
import { Input } from "@/components/ui/input";
import { CountryPicker } from "@/components/ui/country-picker";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRY_MAP: Record<string, { name: string; flag: string; currency: string; operators: string[] }> = {
  TG: { name: "Togo",          flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Money"] },
  BJ: { name: "Bénin",         flag: "🇧🇯", currency: "XOF", operators: ["MTN Mobile Money", "Moov Money"] },
  CM: { name: "Cameroun",      flag: "🇨🇲", currency: "XAF", operators: ["MTN MoMo", "Orange Money"] },
  BF: { name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  ML: { name: "Mali",          flag: "🇲🇱", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  SN: { name: "Sénégal",       flag: "🇸🇳", currency: "XOF", operators: ["Orange Money", "Wave"] },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN", "Orange Money", "Wave", "Moov Money"] },
};

function fmt(n: string | number, currency: string) {
  return `${parseFloat(String(n)).toLocaleString("fr-FR")} ${currency}`;
}

const OPERATOR_FLAGS: Record<string, string> = {
  "TMoney":           "🔴",
  "Moov Money":       "🟢",
  "MTN Mobile Money": "🟡",
  "MTN MoMo":         "🟡",
  "MTN":              "🟡",
  "Orange Money":     "🟠",
  "Wave":             "🔵",
};

const COUNTRIES_LIST = Object.entries(COUNTRY_MAP).map(([code, v]) => ({
  code,
  name: v.name,
  flag: v.flag,
  subtitle: v.currency,
}));

// ── Pay-in modal ──────────────────────────────────────────────────────────────
interface PayinModalProps {
  wallet: any;
  onClose: () => void;
  onSuccess: (walletId: number, newBalance: number) => void;
}

function PayinModal({ wallet, onClose, onSuccess }: PayinModalProps) {
  const [countryCode, setCountryCode] = useState<string>(wallet.countryCode);
  const c = COUNTRY_MAP[countryCode] ?? { name: countryCode, flag: "🌍", currency: "XOF", operators: [] };

  const [operator, setOperator] = useState(c.operators[0] ?? "");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successNet, setSuccessNet] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const feeRate = 0.03;
  const amountNum = parseFloat(amount) || 0;
  const fee = +(amountNum * feeRate).toFixed(2);
  const net = +(amountNum - fee).toFixed(2);

  // Reset operator when country changes
  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const ops = COUNTRY_MAP[code]?.operators ?? [];
    setOperator(ops[0] ?? "");
    setErrorMsg("");
  };

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || amountNum <= 0 || !operator) {
      setErrorMsg("Veuillez remplir tous les champs."); return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/payin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          currency: c.currency,
          countryCode,
          operator,
          phone: phone.trim(),
          description: "Réapprovisionnement wallet",
        }),
      });
      const data = await r.json();
      if (!r.ok) { setErrorMsg(data.error ?? "Erreur"); setStatus("error"); return; }
      setSuccessNet(+(data.netAmount ?? net));
      setStatus("success");
      onSuccess(data.walletId ?? wallet.id, data.newBalance ?? 0);
    } catch {
      setErrorMsg("Erreur réseau, veuillez réessayer.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Réapprovisionner un wallet</p>
              <p className="text-xs text-muted-foreground">Choisissez le pays et l'opérateur</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-lg">Pay-in réussi !</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fmt(successNet, c.currency)} crédités sur votre wallet {c.flag} {c.name}.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">

            {/* Country selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pays</label>
              <CountryPicker
                options={COUNTRIES_LIST}
                value={countryCode}
                onChange={handleCountryChange}
                placeholder="Sélectionner un pays"
                title="Pays du wallet"
                searchPlaceholder="Rechercher un pays..."
              />
            </div>

            {/* Operator */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Opérateur</label>
              <CountryPicker
                options={c.operators.map(op => ({
                  code: op,
                  name: op,
                  flag: OPERATOR_FLAGS[op] ?? "📡",
                }))}
                value={operator}
                onChange={setOperator}
                placeholder="Sélectionner un opérateur"
                title="Opérateur Mobile Money"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Numéro Mobile Money</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="ex : +228 90 00 00 00"
                  className="pl-9 bg-muted/30 border-border"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Montant</label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="ex : 10 000"
                  className="pl-9 pr-16 bg-muted/30 border-border"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
                  {c.currency}
                </span>
              </div>
            </div>

            {/* Fee summary */}
            {amountNum > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-1.5 text-xs"
              >
                <div className="flex justify-between text-muted-foreground">
                  <span>Montant brut</span>
                  <span className="font-medium text-foreground">{fmt(amountNum, c.currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frais DrimPay (3%)</span>
                  <span className="text-red-400">− {fmt(fee, c.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1.5 mt-1">
                  <span>Montant crédité</span>
                  <span className="text-green-500">{fmt(net, c.currency)}</span>
                </div>
              </motion.div>
            )}

            {errorMsg && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "loading" ? "Traitement…" : `Confirmer le pay-in — ${c.flag} ${c.name}`}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Wallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payinWallet, setPayinWallet] = useState<any | null>(null);
  const [showExchangeSoon, setShowExchangeSoon] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/wallets`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setWallets(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePayinSuccess = (walletId: number, newBalance: number) => {
    // Reload wallets from server to reflect new/updated wallet balance
    fetch(`${BASE}/api/dashboard/wallets`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setWallets(Array.isArray(d) ? d : []))
      .catch(() => {
        // fallback: update inline if known wallet
        setWallets(prev => prev.map(w => w.id === walletId ? { ...w, balance: String(newBalance) } : w));
      });
  };

  return (
    <DashboardLayout>
      <ProductionGate>
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
          <EmptyState
            title="Aucun wallet actif"
            description="Vos wallets seront créés automatiquement lors de votre premier pay-in dans chaque pays."
            action={
              <Link href="/dashboard/payments">
                <span className="text-sm text-primary hover:underline cursor-pointer font-medium">Effectuer un pay-in →</span>
              </Link>
            }
          />
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
                    {/* Exchange → bientôt disponible */}
                    <button
                      onClick={() => setShowExchangeSoon(true)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      Échange
                    </button>

                    {/* Pay-out → redirects to reversement with country pre-selected */}
                    <button
                      onClick={() => navigate(`/dashboard/reversement?country=${w.countryCode}`)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Pay-out
                    </button>
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
      </ProductionGate>

      {/* Pay-in modal */}
      <AnimatePresence>
        {payinWallet && (
          <PayinModal
            wallet={payinWallet}
            onClose={() => setPayinWallet(null)}
            onSuccess={(walletId, newBalance) => {
              handlePayinSuccess(walletId, newBalance);
            }}
          />
        )}
      </AnimatePresence>

      {/* Exchange — bientôt disponible */}
      <AnimatePresence>
        {showExchangeSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExchangeSoon(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="relative bg-card border border-border rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
              <button
                onClick={() => setShowExchangeSoon(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="px-8 py-10 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Échange de wallets</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    La fonctionnalité d'échange entre wallets de différents pays sera disponible prochainement.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/15 text-sm font-semibold text-primary">
                  <Clock className="w-4 h-4" />
                  Bientôt disponible
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
