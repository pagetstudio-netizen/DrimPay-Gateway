import { useState, useEffect } from "react";
import { DashboardLayout } from "./layout";
import { Webhook, Lock, Wifi, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Save, Monitor, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Settings = {
  email: string;
  companyName: string;
  webhookUrl: string | null;
  staticIp: string | null;
};

type Status = "idle" | "loading" | "success" | "error";

function Feedback({ status, error }: { status: Status; error: string }) {
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

const inputCls = (hasError?: boolean) => cn(
  "w-full h-11 rounded-xl border bg-muted/20 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
  "focus:border-primary focus:ring-2 focus:ring-primary/20",
  hasError ? "border-red-400" : "border-border"
);

const MENU_ITEMS = [
  { key: "webhook", label: "URL de Webhook", icon: Webhook },
  { key: "ip", label: "IP Statique", icon: Wifi },
  { key: "password", label: "Mot de passe", icon: Lock },
];

export default function DashboardSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeSection, setActiveSection] = useState("webhook");

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<Status>("idle");
  const [webhookError, setWebhookError] = useState("");

  // Static IP
  const [staticIp, setStaticIp] = useState("");
  const [ipStatus, setIpStatus] = useState<Status>("idle");
  const [ipError, setIpError] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setWebhookUrl(data.webhookUrl ?? "");
        setStaticIp(data.staticIp ?? "");
      });
  }, []);

  const saveWebhook = async () => {
    setWebhookStatus("loading");
    setWebhookError("");
    const r = await fetch(`${BASE}/api/dashboard/settings/webhook`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl }),
    });
    const data = await r.json();
    if (!r.ok) { setWebhookError(data.error ?? "Erreur"); setWebhookStatus("error"); return; }
    setWebhookStatus("success");
    setTimeout(() => setWebhookStatus("idle"), 3000);
  };

  const saveIp = async () => {
    setIpStatus("loading");
    setIpError("");
    const r = await fetch(`${BASE}/api/dashboard/settings/ip`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staticIp }),
    });
    const data = await r.json();
    if (!r.ok) { setIpError(data.error ?? "Erreur"); setIpStatus("error"); return; }
    setIpStatus("success");
    setTimeout(() => setIpStatus("idle"), 3000);
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas");
      setPwStatus("error");
      return;
    }
    setPwStatus("loading");
    setPwError("");
    const r = await fetch(`${BASE}/api/dashboard/settings/password`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await r.json();
    if (!r.ok) { setPwError(data.error ?? "Erreur"); setPwStatus("error"); return; }
    setPwStatus("success");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setPwStatus("idle"), 3000);
  };

  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem("settings-desktop-banner") === "1"
  );
  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("settings-desktop-banner", "1");
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
                Cette page contient de nombreuses configurations. Nous vous recommandons de l'utiliser depuis un <span className="font-medium text-foreground">ordinateur ou une tablette</span> pour une navigation optimale.
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
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground text-sm mt-1">Configurez votre compte et vos intégrations.</p>
        </div>

        <div className="flex gap-5">
          {/* Left sidebar */}
          <div className="w-52 shrink-0 space-y-1">
            <div className="rounded-2xl border border-border bg-card overflow-hidden p-2">
              <div className="px-3 py-2 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {user?.companyName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{user?.companyName ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? "—"}</p>
                  </div>
                </div>
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
            {activeSection === "webhook" && (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Webhook className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">URL de Webhook</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">DrimPay envoie une notification POST à cette URL à chaque changement d'état d'une transaction.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">URL de callback</label>
                    <input
                      type="url"
                      placeholder="https://votreapp.com/webhook/drimpay"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className={inputCls(webhookStatus === "error")}
                    />
                  </div>
                  <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary font-semibold">Conseil :</span> Votre endpoint doit répondre avec un statut <code className="text-primary font-mono">200</code> pour confirmer la réception. DrimPay signe chaque requête avec un header <code className="text-primary font-mono">X-DrimPay-Signature</code>.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveWebhook}
                      disabled={webhookStatus === "loading"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {webhookStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Sauvegarder
                    </button>
                    {webhookUrl && (
                      <button onClick={() => setWebhookUrl("")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Effacer
                      </button>
                    )}
                  </div>
                  <Feedback status={webhookStatus} error={webhookError} />
                </div>
              </div>
            )}

            {activeSection === "ip" && (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Wifi className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">Adresse IP Statique</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Configurez votre IP statique pour que vos retraits (reversements) soient autorisés sans blocage de sécurité.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Adresse IP (optionnel)</label>
                    <input
                      type="text"
                      placeholder="192.168.1.1"
                      value={staticIp}
                      onChange={(e) => setStaticIp(e.target.value)}
                      className={inputCls(ipStatus === "error")}
                    />
                  </div>
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-xs text-amber-400/90 leading-relaxed">
                    <span className="font-semibold">Note :</span> Si vous disposez d'une adresse IP statique, configurez-la ici. Cela permet que vos reversements passent sans friction supplémentaire côté sécurité.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveIp}
                      disabled={ipStatus === "loading"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {ipStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Sauvegarder
                    </button>
                    {staticIp && (
                      <button onClick={() => setStaticIp("")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Effacer
                      </button>
                    )}
                  </div>
                  <Feedback status={ipStatus} error={ipError} />
                </div>
              </div>
            )}

            {activeSection === "password" && (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">Modifier le mot de passe</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Choisissez un mot de passe fort d'au moins 8 caractères.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={cn(inputCls(pwStatus === "error" && !currentPassword), "pr-11")}
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        placeholder="Min. 8 caractères"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={cn(inputCls(), "pr-11")}
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(inputCls(confirmPassword.length > 0 && confirmPassword !== newPassword))}
                    />
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                  <button
                    onClick={savePassword}
                    disabled={pwStatus === "loading" || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 mt-1"
                  >
                    {pwStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Changer le mot de passe
                  </button>
                  <Feedback status={pwStatus} error={pwError} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
