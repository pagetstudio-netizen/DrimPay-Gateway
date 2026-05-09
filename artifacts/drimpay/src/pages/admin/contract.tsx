import { useEffect, useRef, useState } from "react";
import {
  FileText, Upload, Download, CheckCircle2, AlertTriangle,
  RefreshCw, FileUp, Clock, HardDrive,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminContract() {
  const [info, setInfo] = useState<{ size: number; updatedAt: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadInfo = async () => {
    setLoadingInfo(true);
    try {
      const r = await fetch(`${BASE}/api/admin/contract/info`, { credentials: "include" });
      const d = await r.json();
      setInfo(d.ok ? d : null);
    } catch {
      setInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => { loadInfo(); }, []);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".docx")) {
      setStatus({ type: "err", msg: "Seuls les fichiers .docx sont acceptés." });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("contract", file);
      const r = await fetch(`${BASE}/api/admin/contract/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        setStatus({ type: "ok", msg: "Contrat mis à jour avec succès dans Supabase." });
        loadInfo();
      } else {
        setStatus({ type: "err", msg: d.error ?? "Erreur lors de l'upload" });
      }
    } catch {
      setStatus({ type: "err", msg: "Erreur réseau." });
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadCurrent = async () => {
    setDownloading(true);
    try {
      const r = await fetch(`${BASE}/api/admin/contract/download`, { credentials: "include" });
      if (!r.ok) { setStatus({ type: "err", msg: "Fichier introuvable" }); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contrat-drimpay.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setStatus({ type: "err", msg: "Erreur lors du téléchargement." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modèle de contrat</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez le contrat DOCX envoyé automatiquement aux marchands lors de la soumission KYB.
          </p>
        </div>

        {/* Current contract card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Contrat actuel</h2>
              <p className="text-xs text-gray-400">Stocké dans Supabase Storage</p>
            </div>
            <button
              onClick={loadInfo}
              disabled={loadingInfo}
              className="ml-auto p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={cn("w-4 h-4", loadingInfo && "animate-spin")} />
            </button>
          </div>

          {loadingInfo ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : info ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-800">Contrat disponible dans Supabase</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <HardDrive className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Taille</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtSize(info.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Mis à jour</p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(info.updatedAt)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl">
                <FileUp className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500 font-mono flex-1 truncate">
                  kyb-documents/_template/contrat-drimpay.docx
                </p>
              </div>
              <button
                onClick={downloadCurrent}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors w-full justify-center"
              >
                <Download className="w-4 h-4" />
                {downloading ? "Téléchargement..." : "Télécharger le contrat actuel"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-800">
                Aucun contrat dans Supabase. Uploadez un fichier ci-dessous ou créez le bucket <code className="bg-amber-100 px-1 rounded text-xs">kyb-documents</code>.
              </span>
            </div>
          )}
        </div>

        {/* Upload zone */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Remplacer le contrat</h2>
              <p className="text-xs text-gray-400">Format Word .docx uniquement — max 20 Mo</p>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl px-6 py-10 flex flex-col items-center gap-3 cursor-pointer transition-all",
              dragOver
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              dragOver ? "bg-emerald-100" : "bg-gray-100"
            )}>
              <FileText className={cn("w-7 h-7", dragOver ? "text-emerald-600" : "text-gray-400")} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                {dragOver ? "Déposez le fichier ici" : "Glissez votre fichier .docx ici"}
              </p>
              <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={onInputChange}
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-sm text-blue-800 font-medium">Upload en cours vers Supabase…</span>
            </div>
          )}

          {status && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium",
              status.type === "ok"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            )}>
              {status.type === "ok"
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertTriangle className="w-4 h-4 shrink-0" />
              }
              {status.msg}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">Comment ça fonctionne</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Le fichier uploadé remplace immédiatement le modèle dans Supabase. Lors de la prochaine soumission KYB étape 4, le nouveau contrat sera automatiquement joint à l'email envoyé au marchand.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
