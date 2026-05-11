import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetBlogArticle, getGetBlogArticleQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useLang } from "@/lib/i18n";
import { useSEO, webPageSchema, SITE_URL } from "@/lib/seo";

export default function BlogPost({ params }: { params: { slug: string } }) {
  const { data: article, isLoading } = useGetBlogArticle(params.slug, {
    query: { enabled: !!params.slug, queryKey: getGetBlogArticleQueryKey(params.slug) },
  });
  const t = useT();
  const lang = useLang();
  useSEO({
    title: article?.title
      ? article.title
      : lang === "fr" ? "Article Blog — DrimPay" : "Blog Article — DrimPay",
    description: article?.excerpt
      ? article.excerpt
      : lang === "fr"
        ? "Lisez les derniers articles de blog DrimPay sur la fintech en Afrique et les paiements Mobile Money."
        : "Read the latest DrimPay blog articles on fintech in Africa and Mobile Money payments.",
    ogType: "article",
    jsonLd: article ? [
      webPageSchema(
        `${SITE_URL}/${lang}/blog/${params.slug}`,
        article.title,
        article.excerpt ?? "",
        [
          { name: "Blog", url: `${SITE_URL}/${lang}/blog` },
          { name: article.title, url: `${SITE_URL}/${lang}/blog/${params.slug}` },
        ],
      ),
      {
        "@type": "BlogPosting",
        headline: article.title,
        description: article.excerpt ?? "",
        author: { "@type": "Organization", name: "DrimPay" },
        publisher: { "@id": `${SITE_URL}/#organization` },
        url: `${SITE_URL}/${lang}/blog/${params.slug}`,
        inLanguage: lang === "fr" ? "fr-FR" : "en-US",
        ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
      },
    ] : undefined,
  });

  if (isLoading) {
    return (
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Skeleton className="h-4 w-64 mb-12" />
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 w-full mb-3" />)}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-24 pb-20 text-center">
        <h1 className="text-3xl font-bold mb-4">{t.blog.notFound}</h1>
        <Link href="/blog"><Button variant="outline">{t.blog.backToBlog}</Button></Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link href="/blog">
            <Button variant="ghost" className="mb-8 text-muted-foreground -ml-3" data-testid="back-to-blog">
              <ArrowLeft className="mr-2 w-4 h-4" /> {t.blog.backToBlog}
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">{article.category}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{article.readingTimeMinutes} {t.blog.minRead}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">{article.title}</h1>

          <div className="flex items-center gap-4 mb-12 pb-8 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">{article.author}</p>
              <p className="text-xs text-muted-foreground">{article.authorTitle} · {new Date(article.publishedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
            {article.content}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-border">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-border">
            <Link href="/blog"><Button variant="outline">{t.blog.moreArticles} <ArrowLeft className="ml-2 w-4 h-4 rotate-180" /></Button></Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
