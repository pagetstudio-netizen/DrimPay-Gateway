import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, X, FileText, User, Building2, AlertTriangle,
  Filter, SortAsc, SortDesc, CalendarDays,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

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

function KybDetailModal({ kyb, onClose, onRefresh }: { kyb: any; onClose: () => void; onRefresh: () => void }) {
  const [rejReason, setRejReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const approve = async () => {
    setLoading(true);
    await fetch(`/api/admin/kyb/${kyb.id}/approve`, { method: "PUT", credentials: "include" });
    onRefresh(); onClose();
  };
  const reject = async () => {
    if (!rejReason.trim()) { alert("Veuillez saisir une raison de rejet."); return; }
    setLoading(true);
    await fetch(`/api/admin/kyb/${kyb.id}/reject`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejReason }),
    });
    onRefresh(); onClose();
  };
  const markReview = async () => {
    await fetch(`/api/admin/kyb/${kyb.id}/review`, { method: "PUT", credentials: "include" });
    onRefresh(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dossier KYB #{kyb.id}</h2>
            <p className="text-sm text-gray-500">{kyb.user?.companyName} · {kyb.user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-sm px-3 py-1 rounded-full font-medium", STATUS_COLORS[kyb.status])}>
              {STATUS_LABELS[kyb.status] ?? kyb.status}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Informations entreprise</h3>
              </div>
              <div className="space-y-2 text-sm">
                {([
                  ["Nom légal", kyb.companyLegalName], ["Nom commercial", kyb.tradeName],
                  ["RCCM", kyb.registrationNumber], ["Numéro fiscal", kyb.taxNumber],
                  ["Pays incorporation", kyb.incorporationCountry], ["Ville", kyb.city],
                  ["Adresse", kyb.businessAddress], ["Secteur", kyb.businessType],
                  ["Site web", kyb.website],
                ] as [string, string | null][]).map(([k, v]) => v && (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">{k}</span>
                    <span className="text-gray-900 font-medium text-right truncate max-w-[150px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Représentant légal</h3>
              </div>
              <div className="space-y-2 text-sm">
                {([
                  ["Nom", kyb.legalRepName], ["Date naissance", kyb.legalRepDob],
                  ["Nationalité", kyb.legalRepNationality], ["Téléphone", kyb.legalRepPhone],
                  ["Email", kyb.legalRepEmail], ["Poste", kyb.legalRepPosition],
                  ["Type pièce", kyb.legalRepIdType], ["N° pièce", kyb.legalRepIdNumber],
                ] as [string, string | null][]).map(([k, v]) => v && (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">{k}</span>
                    <span className="text-gray-900 font-medium text-right truncate max-w-[150px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Documents soumis</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                ["RCCM", kyb.documentRccm], ["Certificat", kyb.documentCertificate],
                ["Preuve adresse", kyb.documentProofAddress], ["Relevé bancaire", kyb.documentBankStatement],
                ["Statuts", kyb.documentStatuts], ["Pièce ID", kyb.documentId],
                ["ID Recto", kyb.documentIdFront], ["ID Verso", kyb.documentIdBack],
                ["Selfie", kyb.documentSelfie],
              ] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                  <FileText className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-700 font-medium truncate">{k}</p>
                  <p className="text-[10px] text-gray-400 truncate">{String(v).slice(0, 20)}...</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Contrat & Signature</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {([
                ["Email contrat", kyb.contractEmail], ["Version", kyb.contractVersion],
                ["Signé le", kyb.contractSignedAt ? new Date(kyb.contractSignedAt).toLocaleString("fr-FR") : null],
                ["IP", kyb.contractIp], ["Accepté", kyb.contractAccepted ? "Oui" : "Non"],
              ] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-900 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {kyb.status === "rejected" && kyb.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">Raison de rejet</p>
              <p className="text-sm text-red-700">{kyb.rejectionReason}</p>
            </div>
          )}

          {action === "reject" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Raison du rejet *</label>
              <textarea value={rejReason} onChange={e => setRejReason(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Expliquez la raison du rejet..." />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {kyb.status !== "approved" && (
              <button onClick={action === "approve" ? approve : () => setAction("approve")} disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                <CheckCircle2 className="w-4 h-4" /> {action === "approve" ? "Confirmer l'approbation" : "Approuver"}
              </button>
            )}
            {kyb.status !== "rejected" && (
              <button onClick={action === "reject" ? reject : () => setAction("reject")} disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                <XCircle className="w-4 h-4" /> {action === "reject" ? "Confirmer le rejet" : "Rejeter"}
              </button>
            )}
            {kyb.status !== "under_review" && (
              <button onClick={markReview}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600">
                <Clock className="w-4 h-4" /> Mettre en révision
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Fermer
            </button>
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
      const r = await fetch(`/api/admin/kyb?${params}`, { credentials: "include" });
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
  const pendingCount = total;

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
          {/* Barre de recherche principale */}
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

            {/* Filtres avancés */}
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
                <p className="text-sm">Aucun dossier KYB{hasActiveFilters ? " pour ces critères de recherche" : ""}</p>
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
                        <p className="font-semibold text-gray-900 text-sm">{k.user?.companyName ?? `#${k.userId}`}</p>
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
                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap", STATUS_COLORS[k.status])}>
                          {STATUS_LABELS[k.status] ?? k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(k)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
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

      {selected && (
        <KybDetailModal kyb={selected} onClose={() => setSelected(null)}
          onRefresh={() => { load(); setSelected(null); }} />
      )}
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
