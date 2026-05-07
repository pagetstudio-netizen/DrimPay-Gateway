import { useEffect, useState } from "react";
import { DashboardLayout } from "./layout";
import { useAuth } from "@/lib/auth";
import {
  User, Mail, Building2, Shield, Camera, CheckCircle2, AlertCircle,
  Loader2, Key, Eye, EyeOff, Copy, RefreshCw, AlertTriangle, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import userImg from "@assets/20260125_232710_1771507041579-BmqaXdG3_1778105456352.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Status = "idle" | "loading" | "success" | "error";
type RegenStep = "confirm" | "code" | "done";

const inputCls = cn(
  "w-full h-11 rounded-xl border border-border bg-muted/20 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
  "focus:border-primary focus:ring-2 focus:ring-primary/20"
);

function Section({ icon: Icon, title, desc, children }: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-base">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Feedback({ status, error }: { status: Status; error?: string }) {
  if (status === "success") return (
    <div className="flex items-center gap-2 text-green-400 text-sm mt-3">
      <CheckCircle2 className="w-4 h-4" /> Sauvegardé avec succès
    </div>
  );
  if (status === "error" && error) return (
    <div className="flex items-center gap-2 text-red-400 text-sm mt-3">
      <AlertCircle className="w-4 h-4" /> {error}
    </div>
  );
  return null;
}

function ApiKeyCard({
  env, keyData, onRegen,
}: {
  env: "sandbox" | "live";
  keyData: any | null;
  onRegen: (env: "sandbox" | "live") => void;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const prefix = keyData?.prefix ?? null;
  const isLive = env === "live";
  const label = isLive ? "Clé Live" : "Clé Sandbox";
  const dot = isLive ? "bg-green-400" : "bg-yellow-400";
  const badge = isLive
    ? "bg-green-500/10 text-green-600"
    : "bg-yellow-500/10 text-yellow-600";

  const maskedKey = prefix
    ? `${prefix}${"•".repeat(24)}`
    : null;

  const handleCopy = () => {
    if (!prefix) return;
    navigator.clipboard.writeText(prefix + "•".repeat(24));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>
            {isLive ? "LIVE" : "SANDBOX"}
          </span>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <button
          onClick={() => onRegen(env)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {keyData ? "Régénérer" : "Générer"}
        </button>
      </div>

      {keyData ? (
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5 font-mono text-xs">
          <span className="flex-1 truncate text-foreground">
            {visible ? maskedKey : `${prefix}${"•".repeat(24)}`}
          </span>
          <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground shrink-0">
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleCopy} className="text-muted-foreground hover:text-primary shrink-0">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2.5">
          <Lock className="w-3.5 h-3.5" />
          Aucune clé générée
        </div>
      )}

      {keyData && (
        <p className="text-[11px] text-muted-foreground">
          Créée le {new Date(keyData.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          {keyData.lastUsedAt && ` · Dernière utilisation ${new Date(keyData.lastUsedAt).toLocaleDateString("fr-FR")}`}
        </p>
      )}
    </div>
  );
}

function RegenModal({
  open, env, userEmail,
  onClose,
  onDone,
}: {
  open: boolean;
  env: "sandbox" | "live" | null;
  userEmail: string;
  onClose: () => void;
  onDone: (key: any) => void;
}) {
  const [step, setStep] = useState<RegenStep>("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [newKey, setNewKey] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const isLive = env === "live";

  const reset = () => {
    setStep("confirm");
    setError("");
    setCode("");
    setNewKey("");
    setCopied(false);
    setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const sendCode = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/api-keys/send-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erreur");
      setMaskedEmail(d.email ?? userEmail);
      setStep("code");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const confirmRegen = async () => {
    if (code.trim().length !== 6) { setError("Entrez le code à 6 chiffres."); return; }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/api-keys/regenerate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env, code: code.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erreur");
      setNewKey(d.rawKey);
      onDone(d);
      setStep("done");
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!env) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                {isLive ? "Régénérer la clé Live" : "Régénérer la clé Sandbox"}
              </DialogTitle>
              <DialogDescription>
                Un code de vérification à 6 chiffres sera envoyé à votre adresse email pour confirmer cette action.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                {isLive
                  ? "La clé live actuelle sera immédiatement révoquée. Toutes vos intégrations en production cesseront de fonctionner jusqu'à la mise à jour."
                  : "La clé sandbox actuelle sera révoquée. Mettez à jour vos environnements de test."}
              </p>
            </div>
            {error && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
            <div className="flex gap-3 mt-1">
              <Button className="flex-1 text-black" onClick={sendCode} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Envoyer le code
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleClose}>Annuler</Button>
            </div>
          </>
        )}

        {step === "code" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Vérification par email
              </DialogTitle>
              <DialogDescription>
                Entrez le code à 6 chiffres envoyé à <strong>{maskedEmail}</strong>. Valide 10 minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <input
                className={cn(inputCls, "text-center text-2xl font-mono tracking-widest letter-spacing-4")}
                placeholder="— — — — — —"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus
              />
              {error && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
              <div className="flex gap-3">
                <Button className="flex-1 text-black" onClick={confirmRegen} disabled={loading || code.length !== 6}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Confirmer
                </Button>
                <Button variant="outline" onClick={() => { setStep("confirm"); setError(""); setCode(""); }}>
                  Renvoyer
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Clé {isLive ? "Live" : "Sandbox"} régénérée !
              </DialogTitle>
              <DialogDescription>
                Copiez cette clé maintenant. Elle ne sera plus jamais affichée en clair.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs break-all select-all border border-border">
              {newKey}
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 text-black" onClick={copyKey}>
                {copied ? <><CheckCircle2 className="w-4 h-4 mr-2" />Copié</> : <><Copy className="w-4 h-4 mr-2" />Copier la clé</>}
              </Button>
              <Button variant="outline" onClick={handleClose}>Fermer</Button>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">Cette clé ne sera plus affichée après fermeture. Stockez-la dans un gestionnaire de secrets.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardProfile() {
  const { user } = useAuth();

  const [infoForm, setInfoForm] = useState({
    companyName: user?.companyName ?? "",
    email: user?.email ?? "",
    country: user?.country ?? "",
  });
  const [infoStatus, setInfoStatus] = useState<Status>("idle");
  const [infoError, setInfoError] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [pwError, setPwError] = useState("");

  const [sandboxKey, setSandboxKey] = useState<any>(null);
  const [liveKey, setLiveKey] = useState<any>(null);
  const [regenEnv, setRegenEnv] = useState<"sandbox" | "live" | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/api-keys`, { credentials: "include" })
      .then(r => r.json())
      .then((keys: any[]) => {
        if (!Array.isArray(keys)) return;
        const activeKeys = keys.filter(k => k.status === "active");
        setSandboxKey(activeKeys.find(k => k.env === "sandbox") ?? null);
        setLiveKey(activeKeys.find(k => k.env === "live") ?? null);
      })
      .catch(console.error);
  }, []);

  const handleInfoSave = async () => {
    setInfoStatus("loading");
    setInfoError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoForm),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error ?? "Échec de la mise à jour.");
      }
      setInfoStatus("success");
      setTimeout(() => setInfoStatus("idle"), 3000);
    } catch (e: any) {
      setInfoError(e.message);
      setInfoStatus("error");
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas.");
      setPwStatus("error");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      setPwStatus("error");
      return;
    }
    setPwStatus("loading");
    setPwError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/profile/password`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error ?? "Échec du changement de mot de passe.");
      }
      setPwStatus("success");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwStatus("idle"), 3000);
    } catch (e: any) {
      setPwError(e.message);
      setPwStatus("error");
    }
  };

  const openRegen = (env: "sandbox" | "live") => {
    setRegenEnv(env);
    setRegenOpen(true);
  };

  const handleRegenDone = (key: any) => {
    if (key.env === "sandbox") setSandboxKey(key);
    else setLiveKey(key);
  };

  const countryLabel = (code: string) => {
    const map: Record<string, string> = {
      TG: "🇹🇬 Togo", BJ: "🇧🇯 Bénin", CM: "🇨🇲 Cameroun",
      SN: "🇸🇳 Sénégal", CI: "🇨🇮 Côte d'Ivoire", ML: "🇲🇱 Mali", BF: "🇧🇫 Burkina Faso",
    };
    return map[code] ?? code;
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="mb-2">
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez vos informations personnelles et la sécurité de votre compte.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <img src={userImg} alt="" className="w-10 h-10 object-contain" style={{ filter: "brightness(0) opacity(0.6)" }} />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
              <Camera className="w-3.5 h-3.5 text-primary-foreground" style={{ filter: "brightness(0)" }} />
            </button>
          </div>
          <div>
            <p className="text-lg font-bold">{user?.companyName ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {countryLabel(user?.country ?? "")}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold uppercase">
                {user?.role ?? "user"}
              </span>
            </div>
          </div>
        </div>

        <Section icon={Building2} title="Informations du compte" desc="Mettez à jour le nom de votre entreprise et votre email.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Nom de l'entreprise</label>
              <input className={inputCls} value={infoForm.companyName} onChange={e => setInfoForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Ex: SARL MonEntreprise" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Adresse email</label>
              <input type="email" className={inputCls} value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@entreprise.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Pays</label>
              <select className={inputCls} value={infoForm.country} onChange={e => setInfoForm(f => ({ ...f, country: e.target.value }))}>
                {[
                  { code: "TG", label: "🇹🇬 Togo" }, { code: "BJ", label: "🇧🇯 Bénin" },
                  { code: "CM", label: "🇨🇲 Cameroun" }, { code: "SN", label: "🇸🇳 Sénégal" },
                  { code: "CI", label: "🇨🇮 Côte d'Ivoire" }, { code: "ML", label: "🇲🇱 Mali" },
                  { code: "BF", label: "🇧🇫 Burkina Faso" },
                ].map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <button
              onClick={handleInfoSave}
              disabled={infoStatus === "loading"}
              className="flex items-center gap-2 bg-primary text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 text-black"
            >
              {infoStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sauvegarder les modifications
            </button>
            <Feedback status={infoStatus} error={infoError} />
          </div>
        </Section>

        <Section icon={Key} title="Configuration des clés API" desc="Une clé unique par environnement. La régénération révoque immédiatement l'ancienne clé.">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-4">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Les clés ne sont affichées qu'une seule fois lors de leur génération. Ne partagez jamais votre clé live dans votre code source.
              </p>
            </div>
            <ApiKeyCard env="sandbox" keyData={sandboxKey} onRegen={openRegen} />
            <ApiKeyCard env="live" keyData={liveKey} onRegen={openRegen} />
          </div>
        </Section>

        <Section icon={Shield} title="Sécurité — Mot de passe" desc="Modifiez votre mot de passe. Utilisez au moins 8 caractères.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Mot de passe actuel</label>
              <input type="password" className={inputCls} value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Nouveau mot de passe</label>
              <input type="password" className={inputCls} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Confirmer le nouveau mot de passe</label>
              <input type="password" className={inputCls} value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={pwStatus === "loading" || !pwForm.currentPassword || !pwForm.newPassword}
              className="flex items-center gap-2 bg-primary text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60 text-black"
            >
              {pwStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Changer le mot de passe
            </button>
            <Feedback status={pwStatus} error={pwError} />
          </div>
        </Section>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base">Identifiant compte</h2>
              <p className="text-sm text-muted-foreground mt-0.5 mb-3">Référence unique de votre compte DrimPay.</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                <span className="font-mono text-xs text-muted-foreground">ID</span>
                <span className="font-mono text-sm font-semibold text-foreground">#{user?.id ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <RegenModal
        open={regenOpen}
        env={regenEnv}
        userEmail={user?.email ?? ""}
        onClose={() => setRegenOpen(false)}
        onDone={handleRegenDone}
      />
    </DashboardLayout>
  );
}
