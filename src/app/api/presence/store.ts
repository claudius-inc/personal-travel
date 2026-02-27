/**
 * Simple in-memory presence store
 * 
 * Note: In production, use Redis, Supabase Realtime, or similar for
 * cross-instance presence tracking. This works for single-instance deployments.
 */

interface Viewer {
  id: string;
  name: string;
  color: string;
  lastSeen: number;
}

// Map of tripId -> viewers
const presenceStore = new Map<string, Map<string, Viewer>>();

// Color palette for viewer avatars
const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
];

function getViewerColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Update viewer presence (heartbeat)
 */
export function updatePresence(
  tripId: string,
  viewerId: string,
  viewerName: string
): Viewer[] {
  if (!presenceStore.has(tripId)) {
    presenceStore.set(tripId, new Map());
  }
  
  const tripViewers = presenceStore.get(tripId)!;
  
  // Update or add viewer
  tripViewers.set(viewerId, {
    id: viewerId,
    name: viewerName,
    color: getViewerColor(viewerId),
    lastSeen: Date.now(),
  });
  
  // Clean up stale viewers (> 15 seconds)
  const now = Date.now();
  const staleThreshold = 15000;
  
  for (const [id, viewer] of tripViewers) {
    if (now - viewer.lastSeen > staleThreshold) {
      tripViewers.delete(id);
    }
  }
  
  // Return active viewers
  return Array.from(tripViewers.values());
}

/**
 * Remove viewer from presence
 */
export function removePresence(tripId: string, viewerId: string): void {
  const tripViewers = presenceStore.get(tripId);
  if (tripViewers) {
    tripViewers.delete(viewerId);
    if (tripViewers.size === 0) {
      presenceStore.delete(tripId);
    }
  }
}

/**
 * Get active viewers for a trip
 */
export function getPresence(tripId: string): Viewer[] {
  const tripViewers = presenceStore.get(tripId);
  if (!tripViewers) return [];
  
  // Clean up stale and return
  const now = Date.now();
  const staleThreshold = 15000;
  const active: Viewer[] = [];
  
  for (const [id, viewer] of tripViewers) {
    if (now - viewer.lastSeen > staleThreshold) {
      tripViewers.delete(id);
    } else {
      active.push(viewer);
    }
  }
  
  return active;
}

// Periodic cleanup (every 30 seconds)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 30000;
    
    for (const [tripId, viewers] of presenceStore) {
      for (const [viewerId, viewer] of viewers) {
        if (now - viewer.lastSeen > staleThreshold) {
          viewers.delete(viewerId);
        }
      }
      if (viewers.size === 0) {
        presenceStore.delete(tripId);
      }
    }
  }, 30000);
}
