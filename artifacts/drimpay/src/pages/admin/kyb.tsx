import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, X, FileText, User, Building2,
  Filter, SortAsc, SortDesc, CalendarDays, Download, ExternalLink,
  Globe, Phone, Mail, MapPin, Hash, Calendar, Briefcase, FileCheck,
  ScrollText, Scale, CreditCard, Image, Landmark, FileSignature,
  AlertTriangle, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn, shortId } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-600",
};
const STATUS_LABELS: Record<string, string> = {
  approved: "Approuvé", submitted: "Soumis",
  under_review: "En révision", rejected: "Rejeté", pending: "En attente",
};

const DOC_LABELS: Record<string, { label: string; icon: any; category: "rep" | "company" }> = {
  documentIdFront:      { label: "Pièce d'identité — Recto",         icon: CreditCard,      category: "rep" },
  documentIdBack:       { label: "Pièce d'identité — Verso",         icon: CreditCard,      category: "rep" },
  documentSelfie:       { label: "Selfie avec pièce d'identité",     icon: Image,           category: "rep" },
  documentRccm:         { label: "RCCM / Registre commerce",         icon: Landmark,        category: "company" },
  documentCertificate:  { label: "Certificat d'immatriculation",     icon: FileCheck,       category: "company" },
  documentProofAddress: { label: "Justificatif d'adresse",           icon: MapPin,          category: "company" },
  documentBankStatement:{ label: "Relevé bancaire",                  icon: Landmark,        category: "company" },
  documentStatuts:      { label: "Statuts de l'entreprise",          icon: ScrollText,      category: "company" },
  documentLicense:      { label: "Licence / Autorisation d'activité",icon: FileSignature,   category: "company" },
  documentId:           { label: "Document complémentaire",          icon: FileText,        category: "company" },
};

function isImageFile(name: string) {
  return /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(name);
}

function DocCard({ kybId, field, filePath }: { kybId: number; field: string; filePath: string }) {
  const meta = DOC_LABELS[field];
  const Icon = meta?.icon ?? FileText;
  const label = meta?.label ?? field;
  const basename = filePath.split(/[\\/]/).pop() ?? filePath;
  const viewUrl = `${BASE}/api/admin/kyb/${kybId}/document/${field}`;
  const dlUrl = `${viewUrl}?download=1`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-4 flex items-center justify-center h-20">
        {isImageFile(basename)
          ? <Image className="w-8 h-8 text-blue-400" />
          : <Icon className="w-8 h-8 text-emerald-500" />}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs font-semibold text-gray-800 leading-snug">{label}</p>
        <p className="text-[10px] text-gray-400 truncate font-mono" title={basename}>{basename}</p>
        <div className="flex gap-1.5 mt-auto pt-1">
          <a href={viewUrl} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-semibold transition-colors">
            <ExternalLink className="w-3 h-3" /> Voir
          </a>
          <a href={dlUrl} download
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[11px] font-semibold transition-colors">
            <Download className="w-3 h-3" /> Télécharger
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false, href }: { label: string; value?: string | null; mono?: boolean; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 font-medium w-40">{label}</span>
      {href
        ? <a href={href} target="_blank" rel="noreferrer" className={cn("text-xs text-blue-600 underline text-right break-all", mono && "font-mono")}>{value}</a>
        : <span className={cn("text-xs text-gray-900 font-semibold text-right break-all", mono && "font-mono")}>{value}</span>}
    </div>
  );
}

