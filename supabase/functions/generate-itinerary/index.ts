/**
 * Edge Function: generate-itinerary
 *
 * Securely proxies AI itinerary generation requests.
 * - Primary: Fireworks AI (Llama 70B, running on AMD GPUs)
 * - Fallback: Natively AI/ML API (GPT-4o)
 *
 * API keys stored in Supabase Secrets Manager (not exposed to frontend).
 *
 * Environment variables (set in Supabase Secrets):
 *   FIREWORKS_API_KEY  — Required for Fireworks AI
 *   NATIVELY_API_KEY   — Required for Natively fallback
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityInput {
  time: string;
  title: string;
  description: string;
  category: "morning" | "afternoon" | "evening";
  estimatedCost: number;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  tips?: string;
}

interface DayPlan {
  day: number;
  date: string;
  activities: ActivityInput[];
}

interface ItineraryResponse {
  destination: string;
  totalBudget: number;
  currency: string;
  days: DayPlan[];
}

interface ProviderResult {
  content: string;
  model: string;
}

type ProviderName = "fireworks" | "natively";

interface RequestBody {
  /** The user's trip planning preferences as a formatted prompt string */
  prompt: string;
  /** Which AI provider to use: "fireworks", "natively", or "auto" */
  provider?: "fireworks" | "natively" | "auto";
}

interface SuccessResponse {
  itinerary: ItineraryResponse;
  provider: ProviderName;
  model: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
  provider?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert travel planner AI. Generate a detailed day-by-day travel itinerary in JSON format.
Always respond with valid JSON only, no markdown formatting, no code blocks.

Return exactly this JSON structure:
{
  "destination": "string",
  "totalBudget": number,
  "currency": "string",
  "days": [
    {
      "day": number,
      "date": "string (YYYY-MM-DD)",
      "activities": [
        {
          "time": "string (e.g. 09:00)",
          "title": "string",
          "description": "string",
          "category": "morning" | "afternoon" | "evening",
          "estimatedCost": number,
          "location": {
            "name": "string",
            "lat": number,
            "lng": number
          },
          "tips": "string (optional)"
        }
      ]
    }
  ]
}`;

const FIREWORKS_API_URL =
  "https://api.fireworks.ai/inference/v1/chat/completions";
const FIREWORKS_MODEL =
  "accounts/fireworks/models/llama-v3p1-70b-instruct";

const NATIVELY_API_URL = "https://api.natively.xyz/v1/chat/completions";
const NATIVELY_MODEL = "gpt-4o";

// ─── CORS headers ─────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(
  data: SuccessResponse | ErrorResponse,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Verify the incoming JWT by calling Supabase Auth.
 * Returns the user_id on success, or throws on failure.
 */
async function verifyJWT(authHeader: string | null): Promise<string> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const response = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apiKey: supabaseAnonKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Invalid or expired JWT");
  }

  const userData = await response.json();
  return userData.id;
}

/**
 * Call an OpenAI-compatible chat completion API.
 */
async function callAIProvider(
  apiUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<ProviderResult> {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Provider returned ${response.status}: ${errorText.slice(0, 500)}`,
    );
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from provider");
  }

  return { content, model };
}

/**
 * Parse the raw content string into a structured ItineraryResponse.
 */
function parseItinerary(content: string): ItineraryResponse {
  // Strip potential markdown code block wrapping
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // Basic validation
  if (!parsed.destination || !Array.isArray(parsed.days)) {
    throw new Error(
      "Response is missing required fields (destination, days)",
    );
  }

  return parsed as ItineraryResponse;
}

/**
 * Call Fireworks AI with the given prompt.
 */
async function callFireworks(prompt: string): Promise<{
  itinerary: ItineraryResponse;
  model: string;
}> {
  const apiKey = Deno.env.get("FIREWORKS_API_KEY");
  if (!apiKey) {
    throw new Error("Fireworks API key is not configured");
  }

  const result = await callAIProvider(
    FIREWORKS_API_URL,
    apiKey,
    FIREWORKS_MODEL,
    prompt,
  );

  return {
    itinerary: parseItinerary(result.content),
    model: result.model,
  };
}

/**
 * Call Natively AI/ML API with the given prompt.
 */
async function callNatively(prompt: string): Promise<{
  itinerary: ItineraryResponse;
  model: string;
}> {
  const apiKey = Deno.env.get("NATIVELY_API_KEY");
  if (!apiKey) {
    throw new Error("Natively API key is not configured");
  }

  const result = await callAIProvider(
    NATIVELY_API_URL,
    apiKey,
    NATIVELY_MODEL,
    prompt,
  );

  return {
    itinerary: parseItinerary(result.content),
    model: result.model,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed. Use POST." },
      405,
    );
  }

  try {
    // 1. Verify JWT — protect the function
    const authHeader = req.headers.get("Authorization");
    await verifyJWT(authHeader);

    // 2. Parse and validate request body
    const body: RequestBody = await req.json();

    if (!body.prompt || typeof body.prompt !== "string") {
      return jsonResponse(
        { error: "Missing required field: prompt" },
        400,
      );
    }

    const preferredProvider = body.provider ?? "auto";

    // 3. Build provider execution order
    const executionPlan: Array<{
      name: ProviderName;
      call: () => Promise<{
        itinerary: ItineraryResponse;
        model: string;
      }>;
    }> = [];

    if (preferredProvider === "fireworks") {
      executionPlan.push({ name: "fireworks", call: () => callFireworks(body.prompt) });
      executionPlan.push({ name: "natively", call: () => callNatively(body.prompt) });
    } else if (preferredProvider === "natively") {
      executionPlan.push({ name: "natively", call: () => callNatively(body.prompt) });
    } else {
      // "auto" — try Fireworks first (faster, cheaper), fall back to Natively
      executionPlan.push({ name: "fireworks", call: () => callFireworks(body.prompt) });
      executionPlan.push({ name: "natively", call: () => callNatively(body.prompt) });
    }

    // 4. Try providers in order
    let lastError: Error | null = null;
    let result: {
      itinerary: ItineraryResponse;
      provider: ProviderName;
      model: string;
    } | null = null;

    for (const { name, call } of executionPlan) {
      try {
        const { itinerary, model } = await call();
        result = { itinerary, provider: name, model };
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`Provider "${name}" failed:`, lastError.message);
        continue;
      }
    }

    if (!result) {
      return jsonResponse(
        {
          error: "All AI providers failed",
          details: lastError?.message ?? "Unknown error",
        },
        503,
      );
    }

    // 5. Return successful response with provider metadata
    return jsonResponse({
      itinerary: result.itinerary,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generate-itinerary error:", message);

    // If it's an auth error, return 401
    if (
      message.includes("JWT") ||
      message.includes("Authorization") ||
      message.includes("auth")
    ) {
      return jsonResponse({ error: message }, 401);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
});