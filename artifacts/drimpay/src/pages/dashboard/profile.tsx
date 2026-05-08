import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "./layout";
import { useAuth } from "@/lib/auth";
import {
  User, Building2, Shield, Camera, CheckCircle2, AlertCircle,
  Loader2, Key, Eye, EyeOff, Copy, RefreshCw, AlertTriangle, Lock,
  Monitor, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import userImg from "@assets/20260125_232710_1771507041579-BmqaXdG3_1778105456352.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Status = "idle" | "loading" | "success" | "error";

const inputCls = cn(
  "w-full h-11 rounded-xl border border-border bg-muted/20 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
  "focus:border-primary focus:ring-2 focus:ring-primary/20"
);

function Feedback({ status, error }: { status: Status; error?: string }) {
  if (status === "success") return (
    <div className="flex items-center gap-2 text-green-500 text-sm mt-3">
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

function ApiKeyCard({ env, keyData, onRegen }: { env: "sandbox" | "live"; keyData: any | null; onRegen: (env: "sandbox" | "live") => void }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const prefix = keyData?.prefix ?? null;
  const isLive = env === "live";
  const label = isLive ? "Clé Live" : "Clé Sandbox";
  const dot = isLive ? "bg-green-400" : "bg-yellow-400";
  const badge = isLive ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600";
  const maskedKey = prefix ? `${prefix}${"•".repeat(24)}` : null;
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
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{isLive ? "LIVE" : "SANDBOX"}</span>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <button onClick={() => onRegen(env)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
          <RefreshCw className="w-3.5 h-3.5" />{keyData ? "Régénérer" : "Générer"}
        </button>
      </div>
      {keyData ? (
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5 font-mono text-xs">
          <span className="flex-1 truncate text-foreground">{visible ? maskedKey : `${prefix}${"•".repeat(24)}`}</span>
          <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground shrink-0">
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleCopy} className="text-muted-foreground hover:text-primary shrink-0">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2.5">
          <Lock className="w-3.5 h-3.5" />Aucune clé générée
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


const MENU_ITEMS = [
  { key: "profil", label: "Mon Profil", icon: Building2 },
  { key: "api", label: "Clés API", icon: Key },
  { key: "securite", label: "Sécurité", icon: Shield },
  { key: "compte", label: "Identifiant", icon: User },
];

export default function DashboardProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("api");

  const [infoForm, setInfoForm] = useState({ companyName: user?.companyName ?? "", email: user?.email ?? "", country: user?.country ?? "" });
  const [infoStatus, setInfoStatus] = useState<Status>("idle");
  const [infoError, setInfoError] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [pwError, setPwError] = useState("");

  const [sandboxKey, setSandboxKey] = useState<any>(null);
  const [liveKey, setLiveKey] = useState<any>(null);

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
    setInfoStatus("loading"); setInfoError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/profile`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(infoForm) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? "Échec de la mise à jour."); }
      setInfoStatus("success"); setTimeout(() => setInfoStatus("idle"), 3000);
    } catch (e: any) { setInfoError(e.message); setInfoStatus("error"); }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("Les mots de passe ne correspondent pas."); setPwStatus("error"); return; }
    if (pwForm.newPassword.length < 8) { setPwError("Le nouveau mot de passe doit contenir au moins 8 caractères."); setPwStatus("error"); return; }
    setPwStatus("loading"); setPwError("");
    try {
      const r = await fetch(`${BASE}/api/dashboard/profile/password`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? "Échec du changement de mot de passe."); }
      setPwStatus("success"); setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setTimeout(() => setPwStatus("idle"), 3000);
    } catch (e: any) { setPwError(e.message); setPwStatus("error"); }
  };

  const openRegen = (env: "sandbox" | "live") => {
    navigate(`/dashboard/verify-code?env=${env}`);
  };

  const countryLabel = (code: string) => {
    const map: Record<string, string> = { TG: "🇹🇬 Togo", BJ: "🇧🇯 Bénin", CM: "🇨🇲 Cameroun", SN: "🇸🇳 Sénégal", CI: "🇨🇮 Côte d'Ivoire", ML: "🇲🇱 Mali", BF: "🇧🇫 Burkina Faso" };
    return map[code] ?? code;
  };

  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem("profile-desktop-banner") === "1"
  );
  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("profile-desktop-banner", "1");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        {!bannerDismissed && (
          <div className="relative flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 pr-10">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Monitor className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Meilleure expérience sur ordinateur
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Cette page contient de nombreuses informations. Nous vous recommandons de l'utiliser depuis un <span className="font-medium text-foreground">ordinateur ou une tablette</span> pour une navigation optimale.
              </p>
            </div>
            <button
              onClick={dismissBanner}
              className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez vos informations personnelles et la sécurité de votre compte.</p>
        </div>

        <div className="flex gap-5">
          {/* Left sidebar */}
          <div className="w-52 shrink-0 space-y-1">
            <div className="rounded-2xl border border-border bg-card overflow-hidden p-2">
              {/* Avatar card */}
              <div className="flex flex-col items-center px-3 py-4 mb-1">
                <div className="relative mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <img src={userImg} alt="" className="w-7 h-7 object-contain" style={{ filter: "brightness(0) opacity(0.6)" }} />
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                    <Camera className="w-3 h-3 text-primary-foreground" style={{ filter: "brightness(0)" }} />
                  </button>
                </div>
                <p className="text-xs font-bold text-center truncate w-full text-center">{user?.companyName ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground truncate w-full text-center">{user?.email ?? "—"}</p>
                <span className="mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">{user?.role ?? "user"}</span>
              </div>
              <div className="h-px bg-border mx-1 mb-2" />
              {MENU_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    activeSection === key
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right content panel */}
          <div className="flex-1 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

            {activeSection === "profil" && (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">Informations du compte</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Mettez à jour le nom de votre entreprise et votre email.</p>
                  </div>
                </div>
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
              </div>
            )}

            {activeSection === "api" && (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">Configuration des clés API</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Une clé unique par environnement. La régénération révoque immédiatement l'ancienne clé.</p>
                  </div>
                </div>
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
              </div>
            )}

            {activeSection === "securite" && (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">Sécurité — Mot de passe</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Modifiez votre mot de passe. Utilisez au moins 8 caractères.</p>
                  </div>
                </div>
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
              </div>
            )}

            {activeSection === "compte" && (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">Identifiant compte</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Référence unique de votre compte DrimPay.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border">
                    <span className="font-mono text-xs text-muted-foreground">ID</span>
                    <span className="font-mono text-sm font-semibold text-foreground">#{user?.id ?? "—"}</span>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Entreprise</span>
                      <span className="font-semibold">{user?.companyName ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-semibold">{user?.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pays</span>
                      <span className="font-semibold">{countryLabel(user?.country ?? "")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rôle</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">{user?.role ?? "user"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
