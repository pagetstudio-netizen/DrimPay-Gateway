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
    <div className="bg-[#F8F6F1]">
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8">

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 text-[#0f0f0f] leading-[1.02]">{t.blog.title}</h1>
            <p className="text-xl text-[#0f0f0f]/55">{t.blog.desc}</p>
          </motion.div>

          {/* ── CATEGORY FILTERS ──────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-12">
            <button onClick={() => { setSelectedCategory(undefined); setPage(1); }} data-testid="category-all"
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${!selectedCategory ? "bg-[#0f0f0f] text-white border-[#0f0f0f]" : "bg-white text-[#0f0f0f]/55 border-[#E5E3DC] hover:border-[#0f0f0f]/30"}`}>
              {t.blog.all}
            </button>
            {(categories ?? []).map((cat) => (
              <button key={cat.slug} onClick={() => { setSelectedCategory(cat.name); setPage(1); }} data-testid={`category-${cat.slug}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${selectedCategory === cat.name ? "bg-[#0f0f0f] text-white border-[#0f0f0f]" : "bg-white text-[#0f0f0f]/55 border-[#E5E3DC] hover:border-[#0f0f0f]/30"}`}>
                {cat.name} <span className="ml-1 opacity-50">({cat.count})</span>
              </button>
            ))}
          </div>

          {/* ── ARTICLE GRID ──────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl bg-[#E5E3DC]" />)}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {(data?.articles ?? []).map((article, i) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="group rounded-2xl border border-[#E5E3DC] bg-white hover:border-[#B5F03C]/50 hover:shadow-md transition-all overflow-hidden flex flex-col"
                    data-testid={`article-card-${article.id}`}>
                    <div className="h-48 bg-[#F5F0E8] flex items-center justify-center border-b border-[#E5E3DC]">
                      <div className="text-4xl font-extrabold text-[#B5F03C]/50">{article.category[0]}</div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#B5F03C]/20 text-[#3a7a00]">{article.category}</span>
                        <span className="flex items-center gap-1 text-xs text-[#0f0f0f]/40"><Clock className="w-3 h-3" />{article.readingTimeMinutes} {t.blog.minRead}</span>
                      </div>
                      <h2 className="font-extrabold text-lg mb-3 leading-tight text-[#0f0f0f] group-hover:text-[#3a7a00] transition-colors">{article.title}</h2>
                      <p className="text-sm text-[#0f0f0f]/55 leading-relaxed flex-1 mb-4 line-clamp-3">{article.excerpt}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <p className="text-sm font-semibold text-[#0f0f0f]">{article.author}</p>
                          <p className="text-xs text-[#0f0f0f]/40">{new Date(article.publishedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                        <Link href={`/blog/${article.slug}`}>
                          <button className="inline-flex items-center gap-1 text-sm font-semibold text-[#3a7a00] group-hover:gap-2 transition-all">
                            {t.blog.read} <ArrowRight className="w-3 h-3" />
                          </button>
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
                  <span className="text-sm text-[#0f0f0f]/55">{t.blog.page} {page} {t.blog.of} {data.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} data-testid="next-page">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
