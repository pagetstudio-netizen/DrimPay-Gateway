import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const COUNTRY_CODES = [
  { flag: "🇹🇬", code: "+228", country: "TG" },
  { flag: "🇧🇯", code: "+229", country: "BJ" },
  { flag: "🇨🇲", code: "+237", country: "CM" },
  { flag: "🇧🇫", code: "+226", country: "BF" },
  { flag: "🇲🇱", code: "+223", country: "ML" },
  { flag: "🇸🇳", code: "+221", country: "SN" },
  { flag: "🇨🇮", code: "+225", country: "CI" },
  { flag: "🇫🇷", code: "+33", country: "FR" },
  { flag: "🇧🇪", code: "+32", country: "BE" },
  { flag: "🇺🇸", code: "+1", country: "US" },
];

const BUSINESS_COUNTRIES = [
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Bénin" },
  { code: "CM", name: "Cameroun" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
];

type FormData = {
  companyName: string; firstName: string; lastName: string;
  email: string; phoneCode: string; phone: string;
  country: string; password: string; referralCode?: string;
};

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full h-12 rounded-xl border bg-muted/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
    hasError ? "border-red-400" : "border-border"
  );

export default function Signup() {
  const t = useT();
  const schema = z.object({
    companyName: z.string().min(2, t.signup.errors.companyName),
    firstName: z.string().min(1, t.signup.errors.firstName),
    lastName: z.string().min(1, t.signup.errors.lastName),
    email: z.string().email(t.signup.errors.email),
    phoneCode: z.string().min(1),
    phone: z.string().min(6, t.signup.errors.phone),
    country: z.string().min(1, t.signup.errors.country),
    password: z.string().min(8, t.signup.errors.password),
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
    defaultValues: { companyName: "", firstName: "", lastName: "", email: "", phoneCode: "+228", phone: "", country: "", password: "", referralCode: "" },
  });

  const selectedCountry = watch("country");

  const onSubmit = async (values: FormData) => {
    setStatus("loading");
    setServerError("");
    const { error } = await signup({ companyName: values.companyName, email: values.email, password: values.password, country: values.country });
    if (error) { setServerError(error); setStatus("idle"); return; }
    navigate("/dashboard");
  };

  const selectedPhoneEntry = COUNTRY_CODES.find(c => c.code === phoneCode) ?? COUNTRY_CODES[0];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-background"
      style={{ backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`, backgroundSize: "24px 24px" }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 pt-10 pb-8">
            <div className="flex justify-center mb-8">
              <Link href="/">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-xl leading-none">D</span>
                  </div>
                  <span className="font-bold text-2xl tracking-tight">DrimPay</span>
                </div>
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-1">{t.signup.title}</h1>
            <p className="text-sm text-muted-foreground mb-7">
              {t.signup.subtitle}{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-2">{t.signup.signin}</Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field label={t.signup.companyLabel} error={errors.companyName?.message} required>
                <input type="text" placeholder={t.signup.companyPlaceholder} autoComplete="organization" {...register("companyName")} className={inputCls(!!errors.companyName)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t.signup.firstNameLabel} error={errors.firstName?.message} required>
                  <input type="text" placeholder="Jean" autoComplete="given-name" {...register("firstName")} className={inputCls(!!errors.firstName)} />
                </Field>
                <Field label={t.signup.lastNameLabel} error={errors.lastName?.message} required>
                  <input type="text" placeholder="Dupont" autoComplete="family-name" {...register("lastName")} className={inputCls(!!errors.lastName)} />
                </Field>
              </div>

              <Field label={t.signup.emailLabel} error={errors.email?.message} required>
                <input type="email" placeholder="nom@email.com" autoComplete="email" {...register("email")} className={inputCls(!!errors.email)} />
              </Field>

              <Field label={t.signup.phoneLabel} error={errors.phone?.message} required>
                <div className="flex gap-2">
                  <div className="relative">
                    <button type="button" onClick={() => setShowCodePicker(v => !v)} className={cn("h-12 px-3 rounded-xl border bg-muted/30 flex items-center gap-1.5 text-sm font-medium hover:border-primary/50 transition-colors whitespace-nowrap", "border-border text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20")}>
                      <span className="text-base">{selectedPhoneEntry.flag}</span>
                      <span>{phoneCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {showCodePicker && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl py-1 w-44 max-h-56 overflow-y-auto">
                        {COUNTRY_CODES.map(c => (
                          <button key={c.code} type="button" className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40 transition-colors text-left" onClick={() => { setPhoneCode(c.code); setValue("phoneCode", c.code); setShowCodePicker(false); }}>
                            <span className="text-base">{c.flag}</span>
                            <span className="font-mono">{c.code}</span>
                            <span className="text-muted-foreground text-xs ml-auto">{c.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="tel" placeholder="XXXX-XXXX-XXXX" autoComplete="tel" {...register("phone")} className={cn(inputCls(!!errors.phone), "flex-1")} />
                </div>
              </Field>

              <Field label={t.signup.countryLabel} error={errors.country?.message} required>
                <div className="relative">
                  <select {...register("country")} className={cn(inputCls(!!errors.country), "appearance-none pr-10 cursor-pointer", !selectedCountry && "text-muted-foreground/60")}>
                    <option value="" disabled>{t.signup.countryDefault}</option>
                    {BUSINESS_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                    <option value="OTHER">{t.signup.countryOther}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>

              <Field label={t.signup.passwordLabel} error={errors.password?.message} required>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder={t.signup.passwordPlaceholder} autoComplete="new-password" {...register("password")} className={cn(inputCls(!!errors.password), "pr-12")} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label={t.signup.referralLabel}>
                <input type="text" placeholder="Optional" {...register("referralCode")} className={inputCls()} />
              </Field>

              {serverError && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{serverError}</p>
              )}

              <button type="submit" disabled={status === "loading"} style={{ height: "52px" }} className="w-full rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 mt-2">
                {status === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t.signup.submitting}</>
                ) : t.signup.submit}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 border-t border-border bg-muted/10 text-center">
            <p className="text-xs text-muted-foreground">
              {t.signup.agree}{" "}
              <Link href="/terms" className="hover:underline underline-offset-2">{t.signup.terms}</Link>
              {" "}{t.signup.and}{" "}
              <Link href="/privacy" className="hover:underline underline-offset-2">{t.signup.privacy}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
