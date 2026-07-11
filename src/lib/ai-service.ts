import type { FormState } from '../features/planner/trip-planner-form';
import type { ItineraryResponse } from '../types/itinerary';
import { AI_CONFIG } from '../constants/config';
import { supabase } from './supabase';

export type ProviderName = 'fireworks' | 'natively' | 'auto-fallback' | 'mock';

export interface AiResult {
  itinerary: ItineraryResponse;
  provider: ProviderName;
  model: string;
}

/**
 * Generate an AI itinerary via the Supabase Edge Function.
 * The Edge Function calls Fireworks AI (primary) with Natively AI fallback.
 * API keys are stored in Supabase Secrets Manager — never exposed to the browser.
 */
export async function generateItinerary(
  data: FormState
): Promise<AiResult> {
  const prompt = buildPrompt(data);

  // Get the current user's JWT for authenticated access to the Edge Function
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('You must be logged in to generate an itinerary');
  }

  const response = await fetch(AI_CONFIG.edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt,
      provider: data.aiProvider || 'auto',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error || `Edge Function error (${response.status})`
    );
  }

  const result = await response.json();

  return {
    itinerary: result.itinerary,
    provider: result.provider,
    model: result.model,
  };
}

/**
 * Generate a fallback mock itinerary for demo/development purposes
 */
export function generateMockItinerary(data: FormState): AiResult {
  const days: ItineraryResponse['days'] = [];
  const startDate = data.startDate || new Date().toISOString().split('T')[0];

  const mockActivities = {
    morning: [
      {
        title: 'Breakfast at Local Cafe',
        description:
          'Start your day with authentic local cuisine at a highly-rated neighborhood café.',
        tips: 'Try the local specialty dish - it\'s a favorite among residents.',
      },
      {
        title: 'Visit Historic Temple',
        description:
          'Explore the ancient temple with stunning architecture and peaceful gardens.',
        tips: 'Arrive early to avoid crowds and enjoy the morning light for photos.',
      },
    ],
    afternoon: [
      {
        title: 'Walking Tour of Old Town',
        description:
          'Guided walking tour through charming cobblestone streets with a local expert.',
        tips: 'Wear comfortable shoes - you\'ll be walking for about 2 hours.',
      },
      {
        title: 'Lunch at Food Market',
        description:
          'Experience the vibrant food market with endless local delicacies to sample.',
        tips: 'Go hungry and try at least 3 different stalls.',
      },
    ],
    evening: [
      {
        title: 'Sunset Viewpoint',
        description:
          'Hike up to the famous viewpoint for breathtaking sunset panoramas.',
        tips: 'Bring a jacket - it gets windy at the top.',
      },
      {
        title: 'Dinner at Rooftop Restaurant',
        description:
          'Enjoy a memorable dinner with city lights as your backdrop.',
        tips: 'Book a window table in advance for the best views.',
      },
    ],
  };

  for (let i = 0; i < data.duration; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const activities: ItineraryResponse['days'][0]['activities'] = [];
    const currentDest = data.destinations[i % data.destinations.length] || data.destinations[0];

    Object.entries(mockActivities).forEach(([category, activityList]) => {
      const activity = activityList[i % activityList.length];
      activities.push({
        time:
          category === 'morning'
            ? '08:00'
            : category === 'afternoon'
            ? '13:00'
            : '18:00',
        title: activity.title,
        description: activity.description,
        category: category as 'morning' | 'afternoon' | 'evening',
        estimatedCost: Math.floor(Math.random() * 100) + 20,
        location: {
          name: currentDest,
          lat: 35.6762 + (Math.random() - 0.5) * 0.1,
          lng: 139.6503 + (Math.random() - 0.5) * 0.1,
        },
        tips: activity.tips,
      });
    });

    days.push({
      day: i + 1,
      date: date.toISOString().split('T')[0],
      activities,
    });
  }

  const coordMap: Record<string, { lat: number; lng: number }> = {
    'Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Kyoto': { lat: 35.0116, lng: 135.7681 },
    'Osaka': { lat: 34.6937, lng: 135.5023 },
    'Paris': { lat: 48.8566, lng: 2.3522 },
    'London': { lat: 51.5074, lng: -0.1278 },
    'New York': { lat: 40.7128, lng: -74.006 },
    'Bangkok': { lat: 13.7563, lng: 100.5018 },
    'Bali': { lat: -8.3405, lng: 115.092 },
  };

  const locations = data.destinations.map((name) => {
    const known = coordMap[name];
    return known || { name, lat: 35.6762 + (Math.random() - 0.5) * 0.2, lng: 139.6503 + (Math.random() - 0.5) * 0.2 };
  });

  return {
    itinerary: {
      destinations: data.destinations,
      locations,
      totalBudget: data.budget,
      currency: data.currency || 'USD',
      days,
    },
    provider: 'mock',
    model: 'demo',
  };
}

function buildPrompt(data: FormState): string {
  const destinationsStr = data.destinations.join(' → ');
  const budgetStr = data.budget ? ` with a budget of $${data.budget}` : ' (estimate budget)';
  const transportStr = data.transportPreferences.length > 0
    ? `\nPreferred transport modes: ${data.transportPreferences.join(', ')}`
    : '';
  const allocationStr =
    data.budgetAllocation.accommodation || data.budgetAllocation.dining || data.budgetAllocation.commute
      ? `\nBudget allocation intent: Accommodation: $${data.budgetAllocation.accommodation || 'TBD'}, Dining: $${data.budgetAllocation.dining || 'TBD'}, Commute: $${data.budgetAllocation.commute || 'TBD'}, Activities: $${data.budgetAllocation.activities || 'TBD'}`
      : '';

  return `Plan a ${data.duration}-day trip across these destinations: ${destinationsStr}${budgetStr}.
Start date: ${data.startDate || 'Flexible'}
Number of travelers: ${data.people}${data.children > 0 ? ` (including ${data.children} children)` : ''}
${data.pets ? 'Traveling with pets' : ''}
${data.visaNeeded ? 'Visa required - factor in visa processing time' : ''}
Interests: ${data.interests.join(', ') || 'General sightseeing'}
Food preferences: ${data.foodPreferences.join(', ') || 'No preference'}${transportStr}${allocationStr}

Please provide a realistic, diverse itinerary with actual estimated costs for each activity. Include travel routes between destinations, recommended transport modes with cost estimates, and a mix of iconic attractions and local hidden gems. Structure the itinerary day-by-day with activities, estimated costs, and travel logistics between cities.`;
}

export const PROVIDER_INFO = AI_CONFIG.providers;