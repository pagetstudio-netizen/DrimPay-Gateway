import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck, CheckCircle2, Clock, XCircle, AlertCircle, Upload, Building,
  Globe, FileText, Hash, X, Paperclip, User, Shield, Mail,
  ChevronRight, ChevronLeft, Eye, EyeOff, Lock, Smartphone, Calendar,
  CreditCard, Briefcase, MapPin, Flag, DollarSign
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
const FUNDS_SOURCES = [
  "Salaire / Revenus d'emploi",
  "Activité commerciale / Entreprise",
  "Freelance / Travail indépendant",
  "Épargne personnelle",
  "Transferts familiaux",
  "Revenus locatifs",
  "Autre",
];

// ── Enterprise schemas ────────────────────────────────────────────────────────
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

// ── Personal schemas ──────────────────────────────────────────────────────────
const kycStep1Schema = z.object({
  legalRepName: z.string().min(2, "Nom complet requis"),
  legalRepDob: z.string().min(1, "Date de naissance requise"),
  incorporationCountry: z.string().min(2, "Pays requis"),
  businessAddress: z.string().min(5, "Adresse complète requise"),
  legalRepPhone: z.string().min(8, "Téléphone requis"),
  legalRepEmail: z.string().email("Email invalide"),
});

const kycStep2Schema = z.object({
  businessDescription: z.string().min(10, "Description requise (min. 10 caractères)"),
  fundsSource: z.string().min(1, "Source des fonds requise"),
  website: z.string().url("URL invalide").or(z.literal("")).optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type KycStep1Data = z.infer<typeof kycStep1Schema>;
type KycStep2Data = z.infer<typeof kycStep2Schema>;

const kybStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any; description: string }> = {
  pending: {
    label: "Non soumis",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: AlertCircle,
    description: "Soumettez vos documents pour activer les paiements live.",
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

const KYB_STEPS = [
  { id: 1, label: "Entreprise",          shortLabel: "Entreprise",    icon: Building },
  { id: 2, label: "Représentant légal",  shortLabel: "Représentant",  icon: User },
  { id: 3, label: "Documents",           shortLabel: "Documents",     icon: FileText },
  { id: 4, label: "Contrat & Soumission",shortLabel: "Contrat",       icon: FileCheck },
];

const KYC_STEPS = [
  { id: 1, label: "Informations personnelles", shortLabel: "Identité",   icon: User },
  { id: 2, label: "Activité",                  shortLabel: "Activité",   icon: Briefcase },
  { id: 3, label: "Documents & Soumission",    shortLabel: "Documents",  icon: FileText },
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

const KYC_ID_DOCS: UploadDoc[] = [
  { key: "documentIdFront", label: "Pièce d'identité — recto",  description: "Photo de la face avant de votre CNI, passeport ou permis", required: true, icon: CreditCard },
  { key: "documentIdBack",  label: "Pièce d'identité — verso",  description: "Photo de la face arrière de votre CNI ou permis", required: true, icon: CreditCard },
  { key: "documentSelfie",  label: "Selfie avec pièce en main", description: "Photo de vous tenant votre document d'identité visible", required: true, icon: User },
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

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = "drimpay_kyb_draft";
const LS_TTL = 7 * 24 * 60 * 60 * 1000;

function lsLoad(): any | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj.expiry || Date.now() > obj.expiry) { localStorage.removeItem(LS_KEY); return null; }
    return obj.data ?? null;
  } catch { return null; }
}

function lsSave(data: any) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ expiry: Date.now() + LS_TTL, data }));
  } catch {}
}

