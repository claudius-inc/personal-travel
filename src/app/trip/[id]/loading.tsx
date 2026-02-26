import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-muted-foreground text-sm">Loading trip details...</p>
    </div>
  );
}
