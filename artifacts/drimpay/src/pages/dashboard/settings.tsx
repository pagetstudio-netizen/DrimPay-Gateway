import { useState, useEffect } from "react";
import { DashboardLayout } from "./layout";
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import passwordImg from "@assets/icon3d_password.png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

export default function DashboardSettings() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/settings`, { credentials: "include" }).catch(() => {});
  }, []);

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
      <div className="max-w-2xl mx-auto space-y-5">

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 text-sm mt-1">Configurez la sécurité de votre compte.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                <img src={passwordImg} alt="" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h2 className="font-semibold text-sm sm:text-base text-gray-900">Modifier le mot de passe</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Compte : <span className="font-semibold text-gray-700">{user?.email ?? "—"}</span>
                </p>
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
        </div>

      </div>
    </DashboardLayout>
  );
}
