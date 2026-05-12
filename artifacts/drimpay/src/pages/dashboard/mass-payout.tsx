import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Upload, Plus, Trash2, Send, CheckCircle2,
  AlertTriangle, Download, FileText, ChevronDown, AlertCircle, Wallet, Lock
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const COUNTRIES = [
  { code: "TG", name: "Togo",          flag: "🇹🇬", currency: "XOF", dialCode: "+228", phoneDigits: 8,  operators: ["TMoney", "Moov Money"] },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", currency: "XOF", dialCode: "+229", phoneDigits: 8,  operators: ["MTN Mobile Money", "Moov Money"] },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", currency: "XAF", dialCode: "+237", phoneDigits: 9,  operators: ["MTN MoMo", "Orange Money"] },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF", dialCode: "+226", phoneDigits: 8,  operators: ["Orange Money", "Moov Money"] },
  { code: "ML", name: "Mali",          flag: "🇲🇱", currency: "XOF", dialCode: "+223", phoneDigits: 8,  operators: ["Orange Money", "Moov Money"] },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳", currency: "XOF", dialCode: "+221", phoneDigits: 9,  operators: ["Orange Money", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", dialCode: "+225", phoneDigits: 10, operators: ["MTN", "Orange Money", "Wave", "Moov Money"] },
];

type Recipient = {
  id: string;
  phone: string;
  amount: string;
  countryCode: string;
  operator: string;
  note?: string;
};

type Job = {
  id: number;
  reference: string;
  status: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalAmount: string;
  currency: string;
  description?: string;
  createdAt: string;
};

type WalletBalance = { countryCode: string; balance: number; currency: string };

function newRecipient(): Recipient {
  return { id: crypto.randomUUID(), phone: "", amount: "", countryCode: "SN", operator: "", note: "" };
}

function validatePhone(phone: string, countryCode: string): boolean {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return false;
  const digits = phone.replace(/[\s\-().+]/g, "");
  return digits.length >= country.phoneDigits && digits.length <= country.phoneDigits + 3;
}

function validateOperator(operator: string, countryCode: string): boolean {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return false;
  return country.operators.includes(operator);
}

function rowErrors(r: Recipient): string[] {
  const errs: string[] = [];
  const country = COUNTRIES.find(c => c.code === r.countryCode);
  if (!r.operator) errs.push("Opérateur manquant");
  else if (!validateOperator(r.operator, r.countryCode)) errs.push(`Opérateur invalide pour ${country?.name}`);
  if (!r.phone) errs.push("Numéro manquant");
  else if (!validatePhone(r.phone, r.countryCode)) {
    errs.push(`Numéro invalide (${country?.phoneDigits} chiffres attendus)`);
  }
  if (!r.amount || parseFloat(r.amount) <= 0) errs.push("Montant invalide");
  return errs;
}

const selectCls = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer";
const inputCls  = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

function NativeSelect({ value, onChange, children, hasError }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; hasError?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(selectCls, "pr-8", hasError && "border-red-300 bg-red-50/30")}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}

