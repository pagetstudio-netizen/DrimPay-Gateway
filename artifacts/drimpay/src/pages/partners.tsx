import { motion } from "framer-motion";
import { useListPartners } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

export default function Partners() {
  const { data: partners, isLoading } = useListPartners();
  const t = useT();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">{t.partners.badge}</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t.partners.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">{t.partners.desc}</p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {(partners ?? []).map((partner, i) => (
              <motion.div key={partner.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors flex flex-col"
                data-testid={`partner-card-${partner.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{partner.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                        {t.partners.types[partner.type as keyof typeof t.partners.types] ?? partner.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{partner.country}</span>
                    </div>
                  </div>
                  {partner.website && (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{partner.description}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center rounded-2xl bg-primary/10 border border-primary/20 p-10">
          <h2 className="text-2xl font-bold mb-4">{t.partners.becomeTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{t.partners.becomeDesc}</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">{t.partners.becomeBtn} <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
