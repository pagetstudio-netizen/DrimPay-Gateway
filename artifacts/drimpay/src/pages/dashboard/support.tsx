import { useEffect, useState } from "react";
import { ExternalLink, Clock, Zap, Mail, ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
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

/* ── Brand icon wrapper (react-icons compat) ────────────────────────────── */
type BrandIconProps = { className?: string; style?: React.CSSProperties };

/* ── Platform definitions ────────────────────────────────────────────────── */
type PlatformDef = {
  key: string;
  defaultName: string;
  defaultDesc: string;
  action: string;
  Icon: React.ComponentType<BrandIconProps>;
  iconColor: string;
  iconBg: string;
  topBarClass: string;
  borderClass: string;
  bgClass: string;
  hoverBorderClass: string;
  hoverBgClass: string;
};

const PLATFORMS: PlatformDef[] = [
  {
    key: "whatsapp_channel",
    defaultName: "Chaîne WhatsApp",
    defaultDesc: "Annonces officielles & nouveautés",
    action: "Rejoindre la chaîne",
    Icon: FaWhatsapp,
    iconColor: "#25D366",
    iconBg: "rgba(37,211,102,0.13)",
    topBarClass: "bg-emerald-400",
    borderClass: "border-emerald-500/20",
    bgClass: "bg-emerald-500/[0.04]",
    hoverBorderClass: "hover:border-emerald-500/40",
    hoverBgClass: "hover:bg-emerald-500/[0.08]",
  },
  {
    key: "youtube",
    defaultName: "YouTube DrimPay",
    defaultDesc: "Tutoriels & démonstrations",
    action: "S'abonner",
    Icon: FaYoutube,
    iconColor: "#FF0000",
    iconBg: "rgba(255,0,0,0.10)",
    topBarClass: "bg-red-500",
    borderClass: "border-red-500/20",
    bgClass: "bg-red-500/[0.04]",
    hoverBorderClass: "hover:border-red-500/40",
    hoverBgClass: "hover:bg-red-500/[0.08]",
  },
  {
    key: "facebook",
    defaultName: "Facebook DrimPay",
    defaultDesc: "Communauté & mises à jour",
    action: "Suivre la page",
    Icon: FaFacebook,
    iconColor: "#1877F2",
    iconBg: "rgba(24,119,242,0.10)",
    topBarClass: "bg-blue-500",
    borderClass: "border-blue-500/20",
    bgClass: "bg-blue-500/[0.04]",
    hoverBorderClass: "hover:border-blue-500/40",
    hoverBgClass: "hover:bg-blue-500/[0.08]",
  },
  {
    key: "telegram",
    defaultName: "Telegram DrimPay",
    defaultDesc: "Alertes & mises à jour techniques",
    action: "Rejoindre",
    Icon: FaTelegramPlane,
    iconColor: "#26A5E4",
    iconBg: "rgba(38,165,228,0.10)",
    topBarClass: "bg-sky-500",
    borderClass: "border-sky-500/20",
    bgClass: "bg-sky-500/[0.04]",
    hoverBorderClass: "hover:border-sky-500/40",
    hoverBgClass: "hover:bg-sky-500/[0.08]",
  },
  {
    key: "twitter",
    defaultName: "Twitter / X",
    defaultDesc: "Actualités & fil d'infos",
    action: "Suivre",
    Icon: FaXTwitter,
    iconColor: "#e2e8f0",
    iconBg: "rgba(226,232,240,0.07)",
    topBarClass: "bg-slate-400",
    borderClass: "border-slate-500/20",
    bgClass: "bg-slate-500/[0.04]",
    hoverBorderClass: "hover:border-slate-500/40",
    hoverBgClass: "hover:bg-slate-500/[0.08]",
  },
];

/* ── Community card ──────────────────────────────────────────────────────── */
function CommunityCard({
  platform,
  link,
  index,
}: {
  platform: PlatformDef;
  link?: SocialLink;
  index: number;
}) {
  const {
    Icon, iconColor, iconBg, topBarClass,
    borderClass, bgClass, hoverBorderClass, hoverBgClass,
    defaultName, defaultDesc, action,
  } = platform;

  const name = link?.name ?? defaultName;
  const desc = link?.description ?? defaultDesc;
  const configured = !!link;

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.38, ease: "easeOut" }}
      className={[
        "relative rounded-2xl border overflow-hidden transition-all duration-200",
        bgClass, borderClass,
        configured ? `${hoverBorderClass} ${hoverBgClass} hover:shadow-md cursor-pointer` : "opacity-55",
      ].join(" ")}
    >
      {/* Top accent bar */}
      <div className={`h-[3px] w-full ${topBarClass}`} />

      <div className="p-5">
        {/* Platform icon + name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg }}
          >
            <Icon className="w-[22px] h-[22px]" style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight text-foreground leading-snug truncate">
              {name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-1">
              {desc}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border/50 mb-4" />

        {/* Status + CTA */}
        <div className="flex items-center justify-between gap-2">
          {configured ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: iconColor }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disponible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5" />
              Non configuré
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 group-hover:text-primary transition-colors whitespace-nowrap shrink-0">
            {action}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );

  if (configured && link) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="group block">
        {card}
      </a>
    );
  }
  return card;
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-[156px] rounded-2xl bg-muted/20 animate-pulse" />
      ))}
    </>
  );
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

  const linkMap = Object.fromEntries(links.map(l => [l.platform, l]));
  const wsLink  = linkMap["whatsapp_support"];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <img src={supportImg} alt="Support" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Support Client
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Contactez notre équipe ou rejoignez la communauté DrimPay
            </p>
          </div>
        </motion.div>

        {/* ── Support client WhatsApp — carte principale ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease: "easeOut" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Support client
          </p>

          {loading ? (
            <div className="h-[120px] rounded-2xl bg-muted/20 animate-pulse" />
          ) : wsLink ? (
            <a href={wsLink.url} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="relative rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.09] hover:border-emerald-500/45 hover:shadow-lg transition-all duration-200 overflow-hidden">
                <div className="h-[3px] w-full bg-emerald-500" />
                <div className="p-6 flex items-center gap-5">
                  {/* WhatsApp icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(37,211,102,0.14)" }}
                  >
                    <FaWhatsapp className="w-8 h-8" style={{ color: "#25D366" }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[15px] font-bold tracking-tight text-foreground">
                        {wsLink.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        En ligne
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {wsLink.description}
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

                  {/* CTA */}
                  <div className="shrink-0 hidden sm:block">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold group-hover:bg-emerald-400 transition-colors whitespace-nowrap">
                      Support client
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Mobile CTA */}
                <div className="sm:hidden px-6 pb-5">
                  <span className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold">
                    Support client
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </a>
          ) : (
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              <div className="h-[3px] w-full bg-emerald-500/30" />
              <div className="p-6 flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 opacity-40"
                  style={{ background: "rgba(37,211,102,0.10)" }}
                >
                  <FaWhatsapp className="w-7 h-7" style={{ color: "#25D366" }} />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-foreground mb-1">Support WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Contactez-nous à{" "}
                    <a href="mailto:support@drimpay.com" className="text-primary underline underline-offset-2">
                      support@drimpay.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Communauté ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12, ease: "easeOut" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Rejoindre la communauté
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <CardSkeleton count={5} />
            ) : (
              PLATFORMS.map((platform, i) => (
                <CommunityCard
                  key={platform.key}
                  platform={platform}
                  link={linkMap[platform.key]}
                  index={i}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* ── Infos utiles ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.5, ease: "easeOut" }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              Icon: Clock,
              colorClass: "text-amber-400",
              bgClass: "bg-amber-400/10",
              title: "Délai de réponse",
              desc: "Moins de 2 heures en moyenne sur WhatsApp pour toute demande urgente.",
            },
            {
              Icon: Mail,
              colorClass: "text-primary",
              bgClass: "bg-primary/10",
              title: "Email support",
              desc: "support@drimpay.com — pour les demandes détaillées et les rapports.",
            },
            {
              Icon: Zap,
              colorClass: "text-sky-400",
              bgClass: "bg-sky-400/10",
              title: "Statut plateforme",
              desc: "Consultez l'état des services en temps réel sur status.drimpay.com.",
            },
          ].map((item, i) => {
            const Icon = item.Icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-card border border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${item.bgClass}`}>
                  <Icon className={`w-4 h-4 ${item.colorClass}`} />
                </div>
                <p className="text-sm font-semibold tracking-tight text-foreground mb-1">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
