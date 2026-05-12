import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle,
  Globe, ChevronDown, QrCode, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRY_META: Record<string, { name: string; flag: string; currency: string }> = {
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

const OPERATOR_BRAND: Record<string, { bg: string; text: string; abbr: string; label: string; logo?: string }> = {
  "TMoney":           { bg: "#FFCC00", text: "#E60026", abbr: "TM",  label: "T-Money",      logo: `${BASE}/op-tmoney.png` },
  "Moov Money":       { bg: "#F06400", text: "#fff",    abbr: "MV",  label: "Moov Money",   logo: `${BASE}/op-moov.png` },
  "MTN Mobile Money": { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN MoMo",     logo: `${BASE}/op-mtn.png` },
  "MTN MoMo":         { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN MoMo",     logo: `${BASE}/op-mtn.png` },
  "MTN Ghana":        { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN Ghana",    logo: `${BASE}/op-mtn.png` },
  "MTN Nigeria":      { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN Nigeria",  logo: `${BASE}/op-mtn.png` },
  "MTN":              { bg: "#FFCC00", text: "#1a1a1a", abbr: "MTN", label: "MTN",          logo: `${BASE}/op-mtn.png` },
  "Orange Money":     { bg: "#FF6600", text: "#fff",    abbr: "OM",  label: "Orange Money", logo: `${BASE}/op-orange-money.png` },
  "Wave":             { bg: "#1AC9FF", text: "#fff",    abbr: "WV",  label: "Wave",         logo: `${BASE}/op-wave.png` },
  "Wizall Money":     { bg: "#00BCD4", text: "#fff",    abbr: "WZ",  label: "Wizall Money", logo: `${BASE}/op-wizall.png` },
  "Vodafone Ghana":   { bg: "#E60000", text: "#fff",    abbr: "VF",  label: "Vodafone",     logo: `${BASE}/op-vodacom.png` },
  "Airtel Nigeria":   { bg: "#E40000", text: "#fff",    abbr: "AT",  label: "Airtel",       logo: `${BASE}/op-airtel.png` },
};

type QrData = {
  reference: string;
  name: string;
  description?: string;
  merchantName: string;
  currency: string;
  type: "fixed" | "flexible";
  amount?: string;
  status: "active" | "inactive";
  defaultCountry?: string;
  countries: { code: string; currency: string; operators: string[] }[];
};

type Step = "select" | "form" | "confirm" | "processing" | "success" | "error";

const STEP_NUMS: Record<Step, number> = {
  select: 1, form: 2, confirm: 3, processing: 4, success: 4, error: 4,
};

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

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {[1, 2, 3, 4].map((n, i) => (
        <div key={n} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
            n < current ? "bg-gray-800 border-gray-800 text-white"
              : n === current ? "bg-gray-900 border-gray-900 text-white"
              : "bg-white border-gray-300 text-gray-400"
          )}>
            {n < current ? <CheckCircle2 className="w-4 h-4" /> : n}
          </div>
          {i < 3 && (
            <div className={cn("w-10 h-0.5 transition-all", n < current ? "bg-gray-800" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center justify-center mb-5">
      <a href="/" target="_blank" rel="noopener noreferrer">
        <img src="/logo-drimpay.png" alt="DrimPay" className="h-9 w-auto object-contain" />
      </a>
    </div>
  );
}

function Footer() {
  return (
    <div className="flex items-center justify-between mt-5 px-1">
      <a href="/" target="_blank" rel="noopener noreferrer"
        className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
        Powered By <span className="font-semibold text-blue-600">DrimPay</span>
      </a>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 select-none">
        <Globe className="w-3.5 h-3.5" />
        <span>Français</span>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }: {
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

export default function QrPayPage() {
  const reference = window.location.pathname.split("/qr/")[1]?.split("/")[0];

  const [qr, setQr]                         = useState<QrData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [step, setStep]                     = useState<Step>("select");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedOperator, setSelectedOperator] = useState("");
  const [phone, setPhone]                   = useState("");
  const [amount, setAmount]                 = useState("");
  const [error, setError]                   = useState("");
  const [txRef, setTxRef]                   = useState("");
  const [isSandbox, setIsSandbox]           = useState(false);

  useEffect(() => {
    if (!reference) return;
    fetch(`${BASE}/api/qr/${reference}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          setQr(d);
          if (d.amount) setAmount(d.amount);
          if (d.defaultCountry && d.countries?.some((c: any) => c.code === d.defaultCountry)) {
            setSelectedCountry(d.defaultCountry);
          } else if (d.countries?.length === 1) {
            setSelectedCountry(d.countries[0].code);
          }
        }
      })
      .catch(() => setError("QR code introuvable"))
      .finally(() => setLoading(false));
  }, [reference]);

  const currentCountryData = qr?.countries.find(c => c.code === selectedCountry);
  const currency           = currentCountryData?.currency ?? qr?.currency ?? "XOF";
  const displayAmount      = parseFloat(amount || "0");
  const platformFee        = Math.round(displayAmount * 0.03 * 100) / 100;
  const merchantNet        = Math.round((displayAmount - platformFee) * 100) / 100;
  const operatorLabel      = OPERATOR_BRAND[selectedOperator]?.label ?? selectedOperator;
  const countryMeta        = COUNTRY_META[selectedCountry];
  const stepNum            = STEP_NUMS[step];

  const canGoToForm = selectedCountry && selectedOperator;
  const canSubmit   = phone.length >= 8 && displayAmount > 0;

  const handleConfirm = async () => {
    setStep("processing");
    try {
      const r = await fetch(`${BASE}/api/qr/${reference}`, {
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
      if (!r.ok) {
        setError(data.error ?? "Paiement échoué");
        setStep("error");
        return;
      }
      setTxRef(data.reference);
      setIsSandbox(!!data._sandbox);
      setStep("success");
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setStep("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error && !qr) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <Logo />
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">QR invalide</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Footer />
        </div>
      </div>
    );
  }

  if (qr?.status !== "active") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <Logo />
          <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-yellow-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">QR désactivé</h1>
          <p className="text-sm text-gray-500">Ce code QR de paiement n'est plus disponible.</p>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 pt-6 pb-5">
            <Logo />
            <StepBar current={stepNum} />

            <AnimatePresence mode="wait">

              {step === "select" && (
                <motion.div key="select" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Paiement à</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{qr?.merchantName}</p>
                    {qr?.name && <p className="text-sm text-gray-500 mt-0.5">Pour : <em>{qr.name}</em></p>}
                    {qr?.description && <p className="text-xs text-gray-400 mt-0.5">{qr.description}</p>}
                  </div>

                  {qr && qr.countries.length > 1 ? (
                    <>
                      <Divider label="Choisissez un pays" />
                      <div className="relative">
                        <select
                          value={selectedCountry}
                          onChange={e => { setSelectedCountry(e.target.value); setSelectedOperator(""); }}
                          className="w-full h-12 px-4 pr-10 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                          <option value="">— Sélectionnez un pays —</option>
                          {qr.countries.map(c => (
                            <option key={c.code} value={c.code}>
                              {COUNTRY_META[c.code]?.flag} {COUNTRY_META[c.code]?.name ?? c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </>
                  ) : selectedCountry ? (
                    <Divider label={`${countryMeta?.flag ?? ""} ${countryMeta?.name ?? selectedCountry}`} />
                  ) : null}

                  {selectedCountry && currentCountryData && (
                    <>
                      <Divider label="Choisissez un opérateur" />
                      <div className={cn("grid gap-3", currentCountryData.operators.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                        {currentCountryData.operators.map(op => (
                          <OperatorBtn key={op} name={op} selected={selectedOperator === op} onClick={() => setSelectedOperator(op)} />
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => { if (canGoToForm) { setError(""); setStep("form"); } }}
                    disabled={!canGoToForm}
                    className="w-full h-12 mt-5 rounded-xl bg-gray-900 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 active:bg-gray-950 transition-colors"
                  >
                    Continuer
                  </button>
                </motion.div>
              )}

              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setStep("select")} className="text-gray-400 hover:text-gray-700 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <p className="text-sm font-medium text-gray-700">
                      {OPERATOR_BRAND[selectedOperator]?.label ?? selectedOperator} — {countryMeta?.name}
                    </p>
                  </div>

                  <Field label="Numéro Mobile Money *" placeholder="+228 90 000 000" value={phone} onChange={setPhone} type="tel" />

                  {qr?.type === "flexible" ? (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1.5">Montant *</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="5000"
                          className="w-full h-12 px-4 pr-16 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{currency}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-sm text-gray-600">Montant</span>
                      <span className="text-base font-bold text-gray-900">{displayAmount.toLocaleString("fr-FR")} {currency}</span>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                  )}

                  <button
                    onClick={() => { if (canSubmit) { setError(""); setStep("confirm"); } }}
                    disabled={!canSubmit}
                    className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Continuer
                  </button>
                </motion.div>
              )}

              {step === "confirm" && (
                <motion.div key="confirm" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setStep("form")} className="text-gray-400 hover:text-gray-700 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <p className="text-sm font-medium text-gray-700">Récapitulatif</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                    {[
                      { label: "Marchand",  value: qr?.merchantName ?? "" },
                      { label: "QR",         value: qr?.name ?? "" },
                      { label: "Montant",    value: `${displayAmount.toLocaleString("fr-FR")} ${currency}` },
                      { label: "Frais (3%)", value: `${platformFee.toLocaleString("fr-FR")} ${currency}`, sub: true },
                      { label: "Net marchand", value: `${merchantNet.toLocaleString("fr-FR")} ${currency}`, sub: true },
                      { label: "Opérateur", value: operatorLabel },
                      { label: "Téléphone", value: phone },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className={cn("flex items-center justify-between px-4 py-3", sub ? "bg-gray-50" : "")}>
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className={cn("text-sm font-semibold text-gray-900", sub ? "text-gray-500 font-normal" : "")}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirm}
                    className="w-full h-12 mt-5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 active:bg-gray-950 transition-colors"
                  >
                    Payer maintenant
                  </button>
                </motion.div>
              )}

              {step === "processing" && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                  <p className="text-sm text-gray-500 font-medium">Traitement du paiement…</p>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Paiement réussi !</h2>
                  {isSandbox && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                      MODE TEST — Paiement simulé
                    </span>
                  )}
                  <p className="text-sm text-gray-500">
                    {isSandbox ? "Paiement simulé en mode sandbox." : "Votre paiement a été traité avec succès."}
                  </p>
                  <div className="w-full rounded-xl border border-gray-200 divide-y divide-gray-100 mt-2 text-left">
                    {[
                      { label: "Référence",  value: txRef },
                      { label: "Montant",    value: `${displayAmount.toLocaleString("fr-FR")} ${currency}` },
                      { label: "Marchand",   value: qr?.merchantName ?? "" },
                      { label: "Date",       value: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-xs font-semibold text-gray-900 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "error" && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Paiement échoué</h2>
                  <p className="text-sm text-gray-500">{error}</p>
                  <button
                    onClick={() => { setError(""); setStep("form"); }}
                    className="mt-2 text-sm text-blue-600 hover:underline font-medium"
                  >
                    Réessayer
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
