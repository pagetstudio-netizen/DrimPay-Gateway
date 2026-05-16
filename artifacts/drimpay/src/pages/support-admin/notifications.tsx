import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, Loader2, X, ExternalLink } from "lucide-react";
import { SupportAuthProvider, SupportLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Banner = {
  id: number;
  message: string;
  color: string;
  customColor: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  active: boolean;
  createdAt: string;
};

const COLOR_OPTIONS = [
  { value: "blue",   label: "Bleu",   bg: "#1d4ed8" },
  { value: "green",  label: "Vert",   bg: "#15803d" },
  { value: "yellow", label: "Jaune",  bg: "#d97706" },
  { value: "red",    label: "Rouge",  bg: "#dc2626" },
  { value: "purple", label: "Violet", bg: "#7c3aed" },
  { value: "orange", label: "Orange", bg: "#ea580c" },
  { value: "dark",   label: "Sombre", bg: "#0f0f0f" },
  { value: "lime",   label: "Lime",   bg: "#C5FF4A" },
  { value: "custom", label: "Personnalisé", bg: "conic-gradient(red,orange,yellow,green,blue,violet,red)" },
];

const PREVIEW_TEXT: Record<string, { bg: string; text: string }> = {
  blue:   { bg: "#1d4ed8", text: "#ffffff" },
  green:  { bg: "#15803d", text: "#ffffff" },
  yellow: { bg: "#d97706", text: "#ffffff" },
  red:    { bg: "#dc2626", text: "#ffffff" },
  purple: { bg: "#7c3aed", text: "#ffffff" },
  orange: { bg: "#ea580c", text: "#ffffff" },
  dark:   { bg: "#0f0f0f", text: "#ffffff" },
  lime:   { bg: "#C5FF4A", text: "#0f0f0f" },
};

function getBannerStyle(banner: Banner) {
  if (banner.color === "custom" && banner.customColor) {
    return { bg: banner.customColor, text: "#ffffff" };
  }
  return PREVIEW_TEXT[banner.color] ?? PREVIEW_TEXT.blue;
}

function NotificationsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    message: "",
    color: "blue",
    customColor: "#3b82f6",
    buttonText: "",
    buttonLink: "",
    active: true,
  });

  useEffect(() => { loadBanners(); }, []);

  async function loadBanners() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/support-admin/global-banners`, { credentials: "include" });
      const d = await r.json();
      if (Array.isArray(d)) setBanners(d);
    } catch {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setCreating(true);
    try {
      const body = {
        message: form.message.trim(),
        color: form.color,
        customColor: form.color === "custom" ? form.customColor : undefined,
        buttonText: form.buttonText.trim() || undefined,
        buttonLink: form.buttonLink.trim() || undefined,
        active: form.active,
      };
      const r = await fetch(`${BASE}/api/support-admin/global-banners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Erreur serveur");
      setForm({ message: "", color: "blue", customColor: "#3b82f6", buttonText: "", buttonLink: "", active: true });
      await loadBanners();
    } catch {}
    setCreating(false);
  }

  async function handleToggle(id: number) {
    setSavingId(id);
    try {
      const r = await fetch(`${BASE}/api/support-admin/global-banners/${id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      const updated = await r.json();
      setBanners(prev => prev.map(b => b.id === id ? updated : b));
    } catch {}
    setSavingId(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette bannière ?")) return;
    setDeletingId(id);
    try {
      await fetch(`${BASE}/api/support-admin/global-banners/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch {}
    setDeletingId(null);
  }

  const previewColors = form.color === "custom"
    ? { bg: form.customColor, text: "#ffffff" }
    : PREVIEW_TEXT[form.color] ?? PREVIEW_TEXT.blue;

  return (
    <SupportLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[#C5FF4A]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Notifications globales</h1>
            <p className="text-sm text-gray-400">Créez des bannières visibles par tous les utilisateurs connectés</p>
          </div>
        </div>

        {/* Create form */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="font-semibold text-white mb-1">Nouvelle notification</h2>
          <p className="text-xs text-gray-500 mb-5">S'affichera en haut du dashboard pour tous les marchands</p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Message</label>
              <textarea
                rows={2}
                placeholder="Votre message de notification..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-700 bg-gray-800 text-sm text-white placeholder-gray-500 resize-none outline-none focus:ring-2 focus:ring-[#C5FF4A]/30 focus:border-[#C5FF4A]/50 transition"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Couleur de la bannière</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.filter(c => c.value !== "custom").map(c => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setForm(f => ({ ...f, color: c.value }))}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                      form.color === c.value ? "border-white scale-110" : "border-gray-700"
                    )}
                    style={{ background: c.bg }}
                  />
                ))}
                <button
                  type="button"
                  title="Personnalisé"
                  onClick={() => setForm(f => ({ ...f, color: "custom" }))}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                    form.color === "custom" ? "border-white scale-110" : "border-gray-700"
                  )}
                  style={{ background: "conic-gradient(red,orange,yellow,green,blue,violet,red)" }}
                />
              </div>
              {form.color === "custom" && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={form.customColor}
                    onChange={e => setForm(f => ({ ...f, customColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.customColor}
                    onChange={e => setForm(f => ({ ...f, customColor: e.target.value }))}
                    placeholder="#3b82f6"
                    className="w-28 px-2 py-1 rounded-lg border border-gray-700 bg-gray-800 text-xs text-white outline-none font-mono"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Texte du bouton (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: En savoir plus"
                  value={form.buttonText}
                  onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                  maxLength={60}
                  className="w-full px-3 py-2 rounded-xl border border-gray-700 bg-gray-800 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#C5FF4A]/30 focus:border-[#C5FF4A]/50 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Lien du bouton (optionnel)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.buttonLink}
                  onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-700 bg-gray-800 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#C5FF4A]/30 focus:border-[#C5FF4A]/50 transition"
                />
              </div>
            </div>

            {/* Preview */}
            {form.message && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Aperçu</label>
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: previewColors.bg, color: previewColors.text }}
                >
                  <p className="flex-1 text-sm font-medium text-center">{form.message}</p>
                  {form.buttonText && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold shrink-0"
                      style={{ backgroundColor: "rgba(255,255,255,0.25)", color: previewColors.text }}
                    >
                      {form.buttonText}
                    </span>
                  )}
                  <X className="w-3.5 h-3.5 opacity-50 shrink-0" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ backgroundColor: form.active ? "#C5FF4A" : "#374151" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ transform: form.active ? "translateX(22px)" : "translateX(2px)" }}
                  />
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="sr-only"
                  />
                </div>
                <span className="text-sm font-medium text-gray-300">Activer immédiatement</span>
              </label>

              <button
                type="submit"
                disabled={creating || !form.message.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C5FF4A] text-gray-900 text-sm font-semibold hover:bg-[#d4ff6a] transition disabled:opacity-40"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer la notification
              </button>
            </div>
          </form>
        </div>

        {/* Existing banners */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="font-semibold text-white mb-1">Notifications existantes</h2>
          <p className="text-xs text-gray-500 mb-4">Activez, désactivez ou supprimez les bannières</p>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-[#C5FF4A] animate-spin" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-10">
              <Megaphone className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucune bannière créée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map(banner => {
                const preview = getBannerStyle(banner);
                return (
                  <div key={banner.id} className="border border-gray-800 rounded-xl overflow-hidden">
                    {/* Banner preview */}
                    <div
                      className="flex items-center gap-3 px-4 py-2 text-sm"
                      style={{ backgroundColor: preview.bg, color: preview.text }}
                    >
                      <span className="flex-1 truncate font-medium">{banner.message}</span>
                      {banner.buttonText && (
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                          {banner.buttonText}
                        </span>
                      )}
                    </div>
                    {/* Controls */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        banner.active ? "bg-[#C5FF4A]/10 text-[#C5FF4A] border border-[#C5FF4A]/20" : "bg-gray-700 text-gray-400"
                      )}>
                        {banner.active ? "Actif" : "Inactif"}
                      </span>
                      {banner.buttonLink && (
                        <a
                          href={banner.buttonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 truncate max-w-[140px]"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {banner.buttonLink}
                        </a>
                      )}
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(banner.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(banner.id)}
                        disabled={savingId === banner.id}
                        title={banner.active ? "Désactiver" : "Activer"}
                        className="relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-50"
                        style={{ backgroundColor: banner.active ? "#C5FF4A" : "#374151" }}
                      >
                        {savingId === banner.id ? (
                          <Loader2 className="w-3 h-3 animate-spin absolute top-1 left-1 text-gray-900" />
                        ) : (
                          <div
                            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                            style={{ transform: banner.active ? "translateX(18px)" : "translateX(2px)" }}
                          />
                        )}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(banner.id)}
                        disabled={deletingId === banner.id}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {deletingId === banner.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </SupportLayout>
  );
}

export default function SupportAdminNotifications() {
  return (
    <SupportAuthProvider>
      <NotificationsPage />
    </SupportAuthProvider>
  );
}
