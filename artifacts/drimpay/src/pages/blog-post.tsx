import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetBlogArticle, getGetBlogArticleQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useLang } from "@/lib/i18n";
import { useSEO, webPageSchema, SITE_URL } from "@/lib/seo";
import { BlogMarkdown } from "@/components/blog-markdown";

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
        image: article.imageUrl ? `${SITE_URL}${article.imageUrl}` : undefined,
        articleSection: article.category,
        keywords: article.tags?.join(", "),
        mainEntityOfPage: `${SITE_URL}/${lang}/blog/${params.slug}`,
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
    <article className="bg-[#F8F6F1] pt-24 pb-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link href="/blog">
            <Button variant="ghost" className="mb-8 text-muted-foreground" data-testid="back-to-blog">
              <ArrowLeft className="mr-2 w-4 h-4" /> {t.blog.backToBlog}
            </Button>
          </Link>

          <div className="mx-auto mb-6 flex max-w-3xl items-center justify-center gap-3">
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">{article.category}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{article.readingTimeMinutes} {t.blog.minRead}</span>
          </div>

          <h1 className="mx-auto max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight md:text-5xl">{article.title}</h1>

          <div className="mx-auto mb-10 flex max-w-3xl items-center justify-center gap-4 border-b border-border pb-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">{article.author}</p>
              <p className="text-xs text-muted-foreground">{article.authorTitle} · {new Date(article.publishedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>

          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              width="1024"
              height="576"
              loading="eager"
              className="mx-auto mb-12 max-h-[520px] w-full max-w-4xl rounded-3xl object-cover shadow-lg"
            />
          )}

          <div className="mx-auto max-w-3xl">
            <BlogMarkdown content={article.content} />
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-2 border-t border-border pt-8">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}

          <div className="mx-auto mt-12 max-w-3xl border-t border-border pt-8 text-center">
            <Link href="/blog"><Button variant="outline">{t.blog.moreArticles} <ArrowLeft className="ml-2 w-4 h-4 rotate-180" /></Button></Link>
          </div>
        </motion.div>
      </div>
    </article>
  );
}
