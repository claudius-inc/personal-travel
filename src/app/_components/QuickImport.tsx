"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Loader2, UploadCloud, Link as LinkIcon, HelpCircle } from "lucide-react";
import ImportProgressModal, { type ImportStep } from "@/components/ImportProgressModal";

export default function QuickImport() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Progress modal state
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>("fetching");
  const [importType, setImportType] = useState<"url" | "file">("url");
  const [itemCount, setItemCount] = useState<number | undefined>();

  const handleSubmit = async () => {
    if (!url.trim() && !file) return;
    setLoading(true);
    setError("");
    setShowProgress(true);
    setImportType(file ? "file" : "url");
    setCurrentStep("fetching");
    setItemCount(undefined);

    try {
      let res: Response;

      // Simulate step progression (actual steps happen server-side)
      // Step 1: Fetching
      await new Promise((r) => setTimeout(r, 500));
      setCurrentStep("parsing");

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/trips/quick-import", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/trips/quick-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
      }

      // Step 2: Creating (after response starts)
      setCurrentStep("creating");
      await new Promise((r) => setTimeout(r, 300));

      if (!res.ok) {
        const data = await res.json();
        setCurrentStep("error");
        setError(data.error || "Import failed");
        return;
      }

      const data = await res.json();
      const { tripId, itemCount: count } = data;
      
      setItemCount(count || undefined);
      setCurrentStep("done");

      // Show success for a moment before redirecting
      await new Promise((r) => setTimeout(r, 1200));
      setShowProgress(false);
      router.push(`/trip/${tripId}`);
    } catch {
      setCurrentStep("error");
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProgressClose = () => {
    if (currentStep === "done" || currentStep === "error") {
      setShowProgress(false);
      if (currentStep === "error") {
        // Reset for retry
        setCurrentStep("fetching");
      }
    }
  };

  return (
    <>
      <Card className="bg-card border-border shadow-sm rounded-xl">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-card-foreground">
              Quick Import
            </CardTitle>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" side="left">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Supported formats:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>URLs:</strong> Travel blogs, Wanderlog, TripIt, Google Docs, Notion</li>
                    <li>• <strong>Files:</strong> PDF itineraries, photos of schedules</li>
                    <li>• <strong>Content:</strong> Day-by-day plans, location lists, booking confirmations</li>
                  </ul>
                  <p className="text-xs text-muted-foreground pt-2">
                    Our AI extracts dates, locations, and activities automatically.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Already have an itinerary? Paste a URL or upload a file.
          </p>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Paste a URL (blog, article, itinerary)"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (e.target.value) setFile(null);
                setError("");
              }}
              disabled={loading}
              className="bg-background border-border text-foreground"
              data-testid="quick-import-url"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" />
            <span>or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              if (e.target.files?.[0]) setUrl("");
              setError("");
            }}
            disabled={loading}
            className="bg-background border-border text-foreground"
            data-testid="quick-import-file"
          />

          {error && !showProgress && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || (!url.trim() && !file)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]"
            data-testid="quick-import-submit"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UploadCloud className="w-4 h-4 mr-2" />
            )}
            {loading ? "Importing..." : "Import Itinerary"}
          </Button>
        </CardContent>
      </Card>

      <ImportProgressModal
        open={showProgress}
        currentStep={currentStep}
        importType={importType}
        itemCount={itemCount}
        error={error}
        onClose={handleProgressClose}
      />
    </>
  );
}
