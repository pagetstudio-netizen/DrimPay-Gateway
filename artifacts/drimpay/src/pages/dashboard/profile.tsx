import { useState } from "react";
import { DashboardLayout } from "./layout";
import { useAuth } from "@/lib/auth";
import { User, Mail, Building2, Globe, Shield, Camera, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import userImg from "@assets/20260125_232710_1771507041579-BmqaXdG3_1778105456352.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Status = "idle" | "loading" | "success" | "error";

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
              <input
                className={inputCls}
                value={infoForm.companyName}
                onChange={e => setInfoForm(f => ({ ...f, companyName: e.target.value }))}
                placeholder="Ex: SARL MonEntreprise"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Adresse email</label>
              <input
                type="email"
                className={inputCls}
                value={infoForm.email}
                onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))}
                placeholder="contact@entreprise.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Pays</label>
              <select
                className={inputCls}
                value={infoForm.country}
                onChange={e => setInfoForm(f => ({ ...f, country: e.target.value }))}
              >
                {[
                  { code: "TG", label: "🇹🇬 Togo" },
                  { code: "BJ", label: "🇧🇯 Bénin" },
                  { code: "CM", label: "🇨🇲 Cameroun" },
                  { code: "SN", label: "🇸🇳 Sénégal" },
                  { code: "CI", label: "🇨🇮 Côte d'Ivoire" },
                  { code: "ML", label: "🇲🇱 Mali" },
                  { code: "BF", label: "🇧🇫 Burkina Faso" },
                ].map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleInfoSave}
              disabled={infoStatus === "loading"}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              style={{ color: "#000" }}
            >
              {infoStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sauvegarder les modifications
            </button>
            <Feedback status={infoStatus} error={infoError} />
          </div>
        </Section>

        <Section icon={Shield} title="Sécurité — Mot de passe" desc="Modifiez votre mot de passe. Utilisez au moins 8 caractères.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Mot de passe actuel</label>
              <input
                type="password"
                className={inputCls}
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Nouveau mot de passe</label>
              <input
                type="password"
                className={inputCls}
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className={inputCls}
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={pwStatus === "loading" || !pwForm.currentPassword || !pwForm.newPassword}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              style={{ color: "#000" }}
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
    </DashboardLayout>
  );
}
