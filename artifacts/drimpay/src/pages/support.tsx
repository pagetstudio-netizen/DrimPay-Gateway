import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  CreditCard, ShieldCheck, Code2, QrCode, Percent, Lock,
  ChevronDown, ChevronRight, Clock, Mail, X,
  Headphones, MessageCircle, CheckCircle, ArrowRight,
} from "lucide-react";
import { FaWhatsapp, FaFacebook, FaLinkedin, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SocialLink = {
  id: number;
  name: string;
  platform: string;
  url: string;
  description: string | null;
  active: boolean;
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const viewport = { once: true, margin: "-60px" };

// ── Help categories ─────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    icon: CreditCard,
    bg: "bg-[#0f0f0f]/8",
    iconColor: "text-[#0f0f0f]",
    title: "Paiements & Transactions",
    desc: "Questions sur les paiements, retraits, statuts et remboursements.",
    key: "payments",
  },
  {
    icon: ShieldCheck,
    bg: "bg-[#B5F03C]/20",
    iconColor: "text-[#3a7a00]",
    title: "Comptes & Vérification",
    desc: "Aide sur l'inscription, la vérification KYB/KYC et la gestion de compte.",
    key: "accounts",
  },
  {
    icon: Code2,
    bg: "bg-[#0f0f0f]/8",
    iconColor: "text-[#0f0f0f]",
    title: "API & Intégration",
    desc: "Documentation, clés API, webhooks et intégration technique.",
    key: "api",
  },
  {
    icon: QrCode,
    bg: "bg-[#B5F03C]/20",
    iconColor: "text-[#3a7a00]",
    title: "Pay with QR",
    desc: "Tout savoir sur la génération de QR codes et les paiements.",
    key: "qr",
  },
  {
    icon: Percent,
    bg: "bg-[#0f0f0f]/8",
    iconColor: "text-[#0f0f0f]",
    title: "Frais & Tarification",
    desc: "Comprendre nos frais, tarifs et limitations de transactions.",
    key: "fees",
  },
  {
    icon: Lock,
    bg: "bg-[#B5F03C]/20",
    iconColor: "text-[#3a7a00]",
    title: "Sécurité",
    desc: "Conseils de sécurité, bonnes pratiques et protection de votre compte.",
    key: "security",
  },
];

