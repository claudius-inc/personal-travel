"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseRow } from "@/types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "restaurant",
    "food",
    "lunch",
    "dinner",
    "breakfast",
    "cafe",
    "coffee",
    "meal",
    "eat",
    "brunch",
    "snack",
    "bar",
    "drink",
    "beer",
    "wine",
    "pizza",
    "sushi",
    "burger",
  ],
  Transport: [
    "taxi",
    "uber",
    "lyft",
    "bus",
    "train",
    "metro",
    "subway",
    "flight",
    "gas",
    "fuel",
    "car",
    "rental",
    "parking",
    "toll",
    "ferry",
    "ride",
    "grab",
    "bolt",
  ],
  Accommodation: [
    "hotel",
    "hostel",
    "airbnb",
    "lodge",
    "room",
    "stay",
    "booking",
    "resort",
    "motel",
    "apartment",
  ],
  Activities: [
    "museum",
    "tour",
    "ticket",
    "entry",
    "admission",
    "show",
    "concert",
    "excursion",
    "park",
    "temple",
    "gallery",
    "attraction",
    "dive",
    "hike",
    "spa",
  ],
  Shopping: [
    "shop",
    "souvenir",
    "market",
    "gift",
    "clothes",
    "store",
    "mall",
    "buy",
    "purchase",
  ],
};

function categorize(description: string, category?: string | null): string {
  if (category) return category;
  const lower = description.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Other";
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500",
  Transport: "bg-blue-500",
  Accommodation: "bg-purple-500",
  Activities: "bg-emerald-500",
  Shopping: "bg-pink-500",
  Other: "bg-gray-400",
};

type ExpenseAnalyticsProps = {
  expenses: ExpenseRow[];
  budget: number;
};

export function ExpenseAnalytics({ expenses, budget }: ExpenseAnalyticsProps) {
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );

  const utilizationPct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = categorize(exp.description, exp.category);
      cats[cat] = (cats[cat] || 0) + exp.amount;
    }
    return Object.entries(cats)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const maxCategoryAmount = Math.max(
    ...categoryBreakdown.map((c) => c.amount),
    1,
  );

  const dailySpending = useMemo(() => {
    const daily: Record<string, number> = {};
    for (const exp of expenses) {
      const dateStr = new Date(exp.date).toLocaleDateString();
      daily[dateStr] = (daily[dateStr] || 0) + exp.amount;
    }
    return Object.entries(daily)
      .map(([date, amount]) => ({ date, amount }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [expenses]);

  const dailyAvg =
    dailySpending.length > 0 ? totalSpent / dailySpending.length : 0;

  if (expenses.length === 0) return null;

  const gaugeColor =
    utilizationPct < 60
      ? "bg-emerald-500"
      : utilizationPct < 85
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="space-y-6" data-testid="expense-analytics">
      {/* Budget Utilization Gauge */}
      {budget > 0 && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground font-semibold">
                ${totalSpent.toFixed(0)} / ${budget.toFixed(0)}
              </span>
              <span className="text-muted-foreground">
                {utilizationPct.toFixed(0)}%
              </span>
            </div>
            <div
              className="w-full h-3 bg-muted rounded-full overflow-hidden"
              data-testid="budget-gauge"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${gaugeColor}`}
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Category Breakdown */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} data-testid={`category-${cat.name}`}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{cat.name}</span>
                  <span className="text-muted-foreground font-medium">
                    ${cat.amount.toFixed(0)}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[cat.name] || "bg-gray-400"}`}
                    style={{
                      width: `${(cat.amount / maxCategoryAmount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Daily Stats */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-3 bg-muted rounded-lg gap-1">
              <span className="text-sm text-muted-foreground">Daily Avg</span>
              <span className="text-lg font-bold text-foreground">
                ${dailyAvg.toFixed(0)}
              </span>
            </div>
            <div className="space-y-2">
              {dailySpending.map((day) => (
                <div
                  key={day.date}
                  className="flex justify-between text-sm"
                  data-testid={`daily-${day.date}`}
                >
                  <span className="text-muted-foreground">{day.date}</span>
                  <span className="text-foreground font-medium">
                    ${day.amount.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
