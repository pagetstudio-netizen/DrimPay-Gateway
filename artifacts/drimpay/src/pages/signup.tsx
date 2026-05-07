import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CountryPicker } from "@/components/ui/country-picker";

const COUNTRY_CODES = [
  { flag: "🇹🇬", code: "+228", country: "TG" },
  { flag: "🇧🇯", code: "+229", country: "BJ" },
  { flag: "🇨🇲", code: "+237", country: "CM" },
  { flag: "🇧🇫", code: "+226", country: "BF" },
  { flag: "🇲🇱", code: "+223", country: "ML" },
  { flag: "🇸🇳", code: "+221", country: "SN" },
  { flag: "🇨🇮", code: "+225", country: "CI" },
  { flag: "🇫🇷", code: "+33",  country: "FR" },
  { flag: "🇧🇪", code: "+32",  country: "BE" },
  { flag: "🇺🇸", code: "+1",   country: "US" },
];

const BUSINESS_COUNTRIES = [
  { code: "TG", name: "Togo",          flag: "🇹🇬" },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯" },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲" },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫" },
  { code: "ML", name: "Mali",          flag: "🇲🇱" },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "OTHER", name: "Autre",      flag: "🌍" },
];

const STEPS_INFO = [
  "Compte créé en moins de 2 minutes",
  "Accès immédiat au tableau de bord",
  "Intégration API en quelques lignes",
  "Support dédié inclus",
];

type FormData = {
  companyName: string; firstName: string; lastName: string;
  email: string; phoneCode: string; phone: string;
  country: string; password: string; referralCode?: string;
};

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full h-12 rounded-2xl border bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all",
    "focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10",
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/10" : "border-gray-200"
  );