function Section({ title, icon: Icon, color = "text-gray-600", children, defaultOpen = true }:
  { title: string; icon: any; color?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", color)} />
          <span className="text-sm font-bold text-gray-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function KybDetailModal({ kyb, onClose, onRefresh }: { kyb: any; onClose: () => void; onRefresh: () => void }) {
  const [rejReason, setRejReason] = useState(kyb.rejectionReason ?? "");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const approve = async () => {
    setLoading(true);
    await fetch(`${BASE}/api/admin/kyb/${kyb.id}/approve`, { method: "PUT", credentials: "include" });
    onRefresh(); onClose();
  };
  const reject = async () => {
    if (!rejReason.trim()) { alert("Veuillez saisir une raison de rejet."); return; }
    setLoading(true);
    await fetch(`${BASE}/api/admin/kyb/${kyb.id}/reject`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejReason }),
    });
    onRefresh(); onClose();
  };
  const markReview = async () => {
    await fetch(`${BASE}/api/admin/kyb/${kyb.id}/review`, { method: "PUT", credentials: "include" });
    onRefresh(); onClose();
  };

  const repDocs = Object.entries(DOC_LABELS).filter(([, m]) => m.category === "rep");
  const companyDocs = Object.entries(DOC_LABELS).filter(([, m]) => m.category === "company");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dossier KYB #{kyb.id}</h2>
            <p className="text-sm text-gray-500">{kyb.user?.companyName ?? "—"} · {kyb.user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-sm px-3 py-1 rounded-full font-semibold", STATUS_COLORS[kyb.status])}>
              {STATUS_LABELS[kyb.status] ?? kyb.status}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Raison de rejet affichée */}
          {kyb.status === "rejected" && kyb.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800 mb-0.5">Raison du rejet</p>
                <p className="text-sm text-red-700">{kyb.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* ── Section 1 : Compte marchand ── */}
          <Section title="Compte marchand" icon={User} color="text-indigo-600">
            <div className="divide-y divide-gray-50">
              <InfoRow label="Nom d'entreprise (compte)" value={kyb.user?.companyName} />
              <InfoRow label="Email du compte" value={kyb.user?.email} />
              <InfoRow label="Rôle" value={kyb.user?.role} />
              <InfoRow label="Date d'inscription" value={kyb.createdAt ? new Date(kyb.createdAt).toLocaleString("fr-FR") : null} />
              <InfoRow label="Date de soumission" value={kyb.submittedAt ? new Date(kyb.submittedAt).toLocaleString("fr-FR") : null} />
              <InfoRow label="Date de révision" value={kyb.reviewedAt ? new Date(kyb.reviewedAt).toLocaleString("fr-FR") : null} />
            </div>
          </Section>

          {/* ── Section 2 : Informations de l'entreprise ── */}
          <Section title="Informations de l'entreprise" icon={Building2} color="text-emerald-600">
            <div className="divide-y divide-gray-50">
              <InfoRow label="Nom légal" value={kyb.companyLegalName} />
              <InfoRow label="Nom commercial" value={kyb.tradeName} />
              <InfoRow label="N° d'enregistrement (RCCM)" value={kyb.registrationNumber} mono />
              <InfoRow label="Numéro fiscal / NIF" value={kyb.taxNumber} mono />
              <InfoRow label="Pays d'incorporation" value={kyb.incorporationCountry} />
              <InfoRow label="Ville" value={kyb.city} />
              <InfoRow label="Adresse professionnelle" value={kyb.businessAddress} />
              <InfoRow label="Secteur d'activité" value={kyb.businessType} />
              <InfoRow label="Date de fondation" value={kyb.foundingDate} />
              <InfoRow label="Site web" value={kyb.website} href={kyb.website ?? undefined} />
            </div>
          </Section>

          {/* ── Section 3 : Description de l'activité ── */}
          {kyb.businessDescription && (
            <Section title="Description de l'activité" icon={Info} color="text-blue-600">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{kyb.businessDescription}</p>
            </Section>
          )}

          {/* ── Section 4 : Représentant légal ── */}
          <Section title="Représentant légal" icon={Scale} color="text-purple-600">
            <div className="divide-y divide-gray-50">
              <InfoRow label="Nom complet" value={kyb.legalRepName} />
              <InfoRow label="Date de naissance" value={kyb.legalRepDob} />
              <InfoRow label="Nationalité" value={kyb.legalRepNationality} />
              <InfoRow label="Téléphone" value={kyb.legalRepPhone} />
              <InfoRow label="Email professionnel" value={kyb.legalRepEmail} />
              <InfoRow label="Poste / Fonction" value={kyb.legalRepPosition} />
              <InfoRow label="Type de pièce d'identité" value={kyb.legalRepIdType} />
              <InfoRow label="Numéro de pièce" value={kyb.legalRepIdNumber} mono />
              <InfoRow label="Date d'expiration" value={kyb.legalRepIdExpiry} />
            </div>
          </Section>

          {/* ── Section 5 : Documents du représentant légal ── */}
          <Section title="Documents du représentant légal" icon={CreditCard} color="text-blue-600">
            {repDocs.some(([f]) => kyb[f]) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {repDocs.map(([field]) => kyb[field] && (
                  <DocCard key={field} kybId={kyb.id} field={field} filePath={kyb[field]} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun document du représentant soumis.</p>
            )}
          </Section>

          {/* ── Section 6 : Documents de l'entreprise ── */}
          <Section title="Documents de l'entreprise" icon={Briefcase} color="text-emerald-600">
            {companyDocs.some(([f]) => kyb[f]) ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {companyDocs.map(([field]) => kyb[field] && (
                  <DocCard key={field} kybId={kyb.id} field={field} filePath={kyb[field]} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun document d'entreprise soumis.</p>
            )}
          </Section>

          {/* ── Section 7 : Contrat & Signature ── */}
          <Section title="Contrat & Signature électronique" icon={FileSignature} color="text-gray-600" defaultOpen={false}>
            <div className="divide-y divide-gray-50">
              <InfoRow label="Email du signataire" value={kyb.contractEmail} />
              <InfoRow label="Version du contrat" value={kyb.contractVersion} />
              <InfoRow label="Date de signature" value={kyb.contractSignedAt ? new Date(kyb.contractSignedAt).toLocaleString("fr-FR") : null} />
              <InfoRow label="Adresse IP" value={kyb.contractIp} mono />
              <InfoRow label="Contrat accepté" value={kyb.contractAccepted ? "✅ Oui — accepté" : "❌ Non"} />
            </div>
          </Section>

          {/* ── Actions ── */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actions administratives</p>

            {action === "reject" && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Raison du rejet *</label>
                <textarea value={rejReason} onChange={e => setRejReason(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Expliquez clairement la raison du rejet..." />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {kyb.status !== "approved" && (
                <button onClick={action === "approve" ? approve : () => setAction("approve")} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  {action === "approve" ? "Confirmer l'approbation" : "Approuver le dossier"}
                </button>
              )}
              {kyb.status !== "rejected" && (
                <button onClick={action === "reject" ? reject : () => setAction("reject")} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                  <XCircle className="w-4 h-4" />
                  {action === "reject" ? "Confirmer le rejet" : "Rejeter le dossier"}
                </button>
              )}
              {kyb.status !== "under_review" && (
                <button onClick={markReview} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
                  <Clock className="w-4 h-4" /> Mettre en révision
                </button>
              )}
              {action && (
                <button onClick={() => setAction(null)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" /> Annuler
                </button>
              )}
              <button onClick={onClose}
                className="ml-auto px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminKyb() {
  const [kybs, setKybs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 20;

  const load = useCallback(async (opts?: {
    p?: number; s?: string; status?: string; country?: string;
    dateFrom?: string; dateTo?: string; sb?: string; sd?: string;
  }) => {
    setLoading(true);
    const p = opts?.p ?? 1;
    const params = new URLSearchParams({
      page: String(p), limit: String(LIMIT),
      search: opts?.s ?? search,
      status: opts?.status ?? filterStatus,
      country: opts?.country ?? filterCountry,
      dateFrom: opts?.dateFrom ?? filterDateFrom,
      dateTo: opts?.dateTo ?? filterDateTo,
      sortBy: opts?.sb ?? sortBy,
      sortDir: opts?.sd ?? sortDir,
    });
    try {
      const r = await fetch(`${BASE}/api/admin/kyb?${params}`, { credentials: "include" });
      const d = await r.json();
      setKybs(d.kyb ?? []);
      setTotal(d.total ?? 0);
      if (d.availableCountries) setAvailableCountries(d.availableCountries);
    } catch {}
    setLoading(false);
  }, [search, filterStatus, filterCountry, filterDateFrom, filterDateTo, sortBy, sortDir]);

  useEffect(() => { load(); }, []);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load({ p: 1, s: v }), 350);
  };

  const applyFilters = () => { setPage(1); load({ p: 1 }); };

  const resetFilters = () => {
    setSearch(""); setFilterStatus("all"); setFilterCountry("");
    setFilterDateFrom(""); setFilterDateTo(""); setSortBy("createdAt"); setSortDir("desc");
    setPage(1);
    load({ p: 1, s: "", status: "all", country: "", dateFrom: "", dateTo: "", sb: "createdAt", sd: "desc" });
  };

  const toggleSort = (field: string) => {
    const newDir = sortBy === field && sortDir === "desc" ? "asc" : "desc";
    setSortBy(field); setSortDir(newDir); setPage(1);
    load({ p: 1, sb: field, sd: newDir });
  };

  const hasActiveFilters = search || filterStatus !== "all" || filterCountry || filterDateFrom || filterDateTo;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYB Vérifications</h1>
            <p className="text-sm text-gray-500">{total} dossier{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600 hover:bg-red-100">
                <X className="w-3.5 h-3.5" /> Réinitialiser les filtres
              </button>
            )}
            <button onClick={() => setShowFilters(f => !f)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                showFilters ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50")}>
              <Filter className="w-4 h-4" /> Filtres avancés
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Barre de recherche */}
          <div className="px-5 py-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={search} onChange={e => handleSearch(e.target.value)}
                  placeholder="Rechercher par email, nom d'entreprise, représentant légal..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); load({ p: 1, status: e.target.value }); }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                <option value="all">Tous statuts</option>
                <option value="submitted">Soumis</option>
                <option value="under_review">En révision</option>
                <option value="approved">Approuvés</option>
                <option value="rejected">Rejetés</option>
                <option value="pending">En attente</option>
              </select>

              <button onClick={() => load({ p: page })} title="Actualiser"
                className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Pays d'incorporation</label>
                  <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                    <option value="">Tous les pays</option>
                    {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    <CalendarDays className="inline w-3 h-3 mr-1" />Date de début
                  </label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    <CalendarDays className="inline w-3 h-3 mr-1" />Date de fin
                  </label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex flex-col justify-end">
                  <button onClick={applyFilters}
                    className="w-full px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
                    Appliquer les filtres
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : !kybs.length ? (
              <div className="text-center py-16 text-gray-400">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun dossier KYB{hasActiveFilters ? " pour ces critères" : ""}</p>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="mt-3 text-xs text-emerald-600 hover:underline">Réinitialiser les filtres</button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-gray-700">
                        Marchand {sortBy === "createdAt" ? (sortDir === "desc" ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />) : null}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entreprise légale</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pays</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <button onClick={() => toggleSort("submittedAt")} className="flex items-center gap-1 hover:text-gray-700">
                        Soumis {sortBy === "submittedAt" ? (sortDir === "desc" ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />) : null}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-gray-700">
                        Statut {sortBy === "status" ? (sortDir === "desc" ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />) : null}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kybs.map((k, idx) => (
                    <motion.tr key={k.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(k)}>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{k.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 text-sm">{k.user?.companyName ?? shortId(k.userId)}</p>
                        {k.tradeName && <p className="text-xs text-gray-400">{k.tradeName}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <SearchHighlight text={k.user?.email ?? ""} query={search} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        <SearchHighlight text={k.companyLegalName ?? "—"} query={search} />
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">{k.incorporationCountry ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {k.submittedAt ? new Date(k.submittedAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap", STATUS_COLORS[k.status])}>
                          {STATUS_LABELS[k.status] ?? k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(k)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Voir le dossier complet">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {total > 0 ? `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} sur ${total}` : "0 résultat"}
              {hasActiveFilters && <span className="ml-2 text-emerald-600 font-medium">(filtré)</span>}
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); load({ p }); }}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="flex items-center px-3 text-xs text-gray-500 font-medium">
                {page} / {Math.ceil(total / LIMIT) || 1}
              </span>
              <button disabled={page * LIMIT >= total}
                onClick={() => { const p = page + 1; setPage(p); load({ p }); }}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <KybDetailModal kyb={selected} onClose={() => setSelected(null)}
            onRefresh={() => { load(); setSelected(null); }} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

function SearchHighlight({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-800 rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}
