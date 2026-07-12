import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, Loader2, RefreshCw, Check, CheckCheck, CheckCircle2,
  Map, List, Share2, ExternalLink, Sparkles, MapPin, Clock,
  UtensilsCrossed, DollarSign, Globe, Compass, Target,
  Copy, Check as CheckIcon, Pencil, X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';
import { AI_CONFIG } from '../../constants/config';
import type { ItineraryResponse } from '../../types/itinerary';
import type { FormState } from './trip-planner-form';
import { useConversations } from '../../hooks/useConversations';

interface ActionData {
  type: 'create_trip' | 'update_trip';
  summary: string;
  confirmations: Array<{ label: string; status: 'ready' | 'updating' | 'done' }>;
  buttons: Array<{ label: string; action: string }>;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'action';
  content: string;
  timestamp: number;
  failed?: boolean;
  question?: InteractiveQuestion;
  actionData?: ActionData;
  tripId?: string;
}

interface QuestionOption {
  value: string;
  label: string;
}

interface InteractiveQuestion {
  id: string;
  type: 'single' | 'multi' | 'text';
  question: string;
  options?: QuestionOption[];
}

interface TravelProfile {
  travel_style?: string[];
  pace?: string;
  budget_range?: string;
  interests?: string[];
  food_preferences?: string[];
  companion_preference?: string;
  accommodation_preference?: string;
  transport_preferences?: string[];
}

interface AiChatProps {
  onUpdateItinerary?: (itinerary: ItineraryResponse) => void;
  onPrefillForm?: (prefill: Partial<FormState>) => void;
  onCreateTrip?: (itinerary: ItineraryResponse) => Promise<string | undefined>;
  onActionButton?: (action: string, tripId?: string) => void;
  currentItinerary?: ItineraryResponse | null;
  destinations?: string[];
  profile?: TravelProfile | null;
  /** Optional conversation ID to restore */
  conversationId?: string | null;
  /** Optional external conversation title to display */
  conversationTitle?: string;
}

interface ProgressStep {
  icon: typeof MapPin;
  label: string;
  status: 'pending' | 'active' | 'done';
}

const DEFAULT_PROGRESS_STEPS: Array<{ icon: typeof MapPin; label: string }> = [
  { icon: MapPin, label: 'Understanding destination' },
  { icon: Compass, label: 'Finding attractions' },
  { icon: Target, label: 'Optimizing route' },
  { icon: DollarSign, label: 'Calculating budget' },
  { icon: UtensilsCrossed, label: 'Finding local restaurants' },
  { icon: Globe, label: 'Creating itinerary' },
  { icon: Map, label: 'Preparing map' },
];

const DEFAULT_SUGGESTIONS = [
  'Plan a 7-day trip to Japan for $2000',
  'Plan a weekend in Paris',
  'Family trip to Bali with kids',
  'Backpacking across Thailand',
  'Luxury food tour in Italy',
  'Relaxing beach holiday in Maldives',
];

const DYNAMIC_SUGGESTIONS = [
  'Make it cheaper',
  'Luxury version',
  'Add hidden gems',
  'Family friendly',
  'Adventure mode',
  'Food tour',
];

