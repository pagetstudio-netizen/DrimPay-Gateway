import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck, CheckCircle2, Clock, XCircle, AlertCircle, Upload, Building,
  Globe, FileText, Hash, X, Paperclip, User, Shield, PenLine, Mail,
  ChevronRight, ChevronLeft, Eye, EyeOff, Lock, Smartphone, Calendar,
  CreditCard, Briefcase, MapPin, Flag
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountryPicker } from "@/components/ui/country-picker";
import { Checkbox } from "@/components/ui/checkbox";

const KYB_COUNTRY_OPTIONS = [
  { code: "Togo",           name: "Togo",           flag: "🇹🇬" },
  { code: "Bénin",          name: "Bénin",           flag: "🇧🇯" },
  { code: "Cameroun",       name: "Cameroun",        flag: "🇨🇲" },
  { code: "Burkina Faso",   name: "Burkina Faso",    flag: "🇧🇫" },
  { code: "Mali",           name: "Mali",            flag: "🇲🇱" },
  { code: "Sénégal",        name: "Sénégal",         flag: "🇸🇳" },
  { code: "Côte d'Ivoire",  name: "Côte d'Ivoire",   flag: "🇨🇮" },
  { code: "Ghana",          name: "Ghana",           flag: "🇬🇭" },
  { code: "Nigeria",        name: "Nigeria",         flag: "🇳🇬" },
  { code: "France",         name: "France",          flag: "🇫🇷" },
  { code: "Autre",          name: "Autre",           flag: "🌍" },
];

const BUSINESS_TYPES = ["SARL", "SAS", "SA", "SUARL", "Entreprise individuelle", "Startup", "ONG", "GIE", "Coopérative", "Autre"];
const ID_TYPES = ["Carte Nationale d'Identité", "Passeport", "Permis de conduire", "Titre de séjour"];

const step1Schema = z.object({
  companyLegalName: z.string().min(2, "Nom légal requis"),
  tradeName: z.string().optional(),
  registrationNumber: z.string().min(1, "Numéro RCCM requis"),
  taxNumber: z.string().min(1, "Numéro fiscal requis"),
  incorporationCountry: z.string().min(2, "Pays requis"),
  city: z.string().min(2, "Ville requise"),
  businessAddress: z.string().min(5, "Adresse complète requise"),
  businessType: z.string().min(1, "Type d'entreprise requis"),
  foundingDate: z.string().min(4, "Date de création requise"),
  website: z.string().url("URL invalide").or(z.literal("")).optional(),
  businessDescription: z.string().min(20, "Description requise (min. 20 caractères)"),
});

const step2Schema = z.object({
  legalRepName: z.string().min(2, "Nom complet requis"),
  legalRepDob: z.string().min(1, "Date de naissance requise"),
  legalRepNationality: z.string().min(2, "Nationalité requise"),
  legalRepPhone: z.string().min(8, "Téléphone requis"),
  legalRepEmail: z.string().email("Email invalide"),
  legalRepPosition: z.string().min(1, "Poste requis"),
  legalRepIdType: z.string().min(1, "Type de document requis"),
  legalRepIdNumber: z.string().min(1, "Numéro document requis"),
  legalRepIdExpiry: z.string().min(1, "Date d'expiration requise"),
});

