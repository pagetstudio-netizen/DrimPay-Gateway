import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export default function About() {
  const t = useT();
  return (
    <div className="pt-32 pb-24 container mx-auto px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-8"
        >
          {t.about.title} <span className="text-primary">{t.about.titleHighlight}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert lg:prose-xl max-w-none mb-16"
        >
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">{t.about.p1}</p>
          <p>{t.about.p2}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <div className="p-8 rounded-2xl bg-card border border-border">
            <h3 className="text-2xl font-bold mb-4">{t.about.missionTitle}</h3>
            <p className="text-muted-foreground leading-relaxed">{t.about.missionDesc}</p>
          </div>
          <div className="p-8 rounded-2xl bg-card border border-border">
            <h3 className="text-2xl font-bold mb-4">{t.about.visionTitle}</h3>
            <p className="text-muted-foreground leading-relaxed">{t.about.visionDesc}</p>
          </div>
        </div>

        <div className="text-center bg-secondary/50 rounded-3xl p-12 border border-border">
          <h2 className="text-3xl font-bold mb-6">{t.about.teamTitle}</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{t.about.teamDesc}</p>
          <Link href="/careers">
            <Button size="lg" className="font-semibold">{t.about.teamBtn}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
