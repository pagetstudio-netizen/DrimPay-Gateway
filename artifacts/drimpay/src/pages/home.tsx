import { Link } from "wouter";
import { useState, type ReactNode } from "react";
import { ArrowRight, CreditCard, LayoutGrid } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import iconMobileMoney from "@assets/10149443_1778509419659.png";
import iconPaymentLink from "@assets/6360759_(1)_1778509419794.png";
import iconMassPayout from "@assets/atm_1778509419824.png";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  ANIMATION VARIANTS                                                         */
/* ══════════════════════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const staggerFast = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const slideLeft = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const slideRight = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const scaleUp = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

const viewportConfig = { once: true, margin: "-80px" };

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DASHED GRID HERO BACKGROUND                                               */
/* ══════════════════════════════════════════════════════════════════════════ */
const GRID_SVG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='60' y1='0' x2='0' y2='0' stroke='%23000' stroke-width='0.6' stroke-dasharray='3 5' stroke-opacity='0.10'/%3E%3Cline x1='0' y1='0' x2='0' y2='60' stroke='%23000' stroke-width='0.6' stroke-dasharray='3 5' stroke-opacity='0.10'/%3E%3C/svg%3E")`;

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DESKTOP APP MOCKUP                                                         */
/* ══════════════════════════════════════════════════════════════════════════ */
function DesktopMockup() {
  return (
    <motion.div
      variants={scaleUp}
      className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
    >
      <img
        src="/dashboard-hero.jpg"
        alt="DrimPay Dashboard"
        className="w-full block"
      />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  TICKER                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */
const TICKER_ITEMS = [
  "Développez vos Revenus.", "Fidélisez vos Clients.", "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.", "Connectez l'Afrique.",
  "Développez vos Revenus.", "Fidélisez vos Clients.", "Accélérez votre Croissance.",
  "Digitalisez vos Paiements.", "Connectez l'Afrique.",
];

function Ticker() {
  return (
    <div className="overflow-hidden py-5 border-t border-b border-[#E5E3DC] bg-[#F5F0E8]">
      <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 30s linear infinite", width: "max-content" }}>
        {TICKER_ITEMS.map((item, i) => (
          <span key={i} className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0f0f0f] shrink-0">
            {item}
            <span className="inline-block mx-5 w-2.5 h-2.5 rounded-full bg-[#B5F03C] align-middle" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PRODUCTS TAB                                                              */
/* ══════════════════════════════════════════════════════════════════════════ */
type Product = {
  label: string; title: string; desc: string; bg: string; dark: boolean;
  imgIcon?: string; lucideIcon?: ReactNode;
};

const PRODUCTS: Product[] = [
  { label: "Mobile Money →", title: "Collecte Mobile Money", desc: "Acceptez des paiements depuis Orange Money, Wave, MTN, Airtel Money et bien plus. Une seule intégration, tous les opérateurs.", bg: "bg-[#FF6B35]", dark: false, imgIcon: iconMobileMoney },
  { label: "Cartes Virtuelles →", title: "Cartes Virtuelles Instantanées", desc: "Émettez des cartes virtuelles Visa/Mastercard liées à vos wallets DrimPay pour les achats en ligne et business.", bg: "bg-[#5B5EF5]", dark: false, lucideIcon: <CreditCard className="w-6 h-6 text-white" /> },
  { label: "Paiement par lien →", title: "Liens de Paiement", desc: "Créez des liens de paiement en quelques secondes. Partagez par WhatsApp, SMS ou email. Aucun site web requis.", bg: "bg-[#B5F03C]", dark: true, imgIcon: iconPaymentLink },
  { label: "Mass Payout →", title: "Décaissements Massifs", desc: "Envoyez des paiements en masse à des centaines de destinataires simultanément. Parfait pour les paies et remboursements.", bg: "bg-[#0d0c18]", dark: false, imgIcon: iconMassPayout },
  { label: "Voir Tout →", title: "Toute la Plateforme", desc: "Découvrez l'ensemble des produits DrimPay : wallets, KYB automatisé, webhooks temps réel, et tableau de bord no-code.", bg: "bg-[#1a6b4a]", dark: false, lucideIcon: <LayoutGrid className="w-6 h-6 text-white" /> },
];

function ProductsSection() {
  const [active, setActive] = useState(0);
  const p = PRODUCTS[active];
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-[#F5F0E8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#0f0f0f] mb-8 sm:mb-14 leading-tight tracking-tight"
        >
          Produits Prêts à l'Emploi
        </motion.h2>
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 items-start">
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="space-y-1"
          >
            {PRODUCTS.map((prod, i) => (
              <motion.button
                key={i}
                variants={fadeUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setActive(i)}
                className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all ${
                  active === i ? "bg-[#0f0f0f] text-white shadow-lg" : "text-[#0f0f0f] hover:bg-white/60"
                }`}
              >
                {prod.label}
              </motion.button>
            ))}
          </motion.div>
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-3xl ${p.bg} p-8 min-h-[280px] flex flex-col justify-between shadow-xl`}
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 overflow-hidden">
                {p.imgIcon ? (
                  <img src={p.imgIcon} alt={p.title} className="w-10 h-10 object-contain" />
                ) : (
                  p.lucideIcon
                )}
              </div>
              <h3 className={`text-2xl md:text-3xl font-extrabold mb-4 ${p.dark ? "text-[#0f0f0f]" : "text-white"}`}>{p.title}</h3>
              <p className={`text-base leading-relaxed ${p.dark ? "text-[#0f0f0f]/70" : "text-white/70"}`}>{p.desc}</p>
            </div>
            <div className="mt-8">
              <Link href="/signup">
                <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  p.dark ? "bg-[#0f0f0f] text-white hover:bg-[#0f0f0f]/80" : "bg-white text-[#0f0f0f] hover:bg-white/90"
                }`}>
                  Commencer <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                 */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans">

      {/* Global CSS */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#F8F6F1] pt-24 pb-14 sm:pt-32 md:pt-[140px] md:pb-20"
        style={{
          backgroundImage: GRID_SVG,
          backgroundSize: "60px 60px",
        }}
      >
        {/* Radial glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(181,240,60,0.18) 0%, transparent 70%)",
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 relative text-center"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E3DC] shadow-sm mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#B5F03C] animate-pulse" />
            <span className="text-xs font-semibold text-[#3a7a00]">API v2.0 maintenant disponible</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-[#0f0f0f] leading-[1.02] tracking-tight mb-6 max-w-4xl mx-auto"
          >
            La Plateforme de Paiement{" "}
            <span className="relative inline-block">
              Moderne
              <motion.span
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 w-full h-2 rounded-full opacity-60"
                style={{ background: "linear-gradient(90deg, #B5F03C, #5AEADC)" }}
              />
            </span>
            {" "}pour l'Afrique
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-[#0f0f0f]/55 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Lancez et faites évoluer vos produits financiers sur une seule plateforme : mobile money, cartes virtuelles, paiements instantanés et ledger en temps réel. Commencez là où vous voulez, grandissez sans limites.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm shadow-lg"
              >
                Explorer la Plateforme
              </motion.button>
            </Link>
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white border border-[#E0DDD6] text-[#0f0f0f] font-semibold text-sm hover:shadow-md transition-all"
              >
                Parler à un Expert
              </motion.button>
            </Link>
          </motion.div>

          {/* Learn more */}
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/how-it-works">
              <button className="text-sm text-[#0f0f0f]/45 hover:text-[#0f0f0f]/70 transition-colors flex items-center gap-1 mx-auto mb-14">
                En savoir plus
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </Link>
          </motion.div>

          {/* Desktop mockup */}
          <motion.div
            variants={scaleUp}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <DesktopMockup />
          </motion.div>
        </motion.div>
      </section>


      {/* ── TICKER ─────────────────────────────────────────────────── */}
      <Ticker />


      {/* ── BETTER WAY ────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <motion.div
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-6">
                Une meilleure façon de lancer un produit de paiement
              </h2>
              <Link href="/how-it-works">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm shadow-md"
                >
                  En savoir plus <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
            <motion.div
              variants={slideRight}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-base text-[#0f0f0f]/55 leading-relaxed mb-8">
                DrimPay regroupe les intégrations aux opérateurs mobiles, la conformité et votre expérience client en un seul endroit. De la mise en service à la croissance, DrimPay vous permet de vous concentrer sur la construction de produits remarquables.
              </p>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-[#e5e3dc]">
                <img
                  src="/dashboard-preview.jpg"
                  alt="DrimPay Dashboard"
                  className="w-full block"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── THREE FEATURE CARDS ──────────────────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-24 bg-[#F8F6F1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#0f0f0f] mb-4 leading-tight tracking-tight"
          >
            Tout ce qu'il vous faut
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-base text-[#0f0f0f]/50 mb-14 max-w-xl leading-relaxed"
          >
            Collectez, décaissez et partagez des paiements Mobile Money avec une seule infrastructure API.
          </motion.p>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6"
          >
            {/* Card 1 — Pay-in */}
            <motion.div
              variants={scaleUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-[#FF6B35] p-8 flex flex-col justify-between min-h-[320px] shadow-lg group hover:scale-[1.02] transition-transform"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 overflow-hidden">
                  <img src={iconMobileMoney} alt="Mobile Money" className="w-9 h-9 object-contain" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-3 leading-snug">Collecte Mobile Money</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Acceptez des paiements depuis Orange Money, Wave, MTN, Moov et plus encore. Une seule intégration, tous les opérateurs.
                </p>
              </div>
              <Link href="/docs/payin">
                <button className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0f0f0f] font-semibold text-sm hover:bg-white/90 transition-all">
                  API Pay-in <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Card 2 — Pay-out */}
            <motion.div
              variants={scaleUp}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-[#0d0c18] p-8 flex flex-col justify-between min-h-[320px] shadow-lg group hover:scale-[1.02] transition-transform"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 overflow-hidden">
                  <img src={iconMassPayout} alt="Mass Payout" className="w-9 h-9 object-contain" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-3 leading-snug">Décaissements Instantanés</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Envoyez des paiements à des centaines de bénéficiaires simultanément. Parfait pour les paies, commissions et remboursements.
                </p>
              </div>
              <Link href="/docs/payout">
                <button className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-all">
                  API Pay-out <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Card 3 — Payment Links */}
            <motion.div
              variants={scaleUp}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-[#B5F03C] p-8 flex flex-col justify-between min-h-[320px] shadow-lg group hover:scale-[1.02] transition-transform"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#0f0f0f]/10 flex items-center justify-center mb-6 overflow-hidden">
                  <img src={iconPaymentLink} alt="Lien de paiement" className="w-9 h-9 object-contain" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3 leading-snug">Liens de Paiement</h3>
                <p className="text-[#0f0f0f]/65 text-sm leading-relaxed">
                  Créez un lien de paiement en quelques secondes. Partagez par WhatsApp, SMS ou email. Aucun site web requis.
                </p>
              </div>
              <Link href="/signup">
                <button className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm hover:bg-[#0f0f0f]/85 transition-all">
                  Créer un lien <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── MAKE IT YOUR OWN ─────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-[#0f0f0f] leading-tight tracking-tight mb-4"
          >
            Faites-en le Vôtre
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-base md:text-lg text-[#0f0f0f]/55 max-w-xl mx-auto mb-14 leading-relaxed"
          >
            Mettez votre marque entre les mains de vos clients. DrimPay vous permet de gérer chaque expérience de paiement — votre marque, vos couleurs, votre identité.
          </motion.p>

          {/* Card stack */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="relative flex items-center justify-center h-44 sm:h-48 mb-8 overflow-hidden"
          >
            {[
              { bg: "bg-[#5B5EF5]", label: "Business Premium", style: { transform: "rotate(-8deg) translateX(-60px) translateY(8px)", position: "absolute" as const } },
              { bg: "bg-[#1a6b4a]", label: "Carte Enterprise",  style: { transform: "rotate(7deg) translateX(60px) translateY(8px)", position: "absolute" as const } },
              { bg: "bg-[#B5F03C]", label: "Carte Standard",    style: { transform: "translateY(-8px)", position: "relative" as const, zIndex: 10 } },
            ].map((c, i) => (
              <motion.div
                key={i}
                variants={scaleUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`w-40 h-24 sm:w-48 sm:h-28 rounded-2xl ${c.bg} p-3 sm:p-4 flex flex-col justify-between shadow-xl`}
                style={c.style}
              >
                <div className="flex justify-between items-start">
                  <div className="w-5 h-3.5 sm:w-6 sm:h-4 rounded bg-white/30" />
                  <span className="text-white/70 text-[8px] sm:text-[9px] font-bold tracking-widest">DRIMPAY</span>
                </div>
                <div>
                  <p className="text-white text-[9px] sm:text-[10px] font-mono tracking-widest opacity-60">•••• 4242</p>
                  <p className="text-white text-[8px] sm:text-[9px] mt-0.5 opacity-50">{c.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-[#F5F0E8] border border-[#e5e3dc] rounded-full px-4 py-2 mb-8">
              <span className="text-lg">✋</span>
              <span className="text-xs font-semibold text-[#0f0f0f]/60">Marque blanche disponible</span>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm shadow-md"
              >
                Personnaliser votre expérience <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
      <ProductsSection />

      {/* ── TWO CTA CARDS ────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-24 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Card 1 */}
            <motion.div
              variants={slideLeft}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
              style={{ background: "#F8F6F1" }}
            >
              <div className="relative flex items-center justify-center overflow-hidden px-4 pt-6 pb-2" style={{ minHeight: "280px", background: "#F8F6F1" }}>
                <img
                  src="/operators-hub.png"
                  alt="DrimPay Opérateurs"
                  className="w-full object-contain"
                  style={{ maxWidth: "380px", maxHeight: "270px" }}
                />
              </div>
              <div className="p-8 flex flex-col flex-1" style={{ background: "#F8F6F1" }}>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#B5F03C]/30 text-[#3a7a00] text-xs font-semibold mb-4 w-fit">
                  Réseau d'opérateurs
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3">Connecté à tous les opérateurs</h3>
                <p className="text-sm text-[#0f0f0f]/60 leading-relaxed mb-6 flex-1">
                  Wave, Orange Money, MTN MoMo, Moov Money, Wizall, TMoney, Vodacom et Airtel — une seule intégration pour les atteindre tous.
                </p>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm"
                  >
                    Commencer maintenant <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              variants={slideRight}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
              style={{ background: "#F0EDE6" }}
            >
              <div className="relative flex items-center justify-center overflow-hidden px-6 pt-8" style={{ minHeight: "260px", background: "#F0EDE6" }}>
                <img
                  src="/drimpay-network.png"
                  alt="DrimPay Services"
                  className="w-full object-contain"
                  style={{ maxWidth: "340px", maxHeight: "240px" }}
                />
              </div>
              <div className="p-8 flex flex-col flex-1" style={{ background: "#F0EDE6" }}>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#B5F03C]/30 text-[#3a7a00] text-xs font-semibold mb-4 w-fit">
                  Tous les produits
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3">Une plateforme, toutes vos solutions</h3>
                <p className="text-sm text-[#0f0f0f]/60 leading-relaxed mb-6 flex-1">
                  API de Paiement, Mass Payments, Payment Link et Cartes Virtuelles — tout connecté sur une seule infrastructure fiable.
                </p>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white font-semibold text-sm"
                  >
                    Démarrer gratuitement <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── COMPLIANCE CARD ──────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-sm mx-auto md:mx-0"
          >
            <div className="rounded-3xl overflow-hidden" style={{ background: "#EDE9E1" }}>
              {/* Concentric circles + icon */}
              <div className="relative flex items-center justify-center pt-8 pb-4 overflow-hidden" style={{ minHeight: 220 }}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[220, 175, 130, 88].map((size, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.6 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={viewportConfig}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute rounded-full border border-[#0f0f0f]/10"
                      style={{ width: size, height: size }}
                    />
                  ))}
                </div>
                <motion.img
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportConfig}
                  transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  src="/security-badge.png"
                  alt="Sécurité"
                  className="relative z-10 object-contain"
                  style={{ width: 160, height: 160, mixBlendMode: "multiply" }}
                />
              </div>
              <div className="px-7 pb-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0f0f0f]/8 text-[#0f0f0f]/70 text-xs font-semibold mb-4">
                  Conformité / KYB
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f0f0f] mb-3 leading-tight">
                  Simplifiez votre conformité réglementaire
                </h3>
                <p className="text-sm text-[#0f0f0f]/55 leading-relaxed mb-6">
                  Respectez les exigences KYB avec des contrôles intégrés, des alertes automatisées et une mise en place simplifiée — sans friction pour vos équipes.
                </p>
                <Link href="/security">
                  <button className="text-sm font-bold text-[#0f0f0f] hover:opacity-60 transition-opacity">
                    En savoir plus
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TICKER (bottom) ───────────────────────────────────────────── */}
      <Ticker />

      {/* ── DARK CTA ──────────────────────────────────────────────────── */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        transition={{ duration: 0.7 }}
        className="py-16 sm:py-20 md:py-24 bg-[#0f0f0f]"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#B5F03C] text-sm font-semibold uppercase tracking-widest mb-4"
            >
              Commencez aujourd'hui
            </motion.p>
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6"
            >
              Prêt à transformer vos paiements ?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg text-white/50 max-w-xl mx-auto mb-10"
            >
              Rejoignez des centaines d'entreprises qui font confiance à DrimPay pour leurs paiements en Afrique.
            </motion.p>
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.04, backgroundColor: "#c8ff55" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-bold text-sm shadow-lg"
                  style={{ transition: "background-color 0.2s" }}
                >
                  Créer un compte gratuit <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  Contacter les ventes
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
