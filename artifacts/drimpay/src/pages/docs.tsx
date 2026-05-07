import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ArrowRight, BookOpen, Shield, Zap, Globe } from "lucide-react";
import { useT } from "@/lib/i18n";

const commonIcons = [Shield, Globe, Zap, BookOpen];

export default function Docs() {
  const t = useT();

  return (
    <div className="min-h-screen pt-32 pb-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.docs.badge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{t.docs.title}</h1>
          <p className="text-xl text-muted-foreground mb-14 max-w-2xl leading-relaxed">{t.docs.desc}</p>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Link href="/docs/payin">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-2xl border border-border bg-card p-8 cursor-pointer hover:border-primary/40 transition-colors overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                    <ArrowDownLeft className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{t.docs.payinTitle}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{t.docs.payinDesc}</p>
                  <ul className="space-y-2 mb-6">
                    {t.docs.payinFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 group-hover:gap-3 transition-all">
                    {t.docs.payinLink} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/docs/payout">
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-2xl border border-border bg-card p-8 cursor-pointer hover:border-orange-400/40 transition-colors overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/10 transition-colors" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
                    <ArrowUpRight className="w-6 h-6 text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{t.docs.payoutTitle}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{t.docs.payoutDesc}</p>
                  <ul className="space-y-2 mb-6">
                    {t.docs.payoutFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-sm font-semibold text-orange-400 group-hover:gap-3 transition-all">
                    {t.docs.payoutLink} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>

          <div className="border-t border-border pt-12">
            <h3 className="text-lg font-semibold mb-6">{t.docs.commonTitle}</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {t.docs.common.map(({ title, desc }, i) => {
                const Icon = commonIcons[i];
                return (
                  <div key={title} className="p-5 rounded-xl border border-border bg-card/50">
                    <Icon className="w-5 h-5 text-primary mb-3" />
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
