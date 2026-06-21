import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function VerifyEmailPage() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") ?? "";
  const type = (params.get("type") ?? "signup") as "signup" | "new_device";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent">("idle");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const code = digits.join("");

  const handleDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError("");
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const verify = async () => {
    if (code.length !== 6) { setError("Entrez les 6 chiffres du code."); return; }
    setStatus("loading"); setError("");
    try {
      const r = await fetch(`${BASE}/api/auth/verify-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Code invalide ou expiré.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => {
        window.location.assign(data.role === "admin" ? "/admin" : "/dashboard");
      }, 1200);
    } catch {
      setError("Erreur de connexion. Vérifiez votre connexion et réessayez.");
      setStatus("error");
    }
  };

  const resend = async () => {
    setResendStatus("loading");
    try {
      await fetch(`${BASE}/api/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch { /* ignore */ }
    setResendStatus("sent");
    setDigits(["", "", "", "", "", ""]);
    setError("");
    setTimeout(() => { setResendStatus("idle"); }, 30000);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F8F6F1" }}>
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 shrink-0" style={{ backgroundColor: "#0f0f0f" }}>
        <Link href="/">
          <img src="/logo-drimpay.png" alt="DrimPay" className="h-10 w-auto object-contain bg-white rounded-lg px-3 py-1.5" />
        </Link>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-6" style={{ backgroundColor: "#1a1a1a" }}>
            <ShieldCheck className="w-4 h-4" style={{ color: "#C5FF4A" }} />
            <span className="text-sm font-medium" style={{ color: "#C5FF4A" }}>Sécurité renforcée</span>
          </div>
          <p className="text-4xl font-bold text-white leading-snug mb-4">
            Vérifiez<br />votre identité<br /><span style={{ color: "#C5FF4A" }}>en 30 secondes.</span>
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            {type === "new_device"
              ? "Nous avons détecté une connexion depuis un nouvel appareil. Cette étape protège votre compte contre les accès non autorisés."
              : "Confirmez votre adresse email pour activer votre compte DrimPay et commencer à accepter des paiements."}
          </p>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} DrimPay. Tous droits réservés.</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src="/logo-drimpay.png" alt="DrimPay" className="h-9 w-auto object-contain" />
          </Link>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email vérifié</h2>
              <p className="text-gray-500 text-sm">Redirection vers votre tableau de bord...</p>
            </motion.div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#C5FF4A22" }}>
                  <Mail className="w-6 h-6" style={{ color: "#8ab32e" }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {type === "new_device" ? "Nouvel appareil détecté" : "Confirmez votre email"}
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {type === "new_device" ? "Vérifiez votre identité pour continuer" : "Un code vous a été envoyé par email"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <p className="text-sm text-gray-500 mb-5">
                  Code envoyé à <span className="font-semibold text-gray-900">{email}</span>
                </p>

                <div className="flex gap-3 mb-5" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="flex-1 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all"
                      style={{
                        borderColor: error ? "#f87171" : d ? "#C5FF4A" : "#e5e7eb",
                        backgroundColor: d ? "#f9ffe8" : "#f9fafb",
                        color: "#0f0f0f",
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={verify}
                  disabled={status === "loading" || code.length !== 6}
                  className="w-full h-12 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  style={{ backgroundColor: "#C5FF4A", color: "#0f0f0f" }}
                >
                  {status === "loading"
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</span>
                    : "Valider le code"}
                </button>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">Vous n'avez pas reçu d'email ?</p>
                <button
                  onClick={resend}
                  disabled={resendStatus === "loading" || resendStatus === "sent"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  {resendStatus === "loading"
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                    : resendStatus === "sent"
                      ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> Code renvoyé — vérifiez vos emails</>
                      : <><RefreshCw className="w-4 h-4" /> Renvoyer le code</>}
                </button>
                <p className="text-xs text-gray-400">
                  Vérifiez aussi votre dossier spam.
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