// ── FAQ items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    category: "payments",
    q: "Quels sont les moyens de paiement acceptés par DrimPay ?",
    a: "DrimPay prend en charge MTN Mobile Money, Orange Money, Moov Money, Wave, TMoney et d'autres opérateurs dans 9 pays d'Afrique de l'Ouest et Centrale : Togo, Bénin, Cameroun, Burkina Faso, Mali, Sénégal, Côte d'Ivoire, Ghana et Nigeria.",
  },
  {
    category: "payments",
    q: "Combien de temps prend un paiement ?",
    a: "La grande majorité des paiements Mobile Money sont traités en moins de 60 secondes. En mode sandbox (test), les transactions sont validées instantanément. En mode live, le délai dépend de l'opérateur.",
  },
  {
    category: "payments",
    q: "Que faire si un paiement est en statut « pending » depuis longtemps ?",
    a: "Si un paiement reste en attente plus de 5 minutes, contactez notre support WhatsApp avec la référence de la transaction. Notre équipe vérifiera le statut auprès de l'opérateur et vous donnera une réponse rapide.",
  },
  {
    category: "accounts",
    q: "Comment puis-je créer un compte DrimPay ?",
    a: "Rendez-vous sur drimpay.africa, cliquez sur « Créer un compte », remplissez le formulaire avec vos informations professionnelles, puis soumettez votre dossier KYB. L'approbation se fait généralement en 24-48 heures ouvrées.",
  },
  {
    category: "accounts",
    q: "Quels documents sont nécessaires pour la vérification KYB ?",
    a: "Pour la vérification KYB (Know Your Business), vous aurez besoin de votre RCCM ou équivalent, les statuts de l'entreprise, le numéro d'enregistrement, le type d'activité, le pays d'incorporation et l'adresse du siège social.",
  },
  {
    category: "accounts",
    q: "Puis-je utiliser DrimPay en mode sandbox sans KYB approuvé ?",
    a: "Oui. Le mode sandbox est accessible immédiatement après la création de votre compte, sans attendre l'approbation KYB. Vous pouvez tester l'intégration API, les pay-ins et pay-outs en simulation. Le mode live nécessite un KYB approuvé.",
  },
  {
    category: "api",
    q: "Comment intégrer l'API DrimPay à mon application ?",
    a: "Consultez notre documentation API disponible dans votre tableau de bord. Générez une clé API, choisissez votre endpoint (Pay-in ou Pay-out), et testez d'abord en sandbox. Nous fournissons des exemples de code en plusieurs langages.",
  },
  {
    category: "api",
    q: "Comment fonctionnent les webhooks DrimPay ?",
    a: "Configurez une URL de callback dans vos paramètres API. DrimPay envoie une requête POST vers cette URL à chaque changement de statut de transaction (pending → success ou failed). Vérifiez la signature HMAC-SHA256 pour sécuriser la réception.",
  },
  {
    category: "api",
    q: "Quelle est la différence entre une clé sandbox et une clé live ?",
    a: "Les clés sandbox (préfixe dp_test_) permettent de tester sans traitement réel. Les clés live (dp_live_) déclenchent de vrais paiements Mobile Money. Ne partagez jamais vos clés live. Régénérez-les en cas de compromission.",
  },
  {
    category: "qr",
    q: "Comment créer un QR code de paiement ?",
    a: "Dans votre tableau de bord, allez dans la section « Pay with QR », cliquez sur « Générer un QR », choisissez le type (montant fixe ou flexible), le pays par défaut et la devise. Téléchargez le QR en SVG, imprimez-le et affichez-le en boutique.",
  },
  {
    category: "qr",
    q: "Mon client a besoin d'une application pour scanner le QR ?",
    a: "Non. Votre client scan le QR code avec l'appareil photo de son téléphone, ce qui ouvre la page de paiement DrimPay directement dans son navigateur. Il choisit l'opérateur, entre son numéro et confirme. Aucune application à télécharger.",
  },
  {
    category: "qr",
    q: "Puis-je définir un montant fixe sur mon QR code ?",
    a: "Oui. Lors de la création du QR, choisissez le type « Montant fixe » et entrez le montant. Le client ne pourra pas modifier le montant lors du paiement. Idéal pour les menus du jour, les tickets d'entrée ou les services à prix fixe.",
  },
  {
    category: "fees",
    q: "Quels sont les frais de transaction DrimPay ?",
    a: "DrimPay applique des frais transparents de 3% sur chaque transaction (pay-in et pay-out). Aucun frais cachés, aucun frais d'installation. Les frais sont déduits automatiquement du montant net crédité sur votre wallet.",
  },
  {
    category: "fees",
    q: "Y a-t-il des frais d'abonnement ou d'inscription ?",
    a: "Non. L'inscription sur DrimPay est entièrement gratuite. Aucun abonnement mensuel. Vous ne payez que 3% par transaction réussie. Si la transaction échoue, aucun frais n'est prélevé.",
  },
  {
    category: "security",
    q: "Comment DrimPay protège-t-il mes données et transactions ?",
    a: "Toutes les communications sont chiffrées en TLS 1.3. Les clés API sont stockées sous forme hachée. Les webhooks sont signés avec HMAC-SHA256. Nous appliquons une authentification à deux facteurs et des audits de sécurité réguliers.",
  },
  {
    category: "security",
    q: "Que faire si je pense que mon compte est compromis ?",
    a: "Révoquez immédiatement vos clés API depuis votre tableau de bord, changez votre mot de passe, puis contactez notre support en urgence sur WhatsApp. Nous bloquerons l'accès suspect et vous guiderons pour sécuriser votre compte.",
  },
];

// ── Social networks ──────────────────────────────────────────────────────────

const SOCIAL_NETWORKS = [
  { key: "facebook",  label: "Facebook",    handle: "@DrimPay",   Icon: FaFacebook,  color: "#1877F2", bg: "#EBF3FF" },
  { key: "x",         label: "X (Twitter)", handle: "@DrimPay",   Icon: FaXTwitter,  color: "#000000", bg: "#F3F4F6" },
  { key: "linkedin",  label: "LinkedIn",    handle: "DrimPay",    Icon: FaLinkedin,  color: "#0A66C2", bg: "#E8F3FC" },
  { key: "instagram", label: "Instagram",   handle: "@DrimPay",   Icon: FaInstagram, color: "#E1306C", bg: "#FDE8F1" },
  { key: "youtube",   label: "YouTube",     handle: "DrimPay",    Icon: FaYoutube,   color: "#FF0000", bg: "#FFEBEB" },
];

