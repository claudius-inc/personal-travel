"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, Clock, MapPin, Sun } from "lucide-react";
import type { TripWithDetails, ItineraryItemRow } from "@/types";

function parseTime(timeStr: string): number {
  // Parse "9:00 AM", "14:00", "2:30 PM" etc. into minutes from midnight
  const cleaned = timeStr.trim().toUpperCase();
  const ampmMatch = cleaned.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/);
  if (!ampmMatch) return 0;
  let hours = parseInt(ampmMatch[1]);
  const minutes = parseInt(ampmMatch[2] || "0");
  const period = ampmMatch[3];
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "Now";
  if (minutes < 60) return `in ${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
}

type TodayViewProps = {
  trip: TripWithDetails;
  todayDayIndex: number;
};

export function TodayView({ trip, todayDayIndex }: TodayViewProps) {
  const todayItems = useMemo(() => {
    return trip.itineraryItems
      .filter((item: ItineraryItemRow) => item.dayIndex === todayDayIndex)
      .sort((a: ItineraryItemRow, b: ItineraryItemRow) => {
        const orderA = a.sortOrder ?? 0;
        const orderB = b.sortOrder ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        if (a.startTime && b.startTime)
          return parseTime(a.startTime) - parseTime(b.startTime);
        return 0;
      });
  }, [trip.itineraryItems, todayDayIndex]);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Find current and next activities
  const currentIdx = todayItems.findIndex((item, idx) => {
    if (!item.startTime) return false;
    const start = parseTime(item.startTime);
    const nextItem = todayItems[idx + 1];
    const end = nextItem?.startTime
      ? parseTime(nextItem.startTime)
      : start + 120;
    return nowMinutes >= start && nowMinutes < end;
  });

  const nextIdx = todayItems.findIndex((item) => {
    if (!item.startTime) return false;
    return parseTime(item.startTime) > nowMinutes;
  });

  if (todayItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Sun className="w-12 h-12 mx-auto text-amber-400 mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Activities Today
        </h3>
        <p className="text-muted-foreground">
          Day {todayDayIndex} has no items planned. Use AI Chat to add some!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Sun className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-foreground">
          Day {todayDayIndex} — {todayItems.length} activit
          {todayItems.length === 1 ? "y" : "ies"}
        </h3>
      </div>

      {todayItems.map((item, idx) => {
        const isCurrent = idx === currentIdx;
        const isNext = idx === nextIdx;
        const minutesUntil = item.startTime
          ? parseTime(item.startTime) - nowMinutes
          : null;

        return (
          <Card
            key={item.id}
            data-testid={`today-item-${item.id}`}
            className={`transition-all ${
              isCurrent
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30"
                : isNext
                  ? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/20"
                  : "bg-card border-border"
            }`}
          >
            <CardHeader className="py-3 pb-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : isNext
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base text-card-foreground">
                      {item.location}
                    </CardTitle>
                    {item.startTime && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {item.startTime}
                          {item.endTime ? ` - ${item.endTime}` : ""}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            Now
                          </span>
                        )}
                        {isNext && minutesUntil !== null && minutesUntil > 0 && (
                          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            {formatCountdown(minutesUntil)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                  )}
                  {item.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.address}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 ml-4"
                  asChild
                  data-testid={`directions-${item.id}`}
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address || item.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Directions
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
