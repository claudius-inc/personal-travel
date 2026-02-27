"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Users } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Generate a random color based on user ID
function getAvatarColor(userId: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name or email
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name[0] + (name[1] || "")).toUpperCase();
}

// Generate a random guest name
function generateGuestName(): string {
  const adjectives = ["Happy", "Swift", "Clever", "Brave", "Quiet", "Gentle", "Wild", "Calm"];
  const animals = ["Panda", "Tiger", "Eagle", "Dolphin", "Fox", "Owl", "Bear", "Wolf"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${animal}`;
}

// Get or create user ID from localStorage
function getUserId(): string {
  if (typeof window === "undefined") return "server";
  let userId = localStorage.getItem("presence-user-id");
  if (!userId) {
    userId = `user-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("presence-user-id", userId);
  }
  return userId;
}

// Get or create user name from localStorage
function getUserName(): string {
  if (typeof window === "undefined") return "Guest";
  let userName = localStorage.getItem("presence-user-name");
  if (!userName) {
    userName = generateGuestName();
    localStorage.setItem("presence-user-name", userName);
  }
  return userName;
}

type Viewer = {
  id: string;
  name: string;
  lastSeen: number;
};

type PresenceIndicatorProps = {
  tripId: string;
  shareToken?: string | null;
};

// Presence is simulated locally for demo purposes
// In production, this would connect to a WebSocket or real-time database
export function PresenceIndicator({ tripId, shareToken }: PresenceIndicatorProps) {
  const isShared = Boolean(shareToken);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [currentUser] = useState(() => ({
    id: getUserId(),
    name: getUserName(),
  }));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `presence-${tripId}`;

  // Update presence in localStorage (simulates real-time sync)
  const updatePresence = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const now = Date.now();
    const existingData = localStorage.getItem(storageKey);
    let allViewers: Viewer[] = existingData ? JSON.parse(existingData) : [];
    
    // Remove stale viewers (not seen in last 30 seconds)
    allViewers = allViewers.filter((v) => now - v.lastSeen < 30000);
    
    // Update or add current user
    const existingIndex = allViewers.findIndex((v) => v.id === currentUser.id);
    const userEntry = { ...currentUser, lastSeen: now };
    if (existingIndex >= 0) {
      allViewers[existingIndex] = userEntry;
    } else {
      allViewers.push(userEntry);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(allViewers));
    
    // Update state with other viewers (excluding self)
    setViewers(allViewers.filter((v) => v.id !== currentUser.id));
  }, [currentUser, storageKey]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const allViewers: Viewer[] = JSON.parse(e.newValue);
        const now = Date.now();
        setViewers(
          allViewers.filter(
            (v) => v.id !== currentUser.id && now - v.lastSeen < 30000
          )
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [currentUser.id, storageKey]);

  // Update presence periodically
  useEffect(() => {
    updatePresence();
    intervalRef.current = setInterval(updatePresence, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Remove self from presence on unmount
      if (typeof window !== "undefined") {
        const existingData = localStorage.getItem(storageKey);
        if (existingData) {
          const allViewers: Viewer[] = JSON.parse(existingData);
          const filtered = allViewers.filter((v) => v.id !== currentUser.id);
          localStorage.setItem(storageKey, JSON.stringify(filtered));
        }
      }
    };
  }, [updatePresence, currentUser.id, storageKey]);

  // Don't show if not shared and no other viewers
  if (!isShared && viewers.length === 0) {
    return null;
  }

  const totalViewers = viewers.length + 1; // Including self
  const displayedViewers = viewers.slice(0, 3);
  const remainingCount = viewers.length - displayedViewers.length;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className="flex items-center gap-1 cursor-pointer"
          data-testid="presence-indicator"
        >
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {/* Current user avatar */}
            <div
              className={`w-7 h-7 rounded-full ${getAvatarColor(currentUser.id)} flex items-center justify-center text-white text-xs font-medium border-2 border-background z-10`}
              title="You"
            >
              {getInitials(currentUser.name)}
            </div>
            
            {/* Other viewers */}
            {displayedViewers.map((viewer, index) => (
              <div
                key={viewer.id}
                className={`w-7 h-7 rounded-full ${getAvatarColor(viewer.id)} flex items-center justify-center text-white text-xs font-medium border-2 border-background`}
                style={{ zIndex: 9 - index }}
                title={viewer.name}
              >
                {getInitials(viewer.name)}
              </div>
            ))}
            
            {/* Overflow indicator */}
            {remainingCount > 0 && (
              <div
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium border-2 border-background"
                style={{ zIndex: 0 }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
          
          {/* Viewer count */}
          <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
            {totalViewers} {totalViewers === 1 ? "viewer" : "viewers"}
          </span>
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent align="end" className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4" />
            Currently viewing
          </div>
          
          <div className="space-y-2">
            {/* Current user */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full ${getAvatarColor(currentUser.id)} flex items-center justify-center text-white text-[10px] font-medium`}
              >
                {getInitials(currentUser.name)}
              </div>
              <span className="text-sm">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground">(you)</span>
            </div>
            
            {/* Other viewers */}
            {viewers.map((viewer) => (
              <div key={viewer.id} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full ${getAvatarColor(viewer.id)} flex items-center justify-center text-white text-[10px] font-medium`}
                >
                  {getInitials(viewer.name)}
                </div>
                <span className="text-sm">{viewer.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Date.now() - viewer.lastSeen < 10000 ? "active" : "idle"}
                </span>
              </div>
            ))}
          </div>
          
          {viewers.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Share this trip to collaborate with others
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
