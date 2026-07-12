/**
 * Edge Function: generate-itinerary
 *
 * Supports three modes:
 *   mode='generate'    — Generates a structured day-by-day itinerary (JSON).
 *   mode='chat'        — Conversational travel assistant chat. Returns natural language
 *                        responses, optionally with itinerary updates if the user
 *                        requests changes.
 *   mode='interactive' — Conversational wizard that asks one clarifying question at a
 *                        time and provides clickable options to reduce user friction.
 *
 * Primary: Google Gemini ("gemini-3.1-flash-lite")
 * Fallback: Natively AI/ML API (GPT-4o)
 *
 * Environment variables (set in Supabase Secrets):
 *   GEMINI_API_KEY    — Required for Google Gemini
 *   NATIVELY_API_KEY  — Required for Natively fallback
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

interface ItineraryLocation {
  name: string;
  lat: number;
  lng: number;
}

interface ItineraryResponse {
  destinations: string[];
  locations: ItineraryLocation[];
  totalBudget: number;
  currency: string;
  days: DayPlan[];
  notes?: string;
}

interface ProviderResult {
  content: string;
  model: string;
}

type ProviderName = "gemini" | "natively";

interface QuestionOption {
  value: string;
  label: string;
}

interface InteractiveQuestion {
  id: string;
  type: "single" | "multi" | "text";
  question: string;
  options?: QuestionOption[];
}

interface RequestBody {
  /** The user's trip planning preferences or chat message */
  prompt: string;
  /** Mode: 'generate', 'chat', or 'interactive' */
  mode?: "generate" | "chat" | "interactive";
  /** Which AI provider to use: "gemini", "natively", or "auto" */
  provider?: "gemini" | "natively" | "auto";
  /** Temperature for the AI response */
  temperature?: number;
}

interface ActionData {
  type: 'create_trip' | 'update_trip';
  summary: string;
  confirmations: Array<{ label: string; status: 'ready' | 'updating' | 'done' }>;
  buttons: Array<{ label: string; action: string }>;
}

interface ChatSuccessResponse {
  chatResponse: string;
  itinerary?: ItineraryResponse;
  action?: 'create_trip' | 'update_trip';
  actionData?: ActionData;
  formPrefill?: Record<string, unknown>;
  question?: InteractiveQuestion;
  provider: ProviderName;
  model: string;
}

interface GenerateSuccessResponse {
  itinerary: ItineraryResponse;
  provider: ProviderName;
  model: string;
}

type SuccessResponse = ChatSuccessResponse | GenerateSuccessResponse;

