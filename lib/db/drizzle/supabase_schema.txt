CREATE TYPE "public"."account_type" AS ENUM('enterprise', 'personal');
CREATE TYPE "public"."api_key_env" AS ENUM('sandbox', 'live');
CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');
CREATE TYPE "public"."incident_severity" AS ENUM('minor', 'major', 'critical');
CREATE TYPE "public"."incident_status" AS ENUM('investigating', 'identified', 'monitoring', 'resolved');
CREATE TYPE "public"."job_type" AS ENUM('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE "public"."kyb_status" AS ENUM('pending', 'submitted', 'under_review', 'approved', 'rejected');
CREATE TYPE "public"."partner_type" AS ENUM('mobile-money', 'bank', 'fintech', 'aggregator');
CREATE TYPE "public"."payment_link_status" AS ENUM('active', 'inactive', 'expired');
CREATE TYPE "public"."qr_code_status" AS ENUM('active', 'inactive');
CREATE TYPE "public"."qr_code_type" AS ENUM('fixed', 'flexible');
CREATE TYPE "public"."reversement_status" AS ENUM('pending', 'completed', 'failed');
CREATE TYPE "public"."security_event_type" AS ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER', 'BRUTE_FORCE', 'RATE_LIMITED', 'IP_BLOCKED', 'SUSPICIOUS_ACTIVITY', 'PASSWORD_CHANGED', 'API_KEY_CREATED', 'API_KEY_REVOKED', 'WEBHOOK_INVALID', 'SESSION_EXPIRED');
CREATE TYPE "public"."service_status" AS ENUM('operational', 'degraded', 'outage', 'maintenance');
CREATE TYPE "public"."transaction_mode" AS ENUM('sandbox', 'live');
CREATE TYPE "public"."transaction_status" AS ENUM('queued', 'pending', 'processing', 'success', 'failed', 'reversed', 'cancelled', 'expired');
CREATE TYPE "public"."transaction_type" AS ENUM('payin', 'payout');
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');
CREATE TYPE "public"."wallet_mode" AS ENUM('sandbox', 'live');
CREATE TABLE "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_key_unique" UNIQUE("key")
);
CREATE TABLE "aggregators" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aggregators_code_unique" UNIQUE("code")
);
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key_hash" text NOT NULL,
	"raw_key" text,
	"prefix" text NOT NULL,
	"env" "api_key_env" DEFAULT 'sandbox' NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "blacklisted_phones" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"reason" text,
	"blocked_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blacklisted_phones_phone_unique" UNIQUE("phone")
);
CREATE TABLE "blocked_ips" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"reason" text NOT NULL,
	"blocked_by" integer,
	"blocked_until" timestamp,
	"permanent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_ips_ip_unique" UNIQUE("ip")
);
CREATE TABLE "blog_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"author" text NOT NULL,
	"author_title" text NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"reading_time_minutes" integer DEFAULT 5 NOT NULL,
	"image_url" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "blog_articles_slug_unique" UNIQUE("slug")
);
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"source" text DEFAULT 'contact' NOT NULL,
	"ticket_status" text DEFAULT 'unread' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"flag" text NOT NULL,
	"currency" text NOT NULL,
	"payin_enabled" boolean DEFAULT true NOT NULL,
	"payout_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
CREATE TABLE "global_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"color" text DEFAULT 'blue' NOT NULL,
	"custom_color" text,
	"button_text" text,
	"button_link" text,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "incident_status" DEFAULT 'resolved' NOT NULL,
	"severity" "incident_severity" DEFAULT 'minor' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"affected_services" text[] DEFAULT '{}' NOT NULL
);
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"location" text NOT NULL,
	"type" "job_type" DEFAULT 'full-time' NOT NULL,
	"remote" boolean DEFAULT true NOT NULL,
	"description" text NOT NULL,
	"requirements" text[] DEFAULT '{}' NOT NULL,
	"responsibilities" text[] DEFAULT '{}' NOT NULL,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
CREATE TABLE "kyb_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" "kyb_status" DEFAULT 'pending' NOT NULL,
	"company_legal_name" text,
	"trade_name" text,
	"registration_number" text,
	"tax_number" text,
	"incorporation_country" text,
	"city" text,
	"business_address" text,
	"business_type" text,
	"founding_date" text,
	"website" text,
	"business_description" text,
	"legal_rep_name" text,
	"legal_rep_dob" text,
	"legal_rep_nationality" text,
	"legal_rep_phone" text,
	"legal_rep_email" text,
	"legal_rep_position" text,
	"legal_rep_id_type" text,
	"legal_rep_id_number" text,
	"legal_rep_id_expiry" text,
	"document_id_front" text,
	"document_id_back" text,
	"document_selfie" text,
	"document_rccm" text,
	"document_certificate" text,
	"document_proof_address" text,
	"document_bank_statement" text,
	"document_statuts" text,
	"document_license" text,
	"document_id" text,
	"funds_source" text,
	"contract_email" text,
	"contract_version" text,
	"contract_signed_at" timestamp,
	"contract_ip" text,
	"contract_user_agent" text,
	"contract_accepted" boolean DEFAULT false,
	"rejection_reason" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "mass_payout_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reference" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"mode" "transaction_mode" DEFAULT 'sandbox' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "mass_payout_jobs_reference_unique" UNIQUE("reference")
);
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"category" text DEFAULT 'activite' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text DEFAULT '/dashboard' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "operator_aggregators" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"operator_name" text NOT NULL,
	"operator_type" text DEFAULT 'mobile-money' NOT NULL,
	"aggregator_code" text NOT NULL,
	"daily_limit" numeric(18, 2) DEFAULT '1000000' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"block_deposits" boolean DEFAULT false NOT NULL,
	"block_withdrawals" boolean DEFAULT false NOT NULL,
	"block_api" boolean DEFAULT false NOT NULL,
	"block_payment_links" boolean DEFAULT false NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "operators" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
