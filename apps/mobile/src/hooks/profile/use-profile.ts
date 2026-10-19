import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export type Profile = {
  id: string;
  full_name: string | null;
  phone_number: string | null;
};

export function useProfile() {
  const userId = useAuthStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}
