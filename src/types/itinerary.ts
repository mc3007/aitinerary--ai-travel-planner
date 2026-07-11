export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface Destination {
  name: string;
  lat?: number;
  lng?: number;
  notes?: string;
}

export interface TransportMode {
  id: string;
  label: string;
  icon: string;
  speedLabel: string;
  costPerKm: number; // estimated cost per km in USD
  availableFor: 'short' | 'medium' | 'long' | 'all';
}

export const TRANSPORT_MODES: TransportMode[] = [
  { id: 'walking', label: 'Walking', icon: '🚶', speedLabel: '5 km/h', costPerKm: 0, availableFor: 'short' },
  { id: 'bicycle', label: 'Bicycle', icon: '🚲', speedLabel: '15 km/h', costPerKm: 0.05, availableFor: 'short' },
  { id: 'bus', label: 'Bus', icon: '🚌', speedLabel: '40 km/h', costPerKm: 0.08, availableFor: 'short' },
  { id: 'train', label: 'Train', icon: '🚆', speedLabel: '120 km/h', costPerKm: 0.12, availableFor: 'medium' },
  { id: 'car', label: 'Car Rental', icon: '🚗', speedLabel: '80 km/h', costPerKm: 0.35, availableFor: 'all' },
  { id: 'flight', label: 'Flight', icon: '✈️', speedLabel: '900 km/h', costPerKm: 0.08, availableFor: 'long' },
  { id: 'ferry', label: 'Ferry', icon: '⛴️', speedLabel: '30 km/h', costPerKm: 0.15, availableFor: 'medium' },
  { id: 'rideshare', label: 'Rideshare (Uber)', icon: '🚕', speedLabel: '40 km/h', costPerKm: 0.90, availableFor: 'short' },
];

export interface RouteLeg {
  from: string;
  to: string;
  transportMode: string;
  estimatedDistanceKm: number;
  estimatedCost: number;
  estimatedDuration: string;
}

export interface BudgetBreakdown {
  accommodation: { estimated: number; userBudget?: number };
  dining: { estimated: number; userBudget?: number };
  commute: { estimated: number; userBudget?: number };
  activities: { estimated: number; userBudget?: number };
  miscellaneous: { estimated: number; userBudget?: number };
  totalEstimated: number;
  totalUserBudget?: number;
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  category: 'morning' | 'afternoon' | 'evening';
  estimatedCost: number;
  location: Location;
  tips?: string;
}

export interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
  route?: RouteLeg;
}

export interface ItineraryLocation {
  name: string;
  lat?: number;
  lng?: number;
}

export interface ItineraryResponse {
  destinations: string[];
  locations?: ItineraryLocation[];
  routes: RouteLeg[];
  totalBudget?: number;
  budgetBreakdown?: BudgetBreakdown;
  currency: string;
  days: DayPlan[];
  notes?: string;
}

export interface TripFormData {
  destinations: string[];
  budget?: number;
  currency: string;
  duration: number;
  startDate: string;
  people: number;
  transportPreferences: string[];
  budgetAllocation: {
    accommodation?: number;
    dining?: number;
    commute?: number;
    activities?: number;
    miscellaneous?: number;
  };
  interests: string[];
  foodPreferences: string[];
  children: number;
  pets: boolean;
  accessibility: string[];
  visaNeeded: boolean;
}

export type TravelStyle =
  | 'luxury'
  | 'budget'
  | 'adventure'
  | 'nature'
  | 'beach'
  | 'mountains'
  | 'food'
  | 'history'
  | 'photography'
  | 'shopping'
  | 'nightlife';

export const TRAVEL_STYLES: TravelStyle[] = [
  'luxury',
  'budget',
  'adventure',
  'nature',
  'beach',
  'mountains',
  'food',
  'history',
  'photography',
  'shopping',
  'nightlife',
];

export const INTERESTS = [
  'Art & Culture',
  'Food & Dining',
  'Nature & Outdoors',
  'Shopping',
  'Nightlife',
  'History & Museums',
  'Adventure Sports',
  'Photography',
  'Wellness & Spa',
  'Local Experiences',
  'Architecture',
  'Music & Festivals',
];

export const FOOD_PREFERENCES = [
  'Local Cuisine',
  'Street Food',
  'Fine Dining',
  'Vegetarian',
  'Vegan',
  'Seafood',
  'Halal',
  'Kosher',
  'No Preference',
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];