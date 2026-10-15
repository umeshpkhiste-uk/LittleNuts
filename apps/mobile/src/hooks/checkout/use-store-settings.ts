import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

export type StoreSettings = {
  delivery_fee_paise: number;
  free_delivery_min_order_paise: number | null;
  tax_rate_bps: number;
  min_order_value_paise: number;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
};

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('store_settings').select('*').single();
      if (error) throw error;
      return data as StoreSettings;
    },
    staleTime: 5 * 60_000,
  });
}
