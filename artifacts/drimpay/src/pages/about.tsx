import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Target, Eye, Zap, Shield, Globe, Star,
  ChevronRight, MapPin, Users, TrendingUp, Check, Layers,
} from "lucide-react";
import { useT } from "@/lib/i18n";

/* ── animation helpers ──────────────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const scaleUp = { hidden: { opacity: 0, scale: 0.93 }, visible: { opacity: 1, scale: 1 } };
const slideLeft = { hidden: { opacity: 0, x: -32 }, visible: { opacity: 1, x: 0 } };
const slideRight = { hidden: { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0 } };
const viewport = { once: true, margin: "-60px" };

/* ── values data ────────────────────────────────────────────────────────── */
const VALUES = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Fiabilité",
    desc: "Nous construisons sur des fondations solides. Chaque transaction est confirmée, chaque webhook est signé, chaque incident est géré avec transparence.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Transparence",
    desc: "3% de frais plats, aucun frais caché, aucun abonnement. Vous savez exactement ce que vous payez à chaque transaction.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Vitesse",
    desc: "Les paiements instantanés ne sont pas une option, c'est notre standard. Moins de 30 secondes du début à la confirmation.",
    color: "bg-[#B5F03C]/20 text-[#3a7a00]",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Accessibilité",
    desc: "Une seule intégration API pour couvrir 7 pays, 20+ opérateurs, deux zones monétaires — BCEAO et BEAC.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Infrastructure d'abord",
    desc: "Nous ne sommes pas une app. Nous sommes la couche fondamentale sur laquelle vous construisez vos produits fintech.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: "Excellence",
    desc: "99.9% de disponibilité garantie. Notre équipe d'ingénierie surveille chaque corridor 24h/24, 7j/7.",
    color: "bg-amber-50 text-amber-600",
  },
];

/* ── stats ──────────────────────────────────────────────────────────────── */
const STATS = [
  { value: "7", label: "Pays couverts", icon: <MapPin className="w-4 h-4" /> },
  { value: "20+", label: "Opérateurs intégrés", icon: <Globe className="w-4 h-4" /> },
  { value: "3%", label: "Frais flat transparents", icon: <TrendingUp className="w-4 h-4" /> },
  { value: "2023", label: "Année de fondation", icon: <Star className="w-4 h-4" /> },
];

