import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, XCircle, Clock, ArrowLeft,
  Smartphone, AlertTriangle, Lock, WrenchIcon, BanIcon, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Data ────────────────────────────────────────────────────────────────────

type CountryInfo = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  operators: string[];
};

const COUNTRY_META: Record<string, Omit<CountryInfo, "code" | "operators">> = {
  TG: { name: "Togo",          flag: "🇹🇬", currency: "XOF" },
  BJ: { name: "Bénin",         flag: "🇧🇯", currency: "XOF" },
  CM: { name: "Cameroun",      flag: "🇨🇲", currency: "XAF" },
  BF: { name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF" },
  ML: { name: "Mali",          flag: "🇲🇱", currency: "XOF" },
  SN: { name: "Sénégal",       flag: "🇸🇳", currency: "XOF" },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  GH: { name: "Ghana",         flag: "🇬🇭", currency: "GHS" },
  NG: { name: "Nigeria",       flag: "🇳🇬", currency: "NGN" },
};

// Operator brand colors and abbreviations
const OPERATOR_BRAND: Record<string, { bg: string; text: string; abbr: string; label: string }> = {
  "TMoney":           { bg: "#E60026", text: "#fff",    abbr: "TM",  label: "T-Money" },
  "Moov Money":       { bg: "#003087", text: "#fff",    abbr: "MV",  label: "Moov" },
  "MTN Mobile Money": { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN MoMo" },
  "MTN MoMo":         { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN MoMo" },
  "MTN Ghana":        { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN Ghana" },
  "MTN Nigeria":      { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN Nigeria" },
  "MTN":              { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN" },
  "Orange Money":     { bg: "#FF6600", text: "#fff",    abbr: "OM",  label: "Orange Money" },
  "Wave":             { bg: "#1AC9FF", text: "#fff",    abbr: "WV",  label: "Wave" },
  "Vodafone Ghana":   { bg: "#E60000", text: "#fff",    abbr: "VF",  label: "Vodafone" },
  "Airtel Nigeria":   { bg: "#E40000", text: "#fff",    abbr: "AT",  label: "Airtel" },
};

// ── Types ────────────────────────────────────────────────────────────────────

type LinkData = {
  title: string;
  description?: string;
  amount?: string;
  currency: string;
  countryCode: string;
  operator: string;
  fixedAmount: boolean;
  merchantName: string;
  status: "active" | "inactive" | "expired";
  isMultiCountry: boolean;
  countries: { code: string; currency: string; operators: string[] }[];
  operatorActive?: boolean;
  operatorMaintenance?: boolean;
};

type Step = "country" | "operator" | "form" | "confirm" | "processing" | "success" | "error";

// ── Sub-components ───────────────────────────────────────────────────────────

function OperatorLogo({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const brand = OPERATOR_BRAND[name];
  const sizes = { sm: "w-10 h-10 text-xs", md: "w-14 h-14 text-sm", lg: "w-16 h-16 text-base" };
  if (!brand) {
    return (
      <div className={cn("rounded-2xl flex items-center justify-center font-bold bg-muted text-muted-foreground shrink-0", sizes[size])}>
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className={cn("rounded-2xl flex items-center justify-center font-extrabold shrink-0 shadow-sm", sizes[size])}
      style={{ backgroundColor: brand.bg, color: brand.text }}
    >
      {brand.abbr}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function PayPage() {
  const [, params] = useRoute("/pay/:token");
  const token = params?.token ?? window.location.pathname.split("/pay/")[1]?.split("/")[0];

  const [link, setLink] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("country");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [txRef, setTxRef] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/pay/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); }
        else {
          setLink(d);
          if (d.amount) setAmount(d.amount);
          // If single country, auto-select it
          if (!d.isMultiCountry || d.countries.length === 1) {
            const code = d.countries[0]?.code ?? d.countryCode;
            setSelectedCountry(code);
            setStep("operator");
          }
        }
      })
      .catch(() => setError("Lien introuvable"))
      .finally(() => setLoading(false));
  }, [token]);

  const currentCountryData = link?.countries.find(c => c.code === selectedCountry);
  const currency = currentCountryData?.currency ?? link?.currency ?? "XOF";
  const displayAmount = parseFloat(amount || "0");
  const fee = Math.round(displayAmount * 0.03 * 100) / 100;
  const total = displayAmount + fee;

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    setSelectedOperator("");
    setStep("operator");
  };

  const handleSelectOperator = (op: string) => {
    setSelectedOperator(op);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!phone || phone.length < 8) { setError("Numéro de téléphone invalide"); return; }
    if (!amount || displayAmount <= 0) { setError("Montant invalide"); return; }
    setError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("processing");
    try {
      const r = await fetch(`/api/pay/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          amount: parseFloat(amount),
          countryCode: selectedCountry,
          operator: selectedOperator,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Paiement échoué"); setStep("error"); return; }
      setTxRef(data.reference);
      setStep("success");
    } catch {
      setError("Erreur réseau. Réessayez.");
      setStep("error");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Error / Inactive ─────────────────────────────────────────────────────

  if (error && !link) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Link href="/fr">
            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (link?.status !== "active") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Lien {link?.status === "expired" ? "expiré" : "désactivé"}</h1>
          <p className="text-muted-foreground text-sm">Ce lien de paiement n'est plus disponible.</p>
        </div>
      </div>
    );
  }

  // Legacy single-operator states
  if (!link?.isMultiCountry && link?.operatorMaintenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-3xl shadow-xl p-10">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-400/30 flex items-center justify-center mx-auto mb-6 relative">
              <WrenchIcon className="w-10 h-10 text-amber-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                <span className="text-black text-xs font-bold">!</span>
              </span>
            </div>
            <DrimPayLogo />
            <h1 className="text-2xl font-extrabold mb-3">Maintenance en cours</h1>
            <p className="text-muted-foreground text-sm mb-8">
              L'opérateur <span className="font-semibold text-foreground">{link.operator}</span> est temporairement indisponible.
            </p>
            <Footer />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!link?.isMultiCountry && link?.operatorActive === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-3xl shadow-xl p-10">
            <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-400/30 flex items-center justify-center mx-auto mb-6">
              <BanIcon className="w-10 h-10 text-red-400" />
            </div>
            <DrimPayLogo />
            <h1 className="text-2xl font-extrabold mb-3">Opérateur indisponible</h1>
            <p className="text-muted-foreground text-sm mb-8">
              L'opérateur <span className="font-semibold text-foreground">{link.operator}</span> n'est pas disponible pour le moment.
            </p>
            <Footer />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Payment Flow ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <DrimPayLogo />
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Lock className="w-3 h-3" /> Paiement sécurisé
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP: Country ── */}
          {step === "country" && (
            <motion.div
              key="country"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-6 py-5">
                <p className="text-xs text-muted-foreground mb-1">Demande de paiement de</p>
                <p className="font-bold text-foreground">{link?.merchantName}</p>
                <h1 className="text-xl font-extrabold mt-2">{link?.title}</h1>
                {link?.description && <p className="text-sm text-muted-foreground mt-1">{link.description}</p>}
              </div>

              <div className="px-6 py-5">
                <p className="text-sm font-semibold mb-4">Sélectionnez votre pays</p>
                <div className="grid grid-cols-2 gap-3">
                  {link?.countries.map(c => {
                    const meta = COUNTRY_META[c.code];
                    if (!meta) return null;
                    return (
                      <button
                        key={c.code}
                        onClick={() => handleSelectCountry(c.code)}
                        className="flex items-center gap-3 p-3 rounded-2xl border-2 border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                      >
                        <span className="text-3xl leading-none">{meta.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{meta.name}</p>
                          <p className="text-xs text-muted-foreground">{c.currency}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: Operator ── */}
          {step === "operator" && (
            <motion.div
              key="operator"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-6 py-5">
                <button
                  onClick={() => link?.isMultiCountry && link.countries.length > 1 ? setStep("country") : undefined}
                  className={cn(
                    "flex items-center gap-1.5 text-xs text-muted-foreground mb-3",
                    link?.isMultiCountry && link.countries.length > 1 ? "hover:text-foreground cursor-pointer" : "cursor-default"
                  )}
                >
                  {link?.isMultiCountry && link.countries.length > 1 && <ArrowLeft className="w-3 h-3" />}
                  <span>{COUNTRY_META[selectedCountry]?.flag} {COUNTRY_META[selectedCountry]?.name}</span>
                </button>
                <p className="text-xs text-muted-foreground mb-1">Demande de paiement de</p>
                <p className="font-bold text-foreground">{link?.merchantName}</p>
                <h1 className="text-xl font-extrabold mt-1">{link?.title}</h1>
              </div>

              <div className="px-6 py-5">
                <p className="text-sm font-semibold mb-4">Choisissez votre opérateur</p>
                <div className="space-y-3">
                  {(currentCountryData?.operators ?? []).map(op => {
                    const brand = OPERATOR_BRAND[op];
                    return (
                      <button
                        key={op}
                        onClick={() => handleSelectOperator(op)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                      >
                        <OperatorLogo name={op} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{brand?.label ?? op}</p>
                          <p className="text-xs text-muted-foreground">Mobile Money · {currency}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: Form ── */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-6 py-5">
                <button
                  onClick={() => setStep("operator")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
                >
                  <ArrowLeft className="w-3 h-3" /> Changer d'opérateur
                </button>
                <p className="text-xs text-muted-foreground mb-1">Demande de paiement de</p>
                <p className="font-bold text-foreground">{link?.merchantName}</p>
                <h1 className="text-xl font-extrabold mt-1">{link?.title}</h1>
                {link?.description && <p className="text-sm text-muted-foreground mt-1">{link.description}</p>}
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Selected operator chip */}
                <div className="flex items-center gap-3 bg-muted/30 rounded-2xl px-4 py-3 border border-border">
                  <OperatorLogo name={selectedOperator} size="sm" />
                  <div>
                    <p className="text-sm font-bold">{OPERATOR_BRAND[selectedOperator]?.label ?? selectedOperator}</p>
                    <p className="text-xs text-muted-foreground">
                      {COUNTRY_META[selectedCountry]?.flag} {COUNTRY_META[selectedCountry]?.name} · Mobile Money
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label>Numéro de téléphone</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-12 text-base"
                      placeholder="+221 77 000 0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      type="tel"
                    />
                  </div>
                </div>

                {/* Amount */}
                {!link?.fixedAmount ? (
                  <div className="space-y-1.5">
                    <Label>Montant ({currency})</Label>
                    <div className="relative">
                      <Input
                        className="h-12 text-base pr-16 font-bold"
                        placeholder="5 000"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        type="number"
                        min="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">{currency}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Montant à payer</p>
                    <p className="text-3xl font-extrabold text-foreground">{parseFloat(link?.amount ?? "0").toLocaleString("fr-FR")}</p>
                    <p className="text-sm text-muted-foreground">{currency}</p>
                  </div>
                )}

                {/* Fee breakdown */}
                {displayAmount > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 rounded-xl px-3 py-2.5">
                    <div className="flex justify-between"><span>Montant</span><span>{displayAmount.toLocaleString("fr-FR")} {currency}</span></div>
                    <div className="flex justify-between"><span>Frais (3%)</span><span>{fee.toLocaleString("fr-FR")} {currency}</span></div>
                    <div className="flex justify-between font-bold text-foreground border-t border-border/50 pt-1 mt-1">
                      <span>Total</span><span>{total.toLocaleString("fr-FR")} {currency}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                  </div>
                )}

                <Button className="w-full h-12 font-bold text-base gap-2" onClick={handleSubmit}>
                  <Shield className="w-4 h-4" /> Payer maintenant
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: Confirm ── */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="bg-card border border-border rounded-3xl shadow-xl p-6"
            >
              <button onClick={() => setStep("form")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4" /> Modifier
              </button>
              <h2 className="text-xl font-bold mb-5">Confirmer le paiement</h2>

              <div className="space-y-3 mb-6">
                {[
                  { label: "Destinataire",  value: link?.merchantName },
                  { label: "Objet",         value: link?.title },
                  { label: "Numéro",        value: phone },
                  { label: "Pays",          value: `${COUNTRY_META[selectedCountry]?.flag} ${COUNTRY_META[selectedCountry]?.name}` },
                  { label: "Opérateur",     value: OPERATOR_BRAND[selectedOperator]?.label ?? selectedOperator },
                  { label: "Montant",       value: `${displayAmount.toLocaleString("fr-FR")} ${currency}` },
                  { label: "Frais (3%)",    value: `${fee.toLocaleString("fr-FR")} ${currency}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm border-b border-border/40 pb-2 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-extrabold pt-1">
                  <span>Total débité</span>
                  <span className="text-primary">{total.toLocaleString("fr-FR")} {currency}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mb-4 bg-muted/20 rounded-xl px-4 py-3">
                📱 Vous allez recevoir une notification sur votre téléphone pour valider le paiement.
              </p>

              <Button className="w-full h-12 font-bold text-base" onClick={handleConfirm}>
                Confirmer le paiement
              </Button>
            </motion.div>
          )}

          {/* ── STEP: Processing ── */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl shadow-xl p-10 text-center"
            >
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-2">Traitement en cours...</h2>
              <p className="text-sm text-muted-foreground">
                Vérifiez votre téléphone pour confirmer le paiement via{" "}
                <span className="font-semibold text-foreground">{OPERATOR_BRAND[selectedOperator]?.label ?? selectedOperator}</span>.
              </p>
            </motion.div>
          )}

          {/* ── STEP: Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl shadow-xl p-10 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-extrabold mb-2 text-foreground">Paiement réussi !</h2>
              <p className="text-muted-foreground text-sm mb-6">Votre paiement a été traité avec succès.</p>
              <div className="bg-muted/30 rounded-xl px-4 py-3 mb-6">
                <p className="text-xs text-muted-foreground mb-1">Référence</p>
                <code className="font-mono text-sm font-bold text-foreground">{txRef}</code>
              </div>
              <div className="text-3xl font-extrabold text-green-400 mb-1">{displayAmount.toLocaleString("fr-FR")} {currency}</div>
              <p className="text-xs text-muted-foreground">payé à {link?.merchantName}</p>
            </motion.div>
          )}

          {/* ── STEP: Error ── */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl shadow-xl p-10 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Paiement échoué</h2>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button className="w-full" variant="outline" onClick={() => { setError(""); setStep("form"); }}>
                Réessayer
              </Button>
            </motion.div>
          )}

        </AnimatePresence>

        <Footer />
      </div>
    </div>
  );
}

// ── Shared small components ──────────────────────────────────────────────────

function DrimPayLogo() {
  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-black font-bold text-sm">D</span>
      </div>
      <span className="font-bold text-lg tracking-tight">DrimPay</span>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-center text-xs text-muted-foreground mt-6">
      Propulsé par <span className="font-semibold text-foreground">DrimPay</span> · Infrastructure de paiement sécurisée
    </p>
  );
}
