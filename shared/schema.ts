import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "staff", "admin"] }).notNull().default("student"),
  displayName: text("display_name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const machines = pgTable("machines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type", { enum: ["washer", "dryer"] }).notNull(),
  location: text("location").notNull(),
  status: text("status", { enum: ["available", "in_use", "maintenance"] }).notNull().default("available"),
  cycleTimeMinutes: integer("cycle_time_minutes").notNull().default(30),
});

export const laundrySessions = pgTable("laundry_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  machineId: varchar("machine_id").notNull().references(() => machines.id),
  startedAt: timestamp("started_at").defaultNow(),
  endsAt: timestamp("ends_at"),
  completedAt: timestamp("completed_at"),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).notNull().default("active"),
});

export const lostItems = pgTable("lost_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  clothingType: text("clothing_type").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["searching", "matched", "resolved"] }).notNull().default("searching"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const foundItems = pgTable("found_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportedByUserId: varchar("reported_by_user_id").notNull().references(() => users.id),
  clothingType: text("clothing_type").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  status: text("status", { enum: ["unclaimed", "claimed", "resolved"] }).notNull().default("unclaimed"),
  claimedByUserId: varchar("claimed_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "success", "warning", "match"] }).notNull().default("info"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const itemMatches = pgTable("item_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lostItemId: varchar("lost_item_id").notNull().references(() => lostItems.id),
  foundItemId: varchar("found_item_id").notNull().references(() => foundItems.id),
  matchPercentage: integer("match_percentage").notNull(),
  reasoning: text("reasoning"),
  notified: boolean("notified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  displayName: true,
  email: true,
}).refine(
  (data) => {
    // Password must be at least 8 characters
    if (data.password.length < 8) return false;
    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(data.password)) return false;
    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(data.password)) return false;
    // Must contain at least one number
    if (!/[0-9]/.test(data.password)) return false;
    return true;
  },
  {
    message: "Password must be at least 8 characters with uppercase, lowercase, and numbers",
    path: ["password"],
  }
);

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(255),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["student", "staff", "admin"]).default("student"),
});

export const insertMachineSchema = createInsertSchema(machines).omit({ id: true });

export const startSessionSchema = z.object({
  machineId: z.string().min(1, "Machine ID is required"),
});

export const insertLostItemSchema = z.object({
  clothingType: z.string().min(1, "Clothing type is required").max(100),
  color: z.string().min(1, "Color is required").max(100),
  description: z.string().min(1, "Description is required").max(1000),
});

export const insertFoundItemSchema = z.object({
  clothingType: z.string().min(1, "Clothing type is required").max(100),
  color: z.string().min(1, "Color is required").max(100),
  description: z.string().min(1, "Description is required").max(1000),
  location: z.string().min(1, "Location is required").max(255),
  imageUrl: z.string().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().optional().refine(
    (val) => !val || (val.length >= 1 && val.length <= 200),
    "Display name must be 1-200 characters"
  ),
  email: z.string().email().max(255).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type LaundrySession = typeof laundrySessions.$inferSelect;
export type LostItem = typeof lostItems.$inferSelect;
export type FoundItem = typeof foundItems.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
