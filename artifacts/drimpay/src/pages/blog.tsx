import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListBlogArticles, useListBlogCategories } from "@workspace/api-client-react";
import { ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useLang } from "@/lib/i18n";

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const t = useT();
  const lang = useLang();

  const { data, isLoading } = useListBlogArticles({ category: selectedCategory, page, limit: 6 });
  const { data: categories } = useListBlogCategories();

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t.blog.title}</h1>
          <p className="text-xl text-muted-foreground">{t.blog.desc}</p>
        </motion.div>

        <div className="flex flex-wrap gap-3 mb-12">
          <button onClick={() => { setSelectedCategory(undefined); setPage(1); }} data-testid="category-all"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {t.blog.all}
          </button>
          {(categories ?? []).map((cat) => (
            <button key={cat.slug} onClick={() => { setSelectedCategory(cat.name); setPage(1); }} data-testid={`category-${cat.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.name ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {cat.name} <span className="ml-1 opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {(data?.articles ?? []).map((article, i) => (
                <motion.div key={article.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors overflow-hidden flex flex-col"
                  data-testid={`article-card-${article.id}`}>
                  <div className="h-48 bg-secondary/50 flex items-center justify-center border-b border-border">
                    <div className="text-4xl font-bold text-primary/20">{article.category[0]}</div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">{article.category}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{article.readingTimeMinutes} {t.blog.minRead}</span>
                    </div>
                    <h2 className="font-bold text-lg mb-3 leading-tight group-hover:text-primary transition-colors">{article.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4 line-clamp-3">{article.excerpt}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-sm font-medium">{article.author}</p>
                        <p className="text-xs text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                      <Link href={`/blog/${article.slug}`}>
                        <Button variant="ghost" size="sm" className="text-primary group-hover:translate-x-1 transition-transform">
                          {t.blog.read} <ArrowRight className="ml-1 w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} data-testid="prev-page">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{t.blog.page} {page} {t.blog.of} {data.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} data-testid="next-page">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
