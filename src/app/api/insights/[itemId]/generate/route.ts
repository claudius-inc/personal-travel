import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import { itineraryItems, locationInsights } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const ai = new GoogleGenAI({});
  try {
    const { itemId } = await context.params;

    // Fetch the item details
    const itemQuery = await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.id, itemId));
    if (!itemQuery.length) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    const item = itemQuery[0];

    // AI Schema for insights
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        history: {
          type: Type.STRING,
          description: "Fascinating history about the location",
        },
        funFacts: {
          type: Type.STRING,
          description: "Interesting trivia or fun facts",
        },
        spontaneousIdeas: {
          type: Type.STRING,
          description: "Spontaneous or off-the-beaten-path things to do nearby",
        },
      },
      required: ["history", "funFacts", "spontaneousIdeas"],
    };

    const prompt = `You are a spontaneous local travel guide. Provide history, fun facts, and spontaneous ideas for this location:
    Name: ${item.location}
    Address: ${item.address || "Unknown"}
    Activity: ${item.description || "Unknown"}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const parsedText = response.text;
    if (!parsedText) {
      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 500 },
      );
    }

    const insights = JSON.parse(parsedText);
    const insightId = crypto.randomUUID();

    const newInsight = await db
      .insert(locationInsights)
      .values({
        id: insightId,
        itemId,
        history: insights.history,
        funFacts: insights.funFacts,
        spontaneousIdeas: insights.spontaneousIdeas,
      })
      .returning();

    return NextResponse.json(newInsight[0]);
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate insights",
      },
      { status: 500 },
    );
  }
}
