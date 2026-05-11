import { useEffect, useState } from "react";
import { ExternalLink, Clock, Zap, Mail, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { FaWhatsapp, FaYoutube, FaFacebook, FaTelegramPlane } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { motion } from "framer-motion";
import { DashboardLayout } from "./layout";
import supportImg from "@assets/contact-us.1e0b8969a82ca2f9bd2d0b6df0fc7b96_1778539656598.webp";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SocialLink = {
  id: number;
  name: string;
  platform: string;
  url: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
};

/* ── Platform definitions ────────────────────────────────────────────────── */
type PlatformDef = {
  key: string;
  label: string;
  sublabel: string;
  action: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  iconBg: string;
  topBar: string;
  borderColor: string;
  bgCard: string;
};

const PLATFORMS: PlatformDef[] = [
  {
    key: "whatsapp_support",
    label: "Support WhatsApp",
    sublabel: "Assistance technique 24h/7j",
    action: "Contacter le support",
    Icon: FaWhatsapp,
    iconColor: "#25D366",
    iconBg: "rgba(37,211,102,0.12)",
    topBar: "bg-emerald-500",
    borderColor: "border-emerald-500/25",
    bgCard: "bg-emerald-500/5",
  },
  {
    key: "whatsapp_channel",
    label: "Chaîne WhatsApp",
    sublabel: "Actualités & annonces officielles",
    action: "Rejoindre la chaîne",
    Icon: FaWhatsapp,
    iconColor: "#25D366",
    iconBg: "rgba(37,211,102,0.12)",
    topBar: "bg-emerald-400",
    borderColor: "border-emerald-400/25",
    bgCard: "bg-emerald-400/5",
  },
  {
    key: "youtube",
    label: "YouTube",
    sublabel: "Tutoriels & démonstrations",
    action: "S'abonner",
    Icon: FaYoutube,
    iconColor: "#FF0000",
    iconBg: "rgba(255,0,0,0.10)",
    topBar: "bg-red-500",
    borderColor: "border-red-500/25",
    bgCard: "bg-red-500/5",
  },
  {
    key: "facebook",
    label: "Facebook",
    sublabel: "Communauté & mises à jour",
    action: "Suivre la page",
    Icon: FaFacebook,
    iconColor: "#1877F2",
    iconBg: "rgba(24,119,242,0.10)",
    topBar: "bg-blue-500",
    borderColor: "border-blue-500/25",
    bgCard: "bg-blue-500/5",
  },
  {
    key: "telegram",
    label: "Telegram",
    sublabel: "Groupe & canal Telegram",
    action: "Rejoindre",
    Icon: FaTelegramPlane,
    iconColor: "#26A5E4",
    iconBg: "rgba(38,165,228,0.10)",
    topBar: "bg-sky-500",
    borderColor: "border-sky-500/25",
    bgCard: "bg-sky-500/5",
  },
  {
    key: "twitter",
    label: "Twitter / X",
    sublabel: "Suivre nos actualités",
    action: "Suivre",
    Icon: FaXTwitter,
    iconColor: "#e7e7e7",
    iconBg: "rgba(255,255,255,0.07)",
    topBar: "bg-slate-400",
    borderColor: "border-slate-500/25",
    bgCard: "bg-slate-500/5",
  },
];

/* ── Social card ─────────────────────────────────────────────────────────── */
function SocialCard({
  platform, link, index,
}: {
  platform: PlatformDef;
  link?: SocialLink;
  index: number;
}) {
  const { Icon, iconColor, iconBg, topBar, borderColor, bgCard, label, sublabel, action } = platform;
  const configured = !!link;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.06, duration: 0.38, ease: "easeOut" }}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-200 ${bgCard} ${borderColor} ${
        configured ? "hover:shadow-lg hover:scale-[1.015] cursor-pointer" : "opacity-60"
      }`}
    >
      {/* Color top bar */}
      <div className={`h-1 w-full ${topBar}`} />

      <div className="p-5 flex flex-col gap-4">
        {/* Icon + title */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: iconBg }}
          >
            <Icon className="w-6 h-6" style={{ color: iconColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-tight text-foreground leading-tight">
              {link?.name ?? label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {link?.description ?? sublabel}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border/60" />

        {/* CTA */}
        <div className="flex items-center justify-between">
          {configured ? (
            <>
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: iconColor }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Disponible
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground bg-background/70 border border-border px-3 py-1.5 rounded-lg">
                {action}
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground italic">Bientôt disponible</span>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (configured && link) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function DashboardSupport() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/support/links`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setLinks(Array.isArray(d) ? d : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, []);

  /* Map platform key → link */
  const linkMap = Object.fromEntries(links.map(l => [l.platform, l]));

  /* Featured WhatsApp support (separate, big card) */
  const wsLink = linkMap["whatsapp_support"];

  /* Community platforms (all except whatsapp_support) */
  const communityPlatforms = PLATFORMS.filter(p => p.key !== "whatsapp_support");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <img src={supportImg} alt="Support" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Support & Communauté
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Contactez notre équipe ou rejoignez la communauté DrimPay
            </p>
          </div>
        </motion.div>

        {/* ── WhatsApp Support — carte principale ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
        >
          {loading ? (
            <div className="h-[108px] rounded-2xl bg-muted/20 animate-pulse" />
          ) : wsLink ? (
            <a
              href={wsLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="relative rounded-2xl border border-emerald-500/25 bg-emerald-500/8 hover:bg-emerald-500/12 hover:border-emerald-500/40 hover:shadow-lg transition-all duration-200 overflow-hidden">
                <div className="h-1 w-full bg-emerald-500" />
                <div className="p-6 flex items-center gap-5">
                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(37,211,102,0.15)" }}
                  >
                    <FaWhatsapp className="w-8 h-8" style={{ color: "#25D366" }} />
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base font-bold tracking-tight text-foreground">
                        {wsLink.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        En ligne
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {wsLink.description ?? "Notre équipe répond en moins de 2h. Idéal pour l'intégration, incidents de paiement ou toute urgence."}
                    </p>
                    <div className="mt-3 flex items-center gap-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <Zap className="w-3.5 h-3.5" />
                        Réponse rapide
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        Disponible 24h/7j
                      </span>
                    </div>
                  </div>
                  {/* CTA button */}
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold group-hover:bg-emerald-400 transition-colors whitespace-nowrap">
                      Contacter
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ) : (
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              <div className="h-1 w-full bg-emerald-500/30" />
              <div className="p-6 flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 opacity-50"
                  style={{ background: "rgba(37,211,102,0.10)" }}
                >
                  <FaWhatsapp className="w-8 h-8" style={{ color: "#25D366" }} />
                </div>
                <div>
                  <p className="text-base font-bold tracking-tight text-foreground mb-1">Support WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Lien de support non configuré. Contactez-nous à{" "}
                    <a
                      href="mailto:support@drimpay.africa"
                      className="text-primary underline underline-offset-2"
                    >
                      support@drimpay.africa
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Communauté ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Rejoindre la communauté
          </h2>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-[148px] rounded-2xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityPlatforms.map((platform, i) => (
                <SocialCard
                  key={platform.key}
                  platform={platform}
                  link={linkMap[platform.key]}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Info cards ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              Icon: Clock,
              color: "text-amber-400",
              bg: "bg-amber-400/10",
              title: "Délai de réponse",
              desc: "Moins de 2 heures en moyenne sur WhatsApp pour toute demande urgente.",
            },
            {
              Icon: Mail,
              color: "text-primary",
              bg: "bg-primary/10",
              title: "Email support",
              desc: "support@drimpay.africa — pour les demandes non urgentes et les rapports détaillés.",
            },
            {
              Icon: Zap,
              color: "text-sky-400",
              bg: "bg-sky-400/10",
              title: "Statut plateforme",
              desc: "Consultez le statut en temps réel sur status.drimpay.africa.",
            },
          ].map((item, i) => {
            const Icon = item.Icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-card border border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${item.bg}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className="text-sm font-semibold tracking-tight text-foreground mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
