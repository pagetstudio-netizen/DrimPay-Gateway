import { pgTable, text, serial, boolean, integer, timestamp, pgEnum, numeric, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const accountTypeEnum = pgEnum("account_type", ["enterprise", "personal"]);
export const jobTypeEnum = pgEnum("job_type", ["full-time", "part-time", "contract", "internship"]);
export const partnerTypeEnum = pgEnum("partner_type", ["mobile-money", "bank", "fintech", "aggregator"]);
export const serviceStatusEnum = pgEnum("service_status", ["operational", "degraded", "outage", "maintenance"]);
export const incidentStatusEnum = pgEnum("incident_status", ["investigating", "identified", "monitoring", "resolved"]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["minor", "major", "critical"]);
export const kybStatusEnum = pgEnum("kyb_status", ["pending", "submitted", "under_review", "approved", "rejected"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["payin", "payout"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["queued", "pending", "processing", "success", "failed", "reversed", "cancelled", "expired"]);
export const apiKeyStatusEnum = pgEnum("api_key_status", ["active", "revoked"]);
export const apiKeyEnvEnum = pgEnum("api_key_env", ["sandbox", "live"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  companyName: text("company_name").notNull(),
  country: text("country").notNull().default("OTHER"),
  role: userRoleEnum("role").notNull().default("user"),
  accountType: accountTypeEnum("account_type").notNull().default("enterprise"),
  merchantCode: text("merchant_code").unique(),
  webhookUrl: text("webhook_url"),
  staticIp: text("static_ip"),
  payinFeePercent: numeric("payin_fee_percent", { precision: 5, scale: 2 }),
  payoutFeePercent: numeric("payout_fee_percent", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kybSubmissionsTable = pgTable("kyb_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: kybStatusEnum("status").notNull().default("pending"),

  // Step 1 - Company Info
  companyLegalName: text("company_legal_name"),
  tradeName: text("trade_name"),
  registrationNumber: text("registration_number"),
  taxNumber: text("tax_number"),
  incorporationCountry: text("incorporation_country"),
  city: text("city"),
  businessAddress: text("business_address"),
  businessType: text("business_type"),
  foundingDate: text("founding_date"),
  website: text("website"),
  businessDescription: text("business_description"),

  // Step 2 - Legal Representative
  legalRepName: text("legal_rep_name"),
  legalRepDob: text("legal_rep_dob"),
  legalRepNationality: text("legal_rep_nationality"),
  legalRepPhone: text("legal_rep_phone"),
  legalRepEmail: text("legal_rep_email"),
  legalRepPosition: text("legal_rep_position"),
  legalRepIdType: text("legal_rep_id_type"),
  legalRepIdNumber: text("legal_rep_id_number"),
  legalRepIdExpiry: text("legal_rep_id_expiry"),
  documentIdFront: text("document_id_front"),
  documentIdBack: text("document_id_back"),
  documentSelfie: text("document_selfie"),

  // Step 3 - Company Documents
  documentRccm: text("document_rccm"),
  documentCertificate: text("document_certificate"),
  documentProofAddress: text("document_proof_address"),
  documentBankStatement: text("document_bank_statement"),
  documentStatuts: text("document_statuts"),
  documentLicense: text("document_license"),
  documentId: text("document_id"),

  // Personal KYC fields
  fundsSource: text("funds_source"),

  // Step 4 - Contract & Signature
  contractEmail: text("contract_email"),
  contractVersion: text("contract_version"),
  contractSignedAt: timestamp("contract_signed_at"),
  contractIp: text("contract_ip"),
  contractUserAgent: text("contract_user_agent"),
  contractAccepted: boolean("contract_accepted").default(false),

  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const walletModeEnum = pgEnum("wallet_mode", ["sandbox", "live"]);

export const walletsTable = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  countryCode: text("country_code").notNull(),
  currency: text("currency").notNull(),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  lockedBalance: numeric("locked_balance", { precision: 18, scale: 2 }).notNull().default("0"),
  active: boolean("active").notNull().default(true),
  mode: walletModeEnum("mode").notNull().default("sandbox"),
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
  webhookSignatureKey: text("webhook_signature_key"),
  webhookRetryCount: integer("webhook_retry_count").notNull().default(0),
  webhookNextRetryAt: timestamp("webhook_next_retry_at"),
  requestPayload: text("request_payload"),
  gatewayPayload: text("gateway_payload"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  description: text("description"),
  keyHash: text("key_hash").notNull(),
  rawKey: text("raw_key"),
  prefix: text("prefix").notNull(),
  env: apiKeyEnvEnum("env").notNull().default("sandbox"),
  status: apiKeyStatusEnum("status").notNull().default("active"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userWebhooksTable = pgTable("user_webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  url: text("url").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAllowedIpsTable = pgTable("user_allowed_ips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  ip: text("ip").notNull(),
  label: text("label"),
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
  mode: transactionModeEnum("mode").notNull().default("sandbox"),
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
  reference: text("reference"),
  failureReason: text("failure_reason"),
  status: reversementStatusEnum("status").notNull().default("pending"),
  mode: transactionModeEnum("mode").notNull().default("sandbox"),
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
  source: text("source").notNull().default("contact"),
  ticketStatus: text("ticket_status").notNull().default("unread"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const supportUsersTable = pgTable("support_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Support Agent"),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supportRepliesTable = pgTable("support_replies", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contactSubmissionsTable.id),
  supportUserId: integer("support_user_id").notNull().references(() => supportUsersTable.id),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const supportSettingsTable = pgTable("support_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const paymentLinkStatusEnum = pgEnum("payment_link_status", ["active", "inactive", "expired"]);

export const paymentLinksTable = pgTable("payment_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  token: text("token").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 18, scale: 2 }),
  currency: text("currency").notNull(),
  countryCode: text("country_code").notNull(),
  operator: text("operator").notNull(),
  fixedAmount: boolean("fixed_amount").notNull().default(true),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  status: paymentLinkStatusEnum("status").notNull().default("active"),
  mode: apiKeyEnvEnum("mode").notNull().default("sandbox"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PaymentLink = typeof paymentLinksTable.$inferSelect;

export const aggregatorsTable = pgTable("aggregators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const operatorAggregatorsTable = pgTable("operator_aggregators", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull(),
  operatorName: text("operator_name").notNull(),
  operatorType: text("operator_type").notNull().default("mobile-money"),
  aggregatorCode: text("aggregator_code").notNull(),
  dailyLimit: numeric("daily_limit", { precision: 18, scale: 2 }).notNull().default("1000000"),
  active: boolean("active").notNull().default(true),
  priority: integer("priority").notNull().default(1),
  blockDeposits: boolean("block_deposits").notNull().default(false),
  blockWithdrawals: boolean("block_withdrawals").notNull().default(false),
  blockApi: boolean("block_api").notNull().default(false),
  blockPaymentLinks: boolean("block_payment_links").notNull().default(false),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminLogsTable = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => usersTable.id),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminSettingsTable = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentLinkAttemptsTable = pgTable("payment_link_attempts", {
  id: serial("id").primaryKey(),
  paymentLinkId: integer("payment_link_id").notNull().references(() => paymentLinksTable.id),
  merchantId: integer("merchant_id").notNull().references(() => usersTable.id),
  phone: text("phone").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }),
  name: text("name"),
  email: text("email"),
  countryCode: text("country_code"),
  operator: text("operator"),
  status: text("status").notNull().default("initiated"),
  note: text("note"),
  transactionReference: text("transaction_reference"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const socialLinksTable = pgTable("social_links", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SocialLink = typeof socialLinksTable.$inferSelect;

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
export const blacklistedPhonesTable = pgTable("blacklisted_phones", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  reason: text("reason"),
  blockedBy: integer("blocked_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Operator = typeof operatorsTable.$inferSelect;
export type KybSubmission = typeof kybSubmissionsTable.$inferSelect;
export type Wallet = typeof walletsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type ApiKey = typeof apiKeysTable.$inferSelect;
export type Reversement = typeof reversementsTable.$inferSelect;
export type BlacklistedPhone = typeof blacklistedPhonesTable.$inferSelect;

export const qrCodeStatusEnum = pgEnum("qr_code_status", ["active", "inactive"]);
export const qrCodeTypeEnum = pgEnum("qr_code_type", ["fixed", "flexible"]);

export const qrCodesTable = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  defaultCountry: text("default_country"),
  countryCodes: jsonb("country_codes").$type<string[]>(),
  currency: text("currency").notNull().default("XOF"),
  type: qrCodeTypeEnum("type").notNull().default("flexible"),
  amount: numeric("amount", { precision: 18, scale: 2 }),
  expiresAt: timestamp("expires_at"),
  status: qrCodeStatusEnum("status").notNull().default("active"),
  transactionCount: integer("transaction_count").notNull().default(0),
  totalCollected: numeric("total_collected", { precision: 18, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type QrCode = typeof qrCodesTable.$inferSelect;

export const securityEventTypeEnum = pgEnum("security_event_type", [
  "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "REGISTER",
  "BRUTE_FORCE", "RATE_LIMITED", "IP_BLOCKED", "SUSPICIOUS_ACTIVITY",
  "PASSWORD_CHANGED", "API_KEY_CREATED", "API_KEY_REVOKED",
  "WEBHOOK_INVALID", "SESSION_EXPIRED",
]);

export const securityEventsTable = pgTable("security_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  eventType: securityEventTypeEnum("event_type").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: text("details"),
  riskLevel: text("risk_level").notNull().default("low"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blockedIpsTable = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull().unique(),
  reason: text("reason").notNull(),
  blockedBy: integer("blocked_by").references(() => usersTable.id, { onDelete: "set null" }),
  blockedUntil: timestamp("blocked_until"),
  permanent: boolean("permanent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SecurityEvent = typeof securityEventsTable.$inferSelect;
export type BlockedIp = typeof blockedIpsTable.$inferSelect;

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull().default("info"),
  category: text("category").notNull().default("activite"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href").notNull().default("/dashboard"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  email: text("email").notNull(),
  code: text("code").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const globalBannersTable = pgTable("global_banners", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  color: text("color").notNull().default("blue"),
  customColor: text("custom_color"),
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type GlobalBanner = typeof globalBannersTable.$inferSelect;
