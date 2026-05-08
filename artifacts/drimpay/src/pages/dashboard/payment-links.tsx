import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, Plus, Copy, Check, Trash2, ExternalLink, X,
  CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Mail,
  Link2, Share2, EyeOff, MoreVertical, Globe, MapPin, Building2, Hash, Flag
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRIES = [
  { code: "TG", name: "Togo",          flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Money"] },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", currency: "XOF", operators: ["MTN Mobile Money", "Moov Money"] },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", currency: "XAF", operators: ["MTN MoMo", "Orange Money"] },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "ML", name: "Mali",          flag: "🇲🇱", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳", currency: "XOF", operators: ["Orange Money", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN", "Orange Money", "Wave", "Moov Money"] },
  { code: "GH", name: "Ghana",         flag: "🇬🇭", currency: "GHS", operators: ["MTN Ghana", "Vodafone Ghana"] },
  { code: "NG", name: "Nigeria",       flag: "🇳🇬", currency: "NGN", operators: ["MTN Nigeria", "Airtel Nigeria"] },
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
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  // Fixed amount — one per currency zone
  const [fixedAmount, setFixedAmount] = useState(false);
  const [amountXOF, setAmountXOF] = useState("");
  const [amountXAF, setAmountXAF] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  // Redirect after payment
  const [redirectAfterPayment, setRedirectAfterPayment] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  // Billing address
  const [collectBilling, setCollectBilling] = useState(false);
  const [billingLine1, setBillingLine1] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostal, setBillingPostal] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  // Share button
  const [displayShare, setDisplayShare] = useState(true);
  // Payment limit
  const [paymentLimit, setPaymentLimit] = useState(false);
  const [maxUses, setMaxUses] = useState("");
  // Notification email
  const [notifEmail, setNotifEmail] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const allSelected = selectedCodes.length === COUNTRIES.length;
  const toggleCountry = (code: string) =>
    setSelectedCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  const toggleAll = () =>
    setSelectedCodes(allSelected ? [] : COUNTRIES.map(c => c.code));

  const selectedCountries = COUNTRIES.filter(c => selectedCodes.includes(c.code));
  const currencies = [...new Set(selectedCountries.map(c => c.currency))];
  const hasXOF = currencies.includes("XOF");
  const hasXAF = currencies.includes("XAF");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCodes.length === 0) { setError("Veuillez sélectionner au moins un pays."); return; }
    if (!title.trim()) { setError("Le titre est requis."); return; }
    if (redirectAfterPayment && !redirectUrl.trim()) { setError("Veuillez saisir l'URL de redirection."); return; }
    setError("");
    setLoading(true);
    try {
      // Use first available amount for backward compat (API stores single amount)
      const primaryAmount = fixedAmount
        ? parseFloat(hasXOF ? amountXOF : amountXAF) || undefined
        : undefined;
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        countryCodes: selectedCodes,
        fixedAmount,
        amount: primaryAmount,
        maxUses: paymentLimit && maxUses ? parseInt(maxUses) : undefined,
        redirectUrl: redirectAfterPayment ? redirectUrl.trim() : undefined,
        collectBilling,
        displayShare,
        notifEmail: notifEmail.trim() || undefined,
        confirmMsg: confirmMsg.trim() || undefined,
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
            <X style={{ width: 18, height: 18 }} />
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

            {/* ── Titre ── */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Titre <span className="text-red-500">*</span></label>
              <Input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="ex : Billets Liverpool, Facture #001…"
                className="bg-muted/30 border-border" />
            </div>

            {/* ── Pays de collecte ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Pays de collecte <span className="text-red-500">*</span></label>
                <button type="button" onClick={toggleAll}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all",
                    allSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {COUNTRIES.map(country => {
                  const active = selectedCodes.includes(country.code);
                  return (
                    <button key={country.code} type="button" onClick={() => toggleCountry(country.code)}
                      className={cn(
                        "relative flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all text-center",
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/40"
                      )}>
                      {active && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-2xl leading-none">{country.flag}</span>
                      <span className="text-[11px] font-semibold leading-tight">{country.name}</span>
                      <span className="text-[10px] opacity-60">{country.currency}</span>
                    </button>
                  );
                })}
              </div>

              {selectedCodes.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-muted-foreground bg-muted/30 rounded-xl px-3 py-2 border border-border">
                  <span className="font-semibold text-foreground">
                    {selectedCodes.length} pays sélectionné{selectedCodes.length > 1 ? "s" : ""}
                  </span>
                  {" · "}Devises : {currencies.join(", ")}
                  {" · "}Le payeur choisira son pays et opérateur au moment du paiement.
                </motion.div>
              )}
            </div>

            {/* ── Montant fixe ── */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Montant fixe</span>
                <p className="text-xs text-muted-foreground mt-0.5">Désactivé = le payeur saisit le montant librement</p>
              </div>
              <Toggle checked={fixedAmount} onChange={setFixedAmount} />
            </div>

            <AnimatePresence>
              {fixedAmount && selectedCodes.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  {/* XOF amount */}
                  {hasXOF && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Montant en XOF</label>
                      <div className="relative">
                        <Input type="number" min="1" step="1" value={amountXOF}
                          onChange={e => setAmountXOF(e.target.value)}
                          placeholder="ex : 5 000" className="pr-16 bg-muted/30 border-border"
                          required={fixedAmount && hasXOF} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">XOF</span>
                      </div>
                    </div>
                  )}
                  {/* XAF amount */}
                  {hasXAF && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Montant en XAF</label>
                      <div className="relative">
                        <Input type="number" min="1" step="1" value={amountXAF}
                          onChange={e => setAmountXAF(e.target.value)}
                          placeholder="ex : 5 000" className="pr-16 bg-muted/30 border-border"
                          required={fixedAmount && hasXAF} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">XAF</span>
                      </div>
                    </div>
                  )}
                  {currencies.some(c => c !== "XOF" && c !== "XAF") && (
                    <p className="text-xs text-amber-500">
                      Note : Ghana (GHS) et Nigeria (NGN) utiliseront la conversion automatique.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Image de la page ── */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Image de la page de paiement
                <span className="ml-1 text-xs font-normal">(Optionnel)</span>
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
                  <button type="button" onClick={() => setImageFile(null)}
                    className="text-muted-foreground hover:text-red-400 transition-colors ml-auto">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".svg,.jpg,.jpeg,.png,.webp,.gif,.ico" className="hidden"
                onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
            </div>

            {/* ── Description ── */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Description (optionnel)</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="ex : Meilleures places, rangée VIP…"
                rows={3} className="bg-muted/30 border-border resize-none" />
            </div>

            {/* ── Email de notification ── */}
            <div className="space-y-2 rounded-2xl border border-border bg-muted/20 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Email de notification</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Recevez une notification par email à chaque paiement reçu via ce lien.
              </p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={notifEmail}
                  onChange={e => setNotifEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="pl-9 bg-background border-border"
                />
              </div>
            </div>

            {/* ── Paramètres avancés ── */}
            <div className="rounded-xl border border-border overflow-hidden">
              <button type="button" onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center justify-between w-full px-4 py-3.5 bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-semibold">Paramètres avancés</span>
                {showAdvanced
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-5 pt-3 space-y-5 border-t border-border">

                      {/* Message de confirmation */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">
                          Message de confirmation de paiement
                        </label>
                        <Input value={confirmMsg} onChange={e => setConfirmMsg(e.target.value)}
                          placeholder="ex : Merci pour votre paiement !" className="bg-muted/30 border-border" />
                      </div>

                      {/* ── Redirection après paiement ── */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">Redirection après paiement</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              Redirigez le client vers votre site après le paiement
                            </p>
                          </div>
                          <Toggle checked={redirectAfterPayment} onChange={v => { setRedirectAfterPayment(v); if (!v) setRedirectUrl(""); }} />
                        </div>
                        <AnimatePresence>
                          {redirectAfterPayment && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  type="url"
                                  value={redirectUrl}
                                  onChange={e => setRedirectUrl(e.target.value)}
                                  placeholder="https://monsite.com/merci"
                                  className="pl-9 bg-muted/30 border-border"
                                  required={redirectAfterPayment}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                URL vers laquelle le client sera redirigé après confirmation du paiement.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Collecte adresse de facturation ── */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">Collecter l'adresse de facturation</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              Demande l'adresse complète du payeur
                            </p>
                          </div>
                          <Toggle checked={collectBilling} onChange={v => { setCollectBilling(v); }} />
                        </div>
                        <AnimatePresence>
                          {collectBilling && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
                              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                                <p className="text-xs text-muted-foreground font-medium mb-2">Champs à collecter :</p>
                                {[
                                  { icon: <MapPin className="w-3.5 h-3.5" />, label: "Adresse (ligne 1)", val: billingLine1, set: setBillingLine1, ph: "123 Rue des Acacias" },
                                  { icon: <Building2 className="w-3.5 h-3.5" />, label: "Ville", val: billingCity, set: setBillingCity, ph: "Abidjan" },
                                  { icon: <Hash className="w-3.5 h-3.5" />, label: "Code postal", val: billingPostal, set: setBillingPostal, ph: "01 BP 1234" },
                                  { icon: <Flag className="w-3.5 h-3.5" />, label: "Pays", val: billingCountry, set: setBillingCountry, ph: "Côte d'Ivoire" },
                                ].map(({ icon, label, val, set, ph }) => (
                                  <div key={label} className="space-y-1">
                                    <label className="text-xs text-muted-foreground">{label}</label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
                                      <Input value={val} onChange={e => set(e.target.value)}
                                        placeholder={ph} className="pl-8 h-9 text-sm bg-background border-border" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ces champs seront affichés et requis sur la page de paiement pour le payeur.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Bouton de partage ── */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Afficher le bouton de partage</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            Permet au payeur de partager le lien avec d'autres personnes
                          </p>
                        </div>
                        <Toggle checked={displayShare} onChange={setDisplayShare} />
                      </div>

                      {/* ── Limite de paiement ── */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">Limite d'utilisations</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              Nombre maximum de paiements autorisés
                            </p>
                          </div>
                          <Toggle checked={paymentLimit} onChange={setPaymentLimit} />
                        </div>
                        <AnimatePresence>
                          {paymentLimit && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <Input type="number" min="1" value={maxUses}
                                onChange={e => setMaxUses(e.target.value)}
                                placeholder="ex : 100" className="bg-muted/30 border-border" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="px-6 pb-6 shrink-0">
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50">
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
            <span>
              {link.operator === "all" || link.countryCode.includes(",")
                ? (() => {
                    const codes = link.countryCode.split(",").map(c => c.trim());
                    const flags: Record<string, string> = { TG:"🇹🇬", BJ:"🇧🇯", CM:"🇨🇲", BF:"🇧🇫", ML:"🇲🇱", SN:"🇸🇳", CI:"🇨🇮", GH:"🇬🇭", NG:"🇳🇬" };
                    return codes.length <= 4
                      ? codes.map(c => flags[c] ?? c).join(" ")
                      : `${codes.slice(0, 3).map(c => flags[c] ?? c).join(" ")} +${codes.length - 3}`;
                  })()
                : `${link.countryCode} · ${link.operator}`
              }
            </span>
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
