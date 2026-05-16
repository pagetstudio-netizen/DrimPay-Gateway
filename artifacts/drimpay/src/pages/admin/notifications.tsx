import { useEffect, useRef, useState } from "react";
import {
  Bell, AlertTriangle, CheckCircle2, Info, TrendingUp, Users,
  ShieldCheck, ArrowLeftRight, Plus, Trash2, ToggleLeft, ToggleRight,
  Loader2, Upload, X, ExternalLink, Megaphone, ImageIcon,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type Banner = {
  id: number;
  message: string;
  color: string;
  customColor: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
};

// ─── Color options ────────────────────────────────────────────────────────────

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

// ─── Mock system notifications ────────────────────────────────────────────────

const MOCK_NOTIFS = [
  { id: 1, type: "warning", icon: AlertTriangle, title: "Dossier KYB en attente", body: "3 dossiers KYB ont été soumis et attendent votre révision depuis plus de 24h.", time: "Il y a 2h", read: false, href: "/admin/kyb" },
  { id: 2, type: "info",    icon: TrendingUp,    title: "Volume élevé détecté", body: "Une transaction de 120 000 XOF a été initiée par MarketPro CI sur Orange Money CI.", time: "Il y a 4h", read: false, href: "/admin/transactions" },
  { id: 3, type: "success", icon: CheckCircle2,  title: "Nouveau marchand inscrit", body: "TechPay Solutions vient de s'inscrire depuis le Sénégal.", time: "Il y a 5h", read: false, href: "/admin/merchants" },
  { id: 4, type: "warning", icon: ShieldCheck,   title: "KYB soumis — En attente", body: "FinTech Bénin a soumis son dossier KYB complet.", time: "Il y a 8h", read: true, href: "/admin/kyb" },
  { id: 5, type: "info",    icon: Users,         title: "10 nouveaux marchands ce mois", body: "La plateforme enregistre une croissance de +25% de marchands inscrits.", time: "Il y a 1j", read: true, href: "/admin/merchants" },
  { id: 6, type: "success", icon: ArrowLeftRight, title: "Agrégateur PayDunya opérationnel", body: "Le routage PayDunya pour le Sénégal est maintenant actif.", time: "Il y a 2j", read: true, href: "/admin/aggregators" },
  { id: 7, type: "error",   icon: AlertTriangle, title: "Échec webhook répété", body: "Le webhook de TechPay Mali a échoué 3 fois consécutivement.", time: "Il y a 3j", read: true, href: "/admin/transactions" },
];

const TYPE_STYLES: Record<string, { bg: string; icon: string; border: string }> = {
  warning: { bg: "bg-amber-50",  icon: "text-amber-500",  border: "border-amber-200" },
  error:   { bg: "bg-red-50",    icon: "text-red-500",    border: "border-red-200" },
  success: { bg: "bg-green-50",  icon: "text-green-500",  border: "border-green-200" },
  info:    { bg: "bg-blue-50",   icon: "text-blue-500",   border: "border-blue-200" },
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminNotifications() {
  // System notifications state
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Global banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    message: "",
    color: "blue",
    customColor: "#3b82f6",
    buttonText: "",
    buttonLink: "",
    imageUrl: "",
    active: true,
  });

  // Load banners
  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    setLoadingBanners(true);
    try {
      const r = await fetch(`${BASE}/api/admin/global-banners`, { credentials: "include" });
      const d = await r.json();
      if (Array.isArray(d)) setBanners(d);
    } catch {}
    setLoadingBanners(false);
  }

  // Create banner
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
        imageUrl: form.imageUrl.trim() || undefined,
        active: form.active,
      };
      const r = await fetch(`${BASE}/api/admin/global-banners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Erreur serveur");
      setForm({ message: "", color: "blue", customColor: "#3b82f6", buttonText: "", buttonLink: "", imageUrl: "", active: true });
      await loadBanners();
    } catch {}
    setCreating(false);
  }

  // Toggle active
  async function handleToggle(id: number) {
    setSavingId(id);
    try {
      const r = await fetch(`${BASE}/api/admin/global-banners/${id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      const updated = await r.json();
      setBanners(prev => prev.map(b => b.id === id ? updated : b));
    } catch {}
    setSavingId(null);
  }

  // Delete
  async function handleDelete(id: number) {
    if (!confirm("Supprimer cette bannière ?")) return;
    setDeletingId(id);
    try {
      await fetch(`${BASE}/api/admin/global-banners/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch {}
    setDeletingId(null);
  }

  // Upload image
  async function handleImageUpload(file: File) {
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await fetch(`${BASE}/api/admin/global-banners/upload-image`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const d = await r.json();
      if (d.url) setForm(f => ({ ...f, imageUrl: d.url }));
      else if (d.error) alert(d.error);
    } catch {
      alert("Échec de l'upload");
    }
    setUploadingImg(false);
  }

  // Preview colors
  const previewColors = form.color === "custom"
    ? { bg: form.customColor, text: "#ffffff" }
    : PREVIEW_TEXT[form.color] ?? PREVIEW_TEXT.blue;

  // System notifications helpers
  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: number) => setNotifs(ns => ns.filter(n => n.id !== id));
  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === "unread" ? notifs.filter(n => !n.read) : notifs;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Global Banners Section ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications globales</h1>
              <p className="text-sm text-gray-500">Créez des bannières de notification visibles par tous les utilisateurs</p>
            </div>
          </div>

          {/* Create form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-gray-900 mb-1">Nouvelle notification</h2>
            <p className="text-xs text-gray-400 mb-5">Cette notification s'affichera en haut de l'écran pour les utilisateurs connectés</p>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                <textarea
                  rows={2}
                  placeholder="Votre message de notification..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Couleur de la bannière</label>
                  <select
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white transition"
                  >
                    {COLOR_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {/* Color swatches */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLOR_OPTIONS.filter(c => c.value !== "custom").map(c => (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => setForm(f => ({ ...f, color: c.value }))}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                          form.color === c.value ? "border-gray-900 scale-110" : "border-white shadow"
                        )}
                        style={{ background: c.bg }}
                      />
                    ))}
                    <button
                      type="button"
                      title="Personnalisé"
                      onClick={() => setForm(f => ({ ...f, color: "custom" }))}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                        form.color === "custom" ? "border-gray-900 scale-110" : "border-white shadow"
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
                        className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 outline-none font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Image */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Image (optionnel)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://... ou importer"
                      value={form.imageUrl}
                      onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition shrink-0 disabled:opacity-50"
                    >
                      {uploadingImg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Importer
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }}
                    />
                  </div>
                  {form.imageUrl && (
                    <div className="flex items-center gap-2 mt-2">
                      <img src={form.imageUrl} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))} className="text-xs text-red-500 hover:text-red-700">
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Button text */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Texte du bouton (optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: Cliquez ici"
                    value={form.buttonText}
                    onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                    maxLength={60}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  />
                </div>
                {/* Button link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lien du bouton (optionnel)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.buttonLink}
                    onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              {/* Preview */}
              {form.message && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Aperçu</label>
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                    style={{ backgroundColor: previewColors.bg, color: previewColors.text }}
                  >
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
                    )}
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
                    style={{ backgroundColor: form.active ? "#10b981" : "#d1d5db" }}
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
                  <span className="text-sm font-medium text-gray-700">Activer immédiatement</span>
                </label>

                <button
                  type="submit"
                  disabled={creating || !form.message.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Créer la notification
                </button>
              </div>
            </form>
          </div>

          {/* Existing banners */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Notifications existantes</h2>
            <p className="text-xs text-gray-400 mb-4">Gérez vos notifications (activer/désactiver ou supprimer)</p>

            {loadingBanners ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-10">
                <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucune bannière créée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map(banner => {
                  const preview = banner.color === "custom" && banner.customColor
                    ? { bg: banner.customColor, text: "#fff" }
                    : PREVIEW_TEXT[banner.color] ?? PREVIEW_TEXT.blue;
                  return (
                    <div
                      key={banner.id}
                      className="border border-gray-100 rounded-xl overflow-hidden"
                    >
                      {/* Banner preview strip */}
                      <div
                        className="flex items-center gap-3 px-4 py-2 text-sm"
                        style={{ backgroundColor: preview.bg, color: preview.text }}
                      >
                        {banner.imageUrl && (
                          <img src={banner.imageUrl} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                        )}
                        <span className="flex-1 truncate font-medium">{banner.message}</span>
                        {banner.buttonText && (
                          <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                            {banner.buttonText}
                          </span>
                        )}
                      </div>
                      {/* Controls row */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                        <div className="flex items-center gap-2 flex-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            banner.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                          )}>
                            {banner.active ? "Actif" : "Inactif"}
                          </span>
                          {banner.buttonLink && (
                            <a
                              href={banner.buttonLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 truncate max-w-[160px]"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              {banner.buttonLink}
                            </a>
                          )}
                          {banner.imageUrl && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <ImageIcon className="w-3 h-3" /> Image
                            </span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(banner.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggle(banner.id)}
                            disabled={savingId === banner.id}
                            title={banner.active ? "Désactiver" : "Activer"}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500 disabled:opacity-50"
                          >
                            {savingId === banner.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : banner.active
                                ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                                : <ToggleLeft className="w-5 h-5 text-gray-400" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id)}
                            disabled={deletingId === banner.id}
                            title="Supprimer"
                            className="p-1.5 rounded-lg hover:bg-red-50 transition text-gray-400 hover:text-red-500 disabled:opacity-50"
                          >
                            {deletingId === banner.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── System Notifications Section ───────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications système</h2>
              <p className="text-sm text-gray-500">{unreadCount} non lu(s)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[["all", "Toutes"], ["unread", "Non lues"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v as any)}
                    className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", filter === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                    {l}
                  </button>
                ))}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="px-4 py-2 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucune notification</p>
              </div>
            )}
            {filtered.map(n => {
              const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
              const Icon = n.icon;
              return (
                <div key={n.id} className={cn("bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 transition-all", !n.read && "border-l-4", !n.read && styles.border, n.read && "border-gray-100 opacity-75")}>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", styles.bg)}>
                    <Icon className={cn("w-4 h-4", styles.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-semibold", n.read ? "text-gray-600" : "text-gray-900")}>{n.title}</p>
                      {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{n.time}</span>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Marquer lu</button>
                      )}
                      <a href={n.href} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Voir</a>
                      <button onClick={() => dismiss(n.id)} className="text-xs text-gray-400 hover:text-red-500 ml-auto">Ignorer</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
