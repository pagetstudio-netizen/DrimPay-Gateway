import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet2, RefreshCw, ChevronDown, ChevronRight, Plus, Minus, X } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

function fmt(n: number, cur = "XOF") {
  return `${parseFloat(String(n)).toLocaleString("fr-FR")} ${cur}`;
}

function CreditDebitModal({ wallet, type, onClose, onDone }: { wallet: any; type: "credit" | "debit"; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Montant invalide"); return; }
    setLoading(true); setError("");
    const r = await fetch(`/api/admin/wallets/${wallet.id}/${type}`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, note }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error ?? "Erreur"); setLoading(false); return; }
    onDone(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{type === "credit" ? "Créditer" : "Débiter"} wallet</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-5">
          <p className="text-xs text-gray-500">{wallet.merchant?.companyName ?? "—"} · {wallet.countryCode}</p>
          <p className="text-lg font-bold text-gray-900">{fmt(parseFloat(wallet.balance), wallet.currency)}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Montant ({wallet.currency})</label>
            <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: 10000" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Note (optionnel)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Raison de l'opération" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Annuler</button>
          <button onClick={submit} disabled={loading} className={cn("flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50", type === "credit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
            {loading ? "Traitement..." : type === "credit" ? "Créditer" : "Débiter"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CountrySection({ country, onRefresh }: { country: any; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [creditWallet, setCreditWallet] = useState<any>(null);
  const [debitWallet, setDebitWallet] = useState<any>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">{country.flag}</div>
        <div className="flex-1 text-left">
          <p className="font-bold text-gray-900">{country.name}</p>
          <p className="text-xs text-gray-500">{country.walletCount} wallet(s) · {country.currency}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">{fmt(country.totalBalance, country.currency)}</p>
          <p className="text-xs text-gray-400">Solde total</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-gray-100">
              {country.wallets.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Aucun wallet pour ce pays</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["ID", "Marchand", "Email", "Solde", "Solde bloqué", "Statut", "Créé le", "Actions"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {country.wallets.map((w: any) => (
                      <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">#{w.id}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 text-xs">{w.merchant?.companyName ?? `#${w.userId}`}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{w.merchant?.email ?? "—"}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600 text-xs">{fmt(parseFloat(w.balance), w.currency)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{fmt(parseFloat(w.lockedBalance), w.currency)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", w.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {w.active ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => setCreditWallet(w)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors">
                              <Plus className="w-3 h-3" /> Crédit
                            </button>
                            <button onClick={() => setDebitWallet(w)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                              <Minus className="w-3 h-3" /> Débit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {creditWallet && <CreditDebitModal wallet={creditWallet} type="credit" onClose={() => setCreditWallet(null)} onDone={onRefresh} />}
      {debitWallet && <CreditDebitModal wallet={debitWallet} type="debit" onClose={() => setDebitWallet(null)} onDone={onRefresh} />}
    </div>
  );
}

export default function AdminWallets() {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/wallets", { credentials: "include" });
    const d = await r.json();
    setCountries(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalBalance = countries.reduce((a, c) => a + c.totalBalance, 0);
  const totalWallets = countries.reduce((a, c) => a + c.walletCount, 0);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallets par pays</h1>
            <p className="text-sm text-gray-500">{totalWallets} wallets actifs · {countries.length} pays</p>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Wallets totaux", value: totalWallets, icon: Wallet2, color: "bg-blue-500" },
            { label: "Pays couverts", value: countries.filter(c => c.walletCount > 0).length, icon: Wallet2, color: "bg-emerald-500" },
            { label: "Actifs", value: countries.reduce((a, c) => a + c.wallets.filter((w: any) => w.active).length, 0), icon: Wallet2, color: "bg-purple-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
                <Wallet2 className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
        ) : (
          <div className="space-y-3">
            {countries.filter(c => c.walletCount > 0).map(country => (
              <CountrySection key={country.countryCode} country={country} onRefresh={load} />
            ))}
            {countries.every(c => c.walletCount === 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Wallet2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucun wallet trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
