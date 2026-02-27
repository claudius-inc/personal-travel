import { NextResponse } from "next/server";
import { z } from "zod";
import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

// Very simple in-memory cache to save API calls
const poiCache = new Map<string, unknown>();

const requestSchema = z.object({
  query: z.string().min(1, "Location query is required"),
  // Optional lat/lng to bias search results
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      );
    }

    const { query, lat, lng } = result.data;

    // Check cache first
    const cacheKey = `${query}-${lat || ""}-${lng || ""}`;
    if (poiCache.has(cacheKey)) {
      return NextResponse.json(poiCache.get(cacheKey));
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      // Mock data for local testing if no key is provided yet
      // This prevents the app from crashing while the user is setting up their account
      const mockResult = {
        name: query,
        rating: 4.8,
        user_ratings_total: 1250,
        formatted_address: "Mock Address, 12345 City",
        editorial_summary:
          "A beautiful placeholder location for testing purposes.",
        photos: [],
        types: ["tourist_attraction"],
      };

      return NextResponse.json(mockResult);
    }

    // 1. Text Search to get the Place ID
    let locationBias = undefined;
    if (lat !== undefined && lng !== undefined) {
      locationBias = `circle:10000@${lat},${lng}`; // 10km radius bias
    }

    const searchResponse = await client.textSearch({
      params: {
        query,
        ...(locationBias && { location: `${lat},${lng}`, radius: 10000 }),
        key: apiKey,
      },
    });

    const place = searchResponse.data.results[0];

    if (!place || !place.place_id) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    // 2. Place Details to get rich info (editorial summary, more photos, etc.)
    const detailsResponse = await client.placeDetails({
      params: {
        place_id: place.place_id,
        fields: [
          "name",
          "rating",
          "user_ratings_total",
          "formatted_address",
          "editorial_summary",
          "photos",
          "types",
        ],
        key: apiKey,
      },
    });

    const details = detailsResponse.data.result;

    // 3. Process Photos
    // Google returns photo references, we need to construct the actual image URLs
    const processedPhotos = (details.photos || []).slice(0, 5).map((photo) => {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`;
    });

    const finalData = {
      name: details.name,
      rating: details.rating,
      user_ratings_total: details.user_ratings_total,
      formatted_address: details.formatted_address,
      editorial_summary: details.editorial_summary?.overview || "",
      photos: processedPhotos,
      types: details.types || [],
    };

    // Cache the result
    poiCache.set(cacheKey, finalData);

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("POI fetching error:", error);
    return NextResponse.json(
      { error: "Failed to fetch POI data" },
      { status: 500 },
    );
  }
}
