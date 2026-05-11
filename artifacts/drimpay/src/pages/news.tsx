import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListBlogArticles } from "@workspace/api-client-react";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useLang } from "@/lib/i18n";
import { useSEO, webPageSchema, SITE_URL } from "@/lib/seo";

export default function News() {
  const { data, isLoading } = useListBlogArticles({ category: "DrimPay News", limit: 12 });
  const t = useT();
  const lang = useLang();
  useSEO({
    title: lang === "fr"
      ? "Actualités DrimPay — Mises à Jour Produit, Lancements & Annonces"
      : "DrimPay News — Product Updates, Launches & Announcements",
    description: lang === "fr"
      ? "Retrouvez toutes les actualités de DrimPay : nouvelles fonctionnalités, nouveaux pays, partenariats et mises à jour de la plateforme de paiement Mobile Money."
      : "Find all DrimPay news: new features, new countries, partnerships and updates to the Mobile Money payment platform.",
    keywords: lang === "fr"
      ? "actualités DrimPay, mises à jour paiement, nouvelles fonctionnalités fintech, annonces DrimPay"
      : "DrimPay news, payment updates, fintech features, DrimPay announcements",
    jsonLd: [
      webPageSchema(
        `${SITE_URL}/${lang}/news`,
        lang === "fr" ? "Actualités DrimPay" : "DrimPay News",
        lang === "fr" ? "Dernières actualités et annonces de DrimPay." : "Latest DrimPay news and announcements.",
        [{ name: lang === "fr" ? "Actualités" : "News", url: `${SITE_URL}/${lang}/news` }],
      ),
    ],
  });

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.news.title}</h1>
          <p className="text-xl text-muted-foreground">{t.news.desc}</p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : (data?.articles ?? []).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">{t.news.noArticles}</p>
            <Link href="/blog"><Button variant="outline">{t.news.readBlog} <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {(data?.articles ?? []).map((article, i) => (
              <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-8 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
                data-testid={`news-card-${article.id}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{t.news.newsTag}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(article.publishedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <h2 className="font-bold text-xl mb-3 leading-tight">{article.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">{article.excerpt}</p>
                <Link href={`/blog/${article.slug}`}>
                  <Button variant="ghost" size="sm" className="text-primary -ml-3">{t.news.readMore} <ArrowRight className="ml-1 w-3 h-3" /></Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
