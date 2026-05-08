import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, Plus, Copy, Check, Trash2, ExternalLink, X,
  CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Mail, Upload,
  Link2, Share2, Eye, EyeOff, QrCode, MoreVertical
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CURRENCIES: { label: string; value: string; country: string; countryCode: string; flag: string; operators: string[] }[] = [
  { label: "XOF — Togo",          value: "XOF-TG", country: "Togo",         countryCode: "TG", flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Togo", "Flooz"] } as any,
  { label: "XOF — Bénin",         value: "XOF-BJ", country: "Bénin",        countryCode: "BJ", flag: "🇧🇯", currency: "XOF", operators: ["MTN Bénin", "Moov Bénin"] } as any,
  { label: "XAF — Cameroun",      value: "XAF-CM", country: "Cameroun",     countryCode: "CM", flag: "🇨🇲", currency: "XAF", operators: ["MTN CM", "Orange CM"] } as any,
  { label: "XOF — Burkina Faso",  value: "XOF-BF", country: "Burkina Faso", countryCode: "BF", flag: "🇧🇫", currency: "XOF", operators: ["Orange BF", "Moov BF"] } as any,
  { label: "XOF — Mali",          value: "XOF-ML", country: "Mali",         countryCode: "ML", flag: "🇲🇱", currency: "XOF", operators: ["Orange Mali", "Moov Mali"] } as any,
  { label: "XOF — Sénégal",       value: "XOF-SN", country: "Sénégal",      countryCode: "SN", flag: "🇸🇳", currency: "XOF", operators: ["Orange SN", "Free SN", "Wave"] } as any,
  { label: "XOF — Côte d'Ivoire", value: "XOF-CI", country: "Côte d'Ivoire",countryCode: "CI", flag: "🇨🇮", currency: "XOF", operators: ["MTN CI", "Orange CI", "Moov Africa CI"] } as any,
  { label: "GHS — Ghana",         value: "GHS-GH", country: "Ghana",        countryCode: "GH", flag: "🇬🇭", currency: "GHS", operators: ["MTN Ghana", "Vodafone Ghana"] } as any,
  { label: "NGN — Nigeria",       value: "NGN-NG", country: "Nigeria",      countryCode: "NG", flag: "🇳🇬", currency: "NGN", operators: ["MTN Nigeria", "Airtel Nigeria"] } as any,
];

type PaymentLink = {
  id: number; token: string; title: string; description?: string; amount?: string;
  currency: string; countryCode: string; operator: string; fixedAmount: boolean;
  maxUses?: number; uses: number; status: "active" | "inactive" | "expired";
  expiresAt?: string; createdAt: string;
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors shrink-0 focus:outline-none",
        checked ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
        checked ? "translate-x-6" : "translate-x-0"
      )} />
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:   { label: "Actif",   cls: "bg-green-500/10 text-green-600 border-green-500/20" },
    inactive: { label: "Inactif", cls: "bg-gray-500/10 text-gray-400 border-gray-400/20" },
    expired:  { label: "Expiré",  cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const s = map[status] ?? map.inactive;
  return <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", s.cls)}>{s.label}</span>;
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (link: PaymentLink) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currencyKey, setCurrencyKey] = useState("");
  const [operator, setOperator] = useState("");
  const [fixedAmount, setFixedAmount] = useState(false);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [redirectAfterPayment, setRedirectAfterPayment] = useState(false);
  const [collectBilling, setCollectBilling] = useState(false);
  const [displayShare, setDisplayShare] = useState(true);
  const [multiCurrency, setMultiCurrency] = useState(false);
  const [paymentLimit, setPaymentLimit] = useState(false);
  const [maxUses, setMaxUses] = useState("");
  const [emails, setEmails] = useState([""]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selected = CURRENCIES.find(c => c.value === currencyKey) as any;

  const addEmail = () => setEmails(e => [...e, ""]);
  const setEmail = (i: number, v: string) => setEmails(e => e.map((x, j) => j === i ? v : x));
  const removeEmail = (i: number) => setEmails(e => e.filter((_, j) => j !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyKey) { setError("Veuillez sélectionner une devise."); return; }
    if (!operator) { setError("Veuillez sélectionner un opérateur."); return; }
    if (!title.trim()) { setError("Le titre est requis."); return; }
    setError("");
    setLoading(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || undefined,
        countryCode: selected.countryCode,
        operator,
        currency: selected.currency,
        fixedAmount,
        amount: fixedAmount && amount ? parseFloat(amount) : undefined,
        maxUses: paymentLimit && maxUses ? parseInt(maxUses) : undefined,
      };
      const r = await fetch(`${BASE}/api/dashboard/payment-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Erreur"); return; }
      onCreated(data.link);
      toast({ title: "Lien créé", description: "Votre lien de paiement est prêt à partager." });
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">Ajouter un lien de paiement</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center">
                <Share2 className="w-9 h-9 text-muted-foreground/60" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Titre <span className="text-red-500">*</span>
              </label>
              <Input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="ex : Billets Liverpool, Facture #001..."
                className="bg-muted/30 border-border"
              />
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Devise <span className="text-red-500">*</span>
              </label>
              <Select value={currencyKey} onValueChange={v => { setCurrencyKey(v); setOperator(""); }}>
                <SelectTrigger className="bg-muted/30 border-border">
                  <SelectValue placeholder="Sélectionner une devise" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span>{(c as any).flag}</span>
                        <span>{c.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operator (shown when currency selected) */}
            {selected && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Opérateur <span className="text-red-500">*</span>
                </label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger className="bg-muted/30 border-border">
                    <SelectValue placeholder="Choisir un opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selected.operators as string[]).map(op => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Fixed Amount toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Montant fixe</span>
              <Toggle checked={fixedAmount} onChange={setFixedAmount} />
            </div>

            {fixedAmount && selected && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5">
                <label className="text-sm font-medium">Montant ({(selected as any).currency})</label>
                <div className="relative">
                  <Input
                    type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="5000" className="pr-12 bg-muted/30 border-border" required={fixedAmount}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">{(selected as any).currency}</span>
                </div>
              </motion.div>
            )}

            {/* Image upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Image de la page de paiement
                <span className="ml-1 text-xs font-normal">(Optionnel — svg, jpeg, png, webp, gif, ico)</span>
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-sm font-medium transition-colors shrink-0">
                  Choisir un fichier
                </button>
                <span className="text-sm text-muted-foreground truncate">
                  {imageFile ? imageFile.name : "Aucun fichier choisi"}
                </span>
                {imageFile && (
                  <button type="button" onClick={() => setImageFile(null)} className="text-muted-foreground hover:text-red-400 transition-colors ml-auto">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".svg,.jpg,.jpeg,.png,.webp,.gif,.ico" className="hidden"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Description (optionnel)</label>
              <Textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="ex : Meilleures places, rangée VIP..."
                rows={3} className="bg-muted/30 border-border resize-none"
              />
            </div>

            {/* Advanced Settings */}
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center justify-between w-full px-4 py-3.5 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-semibold">Paramètres avancés</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border">
                      {/* Confirmation message */}
                      <div className="space-y-1.5">
                        <label className="text-sm text-muted-foreground">Message de confirmation de paiement</label>
                        <Input value={confirmMsg} onChange={e => setConfirmMsg(e.target.value)}
                          placeholder="ex : Paiement réussi" className="bg-muted/30 border-border" />
                      </div>

                      {/* Toggles */}
                      {[
                        { label: "Redirection après paiement vers un site web", value: redirectAfterPayment, set: setRedirectAfterPayment },
                        { label: "Collecter l'adresse de facturation", value: collectBilling, set: setCollectBilling },
                        { label: "Afficher le bouton de partage", value: displayShare, set: setDisplayShare },
                        { label: "Autoriser le paiement en plusieurs devises", value: multiCurrency, set: setMultiCurrency },
                      ].map(({ label, value, set }) => (
                        <div key={label} className="flex items-start justify-between gap-3">
                          <span className="text-sm text-muted-foreground leading-snug">{label}</span>
                          <Toggle checked={value} onChange={set} />
                        </div>
                      ))}

                      {/* Payment Limit toggle */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm text-muted-foreground leading-snug">
                          Limite de paiement — Nombre maximum de fois que ce lien peut être utilisé
                        </span>
                        <Toggle checked={paymentLimit} onChange={setPaymentLimit} />
                      </div>
                      {paymentLimit && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                          <Input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)}
                            placeholder="ex : 100" className="bg-muted/30 border-border" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Emails */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Emails de notification</p>
              {emails.map((email, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-xs text-muted-foreground">Email {i + 1}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email" value={email} onChange={e => setEmail(i, e.target.value)}
                        placeholder="nom@email.com" className="pl-9 bg-muted/30 border-border"
                      />
                    </div>
                    {emails.length > 1 && (
                      <button type="button" onClick={() => removeEmail(i)}
                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addEmail}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> Ajouter un email supplémentaire
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="px-6 pb-6 shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function LinkCard({ link, payUrl, onDeactivate, onDelete }: {
  link: PaymentLink; payUrl: string;
  onDeactivate: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{link.title}</h3>
                <StatusBadge status={link.status} />
              </div>
              {link.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{link.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {link.fixedAmount && link.amount
                ? `${parseFloat(link.amount).toLocaleString("fr-FR")} ${link.currency}`
                : "Montant libre"}
            </span>
            <span>{link.countryCode} · {link.operator}</span>
            <span>{link.uses} utilisation{link.uses !== 1 ? "s" : ""}{link.maxUses ? ` / ${link.maxUses}` : ""}</span>
            <span>{new Date(link.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>

          <div className="mt-3 flex items-center gap-1 bg-muted/40 rounded-xl px-3 py-2 max-w-full border border-border">
            <code className="text-xs font-mono text-muted-foreground flex-1 truncate">{payUrl}</code>
            <CopyButton text={payUrl} />
            <a href={payUrl} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-10 z-20 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px] overflow-hidden"
                >
                  {link.status === "active" && (
                    <button onClick={() => { onDeactivate(); setMenuOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors">
                      <EyeOff className="w-3.5 h-3.5" /> Désactiver
                    </button>
                  )}
                  <button onClick={() => { navigator.clipboard.writeText(payUrl); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copier le lien
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function PaymentLinks() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const { toast } = useToast();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/payment-links`, { credentials: "include" });
      const d = await r.json();
      setLinks(Array.isArray(d) ? d : []);
    } catch { setLinks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deactivate = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/payment-links/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status: "inactive" }),
    });
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status: "inactive" as const } : l));
    toast({ title: "Lien désactivé" });
  };

  const deleteLink = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/payment-links/${id}`, { method: "DELETE", credentials: "include" });
    setLinks(prev => prev.filter(l => l.id !== id));
    toast({ title: "Lien supprimé" });
  };

  const getPayUrl = (token: string) => `${baseUrl}/fr/pay/${token}`;

  const filtered = links.filter(l => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || l.token.includes(q) || l.operator.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreated={(link) => { setLinks(prev => [link, ...prev]); setShowCreate(false); }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Liens de Paiement ({links.length})</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="hover:text-foreground cursor-pointer">Dashboard</span>
            <span className="mx-1">/</span>
            <span>Liens de Paiement</span>
          </p>
        </div>

        {/* Search + Filter + Create */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un lien..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                showFilter || filterStatus !== "all"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtre
              {filterStatus !== "all" && <span className="w-2 h-2 rounded-full bg-primary" />}
            </button>
            <AnimatePresence>
              {showFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    className="absolute right-0 top-12 z-20 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px]"
                  >
                    {[["all", "Tous"], ["active", "Actifs"], ["inactive", "Inactifs"], ["expired", "Expirés"]].map(([v, l]) => (
                      <button key={v} onClick={() => { setFilterStatus(v); setShowFilter(false); }}
                        className={cn("flex items-center gap-2 px-4 py-2.5 text-sm w-full transition-colors",
                          filterStatus === v ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}>
                        {filterStatus === v && <Check className="w-3.5 h-3.5" />}
                        {filterStatus !== v && <span className="w-3.5" />}
                        {l}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" />
            Créer
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-muted/60 flex items-center justify-center mb-5">
              <Share2 className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-base text-foreground mb-1">
              {search || filterStatus !== "all" ? "Aucun résultat" : "Aucun lien de paiement"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {search || filterStatus !== "all"
                ? "Essayez d'autres critères de recherche."
                : "Créez votre premier lien pour recevoir des paiements instantanément."}
            </p>
            {!search && filterStatus === "all" && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Créer un lien
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  payUrl={getPayUrl(link.token)}
                  onDeactivate={() => deactivate(link.id)}
                  onDelete={() => deleteLink(link.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
