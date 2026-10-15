import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Supabase project is provisioned in Phase 2. Until then, fall back to placeholder
// values so the app can still boot and render UI during local development.
if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set. ' +
      'Copy .env.example to .env and fill in your Supabase project values before using auth or data features.',
  );
}

// Client-side Supabase instance. Only ever use the anonymous/publishable key here —
// RLS policies (configured in supabase/migrations) are what make this key safe to ship.
// Never import the service-role key into app code.
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabasePublishableKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
