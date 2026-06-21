import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, ArrowLeft,
  AlertTriangle, WrenchIcon, BanIcon, Globe, ChevronDown, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Brand data ───────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRY_META: Record<string, { name: string; flag: string; currency: string }> = {
  TG: { name: "Togo",          flag: "🇹🇬", currency: "XOF" },
  BJ: { name: "Bénin",         flag: "🇧🇯", currency: "XOF" },
  CM: { name: "Cameroun",      flag: "🇨🇲", currency: "XAF" },
  BF: { name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF" },
  ML: { name: "Mali",          flag: "🇲🇱", currency: "XOF" },
  SN: { name: "Sénégal",       flag: "🇸🇳", currency: "XOF" },
  CI: { name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
};

const OPERATOR_BRAND: Record<string, { bg: string; text: string; abbr: string; label: string; logo?: string }> = {
  "TMoney":           { bg: "#FFCC00", text: "#E60026", abbr: "TM",  label: "T-Money",      logo: `${BASE}/op-tmoney.png` },
  "Moov Money":       { bg: "#F06400", text: "#fff",    abbr: "MV",  label: "Moov Money",   logo: `${BASE}/op-moov.png` },
  "MTN Mobile Money": { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN MoMo",     logo: `${BASE}/op-mtn.png` },
  "MTN MoMo":         { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN MoMo",     logo: `${BASE}/op-mtn.png` },
  "MTN":              { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN",          logo: `${BASE}/op-mtn.png` },
  "Orange Money":     { bg: "#FF6600", text: "#fff",    abbr: "OM",  label: "Orange Money", logo: `${BASE}/op-orange-money.png` },
  "Wave":             { bg: "#1AC9FF", text: "#fff",    abbr: "WV",  label: "Wave",         logo: `${BASE}/op-wave.png` },
  "Wizall Money":     { bg: "#00BCD4", text: "#fff",    abbr: "WZ",  label: "Wizall Money", logo: `${BASE}/op-wizall.png` },
  "Wizall":           { bg: "#00BCD4", text: "#fff",    abbr: "WZ",  label: "Wizall Money", logo: `${BASE}/op-wizall.png` },
  "Vodacom":          { bg: "#E60000", text: "#fff",    abbr: "VC",  label: "Vodacom",      logo: `${BASE}/op-vodacom.png` },
  "Airtel":           { bg: "#E40000", text: "#fff",    abbr: "AT",  label: "Airtel Money", logo: `${BASE}/op-airtel.png` },
  "Airtel Money":     { bg: "#E40000", text: "#fff",    abbr: "AT",  label: "Airtel Money", logo: `${BASE}/op-airtel.png` },
};

// ── Translations ─────────────────────────────────────────────────────────────

type Lang = "fr" | "en";

const T = {
  fr: {
    poweredBy: "Propulsé par",
    langLabel: "Français",
    langSwitch: "English",
    youWantToPay: "Vous souhaitez envoyer un paiement",
    to: "À :",
    for: "Pour :",
    chooseCountry: "Choisissez un pays",
    selectCountry: "— Sélectionnez un pays —",
    youAreIn: (flag: string, name: string) => `Vous êtes au ${flag} ${name}`,
    chooseOperator: "Choisissez un opérateur",
    continue: "Continuer",
    back: "Retour",
    edit: "Modifier",
    payingVia: (op: string, country: string) => `Vous payez par ${op} ${country}`,
    yourNumber: (op: string) => `Votre numéro ${op.toUpperCase()}`,
    amount: "Montant",
    enterAmount: "Entrez le montant",
    yourName: "Votre Nom",
    yourNamePlaceholder: "John",
    emailLabel: "Entrez adresse email",
    confirmPayment: "Confirmer le paiement",
    summary: "Récapitulatif",
    recipient: "Destinataire",
    subject: "Objet",
    operator: "Opérateur",
    country: "Pays",
    number: "Numéro",
    name: "Nom",
    email: "Email",
    youPay: "Vous payez",
    feesCovered: "Les frais de service sont pris en charge par le marchand.",
    phoneNotification: "Vous recevrez une notification sur votre téléphone pour valider le paiement.",
    processing: "Traitement en cours\u2026",
    processingDesc: "Votre paiement est en cours de traitement, veuillez patienter.",
    pendingTitle: "En attente de confirmation",
    pendingDesc: (op: string) => `Un message a été envoyé sur votre téléphone. Confirmez le paiement via ${op} pour finaliser la transaction.`,
    checkPhone: "Vérifiez les notifications sur votre téléphone",
    enterPin: "Saisissez votre code PIN pour valider",
    autoUpdate: "Cette page se met à jour automatiquement",
    successTitle: "Paiement réussi !",
    successDesc: "Votre paiement a été traité avec succès.",
    paidTo: (merchant: string) => `payé à ${merchant}`,
    reference: "Référence",
    errorTitle: "Paiement échoué",
    retry: "Réessayer",
    invalidLink: "Lien invalide",
    linkExpired: "Lien expiré",
    linkDisabled: "Lien désactivé",
    linkUnavailable: "Ce lien de paiement n'est plus disponible.",
    maintenance: "Maintenance en cours",
    maintenanceDesc: (op: string) => `L'opérateur ${op} est temporairement indisponible.`,
    operatorUnavailable: "Opérateur indisponible",
    operatorUnavailableDesc: (op: string) => `L'opérateur ${op} n'est pas disponible pour le moment.`,
  },
  en: {
    poweredBy: "Powered by",
    langLabel: "English",
    langSwitch: "Français",
    youWantToPay: "You want to send a payment",
    to: "To:",
    for: "For:",
    chooseCountry: "Choose a country",
    selectCountry: "— Select a country —",
    youAreIn: (flag: string, name: string) => `You are in ${flag} ${name}`,
    chooseOperator: "Choose an operator",
    continue: "Continue",
    back: "Back",
    edit: "Edit",
    payingVia: (op: string, country: string) => `Paying via ${op} — ${country}`,
    yourNumber: (op: string) => `Your ${op} number`,
    amount: "Amount",
    enterAmount: "Enter amount",
    yourName: "Your Name",
    yourNamePlaceholder: "John",
    emailLabel: "Enter email address",
    confirmPayment: "Confirm payment",
    summary: "Summary",
    recipient: "Recipient",
    subject: "Subject",
    operator: "Operator",
    country: "Country",
    number: "Number",
    name: "Name",
    email: "Email",
    youPay: "You pay",
    feesCovered: "Service fees are covered by the merchant.",
    phoneNotification: "You will receive a notification on your phone to confirm the payment.",
    processing: "Processing\u2026",
    processingDesc: "Your payment is being processed, please wait.",
    pendingTitle: "Waiting for confirmation",
    pendingDesc: (op: string) => `A message was sent to your phone. Confirm the payment via ${op} to complete the transaction.`,
    checkPhone: "Check notifications on your phone",
    enterPin: "Enter your PIN code to confirm",
    autoUpdate: "This page updates automatically",
    successTitle: "Payment successful!",
    successDesc: "Your payment has been processed successfully.",
    paidTo: (merchant: string) => `paid to ${merchant}`,
    reference: "Reference",
    errorTitle: "Payment failed",
    retry: "Try again",
    invalidLink: "Invalid link",
    linkExpired: "Link expired",
    linkDisabled: "Link disabled",
    linkUnavailable: "This payment link is no longer available.",
    maintenance: "Maintenance in progress",
    maintenanceDesc: (op: string) => `Operator ${op} is temporarily unavailable.`,
    operatorUnavailable: "Operator unavailable",
    operatorUnavailableDesc: (op: string) => `Operator ${op} is not available at the moment.`,
  },
} satisfies Record<Lang, object>;

type Translations = typeof T.fr;

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

type Step = "select" | "form" | "confirm" | "processing" | "pending" | "success" | "error";

const STEP_NUMS: Record<Step, number> = {
  select: 1, form: 2, confirm: 3, processing: 4, pending: 4, success: 4, error: 4
};

// ── Operator button ──────────────────────────────────────────────────────────

function OperatorBtn({ name, selected, onClick }: { name: string; selected: boolean; onClick: () => void }) {
  const brand = OPERATOR_BRAND[name];
  const [imgOk, setImgOk] = useState(true);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl overflow-hidden flex items-center justify-center h-16 transition-all border-2",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-300"
      )}
      style={{ backgroundColor: brand?.bg ?? "#e5e7eb" }}
    >
      {brand?.logo && imgOk ? (
        <img
          src={brand.logo}
          alt={brand?.label ?? name}
          className="w-[80%] h-[80%] object-contain"
          onError={() => setImgOk(false)}
        />
      ) : (
        <span className="font-extrabold text-sm px-2 text-center leading-tight" style={{ color: brand?.text ?? "#111" }}>
          {brand?.label ?? name}
        </span>
      )}
    </button>
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {[1, 2, 3, 4].map((n, i) => (
        <div key={n} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
            n < current
              ? "bg-gray-800 border-gray-800 text-white"
              : n === current
              ? "bg-gray-900 border-gray-900 text-white"
              : "bg-white border-gray-300 text-gray-400"
          )}>
            {n < current ? <CheckCircle2 className="w-4 h-4" /> : n}
          </div>
          {i < 3 && (
            <div className={cn(
              "w-10 h-0.5 transition-all",
              n < current ? "bg-gray-800" : "bg-gray-200"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Divider with label ───────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ── Payment header ───────────────────────────────────────────────────────────

function PayHeader({ merchantName, title, description, t }: {
  merchantName: string; title: string; description?: string; t: Translations;
}) {
  return (
    <div className="mb-2">
      <p className="text-sm text-gray-600">{t.youWantToPay}</p>
      <p className="text-sm text-gray-800 mt-0.5">
        {t.to} <strong>{merchantName}</strong>
      </p>
      {(title || description) && (
        <p className="text-sm text-gray-600">
          {t.for} <em>{description || title}</em>
        </p>
      )}
    </div>
  );
}

// ── DrimPay logo ─────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center justify-center mb-5">
      <a href="/" target="_blank" rel="noopener noreferrer">
        <img src="/logo-drimpay.png" alt="DrimPay" className="h-9 w-auto object-contain" />
      </a>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer({ t, lang, onToggleLang }: { t: Translations; lang: Lang; onToggleLang: () => void }) {
  return (
    <div className="flex items-center justify-between mt-5 px-1">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
      >
        {t.poweredBy} <span className="font-semibold text-blue-600">DrimPay</span>
      </a>
      <button
        onClick={onToggleLang}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-all"
        title={`Switch to ${t.langSwitch}`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{t.langLabel}</span>
        <span className="text-gray-300 mx-0.5">|</span>
        <span className="text-gray-400">{t.langSwitch}</span>
      </button>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────

function Field({
  label, placeholder, value, onChange, type = "text",
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PayPage() {
  const [, params] = useRoute("/pay/:token");
  const token = params?.token ?? window.location.pathname.split("/pay/")[1]?.split("/")[0];

  const [lang, setLang]                   = useState<Lang>("fr");
  const t                                 = T[lang] as Translations;
  const toggleLang                        = () => setLang(l => l === "fr" ? "en" : "fr");

  const [link, setLink]                   = useState<LinkData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [step, setStep]                   = useState<Step>("select");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [phone, setPhone]                 = useState("");
  const [amount, setAmount]               = useState("");
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [error, setError]                 = useState("");
  const [txRef, setTxRef]                 = useState("");
  const [attemptId, setAttemptId]         = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/pay/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); }
        else {
          setLink(d);
          if (d.amount) setAmount(d.amount);
          const firstCountry = d.countries?.[0];
          if (!d.isMultiCountry || d.countries?.length === 1) {
            setSelectedCountry(firstCountry?.code ?? d.countryCode);
          }
        }
      })
      .catch(() => setError("Lien introuvable"))
      .finally(() => setLoading(false));
  }, [token]);

  const currentCountryData = link?.countries.find(c => c.code === selectedCountry);
  const currency           = currentCountryData?.currency ?? link?.currency ?? "XOF";
  const displayAmount      = parseFloat(amount || "0");
  const operatorLabel      = OPERATOR_BRAND[selectedOperator]?.label ?? selectedOperator;
  const countryMeta        = COUNTRY_META[selectedCountry];
  const stepNum            = STEP_NUMS[step];

  const canGoToForm = selectedCountry && selectedOperator;
  const canSubmit   = phone.length >= 8 && displayAmount > 0;

  const handleGoToForm = () => {
    if (!canGoToForm) return;
    setError("");
    setStep("form");
  };

  const logAttempt = async (): Promise<number | null> => {
    try {
      const r = await fetch(`${BASE}/api/pay/${token}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          amount: parseFloat(amount) || undefined,
          name: name || undefined,
          email: email || undefined,
          countryCode: selectedCountry || undefined,
          operator: selectedOperator || undefined,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        return d.attemptId ?? null;
      }
    } catch { /* silencieux */ }
    return null;
  };

  const updateAttempt = async (id: number, status: string, transactionReference?: string) => {
    try {
      await fetch(`${BASE}/api/pay/${token}/attempt/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, transactionReference }),
      });
    } catch { /* silencieux */ }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    const id = await logAttempt();
    setAttemptId(id);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("processing");
    if (attemptId) await updateAttempt(attemptId, "confirmed");
    try {
      const r = await fetch(`${BASE}/api/pay/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          amount: parseFloat(amount),
          countryCode: selectedCountry,
          operator: selectedOperator,
          customerName: name || undefined,
          customerEmail: email || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (attemptId) await updateAttempt(attemptId, "failed");
        setError(data.message ?? data.error ?? "Paiement échoué");
        setStep("error");
        return;
      }
      setTxRef(data.reference);
      if (data.status === "success" || data.status === "completed") {
        if (attemptId) await updateAttempt(attemptId, "success", data.reference);
        setStep("success");
      } else {
        setStep("pending");
      }
    } catch {
      if (attemptId) await updateAttempt(attemptId, "failed");
      setError("Erreur réseau. Veuillez réessayer.");
      setStep("error");
    }
  };

  // ── Poll transaction status while in "pending" state ─────────────────────
  useEffect(() => {
    if (step !== "pending" || !txRef) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 36; // 36 × 5s = 3 minutes
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const r = await fetch(`${BASE}/api/pay/status/${txRef}`);
        if (!r.ok) return;
        const d = await r.json();
        const s: string = d.status ?? "";
        if (s === "success" || s === "completed") {
          stopped = true;
          if (attemptId) await updateAttempt(attemptId, "success", txRef);
          setStep("success");
        } else if (s === "failed" || s === "cancelled" || s === "expired") {
          stopped = true;
          if (attemptId) await updateAttempt(attemptId, "failed");
          setError(d.failureReason ?? "Paiement annulé ou échoué. Veuillez réessayer.");
          setStep("error");
        }
      } catch { /* ignore, keep polling */ }

      attempts++;
      if (!stopped && attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 5000);
      } else if (!stopped && attempts >= MAX_ATTEMPTS) {
        if (attemptId) await updateAttempt(attemptId, "failed");
        setError("Délai dépassé. Si vous avez confirmé, vérifiez votre historique de transactions.");
        setStep("error");
      }
    };

    const timeout = setTimeout(poll, 5000);
    return () => { stopped = true; clearTimeout(timeout); };
  }, [step, txRef]);

  // ── States: loading / invalid link / inactive ──────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  const footerProps = { t, lang, onToggleLang: toggleLang };

  if (error && !link) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <Logo />
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{t.invalidLink}</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Footer {...footerProps} />
        </div>
      </div>
    );
  }

  if (link?.status !== "active") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <Logo />
          <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-yellow-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            {link?.status === "expired" ? t.linkExpired : t.linkDisabled}
          </h1>
          <p className="text-sm text-gray-500">{t.linkUnavailable}</p>
          <Footer {...footerProps} />
        </div>
      </div>
    );
  }

  if (!link?.isMultiCountry && link?.operatorMaintenance) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <Logo />
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <WrenchIcon className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{t.maintenance}</h1>
          <p className="text-sm text-gray-500">{t.maintenanceDesc(link.operator)}</p>
          <Footer {...footerProps} />
        </div>
      </div>
    );
  }

  if (!link?.isMultiCountry && link?.operatorActive === false) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <Logo />
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <BanIcon className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">{t.operatorUnavailable}</h1>
          <p className="text-sm text-gray-500">{t.operatorUnavailableDesc(link.operator)}</p>
          <Footer {...footerProps} />
        </div>
      </div>
    );
  }

  // ── Main payment flow ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 pt-6 pb-5">

            <Logo />
            <StepBar current={stepNum} />

            <AnimatePresence mode="wait">

              {/* ── Step 1: Country + Operator ── */}
              {step === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <PayHeader
                    merchantName={link?.merchantName ?? ""}
                    title={link?.title ?? ""}
                    description={link?.description}
                    t={t}
                  />

                  {/* Country selector */}
                  {link?.isMultiCountry && link.countries.length > 1 ? (
                    <>
                      <Divider label={t.chooseCountry} />
                      <div className="relative">
                        <select
                          value={selectedCountry}
                          onChange={e => { setSelectedCountry(e.target.value); setSelectedOperator(""); }}
                          className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                          <option value="">{t.selectCountry}</option>
                          {link.countries.map(c => (
                            <option key={c.code} value={c.code}>
                              {COUNTRY_META[c.code]?.flag} {COUNTRY_META[c.code]?.name ?? c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </>
                  ) : (
                    <Divider label={t.youAreIn(countryMeta?.flag ?? "", countryMeta?.name ?? selectedCountry)} />
                  )}

                  {/* Operator buttons */}
                  {selectedCountry && currentCountryData && (
                    <>
                      <Divider label={t.chooseOperator} />
                      <div className={cn(
                        "grid gap-3",
                        currentCountryData.operators.length === 1 ? "grid-cols-1" : "grid-cols-2"
                      )}>
                        {currentCountryData.operators.map(op => (
                          <OperatorBtn
                            key={op}
                            name={op}
                            selected={selectedOperator === op}
                            onClick={() => setSelectedOperator(op)}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* CTA */}
                  {selectedCountry && (
                    <button
                      onClick={handleGoToForm}
                      disabled={!canGoToForm}
                      className={cn(
                        "w-full mt-5 h-12 rounded-lg font-bold text-sm uppercase tracking-wide transition-all",
                        canGoToForm
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      {t.continue}
                    </button>
                  )}
                </motion.div>
              )}

              {/* ── Step 2: Form ── */}
              {step === "form" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => setStep("select")}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t.back}
                  </button>

                  <PayHeader
                    merchantName={link?.merchantName ?? ""}
                    title={link?.title ?? ""}
                    description={link?.description}
                    t={t}
                  />

                  <Divider label={t.payingVia(operatorLabel, countryMeta?.name ?? "")} />

                  {/* Phone */}
                  <Field
                    label={t.yourNumber(operatorLabel)}
                    placeholder="XXXXXXXX"
                    value={phone}
                    onChange={setPhone}
                    type="tel"
                  />

                  {/* Amount */}
                  {link?.fixedAmount ? (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">{t.amount}</label>
                      <div className="h-12 px-4 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-gray-900 font-bold">
                          {parseFloat(link.amount ?? "0").toLocaleString("fr-FR")}
                        </span>
                        <span className="text-gray-500 text-sm">{currency}</span>
                      </div>
                    </div>
                  ) : (
                    <Field
                      label={t.enterAmount}
                      placeholder="0"
                      value={amount}
                      onChange={setAmount}
                      type="number"
                    />
                  )}

                  {/* Name */}
                  <Field
                    label={t.yourName}
                    placeholder={t.yourNamePlaceholder}
                    value={name}
                    onChange={setName}
                  />

                  {/* Email */}
                  <Field
                    label={t.emailLabel}
                    placeholder="email@example.com"
                    value={email}
                    onChange={setEmail}
                    type="email"
                  />

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={cn(
                      "w-full h-12 rounded-lg font-bold text-sm uppercase tracking-wide transition-all",
                      canSubmit
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {t.confirmPayment}
                  </button>
                </motion.div>
              )}

              {/* ── Step 3: Confirm ── */}
              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => setStep("form")}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> {t.edit}
                  </button>

                  <h2 className="text-base font-bold text-gray-900 mb-4">{t.summary}</h2>

                  <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 mb-4">
                    {[
                      { label: t.recipient, value: link?.merchantName ?? "" },
                      { label: t.subject,   value: link?.description ?? link?.title ?? "" },
                      { label: t.operator,  value: operatorLabel },
                      { label: t.country,   value: `${countryMeta?.flag ?? ""} ${countryMeta?.name ?? selectedCountry}` },
                      { label: t.number,    value: phone },
                      ...(name  ? [{ label: t.name,  value: name }]  : []),
                      ...(email ? [{ label: t.email, value: email }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-gray-900 text-right max-w-[55%] break-all">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-gray-50">
                      <span className="font-bold text-gray-900">{t.youPay}</span>
                      <span className="font-extrabold text-gray-900">{displayAmount.toLocaleString("fr-FR")} {currency}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center mb-4">
                    {t.feesCovered}
                  </p>

                  <p className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg px-4 py-3 mb-4">
                    {t.phoneNotification}
                  </p>

                  <button
                    onClick={handleConfirm}
                    className="w-full h-12 rounded-lg font-bold text-sm uppercase tracking-wide bg-gray-900 text-white hover:bg-gray-800 transition-all"
                  >
                    {t.confirmPayment}
                  </button>
                </motion.div>
              )}

              {/* ── Step 4: Processing (API call in flight) ── */}
              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin mx-auto mb-5" />
                  <h2 className="text-base font-bold text-gray-900 mb-2">{t.processing}</h2>
                  <p className="text-sm text-gray-500">{t.processingDesc}</p>
                </motion.div>
              )}

              {/* ── Step 4: Pending (awaiting phone confirmation) ── */}
              {step === "pending" && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin mx-auto mb-5" />
                  <h2 className="text-base font-bold text-gray-900 mb-2">{t.pendingTitle}</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {t.pendingDesc(operatorLabel)}
                  </p>
                  <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700 text-left space-y-1">
                    <p>{t.checkPhone}</p>
                    <p>{t.enterPin}</p>
                    <p className="text-blue-400">{t.autoUpdate}</p>
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: Success ── */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">{t.successTitle}</h2>
                  <p className="text-sm text-gray-500 mb-5">{t.successDesc}</p>
                  <div className="text-3xl font-extrabold text-green-600 mb-1">
                    {displayAmount.toLocaleString("fr-FR")} {currency}
                  </div>
                  <p className="text-xs text-gray-400 mb-5">{t.paidTo(link?.merchantName ?? "")}</p>
                  {txRef && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 inline-block">
                      <p className="text-xs text-gray-400 mb-1">{t.reference}</p>
                      <code className="font-mono text-sm font-bold text-gray-800">{txRef}</code>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Step 4: Error ── */}
              {step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mb-2">{t.errorTitle}</h2>
                  <p className="text-sm text-gray-500 mb-5">{error}</p>
                  <button
                    onClick={() => { setError(""); setStep("form"); }}
                    className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    {t.retry}
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer inside the card */}
          <div className="px-6 pb-5">
            <Footer {...footerProps} />
          </div>
        </div>
      </div>
    </div>
  );
}
