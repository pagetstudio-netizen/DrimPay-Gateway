import { useState, useEffect } from "react";
import { DashboardLayout } from "./layout";
import { Webhook, Lock, Wifi, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Save } from "lucide-react";
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

function Feedback({ status, error }: { status: Status; error: string }) {
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

const inputCls = (hasError?: boolean) => cn(
  "w-full h-11 rounded-xl border bg-muted/20 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all",
  "focus:border-primary focus:ring-2 focus:ring-primary/20",
  hasError ? "border-red-400" : "border-border"
);

export default function DashboardSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);

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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Paramètres</h1>
          <p className="text-muted-foreground text-sm">Configurez votre compte et vos intégrations.</p>
        </div>

        {/* Compte */}
        <div className="rounded-2xl border border-border bg-muted/10 px-6 py-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-lg shrink-0">
            {user?.companyName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold">{user?.companyName ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Webhook URL */}
          <Section
            icon={Webhook}
            title="URL de Webhook"
            desc="DrimPay envoie une notification POST à cette URL à chaque changement d'état d'une transaction."
          >
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
          </Section>

          {/* Static IP */}
          <Section
            icon={Wifi}
            title="Adresse IP Statique"
            desc="Configurez votre IP statique pour que vos retraits (reversements) soient autorisés sans blocage de sécurité."
          >
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
          </Section>

          {/* Password */}
          <Section
            icon={Lock}
            title="Modifier le mot de passe"
            desc="Choisissez un mot de passe fort d'au moins 8 caractères."
          >
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
          </Section>
        </div>
      </div>
    </DashboardLayout>
  );
}
