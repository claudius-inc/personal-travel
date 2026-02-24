---
name: Personal Travel App
description: Tools to interact with the user's personal travel itineraries, budgets, and location insights.
---

# Personal Travel App Skill

This skill allows the OpenClaw agent to interact with the Personal Travel Next.js web application. The agent can read trips, add itinerary items, lookup location insights, and track expenses.

## Base URL

Use the user's deployed app URL, or `http://localhost:3000` for local development.

## Endpoints

### 1. List All Trips

- **Endpoint:** `GET /api/trips`
- **Description:** Returns a list of all trips the user has created.
- **Response:** JSON array of trip objects containing `id`, `name`, `startDate`, `endDate`, `style`, `budget`, and `shareToken`.

### 2. Get Trip Details (Itinerary & Expenses)

- **Endpoint:** `GET /api/trips/[id]`
- **Description:** Returns the details of a specific trip, including all `itineraryItems` and `expenses`.
- **Response:** JSON object of the trip with nested arrays for items and expenses.

### 3. Add Itinerary Item

- **Endpoint:** `POST /api/trips/[id]`
- **Description:** Adds a new scheduled location to the trip's itinerary.
- **Payload:**
  ```json
  {
    "dayIndex": 1, // 1-indexed day of the trip
    "startTime": "09:00",
    "endTime": "11:00",
    "location": "Eiffel Tower",
    "description": "Morning visit to the top",
    "address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    "lat": 48.8584,
    "lng": 2.2945
  }
  ```

### 4. Create an Expense

- **Endpoint:** `POST /api/trips/[id]/expenses`
- **Description:** Logs a new expense for the trip.
- **Payload:**
  ```json
  {
    "amount": 25.5,
    "currency": "EUR",
    "description": "Croissants and Coffee",
    "paidBy": "User",
    "date": "2024-05-10T08:30:00Z"
  }
  ```

### 5. Get Location Insights (History & Fun Facts)

- **Endpoint:** `GET /api/insights/[itemId]`
- **Description:** Fetch the pre-generated history, fun facts, and spontaneous ideas for an itinerary item.
- **Response:** JSON object containing `history`, `funFacts`, and `spontaneousIdeas`.

### 6. Parse Itinerary (AI Processing)

- **Endpoint:** `POST /api/trips/[id]/parse-itinerary`
- **Description:** Instructs the app backend to parse an uploaded printed itinerary (handled inside the web app).
- **Note**: The user might upload files via the Web App directly. Ensure you read from the endpoints once they have added a trip to give them insights.

## Agent Guidelines

1. When a user asks "What's my plan for tomorrow?", query `GET /api/trips` to find the active trip, then `GET /api/trips/[id]` to read the Day's itinerary.
2. When the user arrives at a location, look up the item ID in the itinerary, then query `GET /api/insights/[itemId]` to read them fun facts and spontaneous ideas.
3. If the user says "I spent $20 on lunch", send a `POST /api/trips/[id]/expenses` to log it under their current trip.
