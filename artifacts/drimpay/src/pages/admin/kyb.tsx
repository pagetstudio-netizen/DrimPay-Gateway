import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, X, FileText, User, Building2, AlertTriangle,
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
  approved: "Approuvé", submitted: "Soumis", under_review: "En révision", rejected: "Rejeté", pending: "En attente",
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
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: rejReason }),
    });
    onRefresh(); onClose();
  };

  const markReview = async () => {
    await fetch(`/api/admin/kyb/${kyb.id}/review`, { method: "PUT", credentials: "include" });
    onRefresh(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dossier KYB #{kyb.id}</h2>
            <p className="text-sm text-gray-500">{kyb.user?.companyName} · {kyb.user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-sm px-3 py-1 rounded-full font-medium", STATUS_COLORS[kyb.status])}>
              {STATUS_LABELS[kyb.status] ?? kyb.status}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
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
                {[
                  ["Nom légal", kyb.companyLegalName], ["Nom commercial", kyb.tradeName],
                  ["RCCM", kyb.registrationNumber], ["Numéro fiscal", kyb.taxNumber],
                  ["Pays incorporation", kyb.incorporationCountry], ["Ville", kyb.city],
                  ["Adresse", kyb.businessAddress], ["Secteur", kyb.businessType],
                  ["Site web", kyb.website],
                ].map(([k, v]) => v && (
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
                {[
                  ["Nom", kyb.legalRepName], ["Date naissance", kyb.legalRepDob],
                  ["Nationalité", kyb.legalRepNationality], ["Téléphone", kyb.legalRepPhone],
                  ["Email", kyb.legalRepEmail], ["Poste", kyb.legalRepPosition],
                  ["Type pièce", kyb.legalRepIdType], ["N° pièce", kyb.legalRepIdNumber],
                ].map(([k, v]) => v && (
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
              {[
                ["RCCM", kyb.documentRccm], ["Certificat", kyb.documentCertificate],
                ["Preuve adresse", kyb.documentProofAddress], ["Relevé bancaire", kyb.documentBankStatement],
                ["Statuts", kyb.documentStatuts], ["Pièce ID", kyb.documentId],
                ["ID Recto", kyb.documentIdFront], ["ID Verso", kyb.documentIdBack],
                ["Selfie", kyb.documentSelfie],
              ].filter(([, v]) => v).map(([k, v]) => (
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
              {[
                ["Email contrat", kyb.contractEmail], ["Version", kyb.contractVersion],
                ["Signé le", kyb.contractSignedAt ? new Date(kyb.contractSignedAt).toLocaleString("fr-FR") : null],
                ["IP", kyb.contractIp], ["Accepté", kyb.contractAccepted ? "Oui" : "Non"],
              ].filter(([, v]) => v).map(([k, v]) => (
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
                <CheckCircle2 className="w-4 h-4" /> Approuver
              </button>
            )}
            {kyb.status !== "rejected" && (
              <button onClick={action === "reject" ? reject : () => setAction("reject")} disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                <XCircle className="w-4 h-4" /> Rejeter
              </button>
            )}
            {kyb.status !== "under_review" && (
              <button onClick={markReview} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600">
                <Clock className="w-4 h-4" /> Mettre en révision
              </button>
            )}
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Fermer</button>
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const LIMIT = 20;

  const load = async (p = page, status = filterStatus) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), status });
    const r = await fetch(`/api/admin/kyb?${params}`, { credentials: "include" });
    const d = await r.json();
    setKybs(d.kyb ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const pendingCount = kybs.filter(k => k.status === "submitted").length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYB Vérifications</h1>
            <p className="text-sm text-gray-500">{total} dossiers au total</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
              <AlertTriangle className="w-4 h-4" /> {pendingCount} dossier(s) en attente
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="all">Tous statuts</option>
              <option value="submitted">Soumis</option>
              <option value="under_review">En révision</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
              <option value="pending">En attente</option>
            </select>
            <button onClick={() => load()} className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 ml-auto">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : !kybs.length ? (
              <div className="text-center py-16 text-gray-400">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun dossier KYB</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["ID", "Marchand", "Email", "Entreprise", "Pays", "Soumis le", "Statut", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kybs.map(k => (
                    <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{k.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{k.user?.companyName ?? `#${k.userId}`}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{k.user?.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{k.companyLegalName ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">{k.incorporationCountry ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{k.submittedAt ? new Date(k.submittedAt).toLocaleDateString("fr-FR") : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", STATUS_COLORS[k.status])}>
                          {STATUS_LABELS[k.status] ?? k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(k)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} · {total} total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page * LIMIT >= total} onClick={() => { setPage(p => p + 1); load(page + 1); }} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
      {selected && <KybDetailModal kyb={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} />}
    </AdminLayout>
  );
}
