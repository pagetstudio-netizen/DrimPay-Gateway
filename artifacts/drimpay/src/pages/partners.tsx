import { motion } from "framer-motion";
import { useListPartners } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

export default function Partners() {
  const { data: partners, isLoading } = useListPartners();
  const t = useT();

  return (
    <div className="bg-[#F8F6F1]">
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8">

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-6 text-xs font-semibold text-[#3a7a00]">{t.partners.badge}</div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.partners.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55 leading-relaxed">{t.partners.desc}</p>
          </motion.div>

          {/* ── PARTNER CARDS ─────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl bg-[#E5E3DC]" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {(partners ?? []).map((partner, i) => (
                <motion.div key={partner.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="p-6 rounded-2xl border border-[#E5E3DC] bg-white hover:border-[#B5F03C]/50 hover:shadow-md transition-all flex flex-col"
                  data-testid={`partner-card-${partner.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-lg mb-1 text-[#0f0f0f]">{partner.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-[#F5F0E8] text-[#0f0f0f]/55 border border-[#E5E3DC]">
                          {t.partners.types[partner.type as keyof typeof t.partners.types] ?? partner.type}
                        </span>
                        <span className="text-xs text-[#0f0f0f]/40">{partner.country}</span>
                      </div>
                    </div>
                    {partner.website && (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-[#0f0f0f]/30 hover:text-[#3a7a00] transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-[#0f0f0f]/55 leading-relaxed flex-1">{partner.description}</p>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-2xl font-extrabold mb-4 text-white">{t.partners.becomeTitle}</h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto leading-relaxed">{t.partners.becomeDesc}</p>
          <Link href="/contact">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
              {t.partners.becomeBtn} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
