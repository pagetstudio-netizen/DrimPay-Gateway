import { useEffect, useState } from "react";
import { AdminLayout } from "./layout";
import {
  Briefcase, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Save, X, ExternalLink, Loader2, CheckCircle2, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_BASE } from "@/lib/admin-api";

type Job = {
  id: number;
  title: string;
  slug: string | null;
  department: string;
  location: string;
  type: string;
  remote: boolean;
  description: string;
  requirements: string[];
  responsibilities: string[];
  applyUrl: string | null;
  postedAt: string;
  active: boolean;
};

const JOB_TYPES = [
  { value: "full-time", label: "Temps plein" },
  { value: "part-time", label: "Temps partiel" },
  { value: "contract", label: "Contrat" },
  { value: "internship", label: "Stage" },
];

const DEPARTMENTS = ["Engineering", "Product", "Marketing", "Support", "Operations"];

function slugify(input: string): string {
  return input
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FormState = {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  remote: boolean;
  description: string;
  requirements: string;
  responsibilities: string;
  applyUrl: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  department: DEPARTMENTS[0],
  location: "",
  type: "full-time",
  remote: true,
  description: "",
  requirements: "",
  responsibilities: "",
  applyUrl: "",
  active: true,
};

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
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
    fetch(`${ADMIN_BASE}/jobs`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setJobs(Array.isArray(d) ? d : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (job: Job) => {
    setEditId(job.id);
    setForm({
      title: job.title,
      slug: job.slug ?? "",
      department: job.department,
      location: job.location,
      type: job.type,
      remote: job.remote,
      description: job.description,
      requirements: (job.requirements ?? []).join("\n"),
      responsibilities: (job.responsibilities ?? []).join("\n"),
      applyUrl: job.applyUrl ?? "",
      active: job.active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.department.trim() || !form.location.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const url = editId ? `${ADMIN_BASE}/jobs/${editId}` : `${ADMIN_BASE}/jobs`;
      const method = editId ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim() || null,
          department: form.department.trim(),
          location: form.location.trim(),
          type: form.type,
          remote: form.remote,
          description: form.description.trim(),
          requirements: form.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
          responsibilities: form.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean),
          applyUrl: form.applyUrl.trim() || null,
          active: form.active,
        }),
      });
      if (!r.ok) throw new Error();
      showToast(editId ? "Offre mise à jour" : "Offre créée");
      closeForm();
      load();
    } catch {
      showToast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (job: Job) => {
    setToggling(job.id);
    try {
      const r = await fetch(`${ADMIN_BASE}/jobs/${job.id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      showToast(job.active ? "Offre désactivée" : "Offre activée");
      load();
    } catch {
      showToast("Erreur", false);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette offre d'emploi ?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${ADMIN_BASE}/jobs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
      showToast("Offre supprimée");
      load();
    } catch {
      showToast("Erreur lors de la suppression", false);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">

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

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Offres d'emploi</h1>
              <p className="text-sm text-muted-foreground">Gérer les postes affichés sur la page Carrières</p>
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

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">{editId ? "Modifier l'offre" : "Nouvelle offre d'emploi"}</h2>
                <button onClick={closeForm} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Titre du poste *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: Ingénieur Backend Senior"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lien personnalisé (slug)</label>
                  <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                    <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">/careers/</span>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, "-")
                          .replace(/-+/g, "-"),
                      }))}
                      placeholder={slugify(form.title) || "emploi-monteur-video"}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none min-w-0"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.slug.trim()
                      ? `Lien final : drimpay.com/fr/careers/${form.slug.trim()}`
                      : `Vide = lien basé sur l'ID (ex: /careers/${editId ?? "1"})`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Département *</label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type de contrat *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    >
                      {JOB_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lieu *</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="Ex: Abidjan, Côte d'Ivoire"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.remote}
                        onChange={(e) => setForm((f) => ({ ...f, remote: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                      />
                      Télétravail possible
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez le rôle et son contexte..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Responsabilités (une par ligne)</label>
                  <textarea
                    value={form.responsibilities}
                    onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))}
                    placeholder={"Concevoir et maintenir les APIs\nCollaborer avec l'équipe produit"}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prérequis (un par ligne)</label>
                  <textarea
                    value={form.requirements}
                    onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                    placeholder={"3+ ans d'expérience en Node.js\nMaîtrise de PostgreSQL"}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lien de candidature (URL personnalisée)</label>
                  <input
                    value={form.applyUrl}
                    onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))}
                    placeholder="https://forms.example.com/candidature..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="text-xs text-gray-400 mt-1">Si vide, le bouton "Postuler" ouvrira un e-mail par défaut.</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                    />
                    Visible sur la page Carrières
                  </label>
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
                  disabled={saving || !form.title.trim() || !form.department.trim() || !form.location.trim() || !form.description.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editId ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Chargement...
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1 text-gray-600">Aucune offre d'emploi</p>
              <p className="text-sm">Cliquez sur "Ajouter" pour créer la première offre.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <div key={job.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20">
                          {job.department}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200">
                          {JOB_TYPES.find((t) => t.value === job.type)?.label ?? job.type}
                        </span>
                        {job.remote && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                            Télétravail
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        <span>Publié le {new Date(job.postedAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1 font-mono truncate">
                        drimpay.com/fr/careers/{job.slug || job.id}
                      </p>
                      {job.applyUrl && (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[280px]">{job.applyUrl}</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggle(job)}
                        disabled={toggling === job.id}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        title={job.active ? "Désactiver" : "Activer"}
                      >
                        {toggling === job.id
                          ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          : job.active
                            ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                            : <ToggleLeft className="w-5 h-5 text-gray-300" />
                        }
                      </button>
                      <button
                        onClick={() => openEdit(job)}
                        className="p-2 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={deleting === job.id}
                        className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deleting === job.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
