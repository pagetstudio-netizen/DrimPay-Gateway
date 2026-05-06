import { pgTable, text, serial, boolean, integer, timestamp, pgEnum, numeric, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const jobTypeEnum = pgEnum("job_type", ["full-time", "part-time", "contract", "internship"]);
export const partnerTypeEnum = pgEnum("partner_type", ["mobile-money", "bank", "fintech", "aggregator"]);
export const serviceStatusEnum = pgEnum("service_status", ["operational", "degraded", "outage", "maintenance"]);
export const incidentStatusEnum = pgEnum("incident_status", ["investigating", "identified", "monitoring", "resolved"]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["minor", "major", "critical"]);
export const kybStatusEnum = pgEnum("kyb_status", ["pending", "submitted", "under_review", "approved", "rejected"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["payin", "payout"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "success", "failed", "processing"]);
export const apiKeyStatusEnum = pgEnum("api_key_status", ["active", "revoked"]);
export const apiKeyEnvEnum = pgEnum("api_key_env", ["sandbox", "live"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  companyName: text("company_name").notNull(),
  country: text("country").notNull().default("OTHER"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kybSubmissionsTable = pgTable("kyb_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: kybStatusEnum("status").notNull().default("pending"),
  companyLegalName: text("company_legal_name"),
  registrationNumber: text("registration_number"),
  businessType: text("business_type"),
  incorporationCountry: text("incorporation_country"),
  businessAddress: text("business_address"),
  website: text("website"),
  businessDescription: text("business_description"),
  documentRccm: text("document_rccm"),
  documentStatuts: text("document_statuts"),
  documentId: text("document_id"),
  documentProofAddress: text("document_proof_address"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const walletsTable = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  countryCode: text("country_code").notNull(),
  currency: text("currency").notNull(),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  lockedBalance: numeric("locked_balance", { precision: 18, scale: 2 }).notNull().default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionModeEnum = pgEnum("transaction_mode", ["sandbox", "live"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  walletId: integer("wallet_id").notNull().references(() => walletsTable.id),
  reference: text("reference").notNull().unique(),
  orderId: text("order_id"),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 18, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  countryCode: text("country_code").notNull(),
  operator: text("operator").notNull(),
  phone: text("phone").notNull(),
  description: text("description"),
  externalRef: text("external_ref"),
  gatewayReference: text("gateway_reference"),
  mnoReference: text("mno_reference"),
  mode: transactionModeEnum("mode").notNull().default("sandbox"),
  failureReason: text("failure_reason"),
  webhookUrl: text("webhook_url"),
  webhookLastStatusCode: integer("webhook_last_status_code"),
  webhookLastBody: text("webhook_last_body"),
  webhookLastSentAt: timestamp("webhook_last_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  prefix: text("prefix").notNull(),
  env: apiKeyEnvEnum("env").notNull().default("sandbox"),
  status: apiKeyStatusEnum("status").notNull().default("active"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const virtualCardOrdersTable = pgTable("virtual_card_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  cardholderName: text("cardholder_name").notNull(),
  email: text("email").notNull(),
  currency: text("currency").notNull().default("USD"),
  spendingLimit: numeric("spending_limit", { precision: 18, scale: 2 }),
  status: text("status").notNull().default("active"),
  cardLast4: text("card_last4"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const massPayoutJobsTable = pgTable("mass_payout_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  reference: text("reference").notNull().unique(),
  status: text("status").notNull().default("pending"),
  totalCount: integer("total_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const reversementStatusEnum = pgEnum("reversement_status", ["pending", "completed", "failed"]);

export const reversementsTable = pgTable("reversements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  walletId: integer("wallet_id").notNull().references(() => walletsTable.id),
  countryCode: text("country_code").notNull(),
  currency: text("currency").notNull(),
  operator: text("operator").notNull(),
  phone: text("phone").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 18, scale: 2 }).notNull(),
  net: numeric("net", { precision: 18, scale: 2 }).notNull(),
  note: text("note"),
  status: reversementStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
export type KybSubmission = typeof kybSubmissionsTable.$inferSelect;
export type Wallet = typeof walletsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type ApiKey = typeof apiKeysTable.$inferSelect;
export type Reversement = typeof reversementsTable.$inferSelect;
