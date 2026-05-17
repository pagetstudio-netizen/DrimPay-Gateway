import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "email" | "code" | "password" | "done";

const inputCls = (err?: boolean) =>
  cn(
    "w-full h-14 rounded-2xl border bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all",
    "focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10",
    err ? "border-red-400 focus:border-red-400 focus:ring-red-400/10" : "border-gray-200"
  );

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle token from URL (email link click)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setStep("password");
    }
  }, []);

  // ── Step 1: submit email ──────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always move to code step (security: don't reveal if email exists)
      setStep("code");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  };

  // ── Step 2: verify 5-digit code ───────────────────────────────────────────
  const handleCodeChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 4) codeRefs.current[i + 1]?.focus();
  };

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) codeRefs.current[i - 1]?.focus();
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    if (text.length === 5) {
      setCode(text.split(""));
      codeRefs.current[4]?.focus();
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 5) { setError("Entrez les 5 chiffres du code."); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Code invalide ou expiré."); setLoading(false); return; }
      setResetToken(data.token);
      setStep("password");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  };

  // ── Step 3: new password ──────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Lien invalide ou expiré."); setLoading(false); return; }
      setStep("done");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <a href="/" className="flex items-center gap-1">
            <span className="text-2xl font-black text-gray-900 tracking-tight">Drim</span>
            <span className="text-2xl font-black text-emerald-500 tracking-tight">Pay</span>
          </a>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">

          {/* ── DONE ──────────────────────────────────────────────────────── */}
          {step === "done" && (
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Mot de passe mis à jour !</h2>
                <p className="text-sm text-gray-500 mt-1">Votre mot de passe a été réinitialisé avec succès.</p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors"
              >
                Se connecter
              </button>
            </div>
          )}

          {/* ── STEP EMAIL ────────────────────────────────────────────────── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <button type="button" onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </button>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Mot de passe oublié ?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Entrez votre adresse email. Nous vous enverrons un code de vérification à 5 chiffres ainsi qu'un lien de réinitialisation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Adresse email</label>
                <input
                  type="email" required autoFocus
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className={inputCls()}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={loading || !email.trim()}
                className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Envoyer le code
              </button>
            </form>
          )}

          {/* ── STEP CODE ─────────────────────────────────────────────────── */}
          {step === "code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <button type="button" onClick={() => { setStep("email"); setCode(["", "", "", "", ""]); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" /> Changer l'email
              </button>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Vérification d'e-mail</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Un code à 5 chiffres a été envoyé à <strong className="text-gray-900">{email}</strong>. Vérifiez vos spams si nécessaire.
                </p>
              </div>

              {/* 5-digit code input */}
              <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { codeRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    autoFocus={i === 0}
                    className={cn(
                      "w-12 h-14 text-center text-xl font-bold rounded-2xl border outline-none transition-all",
                      "focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10",
                      digit ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-900"
                    )}
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={loading || code.join("").length < 5}
                className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Vérifier le code
              </button>

              <div className="text-center">
                <button type="button"
                  onClick={() => { setCode(["", "", "", "", ""]); setError(""); handleEmailSubmit({ preventDefault: () => {} } as any); }}
                  className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors">
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}

          {/* ── STEP PASSWORD ─────────────────────────────────────────────── */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Nouveau mot de passe</h2>
                <p className="text-sm text-gray-500 mt-1">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"} required autoFocus
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    className={cn(inputCls(), "pr-12")}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"} required
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className={cn(inputCls(confirmPassword.length > 0 && confirmPassword !== password), "pr-12")}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => {
                      const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
                      return (
                        <div key={i} className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i < strength
                            ? strength === 4 ? "bg-emerald-500" : strength === 3 ? "bg-blue-500" : strength === 2 ? "bg-yellow-500" : "bg-red-500"
                            : "bg-gray-100"
                        )} />
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {password.length >= 12 ? "Fort" : password.length >= 10 ? "Bien" : password.length >= 8 ? "Acceptable" : "Trop court"}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={loading || password.length < 8}
                className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Réinitialiser le mot de passe
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Vous vous souvenez de votre mot de passe ?{" "}
          <a href="/login" className="text-gray-700 font-medium hover:underline underline-offset-2">Se connecter</a>
        </p>
      </div>
    </div>
  );
}
