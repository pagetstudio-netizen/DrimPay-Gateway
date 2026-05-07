import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ChevronDown, Search, Book, Code, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const quickLinkIcons = [Book, Code, AlertCircle];

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const t = useT();

  const filteredFaqs = t.help.faqs.filter((f) =>
    f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.help.title}</h1>
          <p className="text-xl text-muted-foreground mb-8">{t.help.desc}</p>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t.help.searchPlaceholder} className="pl-12 h-14 text-base" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="search-help" />
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {t.help.quickLinks.map((item, i) => {
            const Icon = quickLinkIcons[i];
            return (
              <Link key={i} href={item.href}>
                <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors cursor-pointer">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">{t.help.faqTitle}</h2>
          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden" data-testid={`faq-${i}`}>
                <button className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/30 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-6 pb-6 text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-6">{t.help.guidesTitle}</h2>
            <div className="flex flex-col gap-4">
              {t.help.guides.map((guide, i) => (
                <Link key={i} href={guide.href}>
                  <div className="flex items-start justify-between p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors cursor-pointer">
                    <div>
                      <h3 className="font-semibold mb-1">{guide.title}</h3>
                      <p className="text-sm text-muted-foreground">{guide.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">{t.help.errorsTitle}</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {t.help.errors.map((error, i) => (
                <div key={i} className="flex gap-4 p-4 border-b border-border last:border-0">
                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded h-fit shrink-0">{error.code}</code>
                  <div>
                    <p className="text-sm font-semibold font-mono mb-1">{error.name}</p>
                    <p className="text-xs text-muted-foreground">{error.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center rounded-2xl border border-border bg-card p-10">
          <h2 className="text-2xl font-bold mb-3">{t.help.ctaTitle}</h2>
          <p className="text-muted-foreground mb-8">{t.help.ctaDesc}</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">{t.help.ctaBtn} <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
