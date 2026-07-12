import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface AiMemory {
  id: string;
  user_id: string;
  context_type: string;
  key: string;
  value: Record<string, unknown>;
  summary: string;
  created_at: string;
  updated_at: string;
}

export function useAiMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const memoriesQuery = useQuery({
    queryKey: ['ai_memory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ai_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as AiMemory[];
    },
    enabled: !!user,
  });

  const setMemory = useMutation({
    mutationFn: async ({
      key,
      context_type,
      value,
      summary,
    }: {
      key: string;
      context_type: string;
      value: Record<string, unknown>;
      summary?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('ai_memory')
        .upsert({
          user_id: user.id,
          key,
          context_type,
          value,
          summary: summary ?? '',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_memory'] });
    },
  });

  const deleteMemory = useMutation({
    mutationFn: async (key: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('ai_memory')
        .delete()
        .eq('user_id', user.id)
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_memory'] });
    },
  });

  const getMemoryValue = (context_type: string, key: string): Record<string, unknown> | null => {
    const memory = memoriesQuery.data?.find(
      (m) => m.context_type === context_type && m.key === key
    );
    return memory?.value ?? null;
  };

  return {
    memories: memoriesQuery.data ?? [],
    isLoading: memoriesQuery.isLoading,
    setMemory,
    deleteMemory,
    getMemoryValue,
  };
}