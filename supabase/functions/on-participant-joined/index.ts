// ABOUTME: Edge Function triggered when a participant joins a study group
// ABOUTME: Email notifications disabled - Resend requires domain verification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Email notifications disabled - Resend requires domain verification
// TODO: Re-enable when a verified domain is available

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Return success without sending emails
  return new Response(
    JSON.stringify({
      success: true,
      message: "Email notifications disabled - requires domain verification",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
