"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UploadCloud,
  Loader2,
  Plus,
  MapPin,
  Receipt,
  CalendarDays,
  Trash2,
  Share2,
  MessageSquare,
  Sun,
  Link as LinkIcon,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ItineraryTimeline } from "@/components/ItineraryTimeline";
import { ChatPanel } from "@/components/ChatPanel";
import { TodayView } from "@/components/TodayView";
import { ExpenseAnalytics } from "@/components/ExpenseAnalytics";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { TripSummary } from "@/components/TripSummary";
import { ExportMenu } from "@/components/ExportMenu";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import type {
  TripWithDetails,
  Insight,
  ItineraryItemRow,
  ExpenseRow,
} from "@/types";
import type { MapMarker } from "@/components/InteractiveMap";

const MapWidget = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
});

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "SGD", "AUD", "CAD", "THB"];

export default function TripDetailsClient({
  initialTrip,
}: {
  initialTrip: TripWithDetails;
}) {
  const router = useRouter();
  const [trip, setTrip] = useState<TripWithDetails>(initialTrip);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [insights, setInsights] = useState<Record<string, Insight>>({});
  const [loadingInsights, setLoadingInsights] = useState<
    Record<string, boolean>
  >({});

  const [newExpense, setNewExpense] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    currency: "USD",
  });
  const [addingExpense, setAddingExpense] = useState(false);

  // Map-Itinerary linking
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // URL import
  const [importUrl, setImportUrl] = useState("");
  const [importingUrl, setImportingUrl] = useState(false);

  // Today view
  const { isOnTrip, todayDayIndex } = useMemo(() => {
    if (!trip.startDate || !trip.endDate) {
      return { isOnTrip: false, todayDayIndex: 0 };
    }
    const now = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    now.setHours(12, 0, 0, 0);

    if (now >= start && now <= end) {
      const diffMs = now.getTime() - start.getTime();
      const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      return { isOnTrip: true, todayDayIndex: dayIndex };
    }
    return { isOnTrip: false, todayDayIndex: 0 };
  }, [trip.startDate, trip.endDate]);

  const fetchTripManual = async () => {
    try {
      const res = await fetch(`/api/trips/${trip.id}`);
      const data = await res.json();
      setTrip(data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/trips/${trip.id}/parse-itinerary`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) await fetchTripManual();
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  const handleImportUrl = async () => {
    if (!importUrl.trim()) return;
    setImportingUrl(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/import-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      if (res.ok) {
        await fetchTripManual();
        setImportUrl("");
      }
    } finally {
      setImportingUrl(false);
    }
  };

  const fetchOrGenerateInsight = async (itemId: string) => {
    if (insights[itemId] || loadingInsights[itemId]) return;

    setLoadingInsights((prev) => ({ ...prev, [itemId]: true }));

    try {
      const res = await fetch(`/api/insights/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setInsights((prev) => ({ ...prev, [itemId]: data }));
      } else {
        const genRes = await fetch(`/api/insights/${itemId}/generate`, {
          method: "POST",
        });
        if (genRes.ok) {
          const genData = await genRes.json();
          setInsights((prev) => ({ ...prev, [itemId]: genData }));
        }
      }
    } finally {
      setLoadingInsights((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Inline edit handlers
  const handleItemUpdate = async (
    itemId: string,
    fields: Partial<ItineraryItemRow>,
  ) => {
    const prevItems = trip.itineraryItems;
    // Optimistic update
    setTrip((prev) => ({
      ...prev,
      itineraryItems: prev.itineraryItems.map((item) =>
        item.id === itemId ? { ...item, ...fields } : item,
      ),
    }));

    try {
      const res = await fetch(`/api/trips/${trip.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Rollback
      setTrip((prev) => ({ ...prev, itineraryItems: prevItems }));
    }
  };

  const handleItemDelete = async (itemId: string) => {
    const prevItems = trip.itineraryItems;
    // Optimistic remove
    setTrip((prev) => ({
      ...prev,
      itineraryItems: prev.itineraryItems.filter((item) => item.id !== itemId),
    }));

    try {
      const res = await fetch(`/api/trips/${trip.id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Rollback
      setTrip((prev) => ({ ...prev, itineraryItems: prevItems }));
    }
  };

  // Reorder handler
  const handleReorder = async (
    items: Array<{ id: string; dayIndex: number; sortOrder: number }>,
  ) => {
    const prevItems = trip.itineraryItems;
    // Optimistic update
    setTrip((prev) => ({
      ...prev,
      itineraryItems: prev.itineraryItems.map((item) => {
        const update = items.find((u) => u.id === item.id);
        if (update) {
          return {
            ...item,
            dayIndex: update.dayIndex,
            sortOrder: update.sortOrder,
          };
        }
        return item;
      }),
    }));

    try {
      const res = await fetch(`/api/trips/${trip.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Rollback
      setTrip((prev) => ({ ...prev, itineraryItems: prevItems }));
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingExpense(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          date: newExpense.date,
          currency: newExpense.currency,
        }),
      });
      if (res.ok) {
        await fetchTripManual();
        setNewExpense({
          amount: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          currency: newExpense.currency,
        });
      }
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this trip? This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const res = await fetch(
      `/api/trips/${trip.id}/expenses?expenseId=${expenseId}`,
      {
        method: "DELETE",
      },
    );
    if (res.ok) await fetchTripManual();
  };

  const handleVoiceExpense = async (parsed: {
    amount: number;
    description: string;
    currency: string;
  }) => {
    setAddingExpense(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed.amount,
          description: parsed.description,
          date: new Date().toISOString().split("T")[0],
          currency: parsed.currency,
        }),
      });
      if (res.ok) {
        await fetchTripManual();
      }
    } finally {
      setAddingExpense(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!trip.shareToken) return;
    const shareUrl = `${window.location.origin}/trip/shared/${trip.shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    alert("Share link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-20 text-xl font-medium text-foreground">
        Trip not found.
      </div>
    );
  }

  // Build markers from itinerary items for the map (include id for linking)
  const mapMarkers: MapMarker[] = trip.itineraryItems
    .filter((item: ItineraryItemRow) => item.lat && item.lng)
    .map((item: ItineraryItemRow) => ({
      lat: item.lat!,
      lng: item.lng!,
      label: item.location,
      id: item.id,
    }));

  const totalExpense = trip.expenses.reduce(
    (sum: number, e: ExpenseRow) => sum + e.amount,
    0,
  );

  return (
    <main className="container mx-auto max-w-6xl py-10 px-3 sm:px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/"
          className="text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <header className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              {trip.name}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {trip.startDate && trip.endDate ? (
                <>
                  {format(new Date(trip.startDate as string | Date), "MMMM do")}{" "}
                  -{" "}
                  {format(
                    new Date(trip.endDate as string | Date),
                    "MMMM do, yyyy",
                  )}{" "}
                  • {trip.style}
                </>
              ) : (
                <span>Flexible planning • {trip.style}</span>
              )}
            </p>
          </div>
          <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3">
            <WeatherWidget destination={trip.name} />
            <div>
              <span className="block text-sm text-muted-foreground">
                Total Budget
              </span>
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                ${trip.budget || 0}
              </span>
            </div>
            {/* Presence Indicator */}
            <PresenceIndicator tripId={trip.id} shareToken={trip.shareToken} />
            
            <div className="flex gap-2">
              <ExportMenu trip={trip} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
                className="text-muted-foreground"
              >
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteTrip}
                disabled={deleting}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue={isOnTrip ? "today" : "itinerary"} className="w-full">
        <div className="overflow-x-auto -mx-3 px-3 sm:-mx-0 sm:px-0">
        <TabsList
          className="flex w-max sm:w-full max-w-3xl bg-muted border border-border rounded-lg p-1 mb-8"
        >
          {isOnTrip && (
            <TabsTrigger
              value="today"
              className="rounded-md data-[state=active]:bg-background data-[state=active]:text-amber-600 data-[state=active]:shadow-sm text-muted-foreground flex items-center justify-center gap-2 px-2 sm:px-4"
            >
              <Sun className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Today</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="itinerary"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-muted-foreground flex items-center justify-center gap-2 px-2 sm:px-4"
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Itinerary</span>
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-muted-foreground flex items-center justify-center gap-2 px-2 sm:px-4"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Map</span>
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-muted-foreground flex items-center justify-center gap-2 px-2 sm:px-4"
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-muted-foreground flex items-center justify-center gap-2 px-2 sm:px-4"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">AI Chat</span>
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-muted-foreground flex items-center justify-center gap-2 px-2 sm:px-4"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Today Tab */}
        {isOnTrip && (
          <TabsContent
            value="today"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <TodayView trip={trip} todayDayIndex={todayDayIndex} onItemUpdate={handleItemUpdate} />
          </TabsContent>
        )}

        {/* Itinerary Tab — side-by-side with map */}
        <TabsContent
          value="itinerary"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Upload + Import Section */}
          <Card className="bg-card border-border border-dashed shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">
                Agent Itinerary Parse
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Upload a photo or PDF of an itinerary. OpenClaw AI will extract
                the schedule.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="bg-muted border-border max-w-full sm:max-w-xs text-foreground"
                />
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UploadCloud className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? "Extracting..." : "Parse File"}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md w-full">
                  <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Paste a URL to import (blog, article, itinerary)"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="bg-muted border-border text-foreground"
                    data-testid="import-url-input"
                  />
                </div>
                <Button
                  onClick={handleImportUrl}
                  disabled={!importUrl.trim() || importingUrl}
                  variant="outline"
                  data-testid="import-url-button"
                >
                  {importingUrl ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UploadCloud className="w-4 h-4 mr-2" />
                  )}
                  {importingUrl ? "Importing..." : "Import URL"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side: Itinerary + Map */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
            <div className="md:col-span-3">
              <ItineraryTimeline
                items={trip.itineraryItems}
                onInsightClick={fetchOrGenerateInsight}
                insights={insights}
                loadingInsights={loadingInsights}
                editable={true}
                onItemUpdate={handleItemUpdate}
                onItemDelete={handleItemDelete}
                onReorder={handleReorder}
                selectedItemId={selectedItemId}
                onItemSelect={setSelectedItemId}
              />
            </div>
            <div className="md:col-span-2 md:sticky md:top-4 md:self-start">
              <Card className="bg-card border-border overflow-hidden shadow-sm">
                <MapWidget
                  destination={trip.name}
                  markers={mapMarkers}
                  selectedMarkerId={selectedItemId}
                  onMarkerClick={setSelectedItemId}
                />
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="map"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="bg-card border-border overflow-hidden relative shadow-sm">
            <MapWidget
              destination={trip.name}
              markers={mapMarkers}
              selectedMarkerId={selectedItemId}
              onMarkerClick={setSelectedItemId}
            />
          </Card>
        </TabsContent>

        <TabsContent
          value="expenses"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Expense Analytics */}
          <ExpenseAnalytics
            expenses={trip.expenses}
            budget={trip.budget ?? 0}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mt-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card border border-border p-6 rounded-2xl shadow-sm gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Total Spent</p>
                  <h3 className="text-2xl sm:text-4xl font-bold mt-1 text-foreground">
                    ${totalExpense.toFixed(2)}
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-muted-foreground text-sm">Remaining</p>
                  <h3
                    className={`text-lg sm:text-2xl font-bold mt-1 ${(trip.budget ?? 0) - totalExpense < 0 ? "text-red-500" : "text-emerald-500"}`}
                  >
                    ${((trip.budget ?? 0) - totalExpense).toFixed(2)}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <h4 className="font-medium text-lg mb-4 text-foreground">
                  Recent Transactions
                </h4>
                {trip.expenses.length === 0 ? (
                  <p className="text-muted-foreground">
                    No expenses recorded yet.
                  </p>
                ) : (
                  trip.expenses.map((exp: ExpenseRow) => (
                    <div
                      key={exp.id}
                      className="flex justify-between items-center p-4 rounded-xl bg-card border border-border hover:border-foreground/20 transition shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-card-foreground">
                          {exp.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(exp.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-card-foreground">
                          {exp.currency} {exp.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <CardTitle className="text-card-foreground">
                      Add Expense
                    </CardTitle>
                    <ReceiptScanner
                      onDataExtracted={(data) => {
                        setNewExpense({
                          amount: data.amount,
                          description: data.description,
                          date: data.date,
                          currency: data.currency,
                        });
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Voice Input Section */}
                  <div className="pb-4 border-b border-border">
                    <VoiceExpenseInput
                      onExpenseParsed={handleVoiceExpense}
                      defaultCurrency={newExpense.currency}
                    />
                  </div>

                  {/* Manual Form */}
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={newExpense.amount}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            amount: e.target.value,
                          })
                        }
                        className="bg-muted border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Currency</Label>
                      <select
                        value={newExpense.currency}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            currency: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-border bg-muted text-foreground px-3 py-2 text-sm"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Description
                      </Label>
                      <Input
                        required
                        value={newExpense.description}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            description: e.target.value,
                          })
                        }
                        className="bg-muted border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        required
                        value={newExpense.date}
                        onChange={(e) =>
                          setNewExpense({ ...newExpense, date: e.target.value })
                        }
                        className="bg-muted border-border text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={addingExpense}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 mt-4 shadow-sm"
                    >
                      {addingExpense ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}{" "}
                      Add
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent
          value="chat"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <ChatPanel tripId={trip.id} onItemsAdded={fetchTripManual} />
        </TabsContent>

        {/* Trip Summary Tab */}
        <TabsContent
          value="summary"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <TripSummary trip={trip} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
