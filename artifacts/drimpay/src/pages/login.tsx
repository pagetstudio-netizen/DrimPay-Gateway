import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type FormData = { email: string; password: string; remember?: boolean };

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
    window.location.assign("/dashboard");
  };

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

            <h1 className="text-2xl font-bold text-foreground mb-1">{t.login.title}</h1>
            <p className="text-sm text-muted-foreground mb-7">
              {t.login.subtitle}{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-2">
                {t.login.createAccount}
              </Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t.login.emailLabel}</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  autoComplete="email"
                  {...register("email")}
                  className={cn(
                    "w-full h-12 rounded-xl border bg-muted/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    errors.email ? "border-red-400" : "border-border"
                  )}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-foreground">{t.login.passwordLabel}</label>
                  <a href="#" className="text-sm text-primary hover:underline underline-offset-2 font-medium">{t.login.forgotPassword}</a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className={cn(
                      "w-full h-12 rounded-xl border bg-muted/30 px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20",
                      errors.password ? "border-red-400" : "border-border"
                    )}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                <div className="relative">
                  <input type="checkbox" {...register("remember")} className="sr-only peer" />
                  <div className="w-5 h-5 rounded border-2 border-border bg-muted/30 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground hidden peer-checked:block" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{t.login.staySignedIn}</span>
              </label>

              {serverError && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 mt-2"
                style={{ height: "52px" }}
              >
                {status === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t.login.submitting}</>
                ) : t.login.submit}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 border-t border-border bg-muted/10 text-center">
            <p className="text-xs text-muted-foreground">
              {t.login.protected}{" "}
              <Link href="/privacy" className="hover:underline underline-offset-2">{t.login.privacyPolicy}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
