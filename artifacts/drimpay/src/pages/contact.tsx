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
import { useState, useEffect } from "react";
import { useT, useLang } from "@/lib/i18n";
import { FaWhatsapp } from "react-icons/fa";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SocialLink = { id: number; platform: string; url: string; active: boolean; sortOrder: number };

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

  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [wsUrl, setWsUrl] = useState("https://wa.me/22872151047");

  useEffect(() => {
    fetch(`${BASE}/api/support/contact-info`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.emails)) setEmails(d.emails);
        if (Array.isArray(d.phones)) setPhones(d.phones);
      })
      .catch(() => {});

    fetch(`${BASE}/api/support/links`)
      .then(r => r.json())
      .then((links: SocialLink[]) => {
        const map = Object.fromEntries(links.map(l => [l.platform, l]));
        const ws = map["whatsapp_support"] ?? map["whatsapp"];
        if (ws?.url) setWsUrl(ws.url);
      })
      .catch(() => {});
  }, []);

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
                  className="flex flex-col items-center justify-center rounded-[28px] border border-[#B5F03C]/45 bg-white px-6 py-20 text-center shadow-[0_22px_60px_rgba(32,35,20,0.08)] sm:px-10">
                  <CheckCircle2 className="w-16 h-16 text-[#3a7a00] mb-6" />
                  <h2 className="text-2xl font-extrabold mb-3 text-[#0f0f0f]">{t.contact.successTitle}</h2>
                  <p className="text-[#0f0f0f]/55 max-w-md">{t.contact.successDesc}</p>
                </motion.div>
              ) : (
                <div className="rounded-[28px] border border-[#E7E5DE] bg-white p-6 shadow-[0_22px_60px_rgba(32,35,20,0.09)] sm:p-9">
                  <div className="mb-8 flex items-center gap-3">
                    <span className="h-1.5 w-10 rounded-full bg-[#B5F03C]" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#777970]">
                      Contact DrimPay
                    </span>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-7">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">{t.contact.fullName}</FormLabel>
                          <FormControl>
                            <Input
                              className="h-[58px] rounded-full border-[#E5E5E0] bg-white px-5 text-base text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] transition placeholder:text-[#9a9b96] hover:border-[#cfd0c8] focus-visible:border-[#8ebc2c] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/20"
                              placeholder={t.contact.namePlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">{t.contact.email}</FormLabel>
                          <FormControl>
                            <Input
                              className="h-[58px] rounded-full border-[#E5E5E0] bg-white px-5 text-base text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] transition placeholder:text-[#9a9b96] hover:border-[#cfd0c8] focus-visible:border-[#8ebc2c] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/20"
                              placeholder="aminata@company.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="company" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">{t.contact.company}</FormLabel>
                          <FormControl>
                            <Input
                              className="h-[58px] rounded-full border-[#E5E5E0] bg-white px-5 text-base text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] transition placeholder:text-[#9a9b96] hover:border-[#cfd0c8] focus-visible:border-[#8ebc2c] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/20"
                              placeholder={t.contact.companyPlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">{t.contact.subject}</FormLabel>
                          <FormControl>
                            <Input
                              className="h-[58px] rounded-full border-[#E5E5E0] bg-white px-5 text-base text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] transition placeholder:text-[#9a9b96] hover:border-[#cfd0c8] focus-visible:border-[#8ebc2c] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/20"
                              placeholder={t.contact.subjectPlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">{t.contact.message}</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[184px] resize-y rounded-[24px] border-[#E5E5E0] bg-white px-5 py-4 text-base leading-6 text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] transition placeholder:text-[#9a9b96] hover:border-[#cfd0c8] focus-visible:border-[#8ebc2c] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/20"
                              placeholder={t.contact.messagePlaceholder}
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={mutation.isPending}
                        className="group min-h-[62px] w-full rounded-full border-[#a7dc35] bg-[#B5F03C] px-7 text-base font-bold text-[#11130c] shadow-[0_12px_28px_rgba(143,190,43,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c5ff4a] hover:shadow-[0_16px_32px_rgba(143,190,43,0.28)] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/30"
                      >
                        {mutation.isPending ? t.contact.sending : t.contact.send} <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ───────────────────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* WhatsApp */}
              <div className="p-6 rounded-xl border border-[#B5F03C]/30 bg-[#B5F03C]/8 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                  <FaWhatsapp className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0f0f0f] mb-1">Support WhatsApp</h3>
                  <p className="text-sm text-[#0f0f0f]/55">Contactez directement notre équipe</p>
                </div>
                <a
                  href={wsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-green-500 transition-colors"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  Contacter sur WhatsApp
                </a>
              </div>

              {emails.length > 0 && (
                <div className="p-6 rounded-xl border border-[#E5E3DC] bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-[#B5F03C]/20 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-[#3a7a00]" />
                    </div>
                    <h3 className="font-extrabold text-[#0f0f0f]">{t.contact.emailLabel}</h3>
                  </div>
                  {emails.map((e, i) => <p key={i} className="text-sm text-[#0f0f0f]/55">{e}</p>)}
                </div>
              )}

              {phones.length > 0 && (
                <div className="p-6 rounded-xl border border-[#E5E3DC] bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-[#B5F03C]/20 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-[#3a7a00]" />
                    </div>
                    <h3 className="font-extrabold text-[#0f0f0f]">{t.contact.phoneLabel}</h3>
                  </div>
                  {phones.map((p, i) => <p key={i} className="text-sm text-[#0f0f0f]/55">{p}</p>)}
                </div>
              )}

              <div className="p-6 rounded-xl border border-[#B5F03C]/30 bg-[#B5F03C]/8">
                <h3 className="font-extrabold mb-2 text-[#0f0f0f]">{t.contact.supportHoursTitle}</h3>
                <p className="text-sm text-[#0f0f0f]/55">{t.contact.supportHours1}</p>
                {t.contact.supportHours2 && <p className="text-sm text-[#0f0f0f]/55">{t.contact.supportHours2}</p>}
                {t.contact.supportHours3 && <p className="text-sm text-[#0f0f0f]/55 mt-2">{t.contact.supportHours3}</p>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
