/**
 * Geocoding service using OpenStreetMap's Nominatim API.
 * Free, no API key required. Rate limit: 1 request/second.
 */

export interface GeoLocation {
  displayName: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  countryCode: string;
  type: string; // 'city' | 'town' | 'village' | 'administrative' | 'attraction' | etc.
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

let lastRequestTime = 0;
const MIN_INTERVAL = 1100; // 1.1s between requests to respect rate limits

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL - (now - lastRequestTime));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestTime = Date.now();
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'AITinerary/1.0',
    },
  });
}

/**
 * Search for locations matching the query string.
 * Returns up to `limit` results.
 */
export async function searchLocations(
  query: string,
  limit: number = 5
): Promise<GeoLocation[]> {
  if (!query.trim() || query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      limit: String(limit),
      addressdetails: '1',
      'accept-language': 'en',
    });

    const response = await rateLimitedFetch(
      `${NOMINATIM_URL}/search?${params.toString()}`
    );

    if (!response.ok) return [];

    const data: Array<{
      display_name: string;
      name: string;
      lat: string;
      lon: string;
      address?: { country?: string; country_code?: string };
      type?: string;
    }> = await response.json();

    return data.map((item) => ({
      displayName: item.display_name,
      name: item.name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      country: item.address?.country ?? '',
      countryCode: (item.address?.country_code ?? '').toUpperCase(),
      type: item.type ?? 'city',
    }));
  } catch {
    return [];
  }
}

/**
 * Reverse geocode coordinates to get a location name.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeoLocation | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'en',
    });

    const response = await rateLimitedFetch(
      `${NOMINATIM_URL}/reverse?${params.toString()}`
    );

    if (!response.ok) return null;

    const data: {
      display_name: string;
      name: string;
      lat: string;
      lon: string;
      address?: { country?: string; country_code?: string };
      type?: string;
    } = await response.json();

    return {
      displayName: data.display_name,
      name: data.name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      country: data.address?.country ?? '',
      countryCode: (data.address?.country_code ?? '').toUpperCase(),
      type: data.type ?? 'city',
    };
  } catch {
    return null;
  }
}