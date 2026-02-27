"use client";

import { useMemo, useRef } from "react";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  DollarSign,
  Utensils,
  Camera,
  Share2,
  Download,
  Compass,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { TripWithDetails, ItineraryItemRow, ExpenseRow } from "@/types";

// Category keywords for auto-classification of locations
const LOCATION_CATEGORIES: Record<string, string[]> = {
  Cafes: ["cafe", "coffee", "starbucks", "bakery", "tea"],
  Museums: ["museum", "gallery", "exhibition", "art"],
  Restaurants: ["restaurant", "food", "dining", "eat", "brunch", "lunch", "dinner"],
  Temples: ["temple", "shrine", "church", "mosque", "cathedral", "monastery"],
  Parks: ["park", "garden", "forest", "nature", "trail", "hiking"],
  Shopping: ["mall", "market", "shop", "store", "outlet"],
  Landmarks: ["tower", "monument", "palace", "castle", "bridge", "statue"],
  Beaches: ["beach", "coast", "sea", "ocean", "bay"],
  Entertainment: ["cinema", "theater", "show", "concert", "bar", "club"],
};

// Expense category keywords (reuse from ExpenseAnalytics pattern)
const EXPENSE_CATEGORIES: Record<string, string[]> = {
  Food: ["restaurant", "food", "lunch", "dinner", "breakfast", "cafe", "coffee", "meal", "eat", "brunch", "snack", "bar", "drink"],
  Transport: ["taxi", "uber", "lyft", "bus", "train", "metro", "subway", "flight", "gas", "fuel", "car", "rental", "parking", "grab", "bolt"],
  Accommodation: ["hotel", "hostel", "airbnb", "lodge", "room", "stay", "booking", "resort", "motel", "apartment"],
  Activities: ["museum", "tour", "ticket", "entry", "admission", "show", "concert", "excursion", "park", "temple", "gallery", "attraction"],
  Shopping: ["shop", "souvenir", "market", "gift", "clothes", "store", "mall", "buy", "purchase"],
};

