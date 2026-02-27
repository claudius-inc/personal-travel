import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const trips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  days: integer("days"),
  startAirport: text("start_airport"),
  endAirport: text("end_airport"),
  timeOfYear: text("time_of_year"),
  style: text("style"),
  budget: real("budget"),
  shareToken: text("share_token"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()),
});

export const itineraryItems = sqliteTable("itinerary_items", {
  id: text("id").primaryKey(),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id),
  dayIndex: integer("day_index").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location").notNull(),
  description: text("description"),
  address: text("address"),
  lat: real("lat"),
  lng: real("lng"),
  sortOrder: integer("sort_order").default(0),
  // Quick actions fields
  phoneNumber: text("phone_number"),
  website: text("website"),
  skipped: integer("skipped", { mode: "boolean" }).default(false),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

export const locationInsights = sqliteTable("location_insights", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => itineraryItems.id),
  history: text("history"),
  funFacts: text("fun_facts"),
  spontaneousIdeas: text("spontaneous_ideas"),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  description: text("description").notNull(),
  category: text("category"),
  paidBy: text("paid_by"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});
