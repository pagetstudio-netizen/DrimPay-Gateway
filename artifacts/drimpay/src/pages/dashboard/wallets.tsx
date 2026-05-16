import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, X, CheckCircle2, Loader2, Phone, Banknote,
  ArrowLeftRight, Clock, RefreshCw, Wallet,
  AlertCircle, Activity, PieChart, Network, ChevronDown,
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
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function pct(part: number, total: number): string {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
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

// ── Wallet selector tabs ───────────────────────────────────────────────────────
function WalletTabs({ wallets, selected, onSelect }: {
  wallets: any[];
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {wallets.map((w) => {
        const c = COUNTRY_MAP[w.countryCode] ?? { name: w.countryCode, flag: "🌍", currency: w.currency };
        const active = selected === w.id;
        return (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all shrink-0",
              active
                ? "bg-[#C5FF4A]/10 border-[#C5FF4A]/40 text-[#C5FF4A]"
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70"
            )}
          >
            <span className="text-base leading-none">{c.flag}</span>
            <span>{c.currency}</span>
            {active && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5FF4A] shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Balance / Cashin / Cashout cards ──────────────────────────────────────────
function StatCards({ wallet, onPayin, onPayout, onExchange }: {
  wallet: any;
  onPayin: () => void;
  onPayout: () => void;
  onExchange: () => void;
}) {
  const c = COUNTRY_MAP[wallet.countryCode] ?? { name: wallet.countryCode, flag: "🌍", currency: wallet.currency ?? "XOF", operators: [] };
  const s = wallet.stats ?? {};
  const balance  = parseFloat(String(wallet.balance ?? 0));
  const locked   = parseFloat(String(wallet.lockedBalance ?? 0));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Balance — lime left border */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
        className="sm:col-span-2 relative rounded-xl border border-white/10 bg-[#0f0f0f] overflow-hidden pl-1"
      >
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-[#C5FF4A]" />
        <div className="flex items-start justify-between px-5 py-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#C5FF4A]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Balance</span>
            </div>
            <p className="text-3xl font-black text-white leading-none">
              {fmtNum(balance)}
            </p>
            <p className="text-sm font-semibold text-white/40 mt-1">{c.currency}</p>
            {locked > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400">{fmt(locked, c.currency)} en attente</span>
              </div>
            )}
            {s.pendingCount > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Activity className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400">{s.pendingCount} paiement{s.pendingCount > 1 ? "s" : ""} en cours</span>
              </div>
            )}
          </div>
          <div className={cn(
            "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide shrink-0",
            wallet.active ? "bg-[#C5FF4A]/10 text-[#C5FF4A]" : "bg-red-500/10 text-red-400"
          )}>
            {wallet.active ? "Actif" : "Inactif"}
          </div>
        </div>
      </motion.div>

      {/* Cashin — green left border */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative rounded-xl border border-white/10 bg-[#0f0f0f] overflow-hidden pl-1"
      >
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-green-500" />
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Cashin</span>
          </div>
          <p className="text-2xl font-black text-green-400 leading-none">
            +{fmtNum(s.payinVolume ?? 0)}
          </p>
          <p className="text-xs text-white/30 mt-1.5">
            {s.payinCount ?? 0} txns
            {(s.payinFees ?? 0) > 0 && <> · {fmtNum(s.payinFees)} frais</>}
          </p>
        </div>
      </motion.div>

      {/* Cashout — orange left border */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative rounded-xl border border-white/10 bg-[#0f0f0f] overflow-hidden pl-1"
      >
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-orange-500" />
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">Cashout</span>
          </div>
          <p className="text-2xl font-black text-orange-400 leading-none">
            -{fmtNum(s.payoutVolume ?? 0)}
          </p>
          <p className="text-xs text-white/30 mt-1.5">
            {s.payoutCount ?? 0} txns
            {(s.payoutFees ?? 0) > 0 && <> · {fmtNum(s.payoutFees)} frais</>}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Status breakdown ───────────────────────────────────────────────────────────
function StatusBreakdown({ wallet }: { wallet: any }) {
  const sb = wallet.stats?.statusBreakdown ?? { success: 0, pending: 0, failed: 0, cancelled: 0, total: 0 };
  const total = sb.total || 1;

  const rows = [
    { label: "Réussi",    key: "success",   color: "bg-green-500",  textColor: "text-green-400",  dot: "bg-green-500" },
    { label: "En attente",key: "pending",   color: "bg-yellow-400", textColor: "text-yellow-400", dot: "bg-yellow-400" },
    { label: "Échoué",    key: "failed",    color: "bg-red-500",    textColor: "text-red-400",    dot: "bg-red-500" },
    { label: "Annulé",    key: "cancelled", color: "bg-white/20",   textColor: "text-white/30",   dot: "bg-white/30" },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-xl border border-white/10 bg-[#0f0f0f] px-5 py-4"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
          <PieChart className="w-3.5 h-3.5 text-white/40" />
        </div>
        <span className="text-sm font-bold text-white/70">Statut</span>
      </div>

      <div className="space-y-3.5">
        {rows.map((row) => {
          const val = sb[row.key] as number ?? 0;
          const ratio = val / total;
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", row.dot)} />
                  <span className="text-sm text-white/60">{row.label}</span>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", row.textColor)}>
                  {val} <span className="text-white/25 font-normal text-xs">({pct(val, total)})</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ratio * 100}%` }}
                  transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                  className={cn("h-full rounded-full", row.color)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
        <span className="text-xs text-white/30 font-medium">Total</span>
        <span className="text-sm font-bold text-white/60 bg-white/8 px-3 py-1 rounded-lg tabular-nums">
          {sb.total ?? 0}
        </span>
      </div>
    </motion.div>
  );
}

// ── By Network ─────────────────────────────────────────────────────────────────
function ByNetwork({ wallet }: { wallet: any }) {
  const ops: { name: string; payinCount: number; payoutCount: number; volume: number }[] =
    wallet.stats?.operatorBreakdown ?? [];
  const c = COUNTRY_MAP[wallet.countryCode] ?? { currency: wallet.currency ?? "XOF" };
  const allOps = COUNTRY_MAP[wallet.countryCode]?.operators ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="rounded-xl border border-white/10 bg-[#0f0f0f] px-5 py-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
          <Network className="w-3.5 h-3.5 text-white/40" />
        </div>
        <span className="text-sm font-bold text-white/70">Par réseau</span>
      </div>

      {ops.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-white/25">Aucune transaction enregistrée</p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {allOps.map(op => (
              <span key={op} className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/30">
                {op}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {ops.map((op, i) => {
            const totalVol = ops.reduce((a, o) => a + o.volume, 0) || 1;
            const ratio = op.volume / totalVol;
            return (
              <div key={op.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/70 font-medium truncate">{op.name}</span>
                    <span className="text-xs text-white/30 tabular-nums shrink-0 ml-2">
                      {fmt(op.volume, c.currency)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{ delay: 0.25 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-[#C5FF4A]/60"
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-white/25 leading-none">
                    {op.payinCount}↓ {op.payoutCount}↑
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Action buttons ─────────────────────────────────────────────────────────────
function WalletActions({ onPayin, onPayout, onExchange }: {
  onPayin: () => void; onPayout: () => void; onExchange: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="grid grid-cols-3 gap-3"
    >
      <button
        onClick={onPayin}
        className="flex flex-col items-center gap-2 py-4 rounded-xl bg-[#C5FF4A]/10 hover:bg-[#C5FF4A]/18 border border-[#C5FF4A]/25 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-[#C5FF4A]/15 flex items-center justify-center">
          <ArrowDownLeft className="w-5 h-5 text-[#C5FF4A]" />
        </div>
        <span className="text-xs font-bold text-[#C5FF4A]">Pay-in</span>
      </button>

      <button
        onClick={onPayout}
        className="flex flex-col items-center gap-2 py-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/18 border border-blue-500/25 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <ArrowUpRight className="w-5 h-5 text-blue-400" />
        </div>
        <span className="text-xs font-bold text-blue-400">Pay-out</span>
      </button>

      <button
        onClick={onExchange}
        className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
          <ArrowLeftRight className="w-5 h-5 text-white/30" />
        </div>
        <span className="text-xs font-bold text-white/30">Échange</span>
      </button>
    </motion.div>
  );
}

// ── Wallet detail view ─────────────────────────────────────────────────────────
function WalletDetail({ wallet, onPayin, onPayout, onExchange }: {
  wallet: any;
  onPayin: () => void;
  onPayout: () => void;
  onExchange: () => void;
}) {
  const c = COUNTRY_MAP[wallet.countryCode] ?? { name: wallet.countryCode, flag: "🌍", currency: wallet.currency };
  return (
    <div className="space-y-3">
      {/* Country header */}
      <div className="flex items-center gap-3 px-1 mb-1">
        <span className="text-2xl leading-none">{c.flag}</span>
        <div>
          <p className="text-base font-bold text-white">{c.name}</p>
          <p className="text-xs text-white/40">{c.currency} · Wallet isolé</p>
        </div>
      </div>

      <StatCards wallet={wallet} onPayin={onPayin} onPayout={onPayout} onExchange={onExchange} />
      <WalletActions onPayin={onPayin} onPayout={onPayout} onExchange={onExchange} />
      <StatusBreakdown wallet={wallet} />
      <ByNetwork wallet={wallet} />
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-2">
        {[1,2,3].map(i => <div key={i} className="h-10 w-24 rounded-xl bg-white/5" />)}
      </div>
      <div className="h-28 rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl bg-white/5" />
        <div className="h-24 rounded-xl bg-white/5" />
      </div>
      <div className="h-14 rounded-xl bg-white/5" />
      <div className="h-40 rounded-xl bg-white/5" />
      <div className="h-32 rounded-xl bg-white/5" />
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 flex items-center justify-center mb-6">
        <Wallet className="w-9 h-9 text-[#C5FF4A]" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Aucun wallet actif</h2>
      <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-6">
        Vos wallets sont créés automatiquement lors de votre premier pay-in dans chaque pays.
      </p>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5FF4A] text-black text-sm font-bold hover:bg-[#b8f040] transition-colors"
      >
        <ArrowDownLeft className="w-4 h-4" />
        Effectuer un premier pay-in
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Wallets() {
  const [wallets, setWallets]               = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedId, setSelectedId]         = useState<number | null>(null);
  const [payinWallet, setPayinWallet]       = useState<any | null>(null);
  const [showExchange, setShowExchange]     = useState(false);
  const [, navigate] = useLocation();

  const loadWallets = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/wallets`, { credentials: "include" });
      const d = await r.json();
      const list = Array.isArray(d) ? d : [];
      setWallets(list);
      if (list.length > 0) {
        setSelectedId(prev => (prev && list.find((w: any) => w.id === prev)) ? prev : list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadWallets(); }, []);

  const selectedWallet = wallets.find(w => w.id === selectedId) ?? null;

  return (
    <DashboardLayout>
      <ProductionGate>
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight">Wallets</h1>
            <button
              onClick={() => loadWallets(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              Actualiser
            </button>
          </div>

          {loading ? (
            <SkeletonLoader />
          ) : !wallets.length ? (
            <EmptyState onNavigate={() => navigate("/dashboard/payments")} />
          ) : (
            <div className="space-y-5">
              {/* Wallet tabs */}
              <WalletTabs wallets={wallets} selected={selectedId} onSelect={setSelectedId} />

              {/* Wallet detail */}
              {selectedWallet && (
                <WalletDetail
                  key={selectedWallet.id}
                  wallet={selectedWallet}
                  onPayin={() => setPayinWallet(selectedWallet)}
                  onPayout={() => navigate(`/dashboard/reversement?country=${selectedWallet.countryCode}`)}
                  onExchange={() => setShowExchange(true)}
                />
              )}
            </div>
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
