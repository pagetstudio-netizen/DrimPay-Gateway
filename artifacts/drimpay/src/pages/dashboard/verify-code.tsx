import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, Copy, CheckCircle2, AlertCircle,
  RefreshCw, Mail, Loader2, Key, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const DIGIT_COUNT = 6;
const CODE_TTL = 10 * 60; // 10 minutes in seconds

function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(initial);
  const [active, setActive] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setSeconds(initial);
    setActive(true);
  }, [initial]);

  useEffect(() => {
    if (!active) return;
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(ref.current!); setActive(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [active]);

  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { seconds, active, fmt, start };
}

export default function VerifyCodePage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const env = (params.get("env") ?? "sandbox") as "sandbox" | "live";
  const isLive = env === "live";

  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(""));
  const [maskedEmail, setMaskedEmail] = useState("");
  const [sending, setSending] = useState(true);
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { seconds, active: timerActive, fmt, start: startTimer } = useCountdown(CODE_TTL);

  const sendCode = useCallback(async () => {
    setSending(true); setSendError(""); setError(""); setDigits(Array(DIGIT_COUNT).fill(""));
    try {
      const r = await fetch(`${BASE}/api/dashboard/api-keys/send-code`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erreur envoi");
      setMaskedEmail(d.email ?? "");
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (e: any) { setSendError(e.message); }
    finally { setSending(false); }
  }, [env, startTimer]);

  useEffect(() => { sendCode(); }, []);

  const handleDigit = (i: number, val: string) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    setError("");
    if (ch && i < DIGIT_COUNT - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits]; next[i] = ""; setDigits(next);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
        const next = [...digits]; next[i - 1] = ""; setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < DIGIT_COUNT - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < DIGIT_COUNT; i++) next[i] = pasted[i] ?? "";
    setDigits(next);
    const lastFilled = Math.min(pasted.length, DIGIT_COUNT - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const confirm = async () => {
    const code = digits.join("");
    if (code.length !== DIGIT_COUNT) { setError("Entrez les 6 chiffres du code."); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/api-keys/regenerate`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env, code }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erreur");
      setNewKey(d.rawKey);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const code = digits.join("");
  const allFilled = code.length === DIGIT_COUNT;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard/profile")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </button>

        <AnimatePresence mode="wait">
          {/* Success state — new key display */}
          {newKey ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold mb-1">
                  Clé {isLive ? "Live" : "Sandbox"} générée !
                </h1>
                <p className="text-sm text-muted-foreground">
                  Copiez cette clé maintenant. Elle ne sera plus affichée en clair.
                </p>
              </div>

              {/* Key display */}
              <div className="space-y-3">
                <div className="bg-muted/40 rounded-2xl p-4 border border-border">
                  <p className="font-mono text-xs text-foreground break-all select-all leading-relaxed">{newKey}</p>
                </div>
                <button
                  onClick={copyKey}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm transition-all",
                    copied
                      ? "bg-green-500/10 text-green-600 border border-green-500/20"
                      : "bg-foreground text-background hover:opacity-90"
                  )}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copié !" : "Copier la clé"}
                </button>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Cette clé ne sera plus affichée après avoir quitté cette page.
                  Stockez-la dans un gestionnaire de secrets sécurisé.
                </p>
              </div>

              <button
                onClick={() => navigate("/dashboard/profile")}
                className="w-full py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Retour au profil
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-8 shadow-xl space-y-7"
            >
              {/* Icon */}
              <div className="flex justify-center">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center",
                  isLive ? "bg-green-500/10" : "bg-yellow-500/10"
                )}>
                  <ShieldCheck className={cn("w-10 h-10", isLive ? "text-green-500" : "text-yellow-500")} />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <div className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3",
                  isLive ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", isLive ? "bg-green-500" : "bg-yellow-400")} />
                  {isLive ? "CLÉ LIVE" : "CLÉ SANDBOX"}
                </div>
                <h1 className="text-xl font-bold mb-2">Vérification de sécurité</h1>
                {sending ? (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Envoi du code en cours…
                  </p>
                ) : sendError ? (
                  <p className="text-sm text-red-400 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {sendError}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Un code à 6 chiffres a été envoyé à
                    {maskedEmail && <strong className="text-foreground"> {maskedEmail}</strong>}
                  </p>
                )}
              </div>

              {/* OTP Inputs */}
              <div className="flex items-center justify-center gap-3">
                {Array.from({ length: DIGIT_COUNT }).map((_, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[i]}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    disabled={sending || !!sendError}
                    className={cn(
                      "w-12 h-14 rounded-2xl border-2 text-center text-xl font-bold font-mono transition-all outline-none",
                      "bg-muted/30 text-foreground",
                      digits[i]
                        ? "border-primary bg-primary/5 shadow-sm shadow-primary/20"
                        : "border-border",
                      "focus:border-primary focus:ring-2 focus:ring-primary/20",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  />
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timer */}
              {!sendError && (
                <div className="text-center">
                  {timerActive ? (
                    <p className="text-xs text-muted-foreground">
                      Code valide pendant{" "}
                      <span className={cn("font-mono font-bold", seconds < 60 ? "text-red-400" : "text-foreground")}>
                        {fmt}
                      </span>
                    </p>
                  ) : !sending && (
                    <p className="text-xs text-muted-foreground">
                      Code expiré.{" "}
                      <button onClick={sendCode} className="text-primary font-semibold hover:underline">
                        Renvoyer un code
                      </button>
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={confirm}
                  disabled={!allFilled || loading || sending || !!sendError}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-foreground text-background font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                  {loading ? "Vérification…" : "Confirmer et générer la clé"}
                </button>

                {!sendError && timerActive && (
                  <button
                    onClick={sendCode}
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className={cn("w-4 h-4", sending && "animate-spin")} />
                    Renvoyer le code
                  </button>
                )}
              </div>

              {/* Info */}
              {!sendError && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {isLive
                      ? "La régénération de la clé live révoquera immédiatement l'ancienne clé. Toutes vos intégrations en production seront affectées."
                      : "La régénération de la clé sandbox révoquera l'ancienne. Mettez à jour vos environnements de test."}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