interface ErrorResponse {
  error: string;
  details?: string;
  provider?: string;
  diagnostics?: {
    gemini_key_present: boolean;
    natively_key_present: boolean;
    provider_errors: Record<string, string>;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GENERATE_SYSTEM_PROMPT = `You are an expert travel planner AI. Generate a detailed day-by-day travel itinerary in JSON format.
Always respond with valid JSON only, no markdown formatting, no code blocks.

Return exactly this JSON structure:
{
  "destinations": ["string"],
  "locations": [
    {
      "name": "string",
      "lat": number,
      "lng": number
    }
  ],
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
  ],
  "notes": "string (optional)"
}

Important:
- "destinations" must include every city/region from the user's request.
- "locations" must contain accurate lat/lng coordinates for every destination in "destinations".
- Every activity "location" must include a real, accurate lat/lng coordinate for the place it describes.`;

const CHAT_SYSTEM_PROMPT = `You are an ACTION-ORIENTED AI travel planner. Your goal is to PERFORM actions, not just chat.

CORE BEHAVIOR:
- When the user asks to CREATE a new trip (e.g. "Plan a trip to Paris", "Create a 3-day Ooty trip"), output an [ACTION] block with full itinerary data inside an [ITINERARY_DATA] block. Then give a SHORT confirmation message (1 sentence).
- When the user asks to MODIFY an existing trip (e.g. "Make Day 2 more hiking", "Reduce budget"), output an [ACTION] block with type "update_trip" and the updated itinerary in [ITINERARY_DATA].
- For general questions (recommendations, tips, weather, culture), just answer naturally in 1-2 sentences. Do NOT include action blocks.

[ACTION] FORMAT (use when creating or modifying trips):
[ACTION]
{
  "type": "create_trip" | "update_trip",
  "summary": "Short description like 'Trip to Ooty created' or 'Day 2 updated'",
  "confirmations": [
    {"label": "Timeline", "status": "done"},
    {"label": "Map", "status": "done"},
    {"label": "Budget", "status": "done"}
  ],
  "buttons": [
    {"label": "Timeline", "action": "open_timeline"},
    {"label": "Edit", "action": "edit_trip"},
    {"label": "Share", "action": "share"}
  ]
}
[/ACTION]

Then follow with:
[ITINERARY_DATA]
{
  "destinations": ["string"],
  "locations": [{"name": "string", "lat": number, "lng": number}],
  "totalBudget": number,
  "currency": "string",
  "days": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "09:00",
          "title": "string",
          "description": "string",
          "category": "morning" | "afternoon" | "evening",
          "estimatedCost": number,
          "location": {"name": "string", "lat": number, "lng": number},
          "tips": "string (optional)"
        }
      ]
    }
  ],
  "notes": "string (optional)"
}
[/ITINERARY_DATA]

Then end with a SHORT conversational confirmation (1 sentence max). Do NOT describe the itinerary in detail — the UI will show it.

IMPORTANT: Every activity location must have accurate lat/lng coordinates. Include a good mix of activities across morning/afternoon/evening for each day. Be realistic with costs.

CRITICAL: When the user has given enough details to plan a trip (destination + any duration/budget/intent), output the [ACTION] block immediately. Do NOT ask follow-up questions — use reasonable defaults for anything missing (3 days, moderate budget, mix of activities).`;

const INTERACTIVE_SYSTEM_PROMPT = `You are a friendly, ACTION-ORIENTED AI travel planner. Your goal is to collect enough information to create a complete trip itinerary, then output a trip.

CORE BEHAVIOR:
- Ask exactly ONE question at a time with clickable options
- Be decisive: once you have destination + at least approximate duration, immediately proceed to create the trip
- Use reasonable defaults: 3 days, moderate budget ($150/day/person), mix of attractions/food/culture, solo traveler
- Do NOT ask about trivial details like exact dates if not provided — use defaults
- Do NOT ask for information already in the conversation context

Rules:
1. Ask exactly ONE question per response with [QUESTION] block options.
2. Use type "single" for one choice, "multi" for several, "text" only for free-form input like specific destinations.
3. Keep messages short and warm (1 sentence max). The options should speak for themselves.
4. Track conversation history — never ask for info you already have.
5. BE DECISIVE: Once you have at least DESTINATION and DURATION (or enough to infer them), immediately output [ACTION] + [ITINERARY_DATA] blocks. Do NOT keep asking follow-up questions.
6. Use reasonable defaults: budget $150/day/person, solo traveler, mix of attractions/food/culture activities, moderate pace.

[QUESTION] format:
[QUESTION]
{
  "id": "unique_field_id",
  "type": "single" | "multi" | "text",
  "question": "Your short question?",
  "options": [{"value": "option_value", "label": "Human-readable label"}]
}
[/QUESTION]

When you have enough info (destination + duration), output this action block:

[ACTION]
{
  "type": "create_trip",
  "summary": "Trip to [Destination] created!",
  "confirmations": [
    {"label": "Destination", "status": "done"},
    {"label": "Timeline", "status": "done"},
    {"label": "Budget", "status": "done"}
  ],
  "buttons": [
    {"label": "View Itinerary", "action": "open_timeline"},
    {"label": "Edit", "action": "edit_trip"},
    {"label": "Save & Share", "action": "share"}
  ]
}
[/ACTION]

Then follow with itinerary data:
[ITINERARY_DATA]
{
  "destinations": ["Destination City"],
  "locations": [{"name": "Destination City", "lat": 0.0, "lng": 0.0}],
  "totalBudget": number,
  "currency": "USD",
  "days": [
    {
      "day": 1,
      "date": "2025-01-01",
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Brief description",
          "category": "morning" | "afternoon" | "evening",
          "estimatedCost": 0,
          "location": {"name": "Place name", "lat": 0.0, "lng": 0.0},
          "tips": "optional tip"
        }
      ]
    }
  ],
  "notes": "optional notes"
}
[/ITINERARY_DATA]

End with a SHORT message: "Your [destination] trip is ready!" (1 sentence max). Do NOT describe the itinerary in detail — the UI will show it.

IMPORTANT: Every activity location needs accurate lat/lng. Be realistic with costs. Include 3-4 activities per day mixing morning/afternoon/evening. Include real restaurants, attractions, and landmarks.`;

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-3.1-flash-lite";

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

function okResponse(data: SuccessResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function errResponse(data: ErrorResponse, status = 400): Response {
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
 * Call Google Gemini via its native REST API.
 * Gemini uses a different request format than OpenAI-compatible APIs.
 */
async function callGeminiProvider(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt: string,
  temperature = 0.7,
): Promise<ProviderResult> {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: 4000,
        topP: 0.95,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini returned ${response.status}: ${errorText.slice(0, 500)}`,
    );
  }

  const result = await response.json();
  const content = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No content returned from Gemini");
  }

  return { content, model };
}

/**
 * Call an OpenAI-compatible chat completion API (used for Natively).
 */
async function callOpenAICompatibleProvider(
  apiUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt: string,
  temperature = 0.7,
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
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature,
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
  if (!parsed.destinations || !Array.isArray(parsed.destinations) || !Array.isArray(parsed.days)) {
    throw new Error(
      "Response is missing required fields (destinations, days)",
    );
  }

  return parsed as ItineraryResponse;
}

/**
 * Parse an optional [QUESTION] block from interactive responses.
 */
function parseQuestion(content: string): InteractiveQuestion | undefined {
  const match = content.match(
    /\[QUESTION\]\s*(\{[\s\S]*?\})\s*\[\/QUESTION\]/i,
  );
  if (!match) return undefined;

  try {
    const parsed = JSON.parse(match[1]);
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.question === "string" &&
      ["single", "multi", "text"].includes(parsed.type)
    ) {
      return parsed as InteractiveQuestion;
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

/**
 * Parse an optional [FORM_PREFILL] block from any response.
 */
function parseFormPrefill(content: string): Record<string, unknown> | undefined {
  const match = content.match(
    /\[FORM_PREFILL\]\s*(\{[\s\S]*?\})\s*\[\/FORM_PREFILL\]/i,
  );
  if (!match) return undefined;

  try {
    return JSON.parse(match[1]);
  } catch {
    return undefined;
  }
}

/**
 * Parse an optional [ACTION] block from any response.
 */
function parseAction(content: string): ActionData | undefined {
  const match = content.match(
    /\[ACTION\]\s*(\{[\s\S]*?\})\s*\[\/ACTION\]/i,
  );
  if (!match) return undefined;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && ['create_trip', 'update_trip'].includes(parsed.type)) {
      return parsed as ActionData;
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

/**
 * Parse an optional [ITINERARY_DATA] block containing a full itinerary.
 */
function parseItineraryData(content: string): ItineraryResponse | undefined {
  const match = content.match(
    /\[ITINERARY_DATA\]\s*(\{[\s\S]*?\})\s*\[\/ITINERARY_DATA\]/i,
  );
  if (!match) return undefined;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && Array.isArray(parsed.destinations) && Array.isArray(parsed.days)) {
      return parsed as ItineraryResponse;
    }
  } catch {
    // ignore parse errors
  }
  return undefined;
}

/**
 * Strip all special markers from a chat response.
 */
function cleanChatResponse(content: string): string {
  return content
    .replace(/\[ITINERARY_UPDATE\][\s\S]*?\[\/ITINERARY_UPDATE\]/gi, "")
    .replace(/\[FORM_PREFILL\][\s\S]*?\[\/FORM_PREFILL\]/gi, "")
    .replace(/\[QUESTION\][\s\S]*?\[\/QUESTION\]/gi, "")
    .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/gi, "")
    .replace(/\[ITINERARY_DATA\][\s\S]*?\[\/ITINERARY_DATA\]/gi, "")
    .trim();
}

/**
 * Call Gemini — generate mode.
 */
async function callGeminiGenerate(prompt: string, temperature: number): Promise<{
  itinerary: ItineraryResponse;
  model: string;
}> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const result = await callGeminiProvider(
    apiKey,
    GEMINI_MODEL,
    prompt,
    GENERATE_SYSTEM_PROMPT,
    temperature,
  );

  return {
    itinerary: parseItinerary(result.content),
    model: result.model,
  };
}

/**
 * Call Natively AI — generate mode.
 */
async function callNativelyGenerate(prompt: string, temperature: number): Promise<{
  itinerary: ItineraryResponse;
  model: string;
}> {
  const apiKey = Deno.env.get("NATIVELY_API_KEY");
  if (!apiKey) {
    throw new Error("Natively API key is not configured");
  }

  const result = await callOpenAICompatibleProvider(
    NATIVELY_API_URL,
    apiKey,
    NATIVELY_MODEL,
    prompt,
    GENERATE_SYSTEM_PROMPT,
    temperature,
  );

  return {
    itinerary: parseItinerary(result.content),
    model: result.model,
  };
}

/**
 * Call Gemini — chat mode. Returns raw text.
 */
async function callGeminiChat(prompt: string, temperature: number): Promise<{
  text: string;
  model: string;
}> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const result = await callGeminiProvider(
    apiKey,
    GEMINI_MODEL,
    prompt,
    CHAT_SYSTEM_PROMPT,
    temperature,
  );

  return { text: result.content, model: result.model };
}

/**
 * Call Natively AI — chat mode. Returns raw text.
 */
async function callNativelyChat(prompt: string, temperature: number): Promise<{
  text: string;
  model: string;
}> {
  const apiKey = Deno.env.get("NATIVELY_API_KEY");
  if (!apiKey) {
    throw new Error("Natively API key is not configured");
  }

  const result = await callOpenAICompatibleProvider(
    NATIVELY_API_URL,
    apiKey,
    NATIVELY_MODEL,
    prompt,
    CHAT_SYSTEM_PROMPT,
    temperature,
  );

  return { text: result.content, model: result.model };
}

/**
 * Call Gemini — interactive mode. Returns raw text.
 */
async function callGeminiInteractive(prompt: string, temperature: number): Promise<{
  text: string;
  model: string;
}> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const result = await callGeminiProvider(
    apiKey,
    GEMINI_MODEL,
    prompt,
    INTERACTIVE_SYSTEM_PROMPT,
    temperature,
  );

  return { text: result.content, model: result.model };
}

/**
 * Call Natively AI — interactive mode. Returns raw text.
 */
async function callNativelyInteractive(prompt: string, temperature: number): Promise<{
  text: string;
  model: string;
}> {
  const apiKey = Deno.env.get("NATIVELY_API_KEY");
  if (!apiKey) {
    throw new Error("Natively API key is not configured");
  }

  const result = await callOpenAICompatibleProvider(
    NATIVELY_API_URL,
    apiKey,
    NATIVELY_MODEL,
    prompt,
    INTERACTIVE_SYSTEM_PROMPT,
    temperature,
  );

  return { text: result.content, model: result.model };
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
    return errResponse(
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
      return errResponse(
        { error: "Missing required field: prompt" },
        400,
      );
    }

    const mode = body.mode ?? "generate";
    const preferredProvider = body.provider ?? "auto";
    const temperature = body.temperature ?? 0.7;

    // 3. Dispatch based on mode
    if (mode === "chat" || mode === "interactive") {
      // ── Chat / Interactive mode ─────────────────────────────────
      const isInteractive = mode === "interactive";
      const chatPlan: Array<{
        name: ProviderName;
        call: () => Promise<{ text: string; model: string }>;
        error?: string;
      }> = [];

      if (preferredProvider === "gemini") {
        chatPlan.push({
          name: "gemini",
          call: () => isInteractive
            ? callGeminiInteractive(body.prompt, temperature)
            : callGeminiChat(body.prompt, temperature),
        });
        chatPlan.push({
          name: "natively",
          call: () => isInteractive
            ? callNativelyInteractive(body.prompt, temperature)
            : callNativelyChat(body.prompt, temperature),
        });
      } else if (preferredProvider === "natively") {
        chatPlan.push({
          name: "natively",
          call: () => isInteractive
            ? callNativelyInteractive(body.prompt, temperature)
            : callNativelyChat(body.prompt, temperature),
        });
      } else {
        // auto: try Gemini first, fall back to Natively
        chatPlan.push({
          name: "gemini",
          call: () => isInteractive
            ? callGeminiInteractive(body.prompt, temperature)
            : callGeminiChat(body.prompt, temperature),
        });
        chatPlan.push({
          name: "natively",
          call: () => isInteractive
            ? callNativelyInteractive(body.prompt, temperature)
            : callNativelyChat(body.prompt, temperature),
        });
      }

      let chatResult: { text: string; provider: ProviderName; model: string } | null = null;

      for (const plan of chatPlan) {
        try {
          const { text, model } = await plan.call();
          chatResult = { text, provider: plan.name, model };
          break;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          plan.error = errorMessage;
          console.warn(`${isInteractive ? "Interactive" : "Chat"} provider "${plan.name}" failed:`, errorMessage);
          continue;
        }
      }

      if (!chatResult) {
        const providerErrors: Record<string, string> = {};
        for (const plan of chatPlan) {
          if (plan.error) providerErrors[plan.name] = plan.error;
        }
        return errResponse(
          {
            error: "All AI providers failed",
            details: Object.entries(providerErrors).map(([n, e]) => `${n}: ${e}`).join(" | "),
            diagnostics: {
              gemini_key_present: Boolean(Deno.env.get("GEMINI_API_KEY")),
              natively_key_present: Boolean(Deno.env.get("NATIVELY_API_KEY")),
              provider_errors: providerErrors,
            },
          },
          503,
        );
      }

      const formPrefill = parseFormPrefill(chatResult.text);
      const question = isInteractive ? parseQuestion(chatResult.text) : undefined;
      const action = parseAction(chatResult.text);
      const itineraryData = parseItineraryData(chatResult.text);
      const cleanResponse = cleanChatResponse(chatResult.text);

      const responsePayload: ChatSuccessResponse = {
        chatResponse: cleanResponse,
        provider: chatResult.provider,
        model: chatResult.model,
      };

      if (action) {
        responsePayload.action = action.type;
        responsePayload.actionData = action;
      }

      if (itineraryData) {
        responsePayload.itinerary = itineraryData;
      }

      if (formPrefill) {
        responsePayload.formPrefill = formPrefill;
      }

      if (question) {
        responsePayload.question = question;
      }

      return okResponse(responsePayload);
    } else {
      // ── Generate mode ───────────────────────────────────────────
      const executionPlan: Array<{
        name: ProviderName;
        call: () => Promise<{ itinerary: ItineraryResponse; model: string }>;
        error?: string;
      }> = [];

      if (preferredProvider === "gemini") {
        executionPlan.push({ name: "gemini", call: () => callGeminiGenerate(body.prompt, temperature) });
        executionPlan.push({ name: "natively", call: () => callNativelyGenerate(body.prompt, temperature) });
      } else if (preferredProvider === "natively") {
        executionPlan.push({ name: "natively", call: () => callNativelyGenerate(body.prompt, temperature) });
      } else {
        executionPlan.push({ name: "gemini", call: () => callGeminiGenerate(body.prompt, temperature) });
        executionPlan.push({ name: "natively", call: () => callNativelyGenerate(body.prompt, temperature) });
      }

      let result: { itinerary: ItineraryResponse; provider: ProviderName; model: string } | null = null;

      for (const plan of executionPlan) {
        try {
          const { itinerary, model } = await plan.call();
          result = { itinerary, provider: plan.name, model };
          break;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          plan.error = errorMessage;
          console.warn(`Generate provider "${plan.name}" failed:`, errorMessage);
          continue;
        }
      }

      if (!result) {
        const providerErrors: Record<string, string> = {};
        for (const plan of executionPlan) {
          if (plan.error) providerErrors[plan.name] = plan.error;
        }
        return errResponse(
          {
            error: "All AI providers failed",
            details: Object.entries(providerErrors).map(([n, e]) => `${n}: ${e}`).join(" | "),
            diagnostics: {
              gemini_key_present: Boolean(Deno.env.get("GEMINI_API_KEY")),
              natively_key_present: Boolean(Deno.env.get("NATIVELY_API_KEY")),
              provider_errors: providerErrors,
            },
          },
          503,
        );
      }

      return okResponse({
        itinerary: result.itinerary,
        provider: result.provider,
        model: result.model,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generate-itinerary error:", message);

    if (
      message.includes("JWT") ||
      message.includes("Authorization") ||
      message.includes("auth")
    ) {
      return errResponse({ error: message }, 401);
    }

    return errResponse({ error: "Internal server error" }, 500);
  }
});
