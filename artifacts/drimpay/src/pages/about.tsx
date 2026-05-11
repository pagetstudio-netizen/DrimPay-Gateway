import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function About() {
  const t = useT();
  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="pt-32 pb-20 container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 text-[#0f0f0f] leading-[1.02]"
          >
            {t.about.title}{" "}
            <span
              className="relative inline-block"
              style={{ color: "#3a7a00" }}
            >
              {t.about.titleHighlight}
              <span
                className="absolute -bottom-1 left-0 w-full h-2 rounded-full opacity-50"
                style={{ background: "#B5F03C" }}
              />
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <p className="text-xl md:text-2xl text-[#0f0f0f]/55 leading-relaxed mb-6">{t.about.p1}</p>
            <p className="text-base text-[#0f0f0f]/60 leading-relaxed">{t.about.p2}</p>
          </motion.div>

          {/* ── MISSION & VISION ────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 rounded-2xl bg-white border border-[#E5E3DC] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#B5F03C]/20 flex items-center justify-center mb-5">
                <span className="text-[#3a7a00] font-extrabold text-sm">M</span>
              </div>
              <h3 className="text-2xl font-extrabold mb-4 text-[#0f0f0f]">{t.about.missionTitle}</h3>
              <p className="text-[#0f0f0f]/55 leading-relaxed">{t.about.missionDesc}</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-[#E5E3DC] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#0f0f0f] flex items-center justify-center mb-5">
                <span className="text-white font-extrabold text-sm">V</span>
              </div>
              <h3 className="text-2xl font-extrabold mb-4 text-[#0f0f0f]">{t.about.visionTitle}</h3>
              <p className="text-[#0f0f0f]/55 leading-relaxed">{t.about.visionDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TEAM CTA ────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-20">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-6 text-white">{t.about.teamTitle}</h2>
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">{t.about.teamDesc}</p>
          <Link href="/careers">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all shadow-lg">
              {t.about.teamBtn} <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
