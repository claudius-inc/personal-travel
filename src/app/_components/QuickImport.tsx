"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud, Link as LinkIcon } from "lucide-react";

export default function QuickImport() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!url.trim() && !file) return;
    setLoading(true);
    setError("");

    try {
      let res: Response;

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

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Import failed");
        return;
      }

      const { tripId } = await res.json();
      router.push(`/trip/${tripId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm rounded-xl">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-medium text-card-foreground">
          Quick Import
        </CardTitle>
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
          }}
          disabled={loading}
          className="bg-background border-border text-foreground"
          data-testid="quick-import-file"
        />

        {error && (
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
  );
}
