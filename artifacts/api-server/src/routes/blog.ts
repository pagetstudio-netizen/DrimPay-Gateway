import { Router } from "express";
import { db } from "@workspace/db";
import { blogArticlesTable } from "@workspace/db";
import { eq, sql, ilike } from "drizzle-orm";

const router = Router();

router.get("/blog/categories", async (req, res) => {
  try {
    const rows = await db
      .select({ category: blogArticlesTable.category, count: sql<number>`count(*)::int` })
      .from(blogArticlesTable)
      .groupBy(blogArticlesTable.category);

    const categories = rows.map((r) => ({
      name: r.category,
      slug: r.category.toLowerCase().replace(/\s+/g, "-"),
      count: r.count,
    }));

    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "Failed to list blog categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blog/articles", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "9"))));
    const category = req.query.category ? String(req.query.category) : null;
    const offset = (page - 1) * limit;

    let query = db.select().from(blogArticlesTable);
    let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(blogArticlesTable);

    const articles = category
      ? await db.select().from(blogArticlesTable).where(eq(blogArticlesTable.category, category)).limit(limit).offset(offset)
      : await db.select().from(blogArticlesTable).limit(limit).offset(offset);

    const [{ count }] = category
      ? await db.select({ count: sql<number>`count(*)::int` }).from(blogArticlesTable).where(eq(blogArticlesTable.category, category))
      : await countQuery;

    res.json({
      articles: articles.map(articleToResponse),
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list blog articles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/blog/articles/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const [article] = await db.select().from(blogArticlesTable).where(eq(blogArticlesTable.slug, slug));
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(articleToResponse(article));
  } catch (err) {
    req.log.error({ err }, "Failed to get blog article");
    res.status(500).json({ error: "Internal server error" });
  }
});

function articleToResponse(a: typeof blogArticlesTable.$inferSelect) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    category: a.category,
    author: a.author,
    authorTitle: a.authorTitle,
    publishedAt: a.publishedAt.toISOString(),
    readingTimeMinutes: a.readingTimeMinutes,
    imageUrl: a.imageUrl,
    tags: a.tags,
  };
}

export default router;
