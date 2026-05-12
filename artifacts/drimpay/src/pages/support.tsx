import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  CreditCard, ShieldCheck, Code2, QrCode, Percent, Lock,
  ChevronDown, ChevronRight, Clock, Mail, ExternalLink,
  Headphones, MessageCircle, CheckCircle,
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

// ── Help categories ─────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    icon: CreditCard,
    bg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Paiements & Transactions",
    desc: "Questions sur les paiements, retraits, statuts et remboursements.",
    href: "#payments",
  },
  {
    icon: ShieldCheck,
    bg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Comptes & Vérification",
    desc: "Aide sur l'inscription, la vérification KYB/KYC et la gestion de compte.",
    href: "#accounts",
  },
  {
    icon: Code2,
    bg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "API & Intégration",
    desc: "Documentation, clés API, webhooks et intégration technique.",
    href: "#api",
  },
  {
    icon: QrCode,
    bg: "bg-orange-100",
    iconColor: "text-orange-600",
    title: "Pay with QR",
    desc: "Tout savoir sur la génération de QR codes et les paiements.",
    href: "#qr",
  },
  {
    icon: Percent,
    bg: "bg-pink-100",
    iconColor: "text-pink-600",
    title: "Frais & Tarification",
    desc: "Comprendre nos frais, tarifs et limitations de transactions.",
    href: "#fees",
  },
  {
    icon: Lock,
    bg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Sécurité",
    desc: "Conseils de sécurité, bonnes pratiques et protection de votre compte.",
    href: "#security",
  },
];

// ── FAQ items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Quels sont les moyens de paiement acceptés par DrimPay ?",
    a: "DrimPay prend en charge MTN Mobile Money, Orange Money, Moov Money, Wave, TMoney et d'autres opérateurs dans 9 pays d'Afrique de l'Ouest et Centrale : Togo, Bénin, Cameroun, Burkina Faso, Mali, Sénégal, Côte d'Ivoire, Ghana et Nigeria.",
  },
  {
    q: "Comment puis-je créer un compte DrimPay ?",
    a: "Rendez-vous sur drimpay.africa, cliquez sur « Créer un compte », remplissez le formulaire avec vos informations professionnelles, puis soumettez votre dossier KYB. L'approbation se fait généralement en 24-48 heures ouvrées.",
  },
  {
    q: "Combien de temps prend un paiement ?",
    a: "La grande majorité des paiements Mobile Money sont traités en moins de 60 secondes. En mode sandbox (test), les transactions sont validées instantanément. En mode live, le délai dépend de l'opérateur.",
  },
  {
    q: "Comment intégrer l'API DrimPay à mon application ?",
    a: "Consultez notre documentation API disponible dans votre tableau de bord. Générez une clé API, choisissez votre endpoint (Pay-in ou Pay-out), et testez d'abord en sandbox. Nous fournissons des exemples de code en plusieurs langages.",
  },
  {
    q: "Quels sont les frais de transaction ?",
    a: "DrimPay applique des frais transparents de 3% sur chaque transaction (pay-in et pay-out). Aucun frais cachés, aucun frais d'installation. Les frais sont déduits automatiquement du montant net crédité sur votre wallet.",
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
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left text-gray-800 font-medium text-sm hover:text-blue-600 transition-colors gap-4"
      >
        <span>{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/support/links`)
      .then(r => r.json())
      .then(d => setLinks(Array.isArray(d) ? d : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, []);

  const linkMap = Object.fromEntries(links.map(l => [l.platform, l]));
  const wsLink = linkMap["whatsapp_support"] ?? linkMap["whatsapp"];
  const wsUrl = wsLink?.url ?? "https://wa.me/22892123456";
  const emailLink = "mailto:support@drimpay.africa";

  const getSocialUrl = (key: string) => {
    const l = linkMap[key] ?? linkMap[`${key}_channel`] ?? linkMap[`${key}_page`];
    return l?.url ?? null;
  };

  return (
    <div className="bg-white text-gray-900">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f8faff] to-white py-14 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-wide">
              Support DrimPay
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
              Nous sommes là<br />
              pour <span className="text-blue-600">vous aider</span>
            </h1>
            <p className="text-gray-500 text-base leading-relaxed max-w-md">
              Notre équipe support est disponible pour vous accompagner à chaque étape. Choisissez le canal qui vous convient le mieux.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={wsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-green-500 transition-colors shadow-sm"
              >
                <FaWhatsapp className="w-5 h-5" />
                Discuter sur WhatsApp
              </a>
              <a
                href={emailLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Envoyer un e-mail
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Temps de réponse moyen : moins de 15 minutes</span>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="relative">
              <div className="w-56 h-56 md:w-72 md:h-72 rounded-full bg-blue-100/60 flex items-center justify-center">
                <img
                  src="/support-headset.png"
                  alt="Support DrimPay"
                  className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-xl"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500/20" />
              <div className="absolute top-8 -left-4 w-4 h-4 rounded-full bg-indigo-400/30" />
              <div className="absolute -bottom-3 right-8 w-5 h-5 rounded-full bg-blue-300/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Comment pouvons-nous vous aider ?</h2>
            <p className="text-gray-500 mt-2 text-sm">Parcourez nos rubriques d'aide les plus populaires</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.a
                  key={cat.title}
                  href={cat.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="group block p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">{cat.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-2 transition-all">
                    Voir les articles <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ + Side card ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">

          {/* FAQ */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Questions fréquentes</h2>
              <a href="#faq" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                Voir toutes les FAQ <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-2 shadow-sm">
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem
                  key={i}
                  q={item.q}
                  a={item.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* Besoin d'aide card */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Besoin d'aide immédiatement ?</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Discutez avec notre équipe support sur WhatsApp, nous sommes en ligne !
                </p>
              </div>
              <a
                href={wsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-green-500 transition-colors"
              >
                <FaWhatsapp className="w-4 h-4" />
                Contacter sur WhatsApp
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Informations utiles</h4>
              <div className="space-y-2.5 text-xs text-gray-600">
                {[
                  { icon: CheckCircle, color: "text-green-500", text: "Support 24h/7j disponible" },
                  { icon: Clock, color: "text-blue-500", text: "Réponse en moins de 15 min" },
                  { icon: MessageCircle, color: "text-purple-500", text: "Chat WhatsApp & Email" },
                  { icon: Mail, color: "text-orange-500", text: "support@drimpay.africa" },
                ].map(({ icon: Icon, color, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Restons connectés</h2>
            <p className="text-gray-500 mt-2 text-sm">Suivez-nous sur nos réseaux sociaux pour rester informé des nouveautés</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {SOCIAL_NETWORKS.map(({ key, label, handle, Icon, color, bg }) => {
              const url = getSocialUrl(key) ?? `/social/${key}`;
              return (
                <a
                  key={key}
                  href={url}
                  target={url.startsWith("http") ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 min-w-[120px] group"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{handle}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Contact bottom banner ────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto text-center text-white space-y-4">
          <h2 className="text-2xl font-bold">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="text-blue-100 text-sm">
            Notre équipe est disponible 24h/7j pour répondre à toutes vos questions.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <a
              href={wsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              <FaWhatsapp className="w-4 h-4" />
              Chat WhatsApp
            </a>
            <a
              href={emailLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Envoyer un email
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
