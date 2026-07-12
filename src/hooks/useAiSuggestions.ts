import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface AiSuggestion {
  id: string;
  user_id: string;
  trip_id: string | null;
  type: string;
  title: string;
  message: string;
  context: string;
  priority: string;
  dismissed: boolean;
  applied: boolean;
  created_at: string;
}

export function useAiSuggestions(tripId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const suggestionsQuery = useQuery({
    queryKey: ['ai_suggestions', user?.id, tripId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (tripId) {
        query = query.eq('trip_id', tripId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AiSuggestion[];
    },
    enabled: !!user,
  });

  const createSuggestion = useMutation({
    mutationFn: async (suggestion: {
      type: string;
      title: string;
      message: string;
      context?: string;
      priority?: string;
      trip_id?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('ai_suggestions')
        .insert({
          user_id: user.id,
          ...suggestion,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_suggestions'] });
    },
  });

  const dismissSuggestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ dismissed: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_suggestions'] });
    },
  });

  const applySuggestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ applied: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_suggestions'] });
    },
  });

  return {
    suggestions: suggestionsQuery.data ?? [],
    isLoading: suggestionsQuery.isLoading,
    createSuggestion,
    dismissSuggestion,
    applySuggestion,
  };
}