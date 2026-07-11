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
        };
        Update: {
          name?: string | null;
          country?: string | null;
          currency?: string | null;
          travel_style?: string[] | null;
          interests?: string[] | null;
          accessibility?: string[] | null;
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
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}