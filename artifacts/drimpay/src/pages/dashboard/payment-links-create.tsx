import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, ChevronDown, ChevronUp, Mail, Share2,
  Globe, MapPin, Building2, Hash, Flag, Upload, X, Link2,
  CheckCircle2, Zap, Eye
} from "lucide-react";
import { useLocation } from "wouter";
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

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

export default function PaymentLinksCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Basic
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Countries
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  // Amount
  const [fixedAmount, setFixedAmount] = useState(false);
  const [amountXOF, setAmountXOF] = useState("");
  const [amountXAF, setAmountXAF] = useState("");

  // Notification
  const [notifEmail, setNotifEmail] = useState("");

  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [redirectAfterPayment, setRedirectAfterPayment] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [collectBilling, setCollectBilling] = useState(false);
  const [billingLine1, setBillingLine1] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostal, setBillingPostal] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [displayShare, setDisplayShare] = useState(true);
  const [paymentLimit, setPaymentLimit] = useState(false);
  const [maxUses, setMaxUses] = useState("");

  const allSelected = selectedCodes.length === COUNTRIES.length;
  const toggleCountry = (code: string) =>
    setSelectedCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  const toggleAll = () =>
    setSelectedCodes(allSelected ? [] : COUNTRIES.map(c => c.code));

  const selectedCountries = COUNTRIES.filter(c => selectedCodes.includes(c.code));
  const currencies = [...new Set(selectedCountries.map(c => c.currency))];
  const hasXOF = currencies.includes("XOF");
  const hasXAF = currencies.includes("XAF");

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCodes.length === 0) { setError("Veuillez sélectionner au moins un pays."); return; }
    if (!title.trim()) { setError("Le titre est requis."); return; }
    if (redirectAfterPayment && !redirectUrl.trim()) { setError("Veuillez saisir l'URL de redirection."); return; }
    setError("");
    setLoading(true);
    try {
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
      if (!r.ok) { setError(data.error || "Erreur lors de la création"); return; }
      toast({ title: "Lien créé avec succès" });
      navigate("/dashboard/payment-links");
    } catch { setError("Erreur réseau. Veuillez réessayer."); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard/payment-links")}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Créer un lien de paiement</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span
                className="hover:text-foreground cursor-pointer"
                onClick={() => navigate("/dashboard/payment-links")}
              >
                Liens de Paiement
              </span>
              <span className="mx-1">/</span>
              <span>Nouveau lien</span>
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">

          {/* ── Informations de base ── */}
          <SectionCard title="Informations du lien" icon={<Link2 className="w-4 h-4" />}>

            {/* Image */}
            <div className="flex items-start gap-4">
              <div
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors",
                  imagePreview ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30"
                )}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground/50 mb-1" />
                    <span className="text-[10px] text-muted-foreground/60 text-center leading-tight px-1">Logo / Image</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".svg,.jpg,.jpeg,.png,.webp,.gif,.ico"
                className="hidden"
                onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
              />
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Titre du lien <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="ex : Billets Liverpool, Facture #001…"
                    className="bg-muted/30 border-border"
                  />
                </div>
                {imageFile && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{imageFile.name}</span>
                    <button
                      type="button"
                      onClick={() => handleImageChange(null)}
                      className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Description <span className="text-xs font-normal">(optionnel)</span>
              </label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="ex : Meilleures places, rangée VIP…"
                rows={3}
                className="bg-muted/30 border-border resize-none"
              />
            </div>
          </SectionCard>

          {/* ── Pays de collecte ── */}
          <SectionCard title="Pays de collecte" icon={<Globe className="w-4 h-4" />}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Le payeur choisira son opérateur lors du paiement.</p>
              <button
                type="button"
                onClick={toggleAll}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all",
                  allSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {COUNTRIES.map(country => {
                const active = selectedCodes.includes(country.code);
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => toggleCountry(country.code)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all text-center",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    {active && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
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

            <AnimatePresence>
              {selectedCodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="text-xs text-muted-foreground bg-primary/5 rounded-xl px-4 py-3 border border-primary/10">
                    <span className="font-semibold text-foreground">
                      {selectedCodes.length} pays sélectionné{selectedCodes.length > 1 ? "s" : ""}
                    </span>
                    {" · "}Devises : <span className="font-medium text-foreground">{currencies.join(", ")}</span>
                    {" · "}Le payeur choisira son pays et opérateur lors du paiement.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* ── Montant ── */}
          <SectionCard title="Montant" icon={<Zap className="w-4 h-4" />}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Montant fixe</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Désactivé = le payeur saisit le montant librement
                </p>
              </div>
              <Toggle checked={fixedAmount} onChange={setFixedAmount} />
            </div>

            <AnimatePresence>
              {fixedAmount && selectedCodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {hasXOF && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Montant en XOF</label>
                      <div className="relative">
                        <Input
                          type="number" min="1" step="1"
                          value={amountXOF}
                          onChange={e => setAmountXOF(e.target.value)}
                          placeholder="ex : 5 000"
                          className="pr-16 bg-muted/30 border-border"
                          required={fixedAmount && hasXOF}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">XOF</span>
                      </div>
                    </div>
                  )}
                  {hasXAF && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Montant en XAF</label>
                      <div className="relative">
                        <Input
                          type="number" min="1" step="1"
                          value={amountXAF}
                          onChange={e => setAmountXAF(e.target.value)}
                          placeholder="ex : 5 000"
                          className="pr-16 bg-muted/30 border-border"
                          required={fixedAmount && hasXAF}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">XAF</span>
                      </div>
                    </div>
                  )}
                  {currencies.some(c => c !== "XOF" && c !== "XAF") && (
                    <p className="text-xs text-amber-500">
                      Note : Ghana (GHS) et Nigeria (NGN) utiliseront la conversion automatique.
                    </p>
                  )}
                  {fixedAmount && selectedCodes.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Sélectionnez d'abord un pays pour saisir le montant.
                    </p>
                  )}
                </motion.div>
              )}
              {fixedAmount && selectedCodes.length === 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground italic"
                >
                  Sélectionnez d'abord un pays pour saisir le montant.
                </motion.p>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* ── Notification ── */}
          <SectionCard title="Notification par email" icon={<Mail className="w-4 h-4" />}>
            <p className="text-xs text-muted-foreground -mt-2">
              Recevez une notification à chaque paiement reçu via ce lien.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={notifEmail}
                onChange={e => setNotifEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-9 bg-muted/30 border-border"
              />
            </div>
          </SectionCard>

          {/* ── Paramètres avancés ── */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center justify-between w-full px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Paramètres avancés</span>
                {(redirectAfterPayment || collectBilling || paymentLimit || !displayShare || confirmMsg) && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Actifs
                  </span>
                )}
              </div>
              {showAdvanced
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border px-6 py-5 space-y-6">

                    {/* Message de confirmation */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Message de confirmation</label>
                      <p className="text-xs text-muted-foreground">Affiché au payeur après un paiement réussi.</p>
                      <Input
                        value={confirmMsg}
                        onChange={e => setConfirmMsg(e.target.value)}
                        placeholder="ex : Merci pour votre paiement !"
                        className="bg-muted/30 border-border"
                      />
                    </div>

                    <div className="border-t border-border/50" />

                    {/* Redirection après paiement */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Redirection après paiement</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Redirigez le client vers votre site après le paiement
                          </p>
                        </div>
                        <Toggle checked={redirectAfterPayment} onChange={v => { setRedirectAfterPayment(v); if (!v) setRedirectUrl(""); }} />
                      </div>
                      <AnimatePresence>
                        {redirectAfterPayment && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden space-y-1.5"
                          >
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
                            <p className="text-xs text-muted-foreground">
                              URL vers laquelle le client sera redirigé après confirmation du paiement.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="border-t border-border/50" />

                    {/* Collecte adresse de facturation */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Collecter l'adresse de facturation</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Demande l'adresse complète du payeur
                          </p>
                        </div>
                        <Toggle checked={collectBilling} onChange={setCollectBilling} />
                      </div>
                      <AnimatePresence>
                        {collectBilling && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                              <p className="text-xs text-muted-foreground font-medium">Champs à collecter :</p>
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
                                    <Input
                                      value={val}
                                      onChange={e => set(e.target.value)}
                                      placeholder={ph}
                                      className="pl-8 h-9 text-sm bg-white border-gray-200"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="border-t border-border/50" />

                    {/* Bouton de partage */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Afficher le bouton de partage</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Permet au payeur de partager le lien avec d'autres personnes
                        </p>
                      </div>
                      <Toggle checked={displayShare} onChange={setDisplayShare} />
                    </div>

                    <div className="border-t border-border/50" />

                    {/* Limite d'utilisations */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Limite d'utilisations</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Nombre maximum de paiements autorisés via ce lien
                          </p>
                        </div>
                        <Toggle checked={paymentLimit} onChange={setPaymentLimit} />
                      </div>
                      <AnimatePresence>
                        {paymentLimit && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <Input
                              type="number" min="1"
                              value={maxUses}
                              onChange={e => setMaxUses(e.target.value)}
                              placeholder="ex : 100"
                              className="bg-muted/30 border-border"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate("/dashboard/payment-links")}
              className="flex-1 py-3.5 rounded-2xl border border-border bg-card font-semibold text-sm hover:bg-muted/40 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-foreground text-background font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Créer le lien
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}
