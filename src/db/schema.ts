import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** Members, moderators and admins. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"), // member | moderator | admin
  status: text("status").notNull().default("active"), // active | suspended
  guidelinesAcceptedAt: timestamp("guidelines_accepted_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/** Opaque session tokens (only the SHA-256 hash is stored). */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Published, moderator-approved registry entries — one per plate. */
export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  displayName: text("display_name"),
  driverDescription: text("driver_description"),
  category: text("category").notNull(),
  riskLevel: text("risk_level").notNull().default("medium"), // low | medium | high | critical
  verification: text("verification").notNull().default("community"), // community | verified | official
  status: text("status").notNull().default("active"), // active | disputed | removed
  province: text("province"),
  vehicleMake: text("vehicle_make"),
  vehicleColour: text("vehicle_colour"),
  summary: text("summary").notNull(),
  photoUrl: text("photo_url"),
  sapsCaseNumber: text("saps_case_number"), // moderator-only
  reportCount: integer("report_count").notNull().default(1),
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Community submissions. Nothing is public until a moderator approves it. */
export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    recordId: integer("record_id").references(() => records.id, { onDelete: "set null" }),
    plate: text("plate").notNull(),
    category: text("category").notNull(),
    platform: text("platform"),
    driverName: text("driver_name"),
    driverDescription: text("driver_description"),
    vehicleMake: text("vehicle_make"),
    vehicleColour: text("vehicle_colour"),
    province: text("province"),
    incidentDate: text("incident_date"),
    incidentArea: text("incident_area"),
    description: text("description").notNull(),
    sapsCaseNumber: text("saps_case_number"),
    driverPhotoUrl: text("driver_photo_url"),
    evidencePhotoUrl: text("evidence_photo_url"),
    status: text("status").notNull().default("pending"), // pending | needs_info | approved | rejected
    moderatorNote: text("moderator_note"),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("reports_plate_idx").on(t.plate), index("reports_status_idx").on(t.status), index("reports_user_idx").on(t.userId)],
);

/** Right-of-reply requests from people named in a record or vehicle owners. */
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id")
    .notNull()
    .references(() => records.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  relationship: text("relationship").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull(),
  status: text("status").notNull().default("open"), // open | upheld | dismissed
  resolutionNote: text("resolution_note"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/** Plate checks. */
export const scans = pgTable(
  "scans",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    plate: text("plate").notNull(),
    outcome: text("outcome").notNull(), // match | caution | clear
    recordId: integer("record_id").references(() => records.id, { onDelete: "set null" }),
    method: text("method").notNull().default("manual"), // manual | camera | photo
    createdAt: createdAt(),
  },
  (t) => [index("scans_user_idx").on(t.userId)],
);

/** Trusted contacts for one-tap ride sharing. */
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type RecordRow = typeof records.$inferSelect;
export type ReportRow = typeof reports.$inferSelect;
export type DisputeRow = typeof disputes.$inferSelect;
export type ScanRow = typeof scans.$inferSelect;
export type ContactRow = typeof contacts.$inferSelect;
