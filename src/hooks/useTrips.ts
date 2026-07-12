import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { ItineraryResponse } from '../types/itinerary';

export function useTrips() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const qcRef = useRef(queryClient);
  qcRef.current = queryClient;

  const tripsQuery = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const invalidateTrips = () => {
    qcRef.current?.invalidateQueries({ queryKey: ['trips'] });
  };

  const saveTrip = useMutation({
    mutationFn: async (trip: {
      destination: string;
      budget: number;
      currency: string;
      duration: number;
      start_date: string | null;
      end_date: string | null;
      interests: string[];
      itinerary_data: ItineraryResponse;
      companion_count?: number;
      preferences?: Record<string, unknown>;
      destinations?: { name: string; nights: number; order_index: number }[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          destination: trip.destination,
          budget: trip.budget,
          currency: trip.currency,
          duration: trip.duration,
          start_date: trip.start_date,
          end_date: trip.end_date,
          interests: trip.interests,
          itinerary_data: trip.itinerary_data as never,
          status: 'active',
          companion_count: trip.companion_count ?? 1,
          preferences: trip.preferences ?? {},
        })
        .select()
        .single();
      if (tripError) throw tripError;

      if (trip.destinations && trip.destinations.length > 0) {
        const { error: destError } = await supabase
          .from('trip_destinations')
          .insert(
            trip.destinations.map((d) => ({
              trip_id: tripData.id,
              user_id: user.id,
              name: d.name,
              nights: d.nights,
              order_index: d.order_index,
            }))
          );
        if (destError) throw destError;
      }

      return tripData;
    },
    onSuccess: invalidateTrips,
  });

  const updateTrip = useMutation({
    mutationFn: async (trip: {
      id: string;
      destination?: string;
      budget?: number;
      currency?: string;
      duration?: number;
      start_date?: string | null;
      end_date?: string | null;
      interests?: string[];
      itinerary_data?: ItineraryResponse;
      status?: string;
      companion_count?: number;
      preferences?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('trips')
        .update({
          ...(trip.destination !== undefined && { destination: trip.destination }),
          ...(trip.budget !== undefined && { budget: trip.budget }),
          ...(trip.currency !== undefined && { currency: trip.currency }),
          ...(trip.duration !== undefined && { duration: trip.duration }),
          ...(trip.start_date !== undefined && { start_date: trip.start_date }),
          ...(trip.end_date !== undefined && { end_date: trip.end_date }),
          ...(trip.interests !== undefined && { interests: trip.interests }),
          ...(trip.itinerary_data !== undefined && { itinerary_data: trip.itinerary_data as never }),
          ...(trip.status !== undefined && { status: trip.status }),
          ...(trip.companion_count !== undefined && { companion_count: trip.companion_count }),
          ...(trip.preferences !== undefined && { preferences: trip.preferences }),
        })
        .eq('id', trip.id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateTrips,
  });

  const deleteTrip = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: invalidateTrips,
  });

  return {
    trips: tripsQuery.data ?? [],
    isLoading: tripsQuery.isLoading,
    error: tripsQuery.error,
    saveTrip,
    updateTrip,
    deleteTrip,
  };
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const qcRef = useRef(queryClient);
  qcRef.current = queryClient;

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsertProfile = useMutation({
    mutationFn: async (profile: {
      name: string;
      country?: string;
      currency?: string;
      travel_style?: string[];
      pace?: string;
      interests?: string[];
      food_preferences?: string[];
      accessibility?: string[];
      home_airport?: string;
      languages?: string[];
      favorite_countries?: string[];
      visited_countries?: string[];
      wishlist?: string[];
      avoided_activities?: string[];
      budget_range?: string;
      accommodation_preference?: string;
      transport_preferences?: string[];
      companion_preference?: string;
      favorite_cuisine?: string;
      preferred_walking_distance?: number;
      preferred_daily_activity_count?: number;
      preferred_airlines?: string[];
      preferred_hotels?: string[];
      travel_goals?: string;
      onboarding_completed?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qcRef.current?.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    upsertProfile,
  };
}

export function useTrip(tripId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const qcRef = useRef(queryClient);
  qcRef.current = queryClient;

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });

  return {
    trip: tripQuery.data,
    isLoading: tripQuery.isLoading,
    error: tripQuery.error,
  };
}
