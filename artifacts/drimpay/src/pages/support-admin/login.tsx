import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SupportAdminLogin() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE}/api/support-admin/login`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error ?? "Erreur de connexion"); return; }
      if (d.mustChangePassword) { navigate("/support-admin/change-password"); return; }
      navigate("/support-admin");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 mb-4">
            <ShieldCheck className="w-7 h-7 text-[#C5FF4A]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Support Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Espace réservé aux agents DrimPay</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email" required autoFocus
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full h-11 rounded-xl bg-gray-800 border border-gray-700 px-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#C5FF4A]/50 focus:ring-2 focus:ring-[#C5FF4A]/10 transition-all"
              placeholder="email@drimpay.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full h-11 rounded-xl bg-gray-800 border border-gray-700 px-4 pr-11 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#C5FF4A]/50 focus:ring-2 focus:ring-[#C5FF4A]/10 transition-all"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full h-11 bg-[#C5FF4A] text-gray-950 font-bold text-sm rounded-xl hover:bg-[#C5FF4A]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Se connecter
          </button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-4">DrimPay · Accès restreint</p>
      </div>
    </div>
  );
}
