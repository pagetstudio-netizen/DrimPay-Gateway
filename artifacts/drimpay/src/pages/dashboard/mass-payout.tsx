import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Upload, Plus, Trash2, Send, CheckCircle2, Clock,
  XCircle, AlertTriangle, Download, X, ChevronDown
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Togo", "Flooz"] },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF", operators: ["MTN Bénin", "Moov Bénin"] },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", operators: ["MTN CM", "Orange CM"] },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", operators: ["Orange BF", "Moov BF"] },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", operators: ["Orange Mali", "Moov Mali"] },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF", operators: ["Orange Sénégal", "Free Sénégal", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN CI", "Orange CI", "Moov Africa"] },
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

function RecipientRow({
  r, index, onChange, onRemove,
}: {
  r: Recipient;
  index: number;
  onChange: (id: string, field: keyof Recipient, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const country = COUNTRIES.find(c => c.code === r.countryCode)!;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="grid grid-cols-12 gap-2 items-center"
    >
      <span className="col-span-1 text-xs text-muted-foreground font-mono text-center">{index + 1}</span>
      <div className="col-span-2">
        <Select value={r.countryCode} onValueChange={v => { onChange(r.id, "countryCode", v); onChange(r.id, "operator", ""); }}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c.code} value={c.code}><span className="text-sm">{c.flag}</span> {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-3">
        <Select value={r.operator} onValueChange={v => onChange(r.id, "operator", v)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Opérateur" />
          </SelectTrigger>
          <SelectContent>
            {country.operators.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-3">
        <Input className="h-9 text-xs" placeholder="+22890000000" value={r.phone} onChange={e => onChange(r.id, "phone", e.target.value)} />
      </div>
      <div className="col-span-2">
        <div className="relative">
          <Input className="h-9 text-xs pr-10" placeholder="Montant" type="number" min="1" value={r.amount} onChange={e => onChange(r.id, "amount", e.target.value)} />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{country.currency}</span>
        </div>
      </div>
      <div className="col-span-1 flex justify-center">
        <button onClick={() => onRemove(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending:    { label: "En attente", cls: "bg-yellow-500/10 text-yellow-400", icon: Clock },
    processing: { label: "En cours",   cls: "bg-blue-500/10 text-blue-400",    icon: Clock },
    completed:  { label: "Terminé",    cls: "bg-green-500/10 text-green-400",  icon: CheckCircle2 },
    failed:     { label: "Échoué",     cls: "bg-red-500/10 text-red-400",      icon: XCircle },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", s.cls)}>
      <s.icon className="w-3 h-3" /> {s.label}
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

  const updateRow = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

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
    const csv = "countryCode,operator,phone,amount,note\nSN,Wave,+221770000001,5000,Salaire\nCI,MTN CI,+2250500000001,10000,Prime";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "template-mass-payout.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const totalAmount = recipients.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const isValid = recipients.every(r => r.phone && r.amount && r.operator && parseFloat(r.amount) > 0);

  const submit = async () => {
    if (!isValid) { setError("Veuillez remplir tous les champs (pays, opérateur, téléphone, montant)."); return; }
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
      toast({ title: "Paiement de masse lancé !", description: `Référence: ${data.job?.reference}` });
      setRecipients([newRecipient()]);
      setDescription("");
      loadJobs();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Paiement de Masse
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Envoyez des fonds à plusieurs destinataires en une seule opération</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5" /> Modèle CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> Importer CSV
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Destinataires ({recipients.length})</h2>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={addRow}>
                  <Plus className="w-3 h-3" /> Ajouter
                </Button>
              </div>

              <div className="grid grid-cols-12 gap-2 mb-2 px-0">
                <div className="col-span-1" />
                <div className="col-span-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Pays</div>
                <div className="col-span-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Opérateur</div>
                <div className="col-span-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Téléphone</div>
                <div className="col-span-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Montant</div>
                <div className="col-span-1" />
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {recipients.map((r, i) => (
                    <RecipientRow key={r.id} r={r} index={i} onChange={updateRow} onRemove={removeRow} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <Label className="text-sm font-semibold">Description (optionnel)</Label>
              <Input placeholder="Ex: Salaires Novembre 2025, Primes équipe..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <Button className="w-full h-12 font-bold gap-2 text-base" onClick={submit} disabled={submitting || !isValid}>
              <Send className="w-5 h-5" />
              {submitting ? "Envoi en cours..." : `Envoyer à ${recipients.length} destinataire${recipients.length > 1 ? "s" : ""}`}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-4">Récapitulatif</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Destinataires</span>
                  <span className="font-semibold">{recipients.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant total</span>
                  <span className="font-bold text-foreground">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais estimés (3%)</span>
                  <span className="text-yellow-400">{(totalAmount * 0.03).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Total débité</span>
                  <span className="font-bold text-primary">{(totalAmount * 1.03).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-blue-400 mb-1">📋 Format CSV</p>
              <code className="block font-mono bg-black/20 rounded p-2 mt-1">countryCode,operator,phone,amount,note</code>
              <p className="mt-2">Importez un fichier CSV pour renseigner plusieurs destinataires rapidement.</p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="mt-8">
          <h2 className="font-semibold mb-4">Historique des paiements de masse</h2>
          {loadingJobs ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Aucun paiement de masse effectué.</div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Référence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Destinataires</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Montant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="px-4 py-3 font-mono text-xs">{job.reference}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-400">{job.successCount} ✓</span>
                        {job.failedCount > 0 && <span className="text-red-400 ml-2">{job.failedCount} ✗</span>}
                        <span className="text-muted-foreground ml-2">/ {job.totalCount}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{parseFloat(job.totalAmount).toLocaleString("fr-FR")} {job.currency}</td>
                      <td className="px-4 py-3"><JobStatusBadge status={job.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(job.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
