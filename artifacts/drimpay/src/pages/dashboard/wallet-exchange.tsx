import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, RefreshCw, CheckCircle2, Clock, XCircle,
  ChevronDown, AlertTriangle, ArrowRight, Info,
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { cn } from "@/lib/utils";
import { ProductionGate } from "@/components/ui/production-gate";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

const ALL_COUNTRIES = Object.entries(COUNTRY_MAP).map(([code, info]) => ({ code, ...info }));

const FEE_RATE = 0.03;

function fmt(n: string | number, currency?: string) {
  const v = parseFloat(String(n));
  if (isNaN(v)) return `0${currency ? " " + currency : ""}`;
  return `${v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${currency ? " " + currency : ""}`;
}

function fmtDate(d: string) {
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

function CountrySelect({
  label, value, onChange, options, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { code: string; name: string; flag: string; currency: string; balance?: number; disabled?: boolean }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.code === value);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 transition-colors text-left"
      >
        {selected ? (
          <>
            <span className="text-xl">{selected.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{selected.name}</p>
              {selected.balance !== undefined && (
                <p className="text-xs text-gray-400">{fmt(selected.balance, selected.currency)}</p>
              )}
            </div>
          </>
        ) : (
          <span className="text-gray-400 text-sm flex-1">{placeholder}</span>
        )}
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            {options.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400 italic">Aucun pays disponible</p>
            )}
            {options.map(opt => (
              <button
                key={opt.code}
                type="button"
                disabled={opt.disabled}
                onClick={() => { onChange(opt.code); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left",
                  opt.code === value && "bg-emerald-50",
                  opt.disabled && "opacity-40 cursor-not-allowed",
                )}
              >
                <span className="text-xl">{opt.flag}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{opt.name}</p>
                  <p className="text-xs text-gray-400">{opt.currency}{opt.balance !== undefined ? ` · ${fmt(opt.balance, opt.currency)}` : ""}</p>
                </div>
                {opt.code === value && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WalletExchange() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [fromCountry, setFromCountry] = useState("");
  const [toCountry, setToCountry] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadWallets() {
    setLoadingWallets(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/wallets`, { credentials: "include" });
      const d = await r.json();
      setWallets(Array.isArray(d) ? d : []);
    } finally { setLoadingWallets(false); }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/wallet-exchanges`, { credentials: "include" });
      const d = await r.json();
      setHistory(Array.isArray(d) ? d : []);
    } finally { setLoadingHistory(false); }
  }

  useEffect(() => {
    loadWallets();
    loadHistory();
  }, []);

  // Build source options: wallets the user HAS with available balance
  const walletByCountry: Record<string, any> = {};
  for (const w of wallets) {
    const avail = parseFloat(w.balance ?? "0") - parseFloat(w.lockedBalance ?? "0");
    if (!walletByCountry[w.countryCode] || avail > walletByCountry[w.countryCode]._avail) {
      walletByCountry[w.countryCode] = { ...w, _avail: avail };
    }
  }

  const fromOptions = Object.entries(walletByCountry)
    .filter(([code]) => COUNTRY_MAP[code])
    .map(([code, w]) => ({
      code,
      name: COUNTRY_MAP[code].name,
      flag: COUNTRY_MAP[code].flag,
      currency: COUNTRY_MAP[code].currency,
      balance: w._avail,
    }));

  const fromCurrency = fromCountry ? COUNTRY_MAP[fromCountry]?.currency : null;
  const fromWallet = fromCountry ? walletByCountry[fromCountry] : null;
  const availableBalance = fromWallet ? fromWallet._avail : 0;

  // Destination: same currency zone, different country, all supported countries
  const toOptions = ALL_COUNTRIES
    .filter(c => c.code !== fromCountry && (!fromCurrency || c.currency === fromCurrency))
    .map(c => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      currency: c.currency,
      balance: walletByCountry[c.code]?._avail,
      disabled: false,
    }));

  const amountNum = parseFloat(amount) || 0;
  const fee = +(amountNum * FEE_RATE).toFixed(2);
  const net = +(amountNum - fee).toFixed(2);
  const currency = fromCurrency ?? "XOF";
  const hasWalletDest = !!walletByCountry[toCountry];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!fromCountry || !toCountry) { setError("Sélectionnez les deux pays."); return; }
    if (amountNum <= 0) { setError("Montant invalide."); return; }
    if (amountNum > availableBalance) { setError("Solde disponible insuffisant."); return; }

    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/wallet-exchanges`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromCountryCode: fromCountry, toCountryCode: toCountry, amount: amountNum, note: note || undefined }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Erreur lors de la soumission."); return; }
      setSuccess(`Demande soumise avec succès ! Référence : ${d.reference ?? d.id}. Elle est en attente de validation.`);
      setFromCountry("");
      setToCountry("");
      setAmount("");
      setNote("");
      loadWallets();
      loadHistory();
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <ProductionGate>
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-emerald-600" />
              Échange de Wallets
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Transférez des fonds entre vos wallets de même zone monétaire.
            </p>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-0.5">Comment ça fonctionne ?</p>
              <ul className="space-y-0.5 text-blue-600 text-xs">
                <li>• Les échanges sont possibles uniquement entre pays de <b>même devise</b> (ex : XOF → XOF)</li>
                <li>• Des frais de <b>3%</b> sont appliqués sur le montant échangé</li>
                <li>• Chaque demande est validée par un administrateur (délai variable)</li>
                <li>• Si vous n'avez pas de wallet dans le pays destination, il sera <b>créé automatiquement</b></li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <p className="font-bold text-gray-900 text-base">Nouvelle demande d'échange</p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Country selectors */}
            {loadingWallets ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-16 rounded-xl bg-gray-100" />
                <div className="h-16 rounded-xl bg-gray-100" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <CountrySelect
                  label="Wallet source (pays expéditeur)"
                  value={fromCountry}
                  onChange={v => { setFromCountry(v); setToCountry(""); }}
                  options={fromOptions}
                  placeholder="Sélectionnez le pays source..."
                />

                {fromCountry && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="h-px w-12 bg-gray-200" />
                      <ArrowRight className="w-4 h-4 text-emerald-500" />
                      <div className="h-px w-12 bg-gray-200" />
                    </div>
                  </div>
                )}

                {fromCountry && (
                  <CountrySelect
                    label="Wallet destination (pays récepteur)"
                    value={toCountry}
                    onChange={setToCountry}
                    options={toOptions}
                    placeholder="Sélectionnez le pays destination..."
                  />
                )}
              </div>
            )}

            {/* No compatible countries warning */}
            {fromCountry && toOptions.length === 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Aucun pays de la même zone monétaire ({currency}) n'est disponible pour l'échange.
              </div>
            )}

            {/* Wallet auto-creation notice */}
            {toCountry && !hasWalletDest && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                Vous n'avez pas encore de wallet {COUNTRY_MAP[toCountry]?.name}. Il sera <b>créé automatiquement</b> à la validation de cet échange.
              </div>
            )}

            {/* Amount */}
            {fromCountry && toCountry && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Montant à échanger
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pr-16 pl-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">{currency}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Disponible : <span className="font-semibold text-gray-700">{fmt(availableBalance, currency)}</span>
                </p>
              </div>
            )}

            {/* Fee summary */}
            {fromCountry && toCountry && amountNum > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-xl p-4 space-y-2"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Récapitulatif</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Montant</span>
                  <span className="font-semibold text-gray-900">{fmt(amountNum, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Frais (3%)</span>
                  <span className="font-semibold text-orange-500">−{fmt(fee, currency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                  <span className="font-semibold text-gray-700">Net crédité</span>
                  <span className="font-bold text-emerald-600">{fmt(net, currency)}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="text-[10px] text-gray-400">
                    {COUNTRY_MAP[fromCountry]?.flag} {COUNTRY_MAP[fromCountry]?.name}
                    {" → "}
                    {COUNTRY_MAP[toCountry]?.flag} {COUNTRY_MAP[toCountry]?.name}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Note */}
            {fromCountry && toCountry && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Note (optionnel)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Motif de l'échange..."
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                />
              </div>
            )}

            {fromCountry && toCountry && (
              <button
                type="submit"
                disabled={submitting || !amountNum || amountNum > availableBalance}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><ArrowLeftRight className="w-4 h-4" /> Soumettre la demande d'échange</>
                )}
              </button>
            )}
          </form>

          {/* History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Historique des échanges
              </h2>
              <button
                onClick={loadHistory}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-gray-400", loadingHistory && "animate-spin")} />
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-6 space-y-3 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl" />)}
              </div>
            ) : history.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ArrowLeftRight className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun échange effectué</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map(ex => {
                  const fromInfo = COUNTRY_MAP[ex.fromCountryCode];
                  const toInfo   = COUNTRY_MAP[ex.toCountryCode];
                  return (
                    <div key={ex.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-lg">{fromInfo?.flag ?? "🌍"}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                            <span className="text-lg">{toInfo?.flag ?? "🌍"}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {fromInfo?.name ?? ex.fromCountryCode} → {toInfo?.name ?? ex.toCountryCode}
                            </p>
                            <p className="text-xs text-gray-400 font-mono truncate">{ex.reference}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900">{fmt(ex.amount, ex.currency)}</p>
                          <p className="text-xs text-gray-400">Net : {fmt(ex.netAmount, ex.currency)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <StatusBadge status={ex.status} />
                        <span className="text-xs text-gray-400">{fmtDate(ex.createdAt)}</span>
                      </div>
                      {ex.status === "rejected" && ex.rejectionReason && (
                        <p className="mt-1.5 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                          Motif : {ex.rejectionReason}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ProductionGate>
    </DashboardLayout>
  );
}
