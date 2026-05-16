import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, X, CheckCircle2, Loader2, Phone, Banknote,
  ArrowLeftRight, Clock, RefreshCw, TrendingUp, TrendingDown, Wallet,
  AlertCircle, ChevronRight, BarChart3, Activity,
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { useLocation } from "wouter";
import { ProductionGate } from "@/components/ui/production-gate";
import { Input } from "@/components/ui/input";
import { CountryPicker } from "@/components/ui/country-picker";
import { cn } from "@/lib/utils";
import { getOperatorLogo } from "@/lib/operator-logos";
import { useAuth } from "@/lib/auth";

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

const COUNTRIES_LIST = Object.entries(COUNTRY_MAP).map(([code, v]) => ({
  code, name: v.name, flag: v.flag, subtitle: v.currency,
}));

function fmt(n: string | number, currency: string) {
  const v = parseFloat(String(n));
  if (isNaN(v)) return `0 ${currency}`;
  return `${v.toLocaleString("fr-FR")} ${currency}`;
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

// ── Pay-in modal ───────────────────────────────────────────────────────────────
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
  const { user } = useAuth();
  const feeRate = (user as any)?.accountType === "personal" ? 0.05 : 0.03;
  const amountNum = parseFloat(amount) || 0;
  const fee = +(amountNum * feeRate).toFixed(2);
  const net = +(amountNum - fee).toFixed(2);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setOperator(COUNTRY_MAP[code]?.operators[0] ?? "");
    setErrorMsg("");
  };

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || amountNum < 200 || !operator) {
      setErrorMsg(amountNum < 200 ? "Le montant minimum est de 200." : "Veuillez remplir tous les champs.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/payin`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, currency: c.currency, countryCode, operator, phone: phone.trim(), description: "Réapprovisionnement wallet" }),
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C5FF4A]/15 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-[#C5FF4A]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Nouveau Pay-in</p>
              <p className="text-xs text-white/40">Min. 200 · Frais {(feeRate * 100).toFixed(0)}%</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === "success" ? (
          <div className="px-6 py-12 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#C5FF4A]/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#C5FF4A]" />
            </div>
            <div>
              <p className="font-bold text-lg text-white">Pay-in initié</p>
              <p className="text-sm text-white/50 mt-1">
                {fmt(successNet, c.currency)} en cours de crédit sur le wallet {c.flag} {c.name}.
              </p>
              <p className="text-xs text-white/30 mt-2">La confirmation arrive sous quelques secondes.</p>
            </div>
            <button onClick={onClose} className="mt-2 px-6 py-2.5 rounded-xl bg-[#C5FF4A] text-black text-sm font-bold hover:bg-[#b8f040] transition-colors">
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Pays</label>
              <CountryPicker options={COUNTRIES_LIST} value={countryCode} onChange={handleCountryChange} placeholder="Sélectionner un pays" title="Pays du wallet" searchPlaceholder="Rechercher un pays..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Opérateur</label>
              <CountryPicker
                options={c.operators.map(op => ({ code: op, name: op, flag: getOperatorLogo(op, 28) }))}
                value={operator} onChange={setOperator}
                placeholder="Sélectionner un opérateur" title="Opérateur Mobile Money"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Numéro Mobile Money</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input ref={inputRef} type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="ex : +228 90 00 00 00" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Montant</label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input type="number" min="200" step="1" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="ex : 10 000" className="pl-9 pr-16 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 font-bold">{c.currency}</span>
              </div>
            </div>
            {amountNum >= 200 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-2 text-xs">
                <div className="flex justify-between text-white/40">
                  <span>Montant brut</span>
                  <span className="text-white">{fmt(amountNum, c.currency)}</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Frais DrimPay ({(feeRate * 100).toFixed(0)}%)</span>
                  <span className="text-red-400">− {fmt(fee, c.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2 mt-1">
                  <span>Montant crédité</span>
                  <span className="text-[#C5FF4A]">{fmt(net, c.currency)}</span>
                </div>
              </motion.div>
            )}
            {errorMsg && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-px" />
                <p className="text-xs text-red-400">{errorMsg}</p>
              </div>
            )}
            <button type="submit" disabled={status === "loading"}
              className="w-full py-3.5 rounded-xl bg-[#C5FF4A] hover:bg-[#b8f040] text-black font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === "loading" ? "Traitement…" : `Confirmer le pay-in — ${c.flag} ${c.name}`}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ── Exchange coming soon modal ─────────────────────────────────────────────────
function ExchangeSoonModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C5FF4A]/50 to-transparent" />
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7 text-[#C5FF4A]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Échange inter-wallets</h3>
            <p className="text-sm text-white/40 leading-relaxed">
              La conversion entre wallets de différents pays sera disponible prochainement. Restez connecté.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 text-sm font-semibold text-[#C5FF4A]">
            <Clock className="w-4 h-4" />
            Bientôt disponible
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Wallet card ────────────────────────────────────────────────────────────────
function WalletCard({ wallet, index, onPayin, onPayout, onExchange }: {
  wallet: any; index: number;
  onPayin: () => void; onPayout: () => void; onExchange: () => void;
}) {
  const c = COUNTRY_MAP[wallet.countryCode] ?? { name: wallet.countryCode, flag: "🌍", currency: wallet.currency, operators: [] };
  const balance  = parseFloat(String(wallet.balance ?? 0));
  const locked   = parseFloat(String(wallet.lockedBalance ?? 0));
  const s        = wallet.stats ?? {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 280, damping: 24 }}
      className="relative rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden flex flex-col"
    >
      {/* Accent top bar */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C5FF4A]/40 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
            {c.flag}
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">{c.name}</p>
            <p className="text-xs text-white/40 mt-0.5">{c.currency} · Wallet isolé</p>
          </div>
        </div>
        <div className={cn(
          "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide",
          wallet.active ? "bg-[#C5FF4A]/10 text-[#C5FF4A]" : "bg-red-500/10 text-red-400"
        )}>
          {wallet.active ? "Actif" : "Inactif"}
        </div>
      </div>

      {/* Balance */}
      <div className="px-5 pb-4 border-b border-white/8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Solde disponible</p>
        <p className="text-3xl font-black text-[#C5FF4A] leading-none tracking-tight">
          {balance.toLocaleString("fr-FR")}
          <span className="text-lg ml-2 font-semibold text-[#C5FF4A]/60">{c.currency}</span>
        </p>
        {locked > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Clock className="w-3 h-3 text-amber-400" />
            <p className="text-xs text-amber-400">{fmt(locked, c.currency)} en attente</p>
          </div>
        )}
        {s.pendingCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Activity className="w-3 h-3 text-blue-400" />
            <p className="text-xs text-blue-400">{s.pendingCount} paiement{s.pendingCount > 1 ? "s" : ""} en cours</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-white/8 border-b border-white/8">
        <div className="bg-[#0f0f0f] px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Encaissé</span>
          </div>
          <p className="text-sm font-bold text-white">{fmtShort(s.payinVolume ?? 0)} <span className="text-white/30 font-normal text-xs">{c.currency}</span></p>
          <p className="text-[10px] text-white/25 mt-0.5">{s.payinCount ?? 0} transaction{(s.payinCount ?? 0) !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-[#0f0f0f] px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Décaissé</span>
          </div>
          <p className="text-sm font-bold text-white">{fmtShort(s.payoutVolume ?? 0)} <span className="text-white/30 font-normal text-xs">{c.currency}</span></p>
          <p className="text-[10px] text-white/25 mt-0.5">{s.payoutCount ?? 0} transaction{(s.payoutCount ?? 0) !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Operators */}
      <div className="px-5 py-3 border-b border-white/8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Opérateurs</p>
        <div className="flex flex-wrap gap-1.5">
          {c.operators.map(op => (
            <span key={op} className="text-[10px] px-2.5 py-1 rounded-full bg-white/6 border border-white/10 text-white/50 font-medium">
              {op}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 px-5 py-4 mt-auto">
        <button
          onClick={onPayin}
          className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#C5FF4A]/10 hover:bg-[#C5FF4A]/20 border border-[#C5FF4A]/20 transition-colors group"
        >
          <ArrowDownLeft className="w-4 h-4 text-[#C5FF4A]" />
          <span className="text-[10px] font-bold text-[#C5FF4A]">Pay-in</span>
        </button>
        <button
          onClick={onPayout}
          className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-bold text-blue-400">Pay-out</span>
        </button>
        <button
          onClick={onExchange}
          className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeftRight className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-bold text-white/40">Échange</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Summary bar ────────────────────────────────────────────────────────────────
function SummaryBar({ wallets }: { wallets: any[] }) {
  const totalBalance = wallets.reduce((a, w) => a + parseFloat(String(w.balance ?? 0)), 0);
  const totalPayin   = wallets.reduce((a, w) => a + (w.stats?.payinVolume  ?? 0), 0);
  const totalPayout  = wallets.reduce((a, w) => a + (w.stats?.payoutVolume ?? 0), 0);
  const totalPending = wallets.reduce((a, w) => a + (w.stats?.pendingCount ?? 0), 0);

  const items = [
    { label: "Wallets actifs", value: wallets.filter(w => w.active).length.toString(), sub: `sur ${wallets.length} total`, icon: Wallet, color: "text-[#C5FF4A]", bg: "bg-[#C5FF4A]/10" },
    { label: "Total encaissé", value: fmtShort(totalPayin), sub: "toutes devises", icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Total décaissé", value: fmtShort(totalPayout), sub: "toutes devises", icon: TrendingDown, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "En cours", value: totalPending.toString(), sub: "paiements en attente", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {items.map((item, i) => (
        <motion.div key={item.label}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", item.bg)}>
              <item.icon className={cn("w-3.5 h-3.5", item.color)} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{item.label}</span>
          </div>
          <p className={cn("text-xl font-black", item.color)}>{item.value}</p>
          <p className="text-[10px] text-white/25 mt-0.5">{item.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Countries without wallet ───────────────────────────────────────────────────
function InactiveCountries({ activeCodes }: { activeCodes: string[] }) {
  const inactive = Object.entries(COUNTRY_MAP).filter(([code]) => !activeCodes.includes(code));
  if (!inactive.length) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-white/30" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30">Pays disponibles sans wallet actif</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {inactive.map(([code, c]) => (
          <div key={code} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 transition-colors">
            <span className="text-xl">{c.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/60 truncate">{c.name}</p>
              <p className="text-[10px] text-white/25">{c.currency} · {c.operators.length} opérateur{c.operators.length > 1 ? "s" : ""}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />
          </div>
        ))}
      </div>
      <p className="text-xs text-white/25 mt-3">
        Un wallet est créé automatiquement lors de votre premier pay-in dans chaque pays.
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Wallets() {
  const [wallets, setWallets]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payinWallet, setPayinWallet]       = useState<any | null>(null);
  const [showExchange, setShowExchange]     = useState(false);
  const [, navigate] = useLocation();

  const loadWallets = async (showRefreshing = false) => {
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

  useEffect(() => { loadWallets(); }, []);

  const activeCodes = wallets.map(w => w.countryCode);

  return (
    <DashboardLayout>
      <ProductionGate>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Wallets</h1>
              <p className="text-sm text-white/40 mt-1">
                Fonds isolés par pays — chaque corridor gère sa propre devise.
              </p>
            </div>
            <button
              onClick={() => loadWallets(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="space-y-6">
              {/* Skeleton summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
              {/* Skeleton cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />)}
              </div>
            </div>
          ) : !wallets.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 flex items-center justify-center mb-6">
                <Wallet className="w-9 h-9 text-[#C5FF4A]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Aucun wallet actif</h2>
              <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-6">
                Vos wallets sont créés automatiquement lors de votre premier pay-in dans chaque pays. Aucune action manuelle n'est requise.
              </p>
              <button
                onClick={() => navigate("/dashboard/payments")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5FF4A] text-black text-sm font-bold hover:bg-[#b8f040] transition-colors"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Effectuer un premier pay-in
              </button>
              <InactiveCountries activeCodes={[]} />
            </div>
          ) : (
            <>
              <SummaryBar wallets={wallets} />

              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-white/30">
                  Wallets actifs ({wallets.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {wallets.map((w, i) => (
                  <WalletCard
                    key={w.id}
                    wallet={w}
                    index={i}
                    onPayin={() => setPayinWallet(w)}
                    onPayout={() => navigate(`/dashboard/reversement?country=${w.countryCode}`)}
                    onExchange={() => setShowExchange(true)}
                  />
                ))}
              </div>

              <InactiveCountries activeCodes={activeCodes} />
            </>
          )}
        </div>
      </ProductionGate>

      <AnimatePresence>
        {payinWallet && (
          <PayinModal
            wallet={payinWallet}
            onClose={() => setPayinWallet(null)}
            onSuccess={() => { setPayinWallet(null); loadWallets(true); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExchange && <ExchangeSoonModal onClose={() => setShowExchange(false)} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
