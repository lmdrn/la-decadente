import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "moderator", "contributor"]);
export const statusEnum = pgEnum("status", ["published", "pending", "rejected", "removed"]);
export const categoryEnum = pgEnum("category", [
  "concert",
  "club",
  "theatre",
  "danse",
  "performance",
  "expo",
  "cine",
  "atelier",
  "marche",
]);

export type Appearance = {
  palette?: "citron" | "violet" | "rouge" | "contraste";
  font?: "base" | "affiche" | "hacker" | "tattoo" | "gothique" | "pixel";
  mode?: "auto" | "day" | "night";
  trail?: "on" | "off";
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: roleEnum("role").notNull().default("contributor"),
  appearance: jsonb("appearance").$type<Appearance>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    // sha256 du jeton : le jeton brut n'est jamais stocké
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  postcode: text("postcode"),
  city: text("city").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  website: text("website"),
  description: text("description"),
  accessibility: text("accessibility").array().notNull().default([]),
  // false : le lieu n'apparaît pas dans la liste des lieux (ex. club commercial),
  // mais une soirée alternative peut y être ajoutée.
  listed: boolean("listed").notNull().default(true),
  status: statusEnum("status").notNull().default("published"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Collectifs et organisateur·ices : une entité à part, liée à des événements dans n'importe quel lieu. */
export const collectives = pgTable("collectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  scene: text("scene"), // ex. "électro", "queer, afro, inclusif"
  website: text("website"),
  instagram: text("instagram"),
  status: statusEnum("status").notNull().default("published"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventCollectives = pgTable(
  "event_collectives",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    collectiveId: uuid("collective_id")
      .notNull()
      .references(() => collectives.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.collectiveId] }), index("ec_collective_idx").on(t.collectiveId)],
);

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    lineup: text("lineup"),
    description: text("description"),
    category: categoryEnum("category").notNull(),
    genres: text("genres").array().notNull().default([]),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    priceLabel: text("price_label"),
    priceMax: integer("price_max"),
    isFree: boolean("is_free").notNull().default(false),
    isPayWhatYouWant: boolean("is_pay_what_you_want").notNull().default(false),
    ticketUrl: text("ticket_url"),
    imageUrl: text("image_url"),
    accessibility: text("accessibility").array().notNull().default([]),
    source: text("source").notNull().default("user"),
    sourceId: text("source_id"),
    status: statusEnum("status").notNull().default("published"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_starts_idx").on(t.startsAt),
    index("events_venue_idx").on(t.venueId),
    index("events_source_idx").on(t.source, t.sourceId),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);

export const moderationLog = pgTable("moderation_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // "event" | "venue"
  refId: uuid("ref_id"),
  decision: text("decision").notNull(), // "accepted" | "rejected" | "review" | "removed"
  reasons: jsonb("reasons").$type<string[]>(),
  by: text("by").notNull(), // "auto" | "filtre" | id de l'admin
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const counters = pgTable("counters", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Category = (typeof categoryEnum.enumValues)[number];
