import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Upload, Plus, Trash2, Send, CheckCircle2, Clock,
  XCircle, AlertTriangle, Download, FileText, ChevronDown, ArrowRight
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  { code: "TG", name: "Togo",          flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Money"] },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", currency: "XOF", operators: ["MTN Mobile Money", "Moov Money"] },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", currency: "XAF", operators: ["MTN MoMo", "Orange Money"] },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "ML", name: "Mali",          flag: "🇲🇱", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳", currency: "XOF", operators: ["Orange Money", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN", "Orange Money", "Wave", "Moov Money"] },
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
  completedAt?: string;
};

function newRecipient(): Recipient {
  return { id: crypto.randomUUID(), phone: "", amount: "", countryCode: "SN", operator: "", note: "" };
}

const selectCls = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all appearance-none cursor-pointer";
const inputCls  = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all";

function NativeSelect({
  value, onChange, children, className,
}: { value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className={cn(selectCls, "pr-8", className)}>
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}

function RecipientRow({
  r, index, onChange, onRemove,
}: {
  r: Recipient;
  index: number;
  onChange: (id: string, field: keyof Recipient, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const country = COUNTRIES.find(c => c.code === r.countryCode) ?? COUNTRIES[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid gap-2 items-start p-3 rounded-2xl border border-gray-100 bg-gray-50/60 hover:border-gray-200 transition-colors"
      style={{ gridTemplateColumns: "28px 1fr 1fr 1fr 1fr 36px" }}
    >
      <div className="flex items-center justify-center h-10">
        <span className="text-xs text-gray-400 font-mono font-bold">{String(index + 1).padStart(2, "0")}</span>
      </div>

      <NativeSelect value={r.countryCode} onChange={v => { onChange(r.id, "countryCode", v); onChange(r.id, "operator", ""); }}>
        {COUNTRIES.map(c => (
          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
        ))}
      </NativeSelect>

      <NativeSelect value={r.operator} onChange={v => onChange(r.id, "operator", v)}>
        <option value="">Opérateur...</option>
        {country.operators.map(op => <option key={op} value={op}>{op}</option>)}
      </NativeSelect>

      <input
        type="tel"
        placeholder="+221 77 000 00 00"
        value={r.phone}
        onChange={e => onChange(r.id, "phone", e.target.value)}
        className={inputCls}
      />

      <div className="relative">
        <input
          type="number"
          min="1"
          placeholder="Montant"
          value={r.amount}
          onChange={e => onChange(r.id, "amount", e.target.value)}
          className={cn(inputCls, "pr-12")}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
          {country.currency}
        </span>
      </div>

      <div className="flex items-center justify-center h-10">
        <button
          onClick={() => onRemove(r.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string; text: string }> = {
    pending:    { label: "En attente", dot: "bg-amber-400",  text: "text-amber-700" },
    processing: { label: "En cours",   dot: "bg-blue-400",   text: "text-blue-700" },
    completed:  { label: "Terminé",    dot: "bg-green-500",  text: "text-green-700" },
    failed:     { label: "Échoué",     dot: "bg-red-500",    text: "text-red-700" },
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
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const r = await fetch("/api/dashboard/mass-payout", { credentials: "include" });
      const d = await r.json();
      setJobs(Array.isArray(d) ? d : []);
    } catch { setJobs([]); }
    finally { setLoadingJobs(false); }
  };

  useEffect(() => { loadJobs(); }, []);

  const addRow = () => setRecipients(prev => [...prev, newRecipient()]);
  const removeRow = (id: string) => setRecipients(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  const updateRow = (id: string, field: keyof Recipient, value: string) =>
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
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
        toast({ title: `${parsed.length} destinataires importés` });
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
  const fees = totalAmount * 0.03;
  const totalDebited = totalAmount + fees;
  const isValid = recipients.every(r => r.phone && r.amount && r.operator && parseFloat(r.amount) > 0);
  const filledCount = recipients.filter(r => r.phone && r.amount && r.operator).length;

  const submit = async () => {
    if (!isValid) { setError("Veuillez remplir tous les champs pour chaque destinataire."); return; }
    setError("");
    setSubmitting(true);
    try {
      const r = await fetch("/api/dashboard/mass-payout", {
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
      if (!r.ok) { setError(data.error || "Erreur"); setSubmitting(false); return; }
      toast({ title: "Paiement de masse lancé !", description: `Réf: ${data.job?.reference}` });
      setRecipients([newRecipient()]);
      setDescription("");
      loadJobs();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl">

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#B5F03C" }}>
                <Users className="w-5 h-5 text-gray-900" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Paiement de Masse</h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">Envoyez des fonds à plusieurs destinataires en une seule opération</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Modèle CSV
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Importer CSV
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">Destinataires</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {recipients.length}
                  </span>
                </div>
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                </button>
              </div>

              <div className="px-5 pt-3 pb-1">
                <div
                  className="grid gap-2 px-1 mb-2"
                  style={{ gridTemplateColumns: "28px 1fr 1fr 1fr 1fr 36px" }}
                >
                  {["#", "Pays", "Opérateur", "Téléphone", "Montant", ""].map((h, i) => (
                    <div key={i} className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</div>
                  ))}
                </div>
              </div>

              <div className="px-5 pb-5 space-y-2">
                <AnimatePresence>
                  {recipients.map((r, i) => (
                    <RecipientRow key={r.id} r={r} index={i} onChange={updateRow} onRemove={removeRow} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 space-y-2">
              <label className="block text-sm font-semibold text-gray-900">Description <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input
                type="text"
                placeholder="Ex : Salaires Novembre 2025, Commissions agents..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputCls}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}

            <button
              onClick={submit}
              disabled={submitting || !isValid}
              className="w-full h-13 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                height: "52px",
                backgroundColor: isValid ? "#0f0f0f" : undefined,
                color: isValid ? "#fff" : undefined,
                background: !isValid ? "#f3f4f6" : undefined,
              }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer à {recipients.length} destinataire{recipients.length > 1 ? "s" : ""}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Récapitulatif</h3>
              </div>
              <div className="px-5 py-4 space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Destinataires</span>
                  <span className="text-sm font-semibold text-gray-900">{recipients.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Complétés</span>
                  <span className="text-sm font-semibold text-gray-900">{filledCount} / {recipients.length}</span>
                </div>
                <div className="border-t border-dashed border-gray-200 pt-3.5">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-sm text-gray-500">Montant total</span>
                    <span className="text-sm font-bold text-gray-900">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
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
                countryCode,operator,phone,<br />amount,note
              </code>
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                Importez un fichier CSV pour renseigner plusieurs destinataires rapidement.{" "}
                <button onClick={downloadTemplate} className="text-gray-700 font-semibold hover:underline">
                  Télécharger le modèle →
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Historique</h2>
            {jobs.length > 0 && (
              <span className="text-xs text-gray-400">{jobs.length} opération{jobs.length > 1 ? "s" : ""}</span>
            )}
          </div>

          {loadingJobs ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Aucun paiement de masse</p>
              <p className="text-xs text-gray-400">Vos opérations apparaîtront ici après le premier envoi.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="grid text-[10px] font-bold uppercase tracking-widest text-gray-400 px-5 py-3 border-b border-gray-100"
                style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr" }}>
                <span>Référence</span>
                <span>Destinataires</span>
                <span>Montant</span>
                <span>Statut</span>
                <span>Date</span>
              </div>
              <div className="divide-y divide-gray-100">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid items-center px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    style={{ gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr" }}
                  >
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-900">{job.reference}</p>
                      {job.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{job.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-green-600">{job.successCount}✓</span>
                      {job.failedCount > 0 && <span className="font-semibold text-red-500">{job.failedCount}✗</span>}
                      <span className="text-gray-400">/ {job.totalCount}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {parseFloat(job.totalAmount).toLocaleString("fr-FR")} <span className="text-xs font-normal text-gray-400">{job.currency}</span>
                    </span>
                    <JobStatusBadge status={job.status} />
                    <span className="text-xs text-gray-400">
                      {new Date(job.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

      </motion.div>
    </DashboardLayout>
  );
}
