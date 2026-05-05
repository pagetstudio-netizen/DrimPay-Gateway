import { pgTable, text, serial, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobTypeEnum = pgEnum("job_type", ["full-time", "part-time", "contract", "internship"]);
export const partnerTypeEnum = pgEnum("partner_type", ["mobile-money", "bank", "fintech", "aggregator"]);
export const serviceStatusEnum = pgEnum("service_status", ["operational", "degraded", "outage", "maintenance"]);
export const incidentStatusEnum = pgEnum("incident_status", ["investigating", "identified", "monitoring", "resolved"]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["minor", "major", "critical"]);

export const blogArticlesTable = pgTable("blog_articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  authorTitle: text("author_title").notNull(),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  readingTimeMinutes: integer("reading_time_minutes").notNull().default(5),
  imageUrl: text("image_url"),
  tags: text("tags").array().notNull().default([]),
});

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  type: jobTypeEnum("type").notNull().default("full-time"),
  remote: boolean("remote").notNull().default(true),
  description: text("description").notNull(),
  requirements: text("requirements").array().notNull().default([]),
  responsibilities: text("responsibilities").array().notNull().default([]),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
});

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const serviceStatusesTable = pgTable("service_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: serviceStatusEnum("status").notNull().default("operational"),
  uptimePercent: integer("uptime_percent").notNull().default(100),
  latencyMs: integer("latency_ms").notNull().default(80),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: incidentStatusEnum("status").notNull().default("resolved"),
  severity: incidentSeverityEnum("severity").notNull().default("minor"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  affectedServices: text("affected_services").array().notNull().default([]),
});

export const partnersTable = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: partnerTypeEnum("type").notNull(),
  country: text("country").notNull(),
  logoUrl: text("logo_url"),
  description: text("description").notNull(),
  website: text("website"),
});

export const countriesTable = pgTable("countries", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  flag: text("flag").notNull(),
  currency: text("currency").notNull(),
  payinEnabled: boolean("payin_enabled").notNull().default(true),
  payoutEnabled: boolean("payout_enabled").notNull().default(true),
});

export const operatorsTable = pgTable("operators", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertBlogArticleSchema = createInsertSchema(blogArticlesTable).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true });
export const insertContactSchema = createInsertSchema(contactSubmissionsTable).omit({ id: true });

export type BlogArticle = typeof blogArticlesTable.$inferSelect;
export type Job = typeof jobsTable.$inferSelect;
export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
export type ServiceStatus = typeof serviceStatusesTable.$inferSelect;
export type Incident = typeof incidentsTable.$inferSelect;
export type Partner = typeof partnersTable.$inferSelect;
export type Country = typeof countriesTable.$inferSelect;
export type Operator = typeof operatorsTable.$inferSelect;