function lsClear() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ── Personal KYC component ───────────────────────────────────────────────────
function PersonalKyc({ kyb, isEditable, onSubmitted }: { kyb: any; isEditable: boolean; onSubmitted: (d: any) => void }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    documentIdFront: null, documentIdBack: null, documentSelfie: null,
  });

  const form1 = useForm<KycStep1Data>({
    resolver: zodResolver(kycStep1Schema),
    defaultValues: {
      legalRepName: kyb?.legalRepName ?? "",
      legalRepDob: kyb?.legalRepDob ?? "",
      incorporationCountry: kyb?.incorporationCountry ?? "",
      businessAddress: kyb?.businessAddress ?? "",
      legalRepPhone: kyb?.legalRepPhone ?? "",
      legalRepEmail: kyb?.legalRepEmail ?? "",
    },
  });

  const form2 = useForm<KycStep2Data>({
    resolver: zodResolver(kycStep2Schema),
    defaultValues: {
      businessDescription: kyb?.businessDescription ?? "",
      fundsSource: kyb?.fundsSource ?? "",
      website: kyb?.website ?? "",
    },
  });

  const setFile = (key: string) => (file: File | null) =>
    setUploadedFiles(prev => ({ ...prev, [key]: file }));

  const kycDocsReady = KYC_ID_DOCS.filter(d => d.required).every(d =>
    uploadedFiles[d.key] !== null || (kyb?.[d.key] && !isEditable)
  );

  const saveStep = async (stepNum: number, data: Record<string, any>, fileKeys?: string[]) => {
    const formData = new FormData();
    formData.append("step", String(stepNum));
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") formData.append(k, String(v));
    });
    if (fileKeys) {
      fileKeys.forEach(k => { const f = uploadedFiles[k]; if (f) formData.append(k, f); });
    }
    const r = await fetch("/api/dashboard/kyb", { method: "POST", credentials: "include", body: formData });
    let d: any = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d.error ?? "Erreur serveur");
    return d;
  };

  const handleStep1Next = form1.handleSubmit(async (values) => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await saveStep(1, values);
      setStep(2);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  });

  const handleStep2Next = form2.handleSubmit(async (values) => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await saveStep(2, values);
      setStep(3);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  });

  const handleStep3Submit = async () => {
    if (submitting) return;
    setError("");
    const allReady = KYC_ID_DOCS.filter(d => d.required).every(d => uploadedFiles[d.key] !== null);
    if (!allReady) {
      setError("Veuillez téléverser les 3 documents d'identité obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await saveStep(3, {}, KYC_ID_DOCS.map(d => d.key));
      lsClear();
      onSubmitted(result);
      setSubmitted(true);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const progressPercent = ((step - 1) / (KYC_STEPS.length - 1)) * 100;

  if (submitted) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Dossier KYC soumis avec succès !</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Votre dossier de vérification d'identité a été soumis. Notre équipe examinera votre demande sous 24–48h ouvrables.
        </p>
        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mt-2">
          <Clock className="w-4 h-4" />
          Statut actuel : <span className="font-medium text-blue-600">Soumis — En attente de révision</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {KYC_STEPS.map((s, i) => {
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
                {i < KYC_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mt-[-12px] sm:mt-[-18px] transition-all ${step > s.id ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Étape {step} sur {KYC_STEPS.length} — {KYC_STEPS[step - 1].label}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── KYC STEP 1: Informations personnelles ── */}
        {step === 1 && (
          <motion.div key="kyc1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Form {...form1}>
              <form onSubmit={handleStep1Next} className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-5 flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-primary" />
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form1.control} name="legalRepName" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nom complet <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Jean Dupont" disabled={!isEditable} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form1.control} name="legalRepDob" render={({ field }) => (
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
                    <FormField control={form1.control} name="incorporationCountry" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <CountryPicker options={KYB_COUNTRY_OPTIONS} value={field.value} onChange={field.onChange} placeholder="Sélectionner un pays" disabled={!isEditable} error={false} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form1.control} name="businessAddress" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Adresse complète <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Avenue de la Victoire, Lomé, Togo" disabled={!isEditable} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form1.control} name="legalRepPhone" render={({ field }) => (
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
                    <FormField control={form1.control} name="legalRepEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" type="email" placeholder="nom@email.com" disabled={!isEditable} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="text-black gap-2" disabled={submitting}>
                    {submitting ? "Enregistrement…" : <><span>Suivant</span><ChevronRight className="w-4 h-4" /></>}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        )}

        {/* ── KYC STEP 2: Activité ── */}
        {step === 2 && (
          <motion.div key="kyc2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Form {...form2}>
              <form onSubmit={handleStep2Next} className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-5 flex items-center gap-2 text-base">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Activité et source de revenus
                  </h3>
                  <div className="space-y-4">
                    <FormField control={form2.control} name="businessDescription" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description de votre activité <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre activité principale, vos services, ce que vous vendez ou proposez..."
                            className="min-h-28 resize-none"
                            disabled={!isEditable}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="fundsSource" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source principale des fonds <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!isEditable}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner la source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FUNDS_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="website" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site web <span className="text-xs text-muted-foreground font-normal">(optionnel)</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="https://votre-site.com" disabled={!isEditable} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2" disabled={submitting}>
                    <ChevronLeft className="w-4 h-4" /> Retour
                  </Button>
                  <Button type="submit" className="text-black gap-2" disabled={submitting}>
                    {submitting ? "Enregistrement…" : <><span>Suivant</span><ChevronRight className="w-4 h-4" /></>}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        )}

        {/* ── KYC STEP 3: Documents d'identité + Soumission ── */}
        {step === 3 && (
          <motion.div key="kyc3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-1 flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-primary" />
                Vérification d'identité
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                Trois documents sont requis : recto de la pièce, verso, et un selfie vous tenant la pièce en main. Formats acceptés : PDF, JPG, PNG · max 10 Mo.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {KYC_ID_DOCS.map((doc) => (
                  <FileUploadRow key={doc.key} doc={doc} isEditable={isEditable} file={uploadedFiles[doc.key]} onFileChange={setFile(doc.key)} />
                ))}
              </div>
              {!kycDocsReady && (
                <p className="mt-4 text-xs text-amber-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Veuillez téléverser les 3 documents obligatoires.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Instructions pour le selfie
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Tenez votre pièce d'identité ouverte et bien visible</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Votre visage doit être clairement visible et non masqué</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Assurez-vous d'un bon éclairage sans reflets</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> Le texte de la pièce doit être lisible</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Retour
              </Button>
              <Button
                type="button"
                onClick={handleStep3Submit}
                className="text-black gap-2"
                disabled={submitting || !kycDocsReady}
              >
                {submitting ? (
                  <><span className="animate-spin inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /> Soumission...</>
                ) : (
                  <><FileCheck className="w-4 h-4" /> Soumettre le dossier KYC</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Kyb() {
  const [kyb, setKyb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [contractSent, setContractSent] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    documentIdFront: null, documentIdBack: null, documentSelfie: null,
    documentRccm: null, documentCertificate: null,
    documentProofAddress: null, documentBankStatement: null,
    documentStatuts: null, documentLicense: null,
  });

  const draft = lsLoad();

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { companyLegalName: "", tradeName: "", registrationNumber: "", taxNumber: "", incorporationCountry: "", city: "", businessAddress: "", businessType: "", foundingDate: "", website: "", businessDescription: "", ...draft?.step1 } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { legalRepName: "", legalRepDob: "", legalRepNationality: "", legalRepPhone: "", legalRepEmail: "", legalRepPosition: "", legalRepIdType: "", legalRepIdNumber: "", legalRepIdExpiry: "", ...draft?.step2 } });
  const form4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema), defaultValues: { contractEmail: draft?.step4?.contractEmail ?? "", check1: false, check2: false, check3: false, check4: false, check5: false } });

  useEffect(() => {
    if (draft?.step && draft.step > 1) setStep(draft.step);
  }, []);

  const watchAll1 = form1.watch();
  const watchAll2 = form2.watch();
  const watchEmail4 = form4.watch("contractEmail");

  useEffect(() => {
    lsSave({ step1: form1.getValues(), step2: form2.getValues(), step4: { contractEmail: form4.getValues("contractEmail") }, step });
  }, [watchAll1, watchAll2, watchEmail4, step]);

  useEffect(() => {
    fetch("/api/dashboard/kyb", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
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

  const setFile = (key: string) => (file: File | null) =>
    setUploadedFiles(prev => ({ ...prev, [key]: file }));

  const step2RequiredDocs = STEP2_DOCS.filter(d => d.required).every(d => uploadedFiles[d.key] !== null);
  const step3RequiredDocs = STEP3_DOCS.filter(d => d.required).every(d => uploadedFiles[d.key] !== null);

  const accountType: "enterprise" | "personal" = kyb?.accountType ?? "enterprise";
  const status = kyb?.status ?? "pending";
  const statusInfo = kybStatusConfig[status] ?? kybStatusConfig.pending;
  const isEditable = status === "pending" || status === "rejected";

  const saveStep = async (stepNum: number, data: Record<string, any>, fileKeys?: string[]) => {
    const formData = new FormData();
    formData.append("step", String(stepNum));
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") formData.append(k, String(v));
    });
    const keysToUpload = fileKeys ?? Object.keys(uploadedFiles);
    keysToUpload.forEach(k => { const f = uploadedFiles[k]; if (f) formData.append(k, f); });
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    const res = await fetch(`${BASE}/api/dashboard/kyb`, { method: "POST", credentials: "include", body: formData });
    let d: any = {};
    try { d = await res.json(); } catch {}
    if (!res.ok) throw new Error(d.error ?? (d.details ? JSON.stringify(d.details) : "Erreur serveur"));
    setKyb({ ...d, accountType });
    return d;
  };

  const handleStep1Next = form1.handleSubmit(async (values) => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try { await saveStep(1, values); setStep(2); }
    catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  });

  const handleStep2Next = form2.handleSubmit(async (values) => {
    if (submitting) return;
    setError("");
    if (!step2RequiredDocs) { setError("Veuillez téléverser tous les documents obligatoires du représentant légal."); return; }
    setSubmitting(true);
    try { await saveStep(2, values, STEP2_DOCS.map(d => d.key)); setStep(3); }
    catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  });

  const handleStep3Next = async () => {
    if (submitting) return;
    setError("");
    if (!step3RequiredDocs) { setError("Veuillez téléverser les 4 documents obligatoires avant de continuer."); return; }
    setSubmitting(true);
    try { await saveStep(3, {}, STEP3_DOCS.map(d => d.key)); setStep(4); }
    catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleFinalSubmit = form4.handleSubmit(async (values) => {
    setError("");
    setSubmitting(true);
    try {
      await saveStep(4, { contractEmail: values.contractEmail, contractAccepted: "true" });
      lsClear();
      setContractSent(true);
    } catch (e: any) { setError(e.message); }
    setSubmitting(false);
  });

  const progressPercent = ((step - 1) / (KYB_STEPS.length - 1)) * 100;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  const isPersonal = accountType === "personal";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            {isPersonal ? "Vérification KYC" : "Vérification KYB"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isPersonal
              ? "Know Your Customer — Complétez les 3 étapes pour activer votre compte production"
              : "Know Your Business — Complétez les 4 étapes pour activer votre compte production"
            }
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
            <h2 className="text-xl font-bold">Compte production activé</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {isPersonal
                ? "Votre identité a été vérifiée avec succès. L'API Pay-in live est désormais disponible."
                : "Votre entreprise a été vérifiée avec succès. Toutes les API live, wallets et paiements sont désormais disponibles."
              }
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto mt-4">
              {(isPersonal
                ? ["API Payin Live", "Wallets actifs"]
                : ["API Payin Live", "API Payout Live", "Wallets actifs", "Cartes virtuelles", "Paiement de masse", "Airtime API"]
              ).map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-500/5 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Personal KYC flow ── */}
            {isPersonal && !contractSent && (
              <PersonalKyc kyb={kyb} isEditable={isEditable} onSubmitted={(d) => setKyb({ ...d, accountType: "personal" })} />
            )}

            {/* ── Enterprise KYB flow ── */}
            {!isPersonal && !contractSent && (
              <>
                {/* Stepper */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    {KYB_STEPS.map((s, i) => {
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
                          {i < KYB_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mt-[-12px] sm:mt-[-18px] transition-all ${step > s.id ? "bg-primary" : "bg-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Étape {step} sur {KYB_STEPS.length} — {KYB_STEPS[step - 1].label}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {/* ── STEP 1: Company Info ── */}
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
                                      {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                                    <Textarea placeholder="Décrivez votre activité principale..." className="min-h-24 resize-none" disabled={!isEditable} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" className="text-black gap-2" disabled={submitting}>
                              {submitting ? "Enregistrement…" : <><span>Suivant</span><ChevronRight className="w-4 h-4" /></>}
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
                                      {ID_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {STEP2_DOCS.map(doc => (
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
                            <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2" disabled={submitting}>
                              <ChevronLeft className="w-4 h-4" /> Retour
                            </Button>
                            <Button type="submit" className="text-black gap-2" disabled={submitting}>
                              {submitting ? "Enregistrement…" : <><span>Suivant</span><ChevronRight className="w-4 h-4" /></>}
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {STEP3_DOCS.filter(d => d.required).map(doc => (
                              <FileUploadRow key={doc.key} doc={doc} isEditable={isEditable} file={uploadedFiles[doc.key]} onFileChange={setFile(doc.key)} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents optionnels</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {STEP3_DOCS.filter(d => !d.required).map(doc => (
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
                        <Button type="button" onClick={handleStep3Next} className="text-black gap-2" disabled={submitting}>
                          {submitting ? "Enregistrement…" : <><span>Suivant</span><ChevronRight className="w-4 h-4" /></>}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 4: Contract & Signature ── */}
                  {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <Form {...form4}>
                        <form onSubmit={handleFinalSubmit} className="space-y-5">
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
                            <div className="p-6 max-h-64 overflow-y-auto space-y-4 text-sm leading-relaxed">
                              <p className="text-muted-foreground">DrimPay applique une politique stricte de conformité financière AML/CFT. Toute activité frauduleuse entraîne la suspension immédiate du compte et un signalement aux autorités compétentes.</p>
                              <p className="text-muted-foreground">En acceptant ce contrat, le marchand est entièrement responsable de toutes les transactions effectuées via son compte DrimPay, de la conformité de son activité avec les lois financières applicables, et de la sécurité de ses clés API.</p>
                            </div>
                          </div>

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

                          <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="font-semibold flex items-center gap-2 text-base mb-1">
                              <Mail className="w-4 h-4 text-primary" />
                              Adresse email professionnelle
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">Le contrat officiel DrimPay sera envoyé à cette adresse pour signature.</p>
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

                          <div className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setStep(3)} className="gap-2">
                              <ChevronLeft className="w-4 h-4" /> Retour
                            </Button>
                            <Button type="submit" className="text-black gap-2" disabled={submitting}>
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

            {/* ── Submitted confirmation (enterprise) ── */}
            {!isPersonal && contractSent && (
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
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
