import { motion } from "framer-motion";
import { useT, useLang } from "@/lib/i18n";
import { useSEO, webPageSchema, SITE_URL } from "@/lib/seo";

export default function Terms() {
  const t = useT();
  const lang = useLang();
  useSEO({
    title: lang === "fr"
      ? "Conditions Générales d'Utilisation — DrimPay"
      : "Terms of Service — DrimPay",
    description: lang === "fr"
      ? "Conditions générales d'utilisation de la plateforme DrimPay. Droits, obligations et responsabilités des marchands utilisant l'infrastructure de paiement DrimPay."
      : "Terms of service for the DrimPay platform. Rights, obligations and responsibilities of merchants using DrimPay payment infrastructure.",
    noIndex: false,
    jsonLd: [
      webPageSchema(
        `${SITE_URL}/${lang}/terms`,
        lang === "fr" ? "CGU DrimPay" : "DrimPay Terms of Service",
        lang === "fr" ? "Conditions générales d'utilisation de DrimPay." : "DrimPay terms of service.",
        [{ name: lang === "fr" ? "CGU" : "Terms", url: `${SITE_URL}/${lang}/terms` }],
      ),
    ],
  });

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.terms.title}</h1>
            <p className="text-muted-foreground">{t.terms.effectiveDate}</p>
          </div>

          <div className="flex flex-col gap-10">
            {t.terms.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
