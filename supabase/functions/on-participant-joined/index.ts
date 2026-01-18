// ABOUTME: Edge Function triggered when a participant joins a study group
// ABOUTME: Sends confirmation to participant and notification to organizer via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface JoinPayload {
  participant_id: string;
  participant_name: string;
  participant_email: string;
  study_group_id: string;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CU Study Groups <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

function formatDateTime(date: Date): { dateStr: string; timeStr: string } {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
  return { dateStr, timeStr };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: JoinPayload = await req.json();

    if (
      !payload.study_group_id ||
      !payload.participant_email ||
      !payload.participant_name
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch study group details
    const { data: studyGroup, error: fetchError } = await supabase
      .from("study_groups")
      .select("*")
      .eq("id", payload.study_group_id)
      .single();

    if (fetchError || !studyGroup) {
      return new Response(JSON.stringify({ error: "Study group not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get participant count
    const { data: countResult } = await supabase.rpc("get_participant_count", {
      p_study_group_id: payload.study_group_id,
    });
    const participantCount = countResult || 0;

    // Format times
    const startTime = new Date(studyGroup.start_time);
    const endTime = new Date(studyGroup.end_time);
    const { dateStr } = formatDateTime(startTime);
    const { timeStr: startTimeStr } = formatDateTime(startTime);
    const { timeStr: endTimeStr } = formatDateTime(endTime);

    // Google Maps link
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      studyGroup.location + " Columbia University New York",
    )}`;

    // Capacity info
    let capacityInfo = `${participantCount} student${participantCount !== 1 ? "s" : ""} joined`;
    if (studyGroup.student_limit) {
      capacityInfo += ` (${studyGroup.student_limit - participantCount} spots remaining)`;
    }

    // Send confirmation to participant
    const participantEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #003366; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">You're In!</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi ${payload.participant_name},</p>
          <p>You've successfully joined a study group!</p>

          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #003366;">
            <h2 style="margin-top: 0; color: #003366;">${studyGroup.subject}</h2>
            ${studyGroup.professor_name ? `<p><strong>Professor:</strong> ${studyGroup.professor_name}</p>` : ""}
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${startTimeStr} – ${endTimeStr}</p>
            <p><strong>Location:</strong> <a href="${mapsLink}" style="color: #003366;">${studyGroup.location}</a></p>
            ${studyGroup.organizer_name ? `<p><strong>Organized by:</strong> ${studyGroup.organizer_name}</p>` : ""}
          </div>

          <p>Good luck with your studying!</p>
          <p>Best,<br>CU Study Groups</p>
        </div>
        <div style="background: #eee; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          Columbia University Study Groups
        </div>
      </div>
    `;

    const participantEmailSent = await sendEmail(
      payload.participant_email,
      `You joined: ${studyGroup.subject} Study Group`,
      participantEmailHtml,
    );

    // Send notification to organizer
    const organizerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #003366; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Student Joined!</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <p>Hi${studyGroup.organizer_name ? ` ${studyGroup.organizer_name}` : ""},</p>
          <p><strong>${payload.participant_name}</strong> just joined your study group!</p>

          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #003366;">
            <h2 style="margin-top: 0; color: #003366;">${studyGroup.subject}</h2>
            ${studyGroup.professor_name ? `<p><strong>Professor:</strong> ${studyGroup.professor_name}</p>` : ""}
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${startTimeStr} – ${endTimeStr}</p>
            <p><strong>Location:</strong> ${studyGroup.location}</p>
            <p><strong>Status:</strong> ${capacityInfo}</p>
          </div>

          <p>You can manage your study groups from the dashboard.</p>
          <p>Best,<br>CU Study Groups</p>
        </div>
        <div style="background: #eee; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          Columbia University Study Groups
        </div>
      </div>
    `;

    const organizerEmailSent = await sendEmail(
      studyGroup.organizer_email,
      `${payload.participant_name} joined your ${studyGroup.subject} study group`,
      organizerEmailHtml,
    );

    return new Response(
      JSON.stringify({
        success: true,
        participantEmailSent,
        organizerEmailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
