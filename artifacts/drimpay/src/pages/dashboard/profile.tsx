import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "./layout";
import { useAuth } from "@/lib/auth";
import {
  Camera, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, Copy, RefreshCw, AlertTriangle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import companyImg  from "@assets/icon3d_company.png";
import apiKeyImg   from "@assets/icon3d_api_key.png";
import securityImg from "@assets/icon3d_security.png";
import identityImg from "@assets/icon3d_identity.png";
import userImg     from "@assets/20260125_232710_1771507041579-BmqaXdG3_1778105456352.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Status = "idle" | "loading" | "success" | "error";

const inputCls = cn(
  "w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all",
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
  const [copied, setCopied] = useState(false);
  const prefix = keyData?.prefix ?? null;
  const isLive = env === "live";
  const label = isLive ? "Clé Live" : "Clé Sandbox";
  const dot = isLive ? "bg-green-400" : "bg-yellow-400";
  const badge = isLive ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200";
  const handleCopy = () => {
    if (!prefix) return;
    navigator.clipboard.writeText(prefix + "•".repeat(24));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{isLive ? "LIVE" : "SANDBOX"}</span>
          <span className="text-sm font-semibold text-gray-900">{label}</span>
        </div>
        <button onClick={() => onRegen(env)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors font-medium shrink-0 ml-2">
          <RefreshCw className="w-3.5 h-3.5" />{keyData ? "Régénérer" : "Générer"}
        </button>
      </div>
      {keyData ? (
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2.5 font-mono text-xs min-w-0">
          <span className="flex-1 truncate text-gray-700">{prefix}{"•".repeat(24)}</span>
          <button onClick={handleCopy} className="text-gray-400 hover:text-primary shrink-0">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
          <Lock className="w-3.5 h-3.5" />Aucune clé générée
        </div>
      )}
      {keyData && (
        <p className="text-[11px] text-gray-400">
          Créée le {new Date(keyData.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          {keyData.lastUsedAt && ` · Dernière utilisation ${new Date(keyData.lastUsedAt).toLocaleDateString("fr-FR")}`}
        </p>
      )}
    </div>
  );
}

const MENU_ITEMS = [
  { key: "profil",   label: "Profil",      img: companyImg },
  { key: "api",      label: "Clés API",    img: apiKeyImg },
  { key: "securite", label: "Sécurité",    img: securityImg },
  { key: "compte",   label: "Identifiant", img: identityImg },
];

export default function DashboardProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("profil");

  const [infoForm, setInfoForm] = useState({ companyName: user?.companyName ?? "", email: user?.email ?? "", country: user?.country ?? "" });
  const [infoStatus, setInfoStatus] = useState<Status>("idle");
  const [infoError, setInfoError] = useState("");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [pwError, setPwError] = useState("");
  const [showPw, setShowPw] = useState({ current: false, new: false });

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
    const map: Record<string, string> = { TG: "Togo", BJ: "Bénin", CM: "Cameroun", SN: "Sénégal", CI: "Côte d'Ivoire", ML: "Mali", BF: "Burkina Faso" };
    return map[code] ?? code;
  };

  const isActive = (key: string) => activeSection === key;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos informations personnelles et la sécurité de votre compte.</p>
        </div>

        {/* Mobile avatar card */}
        <div className="flex md:hidden items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={userImg} alt="" className="w-6 h-6 object-contain opacity-60" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
              <Camera className="w-2.5 h-2.5 text-black" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.companyName ?? "—"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? "—"}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">{user?.role ?? "user"}</span>
          </div>
          {(user as any)?.merchantCode && (
            <button
              onClick={() => navigator.clipboard.writeText((user as any).merchantCode)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
            >
              <span className="font-mono text-[11px] font-bold text-gray-700 tracking-widest">{(user as any).merchantCode}</span>
              <Copy className="w-2.5 h-2.5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-5">

          {/* Sidebar */}
          <div className="md:w-52 md:shrink-0">

            {/* Mobile tabs */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {MENU_ITEMS.map(({ key, label, img }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors border",
                    isActive(key)
                      ? "bg-primary/10 text-gray-900 border-primary/30 font-semibold"
                      : "text-gray-500 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <img src={img} alt="" className="w-5 h-5 object-contain shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:block rounded-2xl border border-gray-100 bg-white overflow-hidden p-2 shadow-sm">
              <div className="flex flex-col items-center px-3 py-4 mb-1">
                <div className="relative mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <img src={userImg} alt="" className="w-7 h-7 object-contain opacity-60" />
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
                    <Camera className="w-3 h-3 text-black" />
                  </button>
                </div>
                <p className="text-xs font-bold text-gray-900 text-center truncate w-full">{user?.companyName ?? "—"}</p>
                <p className="text-[10px] text-gray-400 truncate w-full text-center">{user?.email ?? "—"}</p>
                <span className="mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">{user?.role ?? "user"}</span>
                {(user as any)?.merchantCode && (
                  <button
                    onClick={() => navigator.clipboard.writeText((user as any).merchantCode)}
                    title="Copier le code marchand"
                    className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors group"
                  >
                    <span className="font-mono text-[11px] font-bold text-gray-700 tracking-widest">{(user as any).merchantCode}</span>
                    <Copy className="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </button>
                )}
              </div>
              <div className="h-px bg-gray-100 mx-1 mb-2" />
              {MENU_ITEMS.map(({ key, label, img }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={cn(
                    "w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive(key)
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

            {activeSection === "profil" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <img src={companyImg} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900">Informations du compte</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Mettez à jour le nom de votre entreprise et votre email.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {(user as any)?.merchantCode && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Code marchand</p>
                        <p className="font-mono text-sm font-bold text-gray-900 tracking-widest truncate">{(user as any).merchantCode}</p>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText((user as any).merchantCode)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium shrink-0 text-gray-600"
                      >
                        <Copy className="w-3 h-3" /> Copier
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nom de l'entreprise</label>
                    <input className={inputCls} value={infoForm.companyName} onChange={e => setInfoForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Ex: SARL MonEntreprise" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Adresse email</label>
                    <input type="email" className={inputCls} value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@entreprise.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Pays</label>
                    <select className={inputCls} value={infoForm.country} onChange={e => setInfoForm(f => ({ ...f, country: e.target.value }))}>
                      {[
                        { code: "TG", label: "Togo" }, { code: "BJ", label: "Bénin" },
                        { code: "CM", label: "Cameroun" }, { code: "SN", label: "Sénégal" },
                        { code: "CI", label: "Côte d'Ivoire" }, { code: "ML", label: "Mali" },
                        { code: "BF", label: "Burkina Faso" },
                      ].map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={handleInfoSave}
                    disabled={infoStatus === "loading"}
                    className="flex items-center gap-2 bg-primary text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {infoStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Sauvegarder les modifications
                  </button>
                  <Feedback status={infoStatus} error={infoError} />
                </div>
              </div>
            )}

            {activeSection === "api" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <img src={apiKeyImg} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900">Configuration des clés API</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Une clé unique par environnement. La régénération révoque immédiatement l'ancienne clé.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Les clés ne sont affichées qu'une seule fois lors de leur génération. Ne partagez jamais votre clé live dans votre code source.
                    </p>
                  </div>
                  <ApiKeyCard env="sandbox" keyData={sandboxKey} onRegen={openRegen} />
                  <ApiKeyCard env="live" keyData={liveKey} onRegen={openRegen} />
                </div>
              </div>
            )}

            {activeSection === "securite" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <img src={securityImg} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900">Sécurité — Mot de passe</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Modifiez votre mot de passe. Utilisez au moins 8 caractères.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Mot de passe actuel</label>
                    <div className="relative">
                      <input type={showPw.current ? "text" : "password"} className={cn(inputCls, "pr-11")} value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" />
                      <button type="button" tabIndex={-1} onClick={() => setShowPw(v => ({ ...v, current: !v.current }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nouveau mot de passe</label>
                    <div className="relative">
                      <input type={showPw.new ? "text" : "password"} className={cn(inputCls, "pr-11")} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="••••••••" />
                      <button type="button" tabIndex={-1} onClick={() => setShowPw(v => ({ ...v, new: !v.new }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Confirmer le nouveau mot de passe</label>
                    <input type="password" className={inputCls} value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" />
                    {pwForm.confirmPassword.length > 0 && pwForm.confirmPassword !== pwForm.newPassword && (
                      <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    disabled={pwStatus === "loading" || !pwForm.currentPassword || !pwForm.newPassword}
                    className="flex items-center gap-2 bg-primary text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {pwStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Changer le mot de passe
                  </button>
                  <Feedback status={pwStatus} error={pwError} />
                </div>
              </div>
            )}

            {activeSection === "compte" && (
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <img src={identityImg} alt="" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-gray-900">Identifiant compte</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Référence unique de votre compte DrimPay.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="font-mono text-xs text-gray-400">ID</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">#{user?.id ?? "—"}</span>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-gray-400 shrink-0">Entreprise</span>
                      <span className="font-semibold text-gray-900 text-right truncate">{user?.companyName ?? "—"}</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-gray-400 shrink-0">Email</span>
                      <span className="font-semibold text-gray-900 text-right truncate">{user?.email ?? "—"}</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-gray-400 shrink-0">Pays</span>
                      <span className="font-semibold text-gray-900">{countryLabel(user?.country ?? "")}</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-gray-400 shrink-0">Rôle</span>
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
