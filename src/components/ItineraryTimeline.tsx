"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, MapPin } from "lucide-react";
import type { ItineraryItemRow } from "@/types";
import type { Insight } from "@/types";

type ItineraryTimelineProps = {
  items: ItineraryItemRow[];
  /** If provided, enables AI Insights buttons on each item */
  onInsightClick?: (itemId: string) => void;
  insights?: Record<string, Insight>;
  loadingInsights?: Record<string, boolean>;
  /** Accent color for the day badges. Defaults to indigo. */
  accentColor?: "indigo" | "teal";
};

export function ItineraryTimeline({
  items,
  onInsightClick,
  insights = {},
  loadingInsights = {},
  accentColor = "indigo",
}: ItineraryTimelineProps) {
  // Group items by day
  const itemsByDay = items.reduce(
    (acc: Record<string, ItineraryItemRow[]>, item) => {
      const dIndex = item.dayIndex.toString();
      if (!acc[dIndex]) acc[dIndex] = [];
      acc[dIndex].push(item);
      return acc;
    },
    {} as Record<string, ItineraryItemRow[]>,
  );

  const badgeBg = accentColor === "teal" ? "bg-teal-100" : "bg-indigo-100";
  const badgeText =
    accentColor === "teal" ? "text-teal-700" : "text-indigo-700";

  if (Object.keys(itemsByDay).length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No itinerary items yet. Upload a schedule or wait for the agent.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {Object.keys(itemsByDay)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((day) => (
          <div key={day} className="relative">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-foreground">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full ${badgeBg} ${badgeText} text-sm font-bold`}
              >
                D{day}
              </span>
              Day {day}
            </h3>
            <div className="space-y-4 pl-4 border-l-2 border-border ml-4">
              {itemsByDay[day].map((item) => (
                <Card
                  key={item.id}
                  className="bg-card border-border shadow-sm relative -left-4 w-[calc(100%+16px)]"
                >
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-card-foreground">
                          {item.location}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {item.startTime} • {item.description}
                        </CardDescription>
                      </div>
                      {onInsightClick && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 bg-card dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
                          onClick={() => onInsightClick(item.id)}
                          disabled={loadingInsights[item.id]}
                        >
                          {loadingInsights[item.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          AI Insights
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {/* Insights Dropdown */}
                  {insights[item.id] && (
                    <CardContent className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-b-xl border-t border-indigo-100 dark:border-indigo-900 py-4 mt-2">
                      <div className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                            🏛️ History
                          </h4>
                          <p className="text-muted-foreground leading-relaxed mt-1">
                            {insights[item.id].history}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            💡 Fun Facts
                          </h4>
                          <p className="text-muted-foreground leading-relaxed mt-1">
                            {insights[item.id].funFacts}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            🚶 Spontaneous Ideas
                          </h4>
                          <p className="text-muted-foreground leading-relaxed mt-1">
                            {insights[item.id].spontaneousIdeas}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
