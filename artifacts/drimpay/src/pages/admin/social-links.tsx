import { useEffect, useState } from "react";
import { AdminLayout } from "./layout";
import {
  Share2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Save, X, ExternalLink, GripVertical, Loader2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SocialLink = {
  id: number;
  name: string;
  platform: string;
  url: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
};

const PLATFORMS = [
  { value: "whatsapp_support", label: "WhatsApp Support" },
  { value: "whatsapp_channel", label: "WhatsApp Chaîne" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "telegram", label: "Telegram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "other", label: "Autre" },
];

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp_support: "bg-emerald-100 text-emerald-700 border-emerald-200",
  whatsapp_channel: "bg-emerald-100 text-emerald-800 border-emerald-200",
  youtube: "bg-red-100 text-red-700 border-red-200",
  facebook: "bg-blue-100 text-blue-700 border-blue-200",
  telegram: "bg-sky-100 text-sky-700 border-sky-200",
  twitter: "bg-gray-100 text-gray-700 border-gray-200",
  other: "bg-purple-100 text-purple-700 border-purple-200",
};

type FormState = {
  name: string;
  platform: string;
  url: string;
  description: string;
  sortOrder: number;
};

const EMPTY_FORM: FormState = { name: "", platform: "whatsapp_support", url: "", description: "", sortOrder: 0 };

export default function AdminSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    fetch(`${BASE}/api/admin/social-links`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setLinks(Array.isArray(d) ? d : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (link: SocialLink) => {
    setEditId(link.id);
    setForm({
      name: link.name,
      platform: link.platform,
      url: link.url,
      description: link.description ?? "",
      sortOrder: link.sortOrder,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      const url = editId
        ? `${BASE}/api/admin/social-links/${editId}`
        : `${BASE}/api/admin/social-links`;
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      showToast(editId ? "Lien mis à jour" : "Lien créé");
      closeForm();
      load();
    } catch {
      showToast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (link: SocialLink) => {
    setToggling(link.id);
    try {
      const r = await fetch(`${BASE}/api/admin/social-links/${link.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      showToast(link.active ? "Lien désactivé" : "Lien activé");
      load();
    } catch {
      showToast("Erreur", false);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce lien ?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${BASE}/api/admin/social-links/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      showToast("Lien supprimé");
      load();
    } catch {
      showToast("Erreur lors de la suppression", false);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">

        {/* Toast */}
        {toast && (
          <div className={cn(
            "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border",
            toast.ok
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          )}>
            <CheckCircle2 className="w-4 h-4" />
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Réseaux Sociaux & Support</h1>
              <p className="text-sm text-muted-foreground">Gérer les liens affichés aux marchands sur la page Support</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">{editId ? "Modifier le lien" : "Nouveau lien"}</h2>
                <button onClick={closeForm} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom affiché *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Support WhatsApp"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plateforme *</label>
                  <select
                    value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">URL / Lien *</label>
                  <input
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description (optionnel)</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Ex: Réponse en moins de 2h"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={closeForm}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.url.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editId ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Chargement...
            </div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Share2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">Aucun lien configuré</p>
              <p className="text-sm">Cliquez sur "Ajouter" pour créer le premier lien.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ordre</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Plateforme</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">URL</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <GripVertical className="w-4 h-4 opacity-30" />
                        <span className="font-mono text-xs">{link.sortOrder}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{link.name}</p>
                      {link.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                        PLATFORM_COLORS[link.platform] ?? PLATFORM_COLORS.other
                      )}>
                        {PLATFORMS.find(p => p.value === link.platform)?.label ?? link.platform}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px]">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{link.url}</span>
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggle(link)}
                        disabled={toggling === link.id}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      >
                        {toggling === link.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : link.active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                            <span className="text-emerald-600">Actif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">Inactif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(link)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          disabled={deleting === link.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deleting === link.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
