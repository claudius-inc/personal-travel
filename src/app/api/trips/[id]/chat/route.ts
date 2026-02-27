import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import { trips, itineraryItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { chatMessageSchema } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayIndex: { type: Type.INTEGER },
          startTime: { type: Type.STRING },
          endTime: { type: Type.STRING },
          location: { type: Type.STRING },
          description: { type: Type.STRING },
          address: { type: Type.STRING },
        },
        required: ["dayIndex", "location"],
      },
    },
  },
  required: ["reply", "items"],
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { message } = parsed.data;

    // Load trip context
    const trip = await db
      .select()
      .from(trips)
      .where(eq(trips.id, id))
      .limit(1);

    if (trip.length === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const existingItems = await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.tripId, id));

    const tripData = trip[0];
    const existingSummary =
      existingItems.length > 0
        ? existingItems
            .map(
              (i) =>
                `Day ${i.dayIndex}: ${i.startTime || ""} - ${i.location} (${i.description || ""})`,
            )
            .join("\n")
        : "No items yet.";

    const systemPrompt = `You are a helpful travel planning assistant. You help plan trips by suggesting activities, restaurants, and things to do.

Trip context:
- Name: ${tripData.name}
- Dates: ${tripData.startDate ? new Date(tripData.startDate).toDateString() : "Flexible"} to ${tripData.endDate ? new Date(tripData.endDate).toDateString() : "Flexible"}
- Style: ${tripData.style || "Not specified"}
- Budget: $${tripData.budget || "Not specified"}
- Days: ${tripData.days || "Flexible"}

Current itinerary:
${existingSummary}

Instructions:
- Reply conversationally to the user's message
- If the user asks to add activities, suggest specific places with times and return them in the items array
- If the user is just chatting or asking questions, reply helpfully and return an empty items array
- Use dayIndex starting from 1 for Day 1, 2 for Day 2, etc.
- Be specific with location names and include addresses when possible`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser message: ${message}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const result = JSON.parse(response.text || '{"reply":"Sorry, I could not process that.","items":[]}');

    // Save generated items to DB
    if (result.items && result.items.length > 0) {
      for (const item of result.items) {
        await db.insert(itineraryItems).values({
          id: crypto.randomUUID(),
          tripId: id,
          dayIndex: item.dayIndex,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          location: item.location,
          description: item.description || null,
          address: item.address || null,
          sortOrder: 0,
        });
      }
    }

    return NextResponse.json({
      reply: result.reply,
      items: result.items || [],
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 },
    );
  }
}
