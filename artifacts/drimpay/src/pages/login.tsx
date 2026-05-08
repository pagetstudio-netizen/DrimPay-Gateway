import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FormData = { email: string; password: string; remember?: boolean };

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full h-14 rounded-2xl border bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all",
    "focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10",
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/10" : "border-gray-200"
  );

const PERKS = [
  { icon: Zap, text: "Paiements instantanés sur 7 pays" },
  { icon: Globe, text: "APIs unifiées Mobile Money & Bank" },
  { icon: ShieldCheck, text: "Sécurité bancaire de niveau entreprise" },
];

export default function Login() {
  const t = useT();
  const lang = useLang();
  const schema = z.object({
    email: z.string().email(t.login.errors.email),
    password: z.string().min(1, t.login.errors.password),
    remember: z.boolean().optional(),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [serverError, setServerError] = useState("");
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: FormData) => {
    setStatus("loading");
    setServerError("");
    const { error } = await login(values.email, values.password);
    if (error) {
      setServerError(error);
      setStatus("idle");
      return;
    }
    const meRes = await fetch("/api/auth/me", { credentials: "include" });
    const me = await meRes.json();
    window.location.assign(me?.role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F8F6F1" }}>
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12" style={{ backgroundColor: "#0f0f0f" }}>
        <Link href="/">
          <img src="/logo-drimpay.png" alt="DrimPay" className="h-10 w-auto object-contain bg-white rounded-lg px-3 py-1.5" />
        </Link>

        <div>
          <p className="text-4xl font-bold text-white leading-snug mb-6">
            L'infrastructure de<br />
            paiement pour<br />
            <span style={{ color: "#B5F03C" }}>l'Afrique.</span>
          </p>
          <div className="space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#B5F03C22" }}>
                  <Icon className="w-4 h-4" style={{ color: "#B5F03C" }} />
                </div>
                <span className="text-sm text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">© {new Date().getFullYear()} DrimPay. Tous droits réservés.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src="/logo-drimpay.png" alt="DrimPay" className="h-9 w-auto object-contain" />
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connectez-vous</h1>
          <p className="text-gray-500 text-sm mb-8">
            Prenez le contrôle de vos encaissements en toute simplicité.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.login.emailLabel}</label>
              <input
                type="email"
                placeholder="nom@email.com"
                autoComplete="email"
                {...register("email")}
                className={inputCls(!!errors.email)}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{t.login.passwordLabel}</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className={cn(inputCls(!!errors.password), "pr-12")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative">
                  <input type="checkbox" {...register("remember")} className="sr-only peer" />
                  <div className="w-5 h-5 rounded-md border-2 border-gray-200 bg-white peer-checked:border-gray-900 peer-checked:bg-gray-900 transition-all flex items-center justify-center">
                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{t.login.staySignedIn}</span>
              </label>
              <a href="#" className="text-sm font-medium text-gray-900 hover:underline underline-offset-2">
                {t.login.forgotPassword}
              </a>
            </div>

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
                <><Loader2 className="w-4 h-4 animate-spin" /> {t.login.submitting}</>
              ) : (
                <>{t.login.submit} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Vous n'avez pas encore de compte ?{" "}
            <Link href="/signup" className="font-semibold text-gray-900 hover:underline underline-offset-2">
              S'inscrire
            </Link>
          </p>

          <p className="text-xs text-gray-400 text-center mt-8">
            {t.login.protected}{" "}
            <Link href="/privacy" className="hover:underline underline-offset-2">{t.login.privacyPolicy}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
