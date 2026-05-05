import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListBlogArticles } from "@workspace/api-client-react";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function News() {
  const { data, isLoading } = useListBlogArticles({ category: "DrimPay News", limit: 12 });

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">News & Updates</h1>
          <p className="text-xl text-muted-foreground">Official announcements, new features, maintenance windows, and company news from the DrimPay team.</p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : (data?.articles ?? []).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">No news articles yet. Check back soon.</p>
            <Link href="/blog"><Button variant="outline">Read our Blog <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {(data?.articles ?? []).map((article, i) => (
              <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-8 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
                data-testid={`news-card-${article.id}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">News</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(article.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <h2 className="font-bold text-xl mb-3 leading-tight">{article.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">{article.excerpt}</p>
                <Link href={`/blog/${article.slug}`}>
                  <Button variant="ghost" size="sm" className="text-primary -ml-3">Read More <ArrowRight className="ml-1 w-3 h-3" /></Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
