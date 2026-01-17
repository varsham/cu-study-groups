// ABOUTME: Edge Function to notify organizers when someone joins their study group
// ABOUTME: Triggered when a participant joins a study group

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface ParticipantPayload {
  participant_id: string;
  participant_name: string;
  participant_email: string;
  study_group_id: string;
}

serve(async (req: Request) => {
  try {
    const payload: ParticipantPayload = await req.json();

    if (!payload.study_group_id || !payload.participant_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch study group details including organizer email
    const { data: studyGroup, error: fetchError } = await supabase
      .from("study_groups")
      .select("*")
      .eq("id", payload.study_group_id)
      .single();

    if (fetchError || !studyGroup) {
      return new Response(
        JSON.stringify({ error: "Study group not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get current participant count
    const { data: countResult } = await supabase
      .rpc("get_participant_count", { p_study_group_id: payload.study_group_id });

    const participantCount = countResult || 0;

    // Format times for display
    const startTime = new Date(studyGroup.start_time);
    const endTime = new Date(studyGroup.end_time);
    const dateStr = startTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    });
    const startTimeStr = startTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
    const endTimeStr = endTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });

    // Build capacity info
    let capacityInfo = `${participantCount} student${participantCount !== 1 ? "s" : ""} joined`;
    if (studyGroup.student_limit) {
      capacityInfo += ` (${studyGroup.student_limit - participantCount} spots remaining)`;
    }

    // Build email HTML
    const emailHtml = `
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

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CU Study Groups <noreply@resend.dev>",
        to: [studyGroup.organizer_email],
        subject: `${payload.participant_name} joined your ${studyGroup.subject} study group`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
