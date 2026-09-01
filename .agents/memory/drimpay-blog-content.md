---
name: DrimPay blog content model
description: Blog articles are database content with Markdown bodies, public assets, and explicit sitemap URLs.
---

Blog content is stored in PostgreSQL rather than hardcoded in the frontend. Markdown is rendered into safe semantic HTML in the article view, so authoring can use headings, lists, tables, emphasis, and code blocks without exposing formatting markers.

**Why:** Plain-text Markdown made article pages show `#`, `*`, and backticks, while database-backed content allows new articles to appear without a frontend release.

**How to apply:** Keep new article slugs, seed data, public image paths, and sitemap entries synchronized. Use descriptive, topic-specific slugs for search visibility and preserve the canonical `/fr/blog/:slug` route.