function categorizeLocation(location: string): string {
  const lower = location.toLowerCase();
  for (const [cat, keywords] of Object.entries(LOCATION_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Other";
}

function categorizeExpense(description: string, category?: string | null): string {
  if (category) return category;
  const lower = description.toLowerCase();
  for (const [cat, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Other";
}

// Estimate distance between two points using Haversine formula
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type TripSummaryProps = {
  trip: TripWithDetails;
};

export function TripSummary({ trip }: TripSummaryProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate trip duration
  const tripDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return trip.days || 0;
    return differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
  }, [trip.startDate, trip.endDate, trip.days]);

  // Calculate total distance traveled
  const totalDistance = useMemo(() => {
    const itemsWithCoords = trip.itineraryItems
      .filter((item) => item.lat && item.lng)
      .sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });

    let distance = 0;
    for (let i = 1; i < itemsWithCoords.length; i++) {
      const prev = itemsWithCoords[i - 1];
      const curr = itemsWithCoords[i];
      distance += haversineDistance(prev.lat!, prev.lng!, curr.lat!, curr.lng!);
    }
    return distance;
  }, [trip.itineraryItems]);

  // Total expenses and by category
  const expenseStats = useMemo(() => {
    const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const exp of trip.expenses) {
      const cat = categorizeExpense(exp.description, exp.category);
      byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
    }
    const sorted = Object.entries(byCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
    return { total, byCategory: sorted };
  }, [trip.expenses]);

  // Most visited location category
  const locationStats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const item of trip.itineraryItems) {
      const cat = categorizeLocation(item.location);
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    const sorted = Object.entries(byCategory)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return {
      totalPlaces: trip.itineraryItems.length,
      topCategory: sorted[0]?.name || "N/A",
      topCount: sorted[0]?.count || 0,
      byCategory: sorted,
    };
  }, [trip.itineraryItems]);

  // Places per day
  const placesPerDay = tripDays > 0 ? locationStats.totalPlaces / tripDays : 0;

  // Share trip report
  const handleShare = async () => {
    const text = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${trip.name} - Trip Summary`,
          text,
        });
      } catch {
        // User cancelled or share failed, fallback to clipboard
        await navigator.clipboard.writeText(text);
        alert("Trip summary copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Trip summary copied to clipboard!");
    }
  };

  const generateShareText = () => {
    const lines = [
      `✈️ ${trip.name}`,
      "",
      `📅 ${tripDays} days`,
      `📍 ${locationStats.totalPlaces} places visited`,
      `🗺️ ${totalDistance.toFixed(1)} km traveled`,
      `💰 $${expenseStats.total.toFixed(0)} spent`,
      "",
      `Top category: ${locationStats.topCategory} (${locationStats.topCount} visits)`,
      "",
      "#travel #memories",
    ];
    return lines.join("\n");
  };

  // Download as image (placeholder - would need html2canvas in real implementation)
  const handleDownloadCard = async () => {
    const text = generateShareText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.name.replace(/\s+/g, "-")}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Cafes: <Utensils className="w-4 h-4" />,
    Museums: <Camera className="w-4 h-4" />,
    Restaurants: <Utensils className="w-4 h-4" />,
    Parks: <Compass className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6" data-testid="trip-summary">
      {/* Trip Report Card */}
      <Card
        ref={cardRef}
        className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-border shadow-lg overflow-hidden"
        data-testid="trip-summary-card"
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {trip.name}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                {trip.startDate && trip.endDate ? (
                  <>
                    {format(new Date(trip.startDate), "MMM d")} -{" "}
                    {format(new Date(trip.endDate), "MMM d, yyyy")}
                  </>
                ) : (
                  "Trip Completed"
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="text-muted-foreground"
              >
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCard}
                className="text-muted-foreground"
              >
                <Download className="w-4 h-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-4 bg-background/60 rounded-xl" data-testid="stat-days">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
              <p className="text-2xl font-bold text-foreground">{tripDays}</p>
              <p className="text-xs text-muted-foreground">Days</p>
            </div>
            <div className="text-center p-4 bg-background/60 rounded-xl" data-testid="stat-places">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-bold text-foreground">{locationStats.totalPlaces}</p>
              <p className="text-xs text-muted-foreground">Places</p>
            </div>
            <div className="text-center p-4 bg-background/60 rounded-xl" data-testid="stat-distance">
              <Compass className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-foreground">{totalDistance.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">km traveled</p>
            </div>
            <div className="text-center p-4 bg-background/60 rounded-xl" data-testid="stat-spent">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-foreground">${expenseStats.total.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Spent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expenses by Category */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Spending Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenseStats.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded</p>
            ) : (
              expenseStats.byCategory.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{cat.name}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    ${cat.amount.toFixed(0)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Places by Category */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Places Visited
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locationStats.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No places recorded</p>
            ) : (
              locationStats.byCategory.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex justify-between items-center">
                  <span className="text-sm text-foreground flex items-center gap-2">
                    {CATEGORY_ICONS[cat.name] || <MapPin className="w-4 h-4" />}
                    {cat.name}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {cat.count} {cat.count === 1 ? "place" : "places"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trip Highlights */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Trip Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-semibold text-foreground">
                {placesPerDay.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Places/Day</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-semibold text-foreground">
                {locationStats.topCategory}
              </p>
              <p className="text-xs text-muted-foreground">Top Category</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-semibold text-foreground">
                ${tripDays > 0 ? (expenseStats.total / tripDays).toFixed(0) : 0}
              </p>
              <p className="text-xs text-muted-foreground">Avg/Day</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-semibold text-foreground">
                {trip.style || "Adventure"}
              </p>
              <p className="text-xs text-muted-foreground">Trip Style</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
