"use client";

import { useState, useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Star,
  MapPin,
  Heart,
  Check,
  Building2,
  Utensils,
  TreePine,
  Map as MapIcon,
} from "lucide-react";

interface POIHoverCardProps {
  query: string;
  lat?: number;
  lng?: number;
  children: React.ReactNode;
}

interface POIData {
  name: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  editorial_summary?: string;
  photos?: string[];
  types?: string[];
}

export function POIHoverCard({ query, lat, lng, children }: POIHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<POIData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !data && !isLoading && !error) {
      setIsLoading(true);
    }
  };

  useEffect(() => {
    if (isLoading) {
      let isMounted = true;

      fetch("/api/poi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, lat, lng }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((result) => {
          if (isMounted) {
            setData(result);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setError(true);
            setIsLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, data, isLoading, error, query, lat, lng]);

  const getCategoryIcon = (types: string[] = []) => {
    if (types.includes("lodging") || types.includes("hotel"))
      return <Building2 className="w-3 h-3 mr-1 text-muted-foreground" />;
    if (
      types.includes("restaurant") ||
      types.includes("cafe") ||
      types.includes("food")
    )
      return <Utensils className="w-3 h-3 mr-1 text-muted-foreground" />;
    if (types.includes("park") || types.includes("natural_feature"))
      return <TreePine className="w-3 h-3 mr-1 text-muted-foreground" />;
    return <MapIcon className="w-3 h-3 mr-1 text-muted-foreground" />;
  };

  const formatCategory = (types: string[] = []) => {
    if (types.length === 0) return "Point of Interest";
    const primary = types[0].replace(/_/g, " ");
    return primary.charAt(0).toUpperCase() + primary.slice(1);
  };

  return (
    <HoverCard openDelay={300} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer hover:underline decoration-primary underline-offset-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm inline-flex items-center">
          <MapPin className="w-3.5 h-3.5 mr-1 inline shrink-0" />
          {children}
        </span>
      </HoverCardTrigger>

      <HoverCardContent
        className="w-80 p-0 overflow-hidden shadow-lg border-muted z-50 rounded-xl bg-card"
        align="start"
        sideOffset={8}
      >
        {isLoading ? (
          <div className="flex flex-col space-y-3 p-4">
            <div className="w-full h-40 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded mt-2" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-center text-muted-foreground py-8">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
            Location details unavailable.
          </div>
        ) : data ? (
          <div className="flex flex-col">
            {/* Top Image Carousel Area */}
            <div className="relative w-full h-48 bg-muted group">
              {data.photos && data.photos.length > 0 ? (
                <Carousel className="w-full h-full">
                  <CarouselContent>
                    {data.photos.map((photoUrl, index) => (
                      <CarouselItem
                        key={index}
                        className="w-full h-48 relative"
                      >
                        <img
                          src={photoUrl}
                          alt={`${data.name} photo ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="absolute inset-0 top-1/2 -translate-y-1/2 w-full px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-between pointer-events-none">
                    <CarouselPrevious className="relative translate-y-0 left-0 h-7 w-7 pointer-events-auto bg-black/40 text-white border-none hover:bg-black/60" />
                    <CarouselNext className="relative translate-y-0 right-0 h-7 w-7 pointer-events-auto bg-black/40 text-white border-none hover:bg-black/60" />
                  </div>
                </Carousel>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground">
                  No photos available
                </div>
              )}

              {/* Overlay Action Buttons (Heart / Visited) */}
              <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                <button className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
                <button className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm hover:brightness-110 transition-all">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Info Area */}
            <div className="p-4 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-base leading-tight">
                  {data.name}
                </h4>
                {data.rating !== undefined && (
                  <div className="flex items-center shrink-0 bg-background rounded-full px-1.5 py-0.5 border shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-xs font-semibold">
                      {data.rating.toFixed(1)}
                    </span>
                    {data.user_ratings_total && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        (
                        {data.user_ratings_total >= 1000
                          ? `${(data.user_ratings_total / 1000).toFixed(1)}k`
                          : data.user_ratings_total}
                        )
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center text-xs text-muted-foreground">
                {getCategoryIcon(data.types)}
                <span>{formatCategory(data.types)}</span>
                {data.formatted_address && (
                  <>
                    <span className="mx-1.5">•</span>
                    <span className="truncate">
                      {data.formatted_address.split(",")[0]}
                    </span>
                  </>
                )}
              </div>

              {data.editorial_summary && (
                <p className="text-sm mt-2 text-foreground/90 line-clamp-3 leading-relaxed">
                  {data.editorial_summary}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
