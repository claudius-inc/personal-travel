import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import type {
  trips,
  itineraryItems,
  expenses,
  locationInsights,
} from "@/db/schema";

// ─── DB-derived types ──────────────────────────────────────
export type TripRow = InferSelectModel<typeof trips>;
export type ItineraryItemRow = InferSelectModel<typeof itineraryItems>;
export type ExpenseRow = InferSelectModel<typeof expenses>;
export type LocationInsightRow = InferSelectModel<typeof locationInsights>;

/** Composite trip with related data (returned by GET /api/trips/:id) */
export type TripWithDetails = TripRow & {
  itineraryItems: ItineraryItemRow[];
  expenses: ExpenseRow[];
};

/** Insight summary returned by /api/insights/:itemId */
export type Insight = {
  history: string;
  funFacts: string;
  spontaneousIdeas: string;
};

// ─── Zod validation schemas ────────────────────────────────

export const createTripSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  days: z.union([z.string(), z.number()]).optional().default(""),
  startAirport: z.string().optional().default(""),
  endAirport: z.string().optional().default(""),
  timeOfYear: z.string().optional().default(""),
  style: z.string().optional().default("solo"),
  budget: z.number().min(0).optional().default(0),
  isFlexible: z.boolean().optional().default(false),
});

export const updateTripSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.union([z.string(), z.number()]).optional(),
  startAirport: z.string().optional(),
  endAirport: z.string().optional(),
  timeOfYear: z.string().optional(),
  style: z.string().optional(),
  budget: z.number().min(0).optional(),
});

export const createItemSchema = z.object({
  dayIndex: z.number().int().min(0),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(1).max(3).optional().default("USD"),
  description: z.string().min(1, "Description is required"),
  paidBy: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

export const createInsightSchema = z.object({
  history: z.string().optional(),
  funFacts: z.string().optional(),
  spontaneousIdeas: z.string().optional(),
});
