import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, CheckCircle2, Clock, XCircle, AlertCircle, Upload, Building, Globe, FileText, Hash } from "lucide-react";
import { DashboardLayout } from "./layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  companyLegalName: z.string().min(2, "Nom légal requis"),
  registrationNumber: z.string().min(1, "Numéro de registre requis"),
  businessType: z.string().min(1, "Type d'entreprise requis"),
  incorporationCountry: z.string().min(2, "Pays requis"),
  businessAddress: z.string().min(5, "Adresse complète requise"),
  website: z.string().url("URL invalide").or(z.literal("")).optional(),
  businessDescription: z.string().min(20, "Description requise (min. 20 caractères)"),
});

type FormData = z.infer<typeof schema>;

const COUNTRIES = [
  "Togo", "Bénin", "Cameroun", "Burkina Faso", "Mali", "Sénégal", "Côte d'Ivoire",
  "Ghana", "Nigeria", "France", "Autre",
];

const BUSINESS_TYPES = [
  "SARL", "SA", "SAS", "SUARL", "GIE", "Coopérative", "ONG", "Autre",
];

const kybStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any; description: string }> = {
  pending: {
    label: "Non soumis",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: AlertCircle,
    description: "Soumettez vos documents d'entreprise pour activer les paiements live.",
  },
  submitted: {
    label: "Soumis",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    icon: Clock,
    description: "Vos documents ont été soumis. Révision sous 24-48h ouvrables.",
  },
  under_review: {
    label: "En cours de révision",
    color: "text-yellow-600",
    bg: "bg-yellow-500/10",
    icon: Clock,
    description: "Notre équipe examine vos documents. Nous vous contacterons si nécessaire.",
  },
  approved: {
    label: "Approuvé",
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
    description: "Votre soumission a été rejetée. Corrigez les points mentionnés et resoumettre.",
  },
};

const steps = [
  { id: 1, label: "Informations entreprise", icon: Building },
  { id: 2, label: "Documents requis", icon: FileText },
];

export default function Kyb() {
  const [kyb, setKyb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyLegalName: "",
      registrationNumber: "",
      businessType: "",
      incorporationCountry: "",
      businessAddress: "",
      website: "",
      businessDescription: "",
    },
  });

  useEffect(() => {
    fetch("/api/dashboard/kyb", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setKyb(d);
        if (d && d.companyLegalName) {
          form.reset({
            companyLegalName: d.companyLegalName ?? "",
            registrationNumber: d.registrationNumber ?? "",
            businessType: d.businessType ?? "",
            incorporationCountry: d.incorporationCountry ?? "",
            businessAddress: d.businessAddress ?? "",
            website: d.website ?? "",
            businessDescription: d.businessDescription ?? "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/dashboard/kyb", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur lors de la soumission");
      setSubmitting(false);
      return;
    }
    setKyb(data);
    setSubmitting(false);
  };

  const status = kyb?.status ?? "pending";
  const statusInfo = kybStatusConfig[status] ?? kybStatusConfig.pending;
  const isEditable = status === "pending" || status === "rejected";

  const documents = [
    { key: "documentRccm", label: "RCCM / Registre du Commerce", description: "Document d'immatriculation officiel de l'entreprise", required: true },
    { key: "documentStatuts", label: "Statuts de l'entreprise", description: "Actes constitutifs signés et enregistrés", required: true },
    { key: "documentId", label: "Pièce d'identité du dirigeant", description: "CNI, passeport ou permis de conduire du représentant légal", required: true },
    { key: "documentProofAddress", label: "Justificatif de domicile", description: "Facture ou relevé bancaire de moins de 3 mois", required: false },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Vérification KYB</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Know Your Business — Vérification d'identité de votre entreprise
          </p>
        </div>

        <div className={`flex items-start gap-4 p-5 rounded-xl border mb-8 ${statusInfo.bg} border-current/10`}>
          <statusInfo.icon className={`w-6 h-6 ${statusInfo.color} shrink-0 mt-0.5`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</p>
            </div>
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
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Compte vérifié</h2>
            <p className="text-muted-foreground">
              Votre entreprise a été vérifiée avec succès. Vous pouvez utiliser l'API en mode production.
            </p>
          </div>
        ) : loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${step === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </button>
                  {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">{error}</div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Informations légales de l'entreprise
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="companyLegalName" render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Raison sociale (nom légal exact)</FormLabel>
                            <FormControl><Input placeholder="ACME SARL" disabled={!isEditable} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro RCCM / Registre</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="TG-LOM-2024-B-12345" disabled={!isEditable} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="businessType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Forme juridique</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!isEditable}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="incorporationCountry" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays d'incorporation</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!isEditable}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="businessAddress" render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Adresse du siège social</FormLabel>
                            <FormControl><Input placeholder="Avenue de la Victoire, Lomé, Togo" disabled={!isEditable} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="website" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site web (optionnel)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="https://votre-site.com" disabled={!isEditable} {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="businessDescription" render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Description de l'activité</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Décrivez votre activité principale, vos produits/services, et le type de transactions que vous allez traiter..."
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
                      <Button type="button" onClick={() => setStep(2)} className="text-primary-foreground">
                        Suivant : Documents →
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documents requis
                      </h3>
                      <p className="text-xs text-muted-foreground mb-5">
                        Formats acceptés : PDF, JPG, PNG · Taille max : 5 Mo par document
                      </p>
                      <div className="space-y-4">
                        {documents.map((doc) => (
                          <div key={doc.key} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-muted/20">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium">{doc.label}</p>
                                {doc.required ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 font-semibold">Obligatoire</span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">Optionnel</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{doc.description}</p>
                              {isEditable ? (
                                <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-xs text-muted-foreground">
                                  <Upload className="w-4 h-4" />
                                  Téléverser un fichier
                                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                </label>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  Document soumis
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 justify-between">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        ← Retour
                      </Button>
                      {isEditable && (
                        <Button type="submit" className="text-primary-foreground" disabled={submitting}>
                          {submitting ? "Soumission en cours..." : <><FileCheck className="w-4 h-4 mr-2" />Soumettre le dossier KYB</>}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </form>
            </Form>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