const step4Schema = z.object({
  contractEmail: z.string().email("Email professionnel invalide"),
  check1: z.boolean().refine(v => v === true, "Requis"),
  check2: z.boolean().refine(v => v === true, "Requis"),
  check3: z.boolean().refine(v => v === true, "Requis"),
  check4: z.boolean().refine(v => v === true, "Requis"),
  check5: z.boolean().refine(v => v === true, "Requis"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step4Data = z.infer<typeof step4Schema>;

const kybStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any; description: string }> = {
  pending: {
    label: "Non soumis",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: AlertCircle,
    description: "Soumettez vos documents d'entreprise pour activer les paiements live.",
  },
  submitted: {
    label: "Soumis — En attente de révision",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    icon: Clock,
    description: "Vos documents ont été soumis. Révision sous 24–48h ouvrables.",
  },
  under_review: {
    label: "En cours de révision",
    color: "text-yellow-600",
    bg: "bg-yellow-500/10",
    icon: Clock,
    description: "Notre équipe examine vos documents. Nous vous contacterons si nécessaire.",
  },
  approved: {
    label: "Approuvé — Compte production activé",
    color: "text-green-600",
    bg: "bg-green-500/10",
    icon: CheckCircle2,
    description: "Votre compte est vérifié. Les paiements live sont activés.",
  },
  rejected: {
    label: "Rejeté",
    color: "text-red-600",
    bg: "bg-red-500/10",
    icon: XCircle,
    description: "Votre soumission a été rejetée. Corrigez les points mentionnés et soumettez à nouveau.",
  },
};

const STEPS = [
  { id: 1, label: "Entreprise",        shortLabel: "Entreprise",  icon: Building },
  { id: 2, label: "Représentant légal", shortLabel: "Représentant", icon: User },
  { id: 3, label: "Documents",         shortLabel: "Documents",   icon: FileText },
  { id: 4, label: "Contrat & Signature", shortLabel: "Contrat",   icon: PenLine },
];

interface UploadDoc {
  key: string;
  label: string;
  description: string;
  required: boolean;
  icon?: any;
}

const STEP2_DOCS: UploadDoc[] = [
  { key: "documentIdFront", label: "Pièce d'identité — recto", description: "Face avant de votre CNI, passeport ou permis", required: true, icon: CreditCard },
  { key: "documentIdBack",  label: "Pièce d'identité — verso", description: "Face arrière de votre CNI ou permis de conduire", required: true, icon: CreditCard },
  { key: "documentSelfie",  label: "Selfie avec document",     description: "Photo de vous tenant votre document d'identité", required: true, icon: User },
];

const STEP3_DOCS: UploadDoc[] = [
  { key: "documentRccm",         label: "RCCM / Registre du Commerce",  description: "Document d'immatriculation officiel", required: true, icon: FileText },
  { key: "documentCertificate",  label: "Certificat d'entreprise",       description: "Certificat officiel d'existence de l'entreprise", required: true, icon: FileText },
  { key: "documentProofAddress", label: "Preuve d'adresse entreprise",   description: "Facture ou relevé de moins de 3 mois", required: true, icon: MapPin },
  { key: "documentBankStatement",label: "Relevé bancaire entreprise",    description: "Relevé bancaire des 3 derniers mois", required: true, icon: FileText },
  { key: "documentStatuts",      label: "Statuts de la société",         description: "Actes constitutifs signés et enregistrés", required: false, icon: FileText },
  { key: "documentLicense",      label: "Licence d'activité",            description: "Si votre activité requiert une licence spécifique", required: false, icon: Briefcase },
];

function FileUploadRow({
  doc, isEditable, file, onFileChange,
}: {
  doc: UploadDoc;
  isEditable: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!isEditable) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFileChange(f);
  };

  const DocIcon = doc.icon ?? FileText;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <DocIcon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium">{doc.label}</p>
          {doc.required ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-semibold shrink-0">Obligatoire</span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold shrink-0">Optionnel</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{doc.description}</p>

        {isEditable ? (
          <div>
            {file ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 w-fit max-w-full">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-xs text-green-700 dark:text-green-400 font-medium truncate">{file.name}</span>
                <span className="text-xs text-green-600/60 shrink-0">({formatSize(file.size)})</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
                  className="ml-1 text-green-600/60 hover:text-red-500 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer text-sm font-medium
                  ${dragOver
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/60 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Upload className="w-4 h-4" />
                <span>Glisser-déposer ou <span className="text-primary">choisir un fichier</span></span>
                <span className="ml-auto text-xs text-muted-foreground/60">PDF, JPG, PNG · max 10Mo</span>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => { const f = e.target.files?.[0] ?? null; onFileChange(f); e.target.value = ""; }}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Document soumis
          </div>
        )}
      </div>
    </div>
  );
}

function SignatureCanvas({ onSignature }: { onSignature: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
  };

  const stopDraw = () => {
    setDrawing(false);
    if (hasSig && canvasRef.current) {
      onSignature(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    onSignature("");
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/20 touch-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full h-[150px] cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasSig && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Signez ici avec votre souris ou votre doigt
            </p>
          </div>
        )}
      </div>
      {hasSig && (
        <button
          type="button"
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Effacer la signature
        </button>
      )}
    </div>
  );
}

export default function Kyb() {
  const [kyb, setKyb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [signatureData, setSignatureData] = useState("");
  const [contractSent, setContractSent] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    documentIdFront: null,
    documentIdBack: null,
    documentSelfie: null,
    documentRccm: null,
    documentCertificate: null,
    documentProofAddress: null,
    documentBankStatement: null,
    documentStatuts: null,
    documentLicense: null,
  });

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { companyLegalName: "", tradeName: "", registrationNumber: "", taxNumber: "", incorporationCountry: "", city: "", businessAddress: "", businessType: "", foundingDate: "", website: "", businessDescription: "" } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { legalRepName: "", legalRepDob: "", legalRepNationality: "", legalRepPhone: "", legalRepEmail: "", legalRepPosition: "", legalRepIdType: "", legalRepIdNumber: "", legalRepIdExpiry: "" } });
  const form4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema), defaultValues: { contractEmail: "", check1: false, check2: false, check3: false, check4: false, check5: false } });

  useEffect(() => {
    fetch("/api/dashboard/kyb", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setKyb(d);
          if (d.companyLegalName) {
            form1.reset({ companyLegalName: d.companyLegalName ?? "", tradeName: d.tradeName ?? "", registrationNumber: d.registrationNumber ?? "", taxNumber: d.taxNumber ?? "", incorporationCountry: d.incorporationCountry ?? "", city: d.city ?? "", businessAddress: d.businessAddress ?? "", businessType: d.businessType ?? "", foundingDate: d.foundingDate ?? "", website: d.website ?? "", businessDescription: d.businessDescription ?? "" });
          }
          if (d.legalRepName) {
            form2.reset({ legalRepName: d.legalRepName ?? "", legalRepDob: d.legalRepDob ?? "", legalRepNationality: d.legalRepNationality ?? "", legalRepPhone: d.legalRepPhone ?? "", legalRepEmail: d.legalRepEmail ?? "", legalRepPosition: d.legalRepPosition ?? "", legalRepIdType: d.legalRepIdType ?? "", legalRepIdNumber: d.legalRepIdNumber ?? "", legalRepIdExpiry: d.legalRepIdExpiry ?? "" });
          }
          if (d.contractEmail) {
            form4.reset({ contractEmail: d.contractEmail ?? "", check1: false, check2: false, check3: false, check4: false, check5: false });
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setFile = (key: string) => (file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [key]: file }));
  };

  const step2RequiredDocs = STEP2_DOCS.filter(d => d.required).every(d => uploadedFiles[d.key] !== null);
  const step3RequiredDocs = STEP3_DOCS.filter(d => d.required).every(d => uploadedFiles[d.key] !== null);

  const status = kyb?.status ?? "pending";
  const statusInfo = kybStatusConfig[status] ?? kybStatusConfig.pending;
  const isEditable = status === "pending" || status === "rejected";

  const saveStep = async (stepNum: number, data: Record<string, any>) => {
    const formData = new FormData();
    formData.append("step", String(stepNum));
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") formData.append(k, String(v));
    });
    Object.entries(uploadedFiles).forEach(([k, f]) => {
      if (f) formData.append(k, f);
    });
    const res = await fetch("/api/dashboard/kyb", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    let d: any = {};
    try { d = await res.json(); } catch {}
    if (!res.ok) throw new Error(d.error ?? "Erreur");
    setKyb(d);
    return d;
  };

  const handleStep1Next = form1.handleSubmit(async (values) => {
    setError("");
    try {
      await saveStep(1, values);
      setStep(2);
    } catch (e: any) { setError(e.message); }
  });

  const handleStep2Next = form2.handleSubmit(async (values) => {
    setError("");
    if (!step2RequiredDocs) { setError("Veuillez téléverser tous les documents obligatoires du représentant légal."); return; }
    try {
      await saveStep(2, values);
      setStep(3);
    } catch (e: any) { setError(e.message); }
  });

  const handleStep3Next = async () => {
    setError("");
    if (!step3RequiredDocs) { setError("Veuillez téléverser tous les documents obligatoires."); return; }
    try {
      await saveStep(3, {});
      setStep(4);
    } catch (e: any) { setError(e.message); }
  };

  const handleFinalSubmit = form4.handleSubmit(async (values) => {
    setError("");
    if (!signatureData) { setError("Veuillez signer le contrat avant de soumettre."); return; }
    setSubmitting(true);
    try {
      await saveStep(4, {
        contractEmail: values.contractEmail,
        contractAccepted: "true",
        signatureData,
      });
      setContractSent(true);
    } catch (e: any) { setError(e.message); }
    setSubmitting(false);
  });

  const progressPercent = ((step - 1) / (STEPS.length - 1)) * 100;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Vérification KYB</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Know Your Business — Complétez les 4 étapes pour activer votre compte production
          </p>
        </div>

        <div className={`flex items-start gap-4 p-5 rounded-xl border mb-8 ${statusInfo.bg} border-current/10`}>
          <statusInfo.icon className={`w-6 h-6 ${statusInfo.color} shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`font-semibold ${statusInfo.color} mb-1`}>{statusInfo.label}</p>
            <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            {status === "rejected" && kyb?.rejectionReason && (
              <p className="text-sm text-red-600 mt-2 font-medium">Raison : {kyb.rejectionReason}</p>
            )}
            {kyb?.submittedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Soumis le {new Date(kyb.submittedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {status === "approved" ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Compte production activé 🎉</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Votre entreprise a été vérifiée avec succès. Toutes les API live, wallets et paiements sont désormais disponibles.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto mt-4">
              {["API Payin Live", "API Payout Live", "Wallets actifs", "Cartes virtuelles", "Paiement de masse", "Airtime API"].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-500/5 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        ) : contractSent ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Dossier KYB soumis avec succès !</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Votre dossier complet a été soumis. Notre équipe de conformité examinera votre demande sous 24–48h ouvrables.
            </p>
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mt-2">
              <Clock className="w-4 h-4" />
              Statut actuel : <span className="font-medium text-blue-600">Soumis — En attente de révision</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {STEPS.map((s, i) => {
                  const isDone = step > s.id;
                  const isCurrent = step === s.id;
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => isDone && setStep(s.id)}
                          disabled={!isDone}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all font-bold text-sm
                            ${isDone ? "bg-primary border-primary text-black cursor-pointer hover:opacity-80" :
                              isCurrent ? "bg-primary/10 border-primary text-primary" :
                              "bg-muted border-border text-muted-foreground cursor-default"
                            }`}
                        >
                          {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                        </button>
                        <span className={`text-[11px] mt-1.5 font-medium hidden sm:block ${isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {s.shortLabel}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mt-[-12px] sm:mt-[-18px] transition-all ${step > s.id ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Étape {step} sur {STEPS.length} — {STEPS[step - 1].label}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ── STEP 1: Company Info ── */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <Form {...form1}>
                    <form onSubmit={handleStep1Next} className="space-y-5">
                      <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold mb-5 flex items-center gap-2 text-base">
                          <Building className="w-4 h-4 text-primary" />
                          Informations de l'entreprise
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form1.control} name="companyLegalName" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Nom légal de l'entreprise <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="ACME SARL" disabled={!isEditable} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="tradeName" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom commercial</FormLabel>
                              <FormControl><Input placeholder="ACME" disabled={!isEditable} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="businessType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type d'entreprise <span className="text-red-500">*</span></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={!isEditable}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="registrationNumber" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro RCCM / Registre <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="TG-LOM-2024-B-12345" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="taxNumber" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro fiscal <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="NIF / TIN" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="incorporationCountry" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pays d'enregistrement <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <CountryPicker options={KYB_COUNTRY_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Sélectionner un pays" disabled={!isEditable} error={false} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="city" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ville <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="Lomé" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="businessAddress" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Adresse complète du siège social <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="Avenue de la Victoire, Lomé, Togo" disabled={!isEditable} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="foundingDate" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date de création <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" type="date" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="website" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site web</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="https://votre-site.com" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form1.control} name="businessDescription" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Description de l'activité <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Décrivez votre activité principale, vos produits/services et le type de transactions..."
                                  className="min-h-24 resize-none"
                                  disabled={!isEditable}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="text-black gap-2">
                          Suivant <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </motion.div>
              )}

              {/* ── STEP 2: Legal Representative ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <Form {...form2}>
                    <form onSubmit={handleStep2Next} className="space-y-5">
                      <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold mb-5 flex items-center gap-2 text-base">
                          <User className="w-4 h-4 text-primary" />
                          Représentant légal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form2.control} name="legalRepName" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Nom complet <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="Jean Kouassi Amani" disabled={!isEditable} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form2.control} name="legalRepDob" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date de naissance <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" type="date" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form2.control} name="legalRepNationality" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationalité <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="Togolaise" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form2.control} name="legalRepPhone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="+228 90 000 000" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form2.control} name="legalRepEmail" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email professionnel <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" type="email" placeholder="directeur@entreprise.com" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form2.control} name="legalRepPosition" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Poste dans l'entreprise <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" placeholder="Directeur Général" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold mb-1 flex items-center gap-2 text-base">
                          <CreditCard className="w-4 h-4 text-primary" />
                          Document d'identité
                        </h3>
                        <p className="text-xs text-muted-foreground mb-5">Renseignez les informations de votre pièce d'identité officielle</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form2.control} name="legalRepIdType" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type de document <span className="text-red-500">*</span></FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={!isEditable}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {ID_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form2.control} name="legalRepIdNumber" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro du document <span className="text-red-500">*</span></FormLabel>
                              <FormControl><Input placeholder="TG12345678" disabled={!isEditable} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form2.control} name="legalRepIdExpiry" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date d'expiration <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input className="pl-9" type="date" disabled={!isEditable} {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold mb-1 flex items-center gap-2 text-base">
                          <Upload className="w-4 h-4 text-primary" />
                          Documents d'identité
                        </h3>
                        <p className="text-xs text-muted-foreground mb-5">Formats acceptés : PDF, JPG, PNG · Taille max : 10 Mo par document</p>
                        <div className="space-y-3">
                          {STEP2_DOCS.map((doc) => (
                            <FileUploadRow key={doc.key} doc={doc} isEditable={isEditable} file={uploadedFiles[doc.key]} onFileChange={setFile(doc.key)} />
                          ))}
                        </div>
                        {!step2RequiredDocs && (
                          <p className="mt-4 text-xs text-amber-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Veuillez téléverser tous les documents obligatoires.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                          <ChevronLeft className="w-4 h-4" /> Retour
                        </Button>
                        <Button type="submit" className="text-black gap-2">
                          Suivant <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                </motion.div>
              )}

              {/* ── STEP 3: Company Documents ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-1 flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4 text-primary" />
                      Documents de l'entreprise
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">Formats acceptés : PDF, JPG, PNG · Taille max : 10 Mo par document</p>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents obligatoires</p>
                      <div className="space-y-3">
                        {STEP3_DOCS.filter(d => d.required).map((doc) => (
                          <FileUploadRow key={doc.key} doc={doc} isEditable={isEditable} file={uploadedFiles[doc.key]} onFileChange={setFile(doc.key)} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents optionnels</p>
                      <div className="space-y-3">
                        {STEP3_DOCS.filter(d => !d.required).map((doc) => (
                          <FileUploadRow key={doc.key} doc={doc} isEditable={isEditable} file={uploadedFiles[doc.key]} onFileChange={setFile(doc.key)} />
                        ))}
                      </div>
                    </div>

                    {!step3RequiredDocs && (
                      <p className="mt-4 text-xs text-amber-500 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Veuillez téléverser tous les documents obligatoires avant de continuer.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="gap-2">
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </Button>
                    <Button type="button" onClick={handleStep3Next} className="text-black gap-2" disabled={!step3RequiredDocs}>
                      Suivant <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Contract & Signature ── */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <Form {...form4}>
                    <form onSubmit={handleFinalSubmit} className="space-y-5">
                      {/* Contract Text */}
                      <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="bg-muted/50 px-6 py-4 border-b border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold flex items-center gap-2 text-base">
                                <Shield className="w-4 h-4 text-primary" />
                                Contrat Marchand DrimPay
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">DrimPay Merchant Agreement — Version 2.1 · {new Date().toLocaleDateString("fr-FR")}</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-semibold">v2.1</span>
                          </div>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto space-y-6 text-sm leading-relaxed">
                          <section>
                            <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xs font-bold">!</span>
                              Politique AML — Lutte contre le blanchiment d'argent
                            </h4>
                            <p className="text-muted-foreground mb-3">DrimPay applique une politique stricte de conformité financière en accord avec les réglementations internationales AML/CFT. Il est strictement interdit d'utiliser les services DrimPay pour :</p>
                            <ul className="space-y-1.5 text-muted-foreground">
                              {["Blanchiment d'argent et financement du terrorisme", "Fraude financière et faux paiements", "Transactions illégales et usurpation d'identité", "Activités criminelles ou prohibées par la loi", "Escroqueries et faux investissements", "Jeux d'argent illégaux"].map(item => (
                                <li key={item} className="flex items-start gap-2">
                                  <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                              <p className="text-red-600 dark:text-red-400 text-xs font-medium">Toute activité suspecte peut entraîner : suspension immédiate du compte, blocage des wallets, signalement aux autorités compétentes et résiliation définitive du compte.</p>
                            </div>
                          </section>

                          <section>
                            <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-bold">§</span>
                              Responsabilité du Marchand
                            </h4>
                            <p className="text-muted-foreground mb-3">En acceptant ce contrat, le marchand reconnaît être entièrement responsable de :</p>
                            <ul className="space-y-1.5 text-muted-foreground">
                              {["Toutes les transactions effectuées via son compte DrimPay", "La conformité de son activité avec les lois financières applicables", "La conduite de ses employés et de ses intégrations tierces", "La sécurité de ses clés API et accès administrateurs", "Les paiements reçus et envoyés via la plateforme", "La configuration et la sécurité de ses webhooks"].map(item => (
                                <li key={item} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </section>

                          <section>
                            <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center justify-center text-xs font-bold">🌍</span>
                              Politique des Wallets Géographiques
                            </h4>
                            <p className="text-muted-foreground mb-3">DrimPay utilise un système de wallets isolés par pays. Cette politique est fondamentale :</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                              {[["Togo 🇹🇬", "Retrait uniquement au Togo"], ["Sénégal 🇸🇳", "Retrait uniquement au Sénégal"], ["Cameroun 🇨🇲", "Retrait uniquement au Cameroun"], ["Côte d'Ivoire 🇨🇮", "Retrait uniquement en CI"]].map(([c, r]) => (
                                <div key={c} className="p-2.5 rounded-lg bg-muted/50 text-xs">
                                  <p className="font-medium">{c}</p>
                                  <p className="text-muted-foreground">{r}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400">Les transferts cross-country non autorisés sont strictement interdits et peuvent entraîner la suspension du compte.</p>
                          </section>

                          <section>
                            <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-xs font-bold">
                                <Lock className="w-3 h-3" />
                              </span>
                              Politique API & Sécurité
                            </h4>
                            <p className="text-muted-foreground mb-3">Le marchand est entièrement responsable de la sécurité de :</p>
                            <ul className="space-y-1.5 text-muted-foreground">
                              {["Ses clés API publiques et secrètes (sandbox et live)", "Ses accès administrateurs et comptes collaborateurs", "La configuration de ses webhooks et endpoints de réception", "Ses intégrations tierces et systèmes externes"].map(item => (
                                <li key={item} className="flex items-start gap-2">
                                  <Lock className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                            <p className="mt-3 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">Toute fuite ou compromission de clé API doit être signalée immédiatement à support@drimpay.com. DrimPay ne pourra être tenu responsable des pertes liées à une négligence sécuritaire.</p>
                          </section>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-base mb-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Acceptation obligatoire
                        </h3>
                        {[
                          { name: "check1" as const, label: "Je confirme avoir lu et accepté les Conditions d'utilisation DrimPay" },
                          { name: "check2" as const, label: "Je comprends que DrimPay applique une politique stricte AML/KYB et m'y conforme" },
                          { name: "check3" as const, label: "Je confirme être entièrement responsable des transactions effectuées via mon compte" },
                          { name: "check4" as const, label: "Je m'engage à respecter les lois financières applicables dans mon pays et les pays couverts" },
                          { name: "check5" as const, label: "Je comprends que toute activité frauduleuse entraînera une suspension immédiate et un signalement aux autorités" },
                        ].map(({ name, label }) => (
                          <FormField key={name} control={form4.control} name={name} render={({ field }) => (
                            <FormItem className="flex items-start gap-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                              </FormControl>
                              <div>
                                <FormLabel className="text-sm font-normal leading-relaxed cursor-pointer">{label}</FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )} />
                        ))}
                      </div>

                      {/* Email */}
                      <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold flex items-center gap-2 text-base mb-1">
                          <Mail className="w-4 h-4 text-primary" />
                          Adresse email professionnelle
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">Le contrat officiel DrimPay sera envoyé à cette adresse pour archivage électronique.</p>
                        <FormField control={form4.control} name="contractEmail" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email professionnel <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" type="email" placeholder="contrat@votre-entreprise.com" disabled={!isEditable} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {/* Signature */}
                      <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold flex items-center gap-2 text-base mb-1">
                          <PenLine className="w-4 h-4 text-primary" />
                          Signature électronique
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Signez ci-dessous pour confirmer votre engagement. La signature est horodatée et associée à votre session.
                        </p>
                        <SignatureCanvas onSignature={setSignatureData} />
                        {!signatureData && (
                          <p className="text-xs text-amber-500 flex items-center gap-1.5 mt-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            La signature est requise pour soumettre le dossier.
                          </p>
                        )}
                        {signatureData && (
                          <p className="text-xs text-green-600 flex items-center gap-1.5 mt-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Signature enregistrée — horodatée le {new Date().toLocaleString("fr-FR")}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setStep(3)} className="gap-2">
                          <ChevronLeft className="w-4 h-4" /> Retour
                        </Button>
                        <Button
                          type="submit"
                          className="text-black gap-2"
                          disabled={submitting || !signatureData}
                        >
                          {submitting ? (
                            <><span className="animate-spin inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /> Soumission...</>
                          ) : (
                            <><FileCheck className="w-4 h-4" /> Soumettre le dossier KYB</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
