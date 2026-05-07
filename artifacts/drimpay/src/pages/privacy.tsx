import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";

export default function Privacy() {
  const t = useT();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.privacy.title}</h1>
            <p className="text-muted-foreground">{t.privacy.effectiveDate}</p>
          </div>

          <div className="flex flex-col gap-10">
            {t.privacy.sections.map((section, i) => (
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
