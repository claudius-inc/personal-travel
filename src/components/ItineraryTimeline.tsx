"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Sparkles,
  MapPin,
  Trash2,
  GripVertical,
  Check,
  X,
} from "lucide-react";
import type { ItineraryItemRow } from "@/types";
import type { Insight } from "@/types";
import { POIHoverCard } from "./POIHoverCard";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ItineraryTimelineProps = {
  items: ItineraryItemRow[];
  onInsightClick?: (itemId: string) => void;
  insights?: Record<string, Insight>;
  loadingInsights?: Record<string, boolean>;
  accentColor?: "indigo" | "teal";
  // Inline editing props
  editable?: boolean;
  onItemUpdate?: (
    itemId: string,
    fields: Partial<ItineraryItemRow>,
  ) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  // Drag-and-drop reorder
  onReorder?: (
    items: Array<{ id: string; dayIndex: number; sortOrder: number }>,
  ) => Promise<void>;
  // Map bidirectional linking
  selectedItemId?: string | null;
  onItemSelect?: (itemId: string | null) => void;
};

function SortableItemCard({
  item,
  editable,
  onItemUpdate,
  onItemDelete,
  onInsightClick,
  insights,
  loadingInsights,
  accentColor,
  isSelected,
  onItemSelect,
  cardRef,
}: {
  item: ItineraryItemRow;
  editable?: boolean;
  onItemUpdate?: (
    itemId: string,
    fields: Partial<ItineraryItemRow>,
  ) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onInsightClick?: (itemId: string) => void;
  insights: Record<string, Insight>;
  loadingInsights: Record<string, boolean>;
  accentColor: "indigo" | "teal";
  isSelected: boolean;
  onItemSelect?: (itemId: string | null) => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Merge refs
  const mergedRef = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el);
      cardRef(el);
    },
    [setNodeRef, cardRef],
  );

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  const startEdit = (field: string, currentValue: string) => {
    if (!editable) return;
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const saveEdit = async () => {
    if (!editingField || !onItemUpdate) return;
    await onItemUpdate(item.id, { [editingField]: editValue });
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const handleDelete = async () => {
    if (!onItemDelete) return;
    if (!confirm("Delete this item?")) return;
    await onItemDelete(item.id);
  };

  return (
    <div ref={mergedRef} style={style}>
      <Card
        data-testid={`itinerary-item-${item.id}`}
        className={`bg-card border-border shadow-sm relative -left-4 w-[calc(100%+16px)] transition-all cursor-pointer ${
          isSelected
            ? "ring-2 ring-indigo-500 border-indigo-400"
            : "hover:border-foreground/20"
        }`}
        onClick={() => onItemSelect?.(isSelected ? null : item.id)}
      >
        <CardHeader className="py-4">
          <div className="flex justify-between items-start gap-2">
            {editable && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground"
                data-testid={`drag-handle-${item.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {editingField === "location" ? (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveEdit}
                    className="h-7 text-lg font-semibold"
                    data-testid={`edit-location-${item.id}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={saveEdit}
                    className="h-7 w-7 p-0"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <CardTitle
                  className={`text-lg text-card-foreground ${editable ? "cursor-text hover:bg-muted/50 rounded px-1 -mx-1" : ""}`}
                  onClick={(e) => {
                    if (editable) {
                      e.stopPropagation();
                      startEdit("location", item.location);
                    }
                  }}
                  data-testid={`location-${item.id}`}
                >
                  <POIHoverCard
                    query={`${item.location} ${item.address || ""}`.trim()}
                    lat={item.lat || undefined}
                    lng={item.lng || undefined}
                  >
                    {item.location}
                  </POIHoverCard>
                </CardTitle>
              )}
              <CardDescription className="mt-1 flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                {editingField === "startTime" ? (
                  <span
                    className="inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={saveEdit}
                      className="h-6 w-20 text-xs"
                      data-testid={`edit-time-${item.id}`}
                    />
                  </span>
                ) : (
                  <span
                    className={
                      editable
                        ? "cursor-text hover:bg-muted/50 rounded px-1"
                        : ""
                    }
                    onClick={(e) => {
                      if (editable) {
                        e.stopPropagation();
                        startEdit("startTime", item.startTime || "");
                      }
                    }}
                    data-testid={`time-${item.id}`}
                  >
                    {item.startTime || "No time"}
                  </span>
                )}
                <span className="text-muted-foreground/50">•</span>
                {editingField === "description" ? (
                  <span
                    className="inline-flex items-center gap-1 flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={saveEdit}
                      className="h-6 text-xs flex-1"
                      data-testid={`edit-description-${item.id}`}
                    />
                  </span>
                ) : (
                  <span
                    className={`truncate ${editable ? "cursor-text hover:bg-muted/50 rounded px-1" : ""}`}
                    onClick={(e) => {
                      if (editable) {
                        e.stopPropagation();
                        startEdit("description", item.description || "");
                      }
                    }}
                    data-testid={`description-${item.id}`}
                  >
                    {item.description || "No description"}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {onInsightClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 bg-card dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsightClick(item.id);
                  }}
                  disabled={loadingInsights[item.id]}
                >
                  {loadingInsights[item.id] ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Insights
                </Button>
              )}
              {editable && onItemDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  data-testid={`delete-item-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Insights Dropdown */}
        {insights[item.id] && (
          <CardContent className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-b-xl border-t border-indigo-100 dark:border-indigo-900 py-4 mt-2">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                  History
                </h4>
                <p className="text-muted-foreground leading-relaxed mt-1">
                  {insights[item.id].history}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  Fun Facts
                </h4>
                <p className="text-muted-foreground leading-relaxed mt-1">
                  {insights[item.id].funFacts}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  Spontaneous Ideas
                </h4>
                <p className="text-muted-foreground leading-relaxed mt-1">
                  {insights[item.id].spontaneousIdeas}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function ItineraryTimeline({
  items,
  onInsightClick,
  insights = {},
  loadingInsights = {},
  accentColor = "indigo",
  editable = false,
  onItemUpdate,
  onItemDelete,
  onReorder,
  selectedItemId,
  onItemSelect,
}: ItineraryTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemId && cardRefs.current[selectedItemId]) {
      cardRefs.current[selectedItemId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedItemId]);

  // Sort items by sortOrder within each day
  const sortedItems = [...items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  // Group items by day
  const itemsByDay = sortedItems.reduce(
    (acc: Record<string, ItineraryItemRow[]>, item) => {
      const dIndex = item.dayIndex.toString();
      if (!acc[dIndex]) acc[dIndex] = [];
      acc[dIndex].push(item);
      return acc;
    },
    {} as Record<string, ItineraryItemRow[]>,
  );

  const badgeBg = accentColor === "teal" ? "bg-teal-100" : "bg-indigo-100";
  const badgeText =
    accentColor === "teal" ? "text-teal-700" : "text-indigo-700";

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    // Find old and new positions
    const allSorted = [...items].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    const activeItem = allSorted.find((i) => i.id === active.id);
    const overItem = allSorted.find((i) => i.id === over.id);
    if (!activeItem || !overItem) return;

    // Move activeItem to overItem's day and position
    const targetDay = overItem.dayIndex;
    const dayItems = allSorted.filter(
      (i) => i.dayIndex === targetDay && i.id !== activeItem.id,
    );
    const overIndex = dayItems.findIndex((i) => i.id === over.id);
    dayItems.splice(overIndex, 0, { ...activeItem, dayIndex: targetDay });

    // Recompute sort orders for the target day
    const reordered = dayItems.map((item, idx) => ({
      id: item.id,
      dayIndex: targetDay,
      sortOrder: idx,
    }));

    // If the item moved from a different day, also reorder the source day
    if (activeItem.dayIndex !== targetDay) {
      const sourceDayItems = allSorted
        .filter(
          (i) => i.dayIndex === activeItem.dayIndex && i.id !== activeItem.id,
        )
        .map((item, idx) => ({
          id: item.id,
          dayIndex: activeItem.dayIndex,
          sortOrder: idx,
        }));
      reordered.push(...sourceDayItems);
    }

    onReorder(reordered);
  };

  if (Object.keys(itemsByDay).length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No itinerary items yet. Upload a schedule or wait for the agent.
      </div>
    );
  }

  const allItemIds = sortedItems.map((i) => i.id);
  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-10">
        <SortableContext
          items={allItemIds}
          strategy={verticalListSortingStrategy}
        >
          {Object.keys(itemsByDay)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((day) => (
              <div key={day} className="relative">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-foreground">
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${badgeBg} ${badgeText} text-sm font-bold`}
                  >
                    D{day}
                  </span>
                  Day {day}
                </h3>
                <div className="space-y-4 pl-4 border-l-2 border-border ml-4">
                  {itemsByDay[day].map((item) => (
                    <SortableItemCard
                      key={item.id}
                      item={item}
                      editable={editable}
                      onItemUpdate={onItemUpdate}
                      onItemDelete={onItemDelete}
                      onInsightClick={onInsightClick}
                      insights={insights}
                      loadingInsights={loadingInsights}
                      accentColor={accentColor}
                      isSelected={selectedItemId === item.id}
                      onItemSelect={onItemSelect}
                      cardRef={(el) => {
                        cardRefs.current[item.id] = el;
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeItem ? (
          <Card className="bg-card border-indigo-400 shadow-lg rotate-2 opacity-90">
            <CardHeader className="py-3">
              <CardTitle className="text-base">{activeItem.location}</CardTitle>
              <CardDescription className="text-xs">
                {activeItem.startTime} • {activeItem.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
