"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          {error.message ||
            "An unexpected error occurred while loading this trip."}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