CREATE TABLE "partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "partner_type" NOT NULL,
	"country" text NOT NULL,
	"logo_url" text,
	"description" text NOT NULL,
	"website" text
);
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
CREATE TABLE "payment_link_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_link_id" integer NOT NULL,
	"merchant_id" integer NOT NULL,
	"phone" text NOT NULL,
	"amount" numeric(18, 2),
	"name" text,
	"email" text,
	"country_code" text,
	"operator" text,
	"status" text DEFAULT 'initiated' NOT NULL,
	"note" text,
	"transaction_reference" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "payment_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric(18, 2),
	"currency" text NOT NULL,
	"country_code" text NOT NULL,
	"operator" text NOT NULL,
	"fixed_amount" boolean DEFAULT true NOT NULL,
	"max_uses" integer,
	"uses" integer DEFAULT 0 NOT NULL,
	"status" "payment_link_status" DEFAULT 'active' NOT NULL,
	"mode" "api_key_env" DEFAULT 'sandbox' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_links_token_unique" UNIQUE("token")
);
CREATE TABLE "qr_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reference" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_country" text,
	"country_codes" jsonb,
	"currency" text DEFAULT 'XOF' NOT NULL,
	"type" "qr_code_type" DEFAULT 'flexible' NOT NULL,
	"amount" numeric(18, 2),
	"expires_at" timestamp,
	"status" "qr_code_status" DEFAULT 'active' NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"total_collected" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_codes_reference_unique" UNIQUE("reference")
);
CREATE TABLE "reversements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"wallet_id" integer NOT NULL,
	"country_code" text NOT NULL,
	"currency" text NOT NULL,
	"operator" text NOT NULL,
	"phone" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"fee" numeric(18, 2) NOT NULL,
	"net" numeric(18, 2) NOT NULL,
	"note" text,
	"reference" text,
	"failure_reason" text,
	"status" "reversement_status" DEFAULT 'pending' NOT NULL,
	"mode" "transaction_mode" DEFAULT 'sandbox' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" "security_event_type" NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"details" text,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "service_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "service_status" DEFAULT 'operational' NOT NULL,
	"uptime_percent" integer DEFAULT 100 NOT NULL,
	"latency_ms" integer DEFAULT 80 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "social_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "support_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"support_user_id" integer NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "support_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_settings_key_unique" UNIQUE("key")
);
CREATE TABLE "support_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT 'Support Agent' NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_users_email_unique" UNIQUE("email")
);
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"wallet_id" integer NOT NULL,
	"reference" text NOT NULL,
	"order_id" text,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"fee" numeric(18, 2) NOT NULL,
	"net_amount" numeric(18, 2) NOT NULL,
	"currency" text NOT NULL,
	"country_code" text NOT NULL,
	"operator" text NOT NULL,
	"phone" text NOT NULL,
	"description" text,
	"external_ref" text,
	"gateway_reference" text,
	"mno_reference" text,
	"mode" "transaction_mode" DEFAULT 'sandbox' NOT NULL,
	"failure_reason" text,
	"webhook_url" text,
	"webhook_last_status_code" integer,
	"webhook_last_body" text,
	"webhook_last_sent_at" timestamp,
	"webhook_signature_key" text,
	"webhook_retry_count" integer DEFAULT 0 NOT NULL,
	"webhook_next_retry_at" timestamp,
	"request_payload" text,
	"gateway_payload" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_reference_unique" UNIQUE("reference")
);
CREATE TABLE "user_allowed_ips" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ip" text NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "user_webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"url" text NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"company_name" text NOT NULL,
	"country" text DEFAULT 'OTHER' NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"account_type" "account_type" DEFAULT 'enterprise' NOT NULL,
	"merchant_code" text,
	"webhook_url" text,
	"static_ip" text,
	"payin_fee_percent" numeric(5, 2),
	"payout_fee_percent" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_merchant_code_unique" UNIQUE("merchant_code")
);
CREATE TABLE "virtual_card_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cardholder_name" text NOT NULL,
	"email" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"spending_limit" numeric(18, 2),
	"status" text DEFAULT 'active' NOT NULL,
	"card_last4" text,
	"expiry_month" integer,
	"expiry_year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"country_code" text NOT NULL,
	"currency" text NOT NULL,
	"balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"locked_balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"mode" "wallet_mode" DEFAULT 'sandbox' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "blacklisted_phones" ADD CONSTRAINT "blacklisted_phones_blocked_by_users_id_fk" FOREIGN KEY ("blocked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_blocked_by_users_id_fk" FOREIGN KEY ("blocked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "global_banners" ADD CONSTRAINT "global_banners_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "kyb_submissions" ADD CONSTRAINT "kyb_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "mass_payout_jobs" ADD CONSTRAINT "mass_payout_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_link_attempts" ADD CONSTRAINT "payment_link_attempts_payment_link_id_payment_links_id_fk" FOREIGN KEY ("payment_link_id") REFERENCES "public"."payment_links"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_link_attempts" ADD CONSTRAINT "payment_link_attempts_merchant_id_users_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reversements" ADD CONSTRAINT "reversements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reversements" ADD CONSTRAINT "reversements_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "support_replies" ADD CONSTRAINT "support_replies_contact_id_contact_submissions_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact_submissions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "support_replies" ADD CONSTRAINT "support_replies_support_user_id_support_users_id_fk" FOREIGN KEY ("support_user_id") REFERENCES "public"."support_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_allowed_ips" ADD CONSTRAINT "user_allowed_ips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "user_webhooks" ADD CONSTRAINT "user_webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "virtual_card_orders" ADD CONSTRAINT "virtual_card_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
