import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Zap, Building2, Code, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">{num}</div>
        <div className="w-px flex-1 bg-border mt-3" />
      </div>
      <div className="pb-10">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const t = useT();
  const systemIcons = [Wallet, Building2, Code];

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">{t.hiw.badge}</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t.hiw.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">{t.hiw.desc}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-20 mb-24">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Zap className="w-4 h-4 text-primary" /></div>
              <h2 className="text-2xl font-bold">{t.hiw.payinTitle}</h2>
            </div>
            <p className="text-muted-foreground mb-8">{t.hiw.payinDesc}</p>
            {t.hiw.payinSteps.map((s, i) => (
              <Step key={i} num={`0${i + 1}`} title={s.title} desc={s.desc} />
            ))}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><ArrowRight className="w-4 h-4 text-primary" /></div>
              <h2 className="text-2xl font-bold">{t.hiw.payoutTitle}</h2>
            </div>
            <p className="text-muted-foreground mb-8">{t.hiw.payoutDesc}</p>
            {t.hiw.payoutSteps.map((s, i) => (
              <Step key={i} num={`0${i + 1}`} title={s.title} desc={s.desc} />
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {t.hiw.systems.map((item, i) => {
            const Icon = systemIcons[i];
            return (
              <div key={i} className="p-8 rounded-2xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">{t.hiw.ctaTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{t.hiw.ctaDesc}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-primary-foreground font-semibold">
                {t.hiw.ctaBtn1} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">{t.hiw.ctaBtn2}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