// ── FAQ Accordion ───────────────────────────────────────────────────────────

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#E5E3DC] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left text-[#0f0f0f] font-medium text-sm hover:text-[#0f0f0f]/70 transition-colors gap-4"
      >
        <span>{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#0f0f0f]/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-[#0f0f0f]/60 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BASE}/api/support/links`)
      .then(r => r.json())
      .then(d => setLinks(Array.isArray(d) ? d : []))
      .catch(() => setLinks([]));
  }, []);

  const linkMap = Object.fromEntries(links.map(l => [l.platform, l]));
  const wsLink = linkMap["whatsapp_support"] ?? linkMap["whatsapp"];
  const wsUrl = wsLink?.url ?? "https://wa.me/22892123456";
  const emailLink = "mailto:support@drimpay.africa";

  const getSocialUrl = (key: string) => {
    const l = linkMap[key] ?? linkMap[`${key}_channel`] ?? linkMap[`${key}_page`];
    return l?.url ?? null;
  };

  const handleCategoryClick = (key: string) => {
    setActiveCategory(key);
    setOpenFaq(0);
    setTimeout(() => {
      faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const filteredFaq = activeCategory
    ? FAQ_ITEMS.filter(f => f.category === activeCategory)
    : FAQ_ITEMS;

  const activeCat = CATEGORIES.find(c => c.key === activeCategory);

  return (
    <div className="bg-white text-[#0f0f0f]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#F5F0E8] py-14 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E3DC] shadow-sm text-[#0f0f0f] text-xs font-semibold tracking-wide"
            >
              <span className="flex h-2 w-2 rounded-full bg-[#B5F03C] animate-pulse" />
              Support DrimPay
            </motion.span>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-5xl font-extrabold leading-tight text-[#0f0f0f]"
            >
              Nous sommes là<br />
              pour <span className="relative inline-block">vous aider<span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-[#B5F03C]" /></span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#0f0f0f]/60 text-base leading-relaxed max-w-md"
            >
              Notre équipe support est disponible pour vous accompagner à chaque étape. Choisissez le canal qui vous convient le mieux.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-3"
            >
              <a
                href={wsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-semibold text-sm hover:bg-green-500 transition-colors shadow-sm"
              >
                <FaWhatsapp className="w-5 h-5" />
                Discuter sur WhatsApp
              </a>
              <a
                href={emailLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#E5E3DC] bg-white text-[#0f0f0f] font-semibold text-sm hover:shadow-md transition-all"
              >
                <Mail className="w-4 h-4" />
                Envoyer un e-mail
              </a>
            </motion.div>

            <motion.div
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-1.5 text-xs text-[#0f0f0f]/50"
            >
              <Clock className="w-3.5 h-3.5 text-[#0f0f0f]/40" />
              <span>Temps de réponse moyen : moins de 15 minutes</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="flex justify-center md:justify-end"
          >
            <div className="relative">
              <div className="w-56 h-56 md:w-72 md:h-72 rounded-full bg-[#B5F03C]/20 flex items-center justify-center">
                <img
                  src="/support-headset.png"
                  alt="Support DrimPay"
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-xl"
                />
              </div>
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#B5F03C]/30"
              />
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.65, type: "spring", stiffness: 200 }}
                className="absolute top-8 -left-4 w-4 h-4 rounded-full bg-[#0f0f0f]/15"
              />
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                className="absolute -bottom-3 right-8 w-5 h-5 rounded-full bg-[#B5F03C]/40"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-[#0f0f0f]">Comment pouvons-nous vous aider ?</h2>
            <p className="text-[#0f0f0f]/50 mt-2 text-sm">Parcourez nos rubriques d'aide les plus populaires</p>
          </motion.div>

          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  variants={fadeUp}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => handleCategoryClick(cat.key)}
                  className={`group text-left p-5 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? "border-[#0f0f0f] bg-[#B5F03C]/10 shadow-md ring-2 ring-[#B5F03C]/40"
                      : "border-[#E5E3DC] bg-white hover:border-[#0f0f0f]/30 hover:shadow-md"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-[#0f0f0f] text-sm mb-1.5">{cat.title}</h3>
                  <p className="text-xs text-[#0f0f0f]/50 leading-relaxed mb-3">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f0f0f] group-hover:gap-2 transition-all">
                    Voir les articles <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ + Side card ───────────────────────────────────────────────── */}
      <section ref={faqRef} className="py-16 px-4 bg-[#F5F0E8] scroll-mt-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">

          {/* FAQ */}
          <div className="lg:col-span-2">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between mb-6 gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-xl font-bold text-[#0f0f0f] shrink-0">Questions fréquentes</h2>
                <AnimatePresence>
                  {activeCategory && activeCat && (
                    <motion.span
                      key={activeCategory}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#B5F03C]/30 text-[#3a7a00] text-xs font-semibold truncate max-w-[180px]"
                    >
                      {activeCat.title}
                      <button
                        onClick={() => { setActiveCategory(null); setOpenFaq(0); }}
                        className="ml-0.5 hover:text-[#0f0f0f] transition-colors shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <Link href="/blog">
                <span className="text-xs font-semibold text-[#0f0f0f] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer">
                  Voir le blog <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-[#E5E3DC] px-6 py-2 shadow-sm"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory ?? "all"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {filteredFaq.length === 0 ? (
                    <p className="py-6 text-sm text-[#0f0f0f]/40 text-center">Aucune question dans cette rubrique.</p>
                  ) : (
                    filteredFaq.map((item, i) => (
                      <FaqItem
                        key={`${activeCategory}-${i}`}
                        q={item.q}
                        a={item.a}
                        isOpen={openFaq === i}
                        onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                      />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {activeCategory && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mt-4 flex justify-center"
              >
                <button
                  onClick={() => { setActiveCategory(null); setOpenFaq(0); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f0f0f]/50 hover:text-[#0f0f0f] transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Voir toutes les questions
                </button>
              </motion.div>
            )}
          </div>

          {/* Besoin d'aide card */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="lg:col-span-1 flex flex-col gap-4"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-[#E5E3DC] p-6 shadow-sm flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#B5F03C]/20 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-[#3a7a00]" />
              </div>
              <div>
                <h3 className="font-bold text-[#0f0f0f] text-base mb-1">Besoin d'aide immédiatement ?</h3>
                <p className="text-sm text-[#0f0f0f]/50 leading-relaxed">
                  Discutez avec notre équipe support sur WhatsApp, nous sommes en ligne !
                </p>
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
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-[#E5E3DC] p-5 shadow-sm"
            >
              <h4 className="font-semibold text-[#0f0f0f] text-sm mb-3">Informations utiles</h4>
              <div className="space-y-2.5 text-xs text-[#0f0f0f]/60">
                {[
                  { icon: CheckCircle, color: "text-[#3a7a00]", text: "Support 24h/7j disponible" },
                  { icon: Clock, color: "text-[#0f0f0f]", text: "Réponse en moins de 15 min" },
                  { icon: MessageCircle, color: "text-[#0f0f0f]", text: "Chat WhatsApp & Email" },
                  { icon: Mail, color: "text-[#3a7a00]", text: "support@drimpay.africa" },
                ].map(({ icon: Icon, color, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#0f0f0f] rounded-2xl p-5 text-white"
            >
              <h4 className="font-bold text-sm mb-1.5">Ressources développeurs</h4>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">Documentations, exemples de code et guide d'intégration API.</p>
              <Link href="/docs">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B5F03C] hover:text-[#B5F03C]/80 transition-colors cursor-pointer">
                  Voir la doc API <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Social ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-[#0f0f0f]">Restons connectés</h2>
            <p className="text-[#0f0f0f]/50 mt-2 text-sm">Suivez-nous sur nos réseaux sociaux pour rester informé des nouveautés</p>
          </motion.div>

          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="flex flex-wrap justify-center gap-4 md:gap-6"
          >
            {SOCIAL_NETWORKS.map(({ key, label, handle, Icon, color, bg }) => {
              const url = getSocialUrl(key) ?? null;
              return (
                <motion.a
                  key={key}
                  variants={fadeUp}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  href={url ?? "#"}
                  target={url ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border border-[#E5E3DC] bg-white hover:border-[#0f0f0f]/20 hover:shadow-md transition-all duration-200 min-w-[120px] group ${!url ? "opacity-60 cursor-default pointer-events-none" : ""}`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#0f0f0f]">{label}</p>
                    <p className="text-xs text-[#0f0f0f]/40 mt-0.5">{handle}</p>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Contact bottom banner ────────────────────────────────────────── */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="py-12 px-4 bg-[#0f0f0f]"
      >
        <div className="max-w-3xl mx-auto text-center text-white space-y-4">
          <h2 className="text-2xl font-bold">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="text-white/60 text-sm">
            Notre équipe est disponible 24h/7j pour répondre à toutes vos questions.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <a
              href={wsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#B5F03C] text-[#0f0f0f] font-semibold text-sm hover:bg-[#B5F03C]/90 transition-colors"
            >
              <FaWhatsapp className="w-4 h-4" />
              Chat WhatsApp
            </a>
            <a
              href={emailLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Envoyer un email
            </a>
          </div>
        </div>
      </motion.section>

    </div>
  );
}