function RecipientRow({ r, index, onChange, onRemove, showErrors }: {
  r: Recipient; index: number;
  onChange: (id: string, field: keyof Recipient, value: string) => void;
  onRemove: (id: string) => void;
  showErrors: boolean;
}) {
  const country = COUNTRIES.find(c => c.code === r.countryCode) ?? COUNTRIES[0];
  const errs = showErrors ? rowErrors(r) : [];
  const phoneOk = !showErrors || validatePhone(r.phone, r.countryCode);
  const opOk    = !showErrors || validateOperator(r.operator, r.countryCode);
  const amtOk   = !showErrors || (!!r.amount && parseFloat(r.amount) > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "rounded-2xl border bg-gray-50/60 transition-colors p-3",
        errs.length > 0 ? "border-red-200 bg-red-50/20" : "border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="grid grid-cols-[28px_1fr_36px] sm:grid-cols-[28px_1fr_1fr_1fr_1fr_36px] gap-2 items-start">
        <div className="flex items-center justify-center h-10">
          <span className="text-xs text-gray-400 font-mono font-bold">{String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="col-span-1 sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <NativeSelect
            value={r.countryCode}
            onChange={v => { onChange(r.id, "countryCode", v); onChange(r.id, "operator", ""); }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </NativeSelect>

          <NativeSelect value={r.operator} onChange={v => onChange(r.id, "operator", v)} hasError={!opOk && !!r.countryCode}>
            <option value="">Opérateur...</option>
            {country.operators.map(op => <option key={op} value={op}>{op}</option>)}
          </NativeSelect>

          <div className="relative">
            <input
              type="tel"
              placeholder={`${country.dialCode} ...`}
              value={r.phone}
              onChange={e => onChange(r.id, "phone", e.target.value)}
              className={cn(inputCls, !phoneOk && r.phone && "border-red-300 bg-red-50/30")}
            />
          </div>

          <div className="relative">
            <input
              type="number"
              min="1"
              placeholder="Montant"
              value={r.amount}
              onChange={e => onChange(r.id, "amount", e.target.value)}
              className={cn(inputCls, "pr-12", !amtOk && r.amount && "border-red-300 bg-red-50/30")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
              {country.currency}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center h-10">
          <button
            onClick={() => onRemove(r.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {errs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
          {errs.map((e, i) => (
            <span key={i} className="text-[10px] text-red-500 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 font-medium">
              {e}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string; text: string }> = {
    pending:    { label: "En attente", dot: "bg-amber-400",  text: "text-amber-700" },
    processing: { label: "En cours",   dot: "bg-blue-400",   text: "text-blue-700"  },
    completed:  { label: "Terminé",    dot: "bg-green-500",  text: "text-green-700" },
    failed:     { label: "Échoué",     dot: "bg-red-500",    text: "text-red-700"   },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100", s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export default function MassPayout() {
  const [recipients, setRecipients] = useState<Recipient[]>([newRecipient()]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/mass-payout`, { credentials: "include" });
      const d = await r.json();
      setJobs(Array.isArray(d) ? d : []);
    } catch { setJobs([]); }
    finally { setLoadingJobs(false); }
  };

  const loadWallets = async () => {
    try {
      const r = await fetch(`${BASE}/api/dashboard/wallets`, { credentials: "include" });
      const d = await r.json();
      setWallets(Array.isArray(d) ? d : []);
    } catch {}
  };

  useEffect(() => { loadJobs(); loadWallets(); }, []);

  const addRow    = () => setRecipients(prev => [...prev, newRecipient()]);
  const removeRow = (id: string) => setRecipients(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  const updateRow = (id: string, field: keyof Recipient, value: string) =>
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim() && !l.startsWith("country"));
      const parsed: Recipient[] = [];
      for (const line of lines) {
        const parts = line.split(",").map(p => p.trim());
        if (parts.length >= 4) {
          const [countryCode, operator, phone, amount, note] = parts;
          parsed.push({ id: crypto.randomUUID(), countryCode, operator, phone, amount, note });
        }
      }
      if (parsed.length) {
        setRecipients(parsed);
        setShowErrors(false);
        toast({ title: `${parsed.length} destinataire${parsed.length > 1 ? "s" : ""} importé${parsed.length > 1 ? "s" : ""}` });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = "countryCode,operator,phone,amount,note\nSN,Wave,+221770000001,5000,Salaire\nCI,MTN,+2250500000001,10000,Prime";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-mass-payout.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const totalAmount = recipients.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const fees        = totalAmount * 0.03;
  const totalDebited = totalAmount + fees;

  const allRowsValid = recipients.every(r => rowErrors(r).length === 0);
  const filledCount  = recipients.filter(r => r.phone && r.amount && r.operator).length;

  const balanceByCountry = recipients.reduce<Record<string, number>>((acc, r) => {
    const amt = parseFloat(r.amount) || 0;
    const fee = amt * 0.03;
    acc[r.countryCode] = (acc[r.countryCode] ?? 0) + amt + fee;
    return acc;
  }, {});

  const balanceWarnings: string[] = [];
  for (const [code, needed] of Object.entries(balanceByCountry)) {
    const wallet = wallets.find(w => w.countryCode === code);
    const country = COUNTRIES.find(c => c.code === code);
    if (!wallet || wallet.balance < needed) {
      const available = wallet ? wallet.balance.toLocaleString("fr-FR") : "0";
      balanceWarnings.push(
        `Solde insuffisant pour ${country?.flag} ${country?.name} : ${available} ${country?.currency} disponible, ${Math.ceil(needed).toLocaleString("fr-FR")} ${country?.currency} requis`
      );
    }
  }

  const canSubmit = allRowsValid && balanceWarnings.length === 0;

  const submit = async () => {
    setShowErrors(true);
    if (!allRowsValid) {
      setError("Veuillez corriger les erreurs dans les destinataires.");
      return;
    }
    if (balanceWarnings.length > 0) {
      setError("Solde insuffisant pour certains wallets.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/mass-payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          description,
          recipients: recipients.map(({ phone, amount, countryCode, operator, note }) => ({
            phone, amount: parseFloat(amount), countryCode, operator, note,
          })),
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Erreur lors de l'envoi."); setSubmitting(false); return; }
      toast({ title: "Paiements envoyés avec succès" });
      setRecipients([newRecipient()]);
      setDescription("");
      setShowErrors(false);
      loadJobs();
      loadWallets();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  const { user } = useAuth();
  const isPersonal = (user as any)?.accountType === "personal";

  if (isPersonal) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto mt-12">
          <div className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl border border-red-500/20 bg-red-500/5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">Fonctionnalité réservée aux Entreprises</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Le Paiement de Masse est exclusivement disponible pour les <strong className="text-foreground">comptes Entreprise</strong>.
                Les comptes personnels peuvent retirer leurs fonds via la fonctionnalité <strong className="text-foreground">Reversement</strong> (frais : 5%).
              </p>
            </div>
            <a href="/dashboard/reversement" className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primary/90 transition-colors">
              Aller au Reversement
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#B5F03C" }}>
              <Users className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Paiement de Masse</h1>
              <p className="text-xs text-gray-500">Envoyez des fonds à plusieurs destinataires</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Modèle CSV
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Importer CSV
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 text-sm">Destinataires</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {recipients.length}
                  </span>
                </div>
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              <div className="hidden sm:grid gap-2 px-5 pt-3 pb-1"
                style={{ gridTemplateColumns: "28px 1fr 1fr 1fr 1fr 36px" }}>
                {["#", "Pays", "Opérateur", "Téléphone", "Montant", ""].map((h, i) => (
                  <div key={i} className={cn("text-[10px] font-bold uppercase tracking-widest text-gray-400", i === 1 && "col-span-1")}>{h}</div>
                ))}
              </div>
              <div className="hidden sm:grid gap-2 px-5 pb-1"
                style={{ gridTemplateColumns: "28px 1fr 1fr 1fr 1fr 36px" }}>
                {["", "Pays", "Opérateur", "Téléphone", "Montant", ""].map((_, i) =>
                  i === 0 ? <div key={i} /> : i === 5 ? <div key={i} /> : null
                )}
              </div>

              <div className="px-5 pb-5 space-y-2">
                <AnimatePresence>
                  {recipients.map((r, i) => (
                    <RecipientRow key={r.id} r={r} index={i} onChange={updateRow} onRemove={removeRow} showErrors={showErrors} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Description <span className="text-gray-400 font-normal text-xs">(optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="Ex : Salaires Novembre 2025, Commissions agents..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputCls}
              />
            </div>

            {balanceWarnings.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-sm font-semibold text-amber-800">Solde insuffisant</p>
                </div>
                {balanceWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700 pl-6">{w}</p>
                ))}
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className={cn(
                "w-full rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all h-[52px]",
                canSubmit && !submitting
                  ? "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                  : submitting
                  ? "bg-gray-900 text-white opacity-80 cursor-wait"
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 shrink-0" />
                  <span>
                    Envoyer à {recipients.length} destinataire{recipients.length > 1 ? "s" : ""}
                  </span>
                  {!canSubmit && (
                    <AlertTriangle className="w-4 h-4 ml-auto text-gray-400 shrink-0" />
                  )}
                  {canSubmit && (
                    <CheckCircle2 className="w-4 h-4 ml-auto text-green-500 shrink-0" />
                  )}
                </>
              )}
            </button>

            {!canSubmit && !submitting && (
              <p className="text-center text-xs text-gray-400">
                {balanceWarnings.length > 0
                  ? "Rechargez vos wallets pour débloquer l'envoi."
                  : "Complétez tous les champs pour débloquer l'envoi."}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Récapitulatif</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Destinataires</span>
                  <span className="text-sm font-semibold text-gray-900">{recipients.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Valides</span>
                  <span className={cn("text-sm font-semibold", filledCount === recipients.length ? "text-green-600" : "text-amber-600")}>
                    {filledCount} / {recipients.length}
                  </span>
                </div>

                {wallets.length > 0 && (
                  <div className="border-t border-dashed border-gray-100 pt-3 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Soldes wallets</p>
                    {wallets.map(w => {
                      const needed = balanceByCountry[w.countryCode] ?? 0;
                      const ok = w.balance >= needed;
                      const country = COUNTRIES.find(c => c.code === w.countryCode);
                      return (
                        <div key={w.countryCode} className={cn(
                          "flex justify-between items-center text-xs rounded-lg px-2 py-1",
                          needed > 0 && !ok ? "bg-red-50" : needed > 0 ? "bg-green-50" : ""
                        )}>
                          <span className="text-gray-600">{country?.flag} {country?.name}</span>
                          <span className={cn("font-semibold", needed > 0 && !ok ? "text-red-600" : "text-gray-800")}>
                            {w.balance.toLocaleString("fr-FR")} {w.currency}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Montant total</span>
                    <span className="text-sm font-bold text-gray-900">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Frais (3%)</span>
                    <span className="text-sm text-amber-600 font-medium">+ {fees.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ backgroundColor: "#B5F03C" }}>
                    <span className="text-sm font-bold text-gray-900">Total débité</span>
                    <span className="text-sm font-bold text-gray-900">{totalDebited.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Format CSV</p>
              </div>
              <code className="block text-[11px] font-mono bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-600 leading-relaxed">
                countryCode,operator,<br />phone,amount,note
              </code>
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                <button onClick={downloadTemplate} className="text-gray-700 font-semibold hover:underline">
                  Télécharger le modèle →
                </button>
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Opérateurs valides par pays</p>
              {COUNTRIES.map(c => (
                <div key={c.code} className="text-xs text-gray-600">
                  <span className="font-semibold">{c.flag} {c.name} :</span>{" "}
                  <span className="text-gray-500">{c.operators.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Historique des envois</h2>
            {jobs.length > 0 && (
              <span className="text-xs text-gray-400">{jobs.length} opération{jobs.length > 1 ? "s" : ""}</span>
            )}
          </div>

          {loadingJobs ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Aucun paiement de masse</p>
              <p className="text-xs text-gray-400">Vos opérations apparaîtront ici après le premier envoi.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {["Référence", "Destinataires", "Montant", "Statut", "Date"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobs.map((job, i) => (
                      <motion.tr key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs font-bold text-gray-900">{job.reference}</p>
                          {job.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{job.description}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-green-600">{job.successCount}✓</span>
                            {job.failedCount > 0 && <span className="font-semibold text-red-500">{job.failedCount}✗</span>}
                            <span className="text-gray-400">/ {job.totalCount}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-gray-900">
                            {parseFloat(job.totalAmount).toLocaleString("fr-FR")}{" "}
                            <span className="text-xs font-normal text-gray-400">{job.currency}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5"><JobStatusBadge status={job.status} /></td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">
                          {new Date(job.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </motion.div>
    </DashboardLayout>
  );
}
