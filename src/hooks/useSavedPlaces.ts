import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface SavedPlace {
  id: string;
  user_id: string;
  collection_id: string | null;
  name: string;
  place_type: string;
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
  collections?: { name: string } | null;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export function useSavedPlaces() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const placesQuery = useQuery({
    queryKey: ['saved_places', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_places')
        .select('*, collections(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedPlace[];
    },
    enabled: !!user,
  });

  const collectionsQuery = useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data as Collection[];
    },
    enabled: !!user,
  });

  const savePlace = useMutation({
    mutationFn: async (place: {
      name: string;
      place_type: string;
      collection_id?: string | null;
      lat?: number | null;
      lng?: number | null;
      address?: string;
      city?: string;
      country?: string;
      notes?: string;
      tags?: string[];
      rating?: number;
      ai_recommendation_reason?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('saved_places')
        .insert({ user_id: user.id, ...place })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_places'] });
    },
  });

  const updatePlace = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from('saved_places')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_places'] });
    },
  });

  const deletePlace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_places')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_places'] });
    },
  });

  const createCollection = useMutation({
    mutationFn: async (collection: { name: string; description?: string; color?: string; icon?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('collections')
        .insert({ user_id: user.id, ...collection })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['saved_places'] });
    },
  });

  return {
    places: placesQuery.data ?? [],
    isLoading: placesQuery.isLoading,
    collections: collectionsQuery.data ?? [],
    collectionsLoading: collectionsQuery.isLoading,
    savePlace,
    updatePlace,
    deletePlace,
    createCollection,
    deleteCollection,
  };
}