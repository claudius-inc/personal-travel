"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Navigation,
  Clock,
  MapPin,
  Sun,
  Phone,
  Globe,
  SkipForward,
  StickyNote,
  Loader2,
} from "lucide-react";
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
  onItemUpdate?: (itemId: string, fields: Partial<ItineraryItemRow>) => Promise<void>;
};

export function TodayView({ trip, todayDayIndex, onItemUpdate }: TodayViewProps) {
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleSkip = async (itemId: string, currentSkipped: boolean | null | undefined) => {
    if (onItemUpdate) {
      await onItemUpdate(itemId, { skipped: !currentSkipped });
    }
  };

  const openNoteModal = (item: ItineraryItemRow) => {
    setActiveItemId(item.id);
    setNoteText((item as ItineraryItemRow & { notes?: string | null }).notes || "");
    setNoteModalOpen(true);
  };

  const saveNote = async () => {
    if (!activeItemId || !onItemUpdate) return;
    setSaving(true);
    try {
      await onItemUpdate(activeItemId, { notes: noteText });
      setNoteModalOpen(false);
      setActiveItemId(null);
      setNoteText("");
    } finally {
      setSaving(false);
    }
  };

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
        const extItem = item as ItineraryItemRow & {
          phoneNumber?: string | null;
          website?: string | null;
          skipped?: boolean | null;
          notes?: string | null;
        };
        const isCurrent = idx === currentIdx;
        const isNext = idx === nextIdx;
        const isSkipped = extItem.skipped;
        const minutesUntil = item.startTime
          ? parseTime(item.startTime) - nowMinutes
          : null;

        return (
          <Card
            key={item.id}
            data-testid={`today-item-${item.id}`}
            className={`transition-all ${
              isSkipped
                ? "opacity-50 border-muted bg-muted/30"
                : isCurrent
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30"
                  : isNext
                    ? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/20"
                    : "bg-card border-border"
            }`}
          >
            <CardHeader className="py-3 pb-0">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSkipped
                        ? "bg-muted text-muted-foreground line-through"
                        : isCurrent
                          ? "bg-indigo-600 text-white"
                          : isNext
                            ? "bg-amber-500 text-white"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <CardTitle className={`text-base ${isSkipped ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                      {item.location}
                    </CardTitle>
                    {item.startTime && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-sm ${isSkipped ? "line-through" : ""} text-muted-foreground`}>
                          {item.startTime}
                          {item.endTime ? ` - ${item.endTime}` : ""}
                        </span>
                        {!isSkipped && isCurrent && (
                          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            Now
                          </span>
                        )}
                        {!isSkipped && isNext && minutesUntil !== null && minutesUntil > 0 && (
                          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            {formatCountdown(minutesUntil)}
                          </span>
                        )}
                        {isSkipped && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Skipped
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <div className="flex flex-col gap-3">
                {/* Description and Address */}
                <div className="flex-1">
                  {item.description && (
                    <p className={`text-sm mb-2 ${isSkipped ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                      {item.description}
                    </p>
                  )}
                  {item.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.address}
                    </p>
                  )}
                  {/* Show notes if they exist */}
                  {extItem.notes && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-1">
                        <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{extItem.notes}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  {/* Directions - always shown */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
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

                  {/* Call - shown if phone number available */}
                  {extItem.phoneNumber && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      asChild
                      data-testid={`call-${item.id}`}
                    >
                      <a href={`tel:${extItem.phoneNumber}`}>
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}

                  {/* Book - shown if website available */}
                  {extItem.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      asChild
                      data-testid={`book-${item.id}`}
                    >
                      <a
                        href={extItem.website.startsWith("http") ? extItem.website : `https://${extItem.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Book
                      </a>
                    </Button>
                  )}

                  {/* Skip */}
                  <Button
                    variant={isSkipped ? "default" : "outline"}
                    size="sm"
                    className={`shrink-0 ${isSkipped ? "bg-muted hover:bg-muted/80" : ""}`}
                    onClick={() => handleSkip(item.id, extItem.skipped)}
                    data-testid={`skip-${item.id}`}
                  >
                    <SkipForward className="w-3 h-3 mr-1" />
                    {isSkipped ? "Unskip" : "Skip"}
                  </Button>

                  {/* Add Note */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => openNoteModal(item)}
                    data-testid={`note-${item.id}`}
                  >
                    <StickyNote className="w-3 h-3 mr-1" />
                    {extItem.notes ? "Edit note" : "Add note"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Note Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Quick Note
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note" className="text-muted-foreground">
                Add a note about this activity
              </Label>
              <Textarea
                id="note"
                placeholder="e.g., Great coffee here! Try the matcha latte..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[100px] bg-muted border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNoteModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={saveNote}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
