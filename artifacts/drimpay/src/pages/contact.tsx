import { motion } from "framer-motion";
import { useSubmitContact } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSEO, webPageSchema, SITE_URL } from "@/lib/seo";
import { Mail, Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useT, useLang } from "@/lib/i18n";

const makeSchema = (t: ReturnType<typeof useT>) =>
  z.object({
    name: z.string().min(2),
    email: z.string().email(),
    company: z.string().optional(),
    subject: z.string().min(3),
    message: z.string().min(10),
  });

type FormData = { name: string; email: string; company?: string; subject: string; message: string };

export default function Contact() {
  const t = useT();
  const lang = useLang();
  useSEO({
    title: lang === "fr"
      ? "Contacter DrimPay — Support Technique, Partenariats & Questions Commerciales"
      : "Contact DrimPay — Technical Support, Partnerships & Business Inquiries",
    description: lang === "fr"
      ? "Contactez l'équipe DrimPay pour toute question technique, demande de partenariat ou question commerciale. Support disponible par e-mail et formulaire de contact."
      : "Contact the DrimPay team for technical questions, partnership requests or business inquiries. Support available by email and contact form.",
    keywords: lang === "fr"
      ? "contact DrimPay, support paiement Afrique, partenariat fintech, aide technique DrimPay"
      : "contact DrimPay, Africa payment support, fintech partnership, DrimPay technical help",
    jsonLd: [
      webPageSchema(
        `${SITE_URL}/${lang}/contact`,
        lang === "fr" ? "Contacter DrimPay" : "Contact DrimPay",
        lang === "fr" ? "Contactez l'équipe DrimPay pour toute question." : "Contact the DrimPay team for any question.",
        [{ name: lang === "fr" ? "Contact" : "Contact", url: `${SITE_URL}/${lang}/contact` }],
      ),
      {
        "@type": "ContactPage",
        name: lang === "fr" ? "Page de contact DrimPay" : "DrimPay Contact Page",
        url: `${SITE_URL}/${lang}/contact`,
        contactOption: "TollFree",
      },
    ],
  });
  const [submitted, setSubmitted] = useState(false);
  const mutation = useSubmitContact();

  const form = useForm<FormData>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { name: "", email: "", company: "", subject: "", message: "" },
  });

  const onSubmit = (values: FormData) => {
    mutation.mutate({ data: values }, { onSuccess: () => setSubmitted(true) });
  };

  return (
    <div className="bg-[#F8F6F1]">
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8">

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.contact.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55">{t.contact.desc}</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">

            {/* ── FORM ──────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-[#B5F03C]/40 bg-[#B5F03C]/8">
                  <CheckCircle2 className="w-16 h-16 text-[#3a7a00] mb-6" />
                  <h2 className="text-2xl font-extrabold mb-3 text-[#0f0f0f]">{t.contact.successTitle}</h2>
                  <p className="text-[#0f0f0f]/55 max-w-md">{t.contact.successDesc}</p>
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-[#E5E3DC] bg-white p-8 shadow-sm">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0f0f0f] font-semibold">{t.contact.fullName}</FormLabel>
                            <FormControl><Input placeholder={t.contact.namePlaceholder} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#0f0f0f] font-semibold">{t.contact.email}</FormLabel>
                            <FormControl><Input placeholder="aminata@company.com" type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="company" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0f0f0f] font-semibold">{t.contact.company}</FormLabel>
                          <FormControl><Input placeholder={t.contact.companyPlaceholder} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0f0f0f] font-semibold">{t.contact.subject}</FormLabel>
                          <FormControl><Input placeholder={t.contact.subjectPlaceholder} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#0f0f0f] font-semibold">{t.contact.message}</FormLabel>
                          <FormControl><Textarea placeholder={t.contact.messagePlaceholder} rows={6} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" size="lg" disabled={mutation.isPending}>
                        {mutation.isPending ? t.contact.sending : t.contact.send} <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ───────────────────────────────────────── */}
            <div className="flex flex-col gap-6">
              {[
                { icon: Mail, title: t.contact.emailLabel, details: ["support@drimpay.io", "enterprise@drimpay.io"] },
                { icon: Phone, title: t.contact.phoneLabel, details: ["+228 22 00 11 22", "+237 699 001 122"] },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl border border-[#E5E3DC] bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-[#B5F03C]/20 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-[#3a7a00]" />
                    </div>
                    <h3 className="font-extrabold text-[#0f0f0f]">{item.title}</h3>
                  </div>
                  {item.details.map((d, j) => <p key={j} className="text-sm text-[#0f0f0f]/55">{d}</p>)}
                </div>
              ))}

              <div className="p-6 rounded-xl border border-[#B5F03C]/30 bg-[#B5F03C]/8">
                <h3 className="font-extrabold mb-2 text-[#0f0f0f]">{t.contact.supportHoursTitle}</h3>
                <p className="text-sm text-[#0f0f0f]/55">{t.contact.supportHours1}</p>
                <p className="text-sm text-[#0f0f0f]/55">{t.contact.supportHours2}</p>
                <p className="text-sm text-[#0f0f0f]/55 mt-2">{t.contact.supportHours3}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