function Field({
  label, error, required, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

export default function Signup() {
  const t = useT();
  const schema = z.object({
    companyName: z.string().min(2, t.signup.errors.companyName),
    firstName:   z.string().min(1, t.signup.errors.firstName),
    lastName:    z.string().min(1, t.signup.errors.lastName),
    email:       z.string().email(t.signup.errors.email),
    phoneCode:   z.string().min(1),
    phone:       z.string().min(6, t.signup.errors.phone),
    country:     z.string().min(1, t.signup.errors.country),
    password:    z.string().min(8, t.signup.errors.password),
    referralCode: z.string().optional(),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [phoneCode, setPhoneCode] = useState("+228");
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [serverError, setServerError] = useState("");
  const [, navigate] = useLocation();
  const { signup } = useAuth();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "", firstName: "", lastName: "",
      email: "", phoneCode: "+228", phone: "",
      country: "", password: "", referralCode: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setStatus("loading");
    setServerError("");
    const { error } = await signup({
      companyName: values.companyName,
      email: values.email,
      password: values.password,
      country: values.country,
    });
    if (error) { setServerError(error); setStatus("idle"); return; }
    window.location.assign("/dashboard");
  };

  const selectedPhoneEntry = COUNTRY_CODES.find(c => c.code === phoneCode) ?? COUNTRY_CODES[0];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F8F6F1" }}>
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col justify-between p-12 shrink-0" style={{ backgroundColor: "#0f0f0f" }}>
        <Link href="/">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xl" style={{ backgroundColor: "#B5F03C", color: "#0f0f0f" }}>D</div>
            <span className="font-bold text-2xl tracking-tight text-white">DrimPay</span>
          </div>
        </Link>

        <div>
          <p className="text-4xl font-bold text-white leading-snug mb-3">
            Rejoignez des<br />
            milliers d'entreprises<br />
            <span style={{ color: "#B5F03C" }}>qui font confiance.</span>
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Créez votre compte et commencez à accepter des paiements partout en Afrique dès aujourd'hui.
          </p>
          <div className="space-y-3">
            {STEPS_INFO.map((text) => (
              <div key={text} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#B5F03C" }} />
                <span className="text-sm text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">© {new Date().getFullYear()} DrimPay. Tous droits réservés.</p>
      </div>

      <div className="flex-1 flex flex-col justify-start lg:justify-center overflow-y-auto px-6 py-12 lg:px-12 xl:px-16">
        <div className="w-full max-w-lg mx-auto lg:mx-0">
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: "#B5F03C", color: "#0f0f0f" }}>D</div>
            <span className="font-bold text-xl tracking-tight text-gray-900">DrimPay</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Créer un compte</h1>
          <p className="text-gray-500 text-sm mb-8">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold text-gray-900 hover:underline underline-offset-2">
              Se connecter
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label={t.signup.companyLabel} error={errors.companyName?.message} required>
              <input
                type="text"
                placeholder={t.signup.companyPlaceholder}
                autoComplete="organization"
                {...register("companyName")}
                className={inputCls(!!errors.companyName)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.signup.firstNameLabel} error={errors.firstName?.message} required>
                <input
                  type="text"
                  placeholder="Jean"
                  autoComplete="given-name"
                  {...register("firstName")}
                  className={inputCls(!!errors.firstName)}
                />
              </Field>
              <Field label={t.signup.lastNameLabel} error={errors.lastName?.message} required>
                <input
                  type="text"
                  placeholder="Dupont"
                  autoComplete="family-name"
                  {...register("lastName")}
                  className={inputCls(!!errors.lastName)}
                />
              </Field>
            </div>

            <Field label={t.signup.emailLabel} error={errors.email?.message} required>
              <input
                type="email"
                placeholder="nom@email.com"
                autoComplete="email"
                {...register("email")}
                className={inputCls(!!errors.email)}
              />
            </Field>

            <Field label={t.signup.phoneLabel} error={errors.phone?.message} required>
              <div className="flex gap-2">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCodePicker(v => !v)}
                    className="h-12 px-3 rounded-2xl border border-gray-200 bg-white flex items-center gap-1.5 text-sm font-medium hover:border-gray-400 transition-colors whitespace-nowrap text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  >
                    <span className="text-base">{selectedPhoneEntry.flag}</span>
                    <span className="text-gray-700">{phoneCode}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {showCodePicker && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 w-48 max-h-56 overflow-y-auto">
                      {COUNTRY_CODES.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
                          onClick={() => { setPhoneCode(c.code); setValue("phoneCode", c.code); setShowCodePicker(false); }}
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="font-mono text-gray-800">{c.code}</span>
                          <span className="text-gray-400 text-xs ml-auto">{c.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="XXXX XXXX XXXX"
                  autoComplete="tel"
                  {...register("phone")}
                  className={cn(inputCls(!!errors.phone), "flex-1")}
                />
              </div>
            </Field>

            <Field label={t.signup.countryLabel} error={errors.country?.message} required>
              <CountryPicker
                options={BUSINESS_COUNTRIES}
                value={watch("country")}
                onChange={(code) => setValue("country", code, { shouldValidate: true })}
                placeholder={t.signup.countryDefault}
                error={!!errors.country}
              />
            </Field>

            <Field label={t.signup.passwordLabel} error={errors.password?.message} required>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t.signup.passwordPlaceholder}
                  autoComplete="new-password"
                  {...register("password")}
                  className={cn(inputCls(!!errors.password), "pr-12")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label={t.signup.referralLabel}>
              <input
                type="text"
                placeholder="Optionnel"
                {...register("referralCode")}
                className={inputCls()}
              />
            </Field>

            {serverError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-14 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-2"
              style={{ backgroundColor: "#0f0f0f", color: "#fff" }}
            >
              {status === "loading" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t.signup.submitting}</>
              ) : (
                <>{t.signup.submit} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center pt-1">
              {t.signup.agree}{" "}
              <Link href="/terms" className="text-gray-600 hover:underline underline-offset-2">{t.signup.terms}</Link>
              {" "}{t.signup.and}{" "}
              <Link href="/privacy" className="text-gray-600 hover:underline underline-offset-2">{t.signup.privacy}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
