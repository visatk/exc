import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  address: text("address"),
  country: text("country"),
  role: text("role").notNull().default("user"), // 'admin' or 'user'
  balance: real("balance").notNull().default(0), // Site balance for refunds
  discountPercent: real("discount_percent").notNull().default(0),
  referralCode: text("referral_code").unique().$defaultFn(() => crypto.randomUUID().slice(0, 8)),
  referredBy: text("referred_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const gateways = sqliteTable("gateways", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(), // e.g., BKash-Personal, USDT TRC20
  type: text("type").notNull(), // 'fiat' or 'crypto'
  currency: text("currency").notNull(), // 'BDT', 'USD'
  logoUrl: text("logo_url"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const exchangePairs = sqliteTable("exchange_pairs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromGatewayId: text("from_gateway_id").notNull().references(() => gateways.id),
  toGatewayId: text("to_gateway_id").notNull().references(() => gateways.id),
  rate: real("rate").notNull(), // e.g., 1 USD = 122 BDT
  minAmount: real("min_amount").notNull(),
  maxAmount: real("max_amount").notNull(),
  reserve: real("reserve").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const exchanges = sqliteTable("exchanges", {
  id: text("id").primaryKey(), // Generated as e.g. 339417856
  userId: text("user_id").references(() => users.id), // Nullable for guests
  pairId: text("pair_id").notNull().references(() => exchangePairs.id),
  amountFrom: real("amount_from").notNull(),
  amountTo: real("amount_to").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'waiting for confirmation', 'confirmed', 'cancelled'
  userDetails: text("user_details", { mode: "json" }), // JSON: { name, email, phone, destAccount }
  paymentProofUrl: text("payment_proof_url"),
  txId: text("tx_id"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  exchangeId: text("exchange_id").references(() => exchanges.id),
  rating: integer("rating").notNull(), // 1 to 5
  comment: text("comment"),
  status: text("status").notNull().default("published"), // 'published', 'hidden'
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const referralEarnings = sqliteTable("referral_earnings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id), // The referrer
  exchangeId: text("exchange_id").notNull().references(() => exchanges.id), // The exchange that triggered it
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'paid'
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
