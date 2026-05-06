import { motion } from "framer-motion";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Pricing() {
  const t = useT();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-xs font-medium">{t.pricing.badge}</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t.pricing.title}</h1>
          <p className="text-xl text-muted-foreground">{t.pricing.desc}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {t.pricing.plans.map((plan, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } } }}
              className={`rounded-2xl p-8 border flex flex-col ${i === 1 ? "border-primary bg-primary/5 shadow-[0_0_60px_rgba(197,255,74,0.08)]" : "border-border bg-card"}`}
            >
              {i === 1 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 w-fit">
                  <Zap className="w-3 h-3" /> {t.pricing.mostPopular}
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="mb-2">
                <span className="text-5xl font-bold">3%</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{plan.per}</p>
              <p className="text-muted-foreground mb-8 leading-relaxed">{plan.desc}</p>
              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={i === 2 ? "/contact" : "/signup"}>
                <Button size="lg" variant={i === 1 ? "default" : "outline"} className={`w-full font-semibold ${i === 1 ? "text-primary-foreground" : ""}`}>
                  {plan.cta} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8">{t.pricing.feeScheduleTitle}</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="text-left px-6 py-4 font-semibold">{t.pricing.feeCol1}</th>
                  <th className="text-left px-6 py-4 font-semibold">{t.pricing.feeCol2}</th>
                  <th className="text-left px-6 py-4 font-semibold">{t.pricing.feeCol3}</th>
                  <th className="text-left px-6 py-4 font-semibold">{t.pricing.feeCol4}</th>
                </tr>
              </thead>
              <tbody>
                {t.pricing.feeRows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{row.type}</td>
                    <td className="px-6 py-4 text-primary font-semibold">{row.fee}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.min}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {t.pricing.extras.map((item, i) => (
            <div key={i} className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-bold text-lg mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center rounded-2xl border border-border bg-card p-12">
          <h2 className="text-2xl font-bold mb-4">{t.pricing.customTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{t.pricing.customDesc}</p>
          <Link href="/contact">
            <Button size="lg" className="text-primary-foreground font-semibold">
              {t.pricing.customBtn} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
