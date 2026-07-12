export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          country: string | null;
          currency: string | null;
          travel_style: string[] | null;
          interests: string[] | null;
          accessibility: string[] | null;
          home_airport: string | null;
          languages: string[] | null;
          favorite_countries: string[] | null;
          visited_countries: string[] | null;
          wishlist: string[] | null;
          avoided_activities: string[] | null;
          favorite_cuisine: string | null;
          preferred_walking_distance: number | null;
          preferred_daily_activity_count: number | null;
          preferred_airlines: string[] | null;
          preferred_hotels: string[] | null;
          preferred_accommodation_types: string[] | null;
          pace: string | null;
          food_preferences: string[] | null;
          budget_range: string | null;
          accommodation_preference: string | null;
          transport_preferences: string[] | null;
          companion_preference: string | null;
          travel_goals: string | null;
          onboarding_completed: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          country?: string | null;
          currency?: string | null;
          travel_style?: string[] | null;
          interests?: string[] | null;
          accessibility?: string[] | null;
          home_airport?: string | null;
          languages?: string[] | null;
          favorite_countries?: string[] | null;
          visited_countries?: string[] | null;
          wishlist?: string[] | null;
          avoided_activities?: string[] | null;
          favorite_cuisine?: string | null;
          preferred_walking_distance?: number | null;
          preferred_daily_activity_count?: number | null;
          preferred_airlines?: string[] | null;
          preferred_hotels?: string[] | null;
          preferred_accommodation_types?: string[] | null;
          pace?: string | null;
          food_preferences?: string[] | null;
          budget_range?: string | null;
          accommodation_preference?: string | null;
          transport_preferences?: string[] | null;
          companion_preference?: string | null;
          travel_goals?: string | null;
          onboarding_completed?: boolean | null;
        };
        Update: {
          name?: string | null;
          country?: string | null;
          currency?: string | null;
          travel_style?: string[] | null;
          interests?: string[] | null;
          accessibility?: string[] | null;
          home_airport?: string | null;
          languages?: string[] | null;
          favorite_countries?: string[] | null;
          visited_countries?: string[] | null;
          wishlist?: string[] | null;
          avoided_activities?: string[] | null;
          favorite_cuisine?: string | null;
          preferred_walking_distance?: number | null;
          preferred_daily_activity_count?: number | null;
          preferred_airlines?: string[] | null;
          preferred_hotels?: string[] | null;
          preferred_accommodation_types?: string[] | null;
          pace?: string | null;
          food_preferences?: string[] | null;
          budget_range?: string | null;
          accommodation_preference?: string | null;
          transport_preferences?: string[] | null;
          companion_preference?: string | null;
          travel_goals?: string | null;
          onboarding_completed?: boolean | null;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          destination: string;
          budget: number;
          currency: string;
          duration: number;
          start_date: string | null;
          end_date: string | null;
          interests: string[] | null;
          preferences: Json | null;
          status: string | null;
          itinerary_data: Json | null;
          weather_data: Json | null;
          budget_spent: number | null;
          notes: string | null;
          tags: string[] | null;
          companion_count: number | null;
          transport_mode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination: string;
          budget: number;
          currency?: string;
          duration: number;
          start_date?: string | null;
          end_date?: string | null;
          interests?: string[] | null;
          preferences?: Json | null;
          status?: string | null;
          itinerary_data?: Json | null;
          weather_data?: Json | null;
          budget_spent?: number | null;
          notes?: string | null;
          tags?: string[] | null;
          companion_count?: number | null;
          transport_mode?: string | null;
        };
        Update: {
          destination?: string;
          budget?: number;
          currency?: string;
          duration?: number;
          start_date?: string | null;
          end_date?: string | null;
          interests?: string[] | null;
          preferences?: Json | null;
          status?: string | null;
          itinerary_data?: Json | null;
          weather_data?: Json | null;
          budget_spent?: number | null;
          notes?: string | null;
          tags?: string[] | null;
          companion_count?: number | null;
          transport_mode?: string | null;
        };
      };
      trip_destinations: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          name: string;
          nights: number;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          name: string;
          nights?: number;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          trip_id?: string;
          user_id?: string;
          name?: string;
          nights?: number;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          color: string;
          icon: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          color?: string;
          icon?: string;
          is_default?: boolean;
        };
        Update: {
          name?: string;
          description?: string;
          color?: string;
          icon?: string;
          is_default?: boolean;
        };
      };
      saved_places: {
        Row: {
          id: string;
          user_id: string;
          collection_id: string | null;
          name: string;
          place_type: SavedPlaceType;
          lat: number | null;
          lng: number | null;
          address: string;
          city: string;
          country: string;
          notes: string;
          image_url: string;
          tags: string[] | null;
          rating: number;
          price_level: number;
          website: string;
          phone: string;
          ai_recommendation_reason: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          collection_id?: string | null;
          name: string;
          place_type: SavedPlaceType;
          lat?: number | null;
          lng?: number | null;
          address?: string;
          city?: string;
          country?: string;
          notes?: string;
          image_url?: string;
          tags?: string[] | null;
          rating?: number;
          price_level?: number;
          website?: string;
          phone?: string;
          ai_recommendation_reason?: string;
        };
        Update: {
          name?: string;
          collection_id?: string | null;
          place_type?: SavedPlaceType;
          lat?: number | null;
          lng?: number | null;
          address?: string;
          city?: string;
          country?: string;
          notes?: string;
          image_url?: string;
          tags?: string[] | null;
          rating?: number;
          price_level?: number;
          website?: string;
          phone?: string;
          ai_recommendation_reason?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          data: Json;
          read: boolean;
          actionable: boolean;
          action_url: string;
          action_label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          data?: Json;
          read?: boolean;
          actionable?: boolean;
          action_url?: string;
          action_label?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      ai_memory: {
        Row: {
          id: string;
          user_id: string;
          context_type: AiMemoryContextType;
          key: string;
          value: Json;
          summary: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          context_type: AiMemoryContextType;
          key: string;
          value: Json;
          summary?: string;
        };
        Update: {
          value?: Json;
          summary?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type SavedPlaceType =
  | 'restaurant' | 'cafe' | 'hotel' | 'beach' | 'viewpoint'
  | 'activity' | 'city' | 'country' | 'museum' | 'park'
  | 'shopping' | 'nightlife' | 'other';

export type NotificationType =
  | 'trip_reminder' | 'passport' | 'visa' | 'weather_alert'
  | 'budget_exceeded' | 'restaurant_reservation' | 'ai_suggestion'
  | 'generic' | 'flight_alert' | 'booking_reminder';

export type AiMemoryContextType =
  | 'conversation' | 'preference' | 'trip_history' | 'feedback' | 'goal';