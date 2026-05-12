import { useState, useEffect } from "react";
import { DashboardLayout } from "./layout";
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import webhookImg  from "@assets/icon3d_webhook.png";
import ipImg       from "@assets/icon3d_ip_statique.png";
import passwordImg from "@assets/icon3d_password.png";

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
  "w-full h-11 rounded-xl border bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all",
  "focus:border-primary focus:ring-2 focus:ring-primary/20",
  hasError ? "border-red-400" : "border-gray-200"
);

const MENU_ITEMS = [
  { key: "webhook", label: "Webhook",       img: webhookImg },
  { key: "ip",      label: "IP Statique",   img: ipImg },
  { key: "password",label: "Mot de passe",  img: passwordImg },
];

export default function DashboardSettings() {
  const { user } = useAuth();
  const [, setSettings] = useState<Settings | null>(null);
  const [activeSection, setActiveSection] = useState("webhook");

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<Status>("idle");
  const [webhookError, setWebhookError] = useState("");

  const [staticIp, setStaticIp] = useState("");
  const [ipStatus, setIpStatus] = useState<Status>("idle");
  const [ipError, setIpError] = useState("");

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

  const active = (key: string) => activeSection === key;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 text-sm mt-1">Configurez votre compte et vos intégrations.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-5">

          {/* Sidebar / Tab strip */}
          <div className="md:w-52 md:shrink-0">

            {/* Mobile tabs */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {MENU_ITEMS.map(({ key, label, img }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors border",
                    active(key)
                      ? "bg-primary/10 text-gray-900 border-primary/30 font-semibold"
                      : "text-gray-500 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <img src={img} alt="" className="w-5 h-5 object-contain shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop sidebar card */}
            <div className="hidden md:block rounded-2xl border border-gray-100 bg-white overflow-hidden p-2 shadow-sm">
              <div className="px-3 py-2 mb-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {user?.companyName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{user?.companyName ?? "—"}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.email ?? "—"}</p>
                  </div>
                </div>
              </div>
              <div className="h-px bg-gray-100 mx-1 mb-2" />
              {MENU_ITEMS.map(({ key, label, img }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active(key)
                      ? "bg-primary/10 text-gray-900 font-semibold border-l-[3px] border-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <img src={img} alt="" className="w-6 h-6 object-contain shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content panel */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {activeSection === "webhook" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <img src={webhookImg} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900">URL de Webhook</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">DrimPay envoie une notification POST à cette URL à chaque changement d'état d'une transaction.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">URL de callback</label>
                    <input
                      type="url"
                      placeholder="https://votreapp.com/webhook/drimpay"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className={inputCls(webhookStatus === "error")}
                    />
                  </div>
                  <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-xs text-gray-500 leading-relaxed">
                    <span className="text-primary font-semibold">Conseil :</span> Votre endpoint doit répondre avec un statut <code className="text-primary font-mono">200</code> pour confirmer la réception. DrimPay signe chaque requête avec un header <code className="text-primary font-mono">X-DrimPay-Signature</code>.
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={saveWebhook}
                      disabled={webhookStatus === "loading"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {webhookStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Sauvegarder
                    </button>
                    {webhookUrl && (
                      <button onClick={() => setWebhookUrl("")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                        Effacer
                      </button>
                    )}
                  </div>
                  <Feedback status={webhookStatus} error={webhookError} />
                </div>
              </div>
            )}

            {activeSection === "ip" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <img src={ipImg} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900">Adresse IP Statique</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Configurez votre IP statique pour que vos retraits soient autorisés sans blocage de sécurité.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Adresse IP (optionnel)</label>
                    <input
                      type="text"
                      placeholder="192.168.1.1"
                      value={staticIp}
                      onChange={(e) => setStaticIp(e.target.value)}
                      className={inputCls(ipStatus === "error")}
                    />
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 leading-relaxed">
                    <span className="font-semibold">Note :</span> Si vous disposez d'une adresse IP statique, configurez-la ici. Cela permet que vos reversements passent sans friction supplémentaire côté sécurité.
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={saveIp}
                      disabled={ipStatus === "loading"}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {ipStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Sauvegarder
                    </button>
                    {staticIp && (
                      <button onClick={() => setStaticIp("")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                        Effacer
                      </button>
                    )}
                  </div>
                  <Feedback status={ipStatus} error={ipError} />
                </div>
              </div>
            )}

            {activeSection === "password" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <img src={passwordImg} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900">Modifier le mot de passe</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Choisissez un mot de passe fort d'au moins 8 caractères.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={cn(inputCls(pwStatus === "error" && !currentPassword), "pr-11")}
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        placeholder="Min. 8 caractères"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={cn(inputCls(), "pr-11")}
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowNew(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Confirmer le nouveau mot de passe</label>
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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 mt-1"
                  >
                    {pwStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
