"use client";

import { useEffect, useState, use } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UploadCloud,
  Loader2,
  Sparkles,
  Plus,
  MapPin,
  Receipt,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { WeatherWidget } from "@/components/WeatherWidget";

const MapWidget = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
});

type Expense = {
  id: string;
  amount: number;
  description: string;
  date: string;
  currency: string;
};
type Item = {
  id: string;
  dayIndex: number;
  startTime: string;
  location: string;
  description: string;
};
type Insight = { history: string; funFacts: string; spontaneousIdeas: string };

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  style: string;
  budget: number;
  shareToken: string | null;
  itineraryItems: Item[];
  expenses: {
    id: string;
    amount: number;
    description: string;
    date: string;
    currency: string;
  }[];
};

export default function TripDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [insights, setInsights] = useState<Record<string, Insight>>({});
  const [loadingInsights, setLoadingInsights] = useState<
    Record<string, boolean>
  >({});

  const [newExpense, setNewExpense] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [addingExpense, setAddingExpense] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/trips/${id}`);
        const data = await res.json();
        setTrip(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  const fetchTripManual = async () => {
    try {
      const res = await fetch(`/api/trips/${id}`);
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
      const res = await fetch(`/api/trips/${id}/parse-itinerary`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) await fetchTripManual(); // reload
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  const fetchOrGenerateInsight = async (itemId: string) => {
    if (insights[itemId] || loadingInsights[itemId]) return;

    setLoadingInsights((prev) => ({ ...prev, [itemId]: true }));

    try {
      // Try to GET first
      const res = await fetch(`/api/insights/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setInsights((prev) => ({ ...prev, [itemId]: data }));
      } else {
        // Generate if not found
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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingExpense(true);
    try {
      const res = await fetch(`/api/trips/${id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          date: newExpense.date,
          currency: "USD",
        }),
      });
      if (res.ok) {
        await fetchTripManual();
        setNewExpense({
          amount: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
      }
    } finally {
      setAddingExpense(false);
    }
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
      <div className="text-center py-20 text-xl font-medium">
        Trip not found.
      </div>
    );
  }

  const itemsByDay = trip.itineraryItems.reduce(
    (acc: Record<string, Item[]>, item: Item) => {
      if (!acc[item.dayIndex]) acc[item.dayIndex] = [];
      acc[item.dayIndex].push(item);
      return acc;
    },
    {} as Record<string, Item[]>,
  );

  const totalExpense = trip.expenses.reduce(
    (sum: number, e: Expense) => sum + e.amount,
    0,
  );

  return (
    <main className="container mx-auto max-w-5xl py-10 px-4 md:px-6">
      <Link
        href="/"
        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium mb-6 inline-block"
      >
        &larr; Back to Dashboard
      </Link>

      <header className="mb-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {trip.name}
            </h1>
            <p className="text-neutral-400 mt-2 text-lg">
              {format(new Date(trip.startDate), "MMMM do")} -{" "}
              {format(new Date(trip.endDate), "MMMM do, yyyy")} • {trip.style}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-3">
            <WeatherWidget destination={trip.name} />
            <div>
              <span className="block text-sm text-neutral-500">
                Total Budget
              </span>
              <span className="text-2xl font-bold text-white">
                ${trip.budget || 0}
              </span>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="itinerary" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-neutral-900 border border-neutral-800 rounded-lg p-1 mb-8">
          <TabsTrigger
            value="itinerary"
            className="rounded-md data-[state=active]:bg-neutral-800 data-[state=active]:text-indigo-400"
          >
            <CalendarDays className="w-4 h-4 mr-2" /> Itinerary
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="rounded-md data-[state=active]:bg-neutral-800 data-[state=active]:text-indigo-400"
          >
            <MapPin className="w-4 h-4 mr-2" /> Map
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="rounded-md data-[state=active]:bg-neutral-800 data-[state=active]:text-indigo-400"
          >
            <Receipt className="w-4 h-4 mr-2" /> Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="itinerary"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Upload Section */}
          <Card className="bg-neutral-900 border-neutral-800 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Agent Itinerary Parse</CardTitle>
              <CardDescription>
                Upload a photo or PDF of an itinerary. OpenClaw AI will extract
                the schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="bg-neutral-950 border-neutral-800 max-w-xs"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UploadCloud className="w-4 h-4 mr-2" />
                )}
                {uploading ? "Extracting..." : "Parse File"}
              </Button>
            </CardContent>
          </Card>

          {/* Itinerary Display */}
          {Object.keys(itemsByDay).length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              No itinerary items yet. Upload a schedule or wait for the agent.
            </div>
          ) : (
            <div className="space-y-10">
              {Object.keys(itemsByDay)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((day) => (
                  <div key={day} className="relative">
                    <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm">
                        D{day}
                      </span>
                      Day {day}
                    </h3>
                    <div className="space-y-4 pl-4 border-l-2 border-neutral-800 ml-4">
                      {itemsByDay[day].map((item: Item) => (
                        <Card
                          key={item.id}
                          className="bg-neutral-900/50 border-neutral-800 relative -left-4 w-[calc(100%+16px)]"
                        >
                          <CardHeader className="py-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg text-white">
                                  {item.location}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {item.startTime} • {item.description}
                                </CardDescription>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                                onClick={() => fetchOrGenerateInsight(item.id)}
                                disabled={loadingInsights[item.id]}
                              >
                                {loadingInsights[item.id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                AI Insights
                              </Button>
                            </div>
                          </CardHeader>

                          {/* Insights Dropdown */}
                          {insights[item.id] && (
                            <CardContent className="bg-indigo-950/20 rounded-b-xl border-t border-indigo-500/20 py-4 mt-2">
                              <div className="space-y-4 text-sm">
                                <div>
                                  <h4 className="font-semibold text-indigo-300 flex items-center gap-2">
                                    🏛️ History
                                  </h4>
                                  <p className="text-neutral-300 leading-relaxed mt-1">
                                    {insights[item.id].history}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-amber-300 flex items-center gap-2">
                                    💡 Fun Facts
                                  </h4>
                                  <p className="text-neutral-300 leading-relaxed mt-1">
                                    {insights[item.id].funFacts}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-emerald-300 flex items-center gap-2">
                                    🚶 Spontaneous Ideas
                                  </h4>
                                  <p className="text-neutral-300 leading-relaxed mt-1">
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
          )}
        </TabsContent>

        <TabsContent
          value="map"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden relative">
            <MapWidget destination={trip.name} />
          </Card>
        </TabsContent>

        <TabsContent
          value="expenses"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
                <div>
                  <p className="text-neutral-400 text-sm">Total Spent</p>
                  <h3 className="text-4xl font-bold mt-1 text-white">
                    ${totalExpense.toFixed(2)}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-neutral-400 text-sm">Remaining</p>
                  <h3
                    className={`text-2xl font-bold mt-1 ${trip.budget - totalExpense < 0 ? "text-red-400" : "text-emerald-400"}`}
                  >
                    ${(trip.budget - totalExpense).toFixed(2)}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <h4 className="font-medium text-lg mb-4 text-neutral-200">
                  Recent Transactions
                </h4>
                {trip.expenses.length === 0 ? (
                  <p className="text-neutral-500">No expenses recorded yet.</p>
                ) : (
                  trip.expenses.map((exp: Expense) => (
                    <div
                      key={exp.id}
                      className="flex justify-between items-center p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                    >
                      <div>
                        <p className="font-medium text-neutral-200">
                          {exp.description}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {format(new Date(exp.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="font-semibold text-white">
                        {exp.currency} {exp.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <Card className="bg-neutral-900 border-neutral-800">
                <CardHeader>
                  <CardTitle>Add Expense</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount</Label>
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
                        className="bg-neutral-950 border-neutral-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        required
                        value={newExpense.description}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            description: e.target.value,
                          })
                        }
                        className="bg-neutral-950 border-neutral-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        required
                        value={newExpense.date}
                        onChange={(e) =>
                          setNewExpense({ ...newExpense, date: e.target.value })
                        }
                        className="bg-neutral-950 border-neutral-800 [color-scheme:dark]"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={addingExpense}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
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
      </Tabs>
    </main>
  );
}