export function AiChat({
  onUpdateItinerary,
  onPrefillForm,
  onCreateTrip,
  onActionButton,
  currentItinerary,
  destinations,
  profile,
  conversationId: externalConversationId,
  conversationTitle,
}: AiChatProps) {
  const isInteractive = !currentItinerary;

  const { conversations, createConversation, updateConversation, deleteConversation } = useConversations();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // If we have an external conversation, start with empty — parent will restore
    if (externalConversationId) return [];
    return [
      {
        role: 'assistant',
        content: isInteractive
          ? "👋 Welcome! I'm your Travel Copilot. Let's build your trip together — just tap the options below, or type your own answer."
          : `👋 I'm your Travel Copilot. I can help you refine your trip to **${destinations?.join(' → ') || 'your destination'}**.`,
        timestamp: Date.now(),
      },
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [tripCreatedId, setTripCreatedId] = useState<string | undefined>(undefined);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef<number>(messages.length);
  const conversationIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external conversation ID
  useEffect(() => {
    if (externalConversationId && externalConversationId !== conversationIdRef.current) {
      conversationIdRef.current = externalConversationId;
    }
  }, [externalConversationId]);

  // Restore messages when externalConversationId changes — parent will push messages
  useEffect(() => {
    if (externalConversationId && messages.length === 0) {
      // Find the conversation and restore
      const conv = conversations.find(c => c.id === externalConversationId);
      if (conv && conv.messages && Array.isArray(conv.messages)) {
        const restored = conv.messages as ChatMessage[];
        if (restored.length > 0) {
          setMessages(restored);
          // If there's an associated trip, we could restore it too
        }
        return;
      }
      // No messages found, insert default welcome
      setMessages([{
        role: 'assistant',
        content: "👋 Welcome back! I'm your Travel Copilot. Let's continue planning.",
        timestamp: Date.now(),
      }]);
    }
  }, [externalConversationId, conversations, messages.length]);

  // Auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    const justAddedMessage = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;
    if (!container) return;
    if (justAddedMessage || loading || generating) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading, generating]);

  // Auto-save conversation to DB (debounced)
  useEffect(() => {
    if (!conversationIdRef.current || messages.length <= 1) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      // Build a title from the first user message or conversationTitle
      const firstUserMsg = messages.find(m => m.role === 'user')?.content;
      const title = conversationTitle || firstUserMsg?.slice(0, 60) || 'New Chat';
      const safeMessages = messages.map(m => ({
        ...m,
        // Strip functions from messages before saving
        question: m.question ? { ...m.question } : undefined,
        actionData: m.actionData ? { ...m.actionData } : undefined,
      }));
      updateConversation.mutate({
        id: conversationIdRef.current!,
        title,
        messages: safeMessages as Record<string, unknown>[],
        message_count: messages.filter(m => m.role !== 'system').length,
      });
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, updateConversation, conversationTitle]);

  const currentQuestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (
        msg.role === 'assistant' &&
        msg.question &&
        answers[msg.question.id] === undefined
      ) {
        return msg.question;
      }
    }
    return undefined;
  }, [messages, answers]);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  // Last few assistant messages for dynamic suggestions
  const lastAssistantContent = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && !messages[i].failed) {
        return messages[i].content;
      }
    }
    return '';
  }, [messages]);

  // Determine if we should show dynamic suggestions
  const showDynamicSuggestions = useMemo(() => {
    if (loading || generating) return false;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return false;
    // Show after any assistant message that isn't the welcome
    if (lastMsg.role === 'assistant' && lastMsg !== messages[0]) {
      return !lastMsg.failed;
    }
    return false;
  }, [messages, loading, generating]);

  // Last dynamic suggestions
  const lastDynamicSuggestions = useRef<string[]>([]);

  const handleCreateConversation = useCallback(async () => {
    if (conversationIdRef.current) return conversationIdRef.current;
    try {
      // Pick a relevant title from the first meaningful message
      const firstUserMsg = messages.find(m => m.role === 'user')?.content;
      const title = firstUserMsg?.slice(0, 60) || 'New Chat';
      const result = await createConversation.mutateAsync({ title });
      conversationIdRef.current = result.id;
      return result.id;
    } catch {
      return null;
    }
  }, [messages, createConversation]);

  const buildPrompt = (
    userContent: string,
    conversationHistory: ChatMessage[]
  ): string => {
    const historyText = conversationHistory
      .filter((m) => m.role !== 'system')
      .map((m) => {
        const q = m.question
          ? `\n[QUESTION: ${m.question.id} - ${m.question.type}] ${m.question.question}`
          : '';
        return `${m.role === 'user' ? 'Traveler' : 'Planner'}: ${m.content}${q}`;
      })
      .join('\n');

    const itineraryContext = currentItinerary
      ? `\nCurrent Itinerary:\n${JSON.stringify(currentItinerary, null, 2)}`
      : '';

    const collectedAnswers = Object.keys(answers).length
      ? `\nAlready collected answers:\n${JSON.stringify(answers, null, 2)}`
      : '';

    const profileContext = profile
      ? `\n\nTraveler Profile:\n${JSON.stringify(profile, null, 2)}`
      : '';

    const baseContext = `You are a friendly AI travel planner helping a traveler.

Context:
- Destinations: ${destinations?.join(', ') || 'Not specified'}${itineraryContext}${collectedAnswers}${profileContext}`;

    if (isInteractive) {
      return `${baseContext}

Conversation so far:
${historyText}

Traveler just said: ${userContent}

IMPORTANT — You are an application controller that drives the UI with structured data, NOT a text generator. Keep your text response EXTREMELY SHORT (1-2 lines). Never describe the itinerary in prose.

Ask ONE [QUESTION] at a time. Use the Traveler Profile (${
        profile ? 'AVAILABLE — use it for defaults' : 'NOT AVAILABLE'
      }) to skip redundant questions.

Once you have destination + approximate duration (default 3 days), immediately output [ACTION] + [ITINERARY_DATA]. Do NOT ask "shall I proceed?". Be decisive.

[ACTION]
{
  "type": "create_trip",
  "summary": "Brief human-friendly summary",
  "confirmations": [{ "label": "Timeline", "status": "done" }, { "label": "Map", "status": "done" }, { "label": "Budget", "status": "done" }],
  "buttons": [{ "label": "View Itinerary", "action": "open_timeline" }, { "label": "Edit", "action": "edit_trip" }]
}
[/ACTION]

Then include the full itinerary:
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

The [ACTION] + [ITINERARY_DATA] combo is REQUIRED when creating a trip. Do NOT just ask "shall I proceed?" — proceed automatically.`;
    }

    return `${baseContext}

Conversation so far:
${historyText}

Traveler just said: ${userContent}

IMPORTANT — You are an application controller that drives the UI with structured data, NOT a text generator. Keep your text response VERY SHORT (1-2 lines). Never describe the itinerary in prose.

Decide what action to take:
- "create_trip" — if they want to plan a new trip (destination + duration + budget = enough to start)
- "update_trip" — if they want changes to the current itinerary
- No action — for general questions, chit-chat, suggestions without commitment

Only ask ONE question at a time if you truly need more info. Prefer using reasonable defaults.
You can use a [QUESTION] block with interactive options if needed.

When you're ready to take action, include an [ACTION] block and [ITINERARY_DATA] block:

[ACTION]
{
  "type": "create_trip" | "update_trip",
  "summary": "Brief human-friendly summary of what was done",
  "confirmations": [{ "label": "Timeline", "status": "done" }, { "label": "Map", "status": "done" }, { "label": "Budget", "status": "done" }],
  "buttons": [{ "label": "View Itinerary", "action": "open_timeline" }, { "label": "Edit", "action": "edit_trip" }, { "label": "Share", "action": "share" }]
}
[/ACTION]

Then include the full itinerary:
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

The [ACTION] block with [ITINERARY_DATA] is REQUIRED when creating or updating a trip.`;
  };

  const submitChatMessage = async (userContent: string) => {
    setLoading(true);
    setSelectedOptions([]);
    lastDynamicSuggestions.current = [];

    // Auto-create conversation on first user message
    if (!conversationIdRef.current) {
      const convId = await handleCreateConversation();
      if (!convId) {
        // Fallback: continue without persistence
      }
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'user' && last.content === userContent) {
        return prev;
      }
      return [...prev, userMsg];
    });

    try {
      const conversationHistory = messages.filter((m) => !m.failed);
      const prompt = buildPrompt(userContent, [...conversationHistory, userMsg]);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(AI_CONFIG.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          mode: isInteractive ? 'interactive' : 'chat',
          provider: 'auto',
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const diagnostics = errorBody.diagnostics
          ? `\n\nKeys configured — Gemini: ${errorBody.diagnostics.gemini_key_present ? 'yes' : 'no'}, Natively: ${errorBody.diagnostics.natively_key_present ? 'yes' : 'no'}`
          : '';
        throw new Error(
          `${errorBody.error || 'Failed to get AI response'}${
            errorBody.details ? `\n\nDetails: ${errorBody.details}` : ''
          }${diagnostics}`
        );
      }

      const result = await response.json();
      const aiContent =
        result.chatResponse ||
        result.response ||
        'I had trouble processing that. Could you rephrase?';
      const formPrefill: Partial<FormState> | undefined = result.formPrefill;
      const question: InteractiveQuestion | undefined = result.question;
      const action: string | undefined = result.action;
      const actionData: ActionData | undefined = result.actionData;

      // Handle create_trip action
      if (action === 'create_trip') {
        if (formPrefill && onPrefillForm) {
          onPrefillForm(formPrefill);
        }

        if (result.itinerary?.days) {
          onUpdateItinerary?.(result.itinerary);

          let tripId: string | undefined;
          if (onCreateTrip) {
            tripId = await onCreateTrip(result.itinerary);
            if (tripId) setTripCreatedId(tripId);
          }

          const destination = result.itinerary.destinations?.[0] || 'Trip';
          const duration = result.itinerary.days?.length || 0;
          const activities = result.itinerary.days?.reduce(
            (sum: number, d: any) => sum + (d.activities?.length || 0), 0
          ) || 0;

          // Set dynamic suggestions for post-trip
          lastDynamicSuggestions.current = DYNAMIC_SUGGESTIONS;

          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: `🎉 **Your ${destination} trip is ready!**`,
            timestamp: Date.now(),
            actionData: {
              type: 'create_trip',
              summary: `📍 ${destination} • 🗓 ${duration} day${duration !== 1 ? 's' : ''} • ⭐ ${activities} activit${activities !== 1 ? 'ies' : 'y'}`,
              confirmations: [
                { label: 'Timeline Updated', status: 'done' },
                { label: 'Map Updated', status: 'done' },
                { label: 'Budget Calculated', status: 'done' },
              ],
              buttons: [
                { label: 'Open Itinerary', action: 'open_timeline' },
                { label: 'View Map', action: 'open_map' },
                { label: 'Edit Trip', action: 'edit_trip' },
                ...(tripId ? [{ label: 'Save Trip', action: 'save_trip' }] : []),
                { label: 'Share', action: 'share' },
              ],
            },
            tripId,
          };

          setMessages((prev) => {
            const cleaned = prev.filter((m) => !m.failed);
            return [...cleaned, assistantMsg];
          });
          return;
        }

        if (formPrefill) {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: '✅ **Preferences gathered!** Tap generate to build your itinerary.',
            timestamp: Date.now(),
            actionData: {
              ...(actionData || {
                type: 'create_trip',
                summary: 'Trip preferences ready',
                confirmations: [],
                buttons: [],
              }),
              buttons: [
                { label: 'Generate Itinerary', action: 'generate_itinerary' },
                ...(actionData?.buttons || []),
              ],
            },
          };

          setMessages((prev) => {
            const cleaned = prev.filter((m) => !m.failed);
            return [...cleaned, assistantMsg];
          });
          return;
        }
      }

      // Handle update_trip action
      if (action === 'update_trip') {
        if (result.itinerary?.days) {
          onUpdateItinerary?.(result.itinerary);
        }

        lastDynamicSuggestions.current = DYNAMIC_SUGGESTIONS;

        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: `✅ **${actionData?.summary || 'Trip updated!'}**`,
          timestamp: Date.now(),
          actionData,
        };

        setMessages((prev) => {
          const cleaned = prev.filter((m) => !m.failed);
          return [...cleaned, assistantMsg];
        });
        return;
      }

      // Handle form prefills — auto-generate when no action detected
      if (formPrefill) {
        if (onPrefillForm) {
          onPrefillForm(formPrefill);
          const msg = formPrefill
            ? '✅ Got it! I\'ve prefilled the form based on your answers.'
            : "I've prefilled the planner form based on your preferences.";
          setMessages((prev) => [
            ...prev.filter((m) => !m.failed),
            {
              role: 'assistant',
              content: msg,
              timestamp: Date.now(),
            },
          ]);
          return;
        } else if (onCreateTrip) {
          setMessages((prev) => [
            ...prev.filter((m) => !m.failed),
            {
              role: 'assistant',
              content: '✅ Got it! Building your itinerary now...',
              timestamp: Date.now(),
            },
          ]);
          await generateTripFromPrefill(formPrefill);
          return;
        }
      }

      // Default: conversational response
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now(),
        question,
      };

      // If itinerary data is embedded but no action was returned, still update UI
      if (result.itinerary?.days && result.itinerary !== currentItinerary) {
        onUpdateItinerary?.(result.itinerary);
      }

      // Attach action data buttons even for null actions
      if (!action && actionData?.buttons?.length) {
        assistantMsg.actionData = actionData;
      }

      setMessages((prev) => {
        const cleaned = prev.filter((m) => !m.failed);
        return [...cleaned, assistantMsg];
      });
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err?.message ||
            "Sorry, I couldn't reach the AI right now. Try again in a moment!",
          timestamp: Date.now(),
          failed: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (value: string) => {
    if (!currentQuestion) return;

    if (currentQuestion.type === 'single') {
      const label =
        currentQuestion.options?.find((o) => o.value === value)?.label || value;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
      submitChatMessage(label);
    } else if (currentQuestion.type === 'multi') {
      setSelectedOptions((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    }
  };

  const handleMultiConfirm = () => {
    if (!currentQuestion || selectedOptions.length === 0) return;
    const labels =
      currentQuestion.options
        ?.filter((o) => selectedOptions.includes(o.value))
        .map((o) => o.label) || selectedOptions;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedOptions }));
    submitChatMessage(labels.join(', '));
  };

  const generateTripFromPrefill = async (prefill: Partial<FormState>) => {
    if (!onCreateTrip) return;
    setGenerating(true);

    setProgressSteps(
      DEFAULT_PROGRESS_STEPS.map((step, i) => ({
        icon: step.icon,
        label: step.label,
        status: i === 0 ? 'active' : ('pending' as const),
      }))
    );

    for (let i = 0; i < DEFAULT_PROGRESS_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      setProgressSteps((prev) =>
        prev.map((s, j) => ({
          ...s,
          status: j === i ? 'done' as const : j === i + 1 ? 'active' as const : j > i ? 'pending' as const : s.status,
        }))
      );
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { destinations: dests, startDate, endDate, budget, travelers, interests, travelStyle } = prefill;
      const duration = startDate && endDate
        ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
        : undefined;

      const generatePrompt = `Plan a ${duration || 3}-day trip to ${dests?.join(', ') || (destinations?.join(', ') || 'this destination')}.
${budget ? `Budget: ${budget}` : ''}
${travelers ? `Travelers: ${JSON.stringify(travelers)}` : ''}
${interests ? `Interests: ${JSON.stringify(interests)}` : ''}
${travelStyle ? `Travel style: ${JSON.stringify(travelStyle)}` : ''}
${profile ? `Traveler profile: ${JSON.stringify(profile)}` : ''}
${startDate ? `Start date: ${startDate}` : ''}

Generate a complete day-by-day itinerary with activities, locations (with lat/lng), costs, and tips.`;

      const response = await fetch(AI_CONFIG.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: generatePrompt,
          mode: 'chat',
          provider: 'auto',
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const result = await response.json();
      const itinerary: ItineraryResponse | undefined = result.itinerary;

      if (!itinerary?.days) {
        throw new Error('No itinerary data returned');
      }

      onUpdateItinerary?.(itinerary);

      const tripId = await onCreateTrip(itinerary);
      if (tripId) setTripCreatedId(tripId);

      setProgressSteps((prev) =>
        prev.map((s) => ({ ...s, status: 'done' as const }))
      );

      const destination = dests?.[0] || itinerary.destinations?.[0] || 'Trip';
      const activityCount = itinerary.days?.reduce(
        (sum: number, d: any) => sum + (d.activities?.length || 0), 0
      ) || 0;

      lastDynamicSuggestions.current = DYNAMIC_SUGGESTIONS;

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: `🎉 **Your ${destination} trip is ready!**`,
        timestamp: Date.now(),
        actionData: {
          type: 'create_trip',
          summary: `📍 ${destination} • 🗓 ${itinerary.days?.length || 0} day${(itinerary.days?.length || 0) !== 1 ? 's' : ''} • ⭐ ${activityCount} activit${activityCount !== 1 ? 'ies' : 'y'}`,
          confirmations: [
            { label: 'Timeline Updated', status: 'done' },
            { label: 'Map Updated', status: 'done' },
            { label: 'Budget Calculated', status: 'done' },
          ],
          buttons: [
            { label: 'Open Itinerary', action: 'open_timeline' },
            { label: 'View Map', action: 'open_map' },
            { label: 'Edit Trip', action: 'edit_trip' },
            ...(tripId ? [{ label: 'Save Trip', action: 'save_trip' }] : []),
            { label: 'Share', action: 'share' },
          ],
        },
        tripId,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setProgressSteps([]);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err?.message ||
            "Sorry, I couldn't generate the itinerary right now. Please try again.",
          timestamp: Date.now(),
          failed: true,
        },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || generating) return;
    setInput('');
    submitChatMessage(trimmed);
  };

  const handleRetry = (failedIndex: number) => {
    if (loading || generating) return;

    let userContent: string | null = null;
    for (let i = failedIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userContent = messages[i].content;
        break;
      }
    }

    if (!userContent) return;

    setMessages((prev) => prev.slice(0, failedIndex));
    setSelectedOptions([]);

    submitChatMessage(userContent);
  };

  const handleCopyResponse = (content: string, index: number) => {
    navigator.clipboard.writeText(content.replace(/\*\*/g, ''));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEditMessage = (index: number, content: string) => {
    setEditingIndex(index);
    setEditDraft(content);
  };

  const handleEditSubmit = (index: number) => {
    if (!editDraft.trim()) return;
    // Remove the following assistant messages and resend
    setMessages((prev) => prev.slice(0, index + 1));
    setEditingIndex(null);
    setEditDraft('');
    submitChatMessage(editDraft.trim());
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditDraft('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleRegenerate = async () => {
    if (!currentItinerary || regenerating) return;
    setRegenerating(true);

    try {
      const userRequests = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('\n');

      const prompt = `Based on this conversation with a traveler, update their itinerary.

Traveler's requests/feedback:
${userRequests}

Current itinerary:
${JSON.stringify(currentItinerary, null, 2)}

Please generate a COMPLETE updated itinerary (same structure as the current one) that addresses all their requests. Return ONLY valid JSON.`;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(AI_CONFIG.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, provider: 'auto' }),
      });

      if (!response.ok) throw new Error('Regeneration failed');

      const result = await response.json();
      if (result.itinerary?.days) {
        onUpdateItinerary?.(result.itinerary);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "✅ **Itinerary updated!** Check the timeline and map to see changes.",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err?.message ||
            "Sorry, I couldn't update the itinerary. Please try again.",
          timestamp: Date.now(),
          failed: true,
        },
      ]);
    } finally {
      setRegenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingIndex !== null) {
        handleEditSubmit(editingIndex);
      } else {
        handleSend();
      }
    }
    if (e.key === 'Escape' && editingIndex !== null) {
      handleEditCancel();
    }
  };

  const handleActionButtonClick = (action: string, tripId?: string) => {
    if (action.startsWith('navigate:')) {
      onActionButton?.(action.replace('navigate:', ''), tripId);
      return;
    }
    onActionButton?.(action, tripId);
  };

  const renderActionConfirmation = (actionData: ActionData, tripId?: string) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 max-w-[85%] rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        {/* Summary line */}
        <p className="mb-3 text-sm font-medium text-foreground">{actionData.summary}</p>

        {/* Confirmation steps */}
        {actionData.confirmations?.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {actionData.confirmations.map((conf, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 text-xs ${
                  conf.status === 'done'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                }`}
              >
                {conf.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                {conf.status === 'updating' && (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                )}
                {conf.status === 'ready' && (
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
                )}
                <span>{conf.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {actionData.buttons?.length > 0 && (actionData.type === 'create_trip' || tripId || actionData.type === 'update_trip') && (
          <div className="flex flex-wrap gap-2">
            {actionData.buttons.map((btn, idx) => (
              <Button
                key={idx}
                variant={btn.action === 'open_timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleActionButtonClick(btn.action, tripId)}
                className="gap-1.5 text-xs"
              >
                {btn.action === 'open_timeline' ? (
                  <List className="h-3.5 w-3.5" />
                ) : btn.action === 'open_map' ? (
                  <Map className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {btn.label}
              </Button>
            ))}
          </div>
        )}

        {/* Suggestion-style buttons */}
        {!actionData.type && actionData.buttons?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actionData.buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(btn.label);
                  handleSend();
                }}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderQuestionCard = (
    question: InteractiveQuestion,
    isActive: boolean
  ) => {
    const savedAnswer = answers[question.id];
    const isAnswered = savedAnswer !== undefined;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-2 max-w-[85%] rounded-2xl border border-border/50 p-4 ${
          isActive ? 'bg-card' : 'bg-muted/30 opacity-80'
        }`}
      >
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Bot className="h-3.5 w-3.5" />
          <span>Copilot</span>
          {isInteractive && answeredCount > 0 && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
              {answeredCount} answered
            </span>
          )}
        </div>
        <p className="mb-3 text-sm font-medium text-foreground">
          {question.question}
        </p>

        {question.type === 'text' ? (
          <p className="text-xs text-muted-foreground">
            {isAnswered
              ? `Your answer: ${savedAnswer}`
              : 'Type your answer below and press Enter.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {question.options?.map((option) => {
              const selected =
                question.type === 'single'
                  ? savedAnswer === option.value
                  : selectedOptions.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!isActive || isAnswered}
                  onClick={() => handleOptionSelect(option.value)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  } ${
                    !isActive || isAnswered
                      ? 'cursor-default opacity-60'
                      : 'cursor-pointer'
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'multi' && isActive && !isAnswered && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {selectedOptions.length > 0
                ? `${selectedOptions.length} selected`
                : 'Pick one or more options'}
            </span>
            <Button
              size="sm"
              onClick={handleMultiConfirm}
              disabled={selectedOptions.length === 0}
              className="h-7 gap-1 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Confirm
            </Button>
          </div>
        )}

        {isAnswered && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
            <Check className="h-3.5 w-3.5" />
            <span>
              {Array.isArray(savedAnswer)
                ? savedAnswer.join(', ')
                : String(savedAnswer)}
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  // Show initial suggestions only on welcome screen
  const showInitialSuggestions = isInteractive && messages.length <= 1 && !loading && !generating && editingIndex === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col overflow-hidden bg-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Travel Copilot
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {isInteractive
                ? 'Tap options to plan your trip'
                : 'I can help refine your trip'}
            </p>
          </div>
        </div>
        {currentItinerary && messages.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="gap-1.5 text-xs"
          >
            {regenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Apply to Itinerary
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isQuestionActive =
              msg.role === 'assistant' &&
              msg.question &&
              msg.question === currentQuestion;

            // Check if we're editing this user message
            const isEditing = editingIndex === i && msg.role === 'user';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`mb-3 flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {isEditing ? (
                  <div className="max-w-[80%] w-full">
                    <div className="flex items-center gap-2 rounded-2xl border border-primary/50 bg-primary/5 px-4 py-2.5">
                      <Input
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 border-0 bg-transparent p-0 text-sm text-foreground shadow-none focus-visible:ring-0"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={() => handleEditSubmit(i)} className="h-7 w-7 shrink-0">
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleEditCancel} className="h-7 w-7 shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : msg.failed
                        ? 'border border-destructive/30 bg-destructive/10 text-foreground'
                        : 'bg-muted/50 text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Bot className="h-3 w-3" />
                        <span>
                          {msg.failed ? 'Copilot (failed)' : 'Copilot'}
                        </span>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {msg.content.split('\n').map((line, j) => (
                        <p key={j} className="text-sm leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>

                    {/* User message actions (edit + copy) */}
                    {msg.role === 'user' && !loading && !generating && (
                      <div className="mt-1.5 flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditMessage(i, msg.content)}
                          className="cursor-pointer rounded p-1 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                          title="Edit & resend"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Assistant action buttons (copy) */}
                    {msg.role === 'assistant' && !msg.failed && !msg.actionData && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <button
                          onClick={() => handleCopyResponse(msg.content, i)}
                          className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy response"
                        >
                          {copiedIndex === i ? (
                            <CheckIcon className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.failed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(i)}
                        disabled={loading}
                        className="mt-2 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        {loading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Retry
                      </Button>
                    )}
                  </div>
                )}

                {/* Question card attached to assistant message */}
                {msg.role === 'assistant' && msg.question && (
                  <div className="mt-2">
                    {renderQuestionCard(msg.question, Boolean(isQuestionActive))}
                  </div>
                )}

                {/* Action confirmation card */}
                {msg.role === 'assistant' && msg.actionData && (
                  <div className="mt-2">
                    {renderActionConfirmation(msg.actionData, msg.tripId)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Dynamic suggestions after assistant responses */}
        {showDynamicSuggestions && lastDynamicSuggestions.current.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <p className="mb-2 text-[10px] font-medium text-muted-foreground">
              Want to refine it?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lastDynamicSuggestions.current.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="cursor-pointer rounded-full border border-border/50 bg-card px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Progress steps UI when generating */}
        {generating && progressSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 max-w-[85%] rounded-2xl border border-primary/20 bg-primary/5 p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Building your itinerary</span>
            </div>
            <div className="space-y-2">
              {progressSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {step.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      step.status === 'done'
                        ? 'text-green-600 dark:text-green-400'
                        : step.status === 'active'
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-4 py-2.5">
              <div className="flex gap-1">
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: '0s' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: '0.15s' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: '0.3s' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: '0.45s' }}
                />
              </div>
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showInitialSuggestions && (
        <div className="border-t border-border/50 px-4 py-2">
          <p className="mb-2 text-[10px] font-medium text-muted-foreground">
            Try starting with:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setInput(suggestion);
                }}
                className="cursor-pointer rounded-full border border-border/50 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 p-3">
        <div className="flex items-center gap-2">
          <Input
            value={editingIndex !== null ? editDraft : input}
            onChange={(e) => {
              if (editingIndex !== null) {
                setEditDraft(e.target.value);
              } else {
                setInput(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              editingIndex !== null
                ? 'Edit your message...'
                : isInteractive
                ? currentQuestion?.type === 'text'
                  ? 'Type your answer...'
                  : 'Or type your own answer...'
                : 'Ask about your trip...'
            }
            className="flex-1 border-border/50 bg-background text-sm"
            disabled={loading || generating}
          />
          <Button
            size="icon"
            onClick={() => editingIndex !== null ? handleEditSubmit(editingIndex) : handleSend()}
            disabled={
              editingIndex !== null
                ? !editDraft.trim() || loading || generating
                : !input.trim() || loading || generating
            }
            className="h-9 w-9 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