/* ── milestones ─────────────────────────────────────────────────────────── */
const MILESTONES = [
  { year: "2023", title: "Fondation d'ASHTECH SARL", desc: "Naissance de DrimPay à Lomé, Togo. Première intégration TMoney & Moov Money." },
  { year: "2024", title: "Expansion régionale", desc: "Lancement au Bénin, Sénégal et Côte d'Ivoire. Intégration Orange Money, Wave et MTN MoMo." },
  { year: "2024", title: "API v2.0", desc: "Refonte complète de l'infrastructure API. Support multi-pays unifié, webhooks temps réel et dashboard marchand." },
  { year: "2025", title: "Prochaine étape", desc: "Expansion vers le Nigeria et le Ghana. Lancement des cartes virtuelles et du Mass Payout automatisé." },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function About() {
  const t = useT();

  return (
    <div className="bg-[#F8F6F1]">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="pt-24 md:pt-36 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B5F03C]/20 border border-[#B5F03C]/30 mb-7"
            >
              <Users className="w-3.5 h-3.5 text-[#3a7a00]" />
              <span className="text-xs font-semibold text-[#3a7a00]">ASHTECH SARL — DrimPay</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter mb-7 text-[#0f0f0f] leading-[1.02] max-w-4xl"
            >
              {t.about.title}{" "}
              <span className="relative inline-block" style={{ color: "#3a7a00" }}>
                {t.about.titleHighlight}
                <motion.span
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -bottom-1 left-0 w-full h-2 rounded-full opacity-50"
                  style={{ background: "#B5F03C" }}
                />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-lg sm:text-xl text-[#0f0f0f]/55 leading-relaxed max-w-2xl mb-10"
            >
              {t.about.p1}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm shadow-md"
                >
                  Créer un compte <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/careers">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white border border-[#E0DDD6] text-[#0f0f0f] font-semibold text-sm hover:shadow-md transition-all"
                >
                  Rejoindre l'équipe <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-b border-[#E5E3DC] bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2 text-[#B5F03C] mb-1">
                  {stat.icon}
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#0f0f0f] leading-none">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-[#0f0f0f]/50 font-medium mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── STORY ─────────────────────────────────────────────────────────── */}
      <div className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <motion.div
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[#B5F03C] text-xs font-bold uppercase tracking-widest mb-4">Notre histoire</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-6">
                Construire l'infrastructure financière de l'Afrique
              </h2>
              <p className="text-[#0f0f0f]/55 leading-relaxed mb-5 text-base">
                {t.about.p1}
              </p>
              <p className="text-[#0f0f0f]/55 leading-relaxed text-base">
                {t.about.p2}
              </p>
            </motion.div>

            {/* Timeline */}
            <motion.div
              variants={slideRight}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E5E3DC]" />
              <div className="flex flex-col gap-8">
                {MILESTONES.map((m, i) => (
                  <div key={i} className="pl-12 relative">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-[#B5F03C] flex items-center justify-center z-10">
                      <span className="text-[9px] font-black text-[#3a7a00]">{i + 1}</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#B5F03C] uppercase tracking-widest mb-1">{m.year}</p>
                    <h4 className="font-extrabold text-sm text-[#0f0f0f] mb-1">{m.title}</h4>
                    <p className="text-xs text-[#0f0f0f]/50 leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── MISSION & VISION ──────────────────────────────────────────────── */}
      <div className="py-20 sm:py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="text-[#B5F03C] text-xs font-bold uppercase tracking-widest mb-3">Pourquoi nous existons</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight max-w-xl">
              Mission & Vision
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mission */}
            <motion.div
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group p-8 rounded-3xl bg-white border border-[#E5E3DC] hover:border-[#B5F03C]/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#B5F03C]/15 flex items-center justify-center mb-6 group-hover:bg-[#B5F03C]/25 transition-colors">
                <Target className="w-6 h-6 text-[#3a7a00]" />
              </div>
              <p className="text-xs font-bold text-[#0f0f0f]/35 uppercase tracking-widest mb-3">Mission</p>
              <h3 className="text-2xl font-extrabold mb-4 text-[#0f0f0f] leading-snug">
                {t.about.missionTitle}
              </h3>
              <p className="text-[#0f0f0f]/55 leading-relaxed">{t.about.missionDesc}</p>
              <div className="mt-6 space-y-2">
                {["API unifiée pour tous les opérateurs", "Conformité BCEAO & BEAC intégrée", "Infrastructure fiable à 99,9%"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#B5F03C] flex-shrink-0" />
                    <span className="text-sm text-[#0f0f0f]/60">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div
              variants={slideRight}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="group p-8 rounded-3xl bg-[#0f0f0f] border border-[#0f0f0f] hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white/15 transition-colors">
                <Eye className="w-6 h-6 text-[#B5F03C]" />
              </div>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Vision</p>
              <h3 className="text-2xl font-extrabold mb-4 text-white leading-snug">
                {t.about.visionTitle}
              </h3>
              <p className="text-white/60 leading-relaxed">{t.about.visionDesc}</p>
              <div className="mt-6 space-y-2">
                {["Commerce continental sans friction", "Toute entreprise, tout pays, instantané", "L'Afrique comme modèle mondial"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#B5F03C] flex-shrink-0" />
                    <span className="text-sm text-white/50">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── VALUES ────────────────────────────────────────────────────────── */}
      <div className="py-20 sm:py-24 bg-[#F8F6F1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="text-[#B5F03C] text-xs font-bold uppercase tracking-widest mb-3">Ce qui nous guide</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight max-w-xl">
              Nos valeurs fondamentales
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {VALUES.map((val, i) => (
              <motion.div
                key={i}
                variants={scaleUp}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="group p-6 rounded-2xl bg-white border border-[#E5E3DC] hover:border-[#B5F03C]/50 hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${val.color}`}>
                  {val.icon}
                </div>
                <h4 className="font-extrabold text-base mb-2 text-[#0f0f0f]">{val.title}</h4>
                <p className="text-sm text-[#0f0f0f]/55 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── TEAM CTA ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">

            <div className="max-w-xl">
              <p className="text-[#B5F03C] text-xs font-bold uppercase tracking-widest mb-4">
                Équipe en pleine croissance
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 text-white leading-tight">
                {t.about.teamTitle}
              </h2>
              <p className="text-white/50 leading-relaxed text-base max-w-lg">
                {t.about.teamDesc}
              </p>
            </div>

            <div className="flex flex-col gap-4 flex-shrink-0 w-full lg:w-auto">
              <Link href="/careers">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-bold text-sm shadow-lg hover:bg-[#c8ff55] transition-colors"
                >
                  {t.about.teamBtn} <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  Nous contacter <ChevronRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
