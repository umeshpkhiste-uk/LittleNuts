// The mobile app calls these functions directly (not via a browser page),
// so CORS is only relevant for local testing with curl/Postman from a
// browser-like tool. Kept permissive but centralized here rather than
// duplicated per function.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
